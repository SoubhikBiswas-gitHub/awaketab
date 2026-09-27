// In-memory KV for the ops-script tests. Not the functions harness `MemoryKv`
// (apps/web/test/functions/harness.ts): that fakes the Workers *binding* and keeps neither metadata nor
// expirations in its listing, while the ops scripts talk to the REST-shaped `IKvStore` and must round-trip
// both. Enforces the same KV write rule that matters here (absolute expiration ≥ 60 s ahead).
import type { IKvRecord } from '../lib/format.ts';
import type { IKvListPage, IKvStore } from '../lib/store.ts';

interface IRow {
  value: string;
  expiration?: number;
  metadata?: unknown;
}

export class MemoryKvStore implements IKvStore {
  readonly rows = new Map<string, IRow>();
  readonly puts: IKvRecord[] = [];
  readonly calls = { list: 0, getMany: 0, putMany: 0 };
  beforePut: ((records: IKvRecord[], call: number) => void) | null = null;

  constructor(
    public titleValue = 'LICENSES_PREVIEW',
    private readonly pageSize = 1000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  seed(key: string, value: unknown, extra: { expiration?: number; metadata?: unknown } = {}): this {
    this.rows.set(key, { value: typeof value === 'string' ? value : JSON.stringify(value), ...extra });
    return this;
  }

  record(key: string): IKvRecord | null {
    const row = this.rows.get(key);
    if (!row) return null;
    const out: IKvRecord = { key, value: row.value };
    if (row.expiration !== undefined) out.expiration = row.expiration;
    if (row.metadata !== undefined) out.metadata = row.metadata;
    return out;
  }

  json(key: string): unknown {
    const row = this.rows.get(key);
    return row ? (JSON.parse(row.value) as unknown) : null;
  }

  title(): Promise<string> {
    return Promise.resolve(this.titleValue);
  }

  list(prefix: string, cursor?: string): Promise<IKvListPage> {
    this.calls.list += 1;
    const names = [...this.rows.keys()].filter((key) => key.startsWith(prefix)).sort();
    const start = cursor ? Number(cursor) : 0;
    const page = names.slice(start, start + this.pageSize);
    const keys = page.map((name) => {
      const row = this.rows.get(name) as IRow;
      return {
        name,
        ...(row.expiration !== undefined ? { expiration: row.expiration } : {}),
        ...(row.metadata !== undefined ? { metadata: row.metadata } : {}),
      };
    });
    const next = start + this.pageSize;
    return Promise.resolve(next < names.length ? { keys, cursor: String(next) } : { keys });
  }

  getMany(keys: string[]): Promise<Map<string, string | null>> {
    this.calls.getMany += 1;
    return Promise.resolve(new Map(keys.map((key) => [key, this.rows.get(key)?.value ?? null])));
  }

  putMany(records: IKvRecord[]): Promise<void> {
    this.calls.putMany += 1;
    this.beforePut?.(records, this.calls.putMany);
    for (const row of records) {
      if (row.expiration !== undefined && row.expiration * 1000 < this.now() + 60_000) {
        return Promise.reject(new Error(`KV rejects ${row.key}: expiration must be at least 60 s ahead`));
      }
    }
    for (const row of records) {
      this.puts.push(row);
      this.rows.set(row.key, {
        value: row.value,
        ...(row.expiration !== undefined ? { expiration: row.expiration } : {}),
        ...(row.metadata !== undefined ? { metadata: row.metadata } : {}),
      });
    }
    return Promise.resolve();
  }
}
