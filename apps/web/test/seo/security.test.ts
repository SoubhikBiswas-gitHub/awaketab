import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/*
 * Security checks over the built site (docs/19 §E, docs/17 §2, docs/14 §3):
 * 1. no secret — by name or by its .dev.vars.example value — and no private key material in any file that
 *    ships to the browser;
 * 2. every route class gets the docs/14 §3 security headers from the generated _headers, resolved the way
 *    Cloudflare Pages applies them (all matching rules in order; `! Name` detaches; a header set again by a
 *    later matching rule is joined with ", ").
 */

const dist = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.resolve(import.meta.dirname, '../../dist');
const devVars = path.resolve(import.meta.dirname, '../../.dev.vars.example');

// docs/00 §10 / docs/19 §B8: server-only secrets (Pages Functions env). LICENSE_SIGNING_VER is a plain number.
const SECRET_NAMES = [
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'POLAR_ORGANIZATION_ID',
  'POLAR_BENEFIT_MAP',
  'LICENSE_SIGNING_KEY',
  'LICENSE_KEY_ENC_KEY',
  'RATE_LIMIT_SALT',
  'TURNSTILE_SECRET_KEY',
];

const TEXT = /\.(html|js|mjs|css|json|webmanifest|txt|xml|svg|map)$|^_headers$|^_redirects$/u;

async function files(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(full)));
    else if (TEXT.test(entry.name)) out.push(full);
  }
  return out;
}

async function clientFiles(): Promise<Array<{ file: string; text: string }>> {
  const list = await files(dist);
  return Promise.all(list.map(async (file) => ({ file: path.relative(dist, file), text: await readFile(file, 'utf8') })));
}

function devVarValues(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of raw.split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/u.exec(line.trim());
    if (m?.[1] && m[2] !== undefined) map.set(m[1], m[2].replace(/^["']|["']$/gu, ''));
  }
  return map;
}

describe('no secrets in client files', () => {
  it('scans a real build', async () => {
    const all = await clientFiles();
    expect(all.length).toBeGreaterThan(400);
    expect(all.some((f) => f.file.startsWith('_astro/') && f.file.endsWith('.js'))).toBe(true);
  });

  it('no secret name appears anywhere in dist', async () => {
    const hits: string[] = [];
    for (const { file, text } of await clientFiles()) {
      for (const name of SECRET_NAMES) if (text.includes(name)) hits.push(`${file}: ${name}`);
    }
    expect(hits).toEqual([]);
  });

  it('no secret value from .dev.vars.example appears anywhere in dist', async () => {
    const values = devVarValues(await readFile(devVars, 'utf8'));
    const needles: Array<[string, string]> = [];
    for (const name of SECRET_NAMES) {
      const value = values.get(name);
      expect(value, `${name} is listed in .dev.vars.example`).toBeTruthy();
      if (!value || value.length < 8) continue;
      needles.push([name, value]);
      // A JWK-shaped signing key: its private scalar must not leak on its own either.
      const d = /"d"\s*:\s*"([\w-]{16,})"/u.exec(value)?.[1];
      if (d) needles.push([`${name}.d`, d]);
    }
    expect(needles.length).toBeGreaterThan(3);
    const hits: string[] = [];
    for (const { file, text } of await clientFiles()) {
      for (const [name, value] of needles) if (text.includes(value)) hits.push(`${file}: ${name}`);
    }
    expect(hits).toEqual([]);
  });

  it('no private key material: no JWK "d" member, no PEM private key', async () => {
    const hits: string[] = [];
    let publicJwks = 0;
    for (const { file, text } of await clientFiles()) {
      // Public JWKs (kty/crv/x/y) are expected in the licence verifier; a private one carries "d".
      for (const m of text.matchAll(/\{[^{}]*"kty"\s*:[^{}]*\}/gu)) {
        if (/"d"\s*:/u.test(m[0])) hits.push(`${file}: JWK with "d"`);
      }
      for (const m of text.matchAll(/\{[^{}]*\bkty\s*:[^{}]*\}/gu)) {
        publicJwks += 1;
        if (/[{,]\s*d\s*:/u.test(m[0])) hits.push(`${file}: JWK literal with d`);
      }
      if (/-----BEGIN (?:EC |RSA |ENCRYPTED )?PRIVATE KEY-----/u.test(text)) hits.push(`${file}: PEM private key`);
    }
    expect(hits).toEqual([]);
    // Not vacuous: the licence verifier's LICENSE_PUBLIC_KEYS JWK is in the bundle and was inspected.
    expect(publicJwks).toBeGreaterThan(0);
  });
});

interface IRule {
  pattern: string;
  set: Array<[string, string]>;
  detach: string[];
}

function parseHeaders(raw: string): IRule[] {
  const rules: IRule[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/u.test(line)) {
      rules.push({ pattern: line.trim(), set: [], detach: [] });
      continue;
    }
    const rule = rules[rules.length - 1];
    if (!rule) throw new Error(`header line before any rule: ${line}`);
    const body = line.trim();
    if (body.startsWith('!')) rule.detach.push(body.slice(1).trim().toLowerCase());
    else {
      const i = body.indexOf(':');
      rule.set.push([body.slice(0, i).trim().toLowerCase(), body.slice(i + 1).trim()]);
    }
  }
  return rules;
}

function matches(pattern: string, pathname: string): boolean {
  const re = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replace(/\*/gu, '.*')}$`, 'u');
  return re.test(pathname);
}

/** Effective headers for a path, applying every matching rule in file order as Cloudflare Pages does. */
function effective(rules: IRule[], pathname: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const rule of rules) {
    if (!matches(rule.pattern, pathname)) continue;
    for (const name of rule.detach) out.delete(name);
    for (const [name, value] of rule.set) {
      const prev = out.get(name);
      out.set(name, prev === undefined ? value : `${prev}, ${value}`);
    }
  }
  return out;
}

const directives = (csp: string) => new Map(csp.split(';').map((d) => {
  const [name = '', ...rest] = d.trim().split(/\s+/u);
  return [name, rest.join(' ')] as const;
}));

describe('security headers per route class (docs/14 §3)', async () => {
  const rules = parseHeaders(await readFile(path.join(dist, '_headers'), 'utf8'));

  const COMMON: Array<[string, string | RegExp]> = [
    ['strict-transport-security', 'max-age=63072000; includeSubDomains; preload'],
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['cross-origin-opener-policy', 'same-origin-allow-popups'],
    ['permissions-policy', /(^|, )screen-wake-lock=\(self\), picture-in-picture=\(self\)/u],
    ['reporting-endpoints', 'csp="/api/csp"'],
  ];

  const expectCommon = (h: Map<string, string>, where: string) => {
    for (const [name, want] of COMMON) {
      const got = h.get(name);
      expect(got, `${where}: ${name}`).toBeDefined();
      if (typeof want === 'string') expect(got, `${where}: ${name}`).toBe(want);
      else expect(got, `${where}: ${name}`).toMatch(want);
    }
    // One policy, never two joined by Cloudflare (a joined CSP would be parsed as one broken policy).
    const csp = h.get('content-security-policy') ?? '';
    expect(csp.split(', default-src').length, `${where}: single CSP`).toBe(1);
  };

  const TOOL = ['/', '/30m', '/8h', '/until/17-30', '/es/', '/pro', '/pro/activate', '/about', '/privacy', '/404'];
  it.each(TOOL)('tool/app route %s: strict CSP, no framing, no third parties', (p) => {
    const h = effective(rules, p);
    expectCommon(h, p);
    const csp = directives(h.get('content-security-policy') ?? '');
    expect(csp.get('default-src')).toBe("'self'");
    // 'self' plus exactly one hash: the inline boot script (src/boot/boot.js). Never 'unsafe-inline'.
    expect(csp.get('script-src')).toMatch(/^'self' 'sha256-[A-Za-z0-9+/]+=*'$/u);
    expect(csp.get('connect-src')).toBe("'self'");
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(csp.has('upgrade-insecure-requests')).toBe(true);
    expect(h.get('x-frame-options')).toBe('DENY');
  });

  const CONTENT = ['/for/cooking', '/on/iphone-safari', '/vs/nosleep-page', '/guides/modern-standby', '/learn/how-we-tested', '/es/for/cocinar', '/pt-br/learn/x', '/hi/guides/x'];
  it.each(CONTENT)('content route %s: its own network CSP (not joined), still no framing', (p) => {
    const h = effective(rules, p);
    expectCommon(h, p);
    const csp = directives(h.get('content-security-policy') ?? '');
    expect(csp.get('default-src')).toBe("'self'");
    expect(csp.get('script-src')).toContain('https://pagead2.googlesyndication.com');
    expect(csp.get('frame-ancestors')).toBe("'none'");
    expect(h.get('x-frame-options')).toBe('DENY');
  });

  it('/embed/* may be framed anywhere, is noindex, and keeps the rest', () => {
    const h = effective(rules, '/embed/cook');
    expectCommon(h, '/embed/cook');
    expect(directives(h.get('content-security-policy') ?? '').get('frame-ancestors')).toBe('*');
    expect(h.has('x-frame-options')).toBe(false);
    expect(h.get('x-robots-tag')).toBe('noindex');
  });

  it.each(['/pip', '/es/pip', '/zh/pip'])('%s is noindex with the tool CSP', (p) => {
    const h = effective(rules, p);
    expectCommon(h, p);
    expect(h.get('x-robots-tag')).toBe('noindex');
    expect(directives(h.get('content-security-policy') ?? '').get('frame-ancestors')).toBe("'none'");
  });

  // A Cache-Control joined with the /* default ("public, max-age=0, must-revalidate, public, max-age=31536000,
  // immutable") carries two max-age values; caches may pick either, so each class must end with exactly one.
  it.each([
    ['/_astro/main.abc123.js', 'public, max-age=31536000, immutable'],
    ['/assets/x.png', 'public, max-age=31536000, immutable'],
    ['/sw.js', 'no-cache'],
    ['/config/sponsor.json', 'public, max-age=300'],
    ['/', 'public, max-age=0, must-revalidate'],
    ['/for/cooking', 'public, max-age=0, must-revalidate'],
  ])('%s has a single Cache-Control policy', (p, want) => {
    expect(effective(rules, p).get('cache-control')).toBe(want);
  });

  it('/api/* is no-store and noindex (functions set their own headers too; _headers never reach them)', () => {
    const h = effective(rules, '/api/e');
    expect(h.get('cache-control')).toBe('no-store');
    expect(h.get('x-robots-tag')).toBe('noindex');
  });
});

describe('inline boot script (docs/05 §11)', () => {
  it('every built page carries only inline scripts whose sha256 the route CSP allows', async () => {
    const { createHash } = await import('node:crypto');
    const headers = await readFile(path.join(dist, '_headers'), 'utf8');
    const allowed = new Set([...headers.matchAll(/'sha256-[A-Za-z0-9+/]+=*'/gu)].map((m) => m[0]));
    expect(allowed.size).toBe(1);
    const pages = ['index.html', '30m/index.html', 'for/cooking/index.html', 'es/index.html', 'embed/cook/index.html', 'pro/index.html'];
    for (const page of pages) {
      const html = await readFile(path.join(dist, page), 'utf8');
      // Executable inline scripts only: JSON data blocks are not scripts and need no hash.
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>([\s\S]*?)<\/script>/gu)];
      expect(inline.length, page).toBe(1);
      for (const [, body = ''] of inline) {
        const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
        expect(allowed.has(hash), `${page}: inline script hash not in CSP`).toBe(true);
      }
    }
  });
});
