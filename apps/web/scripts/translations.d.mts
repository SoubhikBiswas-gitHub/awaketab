export type TContentKind = 'for' | 'on' | 'vs' | 'guides' | 'learn';
export type TSlugMap = Record<string, Record<string, Record<string, string>>>;

export interface IContentIndexEntry {
  kind: string;
  enSlug: string;
  locale: string;
  reviewed: boolean;
  noindex: boolean;
}

export interface IContentFileEntry extends IContentIndexEntry {
  h1: string;
  ogTitle: string | undefined;
  file: string;
}

export interface IAlternate {
  locale: string;
  hreflang: string;
  href: string;
}

export const CONTENT_KINDS: readonly TContentKind[];
export const SITE: string;
export const HREFLANG: Readonly<Record<'en' | 'es' | 'pt-br' | 'de' | 'fr' | 'ja' | 'zh' | 'hi', string>>;

export function frontmatterScalars(text: string): Record<string, string | boolean>;
export function publicSlug(slugs: TSlugMap, kind: string, enSlug: string, locale: string): string;
export function contentPath(slugs: TSlugMap, kind: string, enSlug: string, locale: string): string;
export function isIndexable(entry: Pick<IContentIndexEntry, 'locale' | 'reviewed' | 'noindex'>): boolean;
export function alternatesFor(
  entries: readonly IContentIndexEntry[],
  slugs: TSlugMap,
  kind: string,
  enSlug: string,
  locale: string,
  site?: string,
): IAlternate[];
export function readContentIndex(contentDir: string): Promise<IContentFileEntry[]>;
export function ogImagePath(slugs: TSlugMap, kind: string, enSlug: string, locale: string): string;
