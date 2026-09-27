import { DEFAULT_META, type IMeta } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  maybeShowRating,
  RATING_MIN_SESSIONS,
  RATING_REARM_SESSIONS,
  ratingEligible,
} from '../../src/tool/ui/rating.js';
import { dialogSettled, makeCtx } from './ctx-helper.js';

// The prompt opens once tool-more.css has loaded (ui/dialog.ts); happy-dom never loads the stylesheet.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));

// Mirrors the rating dialog in src/components/ToolPanel.astro.
const RATING_HTML = `
  <dialog data-dialog="rating" aria-labelledby="rating-title">
    <h2 id="rating-title">Is AwakeTab doing its job?</h2>
    <form class="at-fields" data-rating-form>
      <fieldset class="at-stars">
        <legend>Your rating</legend>
        ${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="stars" value="${String(n)}" /><span aria-hidden="true">★</span></label>`).join('')}
      </fieldset>
      <label>Anything we should fix? (optional)
        <textarea class="at-input at-textarea" name="text" maxlength="280" rows="3"></textarea>
      </label>
      <p class="at-error" data-rating-error role="alert"></p>
      <div class="at-banner-actions">
        <button type="submit">Send</button>
        <button type="button" data-rating-later>Maybe later</button>
        <button type="button" data-rating-never>Don't ask again</button>
      </div>
    </form>
  </dialog>`;

type TPrompt = IMeta['ratingPrompt'];
const meta = (sessionCount: number, ratingPrompt: Partial<TPrompt> = {}) => ({
  sessionCount,
  ratingPrompt: { shownAt: null, action: null, ...ratingPrompt } as TPrompt,
});

describe('ratingEligible (docs/05 §3.22)', () => {
  it.each([
    ['fewer than 5 sessions', meta(RATING_MIN_SESSIONS - 1), false],
    ['5 sessions, never asked', meta(RATING_MIN_SESSIONS), true],
    ['40 sessions, never asked', meta(40), true],
    ['later, before rearm', meta(12, { action: 'later', rearmAt: 15 }), false],
    ['later, at rearm', meta(15, { action: 'later', rearmAt: 15 }), true],
    ['later, without rearmAt', meta(99, { action: 'later' }), false],
    ['rated', meta(99, { action: 'rated', stars: 5 }), false],
    ['never', meta(99, { action: 'never' }), false],
  ])('%s → %s', (_name, m, expected) => {
    expect(ratingEligible(m)).toBe(expected);
  });
});

function setup(sessionCount = RATING_MIN_SESSIONS) {
  const env = makeCtx({ html: RATING_HTML });
  env.storage.writeMeta({ ...structuredClone(DEFAULT_META), sessionCount });
  const dialog = env.root.querySelector<HTMLDialogElement>('[data-dialog="rating"]') as HTMLDialogElement;
  const form = dialog.querySelector('form') as HTMLFormElement;
  const submit = () => form.dispatchEvent(new Event('submit', { cancelable: true }));
  return { ...env, dialog, form, submit };
}

const show = async (ctx: Parameters<typeof maybeShowRating>[0]) => {
  const shown = maybeShowRating(ctx);
  await dialogSettled();
  return shown;
};

const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

describe('maybeShowRating', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchSpy = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('fetch', fetchSpy);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing before the 5th counted session', async () => {
    const { ctx, dialog } = setup(4);
    expect(await show(ctx)).toBe(false);
    expect(dialog.open).toBe(false);
  });

  it('shows once and records shownAt', async () => {
    const { ctx, dialog, storage } = setup();
    expect(await show(ctx)).toBe(true);
    expect(dialog.open).toBe(true);
    expect(storage.meta().ratingPrompt.shownAt).toEqual(expect.any(Number));
    // Already open: not shown on top of itself.
    expect(await show(ctx)).toBe(false);
  });

  it('never while a session is active or another dialog is open', async () => {
    const { ctx, dialog, store } = setup();
    await ctx.startPlan({ type: 'indefinite' }, 'pinf');
    expect(store.get().session?.status).toBe('active');
    expect(await show(ctx)).toBe(false);
    expect(dialog.open).toBe(false);

    ctx.stop();
    await flush();
    store.set({ lock: 'idle' });
    // Another sheet is up (its open <dialog> is the truth): the prompt waits.
    const other = document.createElement('dialog');
    other.className = 'at-dialog';
    document.body.append(other);
    other.show();
    expect(await show(ctx)).toBe(false);
    other.close();
    store.set({ ui: { mode: 'clock' } });
    expect(await show(ctx)).toBe(false);
    store.set({ ui: { mode: 'standard' } });
    expect(await show(ctx)).toBe(true);
  });

  it("'later' re-arms 10 sessions on and is not shown again before that", async () => {
    const { ctx, dialog, storage } = setup(7);
    expect(await show(ctx)).toBe(true);
    dialog.querySelector<HTMLButtonElement>('[data-rating-later]')?.click();
    expect(dialog.open).toBe(false);
    expect(storage.meta().ratingPrompt).toMatchObject({ action: 'later', rearmAt: 7 + RATING_REARM_SESSIONS });
    expect(ctx.track).toHaveBeenCalledWith('rating_prompt', { action: 'later' });
    expect(await show(ctx)).toBe(false);

    storage.writeMeta({ ...storage.meta(), sessionCount: 7 + RATING_REARM_SESSIONS });
    expect(await show(ctx)).toBe(true);
  });

  it("'never' is final", async () => {
    const { ctx, dialog, storage } = setup();
    await show(ctx);
    dialog.querySelector<HTMLButtonElement>('[data-rating-never]')?.click();
    expect(storage.meta().ratingPrompt.action).toBe('never');
    storage.writeMeta({ ...storage.meta(), sessionCount: 500 });
    expect(await show(ctx)).toBe(false);
  });

  it('Esc (close without a choice) counts as later', async () => {
    const { ctx, dialog, storage } = setup();
    await show(ctx);
    dialog.close();
    expect(storage.meta().ratingPrompt).toMatchObject({
      action: 'later',
      rearmAt: RATING_MIN_SESSIONS + RATING_REARM_SESSIONS,
    });
    expect(await show(ctx)).toBe(false);
  });

  it('submitting without stars shows an error and keeps the dialog open', async () => {
    const { ctx, dialog, storage, submit } = setup();
    await show(ctx);
    submit();
    expect(dialog.querySelector('[data-rating-error]')?.textContent).toBe('Choose 1 to 5 stars');
    expect(dialog.open).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storage.meta().ratingPrompt.action).toBeNull();
  });

  it('submitting stars posts to /api/rating, records rated and thanks the user', async () => {
    const { ctx, dialog, form, store, storage, submit } = setup();
    document.documentElement.lang = 'de';
    await show(ctx);
    (form.querySelector('input[name="stars"][value="4"]') as HTMLInputElement).checked = true;
    (form.querySelector('textarea') as HTMLTextAreaElement).value = 'x'.repeat(300);
    submit();
    expect(dialog.open).toBe(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/rating');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ stars: 4, text: 'x'.repeat(280), locale: 'de', ver: 1 });
    expect(storage.meta().ratingPrompt).toMatchObject({ action: 'rated', stars: 4 });
    expect(ctx.track).toHaveBeenCalledWith('rating_submitted', { stars: 4 });
    await flush();
    expect(store.get().ui.toasts.map((x) => x.text)).toContain('Thanks — that helps.');
    expect(await show(ctx)).toBe(false);
    document.documentElement.lang = '';
  });

  it('a failed post still records rated and says so', async () => {
    fetchSpy.mockImplementation(async () => {
      throw new Error('offline');
    });
    const { ctx, form, store, storage, submit } = setup();
    await show(ctx);
    (form.querySelector('input[name="stars"][value="2"]') as HTMLInputElement).checked = true;
    submit();
    await flush();
    expect(storage.meta().ratingPrompt.action).toBe('rated');
    expect(store.get().ui.toasts.map((x) => x.text)).toContain("Couldn't send your rating. We won't ask again.");
  });
});
