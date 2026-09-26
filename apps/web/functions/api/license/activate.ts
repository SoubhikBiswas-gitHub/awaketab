import type { IEnv } from '../../_lib/env';
import { isLookupBody, jsonError, jsonOk, KEY_RE, parseActivateBody, parseLookupBody, rateLimited } from '../../_lib/http';
import {
  encryptUtf8,
  PLAN_FEATURES,
  publicActivations,
  readLicense,
  sha256Hex,
  writeLicense,
  type ILicenseRecord,
} from '../../_lib/license';
import { PolarError, createPolar, planFromBenefit } from '../../_lib/polar';
import { clientIp, rateLimit } from '../../_lib/ratelimit';
import { mintToken, tokenExp } from '../../_lib/token';

const STALE_MS = 90 * 86_400_000;

export const onRequestPost: PagesFunction<IEnv> = async (context) => {
  const { env, request } = context;
  const ip = await clientIp(request);
  if (!(await rateLimit(env, 'license', ip, 10))) return rateLimited();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('bad_request', 400);
  }
  if (isLookupBody(body)) {
    const lookup = parseLookupBody(body);
    return lookup ? lookupCheckout(env, lookup.checkoutId) : jsonError('bad_request', 400);
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
      return polarFailure(err);
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
      return mint(env, existing, keyHash, devHash, nowSec);
    }
  }

  let polarLicense;
  try {
    polarLicense = await polar.validate(key);
  } catch (err) {
    return polarFailure(err);
  }
  if (polarLicense.status !== 'granted') return jsonError('revoked', 403);
  const plan = planFromBenefit(env, polarLicense.benefit_id);
  if (!plan) return jsonError('invalid_key', 404);

  const exp = tokenExp(plan, polarLicense.expires_at ? Date.parse(polarLicense.expires_at) / 1000 : null, nowSec);
  const record: ILicenseRecord = existing ?? {
    plan,
    status: 'active',
    keyEnc: await encryptUtf8(key, encKey),
    polarOrderId: polarLicense.id ?? '',
    customerId: polarLicense.customer_id,
    activations: [],
    limit: polarLicense.limit_activations || 5,
    exp,
    createdAt: now,
    updatedAt: now,
  };
  record.plan = plan;
  record.limit = polarLicense.limit_activations || record.limit;
  // Polar just told us the current period; a record written by an earlier webhook or activation may be stale.
  record.exp = exp;

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
  return mint(env, record, keyHash, devHash, nowSec);
};

async function mint(env: IEnv, record: ILicenseRecord, keyHash: string, devHash: string, nowSec: number): Promise<Response> {
  const { token, exp } = await mintToken(env, record, keyHash, devHash, nowSec);
  return jsonOk({
    token,
    plan: record.plan,
    features: PLAN_FEATURES[record.plan],
    exp,
    activations: publicActivations(record),
  });
}

function polarFailure(err: unknown): Response {
  if (!(err instanceof PolarError)) return jsonError('polar_unavailable', 502);
  if (err.code === 'polar_unavailable') return jsonError(err.code, 502);
  return jsonError(err.code, err.code === 'invalid_key' ? 404 : 403);
}

/**
 * `{ checkoutId, lookup: true }` → `{ key, plan }` without activating anything (docs/09 §2.3a). Used by
 * `/pro/activate?ext=1&checkout_id=…` so the browser that finished checkout does not spend one of the five
 * activations before the extension activates itself. Same rate-limit bucket as activation (checked by the
 * caller); unknown, unpaid and keyless checkouts all answer 404 `invalid_key`. Holding the checkout ID already
 * authorises activating its key through this endpoint, so returning the key to that holder grants nothing new
 * (Polar shows the same key on its receipt page). No KV write, no Polar activation.
 */
async function lookupCheckout(env: IEnv, checkoutId: string): Promise<Response> {
  const kv = env.LICENSES;
  if (!kv) return jsonError('polar_unavailable', 502);
  const polar = createPolar(env);
  let key: string;
  try {
    const checkout = await polar.checkout(checkoutId);
    if (checkout.status !== 'succeeded' || !checkout.license_key) return jsonError('invalid_key', 404);
    key = checkout.license_key.trim().toUpperCase();
  } catch (err) {
    return polarFailure(err);
  }
  if (!KEY_RE.test(key)) return jsonError('invalid_key', 404);
  const existing = await readLicense(kv, await sha256Hex(key));
  if (existing && (existing.status === 'revoked' || existing.status === 'refunded')) return jsonError(existing.status, 403);
  let license;
  try {
    license = await polar.validate(key);
  } catch (err) {
    return polarFailure(err);
  }
  if (license.status !== 'granted') return jsonError('revoked', 403);
  const plan = planFromBenefit(env, license.benefit_id);
  if (!plan) return jsonError('invalid_key', 404);
  return jsonOk({ key, plan });
}
