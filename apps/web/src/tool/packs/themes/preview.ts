import type { IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { openDialog } from '../../ui/dialog.js';
import { dismiss, toast } from '../../ui/toast.js';
import { liveSession } from '../../ui/view.js';
import { uiCss } from './looks.js';

// docs/02 FR-AMBIENT-01: a locked Pro item runs for five minutes, warns at one, then goes back. Nothing is stored.
export const PREVIEW_MS = 5 * 60_000;
export const PREVIEW_WARN_MS = 60_000;

export interface IPreviewOptions {
  // What is previewed ('palette', 'accent', 'pattern', 'preset', 'mode', 'face', 'sound', …) and which one.
  kind: string;
  id: string;
  label: string;
  apply: () => void;
  // Puts the last free choice back (it may return a promise); `back` names it for the "Preview ended" toast.
  revert: () => unknown;
  back?: string;
}

interface IRunning extends IPreviewOptions {
  ctx: IToolCtx;
  endsAt: number;
  warned: boolean;
}

let cur: IRunning | null = null;
let timer = 0;
let chip: HTMLElement | null = null;
const listeners = new Set<() => void>();

const html = document.documentElement;
const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, '0')}`;
};

export function activePreview(): Readonly<{ kind: string; id: string; label: string; endsAt: number }> | null {
  return cur;
}

// Other panels (the Appearance gallery, a sound or face picker) repaint their own preview line on each tick.
export function onPreview(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// "4:59 left" for the running preview, for panels that show it inline.
export function previewLine(): string {
  return cur ? t('settings.preview.chip', { name: cur.label, time: clock(cur.endsAt - Date.now()) }) : '';
}

function openPro(ctx: IToolCtx): void {
  ctx.track('pro_view', { from: 'preview' });
  const sheet = document.querySelector<HTMLDialogElement>('[data-dialog="pro"]');
  if (sheet) openDialog(sheet);
  else location.assign('/pro');
}

// Price and Pro links show only when no session runs: the awake screen never sells (DECISIONS.md, previews).
const selling = (ctx: IToolCtx) => !liveSession(ctx.store.get());

function button(cls: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

function buildChip(p: IRunning): HTMLElement {
  const box = document.createElement('div');
  box.className = 'at-pv';
  box.dataset.preview = '';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', t('settings.preview.group'));
  // It sits in the polite toast region; only its own status line speaks, and only once.
  box.setAttribute('aria-live', 'off');
  const text = document.createElement('span');
  text.className = 'at-pv-text';
  text.setAttribute('aria-hidden', 'true');
  const said = document.createElement('span');
  said.className = 'sr-only';
  said.setAttribute('role', 'status');
  const keep = button('at-pv-keep', t('settings.preview.keep'), () => {
    openPro(p.ctx);
  });
  const min = button('at-icon-button at-pv-min', '', () => {
    box.toggleAttribute('data-min');
    const hidden = box.hasAttribute('data-min');
    min.setAttribute('aria-expanded', String(!hidden));
    min.setAttribute('aria-label', t(hidden ? 'settings.preview.show' : 'settings.preview.hide', { name: p.label }));
  });
  min.setAttribute('aria-expanded', 'true');
  min.setAttribute('aria-label', t('settings.preview.hide', { name: p.label }));
  min.innerHTML = '<span class="at-pv-dot" aria-hidden="true"></span>';
  box.append(min, text, keep, said);
  // Heard once, at the start; the one-minute warning and the end come as toasts.
  requestAnimationFrame(() => {
    said.textContent = t('settings.preview.start', { name: p.label });
  });
  return box;
}

// In the toast region above the dock (it follows the ambient layer), never over the pill or the primary action.
function place(): void {
  if (!chip) return;
  const region = document.querySelector('[data-toasts]');
  const host = region ?? document.body;
  if (chip.parentNode !== host) host.prepend(chip);
  chip.toggleAttribute('data-float', !region);
}

function tick(): void {
  const p = cur;
  if (!p) return;
  const left = p.endsAt - Date.now();
  if (left <= 0) {
    endPreview(true, 'time');
    return;
  }
  if (!p.warned && left <= PREVIEW_WARN_MS) {
    p.warned = true;
    const end = {
      label: t('settings.preview.endNow'),
      onClick: () => {
        endPreview(true, 'user');
      },
    };
    toast(p.ctx.store, {
      kind: 'info',
      id: 'preview',
      text: t('settings.preview.warn', { name: p.label }),
      ...(selling(p.ctx)
        ? {
            action: {
              label: t('settings.preview.getPro'),
              onClick: () => {
                openPro(p.ctx);
              },
            },
            alt: end,
          }
        : { action: end }),
    });
  }
  if (chip) {
    const text = chip.querySelector('.at-pv-text');
    if (text) text.textContent = previewLine();
    (chip.querySelector('.at-pv-keep') as HTMLElement).hidden = !selling(p.ctx);
    if (chip.hasAttribute('data-min'))
      chip.querySelector('.at-pv-min')?.setAttribute('aria-label', t('settings.preview.show', { name: p.label }));
    place();
  }
  for (const fn of listeners) fn();
}

// A swap back runs as a slow cross-fade where the browser can, and at once under reduced motion.
function fade(fn: () => unknown): void {
  if (!('startViewTransition' in document) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void fn();
    return;
  }
  html.dataset.pvFade = '';
  void document
    .startViewTransition(async () => {
      await fn();
    })
    .finished.catch(() => undefined)
    .finally(() => {
      delete html.dataset.pvFade;
    });
}

// Ends the running preview. `revert` false means the caller already painted what comes next (a free pick, or a
// purchase); reason 'time' or 'user' tells the visitor what happened.
export function endPreview(revert = true, reason: 'time' | 'user' | 'quiet' = 'quiet'): void {
  const p = cur;
  if (!p) return;
  cur = null;
  window.clearInterval(timer);
  delete html.dataset.preview;
  chip?.remove();
  chip = null;
  dismiss(p.ctx.store, 'preview');
  if (revert) {
    if (reason === 'quiet') p.revert();
    else fade(p.revert);
  }
  if (reason !== 'quiet') {
    const back = p.back ?? t('settings.preview.saved');
    toast(p.ctx.store, {
      kind: 'info',
      id: 'preview',
      text: t(selling(p.ctx) ? 'settings.preview.ended' : 'settings.preview.endedLive', { name: p.label, back }),
    });
  }
  for (const fn of listeners) fn();
}

// Starts (or restarts, for another item) a five-minute preview. The same item again changes nothing. The wake lock,
// the session and its timer are never touched; a reload ends the preview because nothing was written.
export function startPreview(ctx: IToolCtx, o: IPreviewOptions): { end: () => void } {
  const handle = {
    end: () => {
      endPreview(true, 'user');
    },
  };
  if (cur && cur.kind === o.kind && cur.id === o.id) return handle;
  endPreview(true, 'quiet');
  o.apply();
  const p: IRunning = { ...o, ctx, endsAt: Date.now() + PREVIEW_MS, warned: false };
  cur = p;
  html.dataset.preview = o.kind;
  timer = window.setInterval(tick, 1000);
  void uiCss().then(() => {
    if (cur !== p) return;
    chip = buildChip(p);
    tick();
  });
  for (const fn of listeners) fn();
  return handle;
}
