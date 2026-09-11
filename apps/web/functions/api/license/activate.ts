import type { IEnv } from '../../_lib/env';
import { jsonError, jsonOk, parseActivateBody } from '../../_lib/http';
import { signES256, parseSigningKey } from '../../_lib/jwt';
import {
  encryptUtf8,
  PLAN_FEATURES,
  publicActivations,
  readLicense,
  sha256Hex,
  writeLicense,
  type ILicenseRecord,
  type TPlanId,
} from '../../_lib/license';
import { PolarError, createPolar, planFromBenefit } from '../../_lib/polar';
import { clientIp, rateLimit } from '../../_lib/ratelimit';

const STALE_MS = 90 * 86_400_000;

function tokenExp(plan: TPlanId, periodEnd: number | null, nowSec: number): number {
  if (plan === 'pro_yearly' || plan === 'biz_embed_site_yearly') {
    return (periodEnd ?? nowSec + 30 * 86_400) + 7 * 86_400;
  }
  if (plan === 'pro_lifetime') return nowSec + 90 * 86_400;
  return nowSec + 365 * 86_400;
}

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  const ip = await clientIp(request);
  if (!(await rateLimit(env, 'license', ip, 10))) return jsonError('rate_limited', 429);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('bad_request', 400);
  }
  const parsed = parseActivateBody(body);
  if (!parsed) return jsonError('bad_request', 400);
  const kv = env.LICENSES;
  const encKey = env.LICENSE_KEY_ENC_KEY;
  if (!kv || !encKey || !env.LICENSE_SIGNING_KEY) return jsonError('polar_unavailable', 502);

  const polar = createPolar(env);
  let key = parsed.key;
  if (parsed.checkoutId && !key) {
    try {
      const checkout = await polar.checkout(parsed.checkoutId);
      if (checkout.status !== 'succeeded' || !checkout.license_key) return jsonError('invalid_key', 404);
      key = checkout.license_key.trim().toUpperCase();
    } catch (err) {
      if (err instanceof PolarError) return jsonError(err.code, err.code === 'polar_unavailable' ? 502 : 400);
      return jsonError('polar_unavailable', 502);
    }
  }
  if (!key) return jsonError('bad_request', 400);

  const keyHash = await sha256Hex(key);
  const existing = await readLicense(kv, keyHash);
  if (existing && (existing.status === 'revoked' || existing.status === 'refunded')) {
    return jsonError(existing.status, 403);
  }

  const devHash = await sha256Hex(parsed.deviceId);
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);

  if (existing) {
    const same = existing.activations.find((row) => row.devHash === devHash);
    if (same) {
      same.at = now;
      same.label = parsed.deviceLabel;
      existing.updatedAt = now;
      await writeLicense(kv, keyHash, existing);
      return mint(env, existing, keyHash, parsed.deviceId, nowSec);
    }
  }

  let polarLicense;
  try {
    polarLicense = await polar.validate(key);
  } catch (err) {
    if (err instanceof PolarError) {
      return jsonError(err.code, err.code === 'polar_unavailable' ? 502 : err.code === 'invalid_key' ? 404 : 403);
    }
    return jsonError('polar_unavailable', 502);
  }
  if (polarLicense.status !== 'granted') return jsonError('revoked', 403);
  const plan = planFromBenefit(env, polarLicense.benefit_id);
  if (!plan) return jsonError('invalid_key', 404);

  const record: ILicenseRecord = existing ?? {
    plan,
    status: 'active',
    keyEnc: await encryptUtf8(key, encKey),
    polarOrderId: polarLicense.id ?? '',
    customerId: polarLicense.customer_id,
    activations: [],
    limit: polarLicense.limit_activations || 5,
    exp: tokenExp(plan, polarLicense.expires_at ? Date.parse(polarLicense.expires_at) / 1000 : null, nowSec),
    createdAt: now,
    updatedAt: now,
  };
  record.plan = plan;
  record.limit = polarLicense.limit_activations || record.limit;

  if (record.activations.length >= record.limit) {
    const stale = record.activations.find((row) => now - row.at > STALE_MS);
    if (stale?.polarActivationId) {
      try {
        await polar.deactivate(key, stale.polarActivationId);
      } catch {
        // eviction is best-effort; Polar may already have dropped it
      }
      record.activations = record.activations.filter((row) => row !== stale);
    } else if (!stale) {
      return jsonError('activation_limit', 409, { activations: record.activations.map((row) => row.label) });
    } else {
      record.activations = record.activations.filter((row) => row !== stale);
    }
  }

  let activationId: string;
  try {
    const activated = await polar.activate(key, parsed.deviceLabel, parsed.deviceId);
    activationId = activated.id;
  } catch (err) {
    if (err instanceof PolarError && err.code === 'activation_limit') {
      return jsonError('activation_limit', 409, { activations: record.activations.map((row) => row.label) });
    }
    if (err instanceof PolarError) {
      return jsonError(err.code, err.code === 'polar_unavailable' ? 502 : 400);
    }
    return jsonError('polar_unavailable', 502);
  }

  record.activations.push({
    devHash,
    label: parsed.deviceLabel,
    at: now,
    polarActivationId: activationId,
  });
  record.updatedAt = now;
  await writeLicense(kv, keyHash, record);
  const customerKeys = JSON.parse((await kv.get(`cus:${record.customerId}`)) ?? '[]') as string[];
  if (!customerKeys.includes(keyHash)) {
    customerKeys.push(keyHash);
    await kv.put(`cus:${record.customerId}`, JSON.stringify(customerKeys));
  }
  return mint(env, record, keyHash, parsed.deviceId, nowSec);
};

async function mint(env: IEnv, record: ILicenseRecord, keyHash: string, deviceId: string, nowSec: number): Promise<Response> {
  const ver = Number(env.LICENSE_SIGNING_VER ?? '1');
  const token = await signES256(
    {
      sub: keyHash,
      plan: record.plan,
      features: PLAN_FEATURES[record.plan],
      dev: await sha256Hex(deviceId),
      iat: nowSec,
      exp: record.exp,
      ver,
    },
    parseSigningKey(env.LICENSE_SIGNING_KEY),
  );
  return jsonOk({
    token,
    plan: record.plan,
    features: PLAN_FEATURES[record.plan],
    exp: record.exp,
    activations: publicActivations(record),
  });
}
