import type { TTranslate } from './i18n';

/**
 * Time and duration wording shared by the popup, options and welcome pages (DESIGN.md §4): 12-hour times with
 * AM/PM in English (other locales follow Intl unless the user picked 12/24 h), "tomorrow" when a time crosses
 * midnight, the weekday when it is two or more days away, and end times rounded to the minute. Every word
 * comes from the catalog; Intl supplies only the numbers, weekday and month names.
 */

export interface ITimeFormat {
  /** BCP 47 tag of the page (`en`, `pt-BR`, `zh-Hans`, …). */
  lang: string;
  /** `settings.ambient.clock24h`: `null` follows the language. */
  clock24h: boolean | null;
  t: TTranslate;
}

const DAY_MS = 86_400_000;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole local calendar days from `now` to `ms` (DST-safe: rounds the day boundaries' difference). */
export function dayDiff(ms: number, now: number): number {
  return Math.round((startOfDay(ms) - startOfDay(now)) / DAY_MS);
}

export function roundToMinute(ms: number): number {
  return Math.round(ms / 60_000) * 60_000;
}

export function createTimeFormat(f: ITimeFormat) {
  const hourOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  if (f.clock24h !== null) hourOpts.hour12 = !f.clock24h;
  const clock = new Intl.DateTimeFormat(f.lang, hourOpts);
  const hourOnly = new Intl.DateTimeFormat(f.lang, { hour: 'numeric', ...(f.clock24h !== null ? { hour12: !f.clock24h } : {}) });
  // Dates read day before month in English too ("Sunday, 27 September", DESIGN.md §4); times stay 12-hour.
  const english = f.lang === 'en';
  const weekday = new Intl.DateTimeFormat(f.lang, { weekday: 'long' });
  const dayMonthEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });
  const dayMonthIntl = new Intl.DateTimeFormat(f.lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const dayMonth = { format: (ms: number) => (english ? `${weekday.format(ms)}, ${dayMonthEn.format(ms)}` : dayMonthIntl.format(ms)) };
  const { t } = f;

  /** `10:30 PM` */
  const hm = (ms: number): string => clock.format(ms);

  /** Today `10:30 PM`; tomorrow `4:11 AM tomorrow`; further out (or in the past) `Monday 12:42 AM`. */
  const when = (ms: number, now: number): string => {
    const d = dayDiff(ms, now);
    if (d === 0) return hm(ms);
    if (d === 1) return t('ext.time.tomorrow', { time: hm(ms) });
    return t('ext.time.weekday', { day: weekday.format(ms), time: hm(ms) });
  };

  /** Today `9:04 PM`; yesterday `yesterday 7:43 PM`; earlier `Friday 7:43 PM`. */
  const since = (ms: number, now: number): string => {
    const d = dayDiff(ms, now);
    if (d === 0) return hm(ms);
    if (d === -1) return t('ext.time.yesterday', { time: hm(ms) });
    return t('ext.time.weekday', { day: weekday.format(ms), time: hm(ms) });
  };

  /** `today at 9:00 AM`, `tomorrow at 9:00 AM`, `Monday at 9:00 AM`. */
  const at = (ms: number, now: number): string => {
    const d = dayDiff(ms, now);
    if (d === 0) return t('ext.time.todayAt', { time: hm(ms) });
    if (d === 1) return t('ext.time.tomorrowAt', { time: hm(ms) });
    return t('ext.time.dayAt', { day: weekday.format(ms), time: hm(ms) });
  };

  /** `Sunday, 27 September · 10:30 AM` (the date part in the page language's own order). */
  const full = (ms: number): string => t('ext.time.full', { date: dayMonth.format(ms), time: hm(ms) });

  /** `9:12 to 9:42 PM`: the first AM/PM is dropped when both times share it. */
  const span = (a: number, b: number): string => {
    const partsA = clock.formatToParts(a);
    const periodA = partsA.find((p) => p.type === 'dayPeriod')?.value;
    const periodB = clock.formatToParts(b).find((p) => p.type === 'dayPeriod')?.value;
    let from = hm(a);
    if (periodA && periodA === periodB && dayDiff(a, b) === 0) {
      from = partsA
        .filter((p) => p.type !== 'dayPeriod')
        .map((p) => p.value)
        .join('')
        .trim();
    }
    return t('ext.time.span', { from, to: hm(b) });
  };

  /** Wall-clock minutes of the day (`540` → `9:00 AM`); used by the schedule editor. */
  const wall = (minutes: number): string => {
    const m = ((minutes % 1440) + 1440) % 1440;
    return hm(new Date(2023, 0, 2, Math.floor(m / 60), m % 60).getTime());
  };

  /** `12 AM`, `6 AM`, `12 PM` … for axis labels. */
  const hour = (h: number): string => hourOnly.format(new Date(2023, 0, 2, h % 24).getTime());

  return { hm, when, since, at, full, span, wall, hour, weekday: (ms: number) => weekday.format(ms) };
}

/**
 * Keycaps for a Chrome shortcut string: `Alt+Shift+A` on Windows and Linux, `⌥⇧A` on macOS (no separator).
 */
export function keyCaps(shortcut: string): string[] {
  if (shortcut.includes('+')) return shortcut.split('+').filter(Boolean);
  // macOS modifier glyphs are single code points; Array.from keeps each one whole.
  return Array.from(shortcut.matchAll(/./gu), (m) => m[0]);
}

export type TTimeFormat = ReturnType<typeof createTimeFormat>;

/**
 * Clock digits (DESIGN.md §4, "Long sessions"): under 1 h `MM` + `:SS`; from 1 h `H:MM` + `:SS`; from a
 * full day `1d` over `HH:MM` + `:SS`. The seconds part is returned separately so it can be dimmed.
 */
export function clockParts(ms: number): { days: string; main: string; seconds: string } {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(sec / 86_400);
  const h = Math.floor((sec % 86_400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  if (d) return { days: `${String(d)}d`, main: `${p(h)}:${p(m)}`, seconds: `:${p(s)}` };
  if (h) return { days: '', main: `${String(h)}:${p(m)}`, seconds: `:${p(s)}` };
  return { days: '', main: p(m), seconds: `:${p(s)}` };
}

/** `45 min`, `1 h`, `1 h 30 min`, `2 days 3 h` — for Start labels and receipts. */
export function words(ms: number, t: TTranslate): string {
  const totalMin = Math.max(1, Math.round(ms / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const parts: string[] = [];
  if (d) parts.push(t('ext.dur.days', { days: d }));
  if (d) {
    if (h) parts.push(t('ext.dur.hours', { hours: h }));
    if (m) parts.push(t('stats.minutes', { minutes: m }));
    return parts.join(' ');
  }
  if (h && m) return t('stats.hours', { hours: h, minutes: m });
  if (h) return t('ext.dur.hours', { hours: h });
  return t('stats.minutes', { minutes: m });
}
