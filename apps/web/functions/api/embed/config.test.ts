import { describe, expect, it } from 'vitest';

import { onRequestGet } from './config';
import { candidateDomains, normalizeDomain } from '../../_lib/embed';
import { mapEvent } from '../../_lib/events';
import { onRequestPost as onRating } from '../rating';

function memoryKv(seed: Record<string, unknown> = {}) {
  const map = new Map<string, string>(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)]));
  const reads: string[] = [];
  return {
    map,
    reads,
    get: async (key: string) => {
      reads.push(key);
      return map.get(key) ?? null;
    },
    put: async (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

async function config(domain: string, kv = memoryKv()) {
  const res = await onRequestGet({
    env: { LICENSES: kv },
    request: new Request(`https://awaketab.com/api/embed/config?domain=${encodeURIComponent(domain)}`),
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return { res, json: (await res.json()) as Record<string, unknown>, kv };
}

const FUTURE = Date.now() + 30 * 86_400_000;
const licensed = { keyHash: 'k1', attribution: false, theme: { accent: '#0F766E', scheme: 'dark' }, expiresAt: FUTURE };

describe('GET /api/embed/config (docs/09 §7.1, docs/11 §2)', () => {
  it('returns unlicensed for an unknown domain, publicly cached for 5 minutes', async () => {
    const { res, json } = await config('example.com');
    expect(json).toEqual({ licensed: false, attribution: true, theme: null, expiresAt: null });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('removes the attribution and returns a validated theme for a licensed domain', async () => {
    const kv = memoryKv({ 'embed:example.com': licensed, 'lic:k1': { status: 'active' } });
    const { json } = await config('example.com', kv);
    expect(json).toEqual({ licensed: true, attribution: false, theme: { accent: '#0f766e', scheme: 'dark' }, expiresAt: FUTURE });
  });

  it('covers www., staging. and other subdomains of the licensed registrable domain', async () => {
    const kv = memoryKv({ 'embed:example.com': licensed });
    for (const host of ['www.example.com', 'staging.example.com', 'a.b.example.com']) {
      expect((await config(host, kv)).json.licensed, host).toBe(true);
    }
    expect((await config('example.org', kv)).json.licensed).toBe(false);
    expect((await config('notexample.com', kv)).json.licensed).toBe(false);
  });

  it('lets the attribution return once the licence (incl. grace) has expired', async () => {
    const kv = memoryKv({ 'embed:example.com': { ...licensed, expiresAt: Date.now() - 1000 } });
    expect((await config('example.com', kv)).json).toMatchObject({ licensed: false, attribution: true });
  });

  it('honours a revoked or refunded key without waiting for the embed record to be removed', async () => {
    for (const status of ['revoked', 'refunded']) {
      const kv = memoryKv({ 'embed:example.com': licensed, 'lic:k1': { status } });
      expect((await config('example.com', kv)).json.licensed, status).toBe(false);
    }
  });

  it('never touches KV for a malformed domain and strips unsafe theme values', async () => {
    for (const bad of ['', 'localhost', 'exa mple.com', '<script>.com', 'a'.repeat(300)]) {
      const { json, kv } = await config(bad);
      expect(json.licensed, bad).toBe(false);
      expect(kv.reads, bad).toEqual([]);
    }
    const kv = memoryKv({ 'embed:example.com': { ...licensed, theme: { accent: 'red;x', scheme: 'neon' } } });
    expect((await config('example.com', kv)).json.theme).toEqual({ accent: null, scheme: 'auto' });
  });

  it('normalises hosts and URLs to lower-case hostnames without www.', () => {
    expect(normalizeDomain('https://WWW.Example.com/recipes?x=1')).toBe('example.com');
    expect(normalizeDomain('example.com.')).toBe('example.com');
    expect(normalizeDomain('http://[::1]/')).toBeNull();
    expect(candidateDomains('a.b.example.co.uk')).toEqual(['a.b.example.co.uk', 'b.example.co.uk', 'example.co.uk', 'co.uk']);
  });
});

describe('embed analytics columns (docs/11 §8)', () => {
  const row = { event: 'page_view', path: '/embed/cook', locale: 'en', ua: 'chrome-130/win', source: 'embed', sid: 's', viewport: 'sm', ver: 'v', ts: 1 };

  it('stores the embedding hostname in blob6 for the widget page_view', () => {
    expect(mapEvent({ ...row, host: 'recipes.example.com' }, 1)?.blobs[5]).toBe('recipes.example.com');
    expect(mapEvent({ ...row, host: 'https://recipes.example.com/path' }, 1)?.blobs[5]).toBe('');
    expect(mapEvent({ ...row, source: 'web', host: 'recipes.example.com' }, 1)?.blobs[5]).toBe('');
  });

  it('stores the attribution click target in blob7', () => {
    expect(mapEvent({ ...row, event: 'share_click', target: 'attribution' }, 1)?.blobs[6]).toBe('attribution');
    expect(mapEvent({ ...row, event: 'share_click', target: 'https://x.test' }, 1)?.blobs[6]).toBe('');
  });
});

describe('POST /api/rating', () => {
  it('rejects stars outside 1–5', async () => {
    const res = await onRating({
      env: { LICENSES: memoryKv(), RATE_LIMIT_SALT: 's' },
      request: new Request('https://awaketab.com/api/rating', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
        body: JSON.stringify({ stars: 9 }),
      }),
    } as unknown as Parameters<typeof onRating>[0]);
    expect(res.status).toBe(400);
  });
});
