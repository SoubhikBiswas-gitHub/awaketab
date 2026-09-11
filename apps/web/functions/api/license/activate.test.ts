import { describe, expect, it } from 'vitest';

import { onRequestPost as onActivate } from './activate';
import { onRequestPost as onValidate } from './validate';
import { verifyES256 } from '../../_lib/jwt';
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
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { priv, pub };
}

const DEVICE = '550e8400-e29b-41d4-a716-446655440000';
const KEY = 'ATAB-TEST-KEY-1234567890';
const ENC = btoa('0'.repeat(32));

function polarOk(activations = 0): typeof fetch {
  return (async (input: RequestInfo | URL, _init?: RequestInit) => {
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
      if (activations >= 5) return new Response('limit', { status: 403 });
      activations += 1;
      return Response.json({
        id: `act_${activations}`,
        license_key: { status: 'granted', benefit_id: 'lk_pro_yearly', limit_activations: 5, expires_at: null, customer_id: 'cus_1' },
      });
    }
    return new Response('no', { status: 404 });
  }) as typeof fetch;
}

async function envFor(kv: ReturnType<typeof memoryKv>, fetchFn: typeof fetch) {
  const keys = await signing();
  const original = globalThis.fetch;
  globalThis.fetch = fetchFn;
  return {
    keys,
    restore: () => {
      globalThis.fetch = original;
    },
    env: {
      LICENSES: kv,
      LICENSE_SIGNING_KEY: JSON.stringify(keys.priv),
      LICENSE_SIGNING_VER: '1',
      LICENSE_KEY_ENC_KEY: ENC,
      POLAR_ACCESS_TOKEN: 'tok',
      POLAR_ORGANIZATION_ID: 'org',
      POLAR_BENEFIT_MAP: JSON.stringify({ lk_pro_yearly: 'pro_yearly' }),
      RATE_LIMIT_SALT: 'salt',
    },
  };
}

async function activate(env: Record<string, unknown>, body: unknown, deviceId = DEVICE) {
  return onActivate({
    env,
    request: new Request('https://awaketab.com/api/license/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' },
      body: JSON.stringify({ deviceLabel: 'Chrome on macOS', deviceId, ...(body as object) }),
    }),
  } as unknown as Parameters<typeof onActivate>[0]);
}

describe('POST /api/license/activate', () => {
  it('mints a verifiable ES256 token on the happy path', async () => {
    const kv = memoryKv();
    const { env, keys, restore } = await envFor(kv, polarOk());
    try {
      const res = await activate(env, { key: KEY });
      expect(res.status).toBe(200);
      const json = (await res.json()) as { token: string; plan: string };
      expect(json.plan).toBe('pro_yearly');
      const claims = await verifyES256(json.token, keys.pub);
      expect(claims?.plan).toBe('pro_yearly');
      expect(claims?.sub).toBe(await sha256Hex(KEY));
      expect([...kv.map.keys()].some((k) => k.startsWith('lic:'))).toBe(true);
      expect(JSON.stringify([...kv.map.entries()])).not.toContain('198.51.100.10');
    } finally {
      restore();
    }
  });

  it('returns activation_limit on a sixth active device', async () => {
    const kv = memoryKv();
    const { env, restore } = await envFor(kv, polarOk());
    try {
      const hash = await sha256Hex(KEY);
      const activations = await Promise.all(
        Array.from({ length: 5 }, async (_, i) => ({
          devHash: await sha256Hex(`550e8400-e29b-41d4-a716-44665544000${i}`),
          label: `dev ${i}`,
          at: Date.now(),
          polarActivationId: `old_${i}`,
        })),
      );
      kv.map.set(
        `lic:${hash}`,
        JSON.stringify({
          plan: 'pro_yearly',
          status: 'active',
          keyEnc: 'x',
          polarOrderId: 'o',
          customerId: 'cus_1',
          activations,
          limit: 5,
          exp: Math.floor(Date.now() / 1000) + 86_400,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );
      const res = await activate(env, { key: KEY }, '550e8400-e29b-41d4-a716-446655440099');
      expect(res.status).toBe(409);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('activation_limit');
    } finally {
      restore();
    }
  });

  it('returns revoked without minting when KV status is revoked', async () => {
    const kv = memoryKv();
    const { env, restore } = await envFor(kv, polarOk());
    try {
      const hash = await sha256Hex(KEY);
      kv.map.set(
        `lic:${hash}`,
        JSON.stringify({
          plan: 'pro_yearly',
          status: 'revoked',
          keyEnc: 'x',
          polarOrderId: 'o',
          customerId: 'c',
          activations: [],
          limit: 5,
          exp: 1,
          createdAt: 1,
          updatedAt: 1,
        }),
      );
      const res = await activate(env, { key: KEY });
      expect(res.status).toBe(403);
    } finally {
      restore();
    }
  });

  it('returns polar_unavailable with no KV write when Polar is down', async () => {
    const kv = memoryKv();
    const { env, restore } = await envFor(kv, (async () => new Response('nope', { status: 500 })) as typeof fetch);
    try {
      const res = await activate(env, { key: KEY });
      expect(res.status).toBe(502);
      expect([...kv.map.keys()].filter((k) => k.startsWith('lic:'))).toEqual([]);
    } finally {
      restore();
    }
  });
});

describe('POST /api/license/validate', () => {
  it('reports revoked when the KV record is revoked', async () => {
    const kv = memoryKv();
    const { env, keys, restore } = await envFor(kv, polarOk());
    try {
      const act = await activate(env, { key: KEY });
      const { token } = (await act.json()) as { token: string };
      const hash = await sha256Hex(KEY);
      const rec = JSON.parse(kv.map.get(`lic:${hash}`) ?? '{}') as { status: string };
      rec.status = 'revoked';
      kv.map.set(`lic:${hash}`, JSON.stringify(rec));
      const res = await onValidate({
        env,
        request: new Request('https://awaketab.com/api/license/validate', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.10' },
          body: JSON.stringify({ token }),
        }),
      } as unknown as Parameters<typeof onValidate>[0]);
      const json = (await res.json()) as { revoked: boolean };
      expect(json.revoked).toBe(true);
      expect(await verifyES256(token, keys.pub)).not.toBeNull();
    } finally {
      restore();
    }
  });
});
