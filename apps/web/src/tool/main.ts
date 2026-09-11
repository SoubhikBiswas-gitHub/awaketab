import {
  createSession,
  createStorage,
  planFromPreset,
  planUntil,
  type TPlan,
  type TPresetId,
} from '@awaketab/core';
import { createWakeLock } from '@awaketab/wake';
import { EIGHT_H_MS, EXTEND_AUTO_STOP_MS, parseToolParams } from './params.js';
import { planLabel } from './format.js';
import { setCatalog, t } from './i18n.js';
import { nextMode } from './modes.js';
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
  const store = createStore({
    ...initialState(settings),
    license: storage.license(),
    storagePersistent: storage.persistent,
    eightHour: params.eightHour,
    selectedPreset,
    ui: { ...initialState(settings).ui, mode: params.mode ?? settings.ambient.mode },
  });

  applyTheme(params.theme ?? settings.theme, store.get().ui.mode === 'night');
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
  });
  const offEnd = engine.on('ended', ({ reason }) => {
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
    if (reason === 'completed' && s.settings.endBehaviour === 'prompt_extend' && s.ui.mode !== 'cook') {
      void lock.request();
      openExtend();
    }
    if (reason === 'completed') {
      const meta = storage.meta();
      meta.sessionCount += 1;
      storage.writeMeta(meta);
      const orig = document.title;
      let n = 0;
      const id = window.setInterval(() => {
        document.title = n % 2 === 0 ? t('tool.timer.complete') : orig;
        n += 1;
        if (n > 8) {
          window.clearInterval(id);
          document.title = orig;
        }
      }, 500);
    }
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

  const unsubs: Array<() => void> = [];
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
  const customDlg = root.querySelector<HTMLDialogElement>('[data-dialog="custom"]');
  const untilDlg = root.querySelector<HTMLDialogElement>('[data-dialog="until"]');
  const settingsDlg = root.querySelector<HTMLDialogElement>('[data-dialog="settings"]');
  const shortcutsDlg = root.querySelector<HTMLDialogElement>('[data-dialog="shortcuts"]');
  const shareDlg = root.querySelector<HTMLDialogElement>('[data-dialog="share"]');
  const extendDlg = root.querySelector<HTMLDialogElement>('[data-dialog="extend"]');

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
        openCustom: () => customDlg?.showModal(),
        openUntil: () => untilDlg?.showModal(),
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
          store.set({ ui: { resumeVisible: false } });
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

  const clearDialog = () => {
    store.set({ ui: { dialog: null } });
  };
  customDlg?.addEventListener('close', clearDialog);
  untilDlg?.addEventListener('close', clearDialog);
  settingsDlg?.addEventListener('close', clearDialog);
  shortcutsDlg?.addEventListener('close', clearDialog);
  shareDlg?.addEventListener('close', clearDialog);

  root.querySelector('[data-open-custom]')?.addEventListener('click', () => customDlg?.showModal());
  customDlg?.addEventListener('toggle', () => undefined);

  const bindCustomOnce = (): void => {
    if (!customDlg || customDlg.dataset.bound === '1') return;
    customDlg.dataset.bound = '1';
    void import('./ui/dialogs.js').then(({ bindCustomDialog }) => {
      bindCustomDialog(customDlg, {
        lastCustomMs: store.get().settings.lastCustomMs,
        onStart: (ms) => {
          const next = { ...store.get().settings, lastCustomMs: ms };
          storage.writeSettings(next);
          store.set({ settings: next, selectedPreset: 'custom', eightHour: ms === EIGHT_H_MS });
          void startPlan({ type: 'duration', ms }, 'custom');
        },
      });
    });
  };
  customDlg?.addEventListener('click', bindCustomOnce);
  const origCustom = customDlg?.showModal.bind(customDlg);
  if (customDlg && origCustom) {
    customDlg.showModal = () => {
      store.set({ ui: { dialog: 'custom' } });
      void import('./ui/dialogs.js').then(() => {
        bindCustomOnce();
        origCustom();
      });
    };
  }

  const bindUntilOnce = (): void => {
    if (!untilDlg || untilDlg.dataset.bound === '1') return;
    untilDlg.dataset.bound = '1';
    void import('./ui/dialogs.js').then(({ bindUntilDialog }) => {
      bindUntilDialog(untilDlg, {
        lastWall: store.get().settings.lastUntilWall,
        onStart: (wall) => {
          const next = { ...store.get().settings, lastUntilWall: wall };
          storage.writeSettings(next);
          store.set({ settings: next, selectedPreset: 'until' });
          void startPlan(planUntil(wall), 'until');
        },
      });
    });
  };
  if (untilDlg) {
    const orig = untilDlg.showModal.bind(untilDlg);
    untilDlg.showModal = () => {
      store.set({ ui: { dialog: 'until' } });
      void import('./ui/dialogs.js').then(() => {
        bindUntilOnce();
        orig();
      });
    };
  }

  root.querySelector('[data-open-settings]')?.addEventListener('click', () => {
    if (!settingsDlg) return;
    store.set({ ui: { dialog: 'settings' } });
    void import('./ui/settings.js').then(({ bindSettings }) => {
      bindSettings(settingsDlg, {
        settings: store.get().settings,
        hasBattery: 'getBattery' in navigator,
        onChange: (next) => {
          storage.writeSettings(next);
          store.set({ settings: next });
          applyTheme(next.theme, store.get().ui.mode === 'night');
        },
      });
      settingsDlg.showModal();
    });
  });

  root.querySelector('[data-open-shortcuts]')?.addEventListener('click', () => {
    store.set({ ui: { dialog: 'shortcuts' } });
    shortcutsDlg?.showModal();
  });
  shortcutsDlg?.querySelector('[data-shortcuts-close]')?.addEventListener('click', () => {
    shortcutsDlg.close();
  });

  root.querySelector('[data-open-share]')?.addEventListener('click', () => {
    const url = new URL(sharePath(store), location.origin).toString();
    const input = shareDlg?.querySelector<HTMLInputElement>('[data-share-url]');
    if (input) input.value = url;
    store.set({ ui: { dialog: 'share' } });
    shareDlg?.showModal();
    track(store, 'share_click');
  });
  shareDlg?.querySelector('[data-share-copy]')?.addEventListener('click', () => {
    const input = shareDlg.querySelector<HTMLInputElement>('[data-share-url]');
    if (!input) return;
    void navigator.clipboard.writeText(input.value).then(() => {
      pushToast(store, { kind: 'success', text: t('tool.toast.copied'), id: 'copy' });
    });
  });

  function openExtend(): void {
    if (!extendDlg) return;
    store.set({ ui: { dialog: 'extend' } });
    void import('./ui/notices.js').then(({ bindExtend }) => {
      bindExtend(extendDlg, {
        graceMs: EXTEND_AUTO_STOP_MS,
        onAdd: (ms) => {
          track(store, 'session_extend', { addedMin: ms / 60_000 });
          void engine.extend(ms).then(syncLock);
        },
        onStop: stop,
      });
      if (!extendDlg.open) extendDlg.showModal();
    });
  }

  unsubs.push(
    mountShortcuts(store, {
      toggle,
      startPreset: (id) => {
        if (id) startPreset(id);
      },
      openUntil: () => untilDlg?.showModal(),
      fullscreen: () => {
        if (!document.fullscreenEnabled) {
          pushToast(store, { kind: 'info', text: t('tool.toast.fullscreen'), id: 'fs' });
          return;
        }
        if (document.fullscreenElement) void document.exitFullscreen();
        else {
          void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
            pushToast(store, { kind: 'info', text: t('tool.toast.fullscreen'), id: 'fs' });
          });
        }
      },
      cycleTheme: (theme) => {
        const next = { ...store.get().settings, theme };
        storage.writeSettings(next);
        store.set({ settings: next });
        applyTheme(theme, store.get().ui.mode === 'night');
      },
      cycleMode: () => {
        const hasMessage = store.get().license?.features.includes('ambient.message') ?? false;
        store.set({ ui: { mode: nextMode(store.get().ui.mode, hasMessage) } });
      },
      pip: () => {
        const slot = root.querySelector<HTMLElement>('[data-pip-slot]') ?? root;
        void import('./pip.js').then(({ openPip }) =>
          openPip(slot).then((kind) => {
            if (kind === 'blocked') pushToast(store, { kind: 'info', text: t('tool.toast.pipBlocked'), id: 'pip' });
            else {
              store.set({ ui: { pip: kind } });
              track(store, 'pip_open');
            }
          }),
        );
      },
      stop,
      closeDialog: () => {
        const open = root.querySelector('dialog[open]');
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

  root.querySelector('[data-open-pip]')?.addEventListener('click', () => {
    const slot = root.querySelector<HTMLElement>('[data-pip-slot]') ?? root;
    void import('./pip.js').then(({ openPip }) => {
      void openPip(slot);
    });
  });
  root.querySelector('[data-cycle-theme]')?.addEventListener('click', () => {
    const order = ['auto', 'light', 'dark', 'oled'] as const;
    const cur = store.get().settings.theme;
    const theme = order[(order.indexOf(cur) + 1) % order.length] ?? 'auto';
    const next = { ...store.get().settings, theme };
    storage.writeSettings(next);
    store.set({ settings: next });
    applyTheme(theme, store.get().ui.mode === 'night');
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

function sharePath(store: IStore): string {
  const s = store.get();
  const preset = s.session?.presetId ?? s.selectedPreset;
  if (preset === 'until' && s.session?.plan.type === 'until') {
    return `/until/${s.session.plan.wall.replace(':', '-')}`;
  }
  const map: Partial<Record<TPresetId, string>> = {
    p15: '/15m',
    p30: '/30m',
    p45: '/45m',
    p60: '/1h',
    p120: '/2h',
    p240: '/4h',
    pinf: '/',
  };
  return map[preset] ?? '/';
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
