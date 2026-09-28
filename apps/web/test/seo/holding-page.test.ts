import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { servedFile, servedPath } from '../../scripts/served.mjs';

const dist = process.env.AT_DIST
  ? new URL(`file://${path.resolve(process.env.AT_DIST)}/`)
  : new URL('../../dist/', import.meta.url);
const site = 'https://awaketab.com';
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

function proseBlock(html: string, start: number, openLength: number): string {
  let i = start + openLength;
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
      if (depth === 0) return html.slice(start + openLength, nextClose);
      i = nextClose + 6;
    }
  }
  return '';
}

// The page's reading text: the lead under the h1 plus every `.at-prose` block (the body, and on /guides and /learn
// the part after the embedded tool: honest limit, FAQ, related links).
function extractProse(html: string): string {
  const lead = /<p class="at-lead"[^>]*>([\s\S]*?)<\/p>/u.exec(html)?.[1] ?? '';
  const blocks = [...html.matchAll(/<div class="at-prose(?: [^"]*)?"[^>]*>/gu)].map((m) =>
    proseBlock(html, m.index, m[0].length),
  );
  return [lead, ...blocks]
    .join(' ')
    .replace(/<script[\s\S]*?<\/script>/gu, ' ')
    .replace(/<style[\s\S]*?<\/style>/gu, ' ')
    .replace(/<[^>]+>/gu, ' ');
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

  // sameAs lists only profiles that exist today: the public source repository. The npm package is added when it
  // is published; the github.com/awaketab account does not exist.
  it('points the Organization sameAs only at the real repository, on every home page', async () => {
    for (const home of ['/', '/es/', '/pt-br/', '/de/', '/fr/', '/ja/', '/zh/', '/hi/']) {
      const html = await readFile(built(home), 'utf8');
      const value = /<script type="application\/ld\+json">(.*?)<\/script>/u.exec(html)?.[1] ?? '{}';
      const schema = JSON.parse(value) as { '@graph'?: Array<{ '@type'?: string; sameAs?: unknown }> };
      const org = schema['@graph']?.find((node) => node['@type'] === 'Organization');
      expect(org?.sameAs, home).toEqual(['https://github.com/SoubhikBiswas-gitHub/awaketab']);
    }
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

  // lastmod is each page's real last change (scripts/sitemap.mjs), never the build time: an article's equals the
  // dateModified it shows, and each sitemap in the index carries its newest page's date.
  it('dates sitemap URLs by their last real change', async () => {
    const index = await readFile(new URL('sitemap-index.xml', dist), 'utf8');
    const now = Date.now();
    let articles = 0;
    for (const locale of ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi']) {
      const xml = await readFile(new URL(`sitemap-${locale}.xml`, dist), 'utf8');
      const dates: string[] = [];
      for (const [, loc = '', lastmod] of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/gu)) {
        if (lastmod === undefined) continue;
        dates.push(lastmod);
        expect(lastmod, loc).toMatch(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2}))?$/u);
        expect(Date.parse(lastmod), loc).toBeLessThanOrEqual(now);
        if (!/\/(?:for|on|vs|guides|learn)\/[^/]+$/u.test(loc)) continue;
        const html = await readFile(built(new URL(loc).pathname), 'utf8');
        expect(/"dateModified":"([^"]+)"/u.exec(html)?.[1], loc).toBe(lastmod);
        articles += 1;
      }
      const newest = dates.sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1);
      const entry = new RegExp(`<loc>${site}/sitemap-${locale}\\.xml</loc>(?:<lastmod>([^<]+)</lastmod>)?`, 'u');
      expect(entry.exec(index)?.[1], locale).toBe(newest);
    }
    expect(articles).toBeGreaterThan(20);
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

  it('builds the English home as a short product page below the tool', async () => {
    const html = await readFile(built('/'), 'utf8');
    for (const id of ['home-uses', 'home-final']) expect(html, id).toContain(`id="${id}"`);
    for (const id of ['what', 'how', 'limits', 'support', 'guides', 'alt', 'faq', 'who']) {
      expect(html, id).not.toContain(`id="home-${id}"`);
    }
    for (const slug of ['cooking', 'reading', 'presentations', 'dashboards', 'video-calls', 'downloads']) {
      expect(html, slug).toContain(`href="/for/${slug}"`);
    }
    expect(html).toContain('All 14 use cases');
    for (const href of ['#content', '/extension', '/learn']) expect(html, href).toContain(`href="${href}"`);
    expect(html).not.toContain('FAQPage');
    const start = /<div class="at-hb"[^>]*>/u.exec(html);
    const below = start ? proseBlock(html, start.index, start[0].length) : '';
    const words = below
      .replace(/<(script|style)[\s\S]*?<\/\1>/gu, ' ')
      .replace(/<[^>]+>/gu, ' ')
      .split(/\s+/u)
      .filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(120);
    expect(words.length).toBeLessThanOrEqual(1200);
  });

  it('links the home stylesheet instead of inlining it', async () => {
    const html = await readFile(built('/'), 'utf8');
    const href = /<link rel="stylesheet" href="(\/_astro\/home\.[^"]+\.css)"/u.exec(html)?.[1] ?? '';
    await expect(stat(new URL(`.${href}`, dist)), href).resolves.toBeTruthy();
    expect(html.indexOf(href)).toBeGreaterThan(html.indexOf('id="content"'));
  });

  // Indexed pages meet their family word band; drafts keep the old 600–1,000 band.
  it('publishes forty-seven English content pages: rewritten pages in their family band, drafts in 600–1,000', async () => {
    const BANDS: Record<string, readonly [number, number]> = {
      for: [600, 1000],
      on: [600, 900],
      vs: [700, 1000],
      guides: [700, 1100],
      learn: [1000, 2000],
    };
    const files = (await htmlFiles(dist)).filter((file) => {
      const relative = path.relative(new URL(dist).pathname, file.pathname).replace(/\\/gu, '/');
      return /^(for|on|vs|guides|learn)\/[^/]+\.html$/u.test(relative);
    });
    expect(files).toHaveLength(47);
    const english = await readFile(new URL('sitemap-en.xml', dist), 'utf8');
    const descriptions = new Set<string>();
    let indexed = 0;
    for (const file of files) {
      const html = await readFile(file, 'utf8');
      const relative = path.relative(new URL(dist).pathname, file.pathname).replace(/\\/gu, '/');
      const family = relative.split('/')[0] ?? '';
      const route = `/${relative.replace(/\.html$/u, '')}`;
      expect(html.match(/<h1(?:\s[^>]*)?>/gu), relative).toHaveLength(1);
      const count = extractProse(html).split(/\s+/u).filter(Boolean).length;
      const draft = meta(html, 'robots')?.includes('noindex') ?? false;
      const [low, high] = draft ? [600, 1000] : (BANDS[family] ?? [600, 1000]);
      expect(count, `${relative} (${draft ? 'draft' : family})`).toBeGreaterThanOrEqual(low);
      expect(count, `${relative} (${draft ? 'draft' : family})`).toBeLessThanOrEqual(high);
      // Drafts: noindex, no hreflang, out of the sitemap. Rewritten pages: in the sitemap.
      if (draft) {
        expect(english, `${route} draft in sitemap`).not.toContain(`<loc>${site}${route}</loc>`);
        expect(html, `${route} draft hreflang`).not.toContain('<link rel="alternate" hreflang=');
      } else {
        indexed += 1;
        expect(english, `${route} missing from sitemap`).toContain(`<loc>${site}${route}</loc>`);
      }
      const description = meta(html, 'description') ?? '';
      expect(descriptions.has(description), relative).toBe(false);
      descriptions.add(description);
    }
    expect(indexed).toBe(28);
  });

  it('builds no page for the OD-3 cut and merged routes, and 301s the merged ones (docs/00 §7)', async () => {
    const redirects = await readFile(new URL('_redirects', dist), 'utf8');
    const merged: Array<[string, string]> = [
      ['/for/second-monitor', '/guides/second-monitor-turns-off'],
      ['/on/windows-10', '/on/windows-11'],
      ['/guides/modern-standby', '/guides/lock-screen-vs-sleep'],
      ['/learn/nosleep-js-vs-wake-lock', '/vs/nosleep-js'],
    ];
    const english = await readFile(new URL('sitemap-en.xml', dist), 'utf8');
    for (const [from, to] of merged) {
      expect(redirects.split('\n'), from).toContain(`${from} ${to} 301`);
      await expect(stat(built(from)), from).rejects.toThrow();
      // The target is a live, indexable page, so the redirect never lands on a noindex draft.
      const target = await readFile(built(to), 'utf8');
      expect(meta(target, 'robots'), to).not.toContain('noindex');
      expect(english, to).toContain(`<loc>${site}${to}</loc>`);
      expect(english, from).not.toContain(`${site}${from}<`);
    }
    for (const cut of ['/for/navigation', '/for/live-streams', '/for/exams-proctoring', '/for/baby-monitor']) {
      await expect(stat(built(cut)), cut).rejects.toThrow();
      expect(redirects, cut).not.toContain(`${cut} `);
      expect(english, cut).not.toContain(`${site}${cut}<`);
    }
    const classroom = await readFile(built('/for/classroom'), 'utf8');
    expect(meta(classroom, 'robots'), '/for/classroom').not.toContain('noindex');
    expect(classroom).toContain(`<link rel="canonical" href="${site}/for/classroom">`);
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
        // Font preloads and linked stylesheets must point at a file that ships.
        if (href.startsWith('/fonts/') || (href.startsWith('/_astro/') && href.endsWith('.css'))) {
          await expect(stat(new URL(`.${href}`, dist)), `${relative} -> ${href}`).resolves.toBeTruthy();
          continue;
        }
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
      // B4 (PipWindow canvas): the popup also writes its "until 5:28 PM" line, so those two strings ship too.
      const runtime = new Set(['tool.timer.indefiniteIdle', 'ambient.until', 'ambient.tomorrow']);
      expect(
        keys.every((k) => k.startsWith('tool.pill.') || runtime.has(k)),
        route,
      ).toBe(true);
      expect(keys.filter((k) => runtime.has(k)).sort(), route).toEqual([...runtime].sort());
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
