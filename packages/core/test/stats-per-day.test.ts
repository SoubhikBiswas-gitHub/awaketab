import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWakeLock } from '../../wake/src/index.js';
import { createFakeApi } from '../../wake/test/fake.js';
import { STORAGE_KEYS } from '../src/constants.js';
import { createSession } from '../src/session.js';
import { countDay, exportStatsCsv, pruneDays } from '../src/stats.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import { DEFAULT_SETTINGS, DEFAULT_STATS } from '../src/types.js';
import legacy from './fixtures/stats.kolkata-midnight.json';
import expected from './fixtures/stats.kolkata-midnight-sessions.json';

const TZ = 'Asia/Kolkata';
// 23:40 IST on 7 Sep 2026; a 30-minute session ends at 00:10 IST on 8 Sep (18:40 UTC, still 7 Sep in UTC).
const START = Date.parse('2026-09-07T18:10:00.000Z');

function setup() {
  const fake = createFakeApi();
  const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
  const storage = createStorage(memoryAdapter());
  const engine = createSession({ lock, storage, channel: null, settings: () => DEFAULT_SETTINGS, now: () => Date.now(), timeZone: TZ });
  return { engine, storage };
}

describe('per-day counters (IStats.daySessions / dayFocus)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('countDay adds one to the local day, creating the record when absent', () => {
    const rec = countDay(undefined, START + 45 * 60_000, TZ);
    expect(rec).toEqual({ '2026-09-08': 1 });
    expect(countDay(rec, START + 50 * 60_000, TZ)).toEqual({ '2026-09-08': 2 });
    expect(countDay({}, START, TZ)).toEqual({ '2026-09-07': 1 });
  });

  it('counts a focus block that crosses Asia/Kolkata midnight on the local day it ends', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const { engine, storage } = setup();
    await engine.start({ type: 'duration', ms: 30 * 60_000 }, { presetId: 'custom', mode: 'focus' });
    engine.updateSession({ modeState: { focusBlock: true } });
    await vi.advanceTimersByTimeAsync(30 * 60_000);
    expect(engine.session?.endReason).toBe('completed');
    const stats = storage.stats();
    expect(stats.daySessions).toEqual(expected.daySessions);
    expect(stats.dayFocus).toEqual(expected.dayFocus);
    expect(stats.days).toEqual(expected.days);
    expect(stats.sessions).toBe(expected.sessions);
    // The UTC date (7 Sep) never receives the session.
    expect(stats.daySessions?.['2026-09-07']).toBeUndefined();
    engine.destroy();
  });

  it('a completed focus-mode session without the focus-block marker (an extension) is not a focus block', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const { engine, storage } = setup();
    await engine.start({ type: 'duration', ms: 15 * 60_000 }, { presetId: 'custom', mode: 'focus' });
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(storage.stats().daySessions).toEqual({ '2026-09-07': 1 });
    expect(storage.stats().dayFocus).toBeUndefined();
    engine.destroy();
  });

  it('a focus block stopped early counts as a session, not a focus block; under 1 min counts as neither', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    const { engine, storage } = setup();
    await engine.start({ type: 'duration', ms: 130 * 60_000 }, { presetId: 'custom', mode: 'focus' });
    engine.updateSession({ modeState: { focusBlock: true } });
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    engine.stop();
    expect(storage.stats().daySessions).toEqual({ '2026-09-07': 1 });
    expect(storage.stats().dayFocus).toBeUndefined();

    await engine.start({ type: 'duration', ms: 30 * 60_000 }, { presetId: 'custom', mode: 'standard' });
    await vi.advanceTimersByTimeAsync(20_000);
    engine.stop();
    expect(storage.stats().daySessions).toEqual({ '2026-09-07': 1 });
    expect(storage.stats().sessions).toBe(1);
    engine.destroy();
  });

  it('reads stats written before per-day counts without inventing them', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-09-08T12:00:00.000Z'));
    const mem = memoryAdapter();
    mem.set(STORAGE_KEYS.stats, JSON.stringify(legacy));
    const store = createStorage(mem);
    store.migrate();
    const stats = store.stats();
    expect(stats.days).toEqual(legacy.days);
    expect(stats.daySessions).toBeUndefined();
    expect(stats.dayFocus).toBeUndefined();
    expect('daySessions' in stats).toBe(false);
  });

  it('prunes per-day counters with the 365-day window and drops corrupt values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-09-08T12:00:00.000Z'));
    const mem = memoryAdapter();
    mem.set(
      STORAGE_KEYS.stats,
      JSON.stringify({
        ...DEFAULT_STATS,
        daySessions: { '2020-01-01': 3, '2026-09-08': 2, '2026-09-07': 'x' },
        dayFocus: 'not a record',
      }),
    );
    const stats = createStorage(mem).stats();
    expect(stats.daySessions).toEqual({ '2026-09-08': 2 });
    expect(stats.dayFocus).toBeUndefined();
    // The same number-only rule now guards `days` too.
    expect(pruneDays({ '2026-09-08': '5', '2026-09-07': 1 } as unknown as Record<string, number>, Date.now(), 'UTC')).toEqual({
      '2026-09-07': 1,
    });
    mem.set(STORAGE_KEYS.stats, JSON.stringify({ ...DEFAULT_STATS, dayFocus: null, daySessions: [] }));
    expect(createStorage(mem).stats().dayFocus).toBeUndefined();
    expect(createStorage(mem).stats().daySessions).toEqual({});
  });

  it('fills the CSV sessions column, leaves unknown days empty, and keeps the header', () => {
    const csv = exportStatsCsv({
      days: { '2026-09-06': 12, '2026-09-07': 19, '2026-09-08': 11 },
      daySessions: { '2026-09-07': 2, '2026-09-08': 1, '2026-09-09': 1 },
    });
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,awake_minutes,sessions');
    expect(lines.slice(1, 5)).toEqual(['2026-09-06,12,', '2026-09-07,19,2', '2026-09-08,11,1', '2026-09-09,0,1']);
    expect(exportStatsCsv({ days: { '2026-09-07': 10 } })).toContain('2026-09-07,10,\n');
  });
});
