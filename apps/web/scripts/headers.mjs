import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const CONTENT_FAMILIES = ['for', 'on', 'vs', 'guides', 'learn'];

// The one inline script (src/boot/boot.js, inlined by BaseLayout and /embed/cook) is allowed by its hash, not
// by 'unsafe-inline' (docs/05 §11, docs/14 §3). test/seo checks the built pages carry exactly these bytes.
export const BOOT_HASH = `'sha256-${createHash('sha256')
  .update(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/boot/boot.js')))
  .digest('base64')}'`;

const DEFAULT_CSP = [
  "default-src 'self'",
  `script-src 'self' ${BOOT_HASH}`,
  "style-src 'self' 'unsafe-inline'",
  // `https:` images: the Kiosk licence's operator logo (`logo=`, docs/09 §7.2) is the only image a tool route
  // may load from another host, and only when a licensed kiosk URL asks for it. Scripts, styles, fonts and
  // connections stay 'self' (docs/14 §3; decision recorded in docs/00 §13.10).
  "img-src 'self' data: https:",
  "media-src 'self' data:",
  "connect-src 'self'",
  "font-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://polar.sh https://*.polar.sh",
  'upgrade-insecure-requests',
  'report-to csp',
].join('; ');

const CONTENT_CSP = [
  "default-src 'self'",
  `script-src 'self' ${BOOT_HASH} https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://*.googletagservices.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' data:",
  "connect-src 'self' https://*.google.com https://*.doubleclick.net",
  'frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  'report-to csp',
].join('; ');

const EMBED_CSP =
  `default-src 'self'; script-src 'self' ${BOOT_HASH}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'self'; frame-ancestors *`;

const contentRoutes = [
  ...CONTENT_FAMILIES.map((family) => `/${family}/*`),
  ...LOCALES.flatMap((locale) =>
    CONTENT_FAMILIES.map((family) => `/${locale}/${family}/*`),
  ),
];

// Routes are the URLs Pages serves with a 200 (scripts/served.mjs): `/embed`, `/pip`, `/for/cooking` — never
// `/embed/`, which Pages 308-redirects to `/embed` because the build writes `embed.html` (docs/14 §2.1).
// Cloudflare Pages applies every matching rule and joins a header set twice with ", ". Rules that replace
// a /* default (CSP on content routes, Cache-Control on assets) detach it first with `! Name`; otherwise
// /_astro/* would ship "public, max-age=0, must-revalidate, public, max-age=31536000, immutable".
export function generateHeaders() {
  const content = contentRoutes
    .map(
      (route) => `${route}
  ! Content-Security-Policy
  Content-Security-Policy: ${CONTENT_CSP}`,
    )
    .join('\n\n');

  return `/*
  Content-Security-Policy: ${DEFAULT_CSP}
  Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self), camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  X-Frame-Options: DENY
  Reporting-Endpoints: csp="/api/csp"
  Cache-Control: public, max-age=0, must-revalidate

${content}

/embed/*
  ! Content-Security-Policy
  Content-Security-Policy: ${EMBED_CSP}
  ! X-Frame-Options
  X-Robots-Tag: noindex

/embed
  ! Content-Security-Policy
  Content-Security-Policy: ${DEFAULT_CSP}
  ! X-Frame-Options
  X-Frame-Options: DENY
  ! X-Robots-Tag

/embed.js
  ! Cache-Control
  Cache-Control: public, max-age=3600

/embed/assets/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable

${['/pip', ...LOCALES.map((locale) => `/${locale}/pip`)]
  .map((route) => `${route}
  X-Robots-Tag: noindex`)
  .join('\n\n')}

/config/*
  ! Cache-Control
  Cache-Control: public, max-age=300

/sw.js
  ! Cache-Control
  Cache-Control: no-cache
  Service-Worker-Allowed: /

/_astro/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable

/api/*
  ! Cache-Control
  Cache-Control: no-store
  X-Robots-Tag: noindex
`;
}

export function generateRedirects() {
  return `https://www.awaketab.com/* https://awaketab.com/:splat 301
/en/* /:splat 301
/support-matrix /learn/browser-support-matrix 301
/how-we-tested /learn/how-we-tested 301
/pro/buy /pro 302
`;
}

/** Header rules in file order: `{ route, set: [[name, value]], detach: [name] }` (Cloudflare `_headers` syntax). */
export function parseHeaderRules(text) {
  const rules = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/u.test(line)) {
      rules.push({ route: line.trim(), set: [], detach: [] });
      continue;
    }
    const rule = rules.at(-1);
    if (!rule) continue;
    const body = line.trim();
    if (body.startsWith('!')) rule.detach.push(body.slice(1).trim().toLowerCase());
    else {
      const i = body.indexOf(':');
      rule.set.push([body.slice(0, i).trim().toLowerCase(), body.slice(i + 1).trim()]);
    }
  }
  return rules;
}

function routeMatches(route, pathname) {
  if (!route.startsWith('/')) return false;
  const escaped = route.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`, 'u').test(pathname);
}

/**
 * The headers Cloudflare Pages would send for `pathname`: every matching rule applies in file order; `! Name`
 * detaches a header set by an earlier (less specific) rule; a header set twice is joined with ", ".
 * Header names are lower-cased. Used by tests to assert the per-route security contract (docs/14 §3).
 */
export function resolveHeaders(text, pathname) {
  const out = new Map();
  for (const rule of parseHeaderRules(text)) {
    if (!routeMatches(rule.route, pathname)) continue;
    for (const name of rule.detach) out.delete(name);
    for (const [name, value] of rule.set) out.set(name, out.has(name) ? `${out.get(name)}, ${value}` : value);
  }
  return out;
}

export function parseRules(text) {
  return text
    .trim()
    .split(/\n(?=\/|https:\/\/)/u)
    .map((block) => {
      const [route, ...lines] = block.trim().split('\n');
      return {
        route,
        headers: lines
          .map((line) => line.trim())
          .filter((line) => line.includes(':'))
          .map((line) => line.slice(0, line.indexOf(':'))),
      };
    });
}

async function writeGeneratedFiles() {
  const publicDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../public',
  );
  await mkdir(publicDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(publicDirectory, '_headers'), generateHeaders()),
    writeFile(path.join(publicDirectory, '_redirects'), generateRedirects()),
  ]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeGeneratedFiles();
}
