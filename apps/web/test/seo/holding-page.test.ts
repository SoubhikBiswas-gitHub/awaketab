import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { servedFile, servedPath } from '../../scripts/served.mjs';

const dist = process.env.AT_DIST
  ? new URL(`file://${path.resolve(process.env.AT_DIST)}/`)
  : new URL('../../dist/', import.meta.url);
const site = 'https://awaketab.com';
/** The built file Cloudflare Pages serves at `pathname` (`/30m` → 30m.html, `/es/` → es/index.html). */
const built = (pathname: string): URL => new URL(servedFile(pathname), dist);

async function htmlFiles(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: URL[] = [];
  for (const entry of entries) {
    const target = new URL(entry.name, directory.href.endsWith('/') ? directory : new URL(`${directory.href}/`));
    if (entry.isDirectory()) files.push(...(await htmlFiles(new URL(`${target.href}/`))));
    else if (entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

function extractProse(html: string): string {
  const open = /<div class="at-prose"[^>]*>/u.exec(html);
  if (!open || open.index === undefined) return '';
  let i = open.index + open[0].length;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      if (depth === 0) {
        const prose = html.slice(open.index + open[0].length, nextClose);
        return prose.replace(/<script[\s\S]*?<\/script>/gu, ' ').replace(/<style[\s\S]*?<\/style>/gu, ' ').replace(/<[^>]+>/gu, ' ');
      }
      i = nextClose + 6;
    }
  }
  return '';
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&');
}

function meta(html: string, name: string): string | null {
  const raw = new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, 'u').exec(html)?.[1];
  return raw === undefined ? null : unescapeHtml(raw);
}

describe('built site SEO', () => {
  it('ships complete metadata on every indexable page', async () => {
    for (const file of await htmlFiles(dist)) {
      const html = await readFile(file, 'utf8');
      if (meta(html, 'robots')?.includes('noindex')) continue;
      const relative = path.relative(new URL(dist).pathname, file.pathname);
      const title = unescapeHtml(/<title>(.*?)<\/title>/u.exec(html)?.[1] ?? '');
      const description = meta(html, 'description') ?? '';
      const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/gu)];
      expect(html.match(/<h1(?:\s[^>]*)?>/gu), relative).toHaveLength(1);
      expect(title.length, `${relative} title`).toBeLessThanOrEqual(60);
      expect(description.length, `${relative} description`).toBeGreaterThanOrEqual(70);
      expect(description.length, `${relative} description`).toBeLessThanOrEqual(155);
      expect(canonicals, `${relative} canonical`).toHaveLength(1);
      expect(canonicals[0]?.[1]).toMatch(/^https:\/\/awaketab\.com(?:\/.*)?$/u);
      expect(html, `${relative} og`).toContain('property="og:image"');
      expect(html, `${relative} twitter`).toContain('name="twitter:card"');
      expect(html, `${relative} hreflang self`).toContain('hreflang="en"');
      expect(html, `${relative} x-default`).toContain('hreflang="x-default"');
    }
  });

  it('emits home WebApplication schema without an unearned rating', async () => {
    const html = await readFile(built('/'), 'utf8');
    const value = /<script type="application\/ld\+json">(.*?)<\/script>/u.exec(html)?.[1] ?? '{}';
    const schema = JSON.parse(value) as { '@graph'?: Array<{ '@type'?: string; aggregateRating?: unknown }> };
    expect(schema['@graph']?.map((node) => node['@type'])).toEqual(
      expect.arrayContaining(['Organization', 'WebSite', 'WebApplication']),
    );
    expect(schema['@graph']?.find((node) => node['@type'] === 'WebApplication')?.aggregateRating).toBeUndefined();
  });

  it('publishes canonical robots and locale sitemaps', async () => {
    const [robots, sitemap] = await Promise.all([
      readFile(new URL('robots.txt', dist), 'utf8'),
      readFile(new URL('sitemap-index.xml', dist), 'utf8'),
    ]);
    expect(robots).toContain(`Sitemap: ${site}/sitemap-index.xml`);
    expect(robots).toContain('Disallow: /api/');
    for (const locale of ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi']) {
      expect(sitemap).toContain(`${site}/sitemap-${locale}.xml`);
    }
    const english = await readFile(new URL('sitemap-en.xml', dist), 'utf8');
    expect(english).not.toContain('/until/');
    expect(english).not.toContain('/pip');
    expect(english).toContain('<lastmod>');
    expect(english).toContain('hreflang="x-default"');
    expect(english).toContain(`${site}/extension</loc>`);
  });

  it('publishes the /extension landing page with store links, the Firefox note and no ad code', async () => {
    const html = await readFile(built('/extension'), 'utf8');
    expect(html).toContain('data-store="chrome"');
    expect(html).toContain('href="/on/firefox"');
    expect(html).toContain('"@type":"SoftwareApplication"');
    expect(html).not.toMatch(/googlesyndication|adsbygoogle|data-ad-slot|<astro-island/u);
    const privacy = await readFile(built('/privacy'), 'utf8');
    expect(privacy).toContain('id="extension"');
  });

  it('keeps English preset titles free of locale leakage', async () => {
    const html = await readFile(built('/15m'), 'utf8');
    expect(/<title>(.*?)<\/title>/u.exec(html)?.[1]).toBe('Keep the screen awake for 15 min — AwakeTab');
  });

  it('keeps the English home in the 1,200–1,800 word band', async () => {
    const html = await readFile(built('/'), 'utf8');
    const text = extractProse(html);
    const words = text.split(/\s+/u).filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1200);
    expect(words.length).toBeLessThanOrEqual(1800);
  });

  it('publishes fifty-one English content pages in the 600–1,000 word band', async () => {
    const files = (await htmlFiles(dist)).filter((file) => {
      const relative = path.relative(new URL(dist).pathname, file.pathname).replace(/\\/gu, '/');
      return /^(for|on|vs|guides|learn)\/[^/]+\.html$/u.test(relative);
    });
    expect(files).toHaveLength(51);
    const descriptions = new Set<string>();
    for (const file of files) {
      const html = await readFile(file, 'utf8');
      const relative = path.relative(new URL(dist).pathname, file.pathname);
      expect(html.match(/<h1(?:\s[^>]*)?>/gu), relative).toHaveLength(1);
      const text = extractProse(html);
      const count = text.split(/\s+/u).filter(Boolean).length;
      expect(count, relative).toBeGreaterThanOrEqual(600);
      expect(count, relative).toBeLessThanOrEqual(1000);
      const description = meta(html, 'description') ?? '';
      expect(descriptions.has(description), relative).toBe(false);
      descriptions.add(description);
    }
  });

  it('does not leave indexable pages linking to missing routes', async () => {
    const files = await htmlFiles(dist);
    // Served URLs only (docs/14 §2.1): a link Cloudflare Pages would 308 (`/for/`, `/es`) does not count.
    const existing = new Set(
      files.map((file) => servedPath(path.relative(new URL(dist).pathname, file.pathname).replace(/\\/gu, '/'))),
    );
    for (const file of files) {
      const html = await readFile(file, 'utf8');
      if (meta(html, 'robots')?.includes('noindex')) continue;
      const relative = path.relative(new URL(dist).pathname, file.pathname);
      for (const match of html.matchAll(/href="(\/[^"#?]*)"/gu)) {
        const href = match[1] ?? '';
        if (href.startsWith('/api/') || href.startsWith('/og/') || href.startsWith('/icons/')) continue;
        if (href.endsWith('.webmanifest') || href.endsWith('.svg') || href.endsWith('.js')) continue;
        expect(existing.has(href), `${relative} -> ${href}`).toBe(true);
      }
    }
  });

  it('keeps nonindexable routes honest', async () => {
    const [untilPage, pip, notFound, spanish] = await Promise.all([
      readFile(built('/until/17-30'), 'utf8'),
      readFile(built('/pip'), 'utf8'),
      readFile(new URL('404.html', dist), 'utf8'),
      readFile(built('/es/'), 'utf8'),
    ]);
    expect(meta(untilPage, 'robots')).toContain('noindex');
    expect(untilPage).toContain(`<link rel="canonical" href="${site}">`);
    expect(meta(pip, 'robots')).toContain('noindex');
    expect(meta(notFound, 'robots')).toContain('noindex');
    expect(meta(spanish, 'robots')).toContain('noindex');
  });

  it('serves the /pip popup in every locale, noindex, ad-free and out of the sitemaps', async () => {
    const robots = await readFile(new URL('robots.txt', dist), 'utf8');
    const headers = await readFile(new URL('_headers', dist), 'utf8');
    const expectations: Array<[string, string, string]> = [
      ['pip', 'en', 'Ready'],
      ['es/pip', 'es', 'Listo'],
      ['pt-br/pip', 'pt-BR', ''],
      ['de/pip', 'de', ''],
      ['fr/pip', 'fr', ''],
      ['ja/pip', 'ja', ''],
      ['zh/pip', 'zh-Hans', ''],
      ['hi/pip', 'hi', ''],
    ];
    for (const [route, htmlLang, ready] of expectations) {
      const html = await readFile(built(`/${route}`), 'utf8');
      expect(meta(html, 'robots'), route).toContain('noindex');
      expect(html, route).toContain(`<html lang="${htmlLang}"`);
      expect(html, route).not.toMatch(/adsbygoogle|googlesyndication|data-sponsor|data-ad-slot/u);
      expect(html, route).not.toContain('hreflang=');
      // Only the runtime strings the mirror needs are embedded, not the whole catalog.
      const catalog = /data-i18n-catalog[^>]*>(?<json>[^<]*)</u.exec(html)?.groups?.json ?? '{}';
      const keys = Object.keys(JSON.parse(catalog) as Record<string, string>);
      expect(keys.every((k) => k.startsWith('tool.pill.') || k === 'tool.timer.indefiniteIdle'), route).toBe(true);
      expect(keys.length, route).toBeGreaterThan(5);
      if (ready) expect(html, route).toContain(`<span data-pill-text>${ready}</span>`);
      expect(robots, route).toContain(`Disallow: /${route}\n`);
      expect(headers, route).toMatch(new RegExp(`^/${route}\\n  X-Robots-Tag: noindex`, 'mu'));
    }
    for (const locale of ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi']) {
      const sitemap = await readFile(new URL(`sitemap-${locale}.xml`, dist), 'utf8');
      expect(sitemap, locale).not.toContain('/pip');
    }
  });
  it('keeps /embed/cook out of the index and the M8 landing pages in it (docs/00 §7, E12)', async () => {
    const [widget, english] = await Promise.all([
      readFile(built('/embed/cook'), 'utf8'),
      readFile(new URL('sitemap-en.xml', dist), 'utf8'),
    ]);
    expect(meta(widget, 'robots')).toContain('noindex');
    expect(english).not.toContain('/embed/cook');
    for (const route of ['/embed', '/kiosk', '/library']) {
      expect(english).toContain(`<loc>${site}${route}</loc>`);
      const html = await readFile(built(route), 'utf8');
      expect(meta(html, 'robots'), route).not.toContain('noindex');
      expect(html, route).not.toMatch(/googlesyndication|adsbygoogle|data-ad-slot/u);
    }
  });

  it('renders /learn/how-we-tested from the device matrix, marked "Results pending" (E12-T06)', async () => {
    const html = await readFile(built('/learn/how-we-tested'), 'utf8');
    expect(html).toContain('data-device-matrix');
    expect(html).toContain('data-status="pending"');
    expect(html).toContain('Results pending');
    expect(html.match(/<tr[^>]*data-row=/gu)).toHaveLength(14);
  });
});
