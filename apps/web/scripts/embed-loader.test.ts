// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { buildApp, buildLoader, frameTitles, LOADER_OUT } from './embed-loader.mjs';

// docs/11 §1, §6 and docs/00 §11: the loader sites paste is ≤ 3 KB gz and the committed public/embed.js is exactly
// what src/tool/embed/loader.ts builds to (so a reviewer reads the source, and a site loads the same thing).
const LOADER_BUDGET = 3 * 1024;
const APP_BUDGET = 25 * 1024;

describe('public/embed.js', () => {
  it('is up to date with src/tool/embed/loader.ts (run `node apps/web/scripts/embed-loader.mjs`)', async () => {
    expect(await readFile(LOADER_OUT, 'utf8')).toBe(await buildLoader());
  });

  it('stays within the 3 KB gzip loader budget', async () => {
    const bytes = gzipSync(await readFile(LOADER_OUT), { level: 9 }).byteLength;
    expect(bytes).toBeLessThanOrEqual(LOADER_BUDGET);
  });

  it('is a dependency-free classic script with the localized frame titles inlined', async () => {
    const code = await readFile(LOADER_OUT, 'utf8');
    expect(code).not.toMatch(/\bimport\s*\(|\bimport\s*["'{]|\bexport\b/u);
    const titles = await frameTitles();
    expect(Object.keys(titles)).toHaveLength(8);
    // esbuild writes ASCII-only output, so compare the escaped form of every title.
    const ascii = (s: string) => s.replace(/[^\x20-\x7e]/gu, (ch) => `\\u${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`);
    for (const title of Object.values(titles)) {
      const escaped = ascii(title);
      expect(code.includes(escaped) || code.includes(escaped.replace(/\\u00([0-9A-F]{2})/gu, '\\x$1')), title).toBe(true);
    }
    expect(code).toContain('screen-wake-lock');
    expect(code).toContain('AwakeTabEmbed');
  });
});

describe('/embed/app.js (the iframe app bundle)', () => {
  it('builds to one self-contained module within the 25 KB gzip budget', async () => {
    const code = await buildApp();
    expect(code).not.toMatch(/\bimport\s*\(\s*["']|\bfrom\s*["']/u);
    expect(gzipSync(code, { level: 9 }).byteLength).toBeLessThanOrEqual(APP_BUDGET);
  });
});
