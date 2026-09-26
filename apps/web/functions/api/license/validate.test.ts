import { verifyLicenseToken } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onActivate } from './activate';
import { onRequestPost as onDeactivate } from './deactivate';
import { onRequestPost as onValidate } from './validate';
import {
  BENEFITS,
  DAY_MS,
  decodeJwt,
  harness,
  invoke,
  ipTraces,
  jsonRequest,
  sha256Hex,
  tamperJwt,
  TEST_IP,
  type IHarness,
} from '../../../test/functions/harness';
import { signES256 } from '../../_lib/jwt';
import type { ILicenseRecord } from '../../_lib/license';

const KEY = 'AWAKETAB-PRO-TEST-0002-VALD';
const T0 = Date.parse('2026-09-01T10:00:00.000Z');
const DEV_A = '0b9e1f7c-3a2d-4e5f-9a8b-7c6d5e4f3a2b';
const DEV_B = '1c8d2e6f-4b3a-4c5d-8e9f-0a1b2c3d4e5f';

interface IValidateBody {
  revoked: boolean;
  reason?: string;
  token?: string;
  plan?: string;
  features?: string[];
  exp?: number;
  activations?: Array<{ label: string; at: number; devHash: string }>;
}

async function activate(h: IHarness, deviceId = DEV_A): Promise<string> {
  const res = await invoke(onActivate, h.env, jsonRequest('/api/license/activate', { key: KEY, deviceId, deviceLabel: `dev ${deviceId.slice(0, 4)}` }));
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

function validate(h: IHarness, body: unknown, ip?: string) {
  return invoke(onValidate, h.env, jsonRequest('/api/license/validate', body, ip ? { ip } : {}));
}

async function setStatus(h: IHarness, status: ILicenseRecord['status']): Promise<void> {
  const key = `lic:${await sha256Hex(KEY)}`;
  h.kv.seed(key, { ...h.kv.json<ILicenseRecord>(key), status });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('POST /api/license/validate', () => {
  it('returns a fresh token for an active device (docs/00 §9)', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    const later = T0 + 3 * DAY_MS;
    vi.setSystemTime(later);
    const res = await validate(h, { token });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = (await res.json()) as IValidateBody;
    expect(body).toMatchObject({ revoked: false, plan: 'pro_yearly' });
    expect(body.token).toBeTruthy();
    expect(body.token).not.toBe(token);
    const fresh = decodeJwt(body.token ?? '').claims;
    const old = decodeJwt(token).claims;
    expect(fresh).toMatchObject({ sub: old.sub, dev: old.dev, plan: old.plan, iat: later / 1000, exp: old.exp, ver: 1 });
    expect(await verifyLicenseToken(body.token ?? '', { deviceId: DEV_A, now: later })).toMatchObject({ valid: true, plan: 'pro_yearly' });
    expect(body.exp).toBe(fresh.exp);
    expect(body.activations).toEqual([{ label: 'dev 0b9e', at: later, devHash: await sha256Hex(DEV_A) }]);
  });

  it('refreshes the device last-seen time that 90-day eviction relies on', async () => {
    const h = harness();
    h.polar.addKey(KEY, { expiresAt: new Date(T0 + 400 * DAY_MS).toISOString() });
    const token = await activate(h);
    vi.setSystemTime(T0 + 80 * DAY_MS);
    await validate(h, { token });
    vi.setSystemTime(T0 + 100 * DAY_MS);
    for (const n of [1, 2, 3, 4]) await activate(h, `2d7e3f8a-5c4b-4d6e-9f0a-${String(n).padStart(12, '0')}`);
    const sixth = await invoke(
      onActivate,
      h.env,
      jsonRequest('/api/license/activate', { key: KEY, deviceId: DEV_B, deviceLabel: 'sixth' }, { ip: '198.51.100.9' }),
    );
    // DEV_A was seen 20 days ago, so it is not stale and must not be evicted.
    expect(sixth.status).toBe(409);
    expect(h.polar.callsTo('/deactivate')).toEqual([]);
  });

  it('re-mints an expired-but-signed lifetime token with a rolling exp (LIC-07)', async () => {
    const h = harness();
    h.polar.addKey(KEY, { benefitId: BENEFITS.lifetime, expiresAt: null });
    const token = await activate(h);
    const later = T0 + 100 * DAY_MS;
    vi.setSystemTime(later);
    expect((await verifyLicenseToken(token, { deviceId: DEV_A, now: later })).valid).toBe(false);
    const body = (await (await validate(h, { token })).json()) as IValidateBody;
    expect(body.revoked).toBe(false);
    expect(body.exp).toBe(later / 1000 + 90 * 86_400);
    expect(await verifyLicenseToken(body.token ?? '', { deviceId: DEV_A, now: later })).toMatchObject({ valid: true, plan: 'pro_lifetime' });
  });

  it.each(['revoked', 'refunded'] as const)('answers { revoked: true } when KV status is %s (LIC-08)', async (status) => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    await setStatus(h, status);
    const res = await validate(h, { token });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revoked: true, reason: status });
  });

  it('answers { revoked: true } when the licence record is gone', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    await h.kv.delete(`lic:${await sha256Hex(KEY)}`);
    expect(((await (await validate(h, { token })).json()) as IValidateBody).revoked).toBe(true);
  });

  it('keeps a canceled subscription working until exp', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    await setStatus(h, 'canceled');
    const body = (await (await validate(h, { token })).json()) as IValidateBody;
    expect(body.revoked).toBe(false);
    expect(body.token).toBeTruthy();
  });

  it('answers { revoked: true, reason: deactivated } for a device removed from the licence', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const tokenA = await activate(h, DEV_A);
    const tokenB = await activate(h, DEV_B);
    const removed = await invoke(onDeactivate, h.env, jsonRequest('/api/license/deactivate', { token: tokenB, deviceId: DEV_A }));
    expect(removed.status).toBe(200);
    expect(await (await validate(h, { token: tokenA })).json()).toEqual({ revoked: true, reason: 'deactivated' });
    expect(((await (await validate(h, { token: tokenB })).json()) as IValidateBody).revoked).toBe(false);
  });

  it('rejects a token whose payload was tampered with (LIC-13)', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    for (const patch of [{ plan: 'pro_lifetime' }, { exp: 4_102_444_800 }, { sub: await sha256Hex('AWAKETAB-SOMEONE-ELSES-KEY') }]) {
      const res = await validate(h, { token: tamperJwt(token, patch) });
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'bad_token' });
    }
  });

  it('rejects a well-formed token signed with a different key', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const real = decodeJwt(await activate(h)).claims;
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const forged = await signES256(real as never, await crypto.subtle.exportKey('jwk', pair.privateKey));
    expect((await validate(h, { token: forged })).status).toBe(401);
  });

  it.each<[string, unknown]>([
    ['missing token', {}],
    ['empty token', { token: '' }],
    ['two-part token', { token: 'a.b' }],
    ['garbage', { token: 'not.a.jwt' }],
  ])('returns 401 bad_token for %s', async (_name, body) => {
    const h = harness();
    expect((await validate(h, body)).status).toBe(401);
  });

  it('returns 400 for a non-JSON body', async () => {
    const h = harness();
    expect((await validate(h, 'token=abc')).status).toBe(400);
  });

  it('shares the /api/license/* rate-limit bucket with activate and sends Retry-After', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    for (let i = 0; i < 9; i += 1) expect((await validate(h, { token })).status).toBe(200);
    const res = await validate(h, { token });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await validate(h, { token }, '198.51.100.44')).status).toBe(200);
  });

  it('persists no IP and never stores the raw device id', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h);
    await validate(h, { token });
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
    expect(JSON.stringify(h.kv.writes)).not.toContain(DEV_A);
  });
});
