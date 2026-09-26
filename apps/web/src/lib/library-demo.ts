/**
 * /library live state machine (docs/12 §6, E12-T04). Drives the *published* IIFE build (`window.AwakeTabWake`,
 * loaded from /library/awaketab-wake.iife.js) — only types come from the workspace package. Four scenarios
 * make all seven states reachable in any browser:
 *
 *   real        this browser's own Screen Wake Lock API
 *   simulated   an injected wake-lock API + document whose "tab hidden" releases the sentinel (docs/12 §6's
 *               synthetic visibilitychange with a stubbed visibilityState) → lost, then re-acquired
 *   denied      an injected API that rejects with NotAllowedError → denied + advice
 *   unsupported no API → unsupported; Request (a click) starts the real inlined video fallback → fallback
 */
import type { IChangeEvent, IWakeLockHandle, IWakeLockOptions, TLockState } from '@awaketab/wake';

export interface IWakeGlobal {
  createWakeLock(options?: IWakeLockOptions): IWakeLockHandle;
}

export type TDemoScenario = 'real' | 'simulated' | 'denied' | 'unsupported';

/** Latency of the simulated API so `requesting` is visible for a moment. */
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

/** Builds the injected API/document for a scenario (`real` injects nothing). */
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

  let lock: IWakeLockHandle | null = null;
  let world: IDemoWorld | null = null;
  let off: (() => void) | null = null;

  const paint = (state: TLockState) => {
    root.dataset.demoState = state;
    if (current) current.textContent = state;
    for (const li of states) {
      const on = li.dataset.state === state;
      if (on) li.dataset.visited = '';
      li.toggleAttribute('aria-current', on);
    }
    if (advice) {
      const code = lock?.advice ?? null;
      advice.textContent = code ? (advice.dataset.label ?? '{code}').replace('{code}', code) : '';
    }
  };

  const setup = (lib: IWakeGlobal, scenario: TDemoScenario) => {
    off?.();
    lock?.destroy();
    if (log) log.textContent = '';
    for (const li of states) delete li.dataset.visited;
    world = demoWorld(scenario, win.navigator.userAgent);
    lock = lib.createWakeLock(world.options);
    off = lock.on('change', (e) => {
      if (log) {
        const item = win.document.createElement('li');
        item.textContent = formatChange(e);
        log.prepend(item);
        while (log.children.length > LOG_MAX) log.lastElementChild?.remove();
      }
      paint(e.to);
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
