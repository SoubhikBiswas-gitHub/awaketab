import type { TAmbientMode, TPresetId, TTheme } from '@awaketab/core';

export const PRESET_ROUTES: Record<string, TPresetId | 'eight'> = {
  '/15m': 'p15',
  '/30m': 'p30',
  '/45m': 'p45',
  '/1h': 'p60',
  '/2h': 'p120',
  '/4h': 'p240',
  '/8h': 'eight',
};

export const EIGHT_H_MS = 480 * 60_000;
export const EXTEND_AUTO_STOP_MS = 5 * 60_000;
export const CUSTOM_MIN_MS = 60_000;

const LOCALES = new Set(['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi']);
const THEMES = new Set<TTheme>(['auto', 'light', 'dark', 'oled']);
const MODES = new Set<TAmbientMode>([
  'standard',
  'clock',
  'focus',
  'minimal',
  'night',
  'message',
  'cook',
]);
const PRESETS = new Set<TPresetId>(['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf']);
const UNTIL_RE = /^([01]\d|2[0-3])-([0-5]\d)$/;
const REF_RE = /^[a-z0-9_-]{1,32}$/;

export interface IUrlParams {
  theme: TTheme | null;
  mode: TAmbientMode | null;
  preset: TPresetId | null;
  until: string | null;
  msg: string;
  autostart: boolean;
  ref: string | null;
  source: string | null;
  eightHour: boolean;
  routePreset: TPresetId | 'eight' | null;
  routeUntil: string | null;
  isPip: boolean;
  isToolAutostartRoute: boolean;
  canonicalPath: string;
}

export function stripLocale(pathname: string): string {
  const parts = pathname.replace(/\/+$/, '') || '/';
  const segs = parts.split('/').filter(Boolean);
  if (segs[0] && LOCALES.has(segs[0])) {
    const rest = `/${segs.slice(1).join('/')}`;
    return rest === '/' ? '/' : rest;
  }
  return parts === '' ? '/' : parts;
}

export function sanitizeMsg(raw: string): string {
  const nfc = raw.normalize('NFC');
  const stripped = Array.from(nfc)
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c < 32 || (c >= 127 && c < 160)) return false;
      if (c >= 0x202a && c <= 0x202e) return false;
      if (c >= 0x2066 && c <= 0x2069) return false;
      return true;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(stripped).slice(0, 80).join('');
}

export function parseToolParams(
  loc: Pick<Location, 'pathname' | 'search'>,
  dataset: DOMStringMap,
): IUrlParams {
  const path = stripLocale(loc.pathname);
  const q = new URLSearchParams(loc.search);
  const themeRaw = q.get('theme');
  const modeRaw = q.get('mode') ?? dataset.mode ?? null;
  const presetRaw = q.get('preset');
  const untilQ = q.get('until');
  const refRaw = q.get('ref');
  const sourceRaw = q.get('source');
  const untilMatch = path.match(/^\/until\/([0-2]\d-[0-5]\d)$/);
  const routePreset = PRESET_ROUTES[path] ?? null;
  const invalid: string[] = [];

  const theme = themeRaw && THEMES.has(themeRaw as TTheme) ? (themeRaw as TTheme) : themeRaw ? (invalid.push('theme'), null) : null;
  const mode = modeRaw && MODES.has(modeRaw as TAmbientMode) ? (modeRaw as TAmbientMode) : modeRaw ? (invalid.push('mode'), null) : null;
  let preset: TPresetId | null = null;
  if (presetRaw) {
    if (PRESETS.has(presetRaw as TPresetId)) preset = presetRaw as TPresetId;
    else invalid.push('preset');
  }
  let until: string | null = null;
  if (untilQ) {
    if (UNTIL_RE.test(untilQ)) until = untilQ.replace('-', ':');
    else invalid.push('until');
  }
  const routeUntil = untilMatch && UNTIL_RE.test(untilMatch[1] ?? '') ? (untilMatch[1] ?? '').replace('-', ':') : null;
  const ref = refRaw && REF_RE.test(refRaw) ? refRaw : refRaw ? (invalid.push('ref'), null) : null;
  const source = sourceRaw && REF_RE.test(sourceRaw) ? sourceRaw : sourceRaw ? (invalid.push('source'), null) : null;
  if (invalid.length > 0) {
    // sampled later; keep a flag on dataset for tests
    dataset.atBadParam = invalid.join(',');
  }

  const isPip = path === '/pip' || dataset.pip === '1';
  const isContent = /\/(for|on|vs|guides|learn)(\/|$)/.test(path);
  const autostartOff = q.get('autostart') === '0' || dataset.autostart === '0';
  const isToolAutostartRoute =
    !autostartOff &&
    !isContent &&
    !isPip &&
    (path === '/' || routePreset !== null || routeUntil !== null || q.get('autostart') === '1');

  return {
    theme,
    mode,
    preset,
    until,
    msg: sanitizeMsg(q.get('msg') ?? ''),
    autostart: q.get('autostart') === '1',
    ref,
    source,
    eightHour: routePreset === 'eight',
    routePreset,
    routeUntil,
    isPip,
    isToolAutostartRoute,
    canonicalPath: path,
  };
}

export function wallFromHyphen(s: string): string {
  return s.includes(':') ? s : s.replace('-', ':');
}
