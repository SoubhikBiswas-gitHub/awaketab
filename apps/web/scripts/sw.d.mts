export interface IPrecacheEntry {
  url: string;
  revision: string | null;
}

export const SHELL_PAGES: Array<[url: string, file: string]>;
export function precacheManifest(dist?: string): Promise<IPrecacheEntry[]>;
export function buildServiceWorker(dist?: string): Promise<{ entries: number; bytes: number }>;
