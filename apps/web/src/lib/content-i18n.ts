import { getCollection, type CollectionEntry } from 'astro:content';
import slugsJson from '../i18n/slugs.json';
import { isLocale, type TLocale } from '../i18n/locales';
import {
  alternatesFor,
  contentPath,
  isIndexable,
  ogImagePath,
  publicSlug,
  type IAlternate,
  type TSlugMap,
} from '../../scripts/translations.mjs';

export type TContentKind = 'for' | 'on' | 'vs' | 'guides' | 'learn';
export const CONTENT_KINDS: readonly TContentKind[] = ['for', 'on', 'vs', 'guides', 'learn'];

const SLUGS = slugsJson as TSlugMap;

export interface IIndexedPage {
  kind: TContentKind;
  locale: TLocale;
  enSlug: string;
  reviewed: boolean;
  noindex: boolean;
  h1: string;
  entry: CollectionEntry<TContentKind>;
}

export function splitEntryId(id: string): { locale: TLocale; enSlug: string } {
  const [first = '', ...rest] = id.split('/');
  if (!isLocale(first) || rest.length !== 1 || !rest[0]) throw new Error(`Unexpected content entry id: ${id}`);
  return { locale: first, enSlug: rest[0] };
}

let cached: Promise<IIndexedPage[]> | undefined;

export function contentIndex(): Promise<IIndexedPage[]> {
  cached ??= (async () => {
    const pages: IIndexedPage[] = [];
    for (const kind of CONTENT_KINDS) {
      const entries: Array<CollectionEntry<TContentKind>> = await getCollection(kind);
      for (const entry of entries) {
        const { locale, enSlug } = splitEntryId(entry.id);
        if (entry.data.locale !== locale) {
          throw new Error(`${kind}/${entry.id}: frontmatter locale "${entry.data.locale}" does not match its folder`);
        }
        if (locale !== 'en' && entry.data.translationOf !== enSlug) {
          throw new Error(`${kind}/${entry.id}: translationOf must be "${enSlug}"`);
        }
        pages.push({
          kind,
          locale,
          enSlug,
          reviewed: entry.data.reviewed,
          noindex: entry.data.noindex,
          h1: entry.data.h1,
          entry,
        });
      }
    }
    return pages;
  })();
  return cached;
}

export function pagePath(kind: TContentKind, enSlug: string, locale: TLocale): string {
  return contentPath(SLUGS, kind, enSlug, locale);
}

export function pageSlug(kind: TContentKind, enSlug: string, locale: TLocale): string {
  return publicSlug(SLUGS, kind, enSlug, locale);
}

export function pageOgImage(kind: TContentKind, enSlug: string, locale: TLocale): string {
  return ogImagePath(SLUGS, kind, enSlug, locale);
}

export function pageIndexable(page: Pick<IIndexedPage, 'locale' | 'reviewed' | 'noindex'>): boolean {
  return isIndexable(page);
}

export function pageAlternates(
  index: readonly IIndexedPage[],
  kind: TContentKind,
  enSlug: string,
  locale: TLocale,
  site: string,
): Array<IAlternate & { locale: TLocale }> {
  return alternatesFor(index, SLUGS, kind, enSlug, locale, site).filter(
    (item): item is IAlternate & { locale: TLocale } => isLocale(item.locale),
  );
}

export function pageTranslations(
  index: readonly IIndexedPage[],
  kind: TContentKind,
  enSlug: string,
): Partial<Record<TLocale, string>> {
  const links: Partial<Record<TLocale, string>> = {};
  for (const page of index) {
    if (page.kind === kind && page.enSlug === enSlug) links[page.locale] = pagePath(kind, enSlug, page.locale);
  }
  return links;
}
