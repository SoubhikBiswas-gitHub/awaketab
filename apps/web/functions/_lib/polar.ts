import type { IEnv } from './env';
import type { TPlanId } from './license';

/** Polar `LicenseKeyRead` / `ValidatedLicenseKey` (the fields we read). `id` is the licence-key id (D-06). */
export interface IPolarLicense {
  status: 'granted' | 'revoked' | string;
  benefit_id: string;
  limit_activations: number;
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
 * Polar `Checkout` (the fields we read). Polar's schema (OpenAPI 2026-04 / 2026-10) has `customer_id` and
 * `subscription_id` but no licence key; `license_key` is what the activate route reads today (LAUNCH-AUDIT F-08).
 */
export interface IPolarCheckout {
  status: string;
  license_key?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
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

export function createPolar(env: IEnv, fetchFn: typeof fetch = fetch) {
  const org = env.POLAR_ORGANIZATION_ID;
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
    async checkout(checkoutId: string): Promise<IPolarCheckout> {
      const token = env.POLAR_ACCESS_TOKEN;
      if (!token) throw new PolarError('polar_unavailable', 'missing token');
      let res: Response;
      try {
        res = await fetchFn(`${apiBase(env)}/v1/checkouts/${encodeURIComponent(checkoutId)}`, {
          headers: { authorization: `Bearer ${token}` },
        });
      } catch {
        throw new PolarError('polar_unavailable', 'network');
      }
      // Unknown and unpaid checkouts must look the same to the caller (no checkout-ID probing).
      if (res.status === 404) throw new PolarError('invalid_key', 'not found');
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarCheckout;
    },
  };
}
