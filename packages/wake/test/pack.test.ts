// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

// E12-T03 / docs/13 M8: what `npm publish` would upload for @awaketab/wake, checked with `npm pack --dry-run`.
const PKG = path.resolve('packages/wake');
const REPO = path.resolve('.');

interface IPackEntry {
  path: string;
  size: number;
}

let files: string[] = [];
let manifest: {
  name: string;
  version: string;
  exports: Record<string, unknown>;
  publishConfig?: { access?: string; provenance?: boolean };
  files: string[];
  unpkg?: string;
};

function targets(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (node && typeof node === 'object') return Object.values(node).flatMap(targets);
  return [];
}

beforeAll(() => {
  // CI runs unit tests before the build; build the package if its dist is missing.
  if (!existsSync(path.join(PKG, 'dist/index.js')) || !existsSync(path.join(PKG, 'dist/awaketab-wake.iife.js'))) {
    execFileSync('pnpm', ['--filter', '@awaketab/wake', 'build'], { cwd: REPO, stdio: 'ignore' });
  }
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: PKG, encoding: 'utf8' });
  const [report] = JSON.parse(out) as Array<{ files: IPackEntry[] }>;
  files = (report?.files ?? []).map((f) => f.path).sort();
  manifest = JSON.parse(readFileSync(path.join(PKG, 'package.json'), 'utf8')) as typeof manifest;
}, 120_000);

describe('npm pack --dry-run @awaketab/wake', () => {
  it('publishes 1.0.0 publicly with provenance', () => {
    expect(manifest.name).toBe('@awaketab/wake');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.publishConfig).toMatchObject({ access: 'public', provenance: true });
  });

  it('ships exactly the built entry points, types, IIFE, README, CHANGELOG and LICENSE', () => {
    for (const f of [
      'package.json',
      'README.md',
      'CHANGELOG.md',
      'LICENSE',
      'dist/index.js',
      'dist/index.cjs',
      'dist/index.d.ts',
      'dist/index.d.cts',
      'dist/awaketab-wake.iife.js',
      ...['js', 'cjs', 'd.ts', 'd.cts'].map((ext) => `dist/video.${ext}`),
      ...['react', 'preact', 'vue'].flatMap((a) =>
        ['js', 'cjs', 'd.ts', 'd.cts'].map((ext) => `dist/adapters/${a}.${ext}`),
      ),
    ]) {
      expect(files, f).toContain(f);
    }
    expect(
      files.every((f) => ['package.json', 'README.md', 'CHANGELOG.md', 'LICENSE'].includes(f) || f.startsWith('dist/')),
    ).toBe(true);
    expect(
      files.some((f) => /(^|\/)(src|test)\//u.test(f) || f.includes('tsconfig') || f.includes('tsup.config')),
    ).toBe(false);
  });

  it('resolves every "exports" target, "unpkg" and the IIFE to a packed file', () => {
    const wanted = [...targets(manifest.exports), manifest.unpkg ?? ''].map((t) => t.replace(/^\.\//u, ''));
    for (const t of wanted) expect(files, t).toContain(t);
  });

  it('keeps adapters thin: they import the core instead of bundling it', () => {
    const react = readFileSync(path.join(PKG, 'dist/adapters/react.js'), 'utf8');
    expect(react).toContain('from"@awaketab/wake"');
    expect(react.length).toBeLessThan(1500);
  });
});
