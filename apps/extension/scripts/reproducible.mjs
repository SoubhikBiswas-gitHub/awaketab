// Builds the extension twice from the same sources into two fresh output folders, zips each and compares
// the SHA-256 of the zips. Exit 1 when they differ. Used by `pnpm -F extension zip:check` and
// test/build/reproducible.test.ts.
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256, zipDirectory } from './zip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// pnpm links the workspace's own `wxt` here; its package exports hide package.json from require.resolve.
const WXT_CLI = path.join(ROOT, 'node_modules/wxt/bin/wxt.mjs');

function run(args, env = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
}

/** One clean production build into `outDir`; returns the zip bytes. */
export async function buildZip(outDir) {
  run([path.join(ROOT, 'scripts/icons.mjs')]);
  run([WXT_CLI, 'build'], { AT_EXT_OUT: outDir, AT_EXT_TEST: '0' });
  return zipDirectory(path.join(outDir, 'chrome-mv3'));
}

export async function checkReproducible() {
  const a = await mkdtemp(path.join(tmpdir(), 'awaketab-ext-a-'));
  const b = await mkdtemp(path.join(tmpdir(), 'awaketab-ext-b-'));
  try {
    const first = await buildZip(a);
    const second = await buildZip(b);
    return { same: first.equals(second), first: sha256(first), second: sha256(second), bytes: first.length };
  } finally {
    await rm(a, { recursive: true, force: true });
    await rm(b, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await checkReproducible();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.same) process.exitCode = 1;
}
