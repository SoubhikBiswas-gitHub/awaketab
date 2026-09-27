import type { ISession, TEndReason } from '@awaketab/core';
import type { IToolCtx } from './ctx.js';
import { planLabel } from './format.js';
import { t } from './i18n.js';
import { EXTEND_AUTO_STOP_MS } from './params.js';
import { chime, notify } from './signal.js';
import type { IDone } from './store.js';
import { maybeShowRating } from './ui/rating.js';
import { toast } from './ui/toast.js';

export const TITLE_FLASH_MS = 1000;
export const TITLE_FLASH_MIN_MS = 3000;
export const RATING_DELAY_MS = 2000;
export const COUNTED_SESSION_S = 5 * 60;

let stopFlash: (() => void) | null = null;
let askTimer = 0;
let askedSession: ISession | null = null;

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
    maybeShowRating(ctx);
  }, RATING_DELAY_MS);
}

export function doneOf(ctx: IToolCtx, reason: string, session: ISession | null, now = Date.now()): IDone {
  const total =
    !session || session.endsAt === null
      ? 0
      : session.plan.type === 'duration'
        ? session.plan.ms
        : session.endsAt - session.startedAt;
  const left = session?.endsAt
    ? Math.max(0, session.endsAt - now + (session.plan.type === 'duration' ? session.pausedMs : 0))
    : 0;
  const log = ctx.store.get().ui.log.map(([k, from, to]) => [k, from, to ?? now] as IDone['log'][number]);
  return { at: now, reason, log, total, left };
}

export function finish(ctx: IToolCtx, reason: string, session: ISession | null): void {
  ctx.store.set({
    ui: { ask: null, open: '', done: doneOf(ctx, reason, session) },
  });
  ctx.root.dataset.off = '';
  window.setTimeout(() => {
    delete ctx.root.dataset.off;
  }, 1800);
}

export function finishAsk(ctx: IToolCtx): void {
  window.clearTimeout(askTimer);
  if (!ctx.store.get().ui.ask) return;
  ctx.stop();
  finish(ctx, 'completed', askedSession);
  maybeRate(ctx);
}

export function extendAsk(ctx: IToolCtx, ms: number): void {
  window.clearTimeout(askTimer);
  ctx.store.set({ ui: { ask: null, done: null } });
  ctx.track('session_extend', { addedMin: ms / 60_000 });
  void ctx.engine.extend(ms).then(ctx.syncLock);
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
  if (reason === 'battery') finish(ctx, reason, session);
  if (reason === 'completed') {
    if (s.settings.endBehaviour === 'prompt_extend' && s.ui.mode !== 'cook') {
      // The time's-up card (canvas status `timesup`): the screen stays awake for the grace period while the user
      // decides; Stop, or the grace running out, releases it.
      askedSession = session;
      ctx.store.set({
        ui: {
          ask: {
            until: Date.now() + EXTEND_AUTO_STOP_MS,
            fb: s.lock === 'fallback',
          },
          open: '',
        },
      });
      void ctx.lock.request().then(ctx.syncLock);
      window.clearTimeout(askTimer);
      askTimer = window.setTimeout(() => {
        finishAsk(ctx);
      }, EXTEND_AUTO_STOP_MS);
    } else {
      toast(ctx.store, {
        kind: 'success',
        text: t('tool.timer.complete'),
        id: 'end',
      });
      finish(ctx, reason, session);
      maybeRate(ctx);
    }
  }
  // After the state change: the tab title has left the countdown, so the flash alternates with the plain title.
  flashTitle(t('end.titleFlash'));
}
