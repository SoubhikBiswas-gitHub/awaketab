import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onRating } from './rating';
import { harness, invoke, ipTraces, jsonRequest, TEST_IP, type IHarness } from '../../test/functions/harness';

const T0 = Date.parse('2026-09-01T10:00:00.000Z');

function rate(h: IHarness, body: unknown, opts: { ip?: string | null; headers?: Record<string, string> } = {}) {
  return invoke(onRating, h.env, jsonRequest('/api/rating', body, opts));
}

function ratingWrites(h: IHarness) {
  return h.kv.writesTo('rating:');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('POST /api/rating', () => {
  it('stores { stars, text, locale, ver, at } under rating:{uuid} for 2 years', async () => {
    const h = harness();
    // The body the island sends (apps/web/src/tool/ui/rating.ts).
    const res = await rate(h, { stars: 5, text: 'Kept my recipe up all evening', locale: 'pt-br', ver: 1 });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as { ok: boolean; id: string };
    expect(body.ok).toBe(true);
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    expect(h.kv.json(`rating:${body.id}`)).toEqual({
      stars: 5,
      text: 'Kept my recipe up all evening',
      locale: 'pt-br',
      ver: '0f5d2d4c0ffe',
      at: T0,
    });
    expect(ratingWrites(h)[0]?.expirationTtl).toBe(2 * 365 * 86_400);
  });

  it('omits empty text, defaults locale to en, truncates text to 500 and locale to 16', async () => {
    const h = harness();
    const a = (await (await rate(h, { stars: 3 })).json()) as { id: string };
    expect(h.kv.json(`rating:${a.id}`)).toEqual({ stars: 3, locale: 'en', ver: '0f5d2d4c0ffe', at: T0 });
    const b = (await (await rate(h, { stars: 4, text: 'x'.repeat(900), locale: 'x'.repeat(40) })).json()) as { id: string };
    const stored = h.kv.json<{ text: string; locale: string }>(`rating:${b.id}`);
    expect(stored?.text).toHaveLength(500);
    expect(stored?.locale).toHaveLength(16);
  });

  it('uses ver "dev" when no commit SHA is bound', async () => {
    const h = harness({ CF_PAGES_COMMIT_SHA: undefined });
    const { id } = (await (await rate(h, { stars: 2 })).json()) as { id: string };
    expect(h.kv.json<{ ver: string }>(`rating:${id}`)?.ver).toBe('dev');
  });

  it('drops fields outside the allow-list', async () => {
    const h = harness();
    await rate(h, { stars: 4, email: 'someone@example.com', name: 'Someone', ip: TEST_IP });
    const persisted = JSON.stringify(ratingWrites(h));
    expect(persisted).not.toContain('someone@example.com');
    expect(persisted).not.toContain('Someone');
  });

  it.each<[string, unknown]>([
    ['0 stars', { stars: 0 }],
    ['6 stars', { stars: 6 }],
    ['negative stars', { stars: -1 }],
    ['fractional stars', { stars: 3.5 }],
    ['non-numeric stars', { stars: 'five' }],
    ['null stars', { stars: null }],
    ['missing stars', { text: 'no stars' }],
    ['array body', [5]],
  ])('returns 400 bad_request for %s and writes no rating', async (_name, body) => {
    const h = harness();
    const res = await rate(h, body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
    expect(ratingWrites(h)).toEqual([]);
  });

  it('returns 400 for a non-JSON body', async () => {
    const h = harness();
    expect((await rate(h, 'stars=5')).status).toBe(400);
    expect(ratingWrites(h)).toEqual([]);
  });

  it('rate-limits the 11th rating per IP hash per window with Retry-After', async () => {
    const h = harness();
    for (let i = 0; i < 10; i += 1) expect((await rate(h, { stars: 5 })).status).toBe(200);
    const limited = await rate(h, { stars: 5 });
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: 'rate_limited' });
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(ratingWrites(h)).toHaveLength(10);
    expect((await rate(h, { stars: 5 }, { ip: '198.51.100.23' })).status).toBe(200);
  });

  it('stores no IP from cf-connecting-ip or x-forwarded-for', async () => {
    const h = harness();
    await rate(h, { stars: 5, text: 'great' });
    await rate(h, { stars: 4 }, { ip: null, headers: { 'x-forwarded-for': '192.0.2.44, 10.0.0.1' } });
    await rate(h, { stars: 3 }, { ip: '2001:db8::7' });
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
    expect(await ipTraces('192.0.2.44', h.kv, h.ae)).toEqual([]);
    expect(await ipTraces('2001:db8::7', h.kv, h.ae)).toEqual([]);
    expect(h.kv.keys('rl:rating:')).toHaveLength(3);
  });

  it('still answers 200 when the KV binding is missing (local dev without bindings)', async () => {
    const h = harness({ LICENSES: undefined });
    expect((await rate(h, { stars: 5 })).status).toBe(200);
  });
});
