import type { ISession, TEndReason } from '@awaketab/core';
import type { IToolCtx } from './ctx.js';
import { planLabel } from './format.js';
import { t } from './i18n.js';
import { EXTEND_AUTO_STOP_MS } from './params.js';
import { chime, notify } from './signal.js';
import { toast } from './ui/toast.js';

export const TITLE_FLASH_MS = 1000;
export const TITLE_FLASH_MIN_MS = 3000;
export const RATING_DELAY_MS = 2000;
export const COUNTED_SESSION_S = 5 * 60;

let stopFlash: (() => void) | null = null;

export function flashTitle(text: string, doc: Document = document): () => void {
  stopFlash?.();
  const original = doc.title;
  const started = Date.now();
  let on = false;
  const tick = () => {
    const seen = doc.visibilityState === 'visible' && doc.hasFocus();
    if (seen && Date.now() - started >= TITLE_FLASH_MIN_MS) {
      stop();
      return;
    }
    on = !on;
    doc.title = on ? text : original;
  };
  const id = window.setInterval(tick, TITLE_FLASH_MS);
  const stop = () => {
    window.clearInterval(id);
    doc.title = original;
    if (stopFlash === stop) stopFlash = null;
  };
  stopFlash = stop;
  tick();
  return stop;
}

function bumpSessionCount(ctx: IToolCtx, session: ISession): void {
  // awakeSeconds is tick-granular: a session that starts exactly on a second boundary ends one tick short,
  // so allow that one second rather than miss a genuine 5-minute session.
  if (session.awakeSeconds < COUNTED_SESSION_S - 1) return;
  const meta = ctx.storage.meta();
  meta.sessionCount += 1;
  ctx.storage.writeMeta(meta);
}

function maybeRate(ctx: IToolCtx): void {
  window.setTimeout(() => {
    void import('./ui/rating.js').then(({ maybeShowRating }) => {
      maybeShowRating(ctx);
    });
  }, RATING_DELAY_MS);
}

function openExtend(ctx: IToolCtx, onClose: () => void): void {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="extend"]');
  if (!dialog) {
    onClose();
    return;
  }
  ctx.store.set({ ui: { dialog: 'extend' } });
  void import('./ui/notices.js').then(({ bindExtend }) => {
    bindExtend(dialog, {
      graceMs: EXTEND_AUTO_STOP_MS,
      onAdd: (ms) => {
        ctx.track('session_extend', { addedMin: ms / 60_000 });
        void ctx.engine.extend(ms).then(ctx.syncLock);
      },
      onStop: ctx.stop,
    });
    dialog.addEventListener(
      'close',
      () => {
        // Every way out (a button, Esc, the auto-stop) clears the dialog state, or shortcuts stay off and
        // the rating prompt (which waits for ui.dialog === null) never shows.
        ctx.store.set({ ui: { dialog: null } });
        onClose();
      },
      { once: true },
    );
    if (!dialog.open) dialog.showModal();
  });
}

export function onEnded(ctx: IToolCtx, reason: TEndReason, session: ISession): void {
  if (reason === 'user' || reason === 'denied') return;
  const s = ctx.store.get();
  const label = planLabel(session.presetId, s.eightHour);
  if (reason === 'completed') bumpSessionCount(ctx, session);

  chime(ctx, 'end');
  const body =
    reason === 'completed'
      ? t('end.notify.body', { label })
      : reason === 'battery'
        ? t('tool.toast.battery', { percent: s.settings.battery.threshold })
        : t('tool.toast.lostTimeout');
  void notify(ctx, t('end.notify.title'), body, 'at-end');
  flashTitle(t('end.titleFlash'));

  if (reason !== 'completed') return;
  if (s.settings.endBehaviour === 'prompt_extend' && s.ui.mode !== 'cook') {
    // Grace: the screen stays awake while the user decides; Stop (or the auto-stop) releases it.
    void ctx.lock.request().then(ctx.syncLock);
    openExtend(ctx, () => {
      maybeRate(ctx);
    });
    return;
  }
  toast(ctx.store, { kind: 'success', text: t('tool.timer.complete'), id: 'end' });
  maybeRate(ctx);
}
