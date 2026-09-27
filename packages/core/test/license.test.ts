import { describe, expect, it } from 'vitest';
import { hasFeature, LICENSE_PUBLIC_KEYS, verifyLicenseToken } from '../src/license.js';

async function token(payload: Record<string, unknown>, key: CryptoKey, ver = 1) {
  const enc = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const h = enc({ alg: 'ES256', typ: 'JWT', ver });
  const p = enc(payload);
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${h}.${p}`)),
  );
  const s = btoa(String.fromCharCode(...sig))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${h}.${p}.${s}`;
}

describe('license', () => {
  it('accepts a valid ES256 token and rejects tamper / unknown ver / expiry', async () => {
    const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    LICENSE_PUBLIC_KEYS[1] = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const t = await token({ plan: 'pro_yearly', features: ['ads.free'], exp, ver: 1 }, pair.privateKey);
    const ok = await verifyLicenseToken(t, { deviceId: '' });
    expect(ok.valid).toBe(true);
    expect(hasFeature(ok, 'ads.free')).toBe(true);

    const [h, p, s] = t.split('.') as [string, string, string];
    const bad = await verifyLicenseToken(`${h}.${p}x.${s}`, { deviceId: '' });
    expect(bad.valid).toBe(false);

    const unknown = await verifyLicenseToken(
      await token({ plan: 'pro_yearly', features: [], exp, ver: 9 }, pair.privateKey, 9),
      { deviceId: '' },
    );
    expect(unknown.valid).toBe(false);

    const expired = await verifyLicenseToken(
      await token(
        { plan: 'pro_lifetime', features: [], exp: Math.floor(Date.now() / 1000) - 10, ver: 1 },
        pair.privateKey,
      ),
      { deviceId: '' },
    );
    expect(expired.valid).toBe(false);

    const grace = await verifyLicenseToken(
      await token(
        { plan: 'pro_yearly', features: ['stats.export'], exp: Math.floor(Date.now() / 1000) - 3 * 86_400, ver: 1 },
        pair.privateKey,
      ),
      { deviceId: '' },
    );
    expect(grace.valid).toBe(true);
    expect(grace.grace).toBe(true);
  });
});
