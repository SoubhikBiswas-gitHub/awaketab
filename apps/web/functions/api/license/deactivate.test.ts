import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onActivate } from './activate';
import { onRequestPost as onDeactivate } from './deactivate';
import { DAY_MS, harness, invoke, ipTraces, jsonRequest, sha256Hex, tamperJwt, TEST_IP, type IHarness } from '../../../test/functions/harness';
import type { ILicenseRecord } from '../../_lib/license';

const KEY = 'AWAKETAB-PRO-TEST-0003-DEAC';
const T0 = Date.parse('2026-09-01T10:00:00.000Z');
const DEV_A = '3e4f5a6b-7c8d-4e9f-a0b1-c2d3e4f5a6b7';
const DEV_B = '4f5a6b7c-8d9e-4f0a-b1c2-d3e4f5a6b7c8';

async function activate(h: IHarness, deviceId: string, label: string): Promise<string> {
  const res = await invoke(onActivate, h.env, jsonRequest('/api/license/activate', { key: KEY, deviceId, deviceLabel: label }));
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

function deactivate(h: IHarness, body: unknown, ip?: string) {
  return invoke(onDeactivate, h.env, jsonRequest('/api/license/deactivate', body, ip ? { ip } : {}));
}

async function record(h: IHarness): Promise<ILicenseRecord | null> {
  return h.kv.json<ILicenseRecord>(`lic:${await sha256Hex(KEY)}`);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('POST /api/license/deactivate', () => {
  it('removes this device on Polar (with the decrypted key) and in KV', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    const token = await activate(h, DEV_A, 'Laptop');
    const activationId = (await record(h))?.activations[0]?.polarActivationId;
    const res = await deactivate(h, { token, deviceId: DEV_A });
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ ok: true, activations: [] });
    expect(h.polar.callsTo('/deactivate')[0]?.body).toMatchObject({ key: KEY, activation_id: activationId });
    expect(polarKey.activations.size).toBe(0);
    expect((await record(h))?.activations).toEqual([]);
  });

  it('removes another device by the devHash /pro/manage lists (LIC-12)', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    await activate(h, DEV_A, 'Laptop');
    const tokenB = await activate(h, DEV_B, 'Phone');
    const res = await deactivate(h, { token: tokenB, deviceId: await sha256Hex(DEV_A) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { activations: Array<{ label: string }> };
    expect(body.activations.map((row) => row.label)).toEqual(['Phone']);
  });

  it('frees the slot so a new device can activate at the limit', async () => {
    const h = harness();
    h.polar.addKey(KEY, { limit: 1 });
    const token = await activate(h, DEV_A, 'Laptop');
    const blocked = await invoke(onActivate, h.env, jsonRequest('/api/license/activate', { key: KEY, deviceId: DEV_B, deviceLabel: 'Phone' }));
    expect(blocked.status).toBe(409);
    await deactivate(h, { token, deviceId: DEV_A });
    await activate(h, DEV_B, 'Phone');
  });

  it('accepts an expired but correctly signed token', async () => {
    const h = harness();
    h.polar.addKey(KEY, { expiresAt: new Date(T0 + 10 * DAY_MS).toISOString() });
    const token = await activate(h, DEV_A, 'Laptop');
    vi.setSystemTime(T0 + 60 * DAY_MS);
    expect((await deactivate(h, { token, deviceId: DEV_A })).status).toBe(200);
  });

  it('still removes the device when Polar already dropped the activation (404)', async () => {
    const h = harness();
    const polarKey = h.polar.addKey(KEY);
    const token = await activate(h, DEV_A, 'Laptop');
    polarKey.activations.clear();
    const res = await deactivate(h, { token, deviceId: DEV_A });
    expect(res.status).toBe(200);
    expect((await record(h))?.activations).toEqual([]);
  });

  it('returns 502 and keeps the activation when Polar is down', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h, DEV_A, 'Laptop');
    h.polar.outage = 'http';
    const res = await deactivate(h, { token, deviceId: DEV_A });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'polar_unavailable' });
    expect((await record(h))?.activations).toHaveLength(1);
  });

  it('returns 400 for a device that is not on the licence', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h, DEV_A, 'Laptop');
    expect((await deactivate(h, { token, deviceId: DEV_B })).status).toBe(400);
    expect((await deactivate(h, { token })).status).toBe(400);
  });

  it('returns 401 bad_token for a tampered or missing token and 404 for an unknown licence', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h, DEV_A, 'Laptop');
    expect((await deactivate(h, { token: tamperJwt(token, { plan: 'pro_lifetime' }), deviceId: DEV_A })).status).toBe(401);
    expect((await deactivate(h, { deviceId: DEV_A })).status).toBe(401);
    await h.kv.delete(`lic:${await sha256Hex(KEY)}`);
    const gone = await deactivate(h, { token, deviceId: DEV_A });
    expect(gone.status).toBe(404);
    expect(await gone.json()).toEqual({ error: 'invalid_key' });
  });

  it('returns 400 for a non-JSON body and 429 past the licence rate limit', async () => {
    const h = harness();
    expect((await deactivate(h, '{')).status).toBe(400);
    for (let i = 0; i < 9; i += 1) await deactivate(h, {});
    const limited = await deactivate(h, {});
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toMatch(/^\d+$/u);
  });

  it('persists no IP', async () => {
    const h = harness();
    h.polar.addKey(KEY);
    const token = await activate(h, DEV_A, 'Laptop');
    await deactivate(h, { token, deviceId: DEV_A });
    expect(await ipTraces(TEST_IP, h.kv, h.ae)).toEqual([]);
  });
});
