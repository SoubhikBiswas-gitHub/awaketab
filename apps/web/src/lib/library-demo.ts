import type { IChangeEvent, IWakeLockHandle, IWakeLockOptions, TLockState } from '@awaketab/wake';

export interface IWakeGlobal {
  createWakeLock(options?: IWakeLockOptions): IWakeLockHandle;
}

export type TDemoScenario = 'real' | 'simulated' | 'denied' | 'unsupported';

export const DEMO_REQUEST_MS = 350;

class DemoSentinel extends EventTarget {
  released = false;
  readonly type = 'screen';
  release(): Promise<void> {
    if (!this.released) {
      this.released = true;
      this.dispatchEvent(new Event('release'));
    }
    return Promise.resolve();
  }
}

export interface IDemoWorld {
  options: IWakeLockOptions;
  hide(): void;
  show(): void;
}

export function demoWorld(scenario: TDemoScenario, ua: string): IDemoWorld {
  if (scenario === 'real') return { options: {}, hide() {}, show() {} };
  if (scenario === 'unsupported') return { options: { wakeLock: null }, hide() {}, show() {} };
  if (scenario === 'denied') {
    return {
      options: {
        retry: false,
        navigatorLike: {
          userAgent: ua,
          wakeLock: { request: () => Promise.reject(new DOMException('Battery saver is on', 'NotAllowedError')) },
        },
      },
      hide() {},
      show() {},
    };
  }
  let visibility: DocumentVisibilityState = 'visible';
  const doc = new EventTarget() as EventTarget & { visibilityState: DocumentVisibilityState; hidden: boolean };
  Object.defineProperty(doc, 'visibilityState', { get: () => visibility });
  Object.defineProperty(doc, 'hidden', { get: () => visibility === 'hidden' });
  const sentinels: DemoSentinel[] = [];
  const setVisibility = (next: DocumentVisibilityState) => {
    visibility = next;
    if (next === 'hidden') for (const s of sentinels.splice(0)) void s.release();
    doc.dispatchEvent(new Event('visibilitychange'));
  };
  return {
    options: {
      documentLike: doc as unknown as Document,
      navigatorLike: {
        userAgent: ua,
        wakeLock: {
          request: () =>
            new Promise<DemoSentinel>((resolve) => {
              setTimeout(() => {
                const s = new DemoSentinel();
                sentinels.push(s);
                resolve(s);
              }, DEMO_REQUEST_MS);
            }),
        },
      },
    },
    hide: () => {
      setVisibility('hidden');
    },
    show: () => {
      setVisibility('visible');
    },
  };
}

export function formatChange(e: Pick<IChangeEvent, 'from' | 'to' | 'reason' | 'advice'>): string {
  return `${e.from} → ${e.to} (${e.reason}${e.advice ? `, ${e.advice}` : ''})`;
}

const LOG_MAX = 12;

export function bindDemo(root: HTMLElement, win: Window & { AwakeTabWake?: IWakeGlobal }): void {
  const q = (sel: string) => root.querySelector<HTMLElement>(sel);
  const select = root.querySelector<HTMLSelectElement>('[data-demo-scenario]');
  const current = q('[data-demo-current]');
  const advice = q('[data-demo-advice]');
  const log = q('[data-demo-log]');
  const loading = q('[data-demo-loading]');
  const btn = {
    request: root.querySelector<HTMLButtonElement>('[data-demo-request]'),
    release: root.querySelector<HTMLButtonElement>('[data-demo-release]'),
    hide: root.querySelector<HTMLButtonElement>('[data-demo-hide]'),
    show: root.querySelector<HTMLButtonElement>('[data-demo-show]'),
  };
  const states = [...root.querySelectorAll<HTMLElement>('[data-state]')];
  // The status pill (B6): `data-lock` picks its tone and glyph; the label is the state's exact pill string.
  const pill = q('[data-demo-pill]');
  const pillText = q('[data-demo-pill-text]');
  const edges = [...root.querySelectorAll('[data-edge]')];
  const doc = win.document;

  let lock: IWakeLockHandle | null = null;
  let world: IDemoWorld | null = null;
  let off: (() => void) | null = null;

  const paint = (state: TLockState, from?: TLockState) => {
    root.dataset.demoState = state;
    if (current) current.textContent = state;
    for (const li of states) {
      const on = li.dataset.state === state;
      if (on) li.dataset.visited = '';
      if (on) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      if (on && pillText) pillText.textContent = li.dataset.pill ?? state;
    }
    pill?.setAttribute('data-lock', state);
    // The last transition's arrow lights up in the tone of the state it entered.
    for (const edge of edges) edge.toggleAttribute('data-on', from !== undefined && edge.getAttribute('data-edge') === `${from}-${state}`);
    if (advice) {
      const code = lock?.advice ?? null;
      const [before = '', after = ''] = (advice.dataset.label ?? '{code}').split('{code}');
      if (code) {
        const el = doc.createElement('code');
        el.textContent = code;
        advice.replaceChildren(before, el, after);
      } else advice.replaceChildren();
    }
  };

  const setup = (lib: IWakeGlobal, scenario: TDemoScenario) => {
    off?.();
    lock?.destroy();
    if (log) log.textContent = '';
    for (const li of states) delete li.dataset.visited;
    root.dataset.scenario = scenario;
    world = demoWorld(scenario, win.navigator.userAgent);
    lock = lib.createWakeLock(world.options);
    off = lock.on('change', (e) => {
      if (log) {
        // "3:22:01 PM  requesting → held (acquired)": the time, the change, and its reason and advice.
        const item = doc.createElement('li');
        const time = doc.createElement('time');
        time.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
        const line = doc.createElement('span');
        const to = doc.createElement('span');
        to.dataset.lock = e.to;
        to.textContent = e.to;
        const why = doc.createElement('span');
        why.textContent = `(${e.reason}${e.advice ? `, ${e.advice}` : ''})`;
        line.append(`${e.from} → `, to, ' ', why);
        item.append(time, line);
        log.prepend(item);
        while (log.children.length > LOG_MAX) log.lastElementChild?.remove();
      }
      paint(e.to, e.from);
    });
    const simulated = scenario === 'simulated';
    if (btn.hide) btn.hide.disabled = !simulated;
    if (btn.show) btn.show.disabled = !simulated;
    paint(lock.state);
  };

  const start = (lib: IWakeGlobal) => {
    if (loading) loading.hidden = true;
    for (const b of [btn.request, btn.release]) if (b) b.disabled = false;
    setup(lib, (select?.value ?? 'real') as TDemoScenario);
    select?.addEventListener('change', () => {
      setup(lib, select.value as TDemoScenario);
    });
    btn.request?.addEventListener('click', () => void lock?.request());
    btn.release?.addEventListener('click', () => void lock?.release());
    btn.hide?.addEventListener('click', () => world?.hide());
    btn.show?.addEventListener('click', () => world?.show());
  };

  // The IIFE is a deferred classic script; module scripts may run first, so wait for it if needed.
  if (win.AwakeTabWake) {
    start(win.AwakeTabWake);
    return;
  }
  const tag = win.document.querySelector<HTMLScriptElement>('script[data-wake-iife]');
  tag?.addEventListener(
    'load',
    () => {
      if (win.AwakeTabWake) start(win.AwakeTabWake);
    },
    { once: true },
  );
}
