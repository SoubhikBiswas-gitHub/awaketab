import { CUSTOM_MAX_MS, type ISession, type TPresetId } from '@awaketab/core';
import { t } from './i18n.js';

export function pad(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export function splitDigits(sec: number): [string, string] {
  const s = Math.max(0, Math.floor(sec));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const tail = `:${pad(s % 60)}`;
  const mm = pad((s % 3600) / 60);
  if (d) return [`${String(d)}d ${pad(h)}:${mm}`, tail];
  return [h ? `${String(h)}:${mm}` : mm, tail];
}

export function words(sec: number): string {
  if (!sec) return t('tool.noLimit');
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (d)
    return [t('tool.len.days', { d }), h ? t('tool.len.h', { h }) : '', m ? t('tool.len.min', { m }) : '']
      .filter(Boolean)
      .join(' ');
  if (h && m) return t('tool.len.hm', { h, m });
  if (h) return t('tool.len.hours', { h });
  return t('tool.len.min', { m });
}

export function mins(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return t('tool.len.min', { m: r });
  return r ? t('tool.len.hm', { h, m: r }) : t('tool.len.h', { h });
}

const cache = new Map<string, Intl.DateTimeFormat>();
export function dtf(o: Intl.DateTimeFormatOptions, lang = document.documentElement.lang || 'en'): Intl.DateTimeFormat {
  const key = lang + JSON.stringify(o);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(lang, { ...o, numberingSystem: 'latn' });
    cache.set(key, f);
  }
  return f;
}

export function hm(ms: number, c24: boolean | null = null, secs = false): string {
  return dtf({
    hour: 'numeric',
    minute: '2-digit',
    ...(secs ? { second: '2-digit' } : {}),
    ...(c24 === null ? {} : { hour12: !c24 }),
  }).format(ms);
}

export function dateLong(ms: number, year = true): string {
  const lang = document.documentElement.lang || 'en';
  const o: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    ...(year ? { year: 'numeric' } : {}),
  };
  if (lang !== 'en') return dtf({ weekday: 'long', ...o }).format(ms);
  return `${dtf({ weekday: 'long' }, 'en-GB').format(ms)}, ${dtf(o, 'en-GB').format(ms)}`;
}

const midnight = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

export function dayDiff(ms: number, now = Date.now()): number {
  return Math.round((midnight(ms) - midnight(now)) / 86_400_000);
}

function relative(ms: number, c24: boolean | null, near: number, key: string): string {
  const d = dayDiff(ms);
  const time = hm(ms, c24);
  if (d === 0) return time;
  if (d === near) return t(key, { time });
  return t('tool.when.day', { day: dtf({ weekday: 'long' }).format(ms), time });
}

export const when = (ms: number, c24: boolean | null = null): string => relative(ms, c24, 1, 'tool.when.tomorrow');

export const since = (ms: number, c24: boolean | null = null): string => relative(ms, c24, -1, 'tool.when.yesterday');

export function nextWall(wall: string, from = Date.now()): number {
  const [h, m] = wall.split(':').map(Number);
  const d = new Date(from);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  if (d.getTime() <= from) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function wallOf(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function stepCustom(m: number, up: boolean): number {
  const step = up ? (m < 720 ? 5 : 60) : m <= 720 ? 5 : 60;
  return Math.min(CUSTOM_MAX_MS / 60_000, Math.max(5, m + (up ? step : -step)));
}

export function planLabel(preset: TPresetId, eightHour = false): string {
  if (eightHour) return t('tool.preset.eightHour');
  if (preset === 'pinf') return t('tool.preset.pinf.sr');
  return t(`tool.preset.${preset}`);
}

export function remainingOf(session: ISession | null, now: number): number | null {
  if (!session || session.endsAt === null) return null;
  if (session.plan.type === 'duration') {
    const pauseNow = session.status === 'paused' && session.pausedAt !== null ? now - session.pausedAt : 0;
    return Math.max(0, session.endsAt - now + session.pausedMs + pauseNow);
  }
  return Math.max(0, session.endsAt - now);
}
