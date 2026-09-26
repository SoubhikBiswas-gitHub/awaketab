import type { IMeta } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { toast } from './toast.js';

export const RATING_MIN_SESSIONS = 5;
export const RATING_REARM_SESSIONS = 10;
export const RATING_TEXT_MAX = 280;

/** docs/05 §3.22: once after the 5th counted session; `later` re-arms 10 sessions on; `never`/`rated` are final. */
export function ratingEligible(meta: Pick<IMeta, 'sessionCount' | 'ratingPrompt'>): boolean {
  const rp = meta.ratingPrompt;
  if (meta.sessionCount < RATING_MIN_SESSIONS) return false;
  if (rp.action === null) return true;
  if (rp.action === 'later') return meta.sessionCount >= (rp.rearmAt ?? Number.POSITIVE_INFINITY);
  return false;
}

function busy(ctx: IToolCtx): boolean {
  const s = ctx.store.get();
  const live = s.session?.status === 'active' || s.session?.status === 'paused';
  return live || s.lock === 'held' || s.ui.dialog !== null || s.ui.mode !== 'standard';
}

function record(ctx: IToolCtx, action: 'rated' | 'later' | 'never', stars?: number): void {
  const meta = ctx.storage.meta();
  meta.ratingPrompt = {
    shownAt: meta.ratingPrompt.shownAt ?? Date.now(),
    action,
    ...(stars ? { stars } : {}),
    ...(action === 'later' ? { rearmAt: meta.sessionCount + RATING_REARM_SESSIONS } : {}),
  };
  ctx.storage.writeMeta(meta);
}

/** Shows the rating dialog when eligible and nothing else is going on; never during an active session. */
export function maybeShowRating(ctx: IToolCtx): boolean {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="rating"]');
  const form = dialog?.querySelector('form');
  if (!dialog || !form || dialog.open) return false;
  const meta = ctx.storage.meta();
  if (!ratingEligible(meta) || busy(ctx)) return false;

  meta.ratingPrompt = { ...meta.ratingPrompt, shownAt: Date.now() };
  ctx.storage.writeMeta(meta);
  form.reset();
  const error = dialog.querySelector<HTMLElement>('[data-rating-error]');
  if (error) error.textContent = '';
  const controller = new AbortController();
  const { signal } = controller;
  const close = () => {
    dialog.close();
  };

  form.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const stars = Number(data.get('stars'));
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        if (error) error.textContent = t('rating.error.stars');
        return;
      }
      const raw = data.get('text');
      const text = typeof raw === 'string' ? raw.slice(0, RATING_TEXT_MAX) : '';
      record(ctx, 'rated', stars);
      ctx.track('rating_prompt', { action: 'rate', stars });
      ctx.track('rating_submitted', { stars });
      close();
      void fetch('/api/rating', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stars, text, locale: document.documentElement.lang || 'en', ver: 1 }),
        keepalive: true,
      })
        .then((res) => {
          toast(ctx.store, {
            kind: res.ok ? 'success' : 'warn',
            text: t(res.ok ? 'rating.thanks' : 'rating.failed'),
            id: 'rating',
          });
        })
        .catch(() => {
          toast(ctx.store, { kind: 'warn', text: t('rating.failed'), id: 'rating' });
        });
    },
    { signal },
  );
  dialog.querySelector('[data-rating-later]')?.addEventListener(
    'click',
    () => {
      record(ctx, 'later');
      ctx.track('rating_prompt', { action: 'later' });
      close();
    },
    { signal },
  );
  dialog.querySelector('[data-rating-never]')?.addEventListener(
    'click',
    () => {
      record(ctx, 'never');
      ctx.track('rating_prompt', { action: 'never' });
      close();
    },
    { signal },
  );
  dialog.addEventListener(
    'close',
    () => {
      controller.abort();
      // Dismissed with Esc: treat as "later" so the prompt is never shown twice in a row.
      if (ctx.storage.meta().ratingPrompt.action === null) record(ctx, 'later');
      ctx.store.set({ ui: { dialog: null } });
    },
    { signal },
  );
  ctx.store.set({ ui: { dialog: 'rating' } });
  dialog.showModal();
  return true;
}
