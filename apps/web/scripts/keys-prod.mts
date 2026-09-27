// `pnpm keys:prod` — a fresh production ES256 licence signing pair (LAUNCH-AUDIT N-03, docs/09 §2.4, docs/14 §10).
// Prints to the terminal only; nothing is written to disk. Paste the public JWK into
// PRODUCTION_LICENSE_PUBLIC_KEYS in packages/core/src/license.ts, and store the private JWK as the Cloudflare Pages
// secret LICENSE_SIGNING_KEY (Production) with LICENSE_SIGNING_VER set to the printed ver. Keep a copy of the private
// JWK in your password manager, never in the repository.
import { generateKeyPairSync } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEV_LICENSE_KEY_VER, PRODUCTION_LICENSE_PUBLIC_KEYS } from '../../../packages/core/src/license.ts';

export interface IProdKeyPair {
  ver: number;
  publicJwk: { kty: 'EC'; crv: 'P-256'; x: string; y: string };
  privateJwk: Record<string, string>;
}

export function nextVer(existing: readonly number[] = Object.keys(PRODUCTION_LICENSE_PUBLIC_KEYS).map(Number)): number {
  return Math.max(DEV_LICENSE_KEY_VER, ...existing) + 1;
}

export function generateProdKeyPair(ver = nextVer()): IProdKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pub = publicKey.export({ format: 'jwk' });
  const priv = privateKey.export({ format: 'jwk' });
  if (typeof pub.x !== 'string' || typeof pub.y !== 'string') throw new Error('unexpected JWK export');
  return {
    ver,
    publicJwk: { kty: 'EC', crv: 'P-256', x: pub.x, y: pub.y },
    privateJwk: Object.fromEntries(
      Object.entries(priv).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ),
  };
}

export function instructions(pair: IProdKeyPair): string {
  const { ver, publicJwk: k } = pair;
  return [
    `# AwakeTab production licence key, ver ${String(ver)} (LAUNCH-AUDIT N-03). Nothing was written to disk.`,
    '',
    `## 1. Public key: add to PRODUCTION_LICENSE_PUBLIC_KEYS in packages/core/src/license.ts (commit this)`,
    `  ${String(ver)}: { kty: 'EC', crv: 'P-256', x: '${k.x}', y: '${k.y}' },`,
    '',
    '## 2. Private key: Cloudflare Pages secret LICENSE_SIGNING_KEY (Production only). Never commit it.',
    `##    printf '%s' '<the line below>' | pnpm dlx wrangler pages secret put LICENSE_SIGNING_KEY --project-name awaketab`,
    JSON.stringify(pair.privateJwk),
    '',
    `## 3. Cloudflare Pages secret LICENSE_SIGNING_VER (Production) = ${String(ver)}`,
    '',
    '## 4. Store the private line in your password manager, then clear this terminal (e.g. `clear && printf "\\033[3J"`).',
    '##    Ship the app with the new public key before switching the secrets (docs/14 §10).',
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${instructions(generateProdKeyPair())}\n`);
}
