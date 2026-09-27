import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default function globalSetup(): void {
  if (process.env.AT_EXT_SKIP_BUILD === '1') return;
  for (const args of [['scripts/icons.mjs'], ['node_modules/wxt/bin/wxt.mjs', 'build']]) {
    const result = spawnSync(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, AT_EXT_TEST: '1' },
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(`extension test build failed:\n${result.stdout}\n${result.stderr}`);
  }
}
