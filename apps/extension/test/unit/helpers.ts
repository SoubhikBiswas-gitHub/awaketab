import { LICENSE_PUBLIC_KEYS, sha256Hex, type ILicenseRecord, type TFeatureGate } from '@awaketab/core';
import { createController, type IController } from '../../src/controller';
import { flush, type IFakeChrome } from './fake-chrome';
import en from '../../../web/src/i18n/en.json';

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/u, '');
const enc = (obj: unknown) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

let pair: CryptoKeyPair | null = null;

export async function testKeys(): Promise<CryptoKeyPair> {
  if (!pair) {
    pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    LICENSE_PUBLIC_KEYS[1] = await crypto.subtle.exportKey('jwk', pair.publicKey);
  }
  return pair;
}

export async function signToken(claims: {
  plan: string;
  features: TFeatureGate[];
  exp: number;
  deviceId: string;
}): Promise<string> {
  const keys = await testKeys();
  const h = enc({ alg: 'ES256', typ: 'JWT', ver: 1 });
  const p = enc({
    sub: 'k',
    plan: claims.plan,
    features: claims.features,
    dev: await sha256Hex(claims.deviceId),
    iat: 1,
    exp: claims.exp,
    ver: 1,
  });
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      keys.privateKey,
      new TextEncoder().encode(`${h}.${p}`),
    ),
  );
  return `${h}.${p}.${b64url(sig)}`;
}

export async function proRecord(
  features: TFeatureGate[] = ['ext.schedules', 'ext.autostart'],
  now = Date.now(),
  deviceId = '11111111-1111-4111-8111-111111111111',
): Promise<ILicenseRecord> {
  const exp = Math.floor(now / 1000) + 30 * 86_400;
  return {
    v: 1,
    token: await signToken({ plan: 'pro_yearly', features, exp, deviceId }),
    plan: 'pro_yearly',
    features,
    exp,
    lastValidatedAt: now,
    deviceId,
    deviceLabel: 'AwakeTab for Chrome · macOS',
  };
}

export function wired(
  fake: IFakeChrome,
  opts: { now?: () => number; fetchFn?: (input: string, init?: RequestInit) => Promise<Response> } = {},
): IController {
  const ctl = createController({
    api: fake.api,
    catalogs: { en },
    fetchFn: opts.fetchFn ?? (() => Promise.reject(new Error('network disabled in tests'))),
    coalesceMs: 5,
    ...(opts.now ? { now: opts.now } : {}),
  });
  fake.events.storage.addListener((changes, area) => {
    void ctl.onStorageChanged(changes, area);
  });
  fake.events.button.addListener((id, index) => {
    void ctl.onNotificationButton(id, index);
  });
  return ctl;
}

export { flush };
