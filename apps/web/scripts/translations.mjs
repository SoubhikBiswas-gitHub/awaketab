// Translated content routing shared by the Astro pages (hreflang, locale switcher, related links),
// scripts/og.mts (per-page OG images) and scripts/sitemap.mjs (per-locale sitemaps), so the HTML
// alternates and the sitemap alternates are computed by one function and cannot disagree
// (docs/06 §5, §6; docs/07 §5 step 5).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const CONTENT_KINDS = ['for', 'on', 'vs', 'guides', 'learn'];
export const SITE = 'https://awaketab.com';
export const HREFLANG = {
  en: 'en',
  es: 'es',
  'pt-br': 'pt-BR',
  de: 'de',
  fr: 'fr',
  ja: 'ja',
  zh: 'zh-Hans',
  hi: 'hi',
};

export function frontmatterScalars(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  const out = {};
  if (!match?.[1]) return out;
  for (const line of match[1].split(/\r?\n/u)) {
    const pair = /^([A-Za-z][A-Za-z0-9]*):[ \t]*(.*?)[ \t]*$/u.exec(line);
    if (!pair?.[1] || pair[2] === undefined || pair[2] === '') continue;
    const raw = pair[2];
    if (raw === 'true' || raw === 'false') out[pair[1]] = raw === 'true';
    else if (raw.startsWith('"')) {
      try {
        out[pair[1]] = JSON.parse(raw);
      } catch {
        out[pair[1]] = raw.slice(1, -1);
      }
    } else if (raw.startsWith("'")) out[pair[1]] = raw.slice(1, -1).replaceAll("''", "'");
    else out[pair[1]] = raw;
  }
  return out;
}

export const TRANSLATED_SLUG_LOCALES = ['es', 'pt-br', 'de', 'fr'];

export function publicSlug(slugs, kind, enSlug, locale) {
  if (!TRANSLATED_SLUG_LOCALES.includes(locale)) return enSlug;
  return slugs[kind]?.[enSlug]?.[locale] ?? enSlug;
}

export function contentPath(slugs, kind, enSlug, locale) {
  const slug = publicSlug(slugs, kind, enSlug, locale);
  return locale === 'en' ? `/${kind}/${slug}` : `/${locale}/${kind}/${slug}`;
}

export function isIndexable(entry) {
  return !entry.noindex && (entry.locale === 'en' || entry.reviewed);
}

export function alternatesFor(entries, slugs, kind, enSlug, locale, site = SITE) {
  const versions = entries.filter((entry) => entry.kind === kind && entry.enSlug === enSlug && isIndexable(entry));
  if (!versions.some((entry) => entry.locale === locale)) return [];
  const order = Object.keys(HREFLANG);
  return versions
    .slice()
    .sort((a, b) => order.indexOf(a.locale) - order.indexOf(b.locale))
    .map((entry) => ({
      locale: entry.locale,
      hreflang: HREFLANG[entry.locale] ?? entry.locale,
      href: `${site}${contentPath(slugs, kind, enSlug, entry.locale)}`,
    }));
}

export async function readContentIndex(contentDir) {
  const out = [];
  for (const kind of CONTENT_KINDS) {
    const locales = await readdir(path.join(contentDir, kind)).catch(() => []);
    for (const locale of locales.sort()) {
      const files = await readdir(path.join(contentDir, kind, locale)).catch(() => []);
      for (const name of files.sort()) {
        if (!name.endsWith('.md')) continue;
        const file = path.join(contentDir, kind, locale, name);
        const data = frontmatterScalars(await readFile(file, 'utf8'));
        out.push({
          kind,
          locale,
          enSlug: name.slice(0, -3),
          reviewed: data.reviewed === true,
          noindex: data.noindex === true,
          h1: typeof data.h1 === 'string' ? data.h1 : '',
          ogTitle: typeof data.ogTitle === 'string' ? data.ogTitle : undefined,
          file,
        });
      }
    }
  }
  return out;
}

export function ogImagePath(slugs, kind, enSlug, locale) {
  return `/og/${locale}/${kind}/${publicSlug(slugs, kind, enSlug, locale)}.png`;
}
