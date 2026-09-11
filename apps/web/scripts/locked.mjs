// Run a command while holding a directory lock so concurrent `astro build` runs
// (parallel agents, CI matrix on one box) never race on `.astro/` or `public/`.
// Usage: node scripts/locked.mjs -- <command> [args...]
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const LOCK = fileURLToPath(new URL('../.build-lock', import.meta.url));
const args = process.argv.slice(process.argv.indexOf('--') + 1);
if (args.length === 0) {
  process.stderr.write('usage: node scripts/locked.mjs -- <command> [args...]\n');
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
for (let waited = 0; ; waited += 500) {
  try {
    await mkdir(LOCK);
    break;
  } catch {
    if (waited > 15 * 60_000) {
      process.stderr.write(`gave up waiting for ${LOCK}\n`);
      process.exit(3);
    }
    await sleep(500);
  }
}

const release = () => rm(LOCK, { recursive: true, force: true });
process.on('SIGINT', () => void release().then(() => process.exit(130)));
process.on('SIGTERM', () => void release().then(() => process.exit(143)));

const child = spawn(args[0], args.slice(1), { stdio: 'inherit', shell: false, env: process.env });
child.on('exit', (code) => {
  void release().then(() => process.exit(code ?? 1));
});
