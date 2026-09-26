export const STATIC_IMPORT: RegExp;
export const DYNAMIC_IMPORT: RegExp;
export function gz(buf: Uint8Array | string): number;
export function entryScripts(html: string): string[];
export function closure(entries: string[], opts: { dynamic: boolean }): Promise<Set<string>>;
export function gzTotal(files: Iterable<string>): Promise<number>;
export interface IPageJs {
  html: string;
  critical: Set<string>;
  all: Set<string>;
  criticalBytes: number;
  totalBytes: number;
  files(set: Set<string>): string[];
}
export function pageJs(dist: string, rel: string): Promise<IPageJs>;
export function embedEntryHashed(html: string, pattern: RegExp): boolean;
