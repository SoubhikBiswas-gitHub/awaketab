import type { IEnv } from './env';
import type { TPlanId } from './license';

/** Polar `LicenseKeyRead` / `ValidatedLicenseKey` (the fields we read). `id` is the licence-key id (D-06). */
export interface IPolarLicense {
  status: 'granted' | 'revoked' | string;
  benefit_id: string;
  limit_activations: number | null;
  expires_at: string | null;
  customer_id: string;
  id?: string;
}

/** Polar `LicenseKeyActivationCreated`: `license_key_id` = `license_key.id`. */
export interface IPolarActivation {
  id: string;
  license_key_id?: string;
  license_key: IPolarLicense;
}

/**
 * Polar `Checkout` (`GET /v1/checkouts/{id}`, the fields we read; OpenAPI 2026-10 `Checkout`). It has no licence
 * key and no order id (F-08): `_lib/checkout-key.ts` reaches the key through the order and the benefit grant.
 * `status` is `CheckoutStatus`: `open`, `expired`, `confirmed` (payment submitted, not settled), `succeeded`,
 * `failed`.
 */
export interface IPolarCheckout {
  id: string;
  status: string;
  customer_id: string | null;
  subscription_id: string | null;
}

/**
 * Polar `BenefitGrant` (`GET /v1/benefit-grants/`, the fields we read). For a License Keys benefit `properties`
 * is `BenefitGrantLicenseKeysProperties`, whose optional `license_key_id` names the key. A grant belongs to either
 * a one-time order (`order_id`) or a subscription (`subscription_id`).
 */
export interface IPolarBenefitGrant {
  id: string;
  created_at: string;
  granted_at?: string | null;
  is_granted: boolean;
  is_revoked: boolean;
  subscription_id: string | null;
  order_id: string | null;
  customer_id: string;
  benefit_id: string;
  properties: { license_key_id?: string; display_key?: string } | null;
}

/** Polar `Order` (`GET /v1/orders/?checkout_id=`, the fields we read). */
export interface IPolarOrder {
  id: string;
  checkout_id: string | null;
  customer_id: string;
  subscription_id: string | null;
}

/** Polar `LicenseKeyWithActivations` (`GET /v1/license-keys/{id}`): the one organisation read that returns the key. */
export interface IPolarLicenseKey extends IPolarLicense {
  id: string;
  key: string;
}

interface IListResource<T> {
  items: T[];
}

export class PolarError extends Error {
  constructor(
    readonly code: 'invalid_key' | 'polar_unavailable' | 'activation_limit' | 'revoked',
    message: string,
  ) {
    super(message);
    this.name = 'PolarError';
  }
}

/** F-06 / docs/09 §1: the Polar API for each `PUBLIC_POLAR_SERVER` value. */
export const POLAR_API_BASES = {
  sandbox: 'https://sandbox-api.polar.sh',
  production: 'https://api.polar.sh',
} as const;

export type TPolarServer = keyof typeof POLAR_API_BASES;

/**
 * The same Pages variable that picks the checkout links at build time (`scripts/polar-server.mjs`). Anything but
 * `production` is the sandbox, so a preview or local run can never reach production Polar by accident.
 */
export function polarServer(env: Pick<IEnv, 'PUBLIC_POLAR_SERVER'>): TPolarServer {
  return env.PUBLIC_POLAR_SERVER?.trim() === 'production' ? 'production' : 'sandbox';
}

export function apiBase(env: Pick<IEnv, 'PUBLIC_POLAR_SERVER'>): string {
  return POLAR_API_BASES[polarServer(env)];
}

export function planFromBenefit(env: IEnv, benefitId: string): TPlanId | null {
  try {
    const map = JSON.parse(env.POLAR_BENEFIT_MAP ?? '{}') as Record<string, TPlanId>;
    return map[benefitId] ?? null;
  } catch {
    return null;
  }
}

async function polarPost(env: IEnv, path: string, body: unknown, fetchFn: typeof fetch): Promise<Response> {
  const token = env.POLAR_ACCESS_TOKEN;
  if (!token) throw new PolarError('polar_unavailable', 'missing token');
  try {
    return await fetchFn(`${apiBase(env)}${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PolarError('polar_unavailable', 'network');
  }
}

async function polarGet(env: IEnv, path: string, fetchFn: typeof fetch): Promise<Response> {
  const token = env.POLAR_ACCESS_TOKEN;
  if (!token) throw new PolarError('polar_unavailable', 'missing token');
  try {
    return await fetchFn(`${apiBase(env)}${path}`, { headers: { authorization: `Bearer ${token}` } });
  } catch {
    throw new PolarError('polar_unavailable', 'network');
  }
}

async function listItems<T>(res: Response): Promise<T[]> {
  if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
  const body = (await res.json()) as Partial<IListResource<T>>;
  return Array.isArray(body.items) ? body.items : [];
}

export function createPolar(env: IEnv, fetchFn: typeof fetch = fetch) {
  const org = env.POLAR_ORGANIZATION_ID;
  const query = (params: Record<string, string>): string =>
    new URLSearchParams(org ? { organization_id: org, ...params } : params).toString();
  return {
    async validate(key: string): Promise<IPolarLicense> {
      const res = await polarPost(env, '/v1/customer-portal/license-keys/validate', { key, organization_id: org }, fetchFn);
      if (res.status === 404) throw new PolarError('invalid_key', 'not found');
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarLicense;
    },
    async activate(key: string, label: string, deviceId: string): Promise<IPolarActivation> {
      const res = await polarPost(
        env,
        '/v1/customer-portal/license-keys/activate',
        { key, organization_id: org, label, meta: { deviceId } },
        fetchFn,
      );
      if (res.status === 403) throw new PolarError('activation_limit', 'polar 403');
      if (res.status === 404) throw new PolarError('invalid_key', 'not found');
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarActivation;
    },
    async deactivate(key: string, activationId: string): Promise<void> {
      const res = await polarPost(
        env,
        '/v1/customer-portal/license-keys/deactivate',
        { key, organization_id: org, activation_id: activationId },
        fetchFn,
      );
      // 404: Polar no longer has this activation (removed in the customer portal); nothing left to undo.
      if (!res.ok && res.status !== 204 && res.status !== 404) throw new PolarError('polar_unavailable', `status ${res.status}`);
    },
    /** `GET /v1/checkouts/{id}` (scope `checkouts:read`). 404 and 422 (not a UUID) are both "unknown". */
    async checkout(checkoutId: string): Promise<IPolarCheckout> {
      const res = await polarGet(env, `/v1/checkouts/${encodeURIComponent(checkoutId)}`, fetchFn);
      // Unknown and unpaid checkouts must look the same to the caller (no checkout-ID probing).
      if (res.status === 404 || res.status === 422) throw new PolarError('invalid_key', 'not found');
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarCheckout;
    },
    /**
     * `GET /v1/benefit-grants/?customer_id=` (scope `benefits:read`), newest first, granted and revoked alike (no
     * `is_granted` filter, so a revoked purchase answers `revoked`, not "still syncing"). One page of 100.
     */
    async benefitGrants(customerId: string): Promise<IPolarBenefitGrant[]> {
      const qs = query({ customer_id: customerId, limit: '100', sorting: '-created_at' });
      return listItems<IPolarBenefitGrant>(await polarGet(env, `/v1/benefit-grants/?${qs}`, fetchFn));
    },
    /** `GET /v1/orders/?checkout_id=` (scope `orders:read`): the order a one-time checkout created. */
    async ordersForCheckout(checkoutId: string): Promise<IPolarOrder[]> {
      const qs = query({ checkout_id: checkoutId, limit: '10' });
      return listItems<IPolarOrder>(await polarGet(env, `/v1/orders/?${qs}`, fetchFn));
    },
    /** `GET /v1/license-keys/{id}` (scope `license_keys:read`); null when Polar has no such key yet. */
    async licenseKey(licenseKeyId: string): Promise<IPolarLicenseKey | null> {
      const res = await polarGet(env, `/v1/license-keys/${encodeURIComponent(licenseKeyId)}`, fetchFn);
      if (res.status === 404) return null;
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarLicenseKey;
    },
  };
}
