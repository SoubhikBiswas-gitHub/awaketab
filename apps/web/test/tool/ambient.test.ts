import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  activeElapsed,
  addCookTimer,
  COOK_MAX_TIMERS,
  cookName,
  focusPhase,
  focusPlanMs,
  modeAllowed,
  nextMode,
  pixelShift,
  readCookTimers,
  resolveMessage,
  settleCookTimers,
  shouldDim,
} from '../../src/tool/ambient/logic.js';
import { cycleMode, mountAmbient } from '../../src/tool/ambient/shell.js';
import { license, makeCtx } from './ctx-helper.js';

const FOCUS = { workMin: 25, breakMin: 5, cycles: 4 };
const none = () => false;
const all = () => true;

describe('ambient mode gating (E10-T01)', () => {
  it('only message is gated; ambient.packs gates palettes, not layouts', () => {
    for (const mode of ['standard', 'clock', 'focus', 'minimal', 'night', 'cook'] as const) {
      expect(modeAllowed(mode, none)).toBe(true);
    }
    expect(modeAllowed('message', none)).toBe(false);
    expect(modeAllowed('message', (g) => g === 'ambient.message')).toBe(true);
  });

  it('M cycles in order and skips message without Pro', () => {
    expect(nextMode('standard', none)).toEqual({ mode: 'clock', skipped: [] });
    expect(nextMode('night', none)).toEqual({ mode: 'cook', skipped: ['message'] });
    expect(nextMode('night', all)).toEqual({ mode: 'message', skipped: [] });
    expect(nextMode('cook', none).mode).toBe('standard');
  });
});

describe('focus mode maths (docs/05 §3.14)', () => {
  it('the default block is 130 minutes', () => {
    expect(focusPlanMs(FOCUS)).toBe(130 * 60_000);
  });

  it('derives phases from elapsed time', () => {
    expect(focusPhase(0, FOCUS)).toMatchObject({ kind: 'work', cycle: 1, index: 0, remainingMs: 25 * 60_000 });
    expect(focusPhase(25 * 60_000, FOCUS)).toMatchObject({ kind: 'break', cycle: 1, index: 1 });
    expect(focusPhase(30 * 60_000, FOCUS)).toMatchObject({ kind: 'work', cycle: 2, index: 2 });
    expect(focusPhase(115 * 60_000 - 1, FOCUS)).toMatchObject({ kind: 'work', cycle: 4 });
    expect(focusPhase(115 * 60_000, FOCUS)).toMatchObject({ kind: 'long', cycle: 4, remainingMs: 15 * 60_000 });
    expect(focusPhase(130 * 60_000, FOCUS).kind).toBe('done');
  });

  it('elapsed excludes past and current pauses', () => {
    const s = { startedAt: 0, pausedMs: 60_000, pausedAt: 240_000, status: 'paused' as const };
    expect(activeElapsed(s, 300_000)).toBe(180_000);
    expect(activeElapsed({ ...s, status: 'active', pausedAt: null }, 300_000)).toBe(240_000);
  });
});

describe('cook timers (docs/05 §3.16)', () => {
  it('adds up to three timers within 1 min–12 h', () => {
    let list = addCookTimer([], { name: 'Pasta', ms: 10 * 60_000, now: 0, id: 'a' }) ?? [];
    expect(list).toHaveLength(1);
    expect(addCookTimer(list, { name: 'x', ms: 30_000, now: 0, id: 'b' })).toBeNull();
    expect(addCookTimer(list, { name: 'x', ms: 13 * 3_600_000, now: 0, id: 'b' })).toBeNull();
    list = addCookTimer(list, { name: 'Rice', ms: 60_000, now: 0, id: 'b' }) ?? [];
    list = addCookTimer(list, { name: 'Eggs', ms: 60_000, now: 0, id: 'c' }) ?? [];
    expect(list).toHaveLength(COOK_MAX_TIMERS);
    expect(addCookTimer(list, { name: 'Tea', ms: 60_000, now: 0, id: 'd' })).toBeNull();
  });

  it('settles finished timers exactly once', () => {
    const list = addCookTimer([], { name: 'Pasta', ms: 60_000, now: 0, id: 'a' }) ?? [];
    expect(settleCookTimers(list, 59_999).finished).toHaveLength(0);
    const done = settleCookTimers(list, 60_000);
    expect(done.finished.map((t) => t.name)).toEqual(['Pasta']);
    expect(settleCookTimers(done.list, 70_000).finished).toHaveLength(0);
  });

  it('reads persisted timers defensively and cleans names', () => {
    expect(readCookTimers(undefined)).toEqual([]);
    expect(readCookTimers({ cookTimers: 'nope' })).toEqual([]);
    expect(readCookTimers({ cookTimers: [{ id: 1 }, { id: 'a', name: 'n', durationMs: 1, endsAt: 2, doneAt: null }] })).toHaveLength(1);
    expect(cookName('  <b>Pasta‮</b>   water that boils ', 'Timer 1')).toBe('<b>Pasta</b> water t');
    expect(cookName('\u0000 ', 'Timer 2')).toBe('Timer 2');
  });
});

describe('message mode (docs/05 §3.15)', () => {
  it('Pro shows the param or the saved text', () => {
    expect(resolveMessage({ param: 'Hi', saved: 'Saved', pro: true, sample: 'S' })).toEqual({ text: 'Hi', sample: false, preview: false });
    expect(resolveMessage({ param: '', saved: 'Saved', pro: true, sample: 'S' }).text).toBe('Saved');
  });

  it('free users preview a shared link, else see the sample behind the Pro card', () => {
    expect(resolveMessage({ param: 'Hi', saved: '', pro: false, sample: 'S' })).toEqual({ text: 'Hi', sample: false, preview: true });
    expect(resolveMessage({ param: '', saved: 'Saved', pro: false, sample: 'S' })).toEqual({ text: 'S', sample: true, preview: false });
  });
});

describe('burn-in guard (E10-T07)', () => {
  it('shifts at most 2 px on each axis', () => {
    for (const r of [0, 0.25, 0.5, 0.999]) {
      const [x, y] = pixelShift(() => r);
      expect(Math.abs(x)).toBeLessThanOrEqual(2);
      expect(Math.abs(y)).toBeLessThanOrEqual(2);
    }
  });

  it('dims night after 30 s idle and any oled ambient mode after 30 min', () => {
    expect(shouldDim({ mode: 'night', oled: true, idleMs: 29_999 })).toBe(false);
    expect(shouldDim({ mode: 'night', oled: true, idleMs: 30_000 })).toBe(true);
    expect(shouldDim({ mode: 'clock', oled: false, idleMs: 3_600_000 })).toBe(false);
    expect(shouldDim({ mode: 'clock', oled: true, idleMs: 30 * 60_000 })).toBe(true);
    expect(shouldDim({ mode: 'standard', oled: true, idleMs: 3_600_000 })).toBe(false);
  });
});

const SHELL_HTML = `
  <main><div data-pip-slot><svg data-ring></svg><button data-pill><output data-pill-text>Ready</output></button><div data-timer></div></div></main>
  <section data-toasts></section>
  <dialog data-ambient><h2 data-ambient-title></h2><div data-ambient-stage><div data-ambient-content></div></div>
    <div data-ambient-controls><button data-ambient-next>Next</button><button data-ambient-fullscreen>FS</button><button data-ambient-exit>Exit</button></div>
  </dialog>`;

describe('AmbientShell DOM', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('re-parents the pill into the layer, auto-hides controls after 3 s and restores on exit', async () => {
    vi.useFakeTimers();
    const { ctx, root, store } = makeCtx({ html: SHELL_HTML });
    const unmount = mountAmbient(ctx);
    const dialog = root.querySelector<HTMLDialogElement>('[data-ambient]');
    const slot = root.querySelector('[data-pip-slot]');
    store.set({ ui: { mode: 'minimal' } });
    expect(dialog?.open).toBe(true);
    expect(dialog?.dataset.mode).toBe('minimal');
    expect(slot?.parentElement?.hasAttribute('data-ambient-stage')).toBe(true);
    expect(root.querySelector('[data-toasts]')?.parentElement).toBe(dialog);

    await vi.advanceTimersByTimeAsync(3_000);
    expect(dialog?.dataset.controls).toBe('hidden');
    expect(root.querySelector<HTMLElement>('[data-ambient-controls]')?.inert).toBe(true);
    expect(store.get().ui.controlsHidden).toBe(true);

    dialog?.dispatchEvent(new Event('pointermove'));
    expect(dialog?.dataset.controls).toBe('shown');

    // First Tab press means a keyboard user: auto-hide stays off (docs/05 §3.13).
    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(dialog?.dataset.controls).toBe('shown');

    root.querySelector<HTMLButtonElement>('[data-ambient-exit]')?.click();
    expect(store.get().ui.mode).toBe('standard');
    expect(dialog?.open).toBe(false);
    expect(slot?.parentElement?.tagName).toBe('MAIN');
    unmount();
  });

  it('applies a pixel shift every 60 s', async () => {
    vi.useFakeTimers();
    const { ctx, root, store } = makeCtx({ html: SHELL_HTML });
    const unmount = mountAmbient(ctx);
    store.set({ ui: { mode: 'minimal' } });
    await vi.advanceTimersByTimeAsync(60_000);
    const stage = root.querySelector<HTMLElement>('[data-ambient-stage]');
    expect(stage?.style.translate).toMatch(/^-?[0-2]px -?[0-2]px$/u);
    unmount();
  });

  it('night forces the oled palette and restores the theme on exit', () => {
    const { ctx, store } = makeCtx({ html: SHELL_HTML, settings: { theme: 'light' } });
    const unmount = mountAmbient(ctx);
    store.set({ ui: { mode: 'night' } });
    expect(document.documentElement.dataset.theme).toBe('oled');
    store.set({ ui: { mode: 'standard' } });
    expect(document.documentElement.dataset.theme).toBe('light');
    unmount();
  });

  it('cycleMode toasts once when it skips the gated message mode', () => {
    const { ctx, store } = makeCtx({ html: SHELL_HTML });
    store.set({ ui: { mode: 'night' } });
    cycleMode(ctx);
    expect(store.get().ui.mode).toBe('cook');
    expect(store.get().ui.toasts.map((t) => t.text)).toContain('Message mode is a Pro feature');
  });

  it('with ambient.message the cycle reaches message', () => {
    const { ctx, store } = makeCtx({ html: SHELL_HTML, license: license(['ambient.message']) });
    store.set({ ui: { mode: 'night' } });
    cycleMode(ctx);
    expect(store.get().ui.mode).toBe('message');
  });
});
