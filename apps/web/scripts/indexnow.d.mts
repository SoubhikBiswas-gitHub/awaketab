export const INDEXNOW_ENDPOINT: string;
export const MAX_URLS: number;
export function validKey(key: string | undefined): boolean;
export function readKey(env?: Record<string, string | undefined>): { key: string } | { key: null; reason: string };
export function sitemapLocs(xml: string): string[];
export function selectUrls(urls: readonly string[], site?: string): string[];
export function changedUrls(
  files: readonly string[],
  pages: ReadonlyArray<{ kind: string; enSlug: string; locale: string; reviewed: boolean; noindex: boolean; file: string }>,
  slugs: Record<string, Record<string, Record<string, string>>>,
  site?: string,
): 'all' | Set<string>;
export interface IIndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}
export function payloads(key: string, urls: readonly string[], site?: string): IIndexNowPayload[];
export function readSitemapUrls(opts: { from: 'live' | 'dist'; dist: string; site: string; fetchFn: typeof fetch }): Promise<string[]>;
export function ping(opts: {
  key: string;
  urls: readonly string[];
  site?: string;
  fetchFn?: typeof fetch;
  dryRun?: boolean;
  log?: (line: string) => void;
}): Promise<{ sent: number }>;
