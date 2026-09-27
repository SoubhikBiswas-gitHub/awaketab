import { execFile } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { alternatesFor, frontmatterScalars, HREFLANG, isIndexable, readContentIndex } from './translations.mjs';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.join(ROOT, 'dist');
const SITE = 'https://awaketab.com';
const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const PRESETS = ['/15m', '/30m', '/45m', '/1h', '/2h', '/4h', '/8h'];
const HUBS = ['/for', '/on', '/vs', '/guides', '/learn'];
const TOOL = ['src/components/ToolIsland.astro', 'src/components/ToolPanel.astro'];

// The files whose last commit is a page's last change (docs/06 §6), relative to apps/web. The tool routes also
// change with the tool island; hubs also change with the articles they list (added in sitemapFiles).
export const PAGE_SOURCES = {
  '/': [
    'src/pages/index.astro',
    'src/components/HomeBelow.astro',
    'src/components/home',
    'src/styles/home.css',
    ...TOOL,
  ],
  ...Object.fromEntries(PRESETS.map((p) => [p, ['src/pages/[preset].astro', ...TOOL]])),
  ...Object.fromEntries(HUBS.map((p) => [p, [`src/pages${p}.astro`, 'src/components/HubPage.astro']])),
  '/about': ['src/pages/about.astro'],
  '/privacy': ['src/pages/privacy.astro', 'src/components/pages/LegalDoc.astro'],
  '/terms': ['src/pages/terms.astro', 'src/components/pages/LegalDoc.astro'],
  '/changelog': ['src/pages/changelog.astro', '../../changelog'],
  '/pro': ['src/pages/pro.astro', 'src/components/pro'],
  '/embed': ['src/pages/embed.astro'],
  '/kiosk': ['src/pages/kiosk.astro'],
  '/library': ['src/pages/library.astro'],
  '/extension': ['src/pages/extension.astro'],
};

const DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/u;

export function latest(dates) {
  let best;
  for (const date of dates) {
    if (typeof date !== 'string' || !DATE.test(date)) continue;
    if (best === undefined || Date.parse(date) > Date.parse(best)) best = date;
  }
  return best;
}

// A shallow clone's oldest commits look as if they added every file, so a date that lands on one of them says
// nothing about the file and is dropped (CI checks out with depth 1).
export async function gitDates(cwd = ROOT) {
  const run = async (args) => (await exec('git', args, { cwd })).stdout.trim();
  let boundary = new Set();
  try {
    const shallow = path.resolve(cwd, await run(['rev-parse', '--git-path', 'shallow']));
    boundary = new Set((await readFile(shallow, 'utf8').catch(() => '')).split('\n').filter(Boolean));
  } catch {
    return async () => undefined;
  }
  return async (paths) => {
    try {
      const [hash, date] = (await run(['log', '-1', '--format=%H %cI', '--', ...paths])).split(' ');
      return hash && date && !boundary.has(hash) ? date : undefined;
    } catch {
      return undefined;
    }
  };
}

// Content pages use the date the page itself shows as dateModified (frontmatter `updated`, else `published`), so
// the sitemap and the Article JSON-LD always agree.
export function contentDate(frontmatter) {
  return latest([frontmatter.updated]) ?? latest([frontmatter.published]);
}

const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const link = (hreflang, href) => `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}"/>`;
const lastmod = (date) => (date ? `<lastmod>${date}</lastmod>` : '');
const url = (loc, date, alternates) => `<url><loc>${escapeXml(loc)}</loc>${lastmod(date)}${alternates.join('')}</url>`;

export async function sitemapFiles({ root = ROOT, dateOf } = {}) {
  const dates = dateOf ?? (await gitDates(root));
  const slugs = JSON.parse(await readFile(path.join(root, 'src/i18n/slugs.json'), 'utf8'));
  const pages = await readContentIndex(path.join(root, 'src/content'));
  for (const page of pages) page.lastmod = contentDate(frontmatterScalars(await readFile(page.file, 'utf8')));

  const urls = Object.fromEntries(LOCALES.map((locale) => [locale, []]));
  const modified = Object.fromEntries(LOCALES.map((locale) => [locale, []]));
  for (const [pathname, sources] of Object.entries(PAGE_SOURCES)) {
    const href = `${SITE}${pathname === '/' ? '' : pathname}`;
    const listed = HUBS.includes(pathname)
      ? pages.filter((page) => page.locale === 'en' && page.kind === pathname.slice(1)).map((page) => page.lastmod)
      : [];
    const date = latest([await dates(sources), ...listed]);
    urls.en.push(url(href, date, [link(HREFLANG.en, href), link('x-default', href)]));
    modified.en.push(date);
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
      url(self.href, page.lastmod, [
        ...alternates.map((item) => link(item.hreflang, item.href)),
        link('x-default', english?.href ?? self.href),
      ]),
    );
    modified[page.locale]?.push(page.lastmod);
  }

  const files = {};
  for (const locale of LOCALES) {
    files[`sitemap-${locale}.xml`] =
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${(urls[locale] ?? []).join('')}</urlset>`;
  }
  files['sitemap-index.xml'] =
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.map((locale) => `<sitemap><loc>${SITE}/sitemap-${locale}.xml</loc>${lastmod(latest(modified[locale] ?? []))}</sitemap>`).join('')}</sitemapindex>`;
  return files;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const files = await sitemapFiles();
  await Promise.all(Object.entries(files).map(([name, xml]) => writeFile(path.join(DIST, name), xml)));
}
