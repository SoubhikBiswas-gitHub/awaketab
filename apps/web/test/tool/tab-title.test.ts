import { afterEach, describe, expect, it } from 'vitest';
import { mountView } from '../../src/tool/ui/view.js';
import { makeCtx } from './ctx-helper.js';

const TITLE = 'AwakeTab — Keep your screen awake';

describe('the tab mirrors the lock state (DESIGN.md §2.3, decision O-19)', () => {
  let off: (() => void) | undefined;
  afterEach(() => {
    off?.();
    off = undefined;
    document.head.innerHTML = '';
  });

  it('shows the time left while awake, Paused or Blocked otherwise, and the page title when idle', async () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" type="image/svg+xml">';
    document.title = TITLE;
    const { ctx, store } = makeCtx();
    off = mountView(ctx);
    const icon = () => document.querySelector<HTMLLinkElement>('link[rel=icon]')?.getAttribute('href') ?? '';
    expect(document.title).toBe(TITLE);
    expect(icon()).toBe('/favicon.svg');

    await ctx.startPlan({ type: 'duration', ms: 30 * 60_000 }, 'p30');
    expect(store.get().lock).toBe('held');
    expect(document.title).toBe('● 30:00 left');
    expect(icon()).toBe('/icons/tab-awake.svg');

    store.set({ lock: 'lost' });
    expect(document.title).toBe('Paused · 30:00 left');
    expect(icon()).toBe('/icons/tab-paused.svg');

    store.set({ lock: 'denied' });
    expect(document.title).toBe('Blocked · AwakeTab');
    expect(icon()).toBe('/icons/tab-blocked.svg');

    ctx.stop();
    store.set({ lock: 'idle' });
    expect(document.title).toBe(TITLE);
    expect(icon()).toMatch(/\/favicon\.svg$/u);
  });

  it('keeps the page title after a session ends and marks the favicon done', async () => {
    document.head.innerHTML = '<link rel="icon" href="/favicon.svg" type="image/svg+xml">';
    document.title = TITLE;
    const { ctx, store } = makeCtx();
    off = mountView(ctx);
    await ctx.startPlan({ type: 'indefinite' }, 'pinf');
    expect(document.title).toMatch(/^● .+ awake so far$/u);
    ctx.stop();
    store.set({ lock: 'idle', ui: { done: { at: Date.now(), reason: 'completed', log: [], total: 0, left: 0 } } });
    expect(document.title).toBe(TITLE);
    expect(document.querySelector('link[rel=icon]')?.getAttribute('href')).toBe('/icons/tab-done.svg');
  });
});
