// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  APP_URL,
  buildApp,
  buildLoader,
  creditTexts,
  fingerprintApp,
  frameTitles,
  HASHED_APP_RE,
  hashedAppUrl,
  LOADER_OUT,
} from './embed-loader.mjs';

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
    const credits = await creditTexts();
    expect(Object.keys(titles)).toHaveLength(8);
    expect(Object.keys(credits)).toHaveLength(8);
    // esbuild writes ASCII-only output, so compare the escaped form of every title and credit text.
    const ascii = (s: string) =>
      s.replace(/[^\x20-\x7e]/gu, (ch) => `\\u${(ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`);
    for (const text of [...Object.values(titles), ...Object.values(credits)]) {
      const escaped = ascii(text);
      expect(code.includes(escaped) || code.includes(escaped.replace(/\\u00([0-9A-F]{2})/gu, '\\x$1')), text).toBe(
        true,
      );
    }
    expect(code).toContain('awaketab-credit');
    expect(code).toContain('nofollow');
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

describe('fingerprintApp (post-build, serves the iframe app immutable)', () => {
  let dist = '';
  const put = async (rel: string, body: string) => {
    await mkdir(path.dirname(path.join(dist, rel)), { recursive: true });
    await writeFile(path.join(dist, rel), body);
  };

  beforeEach(async () => {
    dist = await mkdtemp(path.join(tmpdir(), 'at-embed-fp-'));
  });
  afterEach(async () => {
    await rm(dist, { recursive: true, force: true });
  });

  it('moves the app to a content-hashed /embed/assets URL and rewrites the page that loads it', async () => {
    await put('embed/app.js', 'export const app=1;');
    await put(
      'embed/cook.html',
      `<script src="/theme-boot.js"></script><script type="module" src="${APP_URL}"></script>`,
    );
    await put('index.html', '<script type="module" src="/_astro/index.js"></script>');
    await put('embed.js', '/*! loader */');

    const { url, pages } = await fingerprintApp(dist);
    expect(url).toMatch(HASHED_APP_RE);
    expect(url).toBe(hashedAppUrl('export const app=1;'));
    expect(pages).toEqual(['embed/cook.html']);
    expect(await readFile(path.join(dist, url.slice(1)), 'utf8')).toBe('export const app=1;');
    await expect(stat(path.join(dist, 'embed/app.js'))).rejects.toThrow();
    const html = await readFile(path.join(dist, 'embed/cook.html'), 'utf8');
    expect(html).toContain(`<script type="module" src="${url}"></script>`);
    expect(html).not.toContain(APP_URL);
    // The host-page loader keeps its stable URL; other pages are untouched.
    expect(await readFile(path.join(dist, 'embed.js'), 'utf8')).toBe('/*! loader */');
    expect(await readFile(path.join(dist, 'index.html'), 'utf8')).toBe(
      '<script type="module" src="/_astro/index.js"></script>',
    );
  });

  it('changes the URL when the bundle changes', () => {
    expect(hashedAppUrl('a')).not.toBe(hashedAppUrl('b'));
    expect(hashedAppUrl('a')).toBe(hashedAppUrl('a'));
  });

  it('fails loudly when no built page references the app, or the app is missing', async () => {
    await put('embed/app.js', 'export const app=1;');
    await put('embed/cook.html', '<p>no script</p>');
    await expect(fingerprintApp(dist)).rejects.toThrow(/no built page/u);
    await rm(path.join(dist, 'embed/app.js'));
    await expect(fingerprintApp(dist)).rejects.toThrow();
  });
});
