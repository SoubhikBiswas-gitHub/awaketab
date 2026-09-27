import { resolveCheckoutKey } from '../../_lib/checkout-key';
import type { IEnv } from '../../_lib/env';
import { isLookupBody, jsonError, jsonOk, parseActivateBody, parseLookupBody, rateLimited, syncing } from '../../_lib/http';
import {
  encryptUtf8,
  PLAN_FEATURES,
  publicActivations,
  readLicense,
  sha256Hex,
  writeLicense,
  type ILicenseRecord,
} from '../../_lib/license';
import { applyIds, linkLicenseKey, readLink, transition, type IPolarIds } from '../../_lib/links';
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
  // F-08: the ids a checkout resolved through (docs/09 §2.3b); a pasted key has none.
  let fromCheckout: IPolarIds = {};
  if (parsed.checkoutId && !key) {
    const resolved = await checkoutKey(env, polar, parsed.checkoutId);
    if (resolved instanceof Response) return resolved;
    key = resolved.key;
    fromCheckout = resolved.ids;
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
    polarOrderId: '',
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

  // D-06: keep the Polar ids key-less webhooks resolve by, and pick up what a benefit-grant webhook already
  // linked to this licence key (it usually arrives before the buyer activates).
  const lkId = polarLicense.id;
  if (lkId && !record.polarLicenseKeyId && record.polarOrderId === lkId) record.polarOrderId = ''; // pre-D-06 records
  const found: IPolarIds = {
    licenseKeyId: lkId,
    customerId: polarLicense.customer_id,
    benefitId: polarLicense.benefit_id,
    subscriptionId: fromCheckout.subscriptionId,
    grantId: fromCheckout.grantId,
    orderId: fromCheckout.orderId,
  };
  const link = lkId ? await readLink(kv, lkId) : null;
  applyIds(record, {
    ...found,
    grantId: found.grantId ?? link?.grantId,
    orderId: found.orderId ?? link?.orderId,
    subscriptionId: found.subscriptionId ?? link?.subscriptionId,
  });
  const pending = link?.pending ? transition(record.status, link.pending) : null;
  if (pending) record.status = pending;
  if (record.status === 'revoked' || record.status === 'refunded') {
    // Revoked or refunded before the first activation: remember it and spend no Polar activation.
    record.updatedAt = now;
    await saveLicense(kv, keyHash, record);
    return jsonError(record.status, 403);
  }

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
  await saveLicense(kv, keyHash, record);
  return mint(env, record, keyHash, devHash, nowSec);
};

async function saveLicense(kv: KVNamespace, keyHash: string, record: ILicenseRecord): Promise<void> {
  await writeLicense(kv, keyHash, record);
  if (record.customerId) {
    const customerKeys = JSON.parse((await kv.get(`cus:${record.customerId}`)) ?? '[]') as string[];
    if (!customerKeys.includes(keyHash)) {
      customerKeys.push(keyHash);
      await kv.put(`cus:${record.customerId}`, JSON.stringify(customerKeys));
    }
  }
  if (record.polarLicenseKeyId) {
    await linkLicenseKey(kv, record.polarLicenseKeyId, {
      keyHash,
      grantId: record.polarGrantId,
      orderId: record.polarOrderId || undefined,
      subscriptionId: record.polarSubscriptionId,
      customerId: record.customerId,
      benefitId: record.benefitId,
      clearPending: true,
    });
  }
}

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

async function checkoutKey(
  env: IEnv,
  polar: ReturnType<typeof createPolar>,
  checkoutId: string,
): Promise<Response | { key: string; ids: IPolarIds }> {
  try {
    const resolved = await resolveCheckoutKey(env, polar, checkoutId);
    if (resolved.kind === 'syncing') return syncing();
    if (resolved.kind === 'invalid') return jsonError('invalid_key', 404);
    return {
      key: resolved.key,
      ids: {
        subscriptionId: resolved.subscriptionId ?? undefined,
        orderId: resolved.orderId ?? undefined,
        grantId: resolved.grantId,
      },
    };
  } catch (err) {
    return polarFailure(err);
  }
}

async function lookupCheckout(env: IEnv, checkoutId: string): Promise<Response> {
  const kv = env.LICENSES;
  if (!kv) return jsonError('polar_unavailable', 502);
  const polar = createPolar(env);
  const resolved = await checkoutKey(env, polar, checkoutId);
  if (resolved instanceof Response) return resolved;
  const { key } = resolved;
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
