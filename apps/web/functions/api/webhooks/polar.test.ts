import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestPost as onWebhook } from './polar';
import {
  BENEFITS,
  devVars,
  harness,
  invoke,
  jsonRequest,
  polarEvents,
  sha256Hex,
  signWebhook,
  webhookRequest,
  type IHarness,
  type IPolarKey,
} from '../../../test/functions/harness';
import { decryptUtf8, type ILicenseRecord } from '../../_lib/license';
import { LINK_TTL_S, type ILicenseLink } from '../../_lib/links';
import { onRequestPost as onActivate } from '../license/activate';
import { onRequestPost as onValidate } from '../license/validate';

const KEY = 'AWAKETAB-PRO-TEST-0004-HOOK';
const T0 = Date.parse('2026-09-01T10:00:00.000Z');
const DEVICE = '5a6b7c8d-9e0f-4a1b-8c2d-e3f4a5b6c7d8';

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
  return invoke(
    onActivate,
    h.env,
    jsonRequest('/api/license/activate', { key: KEY, deviceId: DEVICE, deviceLabel: 'Laptop' }),
  );
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
    const { res } = await send(h, null, {
      raw,
      id: 'evt_multi',
      signature: `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${good}`,
    });
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

  it.each(['webhook-id', 'webhook-timestamp', 'webhook-signature'])(
    'returns 400 when %s is missing',
    async (header) => {
      const h = harness();
      const { res } = await send(h, event('order.created'), { omit: [header] });
      expect(res.status).toBe(400);
      expect(h.kv.writes).toEqual([]);
    },
  );
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
    expect(h.kv.json('ord:ord_1')).toEqual({
      plan: 'pro_lifetime',
      amountCents: 0,
      currency: 'USD',
      customerId: 'cus_hook',
      at: T0,
    });
    expect(h.kv.writesTo('ord:ord_1')[0]?.expirationTtl).toBe(2 * 365 * 86_400);
    const rec = await record(h);
    expect(rec).toMatchObject({
      plan: 'pro_lifetime',
      status: 'active',
      polarOrderId: 'ord_1',
      customerId: 'cus_hook',
      activations: [],
      limit: 5,
    });
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
    await send(
      h,
      event('order.created', { metadata: { plan: 'biz_embed_site_yearly', domain: 'WWW.Recipes.Example' } }),
    );
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

  it.each(['order.refunded', 'refund.created'])(
    '%s marks the licence refunded and activate answers 403 refunded (LIC-11)',
    async (type) => {
      const h = harness();
      h.polar.addKey(KEY, { customerId: 'cus_hook' });
      await send(h, event('order.created'));
      await send(h, event(type));
      expect((await record(h))?.status).toBe('refunded');
      const res = await activateDevice(h);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'refunded' });
    },
  );

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
});

// D-06: Polar's order, subscription and refund webhooks never carry the licence key, and benefit grants carry only
// `properties.license_key_id` (docs/09 §2.7.1). These payloads are shaped like production ones.
describe('POST /api/webhooks/polar — key-less Polar payloads (D-06)', () => {
  const YEARLY = 'AWAKETAB-PRO-TEST-0005-YEAR';
  const LIFETIME = 'AWAKETAB-PRO-TEST-0006-LIFE';
  const DEVICE_2 = '6b7c8d9e-0f1a-4b2c-9d3e-f4a5b6c7d8e9';

  async function activateKey(h: IHarness, key: string, deviceId = DEVICE) {
    return invoke(onActivate, h.env, jsonRequest('/api/license/activate', { key, deviceId, deviceLabel: 'Laptop' }));
  }

  async function lic(h: IHarness, key: string): Promise<ILicenseRecord | null> {
    return h.kv.json<ILicenseRecord>(`lic:${await sha256Hex(key)}`);
  }

  async function linkedYearly(h: IHarness, customerId = 'cus_d06'): Promise<IPolarKey> {
    const row = h.polar.addKey(YEARLY, { customerId });
    await send(h, polarEvents.order('order.created', row));
    await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
    expect((await activateKey(h, YEARLY)).status).toBe(200);
    return row;
  }

  async function linkedLifetime(h: IHarness, customerId = 'cus_d06'): Promise<IPolarKey> {
    const row = h.polar.addKey(LIFETIME, { customerId, benefitId: BENEFITS.lifetime, expiresAt: null });
    await send(
      h,
      polarEvents.order('order.created', row, { product: { id: 'prod_2', metadata: { plan: 'pro_lifetime' } } }),
    );
    await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
    expect((await activateKey(h, LIFETIME, DEVICE_2)).status).toBe(200);
    return row;
  }

  it('benefit_grant.created before activation writes lk:, grant:, sub: with a TTL and no licence', async () => {
    const h = harness();
    const row = h.polar.addKey(YEARLY, { customerId: 'cus_d06' });
    const { res } = await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
    expect(res.status).toBe(200);
    expect(h.kv.json<ILicenseLink>(`lk:${row.id}`)).toEqual({
      keyHashes: [],
      grantId: row.grantId,
      subscriptionId: row.subscriptionId,
      customerId: 'cus_d06',
      benefitId: BENEFITS.yearly,
      at: T0,
    });
    expect(h.kv.peek(`grant:${row.grantId}`)).toBe(row.id);
    expect(h.kv.json(`sub:${row.subscriptionId ?? ''}`)).toEqual([row.id]);
    for (const prefix of ['lk:', 'grant:', 'sub:']) {
      expect(h.kv.writesTo(prefix).every((write) => write.expirationTtl === LINK_TTL_S)).toBe(true);
    }
    expect(h.kv.keys('lic:')).toEqual([]);
    expect(JSON.stringify(h.kv.writes)).not.toContain(YEARLY);
  });

  it('activation after the grant copies every Polar id onto lic: and joins the key hash in lk:', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    expect(await lic(h, YEARLY)).toMatchObject({
      polarLicenseKeyId: row.id,
      polarGrantId: row.grantId,
      polarSubscriptionId: row.subscriptionId,
      polarOrderId: '',
      customerId: 'cus_d06',
      benefitId: BENEFITS.yearly,
    });
    expect(h.kv.json<ILicenseLink>(`lk:${row.id}`)?.keyHashes).toEqual([await sha256Hex(YEARLY)]);
  });

  it('a grant that arrives after activation back-fills the licence record', async () => {
    const h = harness();
    const row = h.polar.addKey(LIFETIME, { customerId: 'cus_d06', benefitId: BENEFITS.lifetime, expiresAt: null });
    expect((await activateKey(h, LIFETIME)).status).toBe(200);
    expect((await lic(h, LIFETIME))?.polarGrantId).toBeUndefined();
    await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
    expect(await lic(h, LIFETIME)).toMatchObject({
      polarGrantId: row.grantId,
      polarOrderId: row.orderId,
      polarLicenseKeyId: row.id,
    });
    expect(h.kv.json<{ lks: string[] }>(`ord:${row.orderId}`)?.lks).toEqual([row.id]);
  });

  it('order.created merges the Polar amount, currency and product plan into ord: and keeps lks', async () => {
    const h = harness();
    const row = h.polar.addKey(LIFETIME, { customerId: 'cus_d06', benefitId: BENEFITS.lifetime });
    await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
    await send(
      h,
      polarEvents.order('order.created', row, { product: { id: 'prod_2', metadata: { plan: 'pro_lifetime' } } }),
    );
    expect(h.kv.json(`ord:${row.orderId}`)).toEqual({
      lks: [row.id],
      plan: 'pro_lifetime',
      amountCents: 1200,
      currency: 'USD',
      customerId: 'cus_d06',
      at: T0,
    });
  });

  it('subscription.canceled / uncanceled / revoked resolve through sub: and validate follows', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    const { token } = (await (await activateKey(h, YEARLY)).json()) as { token: string };
    await send(h, polarEvents.subscription('subscription.canceled', row));
    expect((await lic(h, YEARLY))?.status).toBe('canceled');
    await send(h, polarEvents.subscription('subscription.uncanceled', row));
    expect((await lic(h, YEARLY))?.status).toBe('active');
    await send(h, polarEvents.subscription('subscription.revoked', row));
    expect((await lic(h, YEARLY))?.status).toBe('revoked');
    const validate = await invoke(onValidate, h.env, jsonRequest('/api/license/validate', { token }));
    expect(await validate.json()).toEqual({ revoked: true, reason: 'revoked' });
  });

  it('subscription.updated / active / created change nothing', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    await send(h, polarEvents.subscription('subscription.canceled', row));
    for (const type of ['subscription.created', 'subscription.active', 'subscription.updated'] as const) {
      await send(h, polarEvents.subscription(type, row));
    }
    expect((await lic(h, YEARLY))?.status).toBe('canceled');
  });

  it('benefit_grant.revoked resolves by properties.license_key_id, and by grant: when properties are empty', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    await send(h, polarEvents.benefitGrant('benefit_grant.revoked', row));
    expect((await lic(h, YEARLY))?.status).toBe('revoked');

    const h2 = harness();
    const row2 = await linkedYearly(h2);
    await send(h2, polarEvents.benefitGrant('benefit_grant.revoked', row2, { properties: {} }));
    expect((await lic(h2, YEARLY))?.status).toBe('revoked');
  });

  it('order.refunded on a one-time order resolves through ord:.lks; activate answers 403 refunded (LIC-11)', async () => {
    const h = harness();
    const row = await linkedLifetime(h);
    await send(h, polarEvents.order('order.refunded', row));
    expect((await lic(h, LIFETIME))?.status).toBe('refunded');
    const again = await activateKey(h, LIFETIME, DEVICE);
    expect(again.status).toBe(403);
    expect(await again.json()).toEqual({ error: 'refunded' });
  });

  it('a partial order.refunded keeps the licence', async () => {
    const h = harness();
    const row = await linkedLifetime(h);
    await send(h, polarEvents.order('order.refunded', row, { status: 'partially_refunded', refunded_amount: 400 }));
    expect((await lic(h, LIFETIME))?.status).toBe('active');
  });

  it('a refund of a renewal order (new order id) resolves through the subscription', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    await send(
      h,
      polarEvents.order('order.refunded', row, { id: 'ord_renewal_2027', billing_reason: 'subscription_cycle' }),
    );
    expect((await lic(h, YEARLY))?.status).toBe('refunded');
  });

  it.each<[string, Record<string, unknown>, ILicenseRecord['status']]>([
    ['succeeded, revoke_benefits', {}, 'refunded'],
    ['pending', { status: 'pending' }, 'active'],
    ['failed', { status: 'failed' }, 'active'],
    ['succeeded without revoking benefits', { revoke_benefits: false }, 'active'],
  ])('refund.created (%s) → %s', async (_name, over, status) => {
    const h = harness();
    const row = await linkedLifetime(h);
    await send(h, polarEvents.refund('refund.created', row, over));
    expect((await lic(h, LIFETIME))?.status).toBe(status);
  });

  it('refund.updated to succeeded refunds a licence whose refund.created was pending', async () => {
    const h = harness();
    const row = await linkedLifetime(h);
    await send(h, polarEvents.refund('refund.created', row, { status: 'pending' }));
    await send(h, polarEvents.refund('refund.updated', row));
    expect((await lic(h, LIFETIME))?.status).toBe('refunded');
  });

  it('a customer with two licences: each event reaches only its own licence', async () => {
    const h = harness();
    const yearly = await linkedYearly(h);
    const lifetime = await linkedLifetime(h);
    expect(h.kv.json<string[]>('cus:cus_d06')).toHaveLength(2);
    await send(h, polarEvents.subscription('subscription.revoked', yearly));
    expect((await lic(h, YEARLY))?.status).toBe('revoked');
    expect((await lic(h, LIFETIME))?.status).toBe('active');
    await send(h, polarEvents.refund('refund.created', lifetime));
    expect((await lic(h, LIFETIME))?.status).toBe('refunded');
  });

  describe('out-of-order delivery', () => {
    it('a refund before the first activation waits on lk: and activation answers 403 without a Polar activation', async () => {
      const h = harness();
      const row = h.polar.addKey(LIFETIME, { customerId: 'cus_d06', benefitId: BENEFITS.lifetime });
      await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
      await send(h, polarEvents.order('order.refunded', row));
      expect(h.kv.json<ILicenseLink>(`lk:${row.id}`)?.pending).toBe('refunded');
      expect(h.kv.keys('lic:')).toEqual([]);
      const res = await activateKey(h, LIFETIME);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'refunded' });
      expect(h.polar.callsTo('/activate')).toEqual([]);
      expect((await lic(h, LIFETIME))?.status).toBe('refunded');
    });

    it('a cancel before the first activation is applied once, and a later uncancel is not undone', async () => {
      const h = harness();
      const row = h.polar.addKey(YEARLY, { customerId: 'cus_d06' });
      await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
      await send(h, polarEvents.subscription('subscription.canceled', row));
      expect((await activateKey(h, YEARLY)).status).toBe(200);
      expect((await lic(h, YEARLY))?.status).toBe('canceled');
      expect(h.kv.json<ILicenseLink>(`lk:${row.id}`)?.pending).toBeUndefined();
      await send(h, polarEvents.subscription('subscription.uncanceled', row));
      expect((await activateKey(h, YEARLY, DEVICE_2)).status).toBe(200);
      expect((await lic(h, YEARLY))?.status).toBe('active');
    });

    it('a revoke before the grant is a no-op (no index yet); the late grant does not re-open anything', async () => {
      const h = harness();
      const row = h.polar.addKey(YEARLY, { customerId: 'cus_d06' });
      expect((await send(h, polarEvents.subscription('subscription.revoked', row))).res.status).toBe(200);
      expect(h.kv.keys().every((key) => key.startsWith('wh:'))).toBe(true);
      expect((await activateKey(h, YEARLY)).status).toBe(200);
      await send(h, polarEvents.subscription('subscription.revoked', row));
      // No grant yet, but the activated record carries the customer: the fallback finds the one yearly licence.
      expect((await lic(h, YEARLY))?.status).toBe('revoked');
      await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
      await send(h, polarEvents.benefitGrant('benefit_grant.updated', row));
      await send(h, polarEvents.subscription('subscription.uncanceled', row));
      await send(h, polarEvents.subscription('subscription.active', row));
      expect((await lic(h, YEARLY))?.status).toBe('revoked');
    });

    it('revoked → canceled → uncanceled delivered in reverse never re-opens the licence', async () => {
      const h = harness();
      const row = await linkedYearly(h);
      await send(h, polarEvents.subscription('subscription.revoked', row));
      await send(h, polarEvents.subscription('subscription.canceled', row));
      await send(h, polarEvents.subscription('subscription.uncanceled', row));
      expect((await lic(h, YEARLY))?.status).toBe('revoked');
    });
  });

  describe('customer fallback (records written before D-06)', () => {
    async function seedLegacy(
      h: IHarness,
      key: string,
      plan: ILicenseRecord['plan'],
      customerId = 'cus_old',
    ): Promise<string> {
      const keyHash = await sha256Hex(key);
      h.kv.seed(`lic:${keyHash}`, {
        plan,
        status: 'active',
        keyEnc: 'unused',
        polarOrderId: 'lk_uuid_stored_by_old_activate',
        customerId,
        activations: [],
        limit: 5,
        exp: T0 / 1000 + 365 * 86_400,
        createdAt: T0,
        updatedAt: T0,
      } satisfies ILicenseRecord);
      const list = h.kv.json<string[]>(`cus:${customerId}`) ?? [];
      h.kv.seed(`cus:${customerId}`, [...list, keyHash]);
      return keyHash;
    }

    const stranger = (over: Partial<IPolarKey> = {}): IPolarKey => ({
      id: 'lk_unknown',
      key: 'AWAKETAB-UNSEEN-0000-0000',
      status: 'granted',
      benefitId: BENEFITS.yearly,
      customerId: 'cus_old',
      orderId: 'ord_unknown',
      subscriptionId: 'sub_unknown',
      grantId: 'grant_unknown',
      limit: 5,
      expiresAt: null,
      activations: new Map(),
      grant: 'ready',
      grantedAt: new Date(T0).toISOString(),
      ...over,
    });

    it("subscription.revoked reaches the customer's yearly licence and not the lifetime one", async () => {
      const h = harness();
      await seedLegacy(h, YEARLY, 'pro_yearly');
      await seedLegacy(h, LIFETIME, 'pro_lifetime');
      await send(h, polarEvents.subscription('subscription.revoked', stranger()));
      expect((await lic(h, YEARLY))?.status).toBe('revoked');
      expect((await lic(h, LIFETIME))?.status).toBe('active');
    });

    it('handles every matching licence of the customer (two yearly records, ids unknown)', async () => {
      const h = harness();
      await seedLegacy(h, YEARLY, 'pro_yearly');
      await seedLegacy(h, KEY, 'pro_yearly');
      await send(h, polarEvents.subscription('subscription.canceled', stranger()));
      expect((await lic(h, YEARLY))?.status).toBe('canceled');
      expect((await lic(h, KEY))?.status).toBe('canceled');
    });

    it('a one-time order refund skips subscription plans; the stored polarOrderId of old records is not trusted', async () => {
      const h = harness();
      await seedLegacy(h, YEARLY, 'pro_yearly');
      await seedLegacy(h, LIFETIME, 'pro_lifetime');
      await send(h, polarEvents.order('order.refunded', stranger({ subscriptionId: null })));
      expect((await lic(h, LIFETIME))?.status).toBe('refunded');
      expect((await lic(h, YEARLY))?.status).toBe('active');
    });

    it('a grant for a key activated before D-06 does not hide that record from later events', async () => {
      const h = harness();
      await seedLegacy(h, YEARLY, 'pro_yearly');
      const row = stranger({ id: 'lk_old', subscriptionId: 'sub_old', grantId: 'grant_old' });
      await send(h, polarEvents.benefitGrant('benefit_grant.created', row));
      await send(h, polarEvents.subscription('subscription.revoked', row));
      expect((await lic(h, YEARLY))?.status).toBe('revoked');
    });

    it('never falls back to a D-06 record whose ids differ from the event', async () => {
      const h = harness();
      await linkedYearly(h, 'cus_old');
      await send(h, polarEvents.subscription('subscription.revoked', stranger({ subscriptionId: 'sub_other' })));
      expect((await lic(h, YEARLY))?.status).toBe('active');
    });
  });

  it('unknown ids and an unknown customer are a 200 no-op', async () => {
    const h = harness();
    const row: IPolarKey = {
      id: 'lk_nobody',
      key: 'AWAKETAB-NOBODY-0000-0000',
      status: 'granted',
      benefitId: BENEFITS.yearly,
      customerId: 'cus_nobody',
      orderId: 'ord_nobody',
      subscriptionId: 'sub_nobody',
      grantId: 'grant_nobody',
      limit: 5,
      expiresAt: null,
      activations: new Map(),
      grant: 'ready',
      grantedAt: new Date(T0).toISOString(),
    };
    for (const payload of [
      polarEvents.subscription('subscription.revoked', row),
      polarEvents.subscription('subscription.canceled', row),
      polarEvents.order('order.refunded', row),
      polarEvents.refund('refund.created', row),
    ]) {
      expect((await send(h, payload)).res.status).toBe(200);
    }
    expect(h.kv.keys().every((key) => key.startsWith('wh:'))).toBe(true);
    // A revoked grant for a key nobody activated is remembered on lk: only.
    expect((await send(h, polarEvents.benefitGrant('benefit_grant.revoked', row))).res.status).toBe(200);
    expect(h.kv.keys('lic:')).toEqual([]);
    expect(h.kv.json<ILicenseLink>('lk:lk_nobody')?.pending).toBe('revoked');
  });

  it('a replayed key-less revoke is not re-run after the licence was restored by hand (LIC-10)', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    await send(h, polarEvents.subscription('subscription.revoked', row), { id: 'evt_d06_replay' });
    expect((await lic(h, YEARLY))?.status).toBe('revoked');
    const licKey = `lic:${await sha256Hex(YEARLY)}`;
    h.kv.seed(licKey, { ...h.kv.json<ILicenseRecord>(licKey), status: 'active' });
    const writes = h.kv.writes.length;
    const again = await send(h, polarEvents.subscription('subscription.revoked', row), { id: 'evt_d06_replay' });
    expect(await again.res.json()).toEqual({ ok: true, duplicate: true });
    expect(h.kv.writes).toHaveLength(writes);
    expect((await lic(h, YEARLY))?.status).toBe('active');
  });

  it('a failed key-less delivery is processed on retry (marker written last)', async () => {
    const h = harness();
    const row = await linkedYearly(h);
    const licKey = `lic:${await sha256Hex(YEARLY)}`;
    h.kv.failNextPut((key) => key === licKey);
    const { request } = await webhookRequest(polarEvents.subscription('subscription.revoked', row), {
      id: 'evt_d06_retry',
    });
    await expect(invoke(onWebhook, h.env, request)).rejects.toThrow(/KV PUT failed/u);
    expect(h.kv.peek('wh:evt_d06_retry')).toBeNull();
    await send(h, polarEvents.subscription('subscription.revoked', row), { id: 'evt_d06_retry' });
    expect((await lic(h, YEARLY))?.status).toBe('revoked');
  });

  it('stores no licence key, IP or email in KV', async () => {
    const h = harness();
    await linkedYearly(h);
    const persisted = JSON.stringify(h.kv.writes);
    expect(persisted).not.toContain(YEARLY);
    expect(persisted).not.toContain('buyer@example.com');
  });
});
