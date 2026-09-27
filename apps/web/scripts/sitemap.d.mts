export const PAGE_SOURCES: Record<string, string[]>;
export function latest(dates: Iterable<unknown>): string | undefined;
export function gitDates(cwd?: string): Promise<(paths: string[]) => Promise<string | undefined>>;
export function contentDate(frontmatter: Record<string, unknown>): string | undefined;
export function sitemapFiles(options?: {
  root?: string;
  dateOf?: (paths: string[]) => Promise<string | undefined>;
}): Promise<Record<string, string>>;
