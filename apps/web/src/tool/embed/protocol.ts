/**
 * AwakeTab Embed contract (docs/11 §1–§3), shared by the host-page loader (`loader.ts` → `public/embed.js`,
 * ≤ 3 KB gz) and the iframe app (`app.ts` at `/embed/cook`, ≤ 25 KB gz). Everything that crosses the
 * page ↔ widget boundary — loader data-* attributes, iframe query params, postMessage payloads — is parsed
 * here against allow-lists; anything else is dropped. Keep this module dependency-free: it is bundled into
 * the loader.
 */

/** Protocol version sent in `awaketab:ready` (docs/00 §13.10). */
export const EMBED_VERSION = '1';

export const EMBED_MODES = ['cook', 'standard', 'clock', 'minimal'] as const;
export const EMBED_THEMES = ['auto', 'light', 'dark', 'oled'] as const;
export const EMBED_SIZES = ['compact', 'full'] as const;
export const EMBED_PRESETS = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf', 'until'] as const;
export const EMBED_LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;

export type TEmbedMode = (typeof EMBED_MODES)[number];
export type TEmbedTheme = (typeof EMBED_THEMES)[number];
export type TEmbedSize = (typeof EMBED_SIZES)[number];
export type TEmbedPreset = (typeof EMBED_PRESETS)[number];
export type TEmbedLocale = (typeof EMBED_LOCALES)[number];

/** Box the loader reserves before the iframe loads (no CLS on the host page, docs/11 §6). */
export const EMBED_BOX: Record<TEmbedSize, { width: string; height: number }> = {
  compact: { width: '320px', height: 96 },
  full: { width: '100%', height: 240 },
};

/** `awaketab:resize` heights outside this range are clamped by the loader. */
export const EMBED_MIN_HEIGHT = 64;
export const EMBED_MAX_HEIGHT = 640;

/** The iframe route (docs/00 §7). */
export const EMBED_PATH = '/embed/cook';

/** Lower-case DNS hostname or IPv4 literal — what `location.hostname` yields; no ports, no IPv6 brackets. */
const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const WALL_RE = /^([01]\d|2[0-3])[:-]([0-5]\d)$/;

export function pick<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function isHostname(value: unknown): value is string {
  return typeof value === 'string' && HOST_RE.test(value);
}

/** `HH:MM` or `HH-MM` → `HH:MM`, else null. */
export function parseWall(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = WALL_RE.exec(value);
  return m ? `${m[1] ?? '00'}:${m[2] ?? '00'}` : null;
}

/**
 * Maps a BCP 47 tag (`data-lang`, or the host page's `<html lang>`) to one of the eight locales:
 * `pt-BR`/`pt` → `pt-br`, `zh-Hans`/`zh-CN` → `zh`, `en-US` → `en`; anything else → `en`.
 */
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
  /** `HH:MM`, only with `preset: 'until'`. */
  until: string | null;
}

export interface IEmbedParams extends IEmbedOptions {
  /** Embedding page hostname as the loader reported it (analytics only — never trusted for licensing). */
  host: string | null;
}

/** Loader side: `<script data-*>` attributes → validated options. */
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

/** The iframe's query string, in the order docs/11 §1 shows it. */
export function embedQuery(opts: IEmbedOptions, host: string): string {
  const q = new URLSearchParams({ mode: opts.mode, theme: opts.theme, lang: opts.lang, size: opts.size, preset: opts.preset });
  if (opts.until) q.set('until', opts.until.replace(':', '-'));
  if (isHostname(host)) q.set('host', host);
  return q.toString();
}

/** Widget side: the iframe's own `location.search` → validated params (unknown values fall back to defaults). */
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

/** Upper bound for `awaketab:start { ms }`: 7 days, the same as CUSTOM_MAX_MS (docs/00 §13.1). */
export const EMBED_MAX_MS = 7 * 24 * 3_600_000;

function record(data: unknown): Record<string, unknown> | null {
  return data !== null && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

/** Widget side: a message from the host page → a command, or null when it is not one of ours / malformed. */
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

/** Loader side: a message from the widget → an event, or null. */
export function parseWidgetMessage(data: unknown): TWidgetMessage | null {
  const m = record(data);
  if (!m) return null;
  if (m.type === 'awaketab:ready') return { type: 'awaketab:ready', version: typeof m.version === 'string' ? m.version.slice(0, 16) : '' };
  if (m.type === 'awaketab:resize') {
    if (typeof m.height !== 'number' || !Number.isFinite(m.height)) return null;
    return { type: 'awaketab:resize', height: Math.round(Math.min(EMBED_MAX_HEIGHT, Math.max(EMBED_MIN_HEIGHT, m.height))) };
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
