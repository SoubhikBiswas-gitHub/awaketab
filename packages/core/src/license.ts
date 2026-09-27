import type { TFeatureGate } from './types.js';

declare const __AT_LICENSE_DEV_KEY__: boolean | undefined;

export const PRODUCTION_LICENSE_PUBLIC_KEYS: Readonly<Record<number, JsonWebKey>> = {
  // ver 2 — first production key (generated 2026-09-26; private half is the LICENSE_SIGNING_KEY Pages secret).
  2: {
    kty: 'EC',
    crv: 'P-256',
    x: 'zE_N4lGBH2RLZnOZ0dZTDz9YCcy2Nw3-a_OFRS4gCXA',
    y: 'u2GJ3Adhv4xb61aELAzSDFc74e1pyGNj6WpINLK8qc8',
  },
};

export const DEV_LICENSE_KEY_VER = 1;

export const LICENSE_PUBLIC_KEYS: Record<number, JsonWebKey> =
  typeof __AT_LICENSE_DEV_KEY__ !== 'undefined' && __AT_LICENSE_DEV_KEY__
    ? {
        ...PRODUCTION_LICENSE_PUBLIC_KEYS,
        [DEV_LICENSE_KEY_VER]: {
          kty: 'EC',
          crv: 'P-256',
          x: 'jqIeyjT-NfASTfu5XUDoOFE9o8DB6upegCSAJ7ECPIs',
          y: 'ZijZiX6xHO9FMdzAGKDIItiQr5OTTW9Yvjre15iPEGg',
        },
      }
    : { ...PRODUCTION_LICENSE_PUBLIC_KEYS };

export const TRUSTS_DEV_LICENSE_KEY: boolean = DEV_LICENSE_KEY_VER in LICENSE_PUBLIC_KEYS;

export interface ILicenseState {
  valid: boolean;
  plan: string | null;
  features: TFeatureGate[];
  exp: number | null;
  grace: boolean;
}

const TE = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', TE.encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const str = atob(pad.padEnd(pad.length + ((4 - (pad.length % 4)) % 4), '='));
  return Uint8Array.from(str, (c) => c.charCodeAt(0));
}

export async function verifyLicenseToken(
  token: string,
  opts: { deviceId: string; now?: number; lastValidatedAt?: number } = { deviceId: '' },
): Promise<ILicenseState> {
  const none: ILicenseState = { valid: false, plan: null, features: [], exp: null, grace: false };
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return none;
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h))) as { alg?: string; ver?: number };
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))) as {
      plan?: string;
      features?: TFeatureGate[];
      exp?: number;
      ver?: number;
      dev?: string;
    };
    const ver = header.ver ?? payload.ver ?? 1;
    const jwk = LICENSE_PUBLIC_KEYS[ver];
    if (!jwk) return none;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      b64urlToBytes(s) as BufferSource,
      TE.encode(`${h}.${p}`),
    );
    if (!ok) return none;
    const now = opts.now ?? Date.now();
    const expMs = (payload.exp ?? 0) * 1000;
    let grace = false;
    let valid = expMs > now;
    if (!valid && payload.plan === 'pro_yearly' && now - expMs < 7 * 86_400_000) {
      valid = true;
      grace = true;
    }
    if (opts.deviceId && payload.dev) {
      const hash = await sha256Hex(opts.deviceId);
      if (hash !== payload.dev) return none;
    }
    if (!valid) return { ...none, plan: payload.plan ?? null, exp: payload.exp ?? null };
    return {
      valid: true,
      plan: payload.plan ?? null,
      features: payload.features ?? [],
      exp: payload.exp ?? null,
      grace,
    };
  } catch {
    return none;
  }
}

export function hasFeature(state: ILicenseState, gate: TFeatureGate): boolean {
  return state.valid && state.features.includes(gate);
}

export function needsRevalidation(plan: string, lastValidatedAt: number, now = Date.now()): boolean {
  if (plan === 'pro_yearly') return now - lastValidatedAt > 86_400_000;
  if (plan === 'pro_lifetime') return now - lastValidatedAt > 90 * 86_400_000;
  if (plan.startsWith('biz_kiosk')) return now - lastValidatedAt > 30 * 86_400_000;
  return now - lastValidatedAt > 86_400_000;
}
