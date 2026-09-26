// Production launch guard (LAUNCH-AUDIT N-03, F-06; docs/09 §2.4, docs/17 §2). The dev ES256 pair's private half
// is committed in apps/web/.dev.vars.example, so anyone can sign a Pro token with it. A production build must not
// trust it, and must not ship without a real key or with placeholder checkout links.
//
//   pnpm exec tsx scripts/check-keys.mts                 source check (first step of `pnpm -F web build`)
//   pnpm exec tsx scripts/check-keys.mts --dist dist     scans a built output for the dev public key (last step)
//
// Both are no-ops unless PUBLIC_POLAR_SERVER=production (sandbox builds trust the dev key on purpose) or --force.
// Source problems: no production key in PRODUCTION_LICENSE_PUBLIC_KEYS; a listed key equal to the dev key or not a
// P-256 public JWK; a production checkout link still holding the placeholder. Dist problems: the dev key's `x` or
// `y` in any text file; a production key missing from every file (the verifier was not bundled).
// AT_ALLOW_MISSING_PRODUCTION_KEY=1 downgrades only "no production key" and "placeholder link" to warnings, for
// CI's production-mode bundle check before N-03 is done. It never allows the dev key.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUCTION_LICENSE_PUBLIC_KEYS } from '../../../packages/core/src/license.ts';
import { CHECKOUT_LINKS_PRODUCTION, CHECKOUT_PLACEHOLDER } from '../src/lib/checkout.ts';
import { polarServer } from './polar-server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEV_VARS = path.join(ROOT, '.dev.vars.example');
const TEXT = /\.(?:html|js|mjs|cjs|css|json|webmanifest|txt|xml|svg|map)$|^_headers$|^_redirects$/u;

export interface IPublicPoint {
  x: string;
  y: string;
}

export interface IProblem {
  message: string;
  /** Downgraded to a warning by AT_ALLOW_MISSING_PRODUCTION_KEY=1. */
  waivable: boolean;
}

/** The public half (x, y) of the dev private JWK in `.dev.vars.example` (`LICENSE_SIGNING_KEY`). */
export async function devPublicKey(file = DEV_VARS): Promise<IPublicPoint> {
  const line = (await readFile(file, 'utf8')).split('\n').find((row) => row.startsWith('LICENSE_SIGNING_KEY='));
  if (!line) throw new Error(`${file} has no LICENSE_SIGNING_KEY`);
  const jwk = JSON.parse(line.slice('LICENSE_SIGNING_KEY='.length)) as Partial<IPublicPoint>;
  if (typeof jwk.x !== 'string' || typeof jwk.y !== 'string') throw new Error(`${file}: LICENSE_SIGNING_KEY is not an EC JWK`);
  return { x: jwk.x, y: jwk.y };
}

export function keyProblems(keys: Readonly<Record<number, JsonWebKey>>, dev: IPublicPoint): IProblem[] {
  const problems: IProblem[] = [];
  const entries = Object.entries(keys);
  if (entries.length === 0) {
    problems.push({
      message: 'PRODUCTION_LICENSE_PUBLIC_KEYS is empty: run `pnpm keys:prod` and add the public JWK (LAUNCH-AUDIT N-03)',
      waivable: true,
    });
  }
  for (const [ver, jwk] of entries) {
    if (jwk.x === dev.x || jwk.y === dev.y) {
      problems.push({ message: `LICENSE_PUBLIC_KEYS[${ver}] is the dev key from .dev.vars.example; its private half is public`, waivable: false });
    }
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.x || !jwk.y) {
      problems.push({ message: `LICENSE_PUBLIC_KEYS[${ver}] is not a P-256 public JWK`, waivable: false });
    }
    if ('d' in jwk) problems.push({ message: `LICENSE_PUBLIC_KEYS[${ver}] contains a private key (d)`, waivable: false });
  }
  return problems;
}

export function checkoutProblems(links: Readonly<Record<string, string>>): IProblem[] {
  return Object.entries(links).flatMap(([plan, url]): IProblem[] => {
    if (url.includes(CHECKOUT_PLACEHOLDER)) {
      return [{ message: `CHECKOUT_LINKS_PRODUCTION.${plan} is still a placeholder (LAUNCH-AUDIT N-04 step 4)`, waivable: true }];
    }
    if (!url.startsWith('https://') || url.includes('sandbox')) {
      return [{ message: `CHECKOUT_LINKS_PRODUCTION.${plan} is not a production https link: ${url}`, waivable: false }];
    }
    return [];
  });
}

async function textFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await textFiles(full)));
    else if (TEXT.test(entry.name)) out.push(full);
  }
  return out;
}

/** Scans a built output: the dev key must be absent, and each production key present somewhere. */
export async function distProblems(dir: string, dev: IPublicPoint, keys: Readonly<Record<number, JsonWebKey>>): Promise<IProblem[]> {
  const problems: IProblem[] = [];
  const unseen = new Map(Object.entries(keys).map(([ver, jwk]) => [ver, jwk.x ?? '']));
  for (const file of await textFiles(dir)) {
    const text = await readFile(file, 'utf8');
    if (text.includes(dev.x) || text.includes(dev.y)) {
      problems.push({ message: `${path.relative(process.cwd(), file)} contains the dev licence public key`, waivable: false });
    }
    for (const [ver, x] of unseen) if (x && text.includes(x)) unseen.delete(ver);
  }
  for (const ver of unseen.keys()) {
    problems.push({ message: `${dir}: LICENSE_PUBLIC_KEYS[${ver}] is in no built file (licence verifier not bundled?)`, waivable: false });
  }
  return problems;
}

export async function runCheck(args: string[], env: Record<string, string | undefined> = process.env): Promise<{ ok: boolean; lines: string[] }> {
  const force = args.includes('--force');
  if (polarServer(env) !== 'production' && !force) {
    return { ok: true, lines: ['check-keys: PUBLIC_POLAR_SERVER is not production; the dev licence key stays trusted (skipped)'] };
  }
  const dev = await devPublicKey();
  const dists = args.flatMap((arg, i) => (arg === '--dist' && args[i + 1] ? [path.resolve(args[i + 1] ?? '')] : []));
  const problems =
    dists.length > 0
      ? (await Promise.all(dists.map((dir) => distProblems(dir, dev, PRODUCTION_LICENSE_PUBLIC_KEYS)))).flat()
      : [...keyProblems(PRODUCTION_LICENSE_PUBLIC_KEYS, dev), ...checkoutProblems(CHECKOUT_LINKS_PRODUCTION)];
  const waive = env.AT_ALLOW_MISSING_PRODUCTION_KEY === '1';
  const errors = problems.filter((p) => !(waive && p.waivable));
  const warnings = problems.filter((p) => waive && p.waivable);
  const lines = [
    ...errors.map((p) => `check-keys: ERROR ${p.message}`),
    ...warnings.map((p) => `check-keys: WARNING (AT_ALLOW_MISSING_PRODUCTION_KEY=1) ${p.message}`),
  ];
  if (errors.length === 0) lines.push(`check-keys: ok (${dists.length > 0 ? dists.join(', ') : 'source'})`);
  return { ok: errors.length === 0, lines };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { ok, lines } = await runCheck(process.argv.slice(2));
  for (const line of lines) (ok ? process.stdout : process.stderr).write(`${line}\n`);
  if (!ok) process.exitCode = 1;
}
