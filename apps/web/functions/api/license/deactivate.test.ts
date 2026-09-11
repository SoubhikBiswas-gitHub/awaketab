import { describe, expect, it } from 'vitest';

import { onRequestPost as onDeactivate } from './deactivate';
import { onRequestPost as onActivate } from './activate';
import { sha256Hex } from '../../_lib/license';

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

async function signing() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return priv;
}

const DEVICE = '550e8400-e29b-41d4-a716-446655440000';
const KEY = 'ATAB-TEST-KEY-1234567890';
const ENC = btoa('0'.repeat(32));

function polarOk(): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/validate')) {
      return Response.json({
        status: 'granted',
        benefit_id: 'lk_pro_yearly',
        limit_activations: 5,
        expires_at: new Date(Date.now() + 86_400_000).toISOString(),
        customer_id: 'cus_1',
        id: 'lk_1',
      });
    }
    if (url.includes('/activate')) {
      return Response.json({
        id: 'act_1',
        license_key: {
          status: 'granted',
          benefit_id: 'lk_pro_yearly',
          limit_activations: 5,
          expires_at: null,
          customer_id: 'cus_1',
        },
      });
    }
    if (url.includes('/deactivate')) return new Response(null, { status: 204 });
    return new Response('no', { status: 404 });
  }) as typeof fetch;
}

describe('POST /api/license/deactivate', () => {
  it('removes the matching activation by deviceId', async () => {
    const kv = memoryKv();
    const priv = await signing();
    const original = globalThis.fetch;
    globalThis.fetch = polarOk();
    const env = {
      LICENSES: kv,
      LICENSE_SIGNING_KEY: JSON.stringify(priv),
      LICENSE_SIGNING_VER: '1',
      LICENSE_KEY_ENC_KEY: ENC,
      POLAR_ACCESS_TOKEN: 'tok',
      POLAR_ORGANIZATION_ID: 'org',
      POLAR_BENEFIT_MAP: JSON.stringify({ lk_pro_yearly: 'pro_yearly' }),
      RATE_LIMIT_SALT: 'salt',
    };
    try {
      const act = await onActivate({
        env,
        request: new Request('https://awaketab.com/api/license/activate', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' },
          body: JSON.stringify({ deviceLabel: 'Chrome', deviceId: DEVICE, key: KEY }),
        }),
      } as unknown as Parameters<typeof onActivate>[0]);
      const { token } = (await act.json()) as { token: string };
      const res = await onDeactivate({
        env,
        request: new Request('https://awaketab.com/api/license/deactivate', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' },
          body: JSON.stringify({ token, deviceId: DEVICE }),
        }),
      } as unknown as Parameters<typeof onDeactivate>[0]);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean; activations: unknown[] };
      expect(json.ok).toBe(true);
      expect(json.activations).toEqual([]);
      const hash = await sha256Hex(KEY);
      const rec = JSON.parse(kv.map.get(`lic:${hash}`) ?? '{}') as { activations: unknown[] };
      expect(rec.activations).toEqual([]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
