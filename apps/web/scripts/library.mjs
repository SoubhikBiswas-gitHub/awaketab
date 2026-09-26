// Copies the built IIFE of @awaketab/wake — the exact file npm publishes as dist/awaketab-wake.iife.js — to
// public/library/ so the /library demo (E12-T04) runs the real library build, same-origin (tool-route CSP allows
// only 'self' scripts). Builds the package first when its dist is missing (e.g. `pnpm -F web build` alone).
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '../..');
export const IIFE_SRC = path.join(REPO, 'packages/wake/dist/awaketab-wake.iife.js');
export const IIFE_OUT = path.join(ROOT, 'public/library/awaketab-wake.iife.js');

const exists = async (file) => Boolean(await stat(file).catch(() => null));

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (!(await exists(IIFE_SRC))) {
    execFileSync('pnpm', ['--filter', '@awaketab/wake', 'build'], { cwd: REPO, stdio: 'inherit' });
  }
  await mkdir(path.dirname(IIFE_OUT), { recursive: true });
  await copyFile(IIFE_SRC, IIFE_OUT);
  process.stdout.write(`${JSON.stringify({ libraryIife: { bytes: (await stat(IIFE_OUT)).size } })}\n`);
}
