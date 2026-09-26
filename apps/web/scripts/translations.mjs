// Translated content routing shared by the Astro pages (hreflang, locale switcher, related links),
// scripts/og.mts (per-page OG images) and scripts/sitemap.mjs (per-locale sitemaps), so the HTML
// alternates and the sitemap alternates are computed by one function and cannot disagree
// (docs/06 §5, §6; docs/07 §5 step 5).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const CONTENT_KINDS = /** @type {const} */ (['for', 'on', 'vs', 'guides', 'learn']);
export const SITE = 'https://awaketab.com';
export const HREFLANG = /** @type {const} */ ({
  en: 'en',
  es: 'es',
  'pt-br': 'pt-BR',
  de: 'de',
  fr: 'fr',
  ja: 'ja',
  zh: 'zh-Hans',
  hi: 'hi',
});

/**
 * Top-level `key: value` scalars of a Markdown frontmatter block. Nested lists (faq, related) are
 * skipped; double-quoted values are JSON strings, `true`/`false` are booleans. The content schema in
 * src/content.config.ts stays the validator — this reader only feeds build scripts.
 * @param {string} text
 * @returns {Record<string, string | boolean>}
 */
export function frontmatterScalars(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  /** @type {Record<string, string | boolean>} */
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

/**
 * Public slug of a page: the translated slug from src/i18n/slugs.json, else the English slug.
 * @param {Record<string, Record<string, Record<string, string>>>} slugs
 * @param {string} kind
 * @param {string} enSlug
 * @param {string} locale
 */
export function publicSlug(slugs, kind, enSlug, locale) {
  if (locale === 'en') return enSlug;
  return slugs[kind]?.[enSlug]?.[locale] ?? enSlug;
}

/**
 * Site-relative path of a content page in a locale: `/for/cooking`, `/es/for/cocinar`.
 * @param {Record<string, Record<string, Record<string, string>>>} slugs
 * @param {string} kind
 * @param {string} enSlug
 * @param {string} locale
 */
export function contentPath(slugs, kind, enSlug, locale) {
  const slug = publicSlug(slugs, kind, enSlug, locale);
  return locale === 'en' ? `/${kind}/${slug}` : `/${locale}/${kind}/${slug}`;
}

/**
 * English is the reviewed source; a translation is indexable only once a native reviewer sets
 * `reviewed: true` (the same rule as the locale homes, LOCALE_META[locale].reviewed).
 * @param {{ locale: string; reviewed: boolean; noindex: boolean }} entry
 */
export function isIndexable(entry) {
  return !entry.noindex && (entry.locale === 'en' || entry.reviewed);
}

/**
 * hreflang alternates for one page: every INDEXABLE version (English + reviewed translations), each
 * listing all the others and itself — reciprocal by construction. Empty when the page asked about is
 * itself not indexable (a noindex page emits no hreflang). `x-default` is the English URL.
 * @param {ReadonlyArray<{ kind: string; enSlug: string; locale: string; reviewed: boolean; noindex: boolean }>} entries
 * @param {Record<string, Record<string, Record<string, string>>>} slugs
 * @param {string} kind
 * @param {string} enSlug
 * @param {string} locale
 * @param {string} [site]
 * @returns {Array<{ locale: string; hreflang: string; href: string }>}
 */
export function alternatesFor(entries, slugs, kind, enSlug, locale, site = SITE) {
  const versions = entries.filter((entry) => entry.kind === kind && entry.enSlug === enSlug && isIndexable(entry));
  if (!versions.some((entry) => entry.locale === locale)) return [];
  const order = Object.keys(HREFLANG);
  return versions
    .slice()
    .sort((a, b) => order.indexOf(a.locale) - order.indexOf(b.locale))
    .map((entry) => ({
      locale: entry.locale,
      hreflang: HREFLANG[/** @type {keyof typeof HREFLANG} */ (entry.locale)] ?? entry.locale,
      href: `${site}${contentPath(slugs, kind, enSlug, entry.locale)}`,
    }));
}

/**
 * Reads every content Markdown file: `src/content/{kind}/{locale}/{enSlug}.md`.
 * @param {string} contentDir
 * @returns {Promise<Array<{ kind: string; locale: string; enSlug: string; reviewed: boolean; noindex: boolean; h1: string; ogTitle: string | undefined; file: string }>>}
 */
export async function readContentIndex(contentDir) {
  const out = [];
  for (const kind of CONTENT_KINDS) {
    const locales = await readdir(path.join(contentDir, kind)).catch(() => /** @type {string[]} */ ([]));
    for (const locale of locales.sort()) {
      const files = await readdir(path.join(contentDir, kind, locale)).catch(() => /** @type {string[]} */ ([]));
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

/**
 * OG image path for a translated content page, mirroring its public URL (docs/06 §9).
 * @param {Record<string, Record<string, Record<string, string>>>} slugs
 * @param {string} kind
 * @param {string} enSlug
 * @param {string} locale
 */
export function ogImagePath(slugs, kind, enSlug, locale) {
  return `/og/${locale}/${kind}/${publicSlug(slugs, kind, enSlug, locale)}.png`;
}
