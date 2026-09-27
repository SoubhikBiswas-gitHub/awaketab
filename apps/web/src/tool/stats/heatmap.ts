import { dayKey } from '@awaketab/core';
import { pad } from '../format.js';

export const HEATMAP_WEEKS = 12;
export const FREE_HISTORY_DAYS = 7;

export interface IHeatCell {
  key: string;
  date: Date;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
  locked: boolean;
  future: boolean;
}

export interface IHeatmap {
  rows: IHeatCell[][];
}

function localDay(base: Date, offset: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 12);
}

function ymd(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayLocal(now: number, timeZone?: string): Date {
  const [y, m, d] = dayKey(now, timeZone).split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
}

function quartiles(values: number[]): [number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))] ?? 0;
  return [at(0.25), at(0.5), at(0.75)];
}

export function levelFor(minutes: number, q: [number, number, number]): IHeatCell['level'] {
  if (minutes <= 0) return 0;
  if (minutes <= q[0]) return 1;
  if (minutes <= q[1]) return 2;
  if (minutes <= q[2]) return 3;
  return 4;
}

export function buildHeatmap(
  days: Record<string, number>,
  opts: { now?: number; history: boolean; timeZone?: string } = { history: false },
): IHeatmap {
  const now = opts.now ?? Date.now();
  const todayKey = dayKey(now, opts.timeZone);
  const today = todayLocal(now, opts.timeZone);
  const mondayOffset = (today.getDay() + 6) % 7;
  const firstMonday = localDay(today, -mondayOffset - (HEATMAP_WEEKS - 1) * 7);
  const oldestFree = ymd(localDay(today, -(FREE_HISTORY_DAYS - 1)));

  const cells: IHeatCell[] = [];
  for (let i = 0; i < HEATMAP_WEEKS * 7; i += 1) {
    const date = localDay(firstMonday, i);
    const key = ymd(date);
    const future = key > todayKey;
    const locked = !opts.history && key < oldestFree;
    cells.push({ key, date, minutes: future || locked ? 0 : (days[key] ?? 0), level: 0, locked, future });
  }
  const q = quartiles(cells.filter((c) => c.minutes > 0).map((c) => c.minutes));
  for (const c of cells) c.level = levelFor(c.minutes, q);

  const rows: IHeatCell[][] = Array.from({ length: 7 }, () => []);
  for (const [i, c] of cells.entries()) rows[i % 7]?.push(c);
  return { rows };
}

export interface IStatsSummary {
  todayMinutes: number;
  todaySessions: number;
  weekMinutes: number;
  streakDays: number;
  totalMinutes: number;
  sessions: number;
  empty: boolean;
}

export function summarise(
  stats: {
    days: Record<string, number>;
    daySessions?: Record<string, number>;
    totalMinutes: number;
    sessions: number;
    currentStreakDays: number;
  },
  now = Date.now(),
  timeZone?: string,
): IStatsSummary {
  const base = todayLocal(now, timeZone);
  let week = 0;
  for (let i = 0; i < 7; i += 1) week += stats.days[ymd(localDay(base, -i))] ?? 0;
  const today = dayKey(now, timeZone);
  return {
    todayMinutes: stats.days[today] ?? 0,
    todaySessions: stats.daySessions?.[today] ?? 0,
    weekMinutes: week,
    streakDays: stats.currentStreakDays,
    totalMinutes: stats.totalMinutes,
    sessions: stats.sessions,
    empty: stats.totalMinutes <= 0 && Object.keys(stats.days).length === 0,
  };
}
