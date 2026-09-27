import {
  needsRevalidation,
  verifyLicenseToken,
  type ILicenseRecord,
  type ILicenseState,
  type TFeatureGate,
  type TPlanId,
} from '@awaketab/core';

export const API_ORIGIN = 'https://awaketab.com';
export const ACTIVATE_URL = `${API_ORIGIN}/pro/activate?ext=1`;
export const MANAGE_URL = `${API_ORIGIN}/pro/manage`;
export const PRO_URL = `${API_ORIGIN}/pro`;

export const NO_LICENSE: ILicenseState = { valid: false, plan: null, features: [], exp: null, grace: false };

export const LICENSE_ERROR_KEYS: Record<string, string> = {
  invalid_key: 'license.error.invalid',
  activation_limit: 'license.error.limit',
  revoked: 'license.error.revoked',
  refunded: 'license.error.revoked',
  offline: 'license.error.offline',
  polar_unavailable: 'license.info.syncing',
  rate_limited: 'license.error.offline',
  bad_token: 'license.error.token',
  bad_request: 'license.error.invalid',
};

type TFetch = (input: string, init?: RequestInit) => Promise<Response>;

export function osLabel(ua: string): string {
  if (/CrOS/u.test(ua)) return 'ChromeOS';
  if (/Windows/u.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/u.test(ua)) return 'macOS';
  if (/Linux/u.test(ua)) return 'Linux';
  return 'desktop';
}

export function deviceLabel(ua: string): string {
  return `AwakeTab for Chrome · ${osLabel(ua)}`.slice(0, 40);
}

export async function licenseState(record: ILicenseRecord | null, now = Date.now()): Promise<ILicenseState> {
  if (!record?.token) return NO_LICENSE;
  return verifyLicenseToken(record.token, { deviceId: record.deviceId, now, lastValidatedAt: record.lastValidatedAt });
}

export async function activate(
  key: string,
  device: { id: string; label: string },
  fetchFn: TFetch = fetch,
  now = Date.now(),
): Promise<{ ok: true; record: ILicenseRecord } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetchFn(`${API_ORIGIN}/api/license/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: key.trim(), deviceId: device.id, deviceLabel: device.label }),
    });
  } catch {
    return { ok: false, error: 'offline' };
  }
  let data: { error?: string; token?: string; plan?: TPlanId; features?: TFeatureGate[]; exp?: number };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, error: res.status >= 500 ? 'polar_unavailable' : 'bad_request' };
  }
  if (!res.ok || !data.token || !data.plan) return { ok: false, error: data.error ?? 'invalid_key' };
  const state = await verifyLicenseToken(data.token, { deviceId: device.id, now });
  if (!state.valid) return { ok: false, error: 'bad_token' };
  return {
    ok: true,
    record: {
      v: 1,
      token: data.token,
      plan: data.plan,
      features: state.features,
      exp: state.exp ?? data.exp ?? 0,
      lastValidatedAt: now,
      deviceId: device.id,
      deviceLabel: device.label,
    },
  };
}

export async function revalidate(
  record: ILicenseRecord,
  fetchFn: TFetch = fetch,
  now = Date.now(),
): Promise<{ status: 'fresh' | 'ok' | 'revoked' | 'offline'; record: ILicenseRecord | null }> {
  if (!needsRevalidation(record.plan, record.lastValidatedAt, now)) return { status: 'fresh', record };
  try {
    const res = await fetchFn(`${API_ORIGIN}/api/license/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: record.token }),
    });
    if (!res.ok) return { status: 'offline', record };
    const data = (await res.json()) as { revoked?: boolean };
    if (data.revoked) return { status: 'revoked', record: null };
    return { status: 'ok', record: { ...record, lastValidatedAt: now } };
  } catch {
    return { status: 'offline', record };
  }
}

export async function deactivate(record: ILicenseRecord, fetchFn: TFetch = fetch): Promise<boolean> {
  try {
    const res = await fetchFn(`${API_ORIGIN}/api/license/deactivate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: record.token, deviceId: record.deviceId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
