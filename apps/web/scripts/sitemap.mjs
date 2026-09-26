import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { alternatesFor, HREFLANG, isIndexable, readContentIndex } from './translations.mjs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.join(ROOT, 'dist');
const SITE = 'https://awaketab.com';
const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const ENGLISH_PATHS = [
  '/',
  '/15m',
  '/30m',
  '/45m',
  '/1h',
  '/2h',
  '/4h',
  '/8h',
  '/for',
  '/on',
  '/vs',
  '/guides',
  '/learn',
  '/about',
  '/privacy',
  '/terms',
  '/changelog',
  '/pro',
  '/embed',
  '/kiosk',
  '/library',
];

async function lastModified() {
  try {
    const { stdout } = await exec('git', ['log', '-1', '--format=%cI', '--', 'apps/web/src']);
    const value = stdout.trim();
    if (value) return value;
  } catch {
    // Source archives may not contain git history.
  }
  return new Date().toISOString();
}

const CONTENT = path.join(ROOT, 'src/content');
const slugs = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/slugs.json'), 'utf8'));
const pages = await readContentIndex(CONTENT);
const modified = await lastModified();
const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const link = (hreflang, href) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}"/>`;
const url = (loc, alternates) =>
  `<url><loc>${escapeXml(loc)}</loc><lastmod>${modified}</lastmod>${alternates.join('')}</url>`;

/** @type {Record<string, string[]>} */
const urls = Object.fromEntries(LOCALES.map((locale) => [locale, []]));
for (const pathname of ENGLISH_PATHS) {
  const href = `${SITE}${pathname === '/' ? '' : pathname}`;
  urls.en.push(url(href, [link(HREFLANG.en, href), link('x-default', href)]));
}
// Content pages: only indexable versions (English + translations with `reviewed: true`) are listed, each
// with the same reciprocal alternates the page's HTML emits (scripts/translations.mjs alternatesFor).
for (const page of pages) {
  if (!isIndexable(page)) continue;
  const alternates = alternatesFor(pages, slugs, page.kind, page.enSlug, page.locale, SITE);
  const self = alternates.find((item) => item.locale === page.locale);
  const english = alternates.find((item) => item.locale === 'en');
  if (!self) continue;
  urls[page.locale]?.push(
    url(self.href, [
      ...alternates.map((item) => link(item.hreflang, item.href)),
      link('x-default', english?.href ?? self.href),
    ]),
  );
}

for (const locale of LOCALES) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${(urls[locale] ?? []).join('')}</urlset>`;
  await writeFile(path.join(DIST, `sitemap-${locale}.xml`), xml);
}

const index = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.map((locale) => `<sitemap><loc>${SITE}/sitemap-${locale}.xml</loc><lastmod>${modified}</lastmod></sitemap>`).join('')}</sitemapindex>`;
await writeFile(path.join(DIST, 'sitemap-index.xml'), index);
