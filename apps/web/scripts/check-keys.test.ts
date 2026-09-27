// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { build } from 'esbuild';
import { afterEach, describe, expect, it } from 'vitest';

import { DEV_LICENSE_KEY_VER, LICENSE_PUBLIC_KEYS, PRODUCTION_LICENSE_PUBLIC_KEYS, TRUSTS_DEV_LICENSE_KEY } from '@awaketab/core';

import { checkoutProblems, devPublicKey, distProblems, keyProblems, runCheck } from './check-keys.mts';
import { generateProdKeyPair, instructions, nextVer } from './keys-prod.mts';
import { polarDefines, polarServer } from './polar-server.mjs';

const REPO = path.resolve(import.meta.dirname, '../../..');
const temps: string[] = [];

afterEach(async () => {
  await Promise.all(temps.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'awaketab-keys-'));
  temps.push(dir);
  return dir;
}

async function bundleLicense(devKey: boolean): Promise<string> {
  const result = await build({
    entryPoints: [path.join(REPO, 'apps/web/src/lib/license.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    platform: 'browser',
    alias: {
      '@awaketab/core': path.join(REPO, 'packages/core/src/index.ts'),
      '@awaketab/wake': path.join(REPO, 'packages/wake/src/index.ts'),
    },
    define: polarDefines({ PUBLIC_POLAR_SERVER: devKey ? 'sandbox' : 'production' }),
  });
  return result.outputFiles[0]?.text ?? '';
}

describe('PUBLIC_POLAR_SERVER at build time (scripts/polar-server.mjs)', () => {
  it('defaults to sandbox and refuses anything but sandbox or production', () => {
    expect(polarServer({})).toBe('sandbox');
    expect(polarServer({ PUBLIC_POLAR_SERVER: '' })).toBe('sandbox');
    expect(polarServer({ PUBLIC_POLAR_SERVER: 'production' })).toBe('production');
    expect(() => polarServer({ PUBLIC_POLAR_SERVER: 'prod' })).toThrow(/sandbox" or "production/u);
    expect(polarDefines({ PUBLIC_POLAR_SERVER: 'production' })).toEqual({ __AT_POLAR_SERVER__: '"production"', __AT_LICENSE_DEV_KEY__: 'false' });
    expect(polarDefines({})).toEqual({ __AT_POLAR_SERVER__: '"sandbox"', __AT_LICENSE_DEV_KEY__: 'true' });
  });
});

describe('dev licence key never ships in production (LAUNCH-AUDIT N-03)', () => {
  it('the committed dev private key matches the dev public key tests and sandbox builds trust', async () => {
    const dev = await devPublicKey();
    expect(TRUSTS_DEV_LICENSE_KEY).toBe(true);
    expect(LICENSE_PUBLIC_KEYS[DEV_LICENSE_KEY_VER]).toMatchObject(dev);
    // Not one of the production keys.
    expect(keyProblems(PRODUCTION_LICENSE_PUBLIC_KEYS, dev).some((p) => /dev key/u.test(p.message))).toBe(false);
  });

  it('a production-mode bundle drops the dev key; a sandbox bundle keeps it', async () => {
    const dev = await devPublicKey();
    const production = await bundleLicense(false);
    const sandbox = await bundleLicense(true);
    expect(production).toContain('verify');
    expect(production).not.toContain(dev.x);
    expect(production).not.toContain(dev.y);
    expect(sandbox).toContain(dev.x);
    expect(sandbox).toContain(dev.y);
  });

  it('keyProblems: fails on no key, on the dev key, on a private or non-P-256 JWK; passes a fresh production key', async () => {
    const dev = await devPublicKey();
    const fresh = generateProdKeyPair(2).publicJwk;
    expect(keyProblems({}, dev)).toEqual([expect.objectContaining({ waivable: true })]);
    const withDev = keyProblems({ 1: { kty: 'EC', crv: 'P-256', ...dev }, 2: fresh }, dev);
    expect(withDev).toEqual([expect.objectContaining({ waivable: false, message: expect.stringMatching(/\[1\] is the dev key/u) as unknown })]);
    expect(keyProblems({ 2: { ...fresh, d: 'secret' } }, dev).map((p) => p.message)).toEqual([expect.stringMatching(/private key/u)]);
    expect(keyProblems({ 2: { ...fresh, crv: 'P-384' } }, dev)).toHaveLength(1);
    expect(keyProblems({ 2: fresh }, dev)).toEqual([]);
  });

  it('checkoutProblems: placeholders are waivable, sandbox or non-https links never are', () => {
    expect(checkoutProblems({ pro_yearly: 'https://buy.polar.sh/PROPOSED-REPLACE-pro-yearly' })).toEqual([
      expect.objectContaining({ waivable: true }),
    ]);
    expect(checkoutProblems({ pro_yearly: 'https://sandbox.polar.sh/checkout/x' })).toEqual([expect.objectContaining({ waivable: false })]);
    expect(checkoutProblems({ pro_yearly: 'http://buy.polar.sh/polar_cl_x' })).toEqual([expect.objectContaining({ waivable: false })]);
    expect(checkoutProblems({ pro_yearly: 'https://buy.polar.sh/polar_cl_abc' })).toEqual([]);
  });

  it('distProblems: finds the dev key in any text file and a production key missing from every file', async () => {
    const dev = await devPublicKey();
    const fresh = generateProdKeyPair(2).publicJwk;
    const dir = await tempDir();
    await mkdir(path.join(dir, '_astro'));
    await writeFile(path.join(dir, '_astro/license.js'), `const k={kty:"EC",x:"${fresh.x}",y:"${fresh.y}"}`);
    expect(await distProblems(dir, dev, { 2: fresh })).toEqual([]);
    expect(await distProblems(dir, dev, { 2: fresh, 3: { ...fresh, x: 'missing-x' } })).toEqual([
      expect.objectContaining({ message: expect.stringMatching(/\[3\] is in no built file/u) as unknown }),
    ]);
    await writeFile(path.join(dir, 'chunk.js'), `x:"${dev.y}"`);
    expect((await distProblems(dir, dev, { 2: fresh })).map((p) => p.message)).toEqual([expect.stringMatching(/chunk\.js contains the dev licence public key/u)]);
  });

  it('runCheck: skipped outside production; fails production today; the waiver never excuses the dev key', async () => {
    expect((await runCheck([], {})).ok).toBe(true);
    const prod = await runCheck([], { PUBLIC_POLAR_SERVER: 'production' });
    expect(prod.ok).toBe(PRODUCTION_LICENSE_PUBLIC_KEYS[2] !== undefined && !prod.lines.some((l) => l.includes('placeholder')));
    expect((await runCheck([], { PUBLIC_POLAR_SERVER: 'production', AT_ALLOW_MISSING_PRODUCTION_KEY: '1' })).ok).toBe(true);
    const dev = await devPublicKey();
    const dir = await tempDir();
    await writeFile(path.join(dir, 'app.js'), `"${dev.x}"`);
    const leaked = await runCheck(['--dist', dir], { PUBLIC_POLAR_SERVER: 'production', AT_ALLOW_MISSING_PRODUCTION_KEY: '1' });
    expect(leaked.ok).toBe(false);
    expect(leaked.lines.join('\n')).toMatch(/ERROR .*app\.js contains the dev licence public key/u);
  });
});

describe('pnpm keys:prod (scripts/keys-prod.mts)', () => {
  it('prints a fresh P-256 pair with the next ver above the dev key, and writes nothing', () => {
    expect(nextVer([])).toBe(DEV_LICENSE_KEY_VER + 1);
    expect(nextVer([2, 5])).toBe(6);
    const a = generateProdKeyPair();
    const b = generateProdKeyPair();
    expect(a.publicJwk.x).not.toBe(b.publicJwk.x);
    expect(a.publicJwk).toEqual({ kty: 'EC', crv: 'P-256', x: expect.any(String) as unknown, y: expect.any(String) as unknown });
    expect(a.privateJwk.d).toBeTruthy();
    expect(a.privateJwk.x).toBe(a.publicJwk.x);
    const text = instructions(a);
    expect(text).toContain(`${String(a.ver)}: { kty: 'EC', crv: 'P-256', x: '${a.publicJwk.x}', y: '${a.publicJwk.y}' },`);
    expect(text).toContain(JSON.stringify(a.privateJwk));
    expect(text).toContain('LICENSE_SIGNING_KEY');
    expect(text).toContain(`LICENSE_SIGNING_VER (Production) = ${String(a.ver)}`);
  });
});
