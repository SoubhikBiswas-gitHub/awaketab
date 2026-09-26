import type { TAmbientMode, TFeatureGate } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { toggleFullscreen } from '../fullscreen.js';
import { t } from '../i18n.js';
import { applyTheme } from '../theme.js';
import { toast } from '../ui/toast.js';
import { modeAllowed, nextMode, pixelShift, PIXEL_SHIFT_MS, shouldDim } from './logic.js';

/** What a mode module gets: its stage element and the shared context. It returns its unmount. */
export type TModeMount = (stage: HTMLElement, ctx: IToolCtx) => () => void;

// Literal import() per mode so Vite emits one lazy chunk each (docs/19 M6 exit: every ambient module separate).
const MODES: Partial<Record<TAmbientMode, () => Promise<{ mount: TModeMount }>>> = {
  clock: () => import('./clock.js'),
  night: () => import('./clock.js'),
  focus: () => import('./focus.js'),
  message: () => import('./message.js'),
  cook: () => import('./cook.js'),
};

let warnedGate = false;

const has = (ctx: IToolCtx) => (gate: TFeatureGate) => hasFeature(ctx, gate);

/** `M`: next mode, skipping gated ones with a one-time toast (docs/05 §3.13). */
export function cycleMode(ctx: IToolCtx): void {
  const { mode, skipped } = nextMode(ctx.store.get().ui.mode, has(ctx));
  if (skipped.includes('message') && !warnedGate) {
    warnedGate = true;
    toast(ctx.store, { kind: 'info', text: t('tool.toast.proMode'), id: 'mode' });
  }
  ctx.store.set({ ui: { mode } });
}

export function setMode(ctx: IToolCtx, mode: TAmbientMode): void {
  ctx.store.set({ ui: { mode } });
}

export function mountAmbient(ctx: IToolCtx): () => void {
  const { root, store } = ctx;
  const dialog = root.querySelector<HTMLDialogElement>('[data-ambient]');
  const stage = dialog?.querySelector<HTMLElement>('[data-ambient-stage]');
  const content = dialog?.querySelector<HTMLElement>('[data-ambient-content]');
  const bar = dialog?.querySelector<HTMLElement>('[data-ambient-controls]');
  const title = dialog?.querySelector<HTMLElement>('[data-ambient-title]');
  const slot = root.querySelector<HTMLElement>('[data-pip-slot]');
  const toasts = root.querySelector<HTMLElement>('[data-toasts]');
  if (!dialog || !stage || !content || !bar || !slot) return () => undefined;

  const slotHome = document.createComment('pip-slot');
  const toastHome = document.createComment('toasts');
  let current: TAmbientMode = 'standard';
  let unmountMode: (() => void) | null = null;
  let loadSeq = 0;
  let hideTimer = 0;
  let keyboardUser = false;
  let lastInput = Date.now();

  const setHidden = (hidden: boolean) => {
    dialog.dataset.controls = hidden ? 'hidden' : 'shown';
    bar.inert = hidden;
    if (store.get().ui.controlsHidden !== hidden) store.set({ ui: { controlsHidden: hidden } });
  };

  const armHide = () => {
    window.clearTimeout(hideTimer);
    if (keyboardUser) return;
    hideTimer = window.setTimeout(() => {
      // Never hide while another dialog (settings, extend) is up; the pill itself never hides (CSS).
      if (store.get().ui.dialog === null && dialog.open) setHidden(true);
    }, store.get().settings.ambient.autoHideMs);
  };

  const onInput = (e: Event) => {
    lastInput = Date.now();
    if (e instanceof KeyboardEvent && e.key === 'Tab') keyboardUser = true;
    delete dialog.dataset.dim;
    setHidden(false);
    armHide();
  };
  for (const type of ['pointermove', 'pointerdown', 'keydown', 'touchstart'] as const) {
    dialog.addEventListener(type, onInput, { passive: true });
  }

  // Pixel shift (±2 px every 60 s) and the dim checks. Shift stays on under reduced motion (it is
  // hardware protection); the global reduced-motion rule makes it instant instead of eased.
  const shiftId = window.setInterval(() => {
    if (!dialog.open) return;
    if (store.get().settings.ambient.pixelShift) {
      const [x, y] = pixelShift();
      stage.style.translate = `${String(x)}px ${String(y)}px`;
    }
  }, PIXEL_SHIFT_MS);
  const dimId = window.setInterval(() => {
    if (!dialog.open) return;
    const oled = document.documentElement.dataset.theme === 'oled';
    if (shouldDim({ mode: current, oled, idleMs: Date.now() - lastInput })) dialog.dataset.dim = '';
  }, 1000);

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    setMode(ctx, 'standard');
  });
  bar.querySelector('[data-ambient-exit]')?.addEventListener('click', () => {
    setMode(ctx, 'standard');
  });
  bar.querySelector('[data-ambient-next]')?.addEventListener('click', () => {
    cycleMode(ctx);
  });
  bar.querySelector('[data-ambient-fullscreen]')?.addEventListener('click', () => {
    toggleFullscreen(store);
  });

  const enter = () => {
    slot.before(slotHome);
    stage.append(slot);
    if (toasts) {
      toasts.before(toastHome);
      dialog.append(toasts);
    }
    dialog.showModal();
  };

  const exit = () => {
    slotHome.replaceWith(slot);
    if (toasts) toastHome.replaceWith(toasts);
    stage.style.translate = '';
    delete dialog.dataset.mode;
    delete dialog.dataset.dim;
    if (dialog.open) dialog.close();
    window.clearTimeout(hideTimer);
    setHidden(false);
  };

  const apply = (mode: TAmbientMode) => {
    const prev = current;
    current = mode;
    unmountMode?.();
    unmountMode = null;
    content.replaceChildren();
    const s = store.get();
    if (mode === 'night' || prev === 'night') applyTheme(s.settings.theme, mode === 'night');
    const session = ctx.engine.session;
    if (session && (session.status === 'active' || session.status === 'paused')) ctx.engine.updateSession({ mode });
    if (mode === 'standard') {
      exit();
      return;
    }
    // A gated mode reached through a link or setting renders its honest Pro card (message.ts), never a
    // broken screen; only the M cycle skips it.
    if (!modeAllowed(mode, has(ctx)) && mode !== 'message') {
      setMode(ctx, 'standard');
      return;
    }
    if (!dialog.open) enter();
    dialog.dataset.mode = mode;
    if (title) title.textContent = t('ambient.title', { mode: t(`ambient.mode.${mode}`) });
    lastInput = Date.now();
    setHidden(false);
    armHide();
    const load = MODES[mode];
    if (!load) return;
    const seq = (loadSeq += 1);
    void load().then(({ mount }) => {
      if (seq !== loadSeq || current !== mode) return;
      unmountMode = mount(content, ctx);
    });
  };

  const unsub = store.subscribe((s) => {
    if (s.ui.mode !== current) apply(s.ui.mode);
    // Re-assert the palette when the theme changes underneath night mode.
    if (current === 'night' && document.documentElement.dataset.theme !== 'oled') applyTheme(s.settings.theme, true);
  });

  return () => {
    unsub();
    window.clearInterval(shiftId);
    window.clearInterval(dimId);
    window.clearTimeout(hideTimer);
    unmountMode?.();
    if (current !== 'standard') exit();
  };
}

