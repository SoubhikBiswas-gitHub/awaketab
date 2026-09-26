import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onE } from './e';
import { RATE_MAX } from '../_lib/env';
import { ipHash } from '../_lib/ratelimit';
import { harness, invoke, ipTraces, jsonRequest, sha256Hex } from '../../test/functions/harness';

function memoryKv() {
  const map = new Map<string, string>();
  return {
    map,
    get: async (key: string) => map.get(key) ?? null,
    put: async (key: string, value: string) => {
      map.set(key, value);
    },
    delete: async (key: string) => {
      map.delete(key);
    },
  };
}

function ae() {
  const points: Array<{ indexes: string[]; blobs: string[]; doubles: number[] }> = [];
  return {
    points,
    writeDataPoint(point: { indexes: string[]; blobs: string[]; doubles: number[] }) {
      points.push(point);
    },
  };
}

async function post(handler: typeof onE, body: unknown, env: Record<string, unknown>, ip = '203.0.113.9') {
  return handler({
    env,
    request: new Request('https://awaketab.com/api/e', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  } as unknown as Parameters<typeof onE>[0]);
}

describe('POST /api/e', () => {
  it('accepts a valid batch and drops unknown event names', async () => {
    const events = ae();
    const kv = memoryKv();
    const res = await post(
      onE,
      {
        events: [
          { event: 'page_view', path: '/?x=1', locale: 'en', sid: 's1', extra: 'drop-me' },
          { event: 'not_a_real_event', path: '/' },
        ],
      },
      { LICENSES: kv, EVENTS: events, RATE_LIMIT_SALT: 'salt' },
    );
    expect(res.status).toBe(200);
    expect(events.points).toHaveLength(1);
    expect(events.points[0]?.indexes[0]).toBe('page_view');
    expect(events.points[0]?.blobs[0]).toBe('/');
    expect(JSON.stringify([...kv.map.entries()])).not.toContain('203.0.113.9');
    expect(JSON.stringify(events.points)).not.toContain('203.0.113.9');
    expect(JSON.stringify(events.points)).not.toContain('drop-me');
  });

  it('returns 413 when the batch is larger than 20 events', async () => {
    const res = await post(onE, { events: Array.from({ length: 21 }, () => ({ event: 'page_view' })) }, { EVENTS: ae() });
    expect(res.status).toBe(413);
  });

  it('returns 429 when the hashed IP exceeds the window', async () => {
    const kv = memoryKv();
    const salt = 'salt';
    const hash = await ipHash({ RATE_LIMIT_SALT: salt, LICENSES: kv as never }, '203.0.113.9');
    const bucket = Math.floor(Date.now() / 1000 / 120);
    kv.map.set(`rl:e:${hash}:${bucket}`, String(RATE_MAX));
    const res = await post(onE, { events: [{ event: 'page_view' }] }, { LICENSES: kv, EVENTS: ae(), RATE_LIMIT_SALT: salt });
    expect(res.status).toBe(429);
  });
});

describe('POST /api/e — privacy and platform limits (harness)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  // One of every allow-listed event with every attribute the client may send.
  const FULL_BATCH = {
    events: [
      { event: 'page_view', path: '/30m?ref=x', locale: 'en', ua: 'chrome-128/mac', source: 'web', sid: 's1', viewport: 'lg', ver: 'abc' },
      { event: 'session_start', planType: 'timer', presetId: '30m', ts: 1 },
      { event: 'session_end', reason: 'user', durationMin: 42 },
      { event: 'lock_state', from: 'idle', to: 'held' },
      { event: 'lock_denied', reason: 'battery' },
      { event: 'pro_checkout_click', plan: 'pro_yearly', sku: 'pro_yearly' },
      { event: 'rating_prompt', action: 'rate', stars: 5 },
      { event: 'client_error', code: 'E_WAKE' },
      { event: 'ad_slot_loaded', page: '/learn' },
      { event: 'sponsor_click', sponsorId: 'sp1' },
      { event: 'session_extend', addedMin: 15 },
      { event: 'rating_submitted', stars: 4, ip: '203.0.113.200', clientIp: '203.0.113.200', email: 'a@b.c' },
    ],
  };

  it.each<[string, Record<string, string>, string]>([
    ['cf-connecting-ip (IPv4)', { 'cf-connecting-ip': '203.0.113.200' }, '203.0.113.200'],
    ['cf-connecting-ip (IPv6)', { 'cf-connecting-ip': '2001:db8:85a3::8a2e:370:7334' }, '2001:db8:85a3::8a2e:370:7334'],
    ['x-forwarded-for chain', { 'x-forwarded-for': '198.51.100.201, 10.0.0.2' }, '198.51.100.201'],
  ])('persists no request IP in any KV or Analytics Engine write — %s', async (_name, headers, ip) => {
    const h = harness();
    const res = await invoke(onE, h.env, jsonRequest('/api/e', FULL_BATCH, { ip: null, headers }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, n: FULL_BATCH.events.length });
    expect(h.ae.points).toHaveLength(FULL_BATCH.events.length);
    expect(h.kv.writes.length).toBeGreaterThan(0);
    expect(await ipTraces(ip, h.kv, h.ae)).toEqual([]);
    expect(await ipTraces('10.0.0.2', h.kv, h.ae)).toEqual([]);
    expect(JSON.stringify(h.ae.points)).not.toContain('a@b.c');
  });

  it('keys the rate-limit counter by the salted IP hash with a 240 s TTL', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-09-01T10:00:00.000Z'));
    const h = harness();
    await invoke(onE, h.env, jsonRequest('/api/e', { events: [{ event: 'page_view' }] }, { ip: '203.0.113.9' }));
    const salted = await ipHash(h.env, '203.0.113.9');
    expect(salted).not.toBe(await sha256Hex('203.0.113.9'));
    const bucket = Math.floor(Date.now() / 1000 / 120);
    expect(h.kv.writes).toEqual([{ op: 'put', key: `rl:e:${salted}:${String(bucket)}`, value: '1', expirationTtl: 240 }]);
  });

  it('answers 429 with Retry-After once RATE_MAX is reached', async () => {
    const h = harness();
    for (let i = 0; i < RATE_MAX; i += 1) {
      expect((await invoke(onE, h.env, jsonRequest('/api/e', { events: [] }))).status).toBe(200);
    }
    const res = await invoke(onE, h.env, jsonRequest('/api/e', { events: [] }));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('writes points inside Analytics Engine limits (1 index, 9 blobs, 2 doubles)', async () => {
    const h = harness();
    const long = { event: 'page_view', path: `/${'p'.repeat(5000)}`, locale: 'x'.repeat(500), sid: 's'.repeat(500) };
    const res = await invoke(onE, h.env, jsonRequest('/api/e', { events: [long] }));
    expect(res.status).toBe(200);
    expect(h.ae.points[0]?.indexes).toHaveLength(1);
    expect(h.ae.points[0]?.blobs).toHaveLength(9);
    expect(h.ae.points[0]?.doubles).toHaveLength(2);
    expect(h.ae.points[0]?.blobs[0]).toHaveLength(200);
  });

  it('rejects a body over 8 KB with 413 and a non-array batch with 400', async () => {
    const h = harness();
    const big = await invoke(onE, h.env, jsonRequest('/api/e', { events: [{ event: 'page_view', path: 'x'.repeat(9000) }] }));
    expect(big.status).toBe(413);
    const bad = await invoke(onE, h.env, jsonRequest('/api/e', { events: 'page_view' }));
    expect(bad.status).toBe(400);
    const junk = await invoke(onE, h.env, jsonRequest('/api/e', 'not json'));
    expect(junk.status).toBe(400);
    expect(h.ae.points).toEqual([]);
  });
});
