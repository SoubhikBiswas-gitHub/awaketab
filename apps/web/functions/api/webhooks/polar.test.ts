import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onWebhook } from './polar';
import { devVars, harness, invoke, jsonRequest, sha256Hex, signWebhook, webhookRequest, type IHarness } from '../../../test/functions/harness';
import { decryptUtf8, type ILicenseRecord } from '../../_lib/license';
import { onRequestPost as onActivate } from '../license/activate';
import { onRequestPost as onValidate } from '../license/validate';

const KEY = 'AWAKETAB-PRO-TEST-0004-HOOK';
const T0 = Date.parse('2026-09-01T10:00:00.000Z');
const DEVICE = '5a6b7c8d-9e0f-4a1b-8c2d-e3f4a5b6c7d8';

/** Payload shape the handler consumes: Polar event with the licence key embedded under data.license_key. */
function event(type: string, data: Record<string, unknown> = {}) {
  return {
    type,
    data: { id: 'ord_1', customer_id: 'cus_hook', license_key: { key: KEY, limit_activations: 5 }, ...data },
  };
}

async function send(h: IHarness, payload: unknown, opts: Parameters<typeof webhookRequest>[1] = {}) {
  const { request, id } = await webhookRequest(payload, opts);
  return { res: await invoke(onWebhook, h.env, request), id };
}

async function record(h: IHarness): Promise<ILicenseRecord | null> {
  return h.kv.json<ILicenseRecord>(`lic:${await sha256Hex(KEY)}`);
}

async function activateDevice(h: IHarness) {
  return invoke(onActivate, h.env, jsonRequest('/api/license/activate', { key: KEY, deviceId: DEVICE, deviceLabel: 'Laptop' }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('POST /api/webhooks/polar — Standard Webhooks verification', () => {
  it('accepts a correctly signed event and records wh:{eventId} for 30 days', async () => {
    const h = harness();
    const { res, id } = await send(h, event('order.created'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(h.kv.json(`wh:${id}`)).toEqual({ at: T0 });
    expect(h.kv.writesTo(`wh:${id}`)[0]?.expirationTtl).toBe(30 * 86_400);
  });

  it('accepts when any of several space-separated signatures matches (secret rotation)', async () => {
    const h = harness();
    const raw = JSON.stringify(event('order.created'));
    const ts = String(T0 / 1000);
    const good = await signWebhook(raw, 'evt_multi', ts, devVars().POLAR_WEBHOOK_SECRET ?? '');
    const { res } = await send(h, null, { raw, id: 'evt_multi', signature: `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${good}` });
    expect(res.status).toBe(200);
  });

  it.each<[string, Parameters<typeof webhookRequest>[1]]>([
    ['garbage signature', { signature: 'v1,aaaa' }],
    ['signature made with another secret', { secret: 'whsec_not_ours' }],
    ['v1a scheme', { signature: 'v1a,abc' }],
  ])('returns 401 and writes nothing for a %s', async (_name, opts) => {
    const h = harness();
    const { res } = await send(h, event('subscription.revoked'), opts);
    expect(res.status).toBe(401);
    expect(h.kv.writes).toEqual([]);
  });

  it('returns 401 when the body was altered after signing', async () => {
    const h = harness();
    const raw = JSON.stringify(event('order.created'));
    const signature = await signWebhook(raw, 'evt_tamper', String(T0 / 1000), devVars().POLAR_WEBHOOK_SECRET ?? '');
    const { res } = await send(h, null, { id: 'evt_tamper', signature, raw: raw.replace('cus_hook', 'cus_evil') });
    expect(res.status).toBe(401);
    expect(h.kv.writes).toEqual([]);
  });

  it('returns 401 when POLAR_WEBHOOK_SECRET is not configured', async () => {
    const h = harness({ POLAR_WEBHOOK_SECRET: undefined });
    const { res } = await send(h, event('order.created'));
    expect(res.status).toBe(401);
  });

  it.each([
    ['301 s old', -301],
    ['301 s in the future', 301],
    ['a day old', -86_400],
  ])('rejects a timestamp %s with 400 and no KV write (LIC-09)', async (_name, skew) => {
    const h = harness();
    const { res } = await send(h, event('order.created'), { ts: T0 / 1000 + skew });
    expect(res.status).toBe(400);
    expect(h.kv.writes).toEqual([]);
  });

  it('accepts a timestamp 299 s old', async () => {
    const h = harness();
    const { res } = await send(h, event('order.created'), { ts: T0 / 1000 - 299 });
    expect(res.status).toBe(200);
  });

  it.each(['webhook-id', 'webhook-timestamp', 'webhook-signature'])('returns 400 when %s is missing', async (header) => {
    const h = harness();
    const { res } = await send(h, event('order.created'), { omit: [header] });
    expect(res.status).toBe(400);
    expect(h.kv.writes).toEqual([]);
  });
});

describe('POST /api/webhooks/polar — idempotency', () => {
  it('treats a replayed webhook-id as a no-op (LIC-10)', async () => {
    const h = harness();
    const payload = event('order.created');
    const first = await send(h, payload, { id: 'evt_replay' });
    expect(first.res.status).toBe(200);
    const writes = h.kv.writes.length;
    const again = await send(h, payload, { id: 'evt_replay' });
    expect(again.res.status).toBe(200);
    expect(await again.res.json()).toEqual({ ok: true, duplicate: true });
    expect(h.kv.writes).toHaveLength(writes);
  });

  it('does not re-run a replayed revoke after the licence was restored by hand', async () => {
    const h = harness();
    await send(h, event('order.created'));
    await send(h, event('subscription.revoked'), { id: 'evt_rev' });
    expect((await record(h))?.status).toBe('revoked');
    const key = `lic:${await sha256Hex(KEY)}`;
    h.kv.seed(key, { ...h.kv.json<ILicenseRecord>(key), status: 'active' });
    await send(h, event('subscription.revoked'), { id: 'evt_rev' });
    expect((await record(h))?.status).toBe('active');
  });

  it('processes a Polar retry when the first delivery failed mid-way (no premature wh: marker)', async () => {
    const h = harness();
    await send(h, event('order.created'));
    const licKey = `lic:${await sha256Hex(KEY)}`;
    h.kv.failNextPut((key) => key === licKey);
    const { request } = await webhookRequest(event('subscription.revoked'), { id: 'evt_retry' });
    await expect(invoke(onWebhook, h.env, request)).rejects.toThrow(/KV PUT failed/u);
    expect(h.kv.peek('wh:evt_retry')).toBeNull();
    const retry = await send(h, event('subscription.revoked'), { id: 'evt_retry' });
    expect(retry.res.status).toBe(200);
    expect((await record(h))?.status).toBe('revoked');
  });
});

describe('POST /api/webhooks/polar — event handling (docs/09 §2.7)', () => {
  it('order.created writes ord:, lic: (keyEnc AES-GCM) and the cus: index', async () => {
    const h = harness();
    await send(h, event('order.created', { metadata: { plan: 'pro_lifetime' } }));
    expect(h.kv.json('ord:ord_1')).toEqual({ plan: 'pro_lifetime', amountCents: 0, currency: 'USD', customerId: 'cus_hook', at: T0 });
    expect(h.kv.writesTo('ord:ord_1')[0]?.expirationTtl).toBe(2 * 365 * 86_400);
    const rec = await record(h);
    expect(rec).toMatchObject({ plan: 'pro_lifetime', status: 'active', polarOrderId: 'ord_1', customerId: 'cus_hook', activations: [], limit: 5 });
    expect(await decryptUtf8(rec?.keyEnc ?? '', devVars().LICENSE_KEY_ENC_KEY ?? '')).toBe(KEY);
    expect(h.kv.json('cus:cus_hook')).toEqual([await sha256Hex(KEY)]);
    expect(JSON.stringify(h.kv.writes)).not.toContain(KEY);
  });

  it('a late order.created / benefit_grant.created keeps existing activations and status', async () => {
    const h = harness();
    h.polar.addKey(KEY, { customerId: 'cus_hook' });
    expect((await activateDevice(h)).status).toBe(200);
    await send(h, event('benefit_grant.created'));
    await send(h, event('order.created'));
    expect((await record(h))?.activations).toHaveLength(1);
    await send(h, event('subscription.revoked'));
    await send(h, event('order.created'));
    expect((await record(h))?.status).toBe('revoked');
  });

  it('writes embed:{domain} for an embed licence with a normalised domain', async () => {
    const h = harness();
    await send(h, event('order.created', { metadata: { plan: 'biz_embed_site_yearly', domain: 'WWW.Recipes.Example' } }));
    expect(h.kv.json('embed:recipes.example')).toMatchObject({ keyHash: await sha256Hex(KEY), attribution: false });
  });

  it('subscription.canceled keeps features until exp; uncanceled restores active', async () => {
    const h = harness();
    h.polar.addKey(KEY, { customerId: 'cus_hook' });
    const { token } = (await (await activateDevice(h)).json()) as { token: string };
    await send(h, event('subscription.canceled'));
    expect((await record(h))?.status).toBe('canceled');
    const validate = await invoke(onValidate, h.env, jsonRequest('/api/license/validate', { token }));
    expect(((await validate.json()) as { revoked: boolean }).revoked).toBe(false);
    expect((await activateDevice(h)).status).toBe(200);
    await send(h, event('subscription.uncanceled'));
    expect((await record(h))?.status).toBe('active');
  });

  it('subscription.revoked flips the licence to revoked; validate and activate follow (LIC-08)', async () => {
    const h = harness();
    h.polar.addKey(KEY, { customerId: 'cus_hook' });
    const { token } = (await (await activateDevice(h)).json()) as { token: string };
    await send(h, event('subscription.revoked'));
    const rec = await record(h);
    expect(rec?.status).toBe('revoked');
    expect(rec?.updatedAt).toBe(T0);
    const validate = await invoke(onValidate, h.env, jsonRequest('/api/license/validate', { token }));
    expect(await validate.json()).toEqual({ revoked: true, reason: 'revoked' });
    const again = await activateDevice(h);
    expect(again.status).toBe(403);
    expect(await again.json()).toEqual({ error: 'revoked' });
  });

  it('benefit_grant.revoked flips the licence to revoked', async () => {
    const h = harness();
    await send(h, event('order.created'));
    await send(h, event('benefit_grant.revoked'));
    expect((await record(h))?.status).toBe('revoked');
  });

  it.each(['order.refunded', 'refund.created'])('%s marks the licence refunded and activate answers 403 refunded (LIC-11)', async (type) => {
    const h = harness();
    h.polar.addKey(KEY, { customerId: 'cus_hook' });
    await send(h, event('order.created'));
    await send(h, event(type));
    expect((await record(h))?.status).toBe('refunded');
    const res = await activateDevice(h);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'refunded' });
  });

  it('never re-opens a revoked or refunded licence on an out-of-order cancel/uncancel', async () => {
    const h = harness();
    await send(h, event('order.created'));
    await send(h, event('order.refunded'));
    await send(h, event('subscription.canceled'));
    await send(h, event('subscription.uncanceled'));
    expect((await record(h))?.status).toBe('refunded');
  });

  it('ignores revoke events for keys it has never seen', async () => {
    const h = harness();
    const { res } = await send(h, event('subscription.revoked'));
    expect(res.status).toBe(200);
    expect(h.kv.keys('lic:')).toEqual([]);
  });

  it('acknowledges unknown event types and unparseable bodies without touching licences', async () => {
    const h = harness();
    expect((await send(h, event('customer.updated'))).res.status).toBe(200);
    expect((await send(h, null, { raw: 'not json' })).res.status).toBe(200);
    expect(h.kv.keys().every((key) => key.startsWith('wh:'))).toBe(true);
  });

  // Real Polar subscription/refund/benefit_grant payloads carry customer_id / subscription_id /
  // order_id / properties.license_key_id rather than the raw key; the handler only matches
  // data.license_key.key today. docs/09 §2.7 describes a cus:{customerId} fan-out that needs
  // subscription/licence-key ids in lic: records (not in docs/08 §4 yet).
  it.todo('fans subscription.revoked out over cus:{customerId} when the payload has no licence key');
});
