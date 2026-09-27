import {
  createSession,
  createStorage,
  planFromPreset,
  planUntil,
  type TPlan,
  type TPresetId,
  type TTheme,
} from '@awaketab/core';
import { createWakeLock } from '@awaketab/wake';
import type { IToolCtx } from './ctx.js';
import type * as TActions from './ui/actions.js';
import { EIGHT_H_MS, parseToolParams } from './params.js';
import { planLabel } from './format.js';
import { setCatalog, t } from './i18n.js';
import { createStore, initialState, type TLogEntry } from './store.js';
import { toast as pushToast } from './ui/toast.js';
import { liveSession, mountView, statusOf } from './ui/view.js';

// Non-urgent chunks (analytics, licence re-check, PWA, suggestions) wait for load + idle so nothing they fetch
// sits on the first-paint path (LCP lab ≤ 1.2 s, docs/00 §11). The wake-lock request never waits for this.
const later = new Promise<void>((resolve) => {
  const go = () => {
    if ('requestIdleCallback' in window)
      requestIdleCallback(() => {
        resolve();
      });
    else setTimeout(resolve, 1);
  };
  if (document.readyState === 'complete') go();
  else addEventListener('load', go, { once: true });
});

function sessionSource(source: string | null): 'web' | 'pwa' | 'pip' | 'ext' | 'embed' {
  if (source === 'pwa' || source === 'pip' || source === 'ext' || source === 'embed') return source;
  return 'web';
}

export function boot(root: HTMLElement): () => void {
  const catalog = root.querySelector('[data-i18n-catalog]')?.textContent;
  if (catalog) setCatalog(JSON.parse(catalog) as Record<string, string>);
  const params = parseToolParams(location, root.dataset);
  const storage = createStorage();
  storage.migrate();
  const settings = storage.settings();
  const selectedPreset: TPresetId = params.eightHour
    ? 'custom'
    : (params.preset ??
      (params.routePreset && params.routePreset !== 'eight' ? params.routePreset : settings.defaultPreset));
  // A tool embedded in a content page never opens its full-screen ambient layer over the article on load;
  // the page's scenario mode (e.g. cook on /for/cooking) takes over when the reader starts a session.
  const embedded = root.classList.contains('at-tool-embed');
  const scene = params.mode ?? settings.ambient.mode;
  const store = createStore({
    ...initialState(settings),
    license: storage.license(),
    storagePersistent: storage.persistent,
    eightHour: params.eightHour,
    selectedPreset,
    ui: { ...initialState(settings).ui, mode: embedded ? 'standard' : scene },
  });
  const track = (event: string, p?: Record<string, string | number | boolean>) => {
    void later
      .then(() => import('./extras.js'))
      .then((mod) => {
        mod.track(store, event, p);
      });
  };

  // The inline boot script already painted the theme (and ?theme=); only night mode forces OLED on top of it.
  if (store.get().ui.mode === 'night') void import('./theme.js').then((m) => m.applyTheme(settings.theme, true));
  const bootSearch = location.search;
  history.replaceState(null, '', `${params.canonicalPath}${location.hash}`);

  if (!storage.persistent)
    pushToast(store, {
      kind: 'info',
      text: t('tool.toast.storage'),
      id: 'storage',
    });

  const lock = createWakeLock();
  const engine = createSession({
    lock,
    storage,
    settings: () => store.get().settings,
    track,
  });

  const syncLock = () => {
    store.set({
      lock: lock.state,
      advice: lock.advice,
      session: engine.session,
    });
  };

  // The session log (held / paused stretches) feeds the Done receipt; ignition plays once per real grant.
  const log = (k: 0 | 1 | null, at = Date.now()) => {
    const next: TLogEntry[] = store.get().ui.log.map((g) => (g[2] ? g : [g[0], g[1], at]));
    if (k !== null) next.push([k, at]);
    store.set({ ui: { log: next } });
  };
  let awaitingReacquire = false;
  const offLock = engine.on('lock', (e) => {
    const ui = store.get().ui;
    store.set({
      lock: e.to,
      advice: e.advice ?? lock.advice,
      session: engine.session,
    });
    if (e.to === 'lost') {
      awaitingReacquire = true;
      log(1);
    } else if (e.to === 'held' || e.to === 'fallback') {
      if (e.from === 'requesting' && !awaitingReacquire && !ui.ask) {
        store.set({ ui: { ok: Date.now(), done: null } });
        root.dataset.ig = '';
        setTimeout(() => delete root.dataset.ig, 1600);
      }
      if (awaitingReacquire)
        pushToast(store, {
          kind: 'success',
          text: t('tool.toast.reacquired'),
          id: 'lock',
        });
      awaitingReacquire = false;
      log(0);
    } else if (e.to !== 'requesting') log(null);
  });
  const offTick = engine.on('tick', (ev) => {
    store.set({
      remainingMs: ev.remainingMs,
      elapsedMs: ev.elapsedMs,
      session: engine.session,
      lock: lock.state,
    });
  });
  const offWarn = engine.on('warning', (w) => {
    if (w.code === 'second_tab') store.set({ ui: { secondTab: true } });
    if (w.code === 'battery_low') {
      pushToast(store, {
        kind: 'warn',
        text: t('tool.toast.batteryLow', {
          percent: Math.round((w.level ?? 0) * 100),
        }),
        id: 'battery',
      });
    }
  });
  const offEnd = engine.on('ended', ({ reason, session }) => {
    syncLock();
    if (reason === 'lost_timeout')
      pushToast(store, {
        kind: 'warn',
        text: t('tool.toast.lostTimeout'),
        id: 'end',
      });
    if (reason === 'error')
      pushToast(store, {
        kind: 'error',
        text: t('tool.toast.error'),
        id: 'end',
        action: { label: t('tool.advice.retry'), onClick: startCurrent },
      });
    const held = store.get().ui.log.reduce((sum, [k, from, to]) => sum + (k ? 0 : (to ?? Date.now()) - from), 0);
    // A stop after a minute awake shows the Done receipt (canvas `ended`); a shorter one goes straight back to Ready.
    void import('./end.js').then((m) => {
      if (reason === 'user' && held >= 60_000) m.finish(ctx, reason, session);
      m.onEnded(ctx, reason, session);
    });
  });

  function currentPlan(): { plan: TPlan; presetId: TPresetId } {
    const s = store.get();
    if (params.routeUntil ?? params.until) {
      return {
        plan: planUntil(params.routeUntil ?? params.until ?? '00:00'),
        presetId: 'until',
      };
    }
    if (s.eightHour) return { plan: { type: 'duration', ms: EIGHT_H_MS }, presetId: 'custom' };
    const id = s.selectedPreset;
    if (id === 'custom')
      return {
        plan: { type: 'duration', ms: s.settings.lastCustomMs },
        presetId: 'custom',
      };
    if (id === 'until') {
      if (s.settings.lastUntilWall) return { plan: planUntil(s.settings.lastUntilWall), presetId: 'until' };
      return { plan: planFromPreset('p30'), presetId: 'p30' };
    }
    return { plan: planFromPreset(id), presetId: id };
  }

  async function startPlan(plan: TPlan, presetId: TPresetId, switched = false): Promise<void> {
    store.set({
      selectedPreset: presetId,
      eightHour: presetId === 'custom' && plan.type === 'duration' && plan.ms === EIGHT_H_MS,
      ui: switched
        ? {}
        : {
            asked: Date.now(),
            ok: 0,
            rcpt: store.get().ui.rcpt,
            log: [],
            done: null,
            ask: null,
            open: '',
          },
    });
    if (embedded && !switched) store.set({ ui: { mode: scene } });
    const state = await engine.start(plan, {
      presetId,
      mode: store.get().ui.mode,
      source: sessionSource(params.source),
    });
    store.set({
      lock: state,
      advice: lock.advice,
      session: engine.session,
      ui: { resumeVisible: false },
    });
    if (switched)
      pushToast(store, {
        kind: 'info',
        text: t('tool.toast.switched', {
          label: planLabel(presetId, store.get().eightHour),
        }),
        id: 'switch',
      });
  }

  let first = true;
  // A start the page made on load keeps Ready until a grant.
  const startCurrent = (auto = false) => {
    const cur = currentPlan();
    store.set({ ui: { rcpt: first, auto } });
    first = false;
    void startPlan(cur.plan, cur.presetId);
  };
  const startPreset = (id: Exclude<TPresetId, 'custom' | 'until'>) => {
    void startPlan(planFromPreset(id), id, !!liveSession(store.get()));
  };
  const stop = () => {
    engine.stop();
    syncLock();
  };
  const toggle = () => {
    const st = statusOf(store.get());
    if (st === 'timesup')
      void import('./end.js').then((m) => {
        m.finishAsk(ctx);
      });
    else if (liveSession(store.get())) stop();
    else startCurrent();
  };

  // The AudioContext must be created inside a user gesture so the end chime can play later (docs/04 §10).
  let audio: AudioContext | undefined;
  const prime = () => {
    if (!audio && store.get().settings.sound.id !== 'none' && 'AudioContext' in window) audio = new AudioContext();
    void audio?.resume();
  };
  root.addEventListener('pointerdown', prime);
  root.addEventListener('keydown', prime);

  const ctx: IToolCtx = {
    root,
    store,
    engine,
    lock,
    storage,
    params,
    startPlan,
    startCurrent,
    stop,
    syncLock,
    track,
    audio: () => audio,
  };

  // Kiosk licence unlocks (docs/09 §7.2): lazy, only when the URL asks for them.
  if (location.hash.startsWith('#lic=') || bootSearch.includes('logo='))
    void import('./embed/kiosk.js').then((m) => m.mountKiosk(ctx, bootSearch));

  const unsubs: Array<() => void> = [mountView(ctx)];
  let ambient = false;
  unsubs.push(
    store.subscribe((s) => {
      if (s.ui.mode === 'standard' || ambient) return;
      ambient = true;
      // The ambient layer's styles are in the on-demand sheet (tool-more.css); link it before the layer opens.
      void import('./ui/more-css.js')
        .then((c) => c.moreCss())
        .then(() => import('./ambient/shell.js'))
        .then((m) => unsubs.push(m.mountAmbient(ctx)));
    }),
  );
  // After load + idle: analytics and the licence check, PWA install and updates, the language suggestion, sponsor.
  void later.then(() => import('./extras.js')).then((m) => unsubs.push(m.mountLate(ctx)));
  const act = (fn: (m: typeof TActions) => void) => {
    void import('./ui/actions.js').then(fn);
  };
  // Toasts, the dock cards (resume, second tab) and every sheet load on first use (docs/05 §13).
  let lazy = 0;
  unsubs.push(
    store.subscribe((s) => {
      const toastsEl = root.querySelector<HTMLElement>('[data-toasts]');
      if (s.ui.toasts.length && toastsEl && !(lazy & 1)) {
        lazy |= 1;
        void import('./ui/toast-view.js').then((m) => unsubs.push(m.mountToasts(toastsEl, store)));
      }
      if ((s.ui.resumeVisible || s.ui.secondTab) && !(lazy & 2)) {
        lazy |= 2;
        void import('./ui/banners.js').then((m) => unsubs.push(m.mountBanners(ctx)));
      }
    }),
  );
  root.addEventListener('click', (e) => {
    const el =
      e.target instanceof Element
        ? e.target.closest<HTMLElement>(
            '[data-open-settings],[data-open-stats],[data-open-share],[data-open-shortcuts],[data-open-pip]',
          )
        : null;
    if (el)
      act((m) => {
        m.open(ctx, el);
      });
  });
  // Single-key shortcuts load with the first key press; Space on the page must not scroll meanwhile.
  let onKey: ((e: KeyboardEvent) => void) | undefined;
  window.addEventListener('keydown', (e) => {
    if (onKey) {
      onKey(e);
      return;
    }
    if (e.key === ' ' && e.target === document.body) e.preventDefault();
    void import('./shortcuts.js').then((m) => {
      (onKey ??= m.keyHandler(ctx, toggle, startPreset))(e);
    });
  });

  // The header theme switch is run by the inline boot script (it also works on pages without the island);
  // it announces each pick so the store's settings, which the island writes back, stay in step.
  document.addEventListener('at-theme', (e) => {
    act((m) => {
      m.cycleTheme(ctx, (e as CustomEvent<TTheme>).detail);
    });
  });

  const resumable = engine.getResumable();
  if (resumable && !params.autostart) {
    store.set({ session: resumable, ui: { resumeVisible: true } });
    track('resume_shown');
  }

  const startNow = () => {
    if (resumable && params.autostart) {
      void engine.resumeSession().then(syncLock);
      return;
    }
    startCurrent(true);
  };

  const wantStart =
    (params.autostart || params.isToolAutostartRoute) && !params.isPip && !(resumable && !params.autostart);
  setTimeout(
    () => {
      root.dataset.settled = '';
    },
    wantStart ? 2000 : 0,
  );
  if (wantStart) {
    if (document.visibilityState === 'hidden') {
      store.set({ deferredAutostart: true });
      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.visibilityState === 'visible' && store.get().deferredAutostart) {
            store.set({ deferredAutostart: false });
            startNow();
          }
        },
        { once: true },
      );
    } else {
      startNow();
    }
  }

  syncLock();
  // Marks the island interactive: it boots after first paint (src/boot/boot.js), and tests wait on this.
  root.dataset.booted = '';
  return () => {
    for (const u of unsubs) u();
    offLock();
    offTick();
    offWarn();
    offEnd();
    engine.destroy();
    lock.destroy();
  };
}

function start(): void {
  const root = document.querySelector<HTMLElement>('#awaketab-tool');
  if (root) boot(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
