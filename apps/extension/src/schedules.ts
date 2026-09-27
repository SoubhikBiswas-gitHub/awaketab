import type { TPowerLevel } from './api';
import type { ISchedule } from './settings';

export const SCHEDULE_ALARM_PREFIX = 'at.sched.';
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

export function activeWindow(schedules: readonly ISchedule[], now: number): IWindow | null {
  return allWindows(schedules, now).find((w) => w.start <= now && now < w.end) ?? null;
}

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
