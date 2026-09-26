// @vitest-environment node
// CloudflareKv against a fake of the Cloudflare KV REST API served through an injected `fetch` (no network).
import { describe, expect, it } from 'vitest';

import { exportNamespace } from '../lib/backup.ts';
import { CF_API, CloudflareKv } from '../lib/cloudflare.ts';
import { planRestore, applyRestore } from '../lib/restore.ts';

const TOKEN = 'cf-test-token';
const ACCOUNT = 'acc123';
const BACKUP_KEY = Buffer.alloc(32, 9).toString('base64');
const FUTURE = Math.floor(Date.now() / 1000) + 86_400 * 30;

interface IRow {
  value: string;
  expiration?: number;
  metadata?: unknown;
}

class FakeCloudflare {
  readonly namespaces = new Map<string, { title: string; rows: Map<string, IRow> }>();
  readonly calls: string[] = [];
  bulkGetSupported = true;
  /** Status codes to answer (in order) before serving normally. */
  queued: Array<{ status: number; headers?: Record<string, string> } | 'network'> = [];
  listLimit = 2;
  rejectKeys = new Set<string>();

  addNamespace(id: string, title: string): Map<string, IRow> {
    const rows = new Map<string, IRow>();
    this.namespaces.set(id, { title, rows });
    return rows;
  }

  readonly fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    this.calls.push(`${method} ${url.pathname}${url.search}`);
    const next = this.queued.shift();
    if (next === 'network') return Promise.reject(new TypeError('fetch failed'));
    if (next) return Promise.resolve(new Response('{"success":false,"errors":[]}', { status: next.status, headers: next.headers ?? {} }));
    if (new Headers(init?.headers).get('authorization') !== `Bearer ${TOKEN}`) {
      return Promise.resolve(Response.json({ success: false, errors: [{ code: 10000, message: 'Authentication error' }] }, { status: 403 }));
    }
    const prefix = `/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/`;
    if (!url.pathname.startsWith(prefix)) return Promise.resolve(new Response('no', { status: 404 }));
    const [id = '', ...rest] = url.pathname.slice(prefix.length).split('/');
    const ns = this.namespaces.get(decodeURIComponent(id));
    if (!ns) return Promise.resolve(Response.json({ success: false, errors: [{ code: 10013, message: 'namespace not found' }] }, { status: 404 }));
    const route = rest.join('/');
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : null;

    if (route === '' && method === 'GET') return Promise.resolve(Response.json({ success: true, result: { id, title: ns.title } }));
    if (route === 'keys' && method === 'GET') {
      const names = [...ns.rows.keys()].filter((key) => key.startsWith(url.searchParams.get('prefix') ?? '')).sort();
      const start = Number(url.searchParams.get('cursor') || '0');
      const page = names.slice(start, start + this.listLimit).map((name) => {
        const row = ns.rows.get(name) as IRow;
        return { name, ...(row.expiration ? { expiration: row.expiration } : {}), ...(row.metadata ? { metadata: row.metadata } : {}) };
      });
      const more = start + this.listLimit < names.length;
      return Promise.resolve(
        Response.json({ success: true, result: page, result_info: { count: page.length, cursor: more ? String(start + this.listLimit) : '' } }),
      );
    }
    if (route === 'bulk/get' && method === 'POST') {
      if (!this.bulkGetSupported) return Promise.resolve(new Response('Not Found', { status: 404 }));
      const { keys } = body as { keys: string[] };
      if (keys.length > 100) return Promise.resolve(Response.json({ success: false, errors: [{ code: 10001, message: 'too many keys' }] }, { status: 400 }));
      const values = Object.fromEntries(keys.map((key) => [key, ns.rows.get(key)?.value ?? null]));
      return Promise.resolve(Response.json({ success: true, result: { values } }));
    }
    if (route.startsWith('values/') && method === 'GET') {
      const row = ns.rows.get(decodeURIComponent(route.slice('values/'.length)));
      return Promise.resolve(row ? new Response(row.value) : Response.json({ success: false, errors: [{ code: 10009, message: 'key not found' }] }, { status: 404 }));
    }
    if (route === 'bulk' && method === 'PUT') {
      const unsuccessful: string[] = [];
      for (const row of body as Array<{ key: string; value: string; expiration?: number; metadata?: unknown }>) {
        if (this.rejectKeys.has(row.key)) {
          unsuccessful.push(row.key);
          continue;
        }
        ns.rows.set(row.key, {
          value: row.value,
          ...(row.expiration ? { expiration: row.expiration } : {}),
          ...(row.metadata ? { metadata: row.metadata } : {}),
        });
      }
      return Promise.resolve(Response.json({ success: true, result: { successful_key_count: 0, unsuccessful_keys: unsuccessful } }));
    }
    return Promise.resolve(new Response('no route', { status: 404 }));
  };
}

function client(api: FakeCloudflare, namespaceId: string, sleeps: number[] = [], token = TOKEN): CloudflareKv {
  return new CloudflareKv({
    accountId: ACCOUNT,
    namespaceId,
    apiToken: token,
    fetch: api.fetch,
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
  });
}

function seed(rows: Map<string, IRow>): void {
  rows.set('lic:a', { value: '{"keyEnc":"x"}', expiration: FUTURE, metadata: { v: 1 } });
  rows.set('lic:b', { value: '{"keyEnc":"y"}' });
  rows.set('lic:c/d?e', { value: '{"keyEnc":"z"}' });
  rows.set('cus:1', { value: '["a","b"]' });
  rows.set('wh:evt', { value: '{}', expiration: FUTURE });
}

describe('CloudflareKv', () => {
  it('lists across cursor pages with expiration and metadata, and reads values in bulk', async () => {
    const api = new FakeCloudflare();
    seed(api.addNamespace('prod', 'LICENSES'));
    const kv = client(api, 'prod');
    expect(await kv.title()).toBe('LICENSES');
    const first = await kv.list('lic:');
    expect(first).toEqual({ keys: [{ name: 'lic:a', expiration: FUTURE, metadata: { v: 1 } }, { name: 'lic:b' }], cursor: '2' });
    expect((await kv.list('lic:', first.cursor)).keys.map((row) => row.name)).toEqual(['lic:c/d?e']);
    const values = await kv.getMany(['lic:a', 'lic:missing']);
    expect(values.get('lic:a')).toBe('{"keyEnc":"x"}');
    expect(values.get('lic:missing')).toBeNull();
    expect(api.calls[0]).toBe(`GET /client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/prod`);
    expect(CF_API).toBe('https://api.cloudflare.com/client/v4');
  });

  it('falls back to one GET per key when bulk reads are unavailable, encoding key names', async () => {
    const api = new FakeCloudflare();
    seed(api.addNamespace('prod', 'LICENSES'));
    api.bulkGetSupported = false;
    const kv = client(api, 'prod');
    const values = await kv.getMany(['lic:c/d?e', 'lic:nope']);
    expect(values.get('lic:c/d?e')).toBe('{"keyEnc":"z"}');
    expect(values.get('lic:nope')).toBeNull();
    expect(api.calls).toContain(`GET /client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/prod/values/lic%3Ac%2Fd%3Fe`);
  });

  it('never mistakes a missing namespace for missing keys', async () => {
    const api = new FakeCloudflare();
    await expect(client(api, 'gone').getMany(['lic:a'])).rejects.toThrow(/bulk get failed: HTTP 404 — 10013/u);
    api.bulkGetSupported = false;
    api.addNamespace('prod', 'LICENSES');
    const kv = client(api, 'prod');
    expect((await kv.getMany(['lic:a'])).get('lic:a')).toBeNull(); // switches to per-key reads
    api.namespaces.delete('prod');
    await expect(kv.getMany(['lic:a'])).rejects.toThrow(/get value failed: HTTP 404 — 10013/u);
  });

  it('retries 429 (honouring Retry-After), 5xx and network errors, then gives up loudly', async () => {
    const api = new FakeCloudflare();
    seed(api.addNamespace('prod', 'LICENSES'));
    const sleeps: number[] = [];
    const kv = client(api, 'prod', sleeps);
    api.queued = [{ status: 429, headers: { 'retry-after': '7' } }, { status: 503 }, 'network'];
    expect(await kv.title()).toBe('LICENSES');
    expect(sleeps).toEqual([7000, 2000, 4000]);

    api.queued = Array.from({ length: 5 }, () => ({ status: 502 }));
    await expect(kv.title()).rejects.toThrow(/namespace lookup failed: HTTP 502/u);
    api.queued = Array.from({ length: 5 }, () => 'network' as const);
    await expect(kv.list('lic:')).rejects.toThrow(/unreachable/u);
  });

  it('reports the API error for auth failures and rejected writes', async () => {
    const api = new FakeCloudflare();
    api.addNamespace('prod', 'LICENSES');
    await expect(client(api, 'prod', [], 'wrong').list('lic:')).rejects.toThrow(/HTTP 403 — 10000 Authentication error/u);
    api.rejectKeys.add('lic:x');
    await expect(client(api, 'prod').putMany([{ key: 'lic:x', value: '1' }])).rejects.toThrow(/rejected 1 keys: lic:x/u);
    expect(() => new CloudflareKv({ accountId: '', namespaceId: 'n', apiToken: 't' })).toThrow(/accountId/u);
  });

  it('backs up one namespace and restores it into another with expirations and metadata intact', async () => {
    const api = new FakeCloudflare();
    seed(api.addNamespace('prod', 'LICENSES'));
    const drill = api.addNamespace('drill', 'LICENSES_PREVIEW');
    const { backup } = await exportNamespace(client(api, 'prod'), { namespace: 'LICENSES', namespaceId: 'prod', encryptionKey: BACKUP_KEY });
    expect(backup.records.map((row) => row.key)).toEqual(['cus:1', 'lic:a', 'lic:b', 'lic:c/d?e']);

    const target = client(api, 'drill');
    const plan = await planRestore(backup.records, target);
    expect(plan.create).toHaveLength(4);
    expect(await applyRestore(plan, target, false)).toBe(4);
    expect(drill.get('lic:a')).toEqual({ value: '{"keyEnc":"x"}', expiration: FUTURE, metadata: { v: 1 } });
    expect(drill.has('wh:evt')).toBe(false);
    expect((await planRestore(backup.records, target)).same).toHaveLength(4);
  });
});
