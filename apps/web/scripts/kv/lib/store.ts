// The narrow KV surface the ops scripts need. `cloudflare.ts` implements it over the Cloudflare REST API
// (the scripts run outside a Worker, so there is no binding); tests use an in-memory implementation.
import type { IKvRecord } from './format.ts';

export interface IKvKeyInfo {
  name: string;
  expiration?: number;
  metadata?: unknown;
}

export interface IKvListPage {
  keys: IKvKeyInfo[];
  cursor?: string;
}

export interface IKvStore {
  list(prefix: string, cursor?: string): Promise<IKvListPage>;
  getMany(keys: string[]): Promise<Map<string, string | null>>;
  putMany(records: IKvRecord[]): Promise<void>;
}

export async function* listPages(store: IKvStore, prefix: string): AsyncGenerator<IKvKeyInfo[]> {
  let cursor: string | undefined;
  do {
    const page = await store.list(prefix, cursor);
    yield page.keys;
    cursor = page.cursor ? page.cursor : undefined;
  } while (cursor);
}

export async function readPage(store: IKvStore, keys: IKvKeyInfo[]): Promise<IKvRecord[]> {
  if (keys.length === 0) return [];
  const values = await store.getMany(keys.map((row) => row.name));
  const out: IKvRecord[] = [];
  for (const info of keys) {
    const value = values.get(info.name);
    if (value === null || value === undefined) continue;
    const row: IKvRecord = { key: info.name, value };
    if (info.expiration !== undefined) row.expiration = info.expiration;
    if (info.metadata !== undefined && info.metadata !== null) row.metadata = info.metadata;
    out.push(row);
  }
  return out;
}

export async function readAll(
  store: IKvStore,
  prefixes: readonly string[],
  onPage?: (read: number) => void,
): Promise<IKvRecord[]> {
  const out: IKvRecord[] = [];
  for (const prefix of prefixes) {
    for await (const keys of listPages(store, prefix)) {
      out.push(...(await readPage(store, keys)));
      onPage?.(out.length);
    }
  }
  return out.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

export function isExpiredForWrite(row: { expiration?: number }, nowMs: number): boolean {
  return row.expiration !== undefined && row.expiration * 1000 < nowMs + 60_000;
}
