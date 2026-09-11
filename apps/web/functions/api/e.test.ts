import { describe, expect, it } from 'vitest';

import { onRequestPost as onE } from './e';
import { RATE_MAX } from '../_lib/env';
import { ipHash } from '../_lib/ratelimit';

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
