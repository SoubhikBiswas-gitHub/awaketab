export interface IPrecacheEntry {
  url: string;
  revision: string | null;
}

export interface IShellEntry {
  url: string;
  revision: string;
  lang: string;
  install: boolean;
}

export const SHELL_PAGES: Array<{ lang: string; url: string; file: string; install: boolean }>;
export function precacheManifest(dist?: string): Promise<IPrecacheEntry[]>;
export function shellManifest(dist?: string): Promise<IShellEntry[]>;
export function buildServiceWorker(dist?: string): Promise<{ entries: number; shell: number; bytes: number }>;
