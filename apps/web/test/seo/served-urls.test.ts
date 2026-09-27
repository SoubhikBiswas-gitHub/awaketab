import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseHeaderRules } from '../../scripts/headers.mjs';
import { isServedPath, LOCALES, servedFile, servedPath } from '../../scripts/served.mjs';

const dist = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.resolve(import.meta.dirname, '../../dist');
const ORIGIN = 'https://awaketab.com';

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const all = (await walk(dist)).map((file) => path.relative(dist, file).split(path.sep).join('/'));
const pages = all.filter((file) => file.endsWith('.html'));
const built = new Set(all);
const html = new Map(await Promise.all(pages.map(async (file) => [file, await readFile(path.join(dist, file), 'utf8')] as const)));
// The /embed/cook iframe app is noindex and deliberately names no canonical (docs/11 §7).
const NO_CANONICAL = new Set(['embed/cook.html']);
const sitemaps = all.filter((file) => /^sitemap-[a-z-]+\.xml$/u.test(file) && file !== 'sitemap-index.xml');

const pathnameOf = (href: string): string => new URL(href).pathname;

function problem(pathname: string): string | null {
  if (!isServedPath(pathname)) return `${pathname} is a spelling Cloudflare Pages redirects (308)`;
  const file = servedFile(pathname);
  return built.has(file) ? null : `${pathname} → ${file} is not in dist`;
}

function expectServed(urls: Iterable<[where: string, pathname: string]>): number {
  const failures: string[] = [];
  let n = 0;
  for (const [where, pathname] of urls) {
    n += 1;
    const why = problem(pathname);
    if (why) failures.push(`${where}: ${why}`);
  }
  expect(failures).toEqual([]);
  return n;
}

describe('served URL helpers (scripts/served.mjs)', () => {
  it('maps URLs to the file Pages serves them from, and back', () => {
    const cases: Array<[string, string]> = [
      ['/', 'index.html'],
      ['/30m', '30m.html'],
      ['/for', 'for.html'],
      ['/for/cooking', 'for/cooking.html'],
      ['/es/', 'es/index.html'],
      ['/es/for/cocinar', 'es/for/cocinar.html'],
      ['/embed/cook', 'embed/cook.html'],
    ];
    for (const [url, file] of cases) {
      expect(servedFile(url), url).toBe(file);
      expect(servedPath(file), file).toBe(url);
    }
  });

  it('rejects the spellings Pages would redirect', () => {
    for (const url of ['/30m/', '/for/', '/es', '/pt-br', '/30m.html', '/for/index', '']) {
      expect(isServedPath(url), url).toBe(false);
      expect(() => servedFile(url), url).toThrow();
    }
  });
});

describe('the build is laid out the way Cloudflare Pages serves it (docs/14 §2.1)', () => {
  it('writes directory indexes only for / and the locale homes', () => {
    const indexes = pages.filter((file) => file === 'index.html' || file.endsWith('/index.html')).sort();
    expect(indexes).toEqual(['index.html', ...LOCALES.map((locale) => `${locale}/index.html`)].sort());
  });

  it('serves every URL in every sitemap, and every sitemap alternate, without a redirect', async () => {
    expect(sitemaps.length).toBe(8);
    const urls: Array<[string, string]> = [];
    for (const file of sitemaps) {
      const xml = await readFile(path.join(dist, file), 'utf8');
      for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/gu)) urls.push([`${file} <loc>`, pathnameOf(m[1] ?? '')]);
      for (const m of xml.matchAll(/<xhtml:link [^>]*href="([^"]+)"/gu)) urls.push([`${file} alternate`, pathnameOf(m[1] ?? '')]);
    }
    expect(expectServed(urls)).toBeGreaterThan(60);
    const index = await readFile(path.join(dist, 'sitemap-index.xml'), 'utf8');
    for (const m of index.matchAll(/<loc>([^<]+)<\/loc>/gu)) expect(built.has(pathnameOf(m[1] ?? '').slice(1)), m[1]).toBe(true);
  });

  it('points every canonical, hreflang and og:url at a served URL', () => {
    const urls: Array<[string, string]> = [];
    for (const [file, text] of html) {
      if (NO_CANONICAL.has(file)) {
        expect(text, file).toMatch(/<meta name="robots" content="noindex/u);
        continue;
      }
      const canonical = /<link rel="canonical" href="([^"]+)"/u.exec(text)?.[1];
      expect(canonical, `${file} canonical`).toBeTruthy();
      urls.push([`${file} canonical`, pathnameOf(canonical ?? '')]);
      for (const m of text.matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/gu)) {
        urls.push([`${file} hreflang`, pathnameOf(m[1] ?? '')]);
      }
      const og = /<meta property="og:url" content="([^"]+)"/u.exec(text)?.[1];
      if (og) urls.push([`${file} og:url`, pathnameOf(og)]);
    }
    expect(expectServed(urls)).toBeGreaterThan(pages.length);
  });

  it('a page is canonical at the URL it is served from, unless it defers to another page', () => {
    // /until/* is canonical `/` (docs/00 §7); every other page names itself.
    for (const [file, text] of html) {
      if (NO_CANONICAL.has(file) || file.startsWith('until/')) continue;
      const canonical = /<link rel="canonical" href="([^"]+)"/u.exec(text)?.[1] ?? '';
      expect(pathnameOf(canonical), file).toBe(servedPath(file));
    }
  });

  it('uses served URLs in structured data', () => {
    const urls: Array<[string, string]> = [];
    for (const [file, text] of html) {
      for (const block of text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gsu)) {
        for (const m of (block[1] ?? '').matchAll(/"(https:\/\/awaketab\.com[^"#]*)(?:#[^"]*)?"/gu)) {
          const href = m[1] ?? '';
          if (/\.(?:png|svg|jpg|webp|xml)$/u.test(href)) continue;
          urls.push([`${file} JSON-LD`, pathnameOf(href)]);
        }
      }
    }
    expect(expectServed(urls)).toBeGreaterThan(pages.length);
  });

  it('links internally only to served URLs', () => {
    const urls: Array<[string, string]> = [];
    for (const [file, text] of html) {
      for (const m of text.matchAll(/<a\b[^>]*\shref="((?:https:\/\/awaketab\.com)?\/[^"#?]*)[^"]*"/gu)) {
        const href = m[1] ?? '';
        if (href.startsWith('//') || /^\/(?:api|og|icons)\//u.test(href) || /\.[a-z0-9]+$/u.test(href)) continue;
        urls.push([`${file} <a>`, href.startsWith('/') ? href : pathnameOf(href || ORIGIN)]);
      }
    }
    expect(expectServed(urls)).toBeGreaterThan(pages.length);
  });

  it('keys page rules in _headers on served URLs', async () => {
    const rules = parseHeaderRules(await readFile(path.join(dist, '_headers'), 'utf8'));
    const exact = rules
      .map(({ route }) => route)
      .filter((route) => !route.includes('*') && !/\.[a-z0-9]+$/u.test(route));
    expect(exact).toContain('/embed');
    expect(expectServed(exact.map((route) => ['_headers', route]))).toBeGreaterThan(0);
  });

  it('keeps robots.txt page rules on served URLs, and never blocks the /embed landing page', async () => {
    const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
    const disallow = [...robots.matchAll(/^Disallow: (\S+)$/gmu)].map((m) => m[1] ?? '');
    // Prefix rules end in `/` on purpose (`/api/`, `/embed/`); the rest name pages and must be served URLs.
    expectServed(disallow.filter((rule) => !rule.endsWith('/')).map((rule) => ['robots.txt', rule]));
    expect(disallow.some((rule) => '/embed'.startsWith(rule))).toBe(false);
    await expect(stat(path.join(dist, servedFile('/embed')))).resolves.toBeTruthy();
  });
});
