import type { TFeatureId, TPlanId } from './license';

export interface ILicenseClaims {
  sub: string;
  plan: TPlanId;
  features: TFeatureId[];
  dev: string;
  iat: number;
  exp: number;
  ver: number;
}

const enc = new TextEncoder();

const b64u = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '');

const b64uJson = (value: unknown): string => b64u(enc.encode(JSON.stringify(value)));

function b64uToBytes(value: string): Uint8Array {
  const pad = value.replace(/-/g, '+').replace(/_/g, '/');
  const str = atob(pad.padEnd(pad.length + ((4 - (pad.length % 4)) % 4), '='));
  return Uint8Array.from(str, (c) => c.charCodeAt(0));
}

export async function signES256(claims: ILicenseClaims, privateJwk: JsonWebKey): Promise<string> {
  const key = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const header = b64uJson({ alg: 'ES256', typ: 'JWT', kid: String(claims.ver), ver: claims.ver });
  const payload = b64uJson(claims);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64u(sig)}`;
}

export async function verifyES256(
  token: string,
  publicJwk: JsonWebKey,
  opts: { allowExpired?: boolean; now?: number } = {},
): Promise<ILicenseClaims | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const key = await crypto.subtle.importKey('jwk', publicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      b64uToBytes(s) as BufferSource,
      enc.encode(`${h}.${p}`),
    );
    if (!ok) return null;
    const claims = JSON.parse(new TextDecoder().decode(b64uToBytes(p))) as ILicenseClaims;
    const now = opts.now ?? Math.floor(Date.now() / 1000);
    if (!opts.allowExpired && claims.exp < now) return null;
    return claims;
  } catch {
    return null;
  }
}

export function parseSigningKey(raw: string | undefined): JsonWebKey {
  if (!raw) throw new Error('LICENSE_SIGNING_KEY missing');
  return JSON.parse(raw) as JsonWebKey;
}
