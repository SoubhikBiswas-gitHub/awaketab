import type { TPowerLevel } from './api';
import type { ISchedule } from './settings';

/**
 * Weekly schedules (Pro `ext.schedules`, docs/10 §4, E11-T05). All times are local wall-clock times,
 * built with `Date#setHours` on each calendar day, so a window keeps its wall times across DST changes;
 * the controller recomputes every alarm when one fires instead of trusting a stored offset.
 */

export const SCHEDULE_ALARM_PREFIX = 'at.sched.'; // PROPOSED — add to 00-conventions.md
const LOOKAROUND_DAYS = 8;

export interface IWindow {
  start: number;
  end: number;
  level: TPowerLevel;
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function at(day: Date, hhmm: string): number {
  const minutes = minutesOf(hhmm);
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.getTime();
}

/** Raw windows of one schedule whose start falls within ±8 local days of `now`. Overnight windows end next day. */
export function windowsOf(schedule: ISchedule, now: number): IWindow[] {
  const base = new Date(now);
  const out: IWindow[] = [];
  for (let offset = -LOOKAROUND_DAYS; offset <= LOOKAROUND_DAYS; offset += 1) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
    if (!schedule.days.includes(day.getDay())) continue;
    const start = at(day, schedule.start);
    const endDay =
      minutesOf(schedule.end) <= minutesOf(schedule.start)
        ? new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
        : day;
    const end = at(endDay, schedule.end);
    if (end > start) out.push({ start, end, level: schedule.level });
  }
  return out;
}

/**
 * Overlapping or touching windows merge into one (E11-T05 AC). A merged window keeps the screen on
 * (`display`) if any part of it asks for `display`, since that level also keeps the system awake.
 */
export function mergeWindows(windows: readonly IWindow[]): IWindow[] {
  const sorted = [...windows].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: IWindow[] = [];
  for (const w of sorted) {
    const last = merged.at(-1);
    if (last && w.start <= last.end) {
      last.end = Math.max(last.end, w.end);
      if (w.level === 'display') last.level = 'display';
    } else {
      merged.push({ ...w });
    }
  }
  return merged;
}

export function allWindows(schedules: readonly ISchedule[], now: number): IWindow[] {
  return mergeWindows(schedules.flatMap((s) => windowsOf(s, now)));
}

/** The merged window covering `now`, if any. */
export function activeWindow(schedules: readonly ISchedule[], now: number): IWindow | null {
  return allWindows(schedules, now).find((w) => w.start <= now && now < w.end) ?? null;
}

/**
 * Two alarms per schedule — its next start and its next end after `now` (docs/10 §4). Recomputed on every
 * fire, so a DST change moves the next occurrence to the right wall time.
 */
export function scheduleAlarms(schedules: readonly ISchedule[], now: number): Array<{ name: string; when: number }> {
  const alarms: Array<{ name: string; when: number }> = [];
  for (const schedule of schedules) {
    const windows = windowsOf(schedule, now);
    const nextStart = windows.map((w) => w.start).filter((t) => t > now).sort((a, b) => a - b)[0];
    const nextEnd = windows.map((w) => w.end).filter((t) => t > now).sort((a, b) => a - b)[0];
    if (nextStart !== undefined) alarms.push({ name: `${SCHEDULE_ALARM_PREFIX}${schedule.id}.start`, when: nextStart });
    if (nextEnd !== undefined) alarms.push({ name: `${SCHEDULE_ALARM_PREFIX}${schedule.id}.end`, when: nextEnd });
  }
  return alarms;
}

export function wallOf(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
