import type { IEnv } from '../../_lib/env';
import { jsonOk } from '../../_lib/http';
import { encryptUtf8, sha256Hex, type ILicenseRecord, type TLicenseStatus, type TPlanId } from '../../_lib/license';
import {
  applyIds,
  licenseKeyIdsFor,
  linkLicenseKey,
  mergeOrder,
  readLink,
  SUBSCRIPTION_PLANS,
  transition,
  type IPolarIds,
} from '../../_lib/links';
import { verifyStandardWebhook } from '../../_lib/webhook';

interface IPolarData {
  id?: string;
  customer_id?: string;
  order_id?: string | null;
  subscription_id?: string | null;
  benefit_id?: string;
  status?: string;
  revoke_benefits?: boolean;
  currency?: string;
  net_amount?: number;
  properties?: { license_key_id?: string };
  product?: { metadata?: { plan?: TPlanId }; benefits?: Array<{ id?: string }> } | null;
  license_key?: { key?: string; id?: string; limit_activations?: number; expires_at?: string | null };
  metadata?: { plan?: TPlanId; domain?: string };
}

interface IPolarWebhook {
  type?: string;
  data?: IPolarData;
}

interface IEventIds extends IPolarIds {
  benefitIds: string[];
  kind: 'subscription' | 'one_time' | 'unknown';
}

interface IStatusChange {
  next: TLicenseStatus;
  onlyFrom?: TLicenseStatus;
}

const WINDOW_S = 300;

const LINK_EVENTS = new Set(['benefit_grant.created', 'benefit_grant.updated', 'benefit_grant.revoked']);

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function kindOf(subscriptionId: unknown): IEventIds['kind'] {
  if (typeof subscriptionId === 'string' && subscriptionId) return 'subscription';
  return subscriptionId === null ? 'one_time' : 'unknown';
}

function eventIds(type: string, data: IPolarData): IEventIds {
  const found: IEventIds = { customerId: str(data.customer_id), benefitIds: [], kind: 'unknown' };
  if (type.startsWith('benefit_grant.')) {
    found.grantId = str(data.id);
    found.licenseKeyId = str(data.properties?.license_key_id);
    found.orderId = str(data.order_id);
    found.subscriptionId = str(data.subscription_id);
    found.benefitId = str(data.benefit_id);
    if (found.benefitId) found.benefitIds.push(found.benefitId);
    found.kind = kindOf(data.subscription_id);
  } else if (type.startsWith('subscription.')) {
    found.subscriptionId = str(data.id);
    found.benefitIds = (data.product?.benefits ?? []).map((row) => str(row.id)).filter((id): id is string => Boolean(id));
    found.kind = 'subscription';
  } else if (type.startsWith('order.')) {
    found.orderId = str(data.id);
    found.subscriptionId = str(data.subscription_id);
    found.kind = kindOf(data.subscription_id);
  } else if (type.startsWith('refund.')) {
    found.orderId = str(data.order_id);
    found.subscriptionId = str(data.subscription_id);
    found.kind = kindOf(data.subscription_id);
  }
  found.licenseKeyId ??= str(data.license_key?.id);
  return found;
}

function statusChange(type: string, data: IPolarData): IStatusChange | null {
  switch (type) {
    case 'subscription.canceled':
      // Canceled keeps features until periodEnd + 7 d; revoked ends them now.
      return { next: 'canceled' };
    case 'subscription.uncanceled':
      return { next: 'active', onlyFrom: 'canceled' };
    case 'subscription.revoked':
    case 'benefit_grant.revoked':
      return { next: 'revoked' };
    case 'order.refunded':
      // Sent for full and partial refunds; the policy (docs/09 §2.11) is that a refund ends the licence, and a
      // partial refund is a goodwill credit. A partial refund that should end access revokes the benefit, which
      // arrives as `refund.*` with `revoke_benefits` and as `benefit_grant.revoked`.
      return data.status === 'partially_refunded' ? null : { next: 'refunded' };
    case 'refund.created':
    case 'refund.updated':
      // `refund.created` is sent "regardless of status". Act once it succeeded and the merchant asked Polar to
      // revoke benefits; absent fields (older, key-bearing payloads) count as yes.
      if (data.status !== undefined && data.status !== 'succeeded') return null;
      if (data.revoke_benefits === false) return null;
      return { next: 'refunded' };
    default:
      return null;
  }
}

async function readRecord(kv: KVNamespace, keyHash: string): Promise<ILicenseRecord | null> {
  const raw = await kv.get(`lic:${keyHash}`);
  return raw ? (JSON.parse(raw) as ILicenseRecord) : null;
}

async function updateStatus(kv: KVNamespace, keyHash: string, change: IStatusChange): Promise<void> {
  const record = await readRecord(kv, keyHash);
  if (!record) return;
  const next = transition(record.status, change.next, change.onlyFrom);
  if (!next) return;
  record.status = next;
  record.updatedAt = Date.now();
  await kv.put(`lic:${keyHash}`, JSON.stringify(record));
}

interface ITargets {
  keyHashes: string[];
  pending: string[];
}

async function throughLinks(kv: KVNamespace, licenseKeyIds: string[]): Promise<ITargets> {
  const targets: ITargets = { keyHashes: [], pending: [] };
  for (const lkId of new Set(licenseKeyIds)) {
    const link = await readLink(kv, lkId);
    const hashes: string[] = [];
    for (const keyHash of link?.keyHashes ?? []) {
      if (await kv.get(`lic:${keyHash}`)) hashes.push(keyHash);
    }
    if (hashes.length > 0) targets.keyHashes.push(...hashes);
    else if (link) targets.pending.push(lkId);
  }
  return targets;
}

async function byCustomer(kv: KVNamespace, found: IEventIds, legacyOnly = false): Promise<string[]> {
  if (!found.customerId) return [];
  let hashes: string[];
  try {
    hashes = JSON.parse((await kv.get(`cus:${found.customerId}`)) ?? '[]') as string[];
  } catch {
    return [];
  }
  const exact: string[] = [];
  const loose: string[] = [];
  for (const keyHash of new Set(hashes)) {
    const record = await readRecord(kv, keyHash);
    if (!record || (legacyOnly && record.polarLicenseKeyId)) continue;
    const pairs: Array<[string | undefined, string | undefined]> = [
      [found.licenseKeyId, record.polarLicenseKeyId],
      [found.grantId, record.polarGrantId],
      [found.subscriptionId, record.polarSubscriptionId],
      // Before D-06, activate stored the licence-key id in `polarOrderId`; trust it only on D-06 records.
      [found.orderId, record.polarLicenseKeyId ? record.polarOrderId || undefined : undefined],
    ];
    const compared = pairs.filter(([a, b]) => a && b);
    if (compared.some(([a, b]) => a !== b)) continue;
    if (compared.length > 0) {
      exact.push(keyHash);
      continue;
    }
    if (found.kind === 'subscription' && !SUBSCRIPTION_PLANS.has(record.plan)) continue;
    if (found.kind === 'one_time' && SUBSCRIPTION_PLANS.has(record.plan)) continue;
    if (record.benefitId && found.benefitIds.length > 0 && !found.benefitIds.includes(record.benefitId)) continue;
    loose.push(keyHash);
  }
  return exact.length > 0 ? exact : loose;
}

async function resolveTargets(kv: KVNamespace, found: IEventIds, keyHash: string): Promise<ITargets> {
  if (keyHash && (await kv.get(`lic:${keyHash}`))) return { keyHashes: [keyHash], pending: [] };
  const steps: Array<() => Promise<string[]>> = [
    async () => (found.licenseKeyId ? [found.licenseKeyId] : []),
    async () => (found.grantId ? licenseKeyIdsFor(kv, 'grant', found.grantId) : []),
    async () => (found.subscriptionId ? licenseKeyIdsFor(kv, 'sub', found.subscriptionId) : []),
    async () => (found.orderId ? licenseKeyIdsFor(kv, 'ord', found.orderId) : []),
  ];
  for (const step of steps) {
    const targets = await throughLinks(kv, await step());
    if (targets.keyHashes.length > 0) return targets;
    if (targets.pending.length > 0) {
      if (!keyHash) targets.keyHashes = await byCustomer(kv, found, true);
      return targets;
    }
  }
  if (keyHash) return { keyHashes: [], pending: [] };
  return { keyHashes: await byCustomer(kv, found), pending: [] };
}

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  const raw = await request.text();
  const headerId = request.headers.get('webhook-id');
  const ts = Number(request.headers.get('webhook-timestamp') ?? NaN);
  if (!headerId || !request.headers.get('webhook-signature') || !Number.isFinite(ts)) {
    return new Response('missing headers', { status: 400 });
  }
  if (Math.abs(Date.now() / 1000 - ts) > WINDOW_S) return new Response('stale', { status: 400 });
  const secret = env.POLAR_WEBHOOK_SECRET ?? '';
  if (!(await verifyStandardWebhook(raw, request.headers, secret))) {
    return new Response('unauthorized', { status: 401 });
  }
  let payload: IPolarWebhook;
  try {
    payload = JSON.parse(raw) as IPolarWebhook;
  } catch {
    return jsonOk({ ok: true });
  }
  const kv = env.LICENSES;
  if (!kv) return jsonOk({ ok: true });
  const eventId = headerId;
  if (await kv.get(`wh:${eventId}`)) return jsonOk({ ok: true, duplicate: true });

  const type = payload.type ?? '';
  const data: IPolarData = payload.data && typeof payload.data === 'object' ? payload.data : {};
  const key = data.license_key?.key?.trim().toUpperCase();
  const keyHash = key ? await sha256Hex(key) : '';
  const found = eventIds(type, data);

  if ((type === 'order.created' || type === 'order.paid') && found.orderId) {
    await mergeOrder(kv, found.orderId, {
      plan: data.metadata?.plan ?? data.product?.metadata?.plan ?? 'pro_yearly',
      amountCents: typeof data.net_amount === 'number' ? data.net_amount : 0,
      currency: (data.currency ?? 'usd').toUpperCase(),
      customerId: found.customerId ?? '',
      at: Date.now(),
    });
  }

  // Create only: a record that already exists (activated from the checkout page, or revoked) must keep its
  // activations and status when a late or duplicate create event arrives under a different webhook-id.
  if (
    (type === 'order.created' || type === 'benefit_grant.created') &&
    keyHash &&
    key &&
    env.LICENSE_KEY_ENC_KEY &&
    !(await kv.get(`lic:${keyHash}`))
  ) {
    const plan = (data.metadata?.plan ?? 'pro_yearly') as TPlanId;
    const record: ILicenseRecord = {
      plan,
      status: 'active',
      keyEnc: await encryptUtf8(key, env.LICENSE_KEY_ENC_KEY),
      polarOrderId: str(data.order_id) ?? str(data.id) ?? '',
      customerId: found.customerId ?? '',
      activations: [],
      limit: data.license_key?.limit_activations ?? 5,
      exp: Math.floor(Date.now() / 1000) + 365 * 86_400,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (found.licenseKeyId) record.polarLicenseKeyId = found.licenseKeyId;
    await kv.put(`lic:${keyHash}`, JSON.stringify(record));
    if (record.customerId) {
      const customerKeys = JSON.parse((await kv.get(`cus:${record.customerId}`)) ?? '[]') as string[];
      if (!customerKeys.includes(keyHash)) {
        customerKeys.push(keyHash);
        await kv.put(`cus:${record.customerId}`, JSON.stringify(customerKeys));
      }
    }
    if (plan === 'biz_embed_site_yearly' && data.metadata?.domain) {
      const domain = data.metadata.domain.toLowerCase().replace(/^www\./u, '');
      await kv.put(
        `embed:${domain}`,
        JSON.stringify({
          keyHash,
          attribution: false,
          theme: { accent: '', scheme: 'auto' },
          expiresAt: record.exp * 1000,
        }),
      );
    }
  }

  // D-06: a benefit grant is the one event that names the licence key (by id) together with its order,
  // subscription and grant ids. Join them in `lk:` and copy them onto every activated record of that key.
  if (LINK_EVENTS.has(type) && found.licenseKeyId) {
    const link = await linkLicenseKey(kv, found.licenseKeyId, { ...found, keyHash: keyHash || undefined });
    for (const linked of link.keyHashes) {
      const record = await readRecord(kv, linked);
      if (record && applyIds(record, { ...found, customerId: link.customerId })) {
        record.updatedAt = Date.now();
        await kv.put(`lic:${linked}`, JSON.stringify(record));
      }
    }
  }

  const change = statusChange(type, data);
  if (change) {
    const targets = await resolveTargets(kv, found, keyHash);
    for (const target of targets.keyHashes) await updateStatus(kv, target, change);
    for (const lkId of targets.pending) await linkLicenseKey(kv, lkId, { pending: change.next });
  }

  // Mark the event only after it was handled: if a write above throws, Polar retries and the retry must run.
  await kv.put(`wh:${eventId}`, JSON.stringify({ at: Date.now() }), { expirationTtl: 30 * 86_400 });
  return jsonOk({ ok: true });
};
