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
export const EXTEND_AUTO_STOP_MS = 60_000;

const LOCALE_RE = /^(es|pt-br|de|fr|ja|zh|hi)$/;
const THEME_RE = /^(auto|light|dark|oled)$/;
const MODE_RE = /^(standard|clock|focus|minimal|night|message|cook)$/;
const PRESET_RE = /^p(15|30|45|60|120|240|inf)$/;
const UNTIL_RE = /^([01]\d|2[0-3])-[0-5]\d$/;
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
  return segs[0] && LOCALE_RE.test(segs[0]) ? `/${segs.slice(1).join('/')}` : parts;
}

export function canonicalPathname(pathname: string): string {
  const trimmed = pathname.replace(/(.)\/+$/u, '$1');
  return LOCALE_RE.test(trimmed.slice(1)) ? `${trimmed}/` : trimmed;
}

// sanitizeMsg lives in its own module so the boot chunk does not carry it (the message mode and Settings load it).
export { sanitizeMsg } from './msg.js';

export function parseToolParams(loc: Pick<Location, 'pathname' | 'search'>, dataset: DOMStringMap): IUrlParams {
  const path = stripLocale(loc.pathname);
  const q = new URLSearchParams(loc.search);
  const routePreset = PRESET_ROUTES[path] ?? null;
  const invalid: string[] = [];
  const pick = (name: string, re: RegExp, raw = q.get(name)): string | null =>
    raw ? (re.test(raw) ? raw : (invalid.push(name), null)) : null;
  const theme = pick('theme', THEME_RE) as TTheme | null;
  const mode = pick('mode', MODE_RE, q.get('mode') ?? dataset.mode) as TAmbientMode | null;
  const preset = pick('preset', PRESET_RE, q.get('preset') ?? dataset.preset) as TPresetId | null;
  const until = pick('until', UNTIL_RE)?.replace('-', ':') ?? null;
  const ref = pick('ref', REF_RE);
  const source = pick('source', REF_RE);
  const wall = path.slice(7);
  const routeUntil = path.startsWith('/until/') && UNTIL_RE.test(wall) ? wall.replace('-', ':') : null;
  // sampled later; keep a flag on dataset for tests
  if (invalid.length > 0) dataset.atBadParam = invalid.join(',');

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
    // Raw and length-bounded here; the message mode sanitises it with sanitizeMsg() before showing it.
    msg: (q.get('msg') ?? '').slice(0, 400),
    autostart: q.get('autostart') === '1',
    ref,
    source,
    eightHour: routePreset === 'eight',
    routePreset,
    routeUntil,
    isPip,
    isToolAutostartRoute,
    // The address bar keeps its locale prefix (/es/for/cocinar, not /for/cocinar); only the query and a
    // trailing slash go, matching the canonical link — except on a locale home, whose canonical URL is `/es/`
    // (the one directory index Cloudflare Pages serves; docs/14 §2.1).
    canonicalPath: canonicalPathname(loc.pathname),
  };
}
