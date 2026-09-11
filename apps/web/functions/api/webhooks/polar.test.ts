import { describe, expect, it } from 'vitest';

import { onRequestPost } from './polar';

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

async function sign(raw: string, id: string, ts: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

describe('POST /api/webhooks/polar', () => {
  it('rejects a bad HMAC', async () => {
    const res = await onRequestPost({
      env: { POLAR_WEBHOOK_SECRET: 'secret', LICENSES: memoryKv() },
      request: new Request('https://awaketab.com/api/webhooks/polar', {
        method: 'POST',
        headers: {
          'webhook-id': 'evt_1',
          'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
          'webhook-signature': 'v1,aaaa',
        },
        body: '{}',
      }),
    } as unknown as Parameters<typeof onRequestPost>[0]);
    expect(res.status).toBe(401);
  });

  it('is idempotent on replay', async () => {
    const kv = memoryKv();
    const secret = 'secret';
    const raw = JSON.stringify({
      type: 'order.created',
      data: { id: 'ord_1', customer_id: 'c1', license_key: { key: 'ATAB-WEBHOOK-KEY-1234567', limit_activations: 5 } },
    });
    const id = 'evt_replay';
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await sign(raw, id, ts, secret);
    const env = { POLAR_WEBHOOK_SECRET: secret, LICENSES: kv, LICENSE_KEY_ENC_KEY: btoa('1'.repeat(32)) };
    const once = () =>
      onRequestPost({
        env,
        request: new Request('https://awaketab.com/api/webhooks/polar', {
          method: 'POST',
          headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': sig },
          body: raw,
        }),
      } as unknown as Parameters<typeof onRequestPost>[0]);
    expect((await once()).status).toBe(200);
    const keys = [...kv.map.keys()].sort();
    expect((await once()).status).toBe(200);
    expect([...kv.map.keys()].sort()).toEqual(keys);
  });
});
