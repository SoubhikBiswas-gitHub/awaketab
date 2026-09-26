import type { IEnv } from '../../_lib/env';
import { jsonOk } from '../../_lib/http';
import { encryptUtf8, sha256Hex, type ILicenseRecord, type TLicenseStatus, type TPlanId } from '../../_lib/license';
import { verifyStandardWebhook } from '../../_lib/webhook';

interface IPolarWebhook {
  type?: string;
  id?: string;
  data?: {
    id?: string;
    customer_id?: string;
    order_id?: string;
    license_key?: { key?: string; benefit_id?: string; limit_activations?: number; expires_at?: string | null };
    metadata?: { plan?: TPlanId; domain?: string };
  };
}

const WINDOW_S = 300;

async function updateStatus(kv: KVNamespace, keyHash: string, next: TLicenseStatus, onlyFrom?: TLicenseStatus): Promise<void> {
  const rawLic = await kv.get(`lic:${keyHash}`);
  if (!rawLic) return;
  const record = JSON.parse(rawLic) as ILicenseRecord;
  if (onlyFrom && record.status !== onlyFrom) return;
  // revoked/refunded are terminal: a late or out-of-order cancel/uncancel must not re-open access.
  if ((record.status === 'revoked' || record.status === 'refunded') && (next === 'active' || next === 'canceled')) return;
  record.status = next;
  record.updatedAt = Date.now();
  await kv.put(`lic:${keyHash}`, JSON.stringify(record));
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
  const data = payload.data ?? {};
  const key = data.license_key?.key?.trim().toUpperCase();
  const keyHash = key ? await sha256Hex(key) : '';

  if (type === 'order.created' && data.id) {
    await kv.put(
      `ord:${data.id}`,
      JSON.stringify({
        plan: data.metadata?.plan ?? 'pro_yearly',
        amountCents: 0,
        currency: 'USD',
        customerId: data.customer_id ?? '',
        at: Date.now(),
      }),
      { expirationTtl: 2 * 365 * 86_400 },
    );
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
      polarOrderId: data.order_id ?? data.id ?? '',
      customerId: data.customer_id ?? '',
      activations: [],
      limit: data.license_key?.limit_activations ?? 5,
      exp: Math.floor(Date.now() / 1000) + 365 * 86_400,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
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

  // docs/09 §2.7: canceled keeps features until periodEnd + 7 d; revoked ends them now.
  if (keyHash && type === 'subscription.canceled') await updateStatus(kv, keyHash, 'canceled');
  if (keyHash && type === 'subscription.uncanceled') await updateStatus(kv, keyHash, 'active', 'canceled');
  if (keyHash && (type === 'subscription.revoked' || type === 'benefit_grant.revoked')) {
    await updateStatus(kv, keyHash, 'revoked');
  }
  if (keyHash && (type === 'order.refunded' || type === 'refund.created')) await updateStatus(kv, keyHash, 'refunded');

  // Mark the event only after it was handled: if a write above throws, Polar retries and the retry must run.
  await kv.put(`wh:${eventId}`, JSON.stringify({ at: Date.now() }), { expirationTtl: 30 * 86_400 });
  return jsonOk({ ok: true });
};
