import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { ISLAND_PREFIXES, islandCatalog } from '../../src/i18n/load';

const SRC = path.resolve('apps/web/src');

async function files(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(target)));
    else if (entry.name.endsWith('.ts')) out.push(target);
  }
  return out;
}

describe('island catalog (tool pages embed only runtime keys)', () => {
  it('covers every catalog key the island and its libs reference', async () => {
    const keys = new Set(Object.keys(en));
    const sources = [...(await files(path.join(SRC, 'tool'))), path.join(SRC, 'lib/license.ts'), path.join(SRC, 'lib/license-lookup.ts')].filter(
      (f) => !f.includes(`${path.sep}embed${path.sep}`) || f.endsWith('kiosk.ts'),
    );
    const missing: string[] = [];
    for (const file of sources) {
      const code = await readFile(file, 'utf8').catch(() => '');
      // Literal keys ('tool.pill.idle') and template prefixes (`tool.pill.${lock}` → 'tool.pill.').
      for (const m of code.matchAll(/['`]([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9_]+)+\.?)(?:\$\{|['`])/gu)) {
        const key = m[1] ?? '';
        const known = keys.has(key) || [...keys].some((k) => key.endsWith('.') && k.startsWith(key));
        if (known && !ISLAND_PREFIXES.some((p) => key.startsWith(p))) missing.push(`${path.relative(SRC, file)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps every locale complete for the embedded families and drops page copy', () => {
    const island = islandCatalog('en');
    expect(island['tool.pill.held']).toBe('Screen awake');
    expect(island['page.home.h1']).toBeUndefined();
    for (const locale of ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const) {
      expect(Object.keys(islandCatalog(locale)).sort()).toEqual(Object.keys(island).sort());
    }
  });
});
