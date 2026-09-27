/**
 * Snippets and URLs the /embed and /kiosk landing pages generate (E12-T02). The same functions render the
 * default snippet at build time and power the in-page generators, so what a site owner copies is exactly what
 * the loader parses (protocol.ts).
 */
import {
  EMBED_BOX,
  EMBED_CREDIT_CLASS,
  EMBED_CREDIT_LINK_STYLE,
  EMBED_CREDIT_STYLE,
  EMBED_CREDIT_URL,
  EMBED_PATH,
  embedQuery,
  type IEmbedOptions,
  type TEmbedLocale,
} from './protocol.js';

export const SITE_ORIGIN = 'https://awaketab.com';

/** Loader sandbox tokens (kept in step with loader.ts EMBED_SANDBOX by test/tool/embed-snippet.test.ts). */
export const SNIPPET_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export interface ISnippetOptions extends Omit<IEmbedOptions, 'lang'> {
  /** `null` → follow the host page's `<html lang>` (no data-lang attribute). */
  lang: TEmbedLocale | null;
}

export const DEFAULT_SNIPPET: ISnippetOptions = { mode: 'cook', theme: 'auto', lang: null, size: 'compact', preset: 'pinf', until: null };

/** The one tag sites paste (docs/11 §1). Defaults are written out so the tag documents itself. */
export function loaderSnippet(opts: ISnippetOptions, origin = SITE_ORIGIN): string {
  const attrs = [`data-mode="${opts.mode}"`, `data-theme="${opts.theme}"`, `data-size="${opts.size}"`];
  if (opts.lang) attrs.push(`data-lang="${opts.lang}"`);
  if (opts.preset !== 'pinf') attrs.push(`data-preset="${opts.preset}"`);
  if (opts.preset === 'until' && opts.until) attrs.push(`data-until="${opts.until}"`);
  return `<script async src="${origin}/embed.js" ${attrs.join(' ')}></script>`;
}

const escapeHtml = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

/**
 * The credit line as plain HTML (O-47): what the loader inserts after its iframe, for sites that paste the bare
 * iframe. Same class, URL, `rel="nofollow"` and inline styles as `loader.ts` `mountCredit()`.
 */
export function creditSnippet(text = 'Keep awake by AwakeTab'): string {
  return `<div class="${EMBED_CREDIT_CLASS}" style="${EMBED_CREDIT_STYLE}"><a href="${EMBED_CREDIT_URL}" rel="nofollow" style="${EMBED_CREDIT_LINK_STYLE}">${escapeHtml(text)}</a></div>`;
}

/**
 * For platforms that strip <script>: the bare iframe, then the credit line. The iframe must keep
 * `allow="screen-wake-lock"`; the credit stays unless the domain holds an Embed licence.
 */
export function iframeSnippet(opts: ISnippetOptions, title: string, origin = SITE_ORIGIN, credit?: string): string {
  const box = EMBED_BOX[opts.size];
  const query = embedQuery({ ...opts, lang: opts.lang ?? 'en' }, '');
  return [
    `<iframe src="${origin}${EMBED_PATH}?${query}"`,
    `  title="${escapeHtml(title)}"`,
    '  allow="screen-wake-lock"',
    '  loading="lazy"',
    '  referrerpolicy="strict-origin"',
    `  sandbox="${SNIPPET_SANDBOX}"`,
    `  style="width:${box.width};max-width:100%;height:${String(box.height)}px;border:0;border-radius:${String(box.radius)}px;display:block"></iframe>`,
    creditSnippet(credit),
  ].join('\n');
}

export const KIOSK_MODES = ['message', 'clock', 'minimal', 'standard', 'night'] as const;
export type TKioskMode = (typeof KIOSK_MODES)[number];

export interface IKioskUrlOptions {
  preset: 'p15' | 'p30' | 'p45' | 'p60' | 'p120' | 'p240' | 'pinf';
  mode: TKioskMode;
  theme: 'auto' | 'light' | 'dark' | 'oled';
  msg: string;
  autostart: boolean;
  /** Kiosk licence extras (docs/09 §7.2): an https logo URL and the licence token for the `#lic=` hash. */
  logo: string;
  token: string;
}

const TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;

/**
 * Builder-side tidy-up of `msg=`: no control/format characters, single spaces, ≤ 80 code points. The tool
 * re-sanitizes on load (params.ts sanitizeMsg); this module deliberately does not import the tool's params.ts,
 * which would make Rollup split it out of the tool's critical chunk.
 */
export function kioskMsg(raw: string): string {
  const clean = raw.normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/gu, ' ').trim();
  return Array.from(clean).slice(0, 80).join('');
}

/** A kiosk start URL. Free params first; the licence token goes in the hash so it never reaches a server. */
export function kioskUrl(opts: IKioskUrlOptions, origin = SITE_ORIGIN): string {
  const q = new URLSearchParams();
  q.set('autostart', opts.autostart ? '1' : '0');
  if (opts.preset !== 'pinf') q.set('preset', opts.preset);
  q.set('mode', opts.mode);
  const msg = kioskMsg(opts.msg);
  if (opts.mode === 'message' && msg) q.set('msg', msg);
  q.set('theme', opts.theme);
  let logo = '';
  try {
    const url = new URL(opts.logo.trim());
    if (url.protocol === 'https:' && !url.username && !url.password) logo = url.href;
  } catch {
    logo = '';
  }
  if (logo) q.set('logo', logo);
  const token = opts.token.trim();
  return `${origin}/?${q.toString()}${TOKEN_RE.test(token) ? `#lic=${token}` : ''}`;
}
