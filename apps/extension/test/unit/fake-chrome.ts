import type {
  IAlarm,
  IAlarmInfo,
  IExtApi,
  IExtEvent,
  INotificationOptions,
  IPermissions,
  IStorageAreaApi,
  IStorageChange,
  ITab,
  TPowerLevel,
} from '../../src/api';

/** Minimal event emitter with Chrome's addListener/removeListener shape. */
export function fakeEvent<TFn extends (...args: never[]) => unknown>(): IExtEvent<TFn> & { fire: (...args: Parameters<TFn>) => void } {
  const listeners = new Set<TFn>();
  return {
    addListener: (cb) => {
      listeners.add(cb);
    },
    removeListener: (cb) => {
      listeners.delete(cb);
    },
    fire: (...args) => {
      for (const cb of listeners) cb(...args);
    },
  };
}

export interface IFakeStorageArea extends IStorageAreaApi {
  data: Map<string, unknown>;
  sets: Array<Record<string, unknown>>;
}

function fakeArea(name: string, onChanged: (changes: Record<string, IStorageChange>, area: string) => void): IFakeStorageArea {
  const data = new Map<string, unknown>();
  const sets: Array<Record<string, unknown>> = [];
  const clone = <T>(v: T): T => (v === undefined ? v : structuredClone(v));
  return {
    data,
    sets,
    get(keys) {
      const out: Record<string, unknown> = {};
      const list = keys === null || keys === undefined ? [...data.keys()] : Array.isArray(keys) ? keys : [keys];
      for (const key of list) if (data.has(key)) out[key] = clone(data.get(key));
      return Promise.resolve(out);
    },
    set(items) {
      sets.push(clone(items));
      const changes: Record<string, IStorageChange> = {};
      for (const [key, value] of Object.entries(items)) {
        changes[key] = { oldValue: clone(data.get(key)), newValue: clone(value) };
        data.set(key, clone(value));
      }
      queueMicrotask(() => {
        onChanged(changes, name);
      });
      return Promise.resolve();
    },
    remove(keys) {
      const changes: Record<string, IStorageChange> = {};
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (!data.has(key)) continue;
        changes[key] = { oldValue: clone(data.get(key)) };
        data.delete(key);
      }
      if (Object.keys(changes).length) {
        queueMicrotask(() => {
          onChanged(changes, name);
        });
      }
      return Promise.resolve();
    },
  };
}

export interface IFakeChrome {
  api: IExtApi;
  local: IFakeStorageArea;
  sync: IFakeStorageArea;
  session: IFakeStorageArea;
  power: Array<{ call: 'request' | 'release'; level?: TPowerLevel }>;
  alarms: Map<string, IAlarm>;
  badge: { text: string; color: string; textColor: string; title: string };
  notifications: Array<{ id: string; options: INotificationOptions }>;
  granted: { permissions: Set<string>; origins: Set<string> };
  tabs: ITab[];
  /** URLs passed to `tabs.create` (the welcome page, chrome://extensions/shortcuts). */
  opened: string[];
  commands: Array<{ name?: string; shortcut?: string }>;
  events: {
    storage: ReturnType<typeof fakeEvent<(changes: Record<string, IStorageChange>, area: string) => void>>;
    alarm: ReturnType<typeof fakeEvent<(alarm: IAlarm) => void>>;
    button: ReturnType<typeof fakeEvent<(id: string, index: number) => void>>;
  };
}

/**
 * An in-memory `chrome.*` for the controller tests: storage areas that fire `onChanged` asynchronously like
 * Chrome, recorded `chrome.power` calls, an alarm table, badge state and permission sets.
 */
export function createFakeChrome(opts: { power?: boolean; notifications?: boolean; uiLanguage?: string } = {}): IFakeChrome {
  const storageEvent = fakeEvent<(changes: Record<string, IStorageChange>, area: string) => void>();
  const alarmEvent = fakeEvent<(alarm: IAlarm) => void>();
  const buttonEvent = fakeEvent<(id: string, index: number) => void>();
  const fire = (changes: Record<string, IStorageChange>, area: string) => {
    storageEvent.fire(changes, area);
  };
  const local = fakeArea('local', fire);
  const sync = fakeArea('sync', fire);
  const session = fakeArea('session', fire);
  const power: IFakeChrome['power'] = [];
  const alarms = new Map<string, IAlarm>();
  const badge = { text: '', color: '', textColor: '', title: '' };
  const notifications: IFakeChrome['notifications'] = [];
  const granted = { permissions: new Set<string>(['power', 'storage', 'alarms']), origins: new Set<string>() };
  const tabs: ITab[] = [];
  const opened: string[] = [];
  const commands = [{ name: 'toggle', shortcut: 'Alt+Shift+A' }];
  const matches = (p: IPermissions) =>
    (p.permissions ?? []).every((x) => granted.permissions.has(x)) && (p.origins ?? []).every((x) => granted.origins.has(x));

  const api: IExtApi = {
    ...(opts.power === false
      ? {}
      : {
          power: {
            requestKeepAwake(level: TPowerLevel) {
              power.push({ call: 'request', level });
            },
            releaseKeepAwake() {
              power.push({ call: 'release' });
            },
          },
        }),
    storage: { local, sync, session, onChanged: storageEvent },
    alarms: {
      create(name: string, info: IAlarmInfo) {
        const scheduledTime = info.when ?? Date.now() + (info.delayInMinutes ?? info.periodInMinutes ?? 0) * 60_000;
        alarms.set(name, {
          name,
          scheduledTime,
          ...(info.periodInMinutes !== undefined ? { periodInMinutes: info.periodInMinutes } : {}),
        });
        return Promise.resolve();
      },
      clear(name: string) {
        return Promise.resolve(alarms.delete(name));
      },
      getAll() {
        return Promise.resolve([...alarms.values()].map((a) => ({ ...a })));
      },
      onAlarm: alarmEvent,
    },
    action: {
      setBadgeText({ text }) {
        badge.text = text;
        return Promise.resolve();
      },
      setBadgeBackgroundColor({ color }) {
        badge.color = color;
        return Promise.resolve();
      },
      setBadgeTextColor({ color }) {
        badge.textColor = color;
        return Promise.resolve();
      },
      setTitle({ title }) {
        badge.title = title;
        return Promise.resolve();
      },
    },
    ...(opts.notifications === false
      ? {}
      : {
          notifications: {
            create(id: string, options: INotificationOptions) {
              notifications.push({ id, options });
              return Promise.resolve(id);
            },
            clear() {
              return Promise.resolve(true);
            },
            onButtonClicked: buttonEvent,
            onClicked: fakeEvent<(id: string) => void>(),
          },
        }),
    permissions: {
      contains: (p) => Promise.resolve(matches(p)),
      request: (p) => {
        for (const x of p.permissions ?? []) granted.permissions.add(x);
        for (const x of p.origins ?? []) granted.origins.add(x);
        return Promise.resolve(true);
      },
      remove: (p) => {
        for (const x of p.permissions ?? []) granted.permissions.delete(x);
        for (const x of p.origins ?? []) granted.origins.delete(x);
        return Promise.resolve(true);
      },
      onAdded: fakeEvent(),
      onRemoved: fakeEvent(),
    },
    runtime: {
      id: 'abcdefghijklmnopabcdefghijklmnop',
      getManifest: () => ({ version: '1.0.0' }),
      getURL: (p: string) => `chrome-extension://abcdefghijklmnopabcdefghijklmnop/${p}`,
      onStartup: fakeEvent(),
      onInstalled: fakeEvent(),
      onMessage: fakeEvent(),
      sendMessage: () => Promise.resolve(null),
      openOptionsPage: () => Promise.resolve(),
    },
    commands: { onCommand: fakeEvent(), getAll: () => Promise.resolve(commands) },
    tabs: {
      query: (q) =>
        Promise.resolve(
          tabs.filter((tab) =>
            (q.url ?? []).some((pattern) => {
              const host = pattern.replace(/^https:\/\//u, '').replace(/\/\*$/u, '');
              if (!granted.origins.has(pattern) || !tab.url) return false;
              const h = new URL(tab.url).hostname;
              return host.startsWith('*.') ? h === host.slice(2) || h.endsWith(host.slice(1)) : h === host;
            }),
          ),
        ),
      create: (p) => {
        opened.push(p.url);
        return Promise.resolve({});
      },
      onUpdated: fakeEvent(),
      onRemoved: fakeEvent(),
    },
    i18n: { getUILanguage: () => opts.uiLanguage ?? 'en-US' },
  };
  return {
    api,
    local,
    sync,
    session,
    power,
    alarms,
    badge,
    notifications,
    granted,
    tabs,
    opened,
    commands,
    events: { storage: storageEvent, alarm: alarmEvent, button: buttonEvent },
  };
}

/** Lets queued microtasks and resolved promises settle. */
export async function flush(times = 10): Promise<void> {
  for (let i = 0; i < times; i += 1) await Promise.resolve();
}

/** The string body of a mocked fetch call. */
export function bodyOf(init: RequestInit | undefined): string {
  return typeof init?.body === 'string' ? init.body : '';
}
