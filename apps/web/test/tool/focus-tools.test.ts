import { DEFAULT_SETTINGS } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KIT } from '../../src/tool/ambient/shell.js';
import { breathOf, breathPhase } from '../../src/tool/packs/extras/breathe.js';
import { cleanIntention } from '../../src/tool/packs/extras/common.js';
import { mountFocus } from '../../src/tool/packs/extras/focus.js';
import { key } from '../../src/tool/packs/extras/index.js';
import { focusConfig, focusElapsed, focusPhase, focusPlanMs, readClock } from '../../src/tool/packs/extras/pomodoro.js';
import { cityOf, diffText, searchZones, validZone, zoneOffset } from '../../src/tool/packs/extras/zones.js';
import { license, makeCtx } from './ctx-helper.js';

vi.mock('../../src/styles/ambient.css?url', () => ({ default: 'data:text/css,' }));
vi.mock('../../src/tool/packs/extras/extras.css?url', () => ({ default: 'data:text/css,' }));

const CFG = { workMin: 25, breakMin: 5, cycles: 4, longMin: 20 };

describe('Pomodoro maths (docs/05 §3.14)', () => {
  it('uses the long break from settings and repeats with auto-cycle', () => {
    expect(focusPlanMs(CFG)).toBe(135 * 60_000);
    expect(focusPhase(115 * 60_000, CFG)).toMatchObject({ kind: 'long', remainingMs: 20 * 60_000, round: 1 });
    expect(focusPhase(135 * 60_000, CFG).kind).toBe('done');
    expect(focusPhase(135 * 60_000, CFG, true)).toMatchObject({ kind: 'work', cycle: 1, round: 2 });
    expect(focusPhase(135 * 60_000 + 26 * 60_000, CFG, true)).toMatchObject({ kind: 'break', round: 2 });
  });

  it('pausing the timer holds the phase while the session runs on', () => {
    const clock = readClock({ focusSkip: 60_000, focusPaused: 30_000, focusPauseAt: 1_000 });
    expect(clock).toEqual({ skip: 60_000, paused: 30_000, pauseAt: 1_000 });
    expect(focusElapsed(600_000, clock, 11_000)).toBe(600_000 + 60_000 - 30_000 - 10_000);
    expect(readClock({ focusPauseAt: 0 }).pauseAt).toBeNull();
  });

  it('reads stored settings defensively', () => {
    const s = structuredClone(DEFAULT_SETTINGS);
    expect(focusConfig(s)).toEqual({ workMin: 25, breakMin: 5, cycles: 4, longMin: 15 });
    const odd = { ...s, ambient: { ...s.ambient, focus: { workMin: 999, breakMin: -3, cycles: 2.6 } } } as typeof s;
    delete (odd as Partial<typeof s>).pomodoro;
    expect(focusConfig(odd)).toEqual({ workMin: 90, breakMin: 1, cycles: 3, longMin: 15 });
  });
});

describe('breathing patterns', () => {
  it('runs 4-7-8 and box breathing from elapsed time', () => {
    expect(breathPhase(0, '478')).toMatchObject({ step: 'in', remainingMs: 4000, breath: 1 });
    expect(breathPhase(4000, '478')).toMatchObject({ step: 'hold', remainingMs: 7000 });
    expect(breathPhase(11_500, '478')).toMatchObject({ step: 'out', remainingMs: 7500 });
    expect(breathPhase(19_000, '478')).toMatchObject({ step: 'in', breath: 2 });
    expect(breathPhase(12_000, 'box')).toMatchObject({ step: 'rest', index: 3 });
    expect(breathOf({ ...DEFAULT_SETTINGS, breathe: 'box' })).toBe('box');
    expect(breathOf(DEFAULT_SETTINGS)).toBe('478');
  });
});

describe('intention and world clock helpers', () => {
  it('keeps an intention to one clean line of at most 80 characters', () => {
    expect(cleanIntention('  Draft\nthe   report​ ')).toBe('Draft the report');
    expect(Array.from(cleanIntention('é'.repeat(120)))).toHaveLength(80);
    expect(cleanIntention(42)).toBe('');
  });

  it('computes offsets and names from Intl alone', () => {
    const at = Date.UTC(2026, 8, 28, 12, 0);
    expect(zoneOffset('Asia/Kolkata', at)).toBe(330);
    expect(zoneOffset('UTC', at)).toBe(0);
    expect(zoneOffset('Europe/London', at)).toBe(60);
    expect(diffText(-270)).toBe('−4:30');
    expect(diffText(330)).toBe('+5:30');
    expect(cityOf('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(validZone('Mars/Olympus')).toBe(false);
    expect(validZone('Asia/Tokyo')).toBe(true);
  });

  it('finds zones by city, id and common names', () => {
    const list = ['America/New_York', 'Asia/Kolkata', 'Europe/London', 'Asia/Tokyo'];
    expect(searchZones(list, 'india')).toEqual(['Asia/Kolkata']);
    expect(searchZones(list, 'lond')).toEqual(['Europe/London']);
    expect(searchZones(list, 'new york')).toEqual(['America/New_York']);
    expect(searchZones(list, 'zzz')).toEqual([]);
  });
});

describe('focus mode with auto-cycle (Pro)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a no-limit session that repeats, and pauses only the timer', async () => {
    const { ctx, store, engine } = makeCtx({
      license: license(['ambient.packs']),
      settings: { pomodoro: { autoCycle: true, longBreakMin: 15 } },
    });
    store.set({ ui: { mode: 'focus' } });
    const stage = document.createElement('div');
    const off = mountFocus(stage, ctx, KIT);
    stage.querySelector<HTMLButtonElement>('[data-focus-start]')?.click();
    await vi.waitFor(() => {
      expect(engine.session?.modeState.focusAuto).toBe(true);
    });
    expect(engine.session?.plan.type).toBe('indefinite');
    expect(engine.session?.modeState.focusBlock).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    stage.querySelector<HTMLButtonElement>('[data-focus-pause]')?.click();
    expect(Number(engine.session?.modeState.focusPauseAt)).toBeGreaterThan(0);
    expect(stage.hasAttribute('data-paused')).toBe(true);
    expect(engine.session?.status).toBe('active');
    stage.querySelector<HTMLButtonElement>('[data-focus-pause]')?.click();
    expect(stage.hasAttribute('data-paused')).toBe(false);
    off();
    ctx.stop();
  });

  it('B and T toggle Breathe and Focus', () => {
    const { ctx, store } = makeCtx();
    key(ctx, 'b');
    expect(store.get().ui.mode).toBe('breathe');
    key(ctx, 'b');
    expect(store.get().ui.mode).toBe('standard');
    key(ctx, 't');
    expect(store.get().ui.mode).toBe('focus');
  });
});
