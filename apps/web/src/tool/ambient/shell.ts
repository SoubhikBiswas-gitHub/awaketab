import type { TAmbientMode, TFeatureGate } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { remainingOf } from '../format.js';
import { toggleFullscreen } from '../fullscreen.js';
import { t } from '../i18n.js';
import { applyTheme } from '../theme.js';
import { toast } from '../ui/toast.js';
import { mount as clock } from './clock.js';
import { mount as cook } from './cook.js';
import { ambientCss, at, short } from './fmt.js';
import { mount as focus } from './focus.js';
import { activeElapsed, modeAllowed, nextMode, pixelShift, PIXEL_SHIFT_MS, shouldDim } from './logic.js';
import { mount as message } from './message.js';
import { el, everySecond } from './tick.js';

// The floating window ships in this chunk too (tool/pip.ts re-exports it): one lazy chunk, one gzip stream.
export { mirrorAmbient, PIP_ADD_MS, PIP_PRO_SIZE, PIP_SIZE, pipPath, togglePip } from './pip-window.js';

export type TModeMount = (stage: HTMLElement, ctx: IToolCtx) => () => void;

// One lazy chunk for the whole layer (shell + modes): the modes are small and share most of their code, so a
// single gzip stream is ~1.4 KB lighter than one chunk per mode against the 40 KB page budget (docs/00 §11).
const MODES: Partial<Record<TAmbientMode, TModeMount>> = { clock, night: clock, focus, message, cook };
const BAR: readonly TAmbientMode[] = ['clock', 'focus', 'minimal', 'night', 'message', 'cook'];

let warnedGate = false;

const has = (ctx: IToolCtx) => (gate: TFeatureGate) => hasFeature(ctx, gate);

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

  // Top row (Ambient canvas): logo (CSS) · the moved PiP slot (pill, ring, timer) · the session line. The
  // session line is the layer's own short "24:15 left · until 5:28 PM", so every mode reads the same numbers.
  const top = el('div', { class: 'at-am-top' });
  const note = el('span', { class: 'at-am-note' });
  const noteUntil = el('span');
  const info = el('div', { class: 'at-am-info' });
  const kick = el('span', { class: 'at-am-kicker' });
  const until = el('span');
  const ring = el('div', { class: 'at-am-ringtext', 'aria-hidden': 'true' });
  const left = el('span');
  const ringKick = el('span', { class: 'at-am-kicker' });
  const noteLeft = el('span');
  note.append(noteLeft, noteUntil);
  info.append(kick, until);
  ring.append(left, ringKick);
  top.append(note, info, ring);
  stage.before(top);

  const modes = el('div', { class: 'at-am-modes', role: 'group', 'aria-label': t('ambient.modes') });
  modes.append(el('span', { class: 'at-am-ind', 'aria-hidden': 'true' }));
  for (const m of BAR) modes.append(el('button', { type: 'button', 'data-am-mode': m }, t(`ambient.mode.${m}`)));
  bar.prepend(modes);
  modes.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-am-mode]');
    if (b) setMode(ctx, b.dataset.amMode as TAmbientMode);
  });

  const slotHome = document.createComment('pip-slot');
  const toastHome = document.createComment('toasts');
  let current: TAmbientMode = 'standard';
  let unmountMode: (() => void) | null = null;
  let hideTimer = 0;
  let keyboardUser = false;
  let lastInput = Date.now();
  let stopTick: () => void = () => undefined;

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

  // The session line, once a second while the layer is open.
  const paint = (now: number) => {
    const s = store.get();
    const session = s.session;
    const live = !!session && (session.status === 'active' || session.status === 'paused');
    dialog.toggleAttribute('data-live', live);
    if (!live) return;
    const rem = remainingOf(session, now);
    const h24 = s.settings.ambient.clock24h;
    const text = short(rem ?? activeElapsed(session, now));
    const u =
      s.lock === 'lost'
        ? t('ambient.resumes')
        : rem === null
          ? t('ambient.since', { time: at(session.startedAt, session.startedAt, h24) })
          : t('ambient.until', { time: at(now + rem, now, h24) });
    left.textContent = text;
    ring.toggleAttribute('data-long', text.length > 5);
    ringKick.textContent = rem === null ? '' : t('ambient.left');
    kick.textContent = t(rem === null ? 'ambient.awakeFor' : 'ambient.timeLeft');
    until.textContent = u;
    noteLeft.textContent = t(rem === null ? 'tool.timer.elapsed' : 'tool.timer.remaining', { time: text });
    noteUntil.textContent = ` · ${u}`;
  };

  const fsButton = bar.querySelector<HTMLElement>('[data-ambient-fullscreen]');
  const onFs = () => {
    const on = !!document.fullscreenElement;
    fsButton?.setAttribute('aria-pressed', String(on));
    if (fsButton) fsButton.textContent = t(on ? 'ambient.exitFullscreen' : 'tool.header.fullscreen');
  };
  document.addEventListener('fullscreenchange', onFs);

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
  fsButton?.addEventListener('click', () => {
    toggleFullscreen(store);
  });

  const enter = () => {
    slot.before(slotHome);
    top.prepend(slot);
    if (toasts) {
      toasts.before(toastHome);
      dialog.append(toasts);
    }
    dialog.showModal();
    stopTick = everySecond(paint);
  };

  const exit = () => {
    stopTick();
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
    modes.style.setProperty('--i', String(BAR.indexOf(mode)));
    for (const b of modes.querySelectorAll<HTMLElement>('[data-am-mode]')) {
      b.setAttribute('aria-pressed', String(b.dataset.amMode === mode));
    }
    if (title) title.textContent = t('ambient.title', { mode: t(`ambient.mode.${mode}`) });
    lastInput = Date.now();
    setHidden(false);
    armHide();
    unmountMode = MODES[mode]?.(content, ctx) ?? null;
  };

  // Modes open once the stylesheet is in, so the layer never flashes unstyled.
  let unsub: () => void = () => undefined;
  let gone = false;
  void ambientCss().then(() => {
    if (gone) return;
    unsub = store.subscribe((s) => {
      if (s.ui.mode !== current) apply(s.ui.mode);
      // Re-assert the palette when the theme changes underneath night mode.
      if (current === 'night' && document.documentElement.dataset.theme !== 'oled') applyTheme(s.settings.theme, true);
    });
  });

  return () => {
    gone = true;
    unsub();
    window.clearInterval(shiftId);
    window.clearInterval(dimId);
    window.clearTimeout(hideTimer);
    document.removeEventListener('fullscreenchange', onFs);
    unmountMode?.();
    if (current !== 'standard') exit();
  };
}
