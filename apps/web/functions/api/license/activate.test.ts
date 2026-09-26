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
    const body = (await res.json()) as { token: string; plan: string; features: string[]; exp: number; activations: unknown[] };
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
    expect(rec).toMatchObject({ plan: 'pro_yearly', status: 'active', customerId: 'cus_42', limit: 5, createdAt: T0, updatedAt: T0 });
    expect(rec?.activations).toEqual([
      { devHash: await sha256Hex(device(1)), label: 'Chrome · macOS', at: T0, polarActivationId: expect.stringMatching(/^act_/u) as unknown },
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
      const res = await activate(h, { key: KEY, deviceId: device(i), deviceLabel: `Device ${String(i)}` }, { ip: `198.51.100.${String(i)}` });
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
    for (let i = 2; i <= 5; i += 1) await activate(h, { key: KEY, deviceId: device(i), deviceLabel: `Device ${String(i)}` });
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

  it.each(['http', 'network'] as const)('returns 502 polar_unavailable with no licence write on a Polar %s outage', async (outage) => {
    const h = harness();
    h.polar.addKey(KEY);
    h.polar.outage = outage;
    const res = await activate(h, { key: KEY });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'polar_unavailable' });
    expect(h.kv.keys('lic:')).toEqual([]);
    expect(h.kv.keys('cus:')).toEqual([]);
  });

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
    h.polar.addKey(KEY);
    h.polar.checkouts.set('chk_ok', { status: 'succeeded', license_key: KEY.toLowerCase() });
    h.polar.checkouts.set('chk_open', { status: 'open' });
    const ok = await activate(h, { checkoutId: 'chk_ok' });
    expect(ok.status).toBe(200);
    expect(await record(h)).not.toBeNull();
    const open = await activate(h, { checkoutId: 'chk_open', deviceId: device(2) });
    expect(open.status).toBe(404);
    expect(await open.json()).toEqual({ error: 'invalid_key' });
  });
});
