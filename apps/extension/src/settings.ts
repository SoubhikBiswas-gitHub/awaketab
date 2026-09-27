import { DEFAULT_SETTINGS, STORAGE_KEYS, type ISettings, type TPresetId } from '@awaketab/core';
import type { TPowerLevel } from './api';

export const EXT_KEYS = { ext: 'at.v1.ext', device: 'at.v1.device' } as const;

export const SYNC_KEYS: readonly string[] = [STORAGE_KEYS.settings, EXT_KEYS.ext];

export const SCHEDULES_MAX = 20;
export const AUTOSTART_SITES_MAX = 50;

export interface ISchedule {
  id: string;
  days: number[];
  start: string;
  end: string;
  level: TPowerLevel;
}

export interface IAutostartSite {
  host: string;
  durationMin: number | null;
}

export interface IExtSettings {
  v: 1;
  level: TPowerLevel;
  schedules: ISchedule[];
  autostart: { browserStart: boolean; sites: IAutostartSite[] };
}

export const DEFAULT_EXT: IExtSettings = {
  v: 1,
  level: 'display',
  schedules: [],
  autostart: { browserStart: false, sites: [] },
};

export const EXT_DEFAULT_SETTINGS: ISettings = { ...DEFAULT_SETTINGS, telemetry: false, notifications: false };

export const EXT_PRESETS = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf'] as const;
export type TExtPreset = (typeof EXT_PRESETS)[number];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/u;

export function isHHMM(value: unknown): value is string {
  return typeof value === 'string' && HHMM.test(value);
}

export function isLevel(value: unknown): value is TPowerLevel {
  return value === 'display' || value === 'system';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readSettings(raw: unknown): ISettings {
  if (!isRecord(raw)) return structuredClone(EXT_DEFAULT_SETTINGS);
  const merged = { ...structuredClone(EXT_DEFAULT_SETTINGS), ...(raw as Partial<ISettings>) };
  merged.telemetry = raw.telemetry === true;
  merged.notifications = raw.notifications === true;
  if (!EXT_PRESETS.includes(merged.defaultPreset as TExtPreset)) merged.defaultPreset = 'pinf';
  return merged;
}

export function sanitizeSchedule(raw: unknown): ISchedule | null {
  if (!isRecord(raw)) return null;
  const days = Array.isArray(raw.days)
    ? [
        ...new Set(
          raw.days.filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6),
        ),
      ].sort()
    : [];
  if (typeof raw.id !== 'string' || !/^[a-z0-9-]{1,40}$/u.test(raw.id)) return null;
  if (!days.length || !isHHMM(raw.start) || !isHHMM(raw.end) || raw.start === raw.end) return null;
  return { id: raw.id, days, start: raw.start, end: raw.end, level: isLevel(raw.level) ? raw.level : 'display' };
}

export function sanitizeSite(raw: unknown): IAutostartSite | null {
  if (!isRecord(raw) || typeof raw.host !== 'string') return null;
  const host = normalizeHost(raw.host);
  if (!host) return null;
  const minutes = raw.durationMin;
  const durationMin =
    typeof minutes === 'number' && Number.isInteger(minutes) && minutes > 0 && minutes <= 24 * 60 ? minutes : null;
  return { host, durationMin };
}

export function readExt(raw: unknown): IExtSettings {
  if (!isRecord(raw)) return structuredClone(DEFAULT_EXT);
  const autostart = isRecord(raw.autostart) ? raw.autostart : {};
  const schedules = Array.isArray(raw.schedules)
    ? raw.schedules.map(sanitizeSchedule).filter((s): s is ISchedule => s !== null)
    : [];
  const sites = Array.isArray(autostart.sites)
    ? autostart.sites.map(sanitizeSite).filter((s): s is IAutostartSite => s !== null)
    : [];
  return {
    v: 1,
    level: isLevel(raw.level) ? raw.level : 'display',
    schedules: schedules.slice(0, SCHEDULES_MAX),
    autostart: { browserStart: autostart.browserStart === true, sites: sites.slice(0, AUTOSTART_SITES_MAX) },
  };
}

const HOST = /^(\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/u;

export function normalizeHost(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;
  const wildcard = value.startsWith('*.');
  if (wildcard) value = value.slice(2);
  if (/^[a-z][a-z0-9+.-]*:\/\//u.test(value)) {
    if (!value.startsWith('https://')) return null;
    try {
      value = new URL(value).hostname;
    } catch {
      return null;
    }
  } else {
    value = value.split(/[/?#]/u)[0] ?? '';
  }
  value = value.replace(/\.$/u, '');
  const host = `${wildcard ? '*.' : ''}${value}`;
  if (host.length > 253 || !HOST.test(host) || /^\d+(\.\d+)*$/u.test(value)) return null;
  return host;
}

export function originPattern(host: string): string {
  return `https://${host}/*`;
}

export function matchSite(url: string | undefined, sites: readonly IAutostartSite[]): IAutostartSite | null {
  if (!url) return null;
  let hostname: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const site of sites) {
    if (site.host.startsWith('*.')) {
      const base = site.host.slice(2);
      if (hostname === base || hostname.endsWith(`.${base}`)) return site;
    } else if (hostname === site.host) {
      return site;
    }
  }
  return null;
}

export function isExtPreset(value: unknown): value is TExtPreset {
  return typeof value === 'string' && (EXT_PRESETS as readonly string[]).includes(value);
}

export function presetOf(settings: ISettings): TExtPreset {
  const id: TPresetId = settings.defaultPreset;
  return isExtPreset(id) ? id : 'pinf';
}
