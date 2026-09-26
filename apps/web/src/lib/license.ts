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

// CHECKOUT_LINKS live in ./checkout.ts (F-06: picked by PUBLIC_POLAR_SERVER; imported by .astro pages only).

export const PLAN_FEATURES: Record<TPlanId, TFeatureGate[]> = {
  pro_yearly: [
    'ambient.packs',
    'ambient.message',
    'ambient.logo',
    'schedules',
    'sounds.custom',
    'stats.history',
    'stats.export',
    'pip.pro',
    'ext.autostart',
    'ext.schedules',
    'ads.free',
  ],
  pro_lifetime: [
    'ambient.packs',
    'ambient.message',
    'ambient.logo',
    'schedules',
    'sounds.custom',
    'stats.history',
    'stats.export',
    'pip.pro',
    'ext.autostart',
    'ext.schedules',
    'ads.free',
  ],
  biz_embed_site_yearly: ['embed.noattrib', 'ads.free'],
  biz_kiosk_site: ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
  biz_kiosk_5: ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
};

export const DONATE_URL = 'https://buymeacoffee.com/awaketab';

const LICENSE_KEY = 'at.v1.license';

export function deviceId(): string {
  const raw = localStorage.getItem(LICENSE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { deviceId?: string };
      if (parsed.deviceId) return parsed.deviceId;
    } catch {
      // fall through
    }
  }
  const id = crypto.randomUUID();
  return id;
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
}): Promise<{ ok: true; token: string; plan: TPlanId; features: TFeatureGate[]; exp: number } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { error?: string; token?: string; plan?: TPlanId; features?: TFeatureGate[]; exp?: number };
    if (!res.ok || !data.token || !data.plan || !data.features || !data.exp) {
      return { ok: false, error: data.error ?? 'invalid_key' };
    }
    localStorage.setItem(
      LICENSE_KEY,
      JSON.stringify({
        v: 1,
        token: data.token,
        plan: data.plan,
        features: data.features,
        exp: data.exp,
        lastValidatedAt: Date.now(),
        deviceId: input.deviceId,
        deviceLabel: input.deviceLabel,
      }),
    );
    return { ok: true, token: data.token, plan: data.plan, features: data.features, exp: data.exp };
  } catch {
    return { ok: false, error: 'offline' };
  }
}

export async function fetchActivations(token: string): Promise<{
  revoked: boolean;
  activations: Array<{ label: string; at: number; devHash: string }>;
}> {
  const res = await fetch('/api/license/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return (await res.json()) as {
    revoked: boolean;
    activations: Array<{ label: string; at: number; devHash: string }>;
  };
}

export async function deactivateDevice(
  token: string,
  deviceId: string,
): Promise<{ ok: boolean; activations?: Array<{ label: string; at: number; devHash: string }> }> {
  const res = await fetch('/api/license/deactivate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, deviceId }),
  });
  return (await res.json()) as {
    ok: boolean;
    activations?: Array<{ label: string; at: number; devHash: string }>;
  };
}

/**
 * Re-validates the stored licence (docs/09 §5): on load when the plan's interval has passed or the token no
 * longer verifies offline. A fresh token from /api/license/validate replaces the stored one only after it
 * verifies offline for this device. Network failures and 5xx never downgrade (offline grace until `exp`).
 * - 'revoked': refunded/cancelled/revoked on the server → licence removed.
 * - 'reactivate': the server rejects this token (401) or removed this device → licence removed, user re-activates.
 */
export async function revalidateStoredLicense(): Promise<'ok' | 'revoked' | 'reactivate' | 'skip'> {
  const raw = localStorage.getItem(LICENSE_KEY);
  if (!raw) return 'skip';
  let record: { token: string; plan: string; lastValidatedAt: number; deviceId: string; features: TFeatureGate[]; exp: number };
  try {
    record = JSON.parse(raw) as typeof record;
  } catch {
    return 'skip';
  }
  const state = await verifyLicenseToken(record.token, { deviceId: record.deviceId, lastValidatedAt: record.lastValidatedAt });
  if (!needsRevalidation(record.plan, record.lastValidatedAt) && state.valid) return 'ok';
  let res: Response;
  let data: { revoked?: boolean; reason?: string; token?: string };
  try {
    res = await fetch('/api/license/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: record.token }),
    });
    data = (await res.json()) as typeof data;
  } catch {
    return 'skip';
  }
  if (res.status === 401) {
    localStorage.removeItem(LICENSE_KEY);
    return 'reactivate';
  }
  if (data.revoked) {
    localStorage.removeItem(LICENSE_KEY);
    return data.reason === 'deactivated' ? 'reactivate' : 'revoked';
  }
  if (!res.ok) return 'skip';
  if (typeof data.token === 'string') {
    const fresh = await verifyLicenseToken(data.token, { deviceId: record.deviceId, lastValidatedAt: Date.now() });
    if (fresh.valid && fresh.exp !== null) {
      record.token = data.token;
      record.features = fresh.features;
      record.exp = fresh.exp;
      if (fresh.plan) record.plan = fresh.plan;
    }
  }
  record.lastValidatedAt = Date.now();
  localStorage.setItem(LICENSE_KEY, JSON.stringify(record));
  return 'ok';
}
