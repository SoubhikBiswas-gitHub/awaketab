export const EMBED_VERSION = '1';

export const EMBED_MODES = ['cook', 'standard', 'clock', 'minimal'] as const;
export const EMBED_THEMES = ['auto', 'light', 'dark', 'oled'] as const;
export const EMBED_SIZES = ['compact', 'full'] as const;
export const EMBED_PRESETS = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf', 'until'] as const;
export const EMBED_LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;

type TEmbedMode = (typeof EMBED_MODES)[number];
export type TEmbedTheme = (typeof EMBED_THEMES)[number];
export type TEmbedSize = (typeof EMBED_SIZES)[number];
type TEmbedPreset = (typeof EMBED_PRESETS)[number];
export type TEmbedLocale = (typeof EMBED_LOCALES)[number];

export const EMBED_BOX: Record<TEmbedSize, { width: string; height: number; radius: number }> = {
  compact: { width: '320px', height: 104, radius: 16 },
  full: { width: '100%', height: 240, radius: 28 },
};

export const EMBED_NARROW = { compact: [300, 116], full: [600, 420] } as const;

export function reservedHeight(opts: Pick<IEmbedOptions, 'size' | 'mode'>, width: number): number {
  const [below, height] = EMBED_NARROW[opts.size];
  const narrow = width > 0 && width < below && (opts.size === 'compact' || opts.mode === 'cook');
  return narrow ? height : EMBED_BOX[opts.size].height;
}

export const EMBED_CREDIT_URL = 'https://awaketab.com/?ref=embed&source=embed';
export const EMBED_CREDIT_CLASS = 'awaketab-credit';
export const EMBED_CREDIT_STYLE =
  'display:block;margin:16px 0 0;height:24px;font-size:13px;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
export const EMBED_CREDIT_LINK_STYLE = 'color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px';

export const EMBED_MIN_HEIGHT = 64;
export const EMBED_MAX_HEIGHT = 640;

export const EMBED_PATH = '/embed/cook';

const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const WALL_RE = /^([01]\d|2[0-3])[:-]([0-5]\d)$/;

export function pick<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function isHostname(value: unknown): value is string {
  return typeof value === 'string' && HOST_RE.test(value);
}

export function parseWall(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = WALL_RE.exec(value);
  return m ? `${m[1] ?? '00'}:${m[2] ?? '00'}` : null;
}

export function embedLocale(raw: unknown): TEmbedLocale {
  if (typeof raw !== 'string') return 'en';
  const tag = raw.trim().toLowerCase();
  if ((EMBED_LOCALES as readonly string[]).includes(tag)) return tag as TEmbedLocale;
  const primary = tag.split(/[-_]/)[0] ?? '';
  if (primary === 'pt') return 'pt-br';
  return pick(EMBED_LOCALES, primary, 'en');
}

export interface IEmbedOptions {
  mode: TEmbedMode;
  theme: TEmbedTheme;
  lang: TEmbedLocale;
  size: TEmbedSize;
  preset: TEmbedPreset;
  until: string | null;
}

export interface IEmbedParams extends IEmbedOptions {
  host: string | null;
}

export function optionsFromDataset(data: Record<string, string | undefined>, pageLang: string): IEmbedOptions {
  const until = parseWall(data.until);
  const preset = pick(EMBED_PRESETS, data.preset, 'pinf');
  return {
    mode: pick(EMBED_MODES, data.mode, 'cook'),
    theme: pick(EMBED_THEMES, data.theme, 'auto'),
    lang: embedLocale(data.lang ?? pageLang),
    size: pick(EMBED_SIZES, data.size, 'compact'),
    preset: preset === 'until' && !until ? 'pinf' : preset,
    until: preset === 'until' ? until : null,
  };
}

export function embedQuery(opts: IEmbedOptions, host: string): string {
  const q = new URLSearchParams({
    mode: opts.mode,
    theme: opts.theme,
    lang: opts.lang,
    size: opts.size,
    preset: opts.preset,
  });
  if (opts.until) q.set('until', opts.until.replace(':', '-'));
  if (isHostname(host)) q.set('host', host);
  return q.toString();
}

export function parseEmbedQuery(search: string): IEmbedParams {
  const q = new URLSearchParams(search);
  const opts = optionsFromDataset(
    {
      mode: q.get('mode') ?? undefined,
      theme: q.get('theme') ?? undefined,
      lang: q.get('lang') ?? undefined,
      size: q.get('size') ?? undefined,
      preset: q.get('preset') ?? undefined,
      until: q.get('until') ?? undefined,
    },
    'en',
  );
  const host = q.get('host');
  return { ...opts, host: isHostname(host) ? host : null };
}

// ── postMessage payloads ─────────────────────────────────────────────────────────────────────────

export type TPageMessage =
  | { type: 'awaketab:start'; preset?: Exclude<TEmbedPreset, 'until'>; ms?: number; until?: string }
  | { type: 'awaketab:stop' }
  | { type: 'awaketab:theme'; theme: TEmbedTheme };

export interface IEmbedState {
  lock: string;
  status: string;
  endsAt: number | null;
  mode: TEmbedMode;
}

export type TWidgetMessage =
  | { type: 'awaketab:ready'; version: string }
  | ({ type: 'awaketab:state' } & IEmbedState)
  | { type: 'awaketab:resize'; height: number };

const EMBED_MAX_MS = 7 * 24 * 3_600_000;

function record(data: unknown): Record<string, unknown> | null {
  return data !== null && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

export function parsePageMessage(data: unknown): TPageMessage | null {
  const m = record(data);
  if (!m) return null;
  if (m.type === 'awaketab:stop') return { type: 'awaketab:stop' };
  if (m.type === 'awaketab:theme') {
    const theme = pick(EMBED_THEMES, m.theme, 'auto');
    return m.theme === theme ? { type: 'awaketab:theme', theme } : null;
  }
  if (m.type !== 'awaketab:start') return null;
  const out: Extract<TPageMessage, { type: 'awaketab:start' }> = { type: 'awaketab:start' };
  if (m.preset !== undefined) {
    const preset = pick(EMBED_PRESETS, m.preset, 'pinf');
    if (preset !== m.preset || preset === 'until') return null;
    out.preset = preset;
  }
  if (m.ms !== undefined) {
    if (typeof m.ms !== 'number' || !Number.isInteger(m.ms) || m.ms < 60_000 || m.ms > EMBED_MAX_MS) return null;
    out.ms = m.ms;
  }
  if (m.until !== undefined) {
    const wall = parseWall(m.until);
    if (!wall) return null;
    out.until = wall;
  }
  return out;
}

export function parseWidgetMessage(data: unknown): TWidgetMessage | null {
  const m = record(data);
  if (!m) return null;
  if (m.type === 'awaketab:ready')
    return { type: 'awaketab:ready', version: typeof m.version === 'string' ? m.version.slice(0, 16) : '' };
  if (m.type === 'awaketab:resize') {
    if (typeof m.height !== 'number' || !Number.isFinite(m.height)) return null;
    return {
      type: 'awaketab:resize',
      height: Math.round(Math.min(EMBED_MAX_HEIGHT, Math.max(EMBED_MIN_HEIGHT, m.height))),
    };
  }
  if (m.type === 'awaketab:state') {
    if (typeof m.lock !== 'string' || typeof m.status !== 'string') return null;
    return {
      type: 'awaketab:state',
      lock: m.lock.slice(0, 16),
      status: m.status.slice(0, 16),
      endsAt: typeof m.endsAt === 'number' && Number.isFinite(m.endsAt) ? m.endsAt : null,
      mode: pick(EMBED_MODES, m.mode, 'cook'),
    };
  }
  return null;
}
