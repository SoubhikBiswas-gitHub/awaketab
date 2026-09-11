import { execFile } from 'node:child_process';
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.join(ROOT, 'dist');
const SITE = 'https://awaketab.com';
const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const HREFLANG = { en: 'en', es: 'es', 'pt-br': 'pt-BR', de: 'de', fr: 'fr', ja: 'ja', zh: 'zh-Hans', hi: 'hi' };
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
const collections = ['for', 'on', 'vs', 'guides', 'learn'];
for (const collection of collections) {
  const dir = path.join(CONTENT, collection, 'en');
  try {
    const files = await readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md')) ENGLISH_PATHS.push(`/${collection}/${file.slice(0, -3)}`);
    }
  } catch {
    // Collection folder may be empty during early builds.
  }
}
const modified = await lastModified();
const escapeXml = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const englishAlternates = (pathname) => {
  const href = `${SITE}${pathname === '/' ? '' : pathname}`;
  return [
    `<xhtml:link rel="alternate" hreflang="${HREFLANG.en}" href="${escapeXml(href)}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(href)}"/>`,
  ].join('');
};

for (const locale of LOCALES) {
  const paths = locale === 'en' ? ENGLISH_PATHS : [];
  const urls = paths
    .map((pathname) => {
      const loc = `${SITE}${pathname === '/' ? '' : pathname}`;
      return `<url><loc>${escapeXml(loc)}</loc><lastmod>${modified}</lastmod>${englishAlternates(pathname)}</url>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
  await writeFile(path.join(DIST, `sitemap-${locale}.xml`), xml);
}

const index = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.map((locale) => `<sitemap><loc>${SITE}/sitemap-${locale}.xml</loc><lastmod>${modified}</lastmod></sitemap>`).join('')}</sitemapindex>`;
await writeFile(path.join(DIST, 'sitemap-index.xml'), index);
