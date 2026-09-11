import { describe, expect, it } from 'vitest';
import { computeStreaks, creditMinutes, dayKey, exportStatsCsv, pruneDays } from '../src/stats.js';
import kolkata from './fixtures/stats.kolkata-midnight.json';
import la from './fixtures/stats.la-dst.json';

describe('stats local dates', () => {
  it('splits Asia/Kolkata midnight across two local days, never UTC', () => {
    const stats = { days: {} as Record<string, number>, totalMinutes: 0 };
    const start = Date.parse('2026-09-07T18:00:00.000Z');
    creditMinutes(stats, start, 30, 'Asia/Kolkata');
    creditMinutes(stats, start + 60 * 60_000, 30, 'Asia/Kolkata');
    expect(dayKey(start, 'Asia/Kolkata')).toBe('2026-09-07');
    expect(dayKey(start + 60 * 60_000, 'Asia/Kolkata')).toBe('2026-09-08');
    expect(stats.days['2026-09-07']).toBe(30);
    expect(stats.days['2026-09-08']).toBe(30);
    expect(Object.keys(stats.days)).toEqual(Object.keys(kolkata.days));
  });

  it('uses America/Los_Angeles local keys across DST', () => {
    const before = Date.parse('2026-03-08T09:00:00.000Z');
    const after = Date.parse('2026-03-08T10:30:00.000Z');
    expect(dayKey(before, 'America/Los_Angeles')).toBe('2026-03-08');
    expect(dayKey(after, 'America/Los_Angeles')).toBe('2026-03-08');
    const stats = { days: { ...la.days }, totalMinutes: la.totalMinutes };
    expect(stats.days['2026-03-08']).toBe(40);
  });

  it('computes streaks and prunes 365-day window', () => {
    const days: Record<string, number> = { '2020-01-01': 5, '2026-09-07': 1, '2026-09-08': 2 };
    const now = Date.parse('2026-09-08T12:00:00.000Z');
    const pruned = pruneDays(days, now, 'UTC');
    expect(pruned['2020-01-01']).toBeUndefined();
    const s = computeStreaks({ '2026-09-07': 1, '2026-09-08': 2 }, now, 'UTC');
    expect(s.currentStreakDays).toBeGreaterThanOrEqual(1);
    const csv = exportStatsCsv({ days: { '2026-09-07': 10 } });
    expect(csv).toContain('date,awake_minutes,sessions');
    expect(csv).toContain('2026-09-07,10,');
  });
});
