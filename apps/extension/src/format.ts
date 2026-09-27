import type { TTranslate } from './i18n';

export interface ITimeFormat {
  lang: string;
  clock24h: boolean | null;
  t: TTranslate;
}

const DAY_MS = 86_400_000;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

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
  const hourOnly = new Intl.DateTimeFormat(f.lang, {
    hour: 'numeric',
    ...(f.clock24h !== null ? { hour12: !f.clock24h } : {}),
  });
  // Dates read day before month in English too ("Sunday, 27 September", DESIGN.md §4); times stay 12-hour.
  const english = f.lang === 'en';
  const weekday = new Intl.DateTimeFormat(f.lang, { weekday: 'long' });
  const dayMonthEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });
  const dayMonthIntl = new Intl.DateTimeFormat(f.lang, { weekday: 'long', day: 'numeric', month: 'long' });
  const dayMonth = {
    format: (ms: number) => (english ? `${weekday.format(ms)}, ${dayMonthEn.format(ms)}` : dayMonthIntl.format(ms)),
  };
  const { t } = f;

  const hm = (ms: number): string => clock.format(ms);

  const when = (ms: number, now: number): string => {
    const d = dayDiff(ms, now);
    if (d === 0) return hm(ms);
    if (d === 1) return t('ext.time.tomorrow', { time: hm(ms) });
    return t('ext.time.weekday', { day: weekday.format(ms), time: hm(ms) });
  };

  const since = (ms: number, now: number): string => {
    const d = dayDiff(ms, now);
    if (d === 0) return hm(ms);
    if (d === -1) return t('ext.time.yesterday', { time: hm(ms) });
    return t('ext.time.weekday', { day: weekday.format(ms), time: hm(ms) });
  };

  const at = (ms: number, now: number): string => {
    const d = dayDiff(ms, now);
    if (d === 0) return t('ext.time.todayAt', { time: hm(ms) });
    if (d === 1) return t('ext.time.tomorrowAt', { time: hm(ms) });
    return t('ext.time.dayAt', { day: weekday.format(ms), time: hm(ms) });
  };

  const full = (ms: number): string => t('ext.time.full', { date: dayMonth.format(ms), time: hm(ms) });

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

  const wall = (minutes: number): string => {
    const m = ((minutes % 1440) + 1440) % 1440;
    return hm(new Date(2023, 0, 2, Math.floor(m / 60), m % 60).getTime());
  };

  // Axis labels: "6 AM", "Noon", "6 PM" on a 12-hour clock (ExtOptions board); the locale's own hours otherwise.
  const hour = (h: number): string => {
    const ms = new Date(2023, 0, 2, h % 24).getTime();
    const twelve = hourOnly.formatToParts(ms).some((p) => p.type === 'dayPeriod');
    return twelve && h % 24 === 12 ? t('ext.time.noon') : hourOnly.format(ms);
  };

  const range = (start: number, end: number): string =>
    t('ext.time.span', {
      from: wall(start),
      to: end <= start ? t('ext.time.nextDay', { time: wall(end) }) : wall(end),
    });

  return { hm, when, since, at, full, span, wall, hour, range, weekday: (ms: number) => weekday.format(ms) };
}

export function keyCaps(shortcut: string): string[] {
  if (shortcut.includes('+')) return shortcut.split('+').filter(Boolean);
  // macOS modifier glyphs are single code points; Array.from keeps each one whole.
  return Array.from(shortcut.matchAll(/./gu), (m) => m[0]);
}

export type TTimeFormat = ReturnType<typeof createTimeFormat>;

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
