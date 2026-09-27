// Workers KV over the Cloudflare REST API (https://developers.cloudflare.com/api/resources/kv/).
// Plain `fetch`, no wrangler: the scripts need five endpoints, and a pinned wrangler would add ~100 MB of
// install to every CI run for them. Endpoints used:
//
//   GET  /accounts/{a}/storage/kv/namespaces/{n}                     namespace title (production guard)
//   GET  /accounts/{a}/storage/kv/namespaces/{n}/keys?prefix&cursor   listing with expiration + metadata
//   POST /accounts/{a}/storage/kv/namespaces/{n}/bulk/get             up to 100 values per request
//   GET  /accounts/{a}/storage/kv/namespaces/{n}/values/{key}         fallback when bulk/get is unavailable
//   PUT  /accounts/{a}/storage/kv/namespaces/{n}/bulk                 up to 10,000 writes per request
//
// Every call retries 429 / 5xx / network errors with backoff (the API allows 1,200 requests per 5 min) and
// any other failure throws with the API's error message, so a scheduled backup fails loudly.
import type { IKvRecord } from './format.ts';
import type { IKvListPage, IKvStore } from './store.ts';

export const CF_API = 'https://api.cloudflare.com/client/v4';
const LIST_LIMIT = 1000;
const BULK_GET_LIMIT = 100;
const BULK_PUT_LIMIT = 1000;

export interface ICloudflareKvOptions {
  accountId: string;
  namespaceId: string;
  apiToken: string;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  retries?: number;
}

interface ICfEnvelope<TResult> {
  success?: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  result?: TResult;
  result_info?: { cursor?: string; count?: number };
}

function chunk<TItem>(items: TItem[], size: number): TItem[][] {
  const out: TItem[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

async function errorCodes(response: Response): Promise<number[]> {
  try {
    const body = (await response.clone().json()) as ICfEnvelope<unknown>;
    return (body.errors ?? []).map((error) => error.code ?? 0);
  } catch {
    return [];
  }
}

const isKvError = (code: number): boolean => code >= 10_000 && code < 11_000;
const KEY_NOT_FOUND = 10_009;

export class CloudflareKv implements IKvStore {
  private readonly base: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly retries: number;
  private bulkGet = true;

  constructor(private readonly options: ICloudflareKvOptions) {
    if (!options.accountId || !options.namespaceId || !options.apiToken) {
      throw new Error('CloudflareKv needs accountId, namespaceId and apiToken');
    }
    this.base = `${CF_API}/accounts/${encodeURIComponent(options.accountId)}/storage/kv/namespaces/${encodeURIComponent(options.namespaceId)}`;
    this.fetchImpl = options.fetch ?? fetch;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.retries = options.retries ?? 4;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${this.options.apiToken}`);
    if (init.body !== undefined) headers.set('content-type', 'application/json');
    for (let attempt = 0; ; attempt += 1) {
      let response: Response | null = null;
      let failure: unknown = null;
      try {
        response = await this.fetchImpl(`${this.base}${path}`, { ...init, headers });
      } catch (error) {
        failure = error;
      }
      if (response && response.status !== 429 && response.status < 500) return response;
      if (attempt >= this.retries) {
        if (response) return response;
        throw new Error(`Cloudflare API unreachable: ${failure instanceof Error ? failure.message : String(failure)}`);
      }
      const retryAfter = Number(response?.headers.get('retry-after'));
      await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
    }
  }

  private async json<TResult>(what: string, response: Response): Promise<ICfEnvelope<TResult>> {
    const text = await response.text();
    let body: ICfEnvelope<TResult> = {};
    try {
      body = JSON.parse(text) as ICfEnvelope<TResult>;
    } catch {
      // fall through: reported below with the HTTP status
    }
    if (!response.ok || body.success === false) {
      const detail = body.errors
        ?.map((error) => `${String(error.code ?? '')} ${error.message ?? ''}`.trim())
        .join('; ');
      throw new Error(`Cloudflare API ${what} failed: HTTP ${String(response.status)}${detail ? ` — ${detail}` : ''}`);
    }
    return body;
  }

  async title(): Promise<string> {
    const body = await this.json<{ title?: string }>('namespace lookup', await this.request(''));
    return body.result?.title ?? '';
  }

  async list(prefix: string, cursor?: string): Promise<IKvListPage> {
    const query = new URLSearchParams({ prefix, limit: String(LIST_LIMIT) });
    if (cursor) query.set('cursor', cursor);
    const body = await this.json<Array<{ name: string; expiration?: number; metadata?: unknown }>>(
      `list ${prefix}*`,
      await this.request(`/keys?${query.toString()}`),
    );
    const keys = (body.result ?? []).map((row) => {
      const info: IKvListPage['keys'][number] = { name: row.name };
      if (typeof row.expiration === 'number') info.expiration = row.expiration;
      if (row.metadata !== undefined && row.metadata !== null) info.metadata = row.metadata;
      return info;
    });
    const next = body.result_info?.cursor;
    return next ? { keys, cursor: next } : { keys };
  }

  private async getOne(key: string): Promise<string | null> {
    const response = await this.request(`/values/${encodeURIComponent(key)}`);
    if (response.status === 404) {
      const codes = await errorCodes(response);
      // Only "key not found" means absent; a missing namespace or a bad token must not read as an empty KV.
      if (codes.includes(KEY_NOT_FOUND) || !codes.some(isKvError)) return null;
    }
    if (!response.ok) await this.json('get value', response);
    return response.text();
  }

  async getMany(keys: string[]): Promise<Map<string, string | null>> {
    const out = new Map<string, string | null>();
    for (const part of chunk(keys, BULK_GET_LIMIT)) {
      if (this.bulkGet) {
        const response = await this.request('/bulk/get', {
          method: 'POST',
          body: JSON.stringify({ keys: part, type: 'text' }),
        });
        // An API without bulk reads answers 404/405 with no KV error code: switch to one GET per key for the
        // rest of the run. A KV error (e.g. 10013 namespace not found) still fails below.
        if ((response.status === 404 || response.status === 405) && !(await errorCodes(response)).some(isKvError)) {
          this.bulkGet = false;
        } else {
          const body = await this.json<{ values?: Record<string, unknown> }>('bulk get', response);
          const values = body.result?.values ?? {};
          for (const key of part) {
            const value = values[key];
            if (value !== null && value !== undefined && typeof value !== 'string') {
              throw new Error(`Cloudflare API bulk get returned a non-text value for ${key}`);
            }
            out.set(key, value ?? null);
          }
          continue;
        }
      }
      for (const key of part) out.set(key, await this.getOne(key));
    }
    return out;
  }

  async putMany(records: IKvRecord[]): Promise<void> {
    for (const part of chunk(records, BULK_PUT_LIMIT)) {
      const payload = part.map((row) => ({
        key: row.key,
        value: row.value,
        ...(row.expiration !== undefined ? { expiration: row.expiration } : {}),
        ...(row.metadata !== undefined ? { metadata: row.metadata } : {}),
      }));
      const body = await this.json<{ unsuccessful_keys?: string[] }>(
        'bulk write',
        await this.request('/bulk', { method: 'PUT', body: JSON.stringify(payload) }),
      );
      const failed = body.result?.unsuccessful_keys ?? [];
      if (failed.length > 0)
        throw new Error(
          `Cloudflare API bulk write rejected ${String(failed.length)} keys: ${failed.slice(0, 5).join(', ')}`,
        );
    }
  }
}
