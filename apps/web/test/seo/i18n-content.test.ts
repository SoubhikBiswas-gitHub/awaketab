import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { servedFile, servedPath } from '../../scripts/served.mjs';

// E6-T05 / E6-T06 over the built site: 70 translated top-10 pages, noindex and out of the sitemaps
// while `reviewed: false`, per-page localized OG images, JSON-LD inLanguage, localized manifests and
// a reciprocal hreflang graph that agrees with the sitemaps (docs/06 §5, §6, §9; docs/13 §8).
const dist = process.env.AT_DIST
  ? new URL(`file://${path.resolve(process.env.AT_DIST)}/`)
  : new URL('../../dist/', import.meta.url);
const distPath = new URL(dist).pathname;
const site = 'https://awaketab.com';
const slugs = JSON.parse(
  await readFile(new URL('../../src/i18n/slugs.json', import.meta.url), 'utf8'),
) as Record<string, Record<string, Record<string, string>>>;

const LOCALES = { es: 'es', 'pt-br': 'pt-BR', de: 'de', fr: 'fr', ja: 'ja', zh: 'zh-Hans', hi: 'hi' } as const;
type TCode = keyof typeof LOCALES;
const CJK = new Set<string>(['ja', 'zh']);
const TOP10 = [
  ['for', 'cooking'],
  ['for', 'downloads'],
  ['for', 'presentations'],
  ['on', 'iphone-safari'],
  ['on', 'android-chrome'],
  ['on', 'windows-11'],
  ['on', 'macos'],
  ['guides', 'iphone-auto-lock-never-greyed-out'],
  ['vs', 'caffeine'],
  ['learn', 'browser-support-matrix'],
] as const;

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(target)));
    else if (entry.name.endsWith('.html')) files.push(target);
  }
  return files;
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

const metaName = (html: string, name: string): string | null => {
  const raw = new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, 'u').exec(html)?.[1];
  return raw === undefined ? null : unescapeHtml(raw);
};
const metaProperty = (html: string, property: string): string | null => {
  const raw = new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]*)"`, 'u').exec(html)?.[1];
  return raw === undefined ? null : unescapeHtml(raw);
};
const htmlAttr = (html: string, attr: string): string | undefined => new RegExp(`<html[^>]*\\s${attr}="([^"]*)"`, 'u').exec(html)?.[1];
const hreflangs = (html: string): Array<[string, string]> =>
  [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gu)].map((m) => [m[1] ?? '', m[2] ?? '']);
const width = (value: string): number =>
  [...value].reduce((sum, char) => sum + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u.test(char) ? 2 : 1), 0);

function jsonLd(html: string): Array<Record<string, unknown>> {
  const raw = /<script type="application\/ld\+json">(.*?)<\/script>/su.exec(html)?.[1] ?? '{}';
  const parsed = JSON.parse(raw) as { '@graph'?: Array<Record<string, unknown>> };
  return parsed['@graph'] ?? [];
}

const pagePath = (code: string, kind: string, enSlug: string): string => `/${code}/${kind}/${slugs[kind]?.[enSlug]?.[code] ?? enSlug}`;
const fileFor = (pathname: string): string => path.join(distPath, servedFile(pathname));

const sitemaps = await Promise.all(
  ['en', ...Object.keys(LOCALES)].map(async (locale) => readFile(new URL(`sitemap-${locale}.xml`, dist), 'utf8')),
);
const sitemapText = sitemaps.join('\n');

describe('translated top-10 content pages (E6-T06)', () => {
  it('publishes 70 localized pages: 10 per locale at the translated slugs', async () => {
    for (const code of Object.keys(LOCALES)) {
      for (const [kind, enSlug] of TOP10) {
        await expect(stat(fileFor(pagePath(code, kind, enSlug))), `${code} ${kind}/${enSlug}`).resolves.toBeTruthy();
      }
    }
    const localized = (await htmlFiles(distPath))
      .map((file) => path.relative(distPath, file).replace(/\\/gu, '/'))
      .filter((relative) => /^(es|pt-br|de|fr|ja|zh|hi)\/(for|on|vs|guides|learn)\/[^/]+\.html$/u.test(relative));
    expect(localized).toHaveLength(70);
  });

  for (const [code, lang] of Object.entries(LOCALES) as Array<[TCode, string]>) {
    it(`${code}: metadata, noindex, OG image, inLanguage and unique descriptions`, async () => {
      const descriptions = new Set<string>();
      for (const [kind, enSlug] of TOP10) {
        const pathname = pagePath(code, kind, enSlug);
        const html = await readFile(fileFor(pathname), 'utf8');
        const english = await readFile(fileFor(`/${kind}/${enSlug}`), 'utf8');
        const label = `${code} ${pathname}`;

        expect(htmlAttr(html, 'lang'), label).toBe(lang);
        expect(htmlAttr(html, 'dir'), label).toBe('ltr');
        expect(html.match(/<h1(?:\s[^>]*)?>/gu), `${label} h1`).toHaveLength(1);

        // Unreviewed → noindex, no hreflang, absent from every sitemap (docs/07 §2).
        expect(metaName(html, 'robots'), label).toContain('noindex');
        expect(hreflangs(html), `${label} hreflang`).toEqual([]);
        expect(sitemapText.includes(`${site}${pathname}"`) || sitemapText.includes(`${site}${pathname}<`), `${label} sitemap`).toBe(false);
        expect(html, `${label} canonical`).toContain(`<link rel="canonical" href="${site}${pathname}">`);

        const title = unescapeHtml(/<title>(.*?)<\/title>/u.exec(html)?.[1] ?? '');
        const description = metaName(html, 'description') ?? '';
        expect(title.endsWith(' — AwakeTab'), `${label} title suffix`).toBe(true);
        expect(title.length, `${label} title`).toBeLessThanOrEqual(60);
        if (CJK.has(code)) expect(width(title), `${label} title width`).toBeLessThanOrEqual(60);
        expect(description.length, `${label} description`).toBeGreaterThanOrEqual(70);
        expect(description.length, `${label} description`).toBeLessThanOrEqual(CJK.has(code) ? 80 : 155);
        expect(descriptions.has(description), `${label} duplicate description`).toBe(false);
        expect(description, `${label} description equals English`).not.toBe(metaName(english, 'description'));
        descriptions.add(description);

        // Localized OG image, generated at build, 1200 × 630 PNG.
        const og = `/og/${code}/${kind}/${slugs[kind]?.[enSlug]?.[code] ?? enSlug}.png`;
        expect(metaProperty(html, 'og:image'), label).toBe(`${site}${og}`);
        expect(metaProperty(html, 'og:image:alt'), label).toBeTruthy();
        const png = await readFile(path.join(distPath, og));
        expect(png.subarray(1, 4).toString('ascii'), `${label} png`).toBe('PNG');
        expect([png.readUInt32BE(16), png.readUInt32BE(20)], `${label} png size`).toEqual([1200, 630]);

        // JSON-LD inLanguage uses the BCP 47 tag of the page.
        const article = jsonLd(html).find((node) => node['@type'] === 'Article');
        expect(article?.inLanguage, `${label} inLanguage`).toBe(lang);
        expect(article?.image, `${label} schema image`).toBe(`${site}${og}`);

        // The embedded tool carries the scenario preset and the locale catalog.
        expect(html, `${label} tool`).toMatch(/id="awaketab-tool"[^>]*data-preset="[a-z0-9]+"/u);
        expect(html, `${label} honest limit`).toContain('role="note"');
        expect(html.match(/<details/gu)?.length ?? 0, `${label} FAQs`).toBeGreaterThanOrEqual(3);
      }
    });
  }

  it('links every localized page only to existing routes', async () => {
    const files = await htmlFiles(distPath);
    // Served URLs only (docs/14 §2.1): a link Cloudflare Pages would 308 (`/for/`, `/es`) does not count.
    const existing = new Set(files.map((file) => servedPath(path.relative(distPath, file).replace(/\\/gu, '/'))));
    for (const code of Object.keys(LOCALES)) {
      for (const [kind, enSlug] of TOP10) {
        const pathname = pagePath(code, kind, enSlug);
        const html = await readFile(fileFor(pathname), 'utf8');
        for (const match of html.matchAll(/href="(\/[^"#?]*)/gu)) {
          const href = match[1] ?? '';
          if (/^\/(?:api|og|icons)\//u.test(href) || /\.(?:webmanifest|svg|js|png)$/u.test(href)) continue;
          // Self-hosted font preloads (D-R26) must point at a file that ships.
          if (href.startsWith('/fonts/')) {
            await expect(stat(path.join(distPath, href)), `${pathname} -> ${href}`).resolves.toBeTruthy();
            continue;
          }
          expect(existing.has(href), `${pathname} -> ${href}`).toBe(true);
        }
        // Links marked as English (related cards, the translation notice) only point at English pages
        // that have no translation in this locale — otherwise the same-locale page must be linked.
        for (const match of html.matchAll(/<a[^>]*href="(\/(?:for|on|vs|guides|learn)\/[^"]+)"[^>]*hreflang="en"/gu)) {
          const href = match[1] ?? '';
          if (href === `/${kind}/${enSlug}`) continue;
          const [, targetKind = '', targetSlug = ''] = href.split('/');
          expect(existing.has(pagePath(code, targetKind, targetSlug)), `${pathname} links English ${href}`).toBe(false);
        }
      }
    }
  });
});

describe('localized chrome (E6-T05)', () => {
  it('sets inLanguage to the page language on every localized page', async () => {
    for (const file of await htmlFiles(distPath)) {
      const relative = path.relative(distPath, file).replace(/\\/gu, '/');
      const code = relative.split('/')[0] ?? '';
      if (!(code in LOCALES)) continue;
      // /{lang}/pip is the noindex floating-timer popup (docs/05 §9): no structured data by design.
      if (relative === servedFile(`/${code}/pip`)) continue;
      const html = await readFile(file, 'utf8');
      const nodes = jsonLd(html).filter((node) => 'inLanguage' in node);
      expect(nodes.length, relative).toBeGreaterThan(0);
      for (const node of nodes) expect(node.inLanguage, relative).toBe(LOCALES[code as TCode]);
    }
  });

  it('ships a localized web app manifest per locale', async () => {
    const english = JSON.parse(await readFile(new URL('manifest.webmanifest', dist), 'utf8')) as Record<string, unknown>;
    for (const [code, lang] of Object.entries(LOCALES)) {
      const manifest = JSON.parse(await readFile(new URL(`${code}/manifest.webmanifest`, dist), 'utf8')) as {
        name: string;
        description: string;
        lang: string;
        start_url: string;
        scope: string;
        id: string;
      };
      expect(manifest.lang, code).toBe(lang);
      expect(manifest.name, code).toMatch(/^AwakeTab — /u);
      expect(manifest.name, code).not.toBe(english.name);
      expect(manifest.description, code).not.toBe(english.description);
      expect(manifest.start_url.startsWith(`/${code}/`), code).toBe(true);
      expect(manifest.scope, code).toBe(`/${code}/`);
      expect(manifest.id, code).toBe(`/${code}/`);
      const home = await readFile(new URL(servedFile(`/${code}/`), dist), 'utf8');
      expect(home, code).toContain(`<link rel="manifest" href="/${code}/manifest.webmanifest">`);
    }
  });

  it('ships only the self-hosted UI fonts (with their OFL licences), never the OG fonts', async () => {
    const all: string[] = [];
    const walk = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(target);
        else all.push(target);
      }
    };
    await walk(distPath);
    const fonts = all.filter((file) => /\.(?:woff2?|ttf|otf)$/u.test(file)).map((file) => path.relative(distPath, file).split(path.sep).join('/'));
    // D-R26: Geist, Geist Mono and the Space Grotesk digits subset, Latin woff2 only, all under /fonts.
    expect(fonts.sort()).toEqual([
      'fonts/geist-latin-wght-normal.woff2',
      'fonts/geist-mono-latin-wght-normal.woff2',
      'fonts/space-grotesk-digits-600.woff2',
    ]);
    const rel = all.map((file) => path.relative(distPath, file).split(path.sep).join('/'));
    expect(rel).toContain('fonts/OFL-Geist.txt');
    expect(rel).toContain('fonts/OFL-SpaceGrotesk.txt');
  });
});

describe('hreflang graph', () => {
  it('is reciprocal across indexable pages and matches the sitemaps', async () => {
    const graph = new Map<string, string>();
    for (const file of await htmlFiles(distPath)) {
      const html = await readFile(file, 'utf8');
      if (metaName(html, 'robots')?.includes('noindex')) continue;
      const canonical = /<link rel="canonical" href="([^"]+)"/u.exec(html)?.[1] ?? '';
      const set = hreflangs(html)
        .map(([lang, href]) => `${lang} ${href}`)
        .sort()
        .join('|');
      graph.set(canonical, set);
      // Self reference present.
      expect(hreflangs(html).some(([, href]) => href === canonical), canonical).toBe(true);
    }
    for (const [canonical, set] of graph) {
      for (const entry of set.split('|')) {
        const href = entry.split(' ')[1] ?? '';
        if (entry.startsWith('x-default')) continue;
        expect(graph.get(href), `${canonical} -> ${href}`).toBe(set);
      }
    }
    for (const xml of sitemaps) {
      for (const match of xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>[^<]+<\/lastmod>(.*?)<\/url>/gu)) {
        const loc = match[1] ?? '';
        const set = [...(match[2] ?? '').matchAll(/hreflang="([^"]+)" href="([^"]+)"/gu)]
          .map((m) => `${m[1] ?? ''} ${m[2] ?? ''}`)
          .sort()
          .join('|');
        expect(graph.has(loc), `sitemap lists a noindex or missing page: ${loc}`).toBe(true);
        expect(set, `sitemap alternates for ${loc}`).toBe(graph.get(loc));
      }
    }
  });
});
