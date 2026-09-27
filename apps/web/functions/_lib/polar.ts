import type { IEnv } from './env';
import type { TPlanId } from './license';

export interface IPolarLicense {
  status: 'granted' | 'revoked' | string;
  benefit_id: string;
  limit_activations: number | null;
  expires_at: string | null;
  customer_id: string;
  id?: string;
}

export interface IPolarActivation {
  id: string;
  license_key_id?: string;
  license_key: IPolarLicense;
}

export interface IPolarCheckout {
  id: string;
  status: string;
  customer_id: string | null;
  subscription_id: string | null;
}

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

export interface IPolarOrder {
  id: string;
  checkout_id: string | null;
  customer_id: string;
  subscription_id: string | null;
}

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

export const POLAR_API_BASES = {
  sandbox: 'https://sandbox-api.polar.sh',
  production: 'https://api.polar.sh',
} as const;

export type TPolarServer = keyof typeof POLAR_API_BASES;

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
      const res = await polarPost(
        env,
        '/v1/customer-portal/license-keys/validate',
        { key, organization_id: org },
        fetchFn,
      );
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
      if (!res.ok && res.status !== 204 && res.status !== 404)
        throw new PolarError('polar_unavailable', `status ${res.status}`);
    },
    async checkout(checkoutId: string): Promise<IPolarCheckout> {
      const res = await polarGet(env, `/v1/checkouts/${encodeURIComponent(checkoutId)}`, fetchFn);
      // Unknown and unpaid checkouts must look the same to the caller (no checkout-ID probing).
      if (res.status === 404 || res.status === 422) throw new PolarError('invalid_key', 'not found');
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarCheckout;
    },
    async benefitGrants(customerId: string): Promise<IPolarBenefitGrant[]> {
      const qs = query({ customer_id: customerId, limit: '100', sorting: '-created_at' });
      return listItems<IPolarBenefitGrant>(await polarGet(env, `/v1/benefit-grants/?${qs}`, fetchFn));
    },
    async ordersForCheckout(checkoutId: string): Promise<IPolarOrder[]> {
      const qs = query({ checkout_id: checkoutId, limit: '10' });
      return listItems<IPolarOrder>(await polarGet(env, `/v1/orders/?${qs}`, fetchFn));
    },
    async licenseKey(licenseKeyId: string): Promise<IPolarLicenseKey | null> {
      const res = await polarGet(env, `/v1/license-keys/${encodeURIComponent(licenseKeyId)}`, fetchFn);
      if (res.status === 404) return null;
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as IPolarLicenseKey;
    },
  };
}
