import type { IEnv } from '../../_lib/env';
import { jsonOk } from '../../_lib/http';
import { encryptUtf8, sha256Hex, type ILicenseRecord, type TPlanId } from '../../_lib/license';
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

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  const raw = await request.text();
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
  const eventId = request.headers.get('webhook-id') ?? payload.id ?? '';
  if (eventId) {
    const seen = await kv.get(`wh:${eventId}`);
    if (seen) return jsonOk({ ok: true, duplicate: true });
    await kv.put(`wh:${eventId}`, JSON.stringify({ at: Date.now() }), { expirationTtl: 30 * 86_400 });
  }

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

  if ((type === 'order.created' || type === 'benefit_grant.created') && keyHash && key && env.LICENSE_KEY_ENC_KEY) {
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

  if (keyHash && (type === 'subscription.canceled' || type === 'subscription.revoked' || type === 'benefit_grant.revoked')) {
    const rawLic = await kv.get(`lic:${keyHash}`);
    if (rawLic) {
      const record = JSON.parse(rawLic) as ILicenseRecord;
      record.status = 'revoked';
      record.updatedAt = Date.now();
      await kv.put(`lic:${keyHash}`, JSON.stringify(record));
    }
  }

  if (keyHash && (type === 'order.refunded' || type === 'refund.created')) {
    const rawLic = await kv.get(`lic:${keyHash}`);
    if (rawLic) {
      const record = JSON.parse(rawLic) as ILicenseRecord;
      record.status = 'refunded';
      record.updatedAt = Date.now();
      await kv.put(`lic:${keyHash}`, JSON.stringify(record));
    }
  }

  return jsonOk({ ok: true });
};
