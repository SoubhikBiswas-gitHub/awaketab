// docs/03-architecture.md ADR-013: shadcn/ui renders at build time only.
// This static guard complements the dist check in scripts/size.mjs.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// vitest runs from the repo root under happy-dom, where import.meta.url is not a file: URL.
const SRC = path.resolve(process.cwd(), 'apps/web/src');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(target)));
    else out.push(target);
  }
  return out;
}

describe('zero hydration', () => {
  it('no .astro file uses a client:* directive', async () => {
    const files = (await walk(SRC)).filter((f) => f.endsWith('.astro'));
    expect(files.length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      if (/\sclient:(load|idle|visible|media|only)\b/u.test(text)) offenders.push(path.relative(SRC, file));
    }
    expect(offenders).toEqual([]);
  });

  it('the tool island never imports React, cn or the shadcn primitives', async () => {
    const files = (await walk(path.join(SRC, 'tool'))).filter((f) => f.endsWith('.ts'));
    const offenders: string[] = [];
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      if (/from ['"](react|react-dom|cn|radix-ui|class-variance-authority|@\/components\/ui\/[^'"]+)['"]/u.test(text)) {
        offenders.push(path.relative(SRC, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('shadcn theme bridge (docs/05 §1.5)', () => {
  const aliases: Array<[string, string]> = [
    ['--background', 'var(--at-ground)'],
    ['--foreground', 'var(--at-ink)'],
    ['--card', 'var(--at-surface)'],
    ['--primary', 'var(--at-accent-text)'],
    ['--primary-foreground', 'var(--at-on-accent)'],
    ['--muted-foreground', 'var(--at-muted)'],
    ['--accent', 'color-mix(in srgb, var(--at-accent) 12%, var(--at-surface))'],
    ['--destructive', 'var(--at-bad)'],
    ['--success', 'var(--at-good)'],
    ['--warning', 'var(--at-warn)'],
    ['--border', 'var(--at-line)'],
    ['--input', 'var(--at-line)'],
    ['--ring', 'var(--at-focus)'],
    ['--radius', 'var(--at-r-md)'],
  ];

  it('aliases every shadcn semantic variable to an --at-* token', async () => {
    const css = await readFile(path.join(SRC, 'styles/tokens.css'), 'utf8');
    for (const [name, value] of aliases) {
      expect(css, name).toContain(`${name}: ${value};`);
    }
    expect(css).toContain('@custom-variant dark');
    expect(css).toContain('[data-theme="oled"]');
  });

  it('keeps the canonical --at-* palette byte-identical to docs/05 §1.1', async () => {
    const css = await readFile(path.join(SRC, 'styles/tokens.css'), 'utf8');
    for (const hex of ['#faf7f2', '#14161c', '#b86e00', '#8a5200', '#ffb84d', '#1a1200', '#b3261e', '#ff8a80']) {
      expect(css).toContain(hex);
    }
  });
});
