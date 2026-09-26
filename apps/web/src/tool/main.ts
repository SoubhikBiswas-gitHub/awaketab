import {
  createSession,
  createStorage,
  planFromPreset,
  planUntil,
  type TPlan,
  type TPresetId,
} from '@awaketab/core';
import { createWakeLock } from '@awaketab/wake';
import type { IToolCtx } from './ctx.js';
import type * as TActions from './ui/actions.js';
import { EIGHT_H_MS, parseToolParams } from './params.js';
import { planLabel } from './format.js';
import { setCatalog, t } from './i18n.js';
import { mountShortcuts } from './shortcuts.js';
import { createStore, initialState, type IStore } from './store.js';
import { applyTheme } from './theme.js';
import { mountResume, mountSecondTab, mountStop } from './ui/banners.js';
import { mountChips } from './ui/chips.js';
import { mountPill } from './ui/pill.js';
import { mountRing } from './ui/ring.js';
import { mountTimer } from './ui/timer.js';
import { mountToasts as mountToastRegion, toast as pushToast } from './ui/toast.js';

function track(store: IStore, event: string, params?: Record<string, string | number | boolean>): void {
  void import('./extras.js').then((mod) => {
    mod.track(store, event, params);
  });
}

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

  applyTheme(params.theme ?? settings.theme, store.get().ui.mode === 'night');
  const bootSearch = location.search;
  history.replaceState(null, '', `${params.canonicalPath}${location.hash}`);

  if (!storage.persistent) pushToast(store, { kind: 'info', text: t('tool.toast.storage'), id: 'storage' });

  const lock = createWakeLock();
  const engine = createSession({
    lock,
    storage,
    settings: () => {
      return store.get().settings;
    },
    track: (event, p) => {
      track(store, event, p);
    },
  });

  const syncLock = () => {
    store.set({ lock: lock.state, advice: lock.advice, session: engine.session });
  };

  let awaitingReacquire = false;
  const offLock = engine.on('lock', (e) => {
    store.set({ lock: e.to, advice: e.advice ?? lock.advice, session: engine.session });
    if (e.to === 'lost') {
      awaitingReacquire = true;
      pushToast(store, { kind: 'info', text: t('tool.toast.lost'), id: 'lock' });
    }
    if (e.to === 'held' && awaitingReacquire) {
      awaitingReacquire = false;
      pushToast(store, { kind: 'success', text: t('tool.toast.reacquired'), id: 'lock' });
    }
    if (e.to === 'denied' || e.to === 'unsupported') {
      store.set({ ui: { noticeOpen: true } });
    }
    if (e.to === 'held' || e.to === 'fallback' || e.to === 'idle') {
      store.set({ ui: { noticeOpen: false } });
    }
  });
  const offTick = engine.on('tick', (ev) => {
    store.set({ remainingMs: ev.remainingMs, elapsedMs: ev.elapsedMs, session: engine.session, lock: lock.state });
  });
  const offWarn = engine.on('warning', (w) => {
    if (w.code === 'second_tab') store.set({ ui: { secondTab: true } });
    if (w.code === 'battery_low') {
      pushToast(store, { kind: 'warn', text: t('tool.toast.batteryLow', { percent: Math.round((w.level ?? 0) * 100) }), id: 'battery' });
    }
  });
  const offEnd = engine.on('ended', ({ reason, session }) => {
    syncLock();
    const s = store.get();
    if (reason === 'lost_timeout') pushToast(store, { kind: 'warn', text: t('tool.toast.lostTimeout'), id: 'end' });
    if (reason === 'battery') {
      pushToast(store, {
        kind: 'warn',
        text: t('tool.toast.battery', { percent: s.settings.battery.threshold }),
        id: 'end',
      });
    }
    if (reason === 'error') pushToast(store, { kind: 'error', text: t('tool.toast.error'), id: 'end' });
    void import('./end.js').then((m) => {
      m.onEnded(ctx, reason, session);
    });
  });

  function currentPlan(): { plan: TPlan; presetId: TPresetId } {
    const s = store.get();
    if (params.routeUntil ?? params.until) {
      return { plan: planUntil(params.routeUntil ?? params.until ?? '00:00'), presetId: 'until' };
    }
    if (s.eightHour) return { plan: { type: 'duration', ms: EIGHT_H_MS }, presetId: 'custom' };
    const id = s.selectedPreset;
    if (id === 'custom') return { plan: { type: 'duration', ms: s.settings.lastCustomMs }, presetId: 'custom' };
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
    });
    if (embedded && !switched) store.set({ ui: { mode: scene } });
    const state = await engine.start(plan, {
      presetId,
      mode: store.get().ui.mode,
      source: sessionSource(params.source),
    });
    store.set({ lock: state, advice: lock.advice, session: engine.session, ui: { resumeVisible: false } });
    if (switched) {
      pushToast(store, {
        kind: 'info',
        text: t('tool.toast.switched', { label: planLabel(presetId, store.get().eightHour) }),
        id: 'switch',
      });
    }
  }

  const startPreset = (id: Exclude<TPresetId, 'custom' | 'until'>) => {
    void startPlan(planFromPreset(id), id, engine.session?.status === 'active');
  };
  const stop = () => {
    engine.stop();
    syncLock();
  };
  const toggle = () => {
    const st = engine.session?.status;
    if (st === 'active' || st === 'paused') stop();
    else {
      const cur = currentPlan();
      void startPlan(cur.plan, cur.presetId);
    }
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
    stop: () => {
      stop();
    },
    syncLock,
    track: (event, p) => {
      track(store, event, p);
    },
    audio: () => audio,
  };

  // Kiosk licence unlocks (docs/09 §7.2): lazy, only when the URL asks for them.
  if (location.hash.startsWith('#lic=') || bootSearch.includes('logo=')) void import('./embed/kiosk.js').then((m) => m.mountKiosk(ctx, bootSearch));

  const unsubs: Array<() => void> = [];
  let ambient = false;
  unsubs.push(
    store.subscribe((s) => {
      if (s.ui.mode === 'standard' || ambient) return;
      ambient = true;
      void import('./ambient/shell.js').then((m) => unsubs.push(m.mountAmbient(ctx)));
    }),
  );
  if (root.querySelector('[data-sponsor]')) void import('./sponsor.js').then((m) => m.mountSponsor(ctx).then((u) => unsubs.push(u)));
  void import('./extras.js').then((mod) => {
    unsubs.push(mod.mountExtras(store, storage));
  });
  const ring = root.querySelector<HTMLElement>('[data-ring]');
  const pill = root.querySelector<HTMLElement>('[data-pill]');
  const timer = root.querySelector<HTMLElement>('[data-timer]');
  const chips = root.querySelector<HTMLElement>('[data-chips]');
  const stopBtn = root.querySelector<HTMLButtonElement>('[data-stop]');
  const resume = root.querySelector<HTMLElement>('[data-resume]');
  const toastsEl = root.querySelector<HTMLElement>('[data-toasts]');
  const second = root.querySelector<HTMLElement>('[data-second-tab]');
  const notice = root.querySelector<HTMLElement>('[data-notice]');
  const shortcutsDlg = root.querySelector<HTMLDialogElement>('[data-dialog="shortcuts"]');
  const act = (fn: (m: typeof TActions) => void) => {
    void import('./ui/actions.js').then(fn);
  };
  const openUntil = () => {
    act((m) => {
      m.openUntil(ctx);
    });
  };

  function openNotice(): void {
    if (!notice) return;
    const s = store.get();
    notice.hidden = !s.ui.noticeOpen;
    if (!s.ui.noticeOpen) return;
    void import('./ui/notices.js').then(({ bindNotice }) => {
      bindNotice(notice, {
        advice: s.advice,
        unsupported: s.lock === 'unsupported',
        onRetry: () => {
          const cur = currentPlan();
          void startPlan(cur.plan, cur.presetId);
        },
        onFallback: () => {
          const cur = currentPlan();
          void startPlan(cur.plan, cur.presetId);
        },
      });
    });
  }

  if (ring) unsubs.push(mountRing(ring, store));
  if (pill) {
    unsubs.push(
      mountPill(pill, store, () => {
        store.set({ ui: { noticeOpen: true } });
        openNotice();
      }),
    );
  }
  if (notice) unsubs.push(store.subscribe(() => { openNotice(); }));
  if (timer) unsubs.push(mountTimer(timer, store));
  if (chips) {
    unsubs.push(
      mountChips(chips, store, {
        startPreset,
        openCustom: () => {
          act((m) => {
            m.openCustom(ctx);
          });
        },
        openUntil,
      }),
    );
  }
  if (stopBtn) unsubs.push(mountStop(stopBtn, store, stop));
  if (resume) {
    unsubs.push(
      mountResume(resume, store, {
        accept: () => {
          track(store, 'resume_accepted');
          void engine.resumeSession().then(syncLock);
          store.set({ ui: { resumeVisible: false, mode: store.get().session?.mode ?? store.get().ui.mode } });
        },
        dismiss: () => {
          engine.discardResumable();
          store.set({ ui: { resumeVisible: false }, session: engine.session });
        },
      }),
    );
  }
  if (toastsEl) unsubs.push(mountToastRegion(toastsEl, store));
  if (second) {
    unsubs.push(
      mountSecondTab(second, store, {
        useThis: () => {
          store.set({ ui: { secondTab: false } });
          const cur = currentPlan();
          void startPlan(cur.plan, cur.presetId);
        },
        keep: () => {
          store.set({ ui: { secondTab: false } });
        },
      }),
    );
  }

  function pip(): void {
    void import('./pip.js').then(({ togglePip }) =>
      togglePip(ctx).then((kind) => {
        if (kind === 'blocked') pushToast(store, { kind: 'info', text: t('tool.toast.pipBlocked'), id: 'pip' });
        else if (kind !== 'closed') track(store, 'pip_open');
      }),
    );
  }

  root.querySelector('[data-open-settings]')?.addEventListener('click', () => {
    void import('./ui/settings.js').then((m) => {
      m.openSettings(ctx);
    });
  });
  root.querySelector('[data-open-stats]')?.addEventListener('click', () => {
    void import('./stats/panel.js').then((m) => {
      m.openStats(ctx);
    });
  });

  shortcutsDlg?.addEventListener('close', () => {
    store.set({ ui: { dialog: null } });
  });
  root.querySelector('[data-open-shortcuts]')?.addEventListener('click', () => {
    store.set({ ui: { dialog: 'shortcuts' } });
    shortcutsDlg?.showModal();
  });
  shortcutsDlg?.querySelector('[data-shortcuts-close]')?.addEventListener('click', () => {
    shortcutsDlg.close();
  });

  root.querySelector('[data-open-share]')?.addEventListener('click', () => {
    act((m) => {
      m.openShare(ctx);
    });
  });

  unsubs.push(
    mountShortcuts(store, {
      toggle,
      startPreset: (id) => {
        if (id) startPreset(id);
      },
      openUntil,
      fullscreen: () => {
        act((m) => {
          m.toggleFullscreen(store);
        });
      },
      cycleTheme: (theme) => {
        act((m) => {
          m.cycleTheme(ctx, theme);
        });
      },
      cycleMode: () => {
        void import('./ambient/shell.js').then((m) => {
          m.cycleMode(ctx);
        });
      },
      exitMode: () => {
        store.set({ ui: { mode: 'standard' } });
      },
      pip,
      stop,
      closeDialog: () => {
        const open = [...root.querySelectorAll('dialog[open]:not([data-ambient])')].pop();
        if (open instanceof HTMLDialogElement) open.close();
        store.set({ ui: { dialog: null } });
      },
      toggleHelp: () => {
        if (shortcutsDlg?.open) shortcutsDlg.close();
        else {
          store.set({ ui: { dialog: 'shortcuts' } });
          shortcutsDlg?.showModal();
        }
      },
    }),
  );

  root.querySelector('[data-open-pip]')?.addEventListener('click', pip);
  root.querySelector('[data-cycle-theme]')?.addEventListener('click', () => {
    act((m) => {
      m.cycleTheme(ctx);
    });
  });

  void import('./pwa.js').then(({ mountPwa }) => {
    mountPwa(root, store, () => engine.session?.status, () => {
      track(store, 'pwa_install');
    });
  });

  const resumable = engine.getResumable();
  if (resumable && !params.autostart) {
    store.set({ session: resumable, ui: { resumeVisible: true } });
    track(store, 'resume_shown');
  }

  void import('./ui/lang-suggest.js').then(({ mountLangSuggest }) => {
    mountLangSuggest(root, storage);
  });

  const startNow = () => {
    if (resumable && params.autostart) {
      void engine.resumeSession().then(syncLock);
      return;
    }
    const cur = currentPlan();
    void startPlan(cur.plan, cur.presetId);
  };

  const wantStart = (params.autostart || params.isToolAutostartRoute) && !params.isPip && !(resumable && !params.autostart);
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
