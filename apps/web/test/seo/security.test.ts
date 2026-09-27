import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PRODUCTION_LICENSE_PUBLIC_KEYS } from '../../../../packages/core/src/license';
import { servedFile, servedPath } from '../../scripts/served.mjs';

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
  return Promise.all(
    list.map(async (file) => ({ file: path.relative(dist, file), text: await readFile(file, 'utf8') })),
  );
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
    // Not vacuous: the licence verifier's LICENSE_PUBLIC_KEYS JWK is in the bundle and was inspected. The one
    // exception is a production-mode build made before N-03 (no production key yet, check-keys waived): it
    // trusts no key at all, so there is nothing to find.
    const pro = await readFile(path.join(dist, servedFile('/pro')), 'utf8');
    const productionMode = !/https:\/\/sandbox(?:-api)?\.polar\.sh\//u.test(pro);
    if (!productionMode || Object.keys(PRODUCTION_LICENSE_PUBLIC_KEYS).length > 0)
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

const directives = (csp: string) =>
  new Map(
    csp.split(';').map((d) => {
      const [name = '', ...rest] = d.trim().split(/\s+/u);
      return [name, rest.join(' ')] as const;
    }),
  );

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

  const CONTENT = [
    '/for/cooking',
    '/on/iphone-safari',
    '/vs/nosleep-page',
    '/guides/lock-screen-vs-sleep',
    '/learn/how-we-tested',
    '/es/for/cocinar',
    '/pt-br/learn/x',
    '/hi/guides/x',
  ];
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

  it('the shipped _headers ends with the *.pages.dev noindex rules (F-03: previews are never indexed)', () => {
    const hostRules = rules.filter((rule) => !rule.pattern.startsWith('/'));
    expect(hostRules.map((rule) => rule.pattern)).toEqual([
      'https://:project.pages.dev/*',
      'https://:version.:project.pages.dev/*',
    ]);
    expect(rules.slice(-2)).toEqual(hostRules);
    for (const rule of hostRules) expect(rule.set).toEqual([['x-robots-tag', 'noindex']]);
    // Path rules never match a host-qualified pattern, so the production (awaketab.com) view above is unchanged.
    expect(effective(rules, '/').has('x-robots-tag')).toBe(false);
  });

  it('/api/* is no-store and noindex (functions set their own headers too; _headers never reach them)', () => {
    const h = effective(rules, '/api/e');
    expect(h.get('cache-control')).toBe('no-store');
    expect(h.get('x-robots-tag')).toBe('noindex');
  });
});

// A tokenizer rather than a regex: <script> text inside an attribute value (the library page's copyable code
// samples) or a comment is not a script. JSON and other data blocks are not executed and need no hash.
const EXECUTABLE_TYPE = /^(?:|module|importmap|speculationrules|(?:text|application)\/(?:x-)?(?:java|ecma)script)$/iu;
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);

function attributes(raw: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of raw.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gu)) {
    const [, name = '', dq, sq, bare] = m;
    out.set(name.toLowerCase(), dq ?? sq ?? bare ?? '');
  }
  return out;
}

function inlineCode(html: string): { scripts: string[]; handlers: string[] } {
  const scripts: string[] = [];
  const handlers: string[] = [];
  let i = 0;
  while ((i = html.indexOf('<', i)) !== -1) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    const open = /^<([A-Za-z][\w-]*)/u.exec(html.slice(i, i + 64));
    if (!open?.[1]) {
      i += 1;
      continue;
    }
    let j = i + open[0].length;
    let quote = '';
    for (; j < html.length; j += 1) {
      const c = html[j];
      if (quote) {
        if (c === quote) quote = '';
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
    }
    const tag = open[1].toLowerCase();
    const attrs = attributes(html.slice(i + open[0].length, j));
    for (const [name, value] of attrs) {
      if (/^on[a-z]/u.test(name)) handlers.push(`<${tag} ${name}>`);
      if (/^\s*javascript:/iu.test(value)) handlers.push(`<${tag} ${name}="javascript:">`);
    }
    i = j + 1;
    if (!RAW_TEXT.has(tag)) continue;
    const close = new RegExp(`</${tag}[\\s>]`, 'giu');
    close.lastIndex = i;
    const end = close.exec(html)?.index ?? html.length;
    if (tag === 'script' && !attrs.has('src') && EXECUTABLE_TYPE.test((attrs.get('type') ?? '').trim()))
      scripts.push(html.slice(i, end));
    i = end;
  }
  return { scripts, handlers };
}

describe('inline scripts against the served CSP (docs/05 §11)', async () => {
  const { createHash } = await import('node:crypto');
  const headers = await readFile(path.join(dist, '_headers'), 'utf8');
  const rules = parseHeaders(headers);
  const pages = (await files(dist)).filter((f) => f.endsWith('.html')).map((f) => path.relative(dist, f));

  it('the tokenizer finds real scripts and skips data blocks, comments and script text in attributes', () => {
    const { scripts, handlers } = inlineCode(
      '<script>a()</script><script type="module">b()</script><script type="application/ld+json">{}</script>' +
        '<script type="application/json" data-x>{}</script><script src="/x.js"></script><!-- <script>c()</script> -->' +
        '<pre data-code="<script>d()</script>"></pre><button onclick="e()">x</button><a href="javascript:f()">y</a>',
    );
    expect(scripts).toEqual(['a()', 'b()']);
    expect(handlers).toEqual(['<button onclick>', '<a href="javascript:">']);
  });

  it('the whole site allows exactly one inline script hash: the boot script', () => {
    const allowed = new Set([...headers.matchAll(/'sha256-[A-Za-z0-9+/]+=*'/gu)].map((m) => m[0]));
    expect(allowed.size).toBe(1);
  });

  it('checks every built page', () => {
    expect(pages.length).toBeGreaterThan(400);
  });

  // Each page is checked at the URL Pages serves it at (served.mjs), against that route's effective policy. A hash
  // cannot allow an event-handler attribute or a javascript: URL, so none may appear.
  it('every built page runs only the inline boot script, allowed by hash in its route CSP', async () => {
    const failures: string[] = [];
    for (const file of pages) {
      const url = servedPath(file.split(path.sep).join('/'));
      const csp = effective(rules, url).get('content-security-policy');
      if (!csp) {
        failures.push(`${url}: no CSP`);
        continue;
      }
      const d = directives(csp);
      const sources = new Set(
        (d.get('script-src-elem') ?? d.get('script-src') ?? d.get('default-src') ?? '').split(' '),
      );
      if (sources.has("'unsafe-inline'") || sources.has("'unsafe-hashes'")) failures.push(`${url}: unsafe script-src`);
      const { scripts, handlers } = inlineCode(await readFile(path.join(dist, file), 'utf8'));
      if (scripts.length !== 1) failures.push(`${url}: ${String(scripts.length)} inline scripts, expected 1`);
      for (const body of scripts) {
        const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
        if (!sources.has(hash)) failures.push(`${url}: inline script ${hash} not in script-src`);
      }
      for (const h of handlers) failures.push(`${url}: ${h}`);
    }
    expect(failures).toEqual([]);
  });
});
