import { LICENSE_PUBLIC_KEYS, verifyLicenseToken } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onActivate } from './activate';
import {
  BENEFITS,
  DAY_MS,
  decodeJwt,
  devVars,
  harness,
  invoke,
  ipTraces,
  jsonRequest,
  sha256Hex,
  TEST_IP,
  type IHarness,
} from '../../../test/functions/harness';
import { decryptUtf8, type ILicenseRecord } from '../../_lib/license';
import { LINK_TTL_S, type ILicenseLink } from '../../_lib/links';

const KEY = 'AWAKETAB-PRO-TEST-0001-ABCD';
const T0 = Date.parse('2026-09-01T10:00:00.000Z');

const device = (n: number): string => `6f1c2a3b-4d5e-4f60-8a7b-${String(n).padStart(12, '0')}`;

function activate(h: IHarness, body: Record<string, unknown>, opts: { ip?: string } = {}) {
  return invoke(
    onActivate,
    h.env,
    jsonRequest('/api/license/activate', { deviceLabel: 'Chrome · macOS', deviceId: device(1), ...body }, opts),
  );
}

async function record(h: IHarness, key = KEY): Promise<ILicenseRecord | null> {
  return h.kv.json<ILicenseRecord>(`lic:${await sha256Hex(key)}`);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('POST /api/license/activate', () => {
  it('uses the dev signing pair that matches LICENSE_PUBLIC_KEYS[1] in @awaketab/core', () => {
    const priv = JSON.parse(devVars().LICENSE_SIGNING_KEY ?? '{}') as JsonWebKey;
    expect({ x: priv.x, y: priv.y }).toEqual({ x: LICENSE_PUBLIC_KEYS[1]?.x, y: LICENSE_PUBLIC_KEYS[1]?.y });
  });

  it('mints an ES256 token that @awaketab/core verifies with the shipped public key', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as {
      token: string;
      plan: string;
      features: string[];
      exp: number;
      activations: unknown[];
    };
    expect(Object.keys(body).sort()).toEqual(['activations', 'exp', 'features', 'plan', 'token']);
    expect(body.plan).toBe('pro_yearly');

    const state = await verifyLicenseToken(body.token, { deviceId: device(1), now: T0 });
    expect(state).toMatchObject({ valid: true, plan: 'pro_yearly', grace: false });
    expect(state.features).toContain('ads.free');
    expect((await verifyLicenseToken(body.token, { deviceId: device(2), now: T0 })).valid).toBe(false);

    const { header, claims } = decodeJwt(body.token);
    expect(header).toMatchObject({ alg: 'ES256', typ: 'JWT', kid: '1' });
    expect(Object.keys(claims).sort()).toEqual(['dev', 'exp', 'features', 'iat', 'plan', 'sub', 'ver']);
    expect(claims.sub).toBe(await sha256Hex(KEY));
    expect(claims.dev).toBe(await sha256Hex(device(1)));
    expect(claims.iat).toBe(T0 / 1000);
    // LIC-05: yearly exp = periodEnd + 7 d
    expect(claims.exp).toBe(Date.parse(polarKey.expiresAt ?? '') / 1000 + 7 * 86_400);
    expect(body.exp).toBe(claims.exp);
    expect(body.token).not.toContain(KEY);
  });

  it('writes the lic:/cus: records per docs/08 §4 with the key only as AES-GCM keyEnc', async () => {
    const h = harness();
    h.polar.addKey(KEY, { customerId: 'cus_42' });
    await activate(h, { key: KEY });
    const keyHash = await sha256Hex(KEY);
    const rec = await record(h);
    expect(rec).toMatchObject({
      plan: 'pro_yearly',
      status: 'active',
      customerId: 'cus_42',
      limit: 5,
      createdAt: T0,
      updatedAt: T0,
    });
    expect(rec?.activations).toEqual([
      {
        devHash: await sha256Hex(device(1)),
        label: 'Chrome · macOS',
        at: T0,
        polarActivationId: expect.stringMatching(/^act_/u) as unknown,
      },
    ]);
    expect(await decryptUtf8(rec?.keyEnc ?? '', devVars().LICENSE_KEY_ENC_KEY ?? '')).toBe(KEY);
    expect(h.kv.json<string[]>('cus:cus_42')).toEqual([keyHash]);
    const persisted = JSON.stringify(h.kv.writes);
    expect(persisted).not.toContain(KEY);
    expect(persisted).not.toContain(device(1));
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
  });

  it('calls Polar validate then activate with the org, bearer token, label and deviceId', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    await activate(h, { key: KEY });
    expect(h.polar.calls.map((call) => call.path)).toEqual([
      '/v1/customer-portal/license-keys/validate',
      '/v1/customer-portal/license-keys/activate',
    ]);
    const vars = devVars();
    for (const call of h.polar.calls) {
      expect(call.auth).toBe(`Bearer ${vars.POLAR_ACCESS_TOKEN ?? ''}`);
      expect(call.body?.organization_id).toBe(vars.POLAR_ORGANIZATION_ID);
    }
    expect(h.polar.calls[1]?.body).toMatchObject({ key: KEY, label: 'Chrome · macOS', meta: { deviceId: device(1) } });
  });

  it('normalises the key (trim + upper case) before hashing', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const res = await activate(h, { key: `  ${KEY.toLowerCase()}  ` });
    expect(res.status).toBe(200);
    expect(await record(h)).not.toBeNull();
  });

  it('re-activating the same device refreshes it without calling Polar (LIC-02)', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    await activate(h, { key: KEY });
    const calls = h.polar.calls.length;
    vi.setSystemTime(T0 + DAY_MS);
    const res = await activate(h, { key: KEY, deviceLabel: 'Renamed laptop' });
    expect(res.status).toBe(200);
    expect(h.polar.calls).toHaveLength(calls);
    const rec = await record(h);
    expect(rec?.activations).toHaveLength(1);
    expect(rec?.activations[0]).toMatchObject({ label: 'Renamed laptop', at: T0 + DAY_MS });
  });

  it('rejects a sixth device with activation_limit and the five labels (LIC-03)', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    for (let i = 1; i <= 5; i += 1) {
      const res = await activate(
        h,
        { key: KEY, deviceId: device(i), deviceLabel: `Device ${String(i)}` },
        { ip: `198.51.100.${String(i)}` },
      );
      expect(res.status).toBe(200);
    }
    const res = await activate(h, { key: KEY, deviceId: device(6), deviceLabel: 'Device 6' }, { ip: '198.51.100.6' });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; activations: string[] };
    expect(body.error).toBe('activation_limit');
    expect(body.activations).toEqual(['Device 1', 'Device 2', 'Device 3', 'Device 4', 'Device 5']);
    expect((await record(h))?.activations).toHaveLength(5);
    expect(polarKey.activations.size).toBe(5);
    expect(h.polar.callsTo('/activate')).toHaveLength(5);
  });

  it('evicts a device unseen for more than 90 days to admit a sixth one (LIC-04)', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { expiresAt: new Date(T0 + 400 * DAY_MS).toISOString() });
    await activate(h, { key: KEY, deviceId: device(1), deviceLabel: 'Old tablet' });
    const staleId = (await record(h))?.activations[0]?.polarActivationId;
    vi.setSystemTime(T0 + 91 * DAY_MS);
    for (let i = 2; i <= 5; i += 1)
      await activate(h, { key: KEY, deviceId: device(i), deviceLabel: `Device ${String(i)}` });
    const res = await activate(h, { key: KEY, deviceId: device(6), deviceLabel: 'New phone' });
    expect(res.status).toBe(200);
    const deactivations = h.polar.callsTo('/deactivate');
    expect(deactivations).toHaveLength(1);
    expect(deactivations[0]?.body).toMatchObject({ key: KEY, activation_id: staleId });
    const labels = (await record(h))?.activations.map((row) => row.label);
    expect(labels).toEqual(['Device 2', 'Device 3', 'Device 4', 'Device 5', 'New phone']);
    expect(polarKey.activations.size).toBe(5);
  });

  it('maps a Polar 403 on activate to activation_limit even when KV still has room', async () => {
    const h = harness();
    h.polar.addKey(KEY, { limit: 1 }).activations.set('act_elsewhere', { label: 'Polar portal', deviceId: '' });
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: string }).error).toBe('activation_limit');
    expect(h.kv.keys('lic:')).toEqual([]);
  });

  it('returns 404 invalid_key for an unknown key and writes no licence (LIC-01)', async () => {
    const h = harness();
    const res = await activate(h, { key: 'AWAKETAB-NOPE-NOPE-NOPE-0000' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'invalid_key' });
    expect(h.kv.writes.filter((row) => !row.key.startsWith('rl:'))).toEqual([]);
  });

  it('returns 404 invalid_key when the benefit is not in POLAR_BENEFIT_MAP', async () => {
    const h = harness();
    h.polar.addKey(KEY, { benefitId: BENEFITS.unmapped });
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(404);
    expect(h.kv.keys('lic:')).toEqual([]);
  });

  it('returns 403 revoked when Polar reports the key is not granted', async () => {
    const h = harness();
    h.polar.addKey(KEY, { status: 'revoked' });
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'revoked' });
    expect(h.kv.keys('lic:')).toEqual([]);
  });

  it.each(['revoked', 'refunded'] as const)('returns 403 %s from KV without calling Polar', async (status) => {
    const h = harness();
    h.polar.addKey(KEY);
    await activate(h, { key: KEY });
    const rec = await record(h);
    h.kv.seed(`lic:${await sha256Hex(KEY)}`, { ...rec, status });
    const calls = h.polar.calls.length;
    const res = await activate(h, { key: KEY, deviceId: device(2) });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: status });
    expect(h.polar.calls).toHaveLength(calls);
  });

  it.each(['http', 'network'] as const)(
    'returns 502 polar_unavailable with no licence write on a Polar %s outage',
    async (outage) => {
      const h = harness();
      h.polar.addKey(KEY);
      h.polar.outage = outage;
      const res = await activate(h, { key: KEY });
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: 'polar_unavailable' });
      expect(h.kv.keys('lic:')).toEqual([]);
      expect(h.kv.keys('cus:')).toEqual([]);
    },
  );

  it('returns 502 without touching Polar when signing secrets are missing', async () => {
    const h = harness({ LICENSE_SIGNING_KEY: undefined });
    h.polar.addKey(KEY);
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(502);
    expect(h.polar.calls).toEqual([]);
  });

  it.each<[string, unknown]>([
    ['empty object', {}],
    ['missing key', { key: undefined }],
    ['missing deviceId', { key: KEY, deviceId: undefined }],
    ['non-v4 deviceId', { key: KEY, deviceId: '550e8400-e29b-11d4-a716-446655440000' }],
    ['missing deviceLabel', { key: KEY, deviceLabel: undefined }],
    ['control-character-only label', { key: KEY, deviceLabel: '\u0000\u0007\n' }],
    ['key too short', { key: 'AWAKETAB-SHORT' }],
    ['key with illegal characters', { key: 'AWAKETAB_PRO_TEST_0001_ABCD!' }],
    ['numeric key', { key: 1_234_567_890_123 }],
  ])('returns 400 bad_request for %s', async (_name, patch) => {
    const h = harness();
    h.polar.addKey(KEY);
    const res = await activate(h, patch as Record<string, unknown>);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
    expect(h.polar.calls).toEqual([]);
  });

  it('returns 400 bad_request for a non-JSON body', async () => {
    const h = harness();
    const res = await invoke(onActivate, h.env, jsonRequest('/api/license/activate', '{"key":'));
    expect(res.status).toBe(400);
  });

  it('strips control characters from deviceLabel and caps it at 40 characters', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    await activate(h, { key: KEY, deviceLabel: `Kitchen\u0000 iPad\u001b${'x'.repeat(60)}` });
    const label = (await record(h))?.activations[0]?.label ?? '';
    expect(label).toBe(`Kitchen iPad${'x'.repeat(28)}`);
    expect(label).toHaveLength(40);
  });

  it('rate-limits the 11th /api/license/* call in a window with Retry-After (LIC-15)', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    for (let i = 0; i < 10; i += 1) expect((await activate(h, { key: KEY })).status).toBe(200);
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
    const retryAfter = Number(res.headers.get('retry-after'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(120);
    expect((await activate(h, { key: KEY }, { ip: '198.51.100.200' })).status).toBe(200);
    vi.setSystemTime(T0 + 240_000);
    expect((await activate(h, { key: KEY })).status).toBe(200);
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
    expect(h.kv.writesTo('rl:license:').every((row) => row.expirationTtl === 240)).toBe(true);
  });

  it('gives lifetime tokens a rolling 90-day exp, also on re-activation after 90 days (LIC-06)', async () => {
    const h = harness();
    h.polar.addKey(KEY, { benefitId: BENEFITS.lifetime, expiresAt: null });
    const first = (await (await activate(h, { key: KEY })).json()) as { token: string; exp: number };
    expect(first.exp).toBe(T0 / 1000 + 90 * 86_400);
    const later = T0 + 120 * DAY_MS;
    vi.setSystemTime(later);
    const again = (await (await activate(h, { key: KEY })).json()) as { token: string; exp: number };
    expect(again.exp).toBe(later / 1000 + 90 * 86_400);
    expect((await verifyLicenseToken(again.token, { deviceId: device(1), now: later })).valid).toBe(true);
  });

  it('refreshes a yearly exp from Polar when the record already exists (e.g. written by the webhook)', async () => {
    const h = harness();
    const periodEnd = T0 + 30 * DAY_MS;
    h.polar.addKey(KEY, { expiresAt: new Date(periodEnd).toISOString() });
    const keyHash = await sha256Hex(KEY);
    h.kv.seed(`lic:${keyHash}`, {
      plan: 'pro_yearly',
      status: 'active',
      keyEnc: 'unused',
      polarOrderId: 'ord_1',
      customerId: 'cus_test_1',
      activations: [],
      limit: 5,
      exp: T0 / 1000 + 365 * 86_400,
      createdAt: T0,
      updatedAt: T0,
    });
    const body = (await (await activate(h, { key: KEY })).json()) as { exp: number };
    expect(body.exp).toBe(periodEnd / 1000 + 7 * 86_400);
    expect((await record(h))?.exp).toBe(body.exp);
  });

  it('activates from a Polar checkoutId when the checkout succeeded', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    const ok = await activate(h, { checkoutId: h.polar.addCheckout(polarKey) });
    expect(ok.status).toBe(200);
    expect(await record(h)).not.toBeNull();
    expect(polarKey.activations.size).toBe(1);
  });

  it('answers an unknown checkoutId like an expired one (404 invalid_key, no probing)', async () => {
    const h = harness();
    const expired = h.polar.addCheckout(h.polar.addKey(KEY), { status: 'expired' });
    for (const checkoutId of ['chk_missing', expired]) {
      const res = await activate(h, { checkoutId });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'invalid_key' });
    }
  });

  it('rejects a checkoutId that could reshape the Polar path', async () => {
    const h = harness();
    const res = await activate(h, { checkoutId: '../license-keys/validate' });
    expect(res.status).toBe(400);
    expect(h.polar.calls).toEqual([]);
  });
});

// D-06: activation stores the Polar ids that key-less webhooks resolve by (docs/08 §4, docs/09 §2.7.1).
describe('POST /api/license/activate — Polar ids (D-06)', () => {
  it('stores the licence-key, benefit and customer ids and links the key hash in lk:', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { customerId: 'cus_42' });
    expect((await activate(h, { key: KEY })).status).toBe(200);
    const rec = await record(h);
    expect(rec).toMatchObject({
      polarLicenseKeyId: polarKey.id,
      benefitId: BENEFITS.yearly,
      customerId: 'cus_42',
      polarOrderId: '',
    });
    expect(h.kv.json<ILicenseLink>(`lk:${polarKey.id}`)).toEqual({
      keyHashes: [await sha256Hex(KEY)],
      customerId: 'cus_42',
      benefitId: BENEFITS.yearly,
      at: T0,
    });
    expect(h.kv.writesTo('lk:')[0]?.expirationTtl).toBe(LINK_TTL_S);
  });

  it('takes the subscription id from the checkout and indexes it in sub:', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { customerId: 'cus_42' });
    polarKey.subscriptionId = 'sub_from_checkout';
    expect((await activate(h, { checkoutId: h.polar.addCheckout(polarKey) })).status).toBe(200);
    expect(await record(h)).toMatchObject({ polarSubscriptionId: 'sub_from_checkout', polarGrantId: polarKey.grantId });
    expect(h.kv.json('sub:sub_from_checkout')).toEqual([polarKey.id]);
  });

  it('picks up grant, order and subscription ids that a benefit_grant webhook linked first', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { customerId: 'cus_42' });
    h.kv.seed(`lk:${polarKey.id}`, {
      keyHashes: [],
      grantId: 'grant_9',
      orderId: 'ord_9',
      subscriptionId: 'sub_9',
      customerId: 'cus_42',
      at: T0,
    });
    expect((await activate(h, { key: KEY })).status).toBe(200);
    expect(await record(h)).toMatchObject({
      polarGrantId: 'grant_9',
      polarOrderId: 'ord_9',
      polarSubscriptionId: 'sub_9',
    });
    expect(h.kv.json<ILicenseLink>(`lk:${polarKey.id}`)?.keyHashes).toEqual([await sha256Hex(KEY)]);
  });

  it.each(['refunded', 'revoked'] as const)(
    'answers 403 %s for a status that arrived before activation, with no Polar activate',
    async (status) => {
      const h = harness();
      const polarKey = h.polar.addKey(KEY, { customerId: 'cus_42' });
      h.kv.seed(`lk:${polarKey.id}`, { keyHashes: [], pending: status, at: T0 });
      const res = await activate(h, { key: KEY });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: status });
      expect(polarKey.activations.size).toBe(0);
      expect(await record(h)).toMatchObject({ status, activations: [] });
      expect(h.kv.json<ILicenseLink>(`lk:${polarKey.id}`)).not.toHaveProperty('pending');
    },
  );

  it('back-fills a record written before D-06 (licence-key id wrongly stored as polarOrderId)', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { customerId: 'cus_42' });
    h.kv.seed(`lic:${await sha256Hex(KEY)}`, {
      plan: 'pro_yearly',
      status: 'active',
      keyEnc: 'unused',
      polarOrderId: polarKey.id,
      customerId: 'cus_42',
      activations: [],
      limit: 5,
      exp: T0 / 1000 + 365 * 86_400,
      createdAt: T0,
      updatedAt: T0,
    });
    expect((await activate(h, { key: KEY })).status).toBe(200);
    expect(await record(h)).toMatchObject({
      polarOrderId: '',
      polarLicenseKeyId: polarKey.id,
      benefitId: BENEFITS.yearly,
    });
    expect(h.kv.json<ILicenseLink>(`lk:${polarKey.id}`)?.keyHashes).toEqual([await sha256Hex(KEY)]);
  });
});

// docs/09 §2.3a: `/pro/activate?ext=1&checkout_id=…` resolves the key without activating the browser, so the
// extension's own activation is the only one the purchase spends.
describe('POST /api/license/activate { checkoutId, lookup: true }', () => {
  function lookup(h: IHarness, body: Record<string, unknown>) {
    return invoke(onActivate, h.env, jsonRequest('/api/license/activate', { lookup: true, ...body }));
  }

  it('returns the key and plan with no activation, KV record or Polar activate call', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { benefitId: BENEFITS.lifetime });
    const checkoutId = h.polar.addCheckout(polarKey);
    const res = await lookup(h, { checkoutId });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ key: KEY, plan: 'pro_lifetime' });
    expect(h.polar.calls.map((call) => call.path)).toEqual([
      `/v1/checkouts/${checkoutId}`,
      '/v1/orders/',
      '/v1/benefit-grants/',
      `/v1/license-keys/${polarKey.id}`,
      '/v1/customer-portal/license-keys/validate',
    ]);
    expect(h.polar.calls.every((call) => call.method === 'GET' || call.path.endsWith('/validate'))).toBe(true);
    expect(polarKey.activations.size).toBe(0);
    expect(h.kv.writes.filter((row) => !row.key.startsWith('rl:'))).toEqual([]);
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
  });

  it('needs no deviceId and ignores one that is sent', async () => {
    const h = harness();
    const checkoutId = h.polar.addCheckout(h.polar.addKey(KEY));
    const res = await lookup(h, { checkoutId, deviceId: device(1), deviceLabel: 'Chrome · macOS' });
    expect(res.status).toBe(200);
    expect(await record(h)).toBeNull();
  });

  it.each(['expired', 'failed'] as const)(
    'answers an unknown and a %s checkout with the same 404 invalid_key',
    async (status) => {
      const h = harness();
      const checkoutId = h.polar.addCheckout(h.polar.addKey(KEY), { status });
      for (const id of [checkoutId, 'chk_unknown']) {
        const res = await lookup(h, { checkoutId: id });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: 'invalid_key' });
      }
    },
  );

  it('refuses a key that KV marks refunded, and one Polar no longer grants', async () => {
    const h = harness();
    const checkoutId = h.polar.addCheckout(h.polar.addKey(KEY));
    h.kv.seed(`lic:${await sha256Hex(KEY)}`, { status: 'refunded', activations: [] });
    const refunded = await lookup(h, { checkoutId });
    expect(refunded.status).toBe(403);
    expect(await refunded.json()).toEqual({ error: 'refunded' });

    const other = 'AWAKETAB-PRO-TEST-0002-ABCD';
    const revokedId = h.polar.addCheckout(h.polar.addKey(other, { status: 'revoked', customerId: 'cus_other' }));
    const res = await lookup(h, { checkoutId: revokedId });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'revoked' });
  });

  it('returns 404 when the key maps to no plan', async () => {
    const h = harness();
    const unmapped = h.polar.addKey(KEY, { benefitId: BENEFITS.unmapped });
    expect((await lookup(h, { checkoutId: h.polar.addCheckout(unmapped) })).status).toBe(404);
  });

  it.each([
    {},
    { checkoutId: '' },
    { checkoutId: 'a/b' },
    { checkoutId: 'x'.repeat(81) },
    { checkoutId: 'chk_ok', lookup: 'yes' },
  ])('returns 400 bad_request for %j without calling Polar', async (body) => {
    const h = harness();
    const res = await lookup(h, body);
    expect(res.status).toBe(400);
    expect(h.polar.calls).toEqual([]);
  });

  it.each(['http', 'network'] as const)('returns 502 polar_unavailable on a Polar %s outage', async (outage) => {
    const h = harness();
    h.polar.outage = outage;
    const res = await lookup(h, { checkoutId: 'chk_ok' });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'polar_unavailable' });
  });

  it('shares the /api/license/* rate-limit bucket (11th call is 429)', async () => {
    const h = harness();
    const checkoutId = h.polar.addCheckout(h.polar.addKey(KEY));
    for (let i = 0; i < 5; i += 1) expect((await activate(h, { key: KEY })).status).toBe(200);
    for (let i = 0; i < 5; i += 1) expect((await lookup(h, { checkoutId })).status).toBe(200);
    const res = await lookup(h, { checkoutId });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });
});

// F-08 (docs/09 §2.3b): Polar's checkout has no licence key; the key is found through the checkout's order or
// subscription, the matching License Keys benefit grant and `GET /v1/license-keys/{id}`.
describe('checkout auto-fill resolves the key through order → benefit grant → licence key (F-08)', () => {
  function lookup(h: IHarness, checkoutId: string) {
    return invoke(onActivate, h.env, jsonRequest('/api/license/activate', { lookup: true, checkoutId }));
  }

  async function expectSyncing(res: Response): Promise<void> {
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('5');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ error: 'polar_unavailable' });
  }

  it('one-time purchase: finds the order by checkout_id, then the grant for that order, then the key', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { benefitId: BENEFITS.lifetime, customerId: 'cus_42' });
    const checkoutId = h.polar.addCheckout(polarKey);
    const res = await activate(h, { checkoutId });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { plan: string }).plan).toBe('pro_lifetime');
    const org = devVars().POLAR_ORGANIZATION_ID;
    const reads = h.polar.calls.filter((call) => call.method === 'GET');
    expect(reads.map((call) => [call.path, call.query])).toEqual([
      [`/v1/checkouts/${checkoutId}`, {}],
      ['/v1/orders/', { organization_id: org, checkout_id: checkoutId, limit: '10' }],
      ['/v1/benefit-grants/', { organization_id: org, customer_id: 'cus_42', limit: '100', sorting: '-created_at' }],
      [`/v1/license-keys/${polarKey.id}`, {}],
    ]);
    expect(reads.every((call) => call.auth === `Bearer ${devVars().POLAR_ACCESS_TOKEN ?? ''}`)).toBe(true);
    expect(polarKey.activations.size).toBe(1);
    expect(await record(h)).toMatchObject({
      plan: 'pro_lifetime',
      polarLicenseKeyId: polarKey.id,
      polarGrantId: polarKey.grantId,
      polarOrderId: polarKey.orderId,
      customerId: 'cus_42',
    });
    expect(h.kv.json<ILicenseLink>(`lk:${polarKey.id}`)).toMatchObject({
      grantId: polarKey.grantId,
      orderId: polarKey.orderId,
    });
  });

  it('subscription: matches the grant by the checkout subscription_id, with no order lookup', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    const res = await activate(h, { checkoutId: h.polar.addCheckout(polarKey, { order: false }) });
    expect(res.status).toBe(200);
    expect(h.polar.callsTo('/v1/orders/')).toEqual([]);
    expect(await record(h)).toMatchObject({
      plan: 'pro_yearly',
      polarSubscriptionId: polarKey.subscriptionId,
      polarGrantId: polarKey.grantId,
    });
  });

  it.each(['open', 'confirmed'] as const)(
    'a %s checkout is still syncing (503 + Retry-After), for activate and lookup',
    async (status) => {
      const h = harness();
      const polarKey = h.polar.addKey(KEY);
      const checkoutId = h.polar.addCheckout(polarKey, { status });
      await expectSyncing(await activate(h, { checkoutId }));
      await expectSyncing(await lookup(h, checkoutId));
      expect(h.polar.calls.map((call) => call.path)).toEqual([
        `/v1/checkouts/${checkoutId}`,
        `/v1/checkouts/${checkoutId}`,
      ]);
      expect(polarKey.activations.size).toBe(0);
      expect(h.kv.writes.filter((row) => !row.key.startsWith('rl:'))).toEqual([]);
    },
  );

  it.each([
    ['the order is not created yet', { order: false }, 'ready', BENEFITS.lifetime],
    ['the benefit grant is not created yet', {}, 'missing', BENEFITS.yearly],
    ['the grant has no license_key_id yet', {}, 'keyless', BENEFITS.lifetime],
  ] as const)('succeeded but %s → syncing, then the retry activates', async (_name, checkoutOpts, grant, benefitId) => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY, { benefitId, grant });
    const checkoutId = h.polar.addCheckout(polarKey, checkoutOpts);
    await expectSyncing(await activate(h, { checkoutId }));
    await expectSyncing(await lookup(h, checkoutId));
    expect(await record(h)).toBeNull();
    expect(h.polar.callsTo('/activate')).toEqual([]);

    // Polar catches up: the order, grant and key exist now.
    polarKey.grant = 'ready';
    h.polar.addCheckout(polarKey, { id: checkoutId });
    expect(await (await lookup(h, checkoutId)).json()).toEqual({ key: KEY, plan: planOf(benefitId) });
    expect((await activate(h, { checkoutId })).status).toBe(200);
  });

  it('returns only the key of THIS checkout when the customer holds several purchases', async () => {
    const h = harness();
    const older = h.polar.addKey(KEY, { customerId: 'cus_42' });
    const lifetimeKey = 'AWAKETAB-PRO-TEST-0002-LIFE';
    const lifetime = h.polar.addKey(lifetimeKey, { customerId: 'cus_42', benefitId: BENEFITS.lifetime });
    const newest = h.polar.addKey('AWAKETAB-PRO-TEST-0003-NEWEST', { customerId: 'cus_42' });
    const kioskUnrelated = h.polar.addKey('AWAKETAB-KIOSK-TEST-0004-ABCD', {
      customerId: 'cus_42',
      benefitId: BENEFITS.kiosk,
    });
    const olderCheckout = h.polar.addCheckout(older);
    const lifetimeCheckout = h.polar.addCheckout(lifetime);
    h.polar.addCheckout(newest);
    h.polar.addCheckout(kioskUnrelated);

    expect(await (await lookup(h, olderCheckout)).json()).toEqual({ key: KEY, plan: 'pro_yearly' });
    expect(await (await lookup(h, lifetimeCheckout)).json()).toEqual({ key: lifetimeKey, plan: 'pro_lifetime' });
    // The grants list is newest first; the answer still follows the checkout, not the order of the list.
    const grants = h.polar.callsTo('/v1/benefit-grants/');
    expect(grants.every((call) => call.query.customer_id === 'cus_42')).toBe(true);
  });

  it("never returns another customer's key, even for the same order id", async () => {
    const h = harness();
    const mine = h.polar.addKey(KEY, { customerId: 'cus_me', benefitId: BENEFITS.lifetime, grant: 'missing' });
    h.polar.addKey('AWAKETAB-PRO-TEST-0009-THEIRS', {
      customerId: 'cus_them',
      benefitId: BENEFITS.lifetime,
      orderId: mine.orderId,
    });
    await expectSyncing(await lookup(h, h.polar.addCheckout(mine)));
  });

  it('prefers the live grant when one purchase has a revoked and a re-granted key', async () => {
    const h = harness();
    const revoked = h.polar.addKey('AWAKETAB-PRO-TEST-0005-REVOKED', {
      status: 'revoked',
      subscriptionId: 'sub_same',
      customerId: 'cus_42',
    });
    const regranted = h.polar.addKey(KEY, { subscriptionId: 'sub_same', customerId: 'cus_42' });
    revoked.grantedAt = new Date(T0 + 60_000).toISOString(); // the revoked one is even newer
    const checkoutId = h.polar.addCheckout(regranted);
    expect(await (await lookup(h, checkoutId)).json()).toEqual({ key: KEY, plan: 'pro_yearly' });
  });

  it('answers revoked / refunded for a purchase whose key Polar revoked or KV marks refunded', async () => {
    const h = harness();
    const revoked = h.polar.addKey(KEY, { status: 'revoked' });
    const checkoutId = h.polar.addCheckout(revoked);
    for (const res of [await activate(h, { checkoutId }), await lookup(h, checkoutId)]) {
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'revoked' });
    }
    expect(revoked.activations.size).toBe(0);

    const refundedKey = 'AWAKETAB-PRO-TEST-0006-REFUND';
    const refunded = h.polar.addKey(refundedKey, { benefitId: BENEFITS.lifetime, customerId: 'cus_77' });
    const refundedCheckout = h.polar.addCheckout(refunded);
    h.kv.seed(`lic:${await sha256Hex(refundedKey)}`, { status: 'refunded', activations: [] });
    for (const res of [
      await activate(h, { checkoutId: refundedCheckout, deviceId: device(3) }),
      await lookup(h, refundedCheckout),
    ]) {
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'refunded' });
    }
    expect(refunded.activations.size).toBe(0);
  });

  it.each(['/v1/orders/', '/v1/benefit-grants/'])(
    'a Polar 5xx on %s is 502 polar_unavailable, not syncing',
    async (path) => {
      const h = harness();
      const checkoutId = h.polar.addCheckout(h.polar.addKey(KEY, { benefitId: BENEFITS.lifetime }));
      h.polar.failPath = path;
      const res = await activate(h, { checkoutId });
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ error: 'polar_unavailable' });
      expect(await record(h)).toBeNull();
    },
  );

  it('a 5xx on the licence-key read is 502 too', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    const checkoutId = h.polar.addCheckout(polarKey);
    h.polar.failPath = `/v1/license-keys/${polarKey.id}`;
    expect((await lookup(h, checkoutId)).status).toBe(502);
  });
});

function planOf(benefitId: string): string {
  return benefitId === BENEFITS.lifetime ? 'pro_lifetime' : 'pro_yearly';
}
