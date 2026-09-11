import type { IEnv } from './env';
import type { TPlanId } from './license';

export interface IPolarLicense {
  status: 'granted' | 'revoked' | string;
  benefit_id: string;
  limit_activations: number;
  expires_at: string | null;
  customer_id: string;
  id?: string;
}

export interface IPolarActivation {
  id: string;
  license_key: IPolarLicense;
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

function apiBase(env: IEnv): string {
  return (env.POLAR_API_BASE ?? 'https://sandbox-api.polar.sh').replace(/\/$/u, '');
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
      if (!res.ok && res.status !== 204) throw new PolarError('polar_unavailable', `status ${res.status}`);
    },
    async checkout(checkoutId: string): Promise<{ status: string; license_key?: string }> {
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
      if (!res.ok) throw new PolarError('polar_unavailable', `status ${res.status}`);
      return (await res.json()) as { status: string; license_key?: string };
    },
  };
}
