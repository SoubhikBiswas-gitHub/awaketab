import type { ISession } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activePreview, endPreview, PREVIEW_MS, startPreview } from '../../src/tool/packs/themes/preview.js';
import { makeCtx } from './ctx-helper.js';
import type * as TLooks from '../../src/tool/packs/themes/looks.js';

vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));
vi.mock('../../src/tool/packs/themes/looks.js', async (load) => ({
  ...(await load<typeof TLooks>()),
  themesCss: async () => undefined,
  uiCss: async () => undefined,
}));

const flush = async () => {
  await vi.advanceTimersByTimeAsync(0);
};

function setup(live = false) {
  const made = makeCtx({ html: '<section data-toasts aria-live="polite"></section>' });
  if (live) made.store.set({ session: { status: 'active' } as ISession });
  const apply = vi.fn();
  const revert = vi.fn();
  const opts = { kind: 'palette', id: 'nord', label: 'Nord', back: 'Clear Night', apply, revert };
  return { ...made, apply, revert, opts };
}

const toastOf = (store: ReturnType<typeof makeCtx>['store']) => store.get().ui.toasts.find((x) => x.id === 'preview');

describe('Pro preview helper (docs/02 FR-AMBIENT-01)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    endPreview(false);
    vi.useRealTimers();
  });

  it('applies at once, shows the chip with a countdown, warns at one minute and goes back after five', async () => {
    const { ctx, store, root, apply, revert, opts } = setup();
    startPreview(ctx, opts);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(document.documentElement.dataset.preview).toBe('palette');
    await flush();
    const chip = root.querySelector<HTMLElement>('[data-toasts] > .at-pv');
    expect(chip?.querySelector('.at-pv-text')?.textContent).toBe('Previewing Nord · 5:00 left');
    expect(chip?.querySelector<HTMLElement>('.at-pv-keep')?.hidden).toBe(false);
    // Countdown text is hidden from screen readers; the start is said once.
    expect(chip?.querySelector('.at-pv-text')?.getAttribute('aria-hidden')).toBe('true');

    await vi.advanceTimersByTimeAsync(PREVIEW_MS - 60_000);
    const warn = toastOf(store);
    expect(warn?.text).toBe('1 minute left of the Nord preview');
    expect(warn?.action?.label).toBe('Get Pro');
    expect(warn?.alt?.label).toBe('End now');
    expect(revert).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(toastOf(store)?.text).toBe('Preview ended, back to Clear Night. Get Pro to keep Nord.');
    expect(activePreview()).toBeNull();
    expect(document.documentElement.hasAttribute('data-preview')).toBe(false);
    expect(root.querySelector('.at-pv')).toBeNull();
  });

  it('the same item changes nothing; another item restarts the clock after putting the first back', async () => {
    const { ctx, apply, revert, opts } = setup();
    startPreview(ctx, opts);
    await vi.advanceTimersByTimeAsync(120_000);
    startPreview(ctx, opts);
    expect(apply).toHaveBeenCalledTimes(1);
    const other = { ...opts, id: 'mono', label: 'Mono', apply: vi.fn(), revert: vi.fn() };
    startPreview(ctx, other);
    expect(revert).toHaveBeenCalledTimes(1);
    expect(other.apply).toHaveBeenCalledTimes(1);
    expect(activePreview()?.endsAt).toBe(Date.now() + PREVIEW_MS);
  });

  it('never sells during a session: no Pro link, End now only, and a plain ending', async () => {
    const { ctx, store, root, opts } = setup(true);
    startPreview(ctx, opts);
    await flush();
    expect(root.querySelector<HTMLElement>('.at-pv-keep')?.hidden).toBe(true);
    await vi.advanceTimersByTimeAsync(PREVIEW_MS - 60_000);
    expect(toastOf(store)?.action?.label).toBe('End now');
    expect(toastOf(store)?.alt).toBeUndefined();
    toastOf(store)?.action?.onClick();
    expect(toastOf(store)?.text).toBe('Preview ended, back to Clear Night.');
    expect(activePreview()).toBeNull();
  });

  it('the chip folds to a small dot and back, keyboard reachable', async () => {
    const { ctx, root, opts } = setup();
    startPreview(ctx, opts);
    await flush();
    const min = root.querySelector<HTMLButtonElement>('.at-pv-min') as HTMLButtonElement;
    expect(min.getAttribute('aria-expanded')).toBe('true');
    min.click();
    expect(root.querySelector('.at-pv')?.hasAttribute('data-min')).toBe(true);
    expect(min.getAttribute('aria-label')).toBe('Show the Nord preview bar');
    min.click();
    expect(min.getAttribute('aria-expanded')).toBe('true');
  });
});
