import type { TFeatureGate, TPlanId } from '@awaketab/core';
import { needsRevalidation, verifyLicenseToken } from '@awaketab/core';

export const PLAN_PRICES = {
  pro_yearly: 12,
  pro_lifetime: 29,
  pro_lifetime_launch: 19,
  biz_embed_site_yearly: 29,
  biz_kiosk_site: 19,
  biz_kiosk_5: 49,
} as const;

export const PRO_LAUNCH_END = Date.parse('2026-12-08T00:00:00.000Z');

// CHECKOUT_LINKS live in ./checkout.ts (picked by PUBLIC_POLAR_SERVER; imported by .astro pages only).

const LICENSE_KEY = 'at.v1.license';

type TActivation = { label: string; at: number; devHash: string };

const post = (path: string, body: unknown): Promise<Response> =>
  fetch(`/api/license/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export function deviceId(): string {
  try {
    const id = (JSON.parse(localStorage.getItem(LICENSE_KEY) ?? '{}') as { deviceId?: string } | null)?.deviceId;
    if (id) return id;
  } catch {
    // fall through
  }
  return crypto.randomUUID();
}

export function lifetimePrice(now = Date.now()): { current: number; strike: number | null } {
  if (now < PRO_LAUNCH_END) return { current: PLAN_PRICES.pro_lifetime_launch, strike: PLAN_PRICES.pro_lifetime };
  return { current: PLAN_PRICES.pro_lifetime, strike: null };
}

export async function activateLicense(input: {
  key?: string;
  checkoutId?: string;
  deviceId: string;
  deviceLabel: string;
}): Promise<
  { ok: true; token: string; plan: TPlanId; features: TFeatureGate[]; exp: number } | { ok: false; error: string }
> {
  try {
    const res = await post('activate', input);
    const { error, token, plan, features, exp } = (await res.json()) as {
      error?: string;
      token?: string;
      plan?: TPlanId;
      features?: TFeatureGate[];
      exp?: number;
    };
    if (!res.ok || !token || !plan || !features || !exp) return { ok: false, error: error ?? 'invalid_key' };
    const { deviceId: id, deviceLabel } = input;
    localStorage.setItem(
      LICENSE_KEY,
      JSON.stringify({ v: 1, token, plan, features, exp, lastValidatedAt: Date.now(), deviceId: id, deviceLabel }),
    );
    return { ok: true, token, plan, features, exp };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

export async function fetchActivations(token: string): Promise<{ revoked: boolean; activations: TActivation[] }> {
  return (await (await post('validate', { token })).json()) as { revoked: boolean; activations: TActivation[] };
}

export async function deactivateDevice(
  token: string,
  deviceId: string,
): Promise<{ ok: boolean; activations?: TActivation[] }> {
  return (await (await post('deactivate', { token, deviceId })).json()) as {
    ok: boolean;
    activations?: TActivation[];
  };
}

export async function revalidateStoredLicense(): Promise<'ok' | 'revoked' | 'reactivate' | 'skip'> {
  const raw = localStorage.getItem(LICENSE_KEY);
  if (!raw) return 'skip';
  let record: {
    token: string;
    plan: string;
    lastValidatedAt: number;
    deviceId: string;
    features: TFeatureGate[];
    exp: number;
  };
  try {
    record = JSON.parse(raw) as typeof record;
  } catch {
    return 'skip';
  }
  const { token, deviceId: id } = record;
  const state = await verifyLicenseToken(token, { deviceId: id, lastValidatedAt: record.lastValidatedAt });
  if (!needsRevalidation(record.plan, record.lastValidatedAt) && state.valid) return 'ok';
  let res: Response;
  let data: { revoked?: boolean; reason?: string; token?: string };
  try {
    res = await post('validate', { token });
    data = (await res.json()) as typeof data;
  } catch {
    return 'skip';
  }
  if (res.status === 401 || data.revoked) {
    localStorage.removeItem(LICENSE_KEY);
    return res.status === 401 || data.reason === 'deactivated' ? 'reactivate' : 'revoked';
  }
  if (!res.ok) return 'skip';
  if (typeof data.token === 'string') {
    const fresh = await verifyLicenseToken(data.token, { deviceId: id, lastValidatedAt: Date.now() });
    if (fresh.valid && fresh.exp !== null)
      Object.assign(record, {
        token: data.token,
        features: fresh.features,
        exp: fresh.exp,
        plan: fresh.plan || record.plan,
      });
  }
  record.lastValidatedAt = Date.now();
  localStorage.setItem(LICENSE_KEY, JSON.stringify(record));
  return 'ok';
}
