import { describe, expect, it } from 'vitest';

import { onRequestGet } from './config';
import { onRequestPost as onRating } from '../rating';

function memoryKv() {
  const map = new Map<string, string>();
  return {
    map,
    get: async (key: string) => map.get(key) ?? null,
    put: async (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('GET /api/embed/config', () => {
  it('returns unlicensed for an unknown domain', async () => {
    const res = await onRequestGet({
      env: { LICENSES: memoryKv() },
      request: new Request('https://awaketab.com/api/embed/config?domain=example.com'),
    } as unknown as Parameters<typeof onRequestGet>[0]);
    const json = (await res.json()) as { licensed: boolean };
    expect(json.licensed).toBe(false);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
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
