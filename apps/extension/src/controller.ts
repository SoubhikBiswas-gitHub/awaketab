import {
  createSession,
  createStorage,
  hasFeature,
  planFromPreset,
  planUntil,
  STORAGE_KEYS,
  type ILicenseState,
  type ISession,
  type ISessionEngine,
  type TEndReason,
  type TPlan,
  type TPresetId,
} from '@awaketab/core';
import type { IAlarmInfo, IExtApi, IStorageChange, ITab, TPowerLevel } from './api';
import { format, resolveLocale, type TCatalog, type TLocale, type TVars } from './i18n';
import { licenseState, NO_LICENSE, revalidate } from './license';
import { EXTEND_MS, parseRequest, type IExtState } from './messages';
import { createPowerLock } from './power';
import { activeWindow, SCHEDULE_ALARM_PREFIX, scheduleAlarms, wallOf, type IWindow } from './schedules';
import {
  EXT_KEYS,
  matchSite,
  originPattern,
  presetOf,
  readExt,
  readSettings,
  SYNC_KEYS,
  type IExtSettings,
  type TExtPreset,
} from './settings';
import {
  BADGE_COLORS,
  BADGE_TEXT_COLOR,
  badgeText,
  formatClock,
  isLive,
  levelOf,
  originOf,
  pillKey,
  remainingMs,
  type TOrigin,
} from './status';
import { createChromeStorageAdapter } from './storage';
import { createTelemetry } from './telemetry';

// PROPOSED — add to 00-conventions.md (§13.9): alarm names, cadences and windows of the extension worker.
export const ALARMS = { tick: 'at.tick', end: 'at.end', license: 'at.license' } as const;
/** docs/10 §4: MV3 alarms tick at most every 30 s. */
export const TICK_PERIOD_MIN = 0.5;
/** docs/09 §2.6: re-validation is checked on start-up and hourly. */
export const LICENSE_PERIOD_MIN = 60;
/** The popup's extend prompt stays offered this long after a session completes (web ExtendPrompt: 5 min). */
export const EXTEND_WINDOW_MS = 5 * 60_000;
/** A session that ended while the worker slept is only announced if it ended this recently. */
export const STALE_NOTIFY_MS = 5 * 60_000;
export const SYNC_DEBOUNCE_MS = 2_000;
/** Same tag as the web's end notification (docs/00 §13.8). */
export const NOTIFICATION_ID = 'at-end';

type TFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface IControllerOptions {
  api: IExtApi;
  /** Background string subsets per locale (virtual:at-catalogs-bg in the build). */
  catalogs: Partial<Record<TLocale, TCatalog>>;
  now?: () => number;
  fetchFn?: TFetch;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
  coalesceMs?: number;
}

export interface IController {
  ready(): Promise<void>;
  state(): IExtState;
  onStartup(): Promise<void>;
  onInstalled(reason: string): Promise<void>;
  onAlarm(name: string): Promise<void>;
  onCommand(command: string): Promise<void>;
  onMessage(raw: unknown): Promise<IExtState | null>;
  onStorageChanged(changes: Record<string, IStorageChange>, areaName: string): Promise<void>;
  onNotificationButton(id: string, index: number): Promise<void>;
  onNotificationClicked(id: string): Promise<void>;
  onTabUpdated(tabId: number, change: { status?: string; url?: string }, tab: ITab): Promise<void>;
  onTabRemoved(tabId: number): Promise<void>;
  onPermissionsRemoved(): Promise<void>;
  dispose(): void;
}

export function createController(opts: IControllerOptions): IController {
  const { api } = opts;
  const now = opts.now ?? (() => Date.now());
  const st = opts.setTimeout ?? setTimeout;
  const ct = opts.clearTimeout ?? clearTimeout;
  const fetchFn: TFetch = opts.fetchFn ?? ((input, init) => fetch(input, init));
  const store = createChromeStorageAdapter(api.storage.local, {
    setTimeout: st,
    clearTimeout: ct,
    ...(opts.coalesceMs !== undefined ? { coalesceMs: opts.coalesceMs } : {}),
  });
  const storage = createStorage(store);
  let level: TPowerLevel = 'display';
  const lock = createPowerLock({ power: api.power, level: () => level, now });
  let engine: ISessionEngine | null = null;
  let license: ILicenseState = NO_LICENSE;
  let boot: Promise<void> | null = null;
  let switching = false;
  let syncTimer: ReturnType<typeof setTimeout> | null = null;
  let badge: { text: string; color: string; title: string } = { text: '\u0000', color: '', title: '' };

  const settings = () => readSettings(store.raw(STORAGE_KEYS.settings));
  const ext = (): IExtSettings => readExt(store.raw(EXT_KEYS.ext));
  const locale = () => resolveLocale(settings().locale, api.i18n?.getUILanguage());
  const t = (key: string, vars?: TVars) => format(opts.catalogs[locale()]?.[key] ?? opts.catalogs.en?.[key] ?? key, vars);
  const telemetry = createTelemetry({
    enabled: () => settings().telemetry,
    locale,
    version: api.runtime.getManifest().version,
    path: '/ext',
    fetchFn,
    now,
  });
  const current = (): ISession | null => engine?.session ?? null;

  // Every event handler runs one at a time: a popup click, an alarm and a tab event arriving together
  // must not interleave half-started sessions (a schedule deciding while a user start is in flight).
  let queue: Promise<unknown> = Promise.resolve();
  function serial<T>(task: () => Promise<T>): Promise<T> {
    const next = queue.then(task);
    queue = next.catch(() => undefined);
    return next;
  }

  function ready(): Promise<void> {
    boot ??= start().catch((error: unknown) => {
      boot = null;
      throw error;
    });
    return boot;
  }

  async function start(): Promise<void> {
    await store.load();
    await seedFromSync();
    if (!store.raw(EXT_KEYS.device)) await store.put(EXT_KEYS.device, { v: 1, id: crypto.randomUUID() });
    license = await licenseState(storage.license(), now());
    engine = createSession({
      lock,
      storage,
      channel: null,
      settings,
      now,
      setTimeout: st,
      clearTimeout: ct,
      resumeIndefiniteMs: Number.POSITIVE_INFINITY,
      track: (event, params) => {
        telemetry.track(event, params);
      },
    });
    engine.on('ended', ({ session, reason }) => {
      // Captured synchronously: a preset switch stops the old session inside startPlan().
      if (switching) return;
      void serial(() => onEnded(session, reason));
    });
    engine.on('tick', () => void render());
    engine.on('lock', () => void render());
    await rehydrate();
    await ensureAlarm(ALARMS.license, { periodInMinutes: LICENSE_PERIOD_MIN });
    void serial(maybeRevalidate);
    await syncSchedules();
    await render();
  }

  async function seedFromSync(): Promise<void> {
    if (!api.storage.sync) return;
    try {
      const remote = await api.storage.sync.get([...SYNC_KEYS]);
      for (const key of SYNC_KEYS) {
        if (store.raw(key) === undefined && remote[key] !== undefined) await store.put(key, remote[key]);
      }
    } catch {
      // Sync disabled or unavailable: local storage is authoritative anyway.
    }
  }

  async function rehydrate(): Promise<void> {
    const stored = storage.session();
    if (!isLive(stored)) {
      // Never hold a keep-awake without a live session (a previous worker may have died mid-stop).
      releasePower();
      return;
    }
    level = levelOf(stored, ext().level);
    if (engine?.getResumable()) {
      await engine.resumeSession();
      await ensureSessionAlarms();
      return;
    }
    await finalizeExpired(stored);
  }

  function releasePower() {
    try {
      api.power?.releaseKeepAwake();
    } catch {
      // chrome.power missing or refused: nothing is held.
    }
  }

  /** A finite session whose end passed while the worker slept (or Chrome was closed). */
  async function finalizeExpired(stored: ISession): Promise<void> {
    const endedAt = stored.endsAt ?? now();
    const done: ISession = { ...stored, status: 'completed', endReason: 'completed', endedAt };
    storage.writeSession(done);
    const stats = storage.stats();
    if (Math.floor(done.awakeSeconds / 60) >= 1) stats.sessions += 1;
    stats.lastSessionAt = endedAt;
    storage.writeStats(stats);
    releasePower();
    telemetry.track('session_end', { reason: 'completed', durationMin: Math.round(done.awakeSeconds / 60) });
    await clearSessionAlarms();
    const origin = originOf(done);
    if (now() - endedAt < STALE_NOTIFY_MS && (origin === 'user' || origin === 'command')) await notifyEnd(done);
  }

  async function onEnded(session: ISession, reason: TEndReason): Promise<void> {
    await clearSessionAlarms();
    await render();
    const origin = originOf(session);
    if (reason === 'completed' && (origin === 'user' || origin === 'command')) await notifyEnd(session);
    await evaluateSchedules();
  }

  function sessionLabel(session: ISession): string {
    const id = session.presetId;
    if (id === 'until') return session.plan.type === 'until' ? session.plan.wall : wallOf(session.endsAt ?? now());
    if (id === 'pinf') return t('tool.preset.pinf.sr');
    if (id === 'custom' || session.plan.type !== 'duration') {
      const ms = session.plan.type === 'duration' ? session.plan.ms : 0;
      return t('stats.minutes', { minutes: Math.round(ms / 60_000) });
    }
    return t(`tool.preset.${id}`);
  }

  async function notifyEnd(session: ISession): Promise<void> {
    const s = settings();
    const notifications = api.notifications;
    if (!s.notifications || !notifications) return;
    try {
      if (!(await api.permissions.contains({ permissions: ['notifications'] }))) return;
      await notifications.create(NOTIFICATION_ID, {
        type: 'basic',
        iconUrl: api.runtime.getURL('icon-128.png'),
        title: t('end.notify.title'),
        message: t('end.notify.body', { label: sessionLabel(session) }),
        ...(s.endBehaviour === 'prompt_extend'
          ? { buttons: [{ title: t('tool.extend.add30') }, { title: t('tool.extend.stop') }] }
          : {}),
        // docs/10 §6 "sound": the extension has no audio of its own; `none` silences the system sound.
        silent: s.sound.id === 'none',
        priority: 1,
      });
    } catch {
      // Notifications are best-effort; the popup still offers to extend.
    }
  }

  async function ensureAlarm(name: string, info: IAlarmInfo): Promise<void> {
    const alarms = await api.alarms.getAll();
    if (!alarms.some((alarm) => alarm.name === name)) await api.alarms.create(name, info);
  }

  async function ensureSessionAlarms(): Promise<void> {
    const session = current();
    if (!isLive(session)) return;
    const alarms = await api.alarms.getAll();
    if (!alarms.some((alarm) => alarm.name === ALARMS.tick)) {
      await api.alarms.create(ALARMS.tick, { periodInMinutes: TICK_PERIOD_MIN });
    }
    const rem = remainingMs(session, now());
    if (rem === null) {
      if (alarms.some((alarm) => alarm.name === ALARMS.end)) await api.alarms.clear(ALARMS.end);
      return;
    }
    const when = now() + rem;
    const existing = alarms.find((alarm) => alarm.name === ALARMS.end);
    if (!existing || Math.abs(existing.scheduledTime - when) > 1_000) await api.alarms.create(ALARMS.end, { when });
  }

  async function clearSessionAlarms(): Promise<void> {
    if (isLive(current())) return;
    await api.alarms.clear(ALARMS.tick);
    await api.alarms.clear(ALARMS.end);
  }

  async function startPlan(plan: TPlan, presetId: TPresetId, lvl: TPowerLevel, origin: TOrigin): Promise<void> {
    if (!engine) return;
    if (!lock.supported) {
      // Surface `unsupported` honestly instead of starting a session nothing keeps awake.
      await lock.request();
      await render();
      return;
    }
    if (isLive(engine.session)) {
      switching = true;
      try {
        engine.stop();
      } finally {
        switching = false;
      }
    }
    level = lvl;
    await engine.start(plan, { presetId, mode: 'standard', source: 'ext' });
    if (isLive(engine.session)) engine.updateSession({ modeState: { level: lvl, origin } });
    await ensureSessionAlarms();
    await render();
  }

  function startPreset(presetId: TExtPreset, origin: TOrigin, lvl = ext().level): Promise<void> {
    return startPlan(planFromPreset(presetId), presetId, lvl, origin);
  }

  async function startUntil(wall: string, origin: TOrigin): Promise<void> {
    const s = settings();
    if (s.lastUntilWall !== wall) await store.put(STORAGE_KEYS.settings, { ...s, lastUntilWall: wall });
    await startPlan(planUntil(wall, now()), 'until', ext().level, origin);
  }

  async function stop(): Promise<void> {
    if (!engine) return;
    if (isLive(engine.session)) engine.stop();
    else await lock.release();
    await render();
  }

  async function toggle(origin: TOrigin): Promise<void> {
    if (isLive(current())) await stop();
    else await startPreset(presetOf(settings()), origin);
  }

  async function extend(ms: number): Promise<void> {
    const last = current() ?? storage.session();
    await startPlan({ type: 'duration', ms }, 'custom', levelOf(last, ext().level), 'user');
  }

  function dismiss(): void {
    const session = current();
    if (session) {
      if (!isLive(session)) engine?.updateSession({ modeState: { dismissed: true } });
      return;
    }
    // After a worker restart the engine holds no ended session; mark the stored one.
    const stored = storage.session();
    if (stored && !isLive(stored)) storage.writeSession({ ...stored, modeState: { ...stored.modeState, dismissed: true } });
  }

  async function setLevel(lvl: TPowerLevel): Promise<void> {
    await store.put(EXT_KEYS.ext, { ...ext(), level: lvl });
    const session = current();
    if (isLive(session) && originOf(session) !== 'schedule') {
      level = lvl;
      engine?.updateSession({ modeState: { level: lvl } });
      lock.reassert();
    }
    await render();
  }

  function planFor(win: IWindow): TPlan {
    return { type: 'until', endsAt: win.end, wall: wallOf(win.end) };
  }

  async function evaluateSchedules(): Promise<void> {
    if (!engine) return;
    const session = engine.session;
    const win = hasFeature(license, 'ext.schedules') ? activeWindow(ext().schedules, now()) : null;
    if (isLive(session)) {
      if (originOf(session) !== 'schedule') return; // a session the user started always wins
      if (!win) {
        engine.stop();
        return;
      }
      if (session.endsAt !== win.end || levelOf(session, 'display') !== win.level) {
        await startPlan(planFor(win), 'until', win.level, 'schedule');
      }
      return;
    }
    if (!win) return;
    const last = session ?? storage.session();
    // Stopped by hand inside this window: stay stopped until the window's next occurrence.
    if (last && originOf(last) === 'schedule' && last.endReason === 'user' && last.endsAt !== null && now() < last.endsAt) return;
    await startPlan(planFor(win), 'until', win.level, 'schedule');
  }

  async function syncSchedules(): Promise<void> {
    const list = hasFeature(license, 'ext.schedules') ? ext().schedules : [];
    const wanted = scheduleAlarms(list, now());
    const alarms = await api.alarms.getAll();
    for (const alarm of alarms) {
      if (!alarm.name.startsWith(SCHEDULE_ALARM_PREFIX)) continue;
      if (!wanted.some((w) => w.name === alarm.name && Math.abs(w.when - alarm.scheduledTime) < 1_000)) {
        await api.alarms.clear(alarm.name);
      }
    }
    for (const w of wanted) {
      if (!alarms.some((alarm) => alarm.name === w.name && Math.abs(alarm.scheduledTime - w.when) < 1_000)) {
        await api.alarms.create(w.name, { when: w.when });
      }
    }
    await evaluateSchedules();
  }

  async function checkAutostartStop(): Promise<void> {
    const session = current();
    if (!engine || !isLive(session) || originOf(session) !== 'autostart') return;
    const sites = hasFeature(license, 'ext.autostart') ? ext().autostart.sites : [];
    let open: ITab[] = [];
    if (sites.length) {
      try {
        open = await api.tabs.query({ url: sites.map((site) => originPattern(site.host)) });
      } catch {
        open = [];
      }
    }
    if (!open.some((tab) => matchSite(tab.url, sites))) engine.stop();
  }

  async function maybeRevalidate(): Promise<void> {
    const record = storage.license();
    if (!record) return;
    const result = await revalidate(record, fetchFn, now());
    if (result.status === 'revoked') {
      storage.writeLicense(null);
      license = NO_LICENSE;
      await syncSchedules();
    } else if (result.status === 'ok' && result.record) {
      storage.writeLicense(result.record);
    }
  }

  function queueSyncPush(): void {
    const sync = api.storage.sync;
    if (!sync) return;
    if (syncTimer) ct(syncTimer);
    syncTimer = st(() => {
      syncTimer = null;
      const items: Record<string, unknown> = {};
      for (const key of SYNC_KEYS) {
        // docs/10 §6, docs/08 §3: the licence token never reaches chrome.storage.sync.
        if (key === STORAGE_KEYS.license) continue;
        const value = store.raw(key);
        if (value !== undefined) items[key] = value;
      }
      if (Object.keys(items).length) void sync.set(items).catch(() => undefined);
    }, SYNC_DEBOUNCE_MS);
  }

  async function render(): Promise<void> {
    const session = current();
    const lvl = lock.level ?? level;
    const at = now();
    const text = badgeText(lock.state, lvl, session, at);
    const held = lock.state === 'held' && isLive(session);
    const status = held ? t(lvl === 'system' ? 'ext.pill.system' : 'tool.pill.held') : t(pillKey(lock.state));
    const rem = held ? remainingMs(session, at) : null;
    const left =
      rem === null
        ? ''
        : ` · ${t('tool.timer.remaining', { time: rem >= 60_000 ? t('stats.minutes', { minutes: Math.ceil(rem / 60_000) }) : formatClock(rem) })}`;
    const next = { text, color: BADGE_COLORS[lvl], title: `${t('app.name')} — ${status}${left}` };
    try {
      if (next.text !== badge.text) await api.action.setBadgeText({ text: next.text });
      if (next.text && next.color !== badge.color) {
        await api.action.setBadgeBackgroundColor({ color: next.color });
        await api.action.setBadgeTextColor?.({ color: BADGE_TEXT_COLOR });
      }
      if (next.title !== badge.title) await api.action.setTitle({ title: next.title });
      badge = { text: next.text, color: next.text ? next.color : badge.color, title: next.title };
    } catch {
      // The action API can reject while the browser shuts down; the next render retries.
    }
  }

  function state(): IExtState {
    const session = current() ?? storage.session();
    const s = settings();
    const origin = originOf(session);
    const extendable =
      session?.status === 'completed' &&
      session.endReason === 'completed' &&
      (origin === 'user' || origin === 'command') &&
      s.endBehaviour === 'prompt_extend' &&
      session.endedAt !== null &&
      now() - session.endedAt < EXTEND_WINDOW_MS &&
      session.modeState.dismissed !== true;
    return {
      lock: lock.state,
      advice: lock.advice,
      level: isLive(session) ? levelOf(session, ext().level) : ext().level,
      session,
      origin,
      extend: extendable,
      features: license.valid ? license.features : [],
      now: now(),
    };
  }

  const handlers: Omit<IController, 'ready' | 'state' | 'dispose'> = {
    async onStartup() {
      await ready();
      if (isLive(current())) {
        lock.reassert();
        return;
      }
      // FR-EXT-04: Pro `ext.autostart` keeps the display awake whenever Chrome starts.
      if (hasFeature(license, 'ext.autostart') && ext().autostart.browserStart) await startPreset(presetOf(settings()), 'startup');
    },
    async onInstalled() {
      await ready();
      lock.reassert();
      await render();
    },
    async onAlarm(name) {
      await ready();
      if (name === ALARMS.tick) {
        if (isLive(current())) lock.reassert();
        else await api.alarms.clear(ALARMS.tick);
      } else if (name === ALARMS.license) {
        await maybeRevalidate();
      } else if (name.startsWith(SCHEDULE_ALARM_PREFIX)) {
        await syncSchedules();
      }
      // ALARMS.end needs no branch: waking the worker resumed (or finalised) the session above.
      await render();
    },
    async onCommand(command) {
      if (command !== 'toggle') return;
      await ready();
      await toggle('command');
    },
    async onMessage(raw) {
      const req = parseRequest(raw);
      if (!req) return null;
      await ready();
      switch (req.type) {
        case 'start':
          await startPreset(req.presetId, 'user');
          break;
        case 'until':
          await startUntil(req.wall, 'user');
          break;
        case 'stop':
          await stop();
          break;
        case 'toggle':
          await toggle('user');
          break;
        case 'extend':
          if ((EXTEND_MS as readonly number[]).includes(req.ms)) await extend(req.ms);
          break;
        case 'dismiss':
          dismiss();
          break;
        case 'level':
          await setLevel(req.level);
          break;
        case 'state':
          break;
      }
      return state();
    },
    async onStorageChanged(changes, areaName) {
      await ready();
      if (areaName === 'sync') {
        for (const key of SYNC_KEYS) {
          const change = changes[key];
          if (change?.newValue === undefined) continue;
          if (JSON.stringify(change.newValue) !== JSON.stringify(store.raw(key))) await store.put(key, change.newValue);
        }
        return;
      }
      if (areaName !== 'local') return;
      const changed = store.apply(changes);
      if (!changed.length) return;
      if (changed.includes(STORAGE_KEYS.license)) license = await licenseState(storage.license(), now());
      if (changed.includes(STORAGE_KEYS.license) || changed.includes(EXT_KEYS.ext)) {
        await syncSchedules();
        await checkAutostartStop();
      }
      if (changed.some((key) => SYNC_KEYS.includes(key))) queueSyncPush();
      await render();
    },
    async onNotificationButton(id, index) {
      if (id !== NOTIFICATION_ID) return;
      await ready();
      await api.notifications?.clear(id).catch(() => false);
      if (index === 0 && settings().endBehaviour === 'prompt_extend') await extend(30 * 60_000);
      else dismiss();
    },
    async onNotificationClicked(id) {
      if (id !== NOTIFICATION_ID) return;
      await api.notifications?.clear(id).catch(() => false);
    },
    async onTabUpdated(_tabId, change, tab) {
      // Without host permission for the tab's site, Chrome withholds `tab.url`: nothing to match, no work.
      if (!tab.url || (change.status !== 'complete' && change.url === undefined)) return;
      await ready();
      if (!engine || !hasFeature(license, 'ext.autostart')) return;
      const site = matchSite(tab.url, ext().autostart.sites);
      if (!site) {
        await checkAutostartStop();
        return;
      }
      if (isLive(engine.session)) return;
      const plan: TPlan = site.durationMin ? { type: 'duration', ms: site.durationMin * 60_000 } : { type: 'indefinite' };
      await startPlan(plan, site.durationMin ? 'custom' : 'pinf', ext().level, 'autostart');
    },
    async onTabRemoved() {
      await ready();
      await checkAutostartStop();
    },
    async onPermissionsRemoved() {
      await ready();
      await checkAutostartStop();
    },
  };

  return {
    ready,
    state,
    onStartup: () => serial(() => handlers.onStartup()),
    onInstalled: (reason) => serial(() => handlers.onInstalled(reason)),
    onAlarm: (name) => serial(() => handlers.onAlarm(name)),
    onCommand: (command) => serial(() => handlers.onCommand(command)),
    onMessage: (raw) => serial(() => handlers.onMessage(raw)),
    onStorageChanged: (changes, areaName) => serial(() => handlers.onStorageChanged(changes, areaName)),
    onNotificationButton: (id, index) => serial(() => handlers.onNotificationButton(id, index)),
    onNotificationClicked: (id) => serial(() => handlers.onNotificationClicked(id)),
    // Chrome withholds `tab.url` without host permission: those events are dropped before queueing.
    onTabUpdated: (tabId, change, tab) =>
      !tab.url || (change.status !== 'complete' && change.url === undefined)
        ? Promise.resolve()
        : serial(() => handlers.onTabUpdated(tabId, change, tab)),
    onTabRemoved: (tabId) => serial(() => handlers.onTabRemoved(tabId)),
    onPermissionsRemoved: () => serial(() => handlers.onPermissionsRemoved()),
    dispose() {
      if (syncTimer) ct(syncTimer);
      engine?.destroy();
    },
  };
}
