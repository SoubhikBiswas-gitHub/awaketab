// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HASHED_APP_RE } from './embed-loader.mjs';
import { closure, embedEntryHashed, entryScripts, pageJs } from './size-lib.mjs';

// docs/00 §11 / §13.10: `criticalJs` = static-import closure of the tool page's entry scripts; `totalJs` = the
// closure over static AND dynamic imports; `embedJs` the same for /embed/cook. A fixture dist exercises each.
let dist = '';

beforeAll(async () => {
  dist = await mkdtemp(path.join(tmpdir(), 'at-size-'));
  const astro = path.join(dist, '_astro');
  await mkdir(astro, { recursive: true });
  await mkdir(path.join(dist, 'embed/assets'), { recursive: true });
  const files: Record<string, string> = {
    'entry.js': 'import{a}from"./shared.js";import"./side.js";document.x=()=>import("./lazy.js");',
    'shared.js': 'export const a=1;',
    'side.js': 'window.s=1;',
    'lazy.js': 'import{a}from"./shared.js";export const l=()=>import( "./lazier.js" );',
    'lazier.js': 'export const z=a=>a;',
    'other-page.js': 'export const unrelated="x".repeat(5000);',
  };
  for (const [name, code] of Object.entries(files)) await writeFile(path.join(astro, name), code);
  await writeFile(
    path.join(dist, 'index.html'),
    '<script src="/theme-boot.js"></script><script type="application/json" data-x>{}</script><script type="module" src="/_astro/entry.js"></script>',
  );
  await writeFile(path.join(dist, 'embed/assets/app.0123456789.js'), 'export const app=1;');
  await writeFile(
    path.join(dist, 'embed/cook.html'),
    '<script type="module" src="/embed/assets/app.0123456789.js"></script>',
  );
});

afterAll(async () => {
  await rm(dist, { recursive: true, force: true });
});

describe('size gate closures', () => {
  it('finds only same-origin module entry scripts', () => {
    expect(
      entryScripts(
        '<script src="/theme-boot.js"></script><script type="module" src="/_astro/a.js"></script><script type="module" src="https://cdn.example/x.js"></script><script type="module" src="/embed/app.js"></script>',
      ),
    ).toEqual(['/_astro/a.js', '/embed/app.js']);
  });

  it('critical = static closure; total = static + dynamic closure; other pages never count', async () => {
    const page = await pageJs(dist, 'index.html');
    expect(page.files(page.critical)).toEqual(['/_astro/entry.js', '/_astro/shared.js', '/_astro/side.js']);
    expect(page.files(page.all)).toEqual([
      '/_astro/entry.js',
      '/_astro/lazier.js',
      '/_astro/lazy.js',
      '/_astro/shared.js',
      '/_astro/side.js',
    ]);
    expect(page.totalBytes).toBeGreaterThan(page.criticalBytes);
    expect(page.files(page.all)).not.toContain('/_astro/other-page.js');
  });

  it('measures the embed page from its own entry', async () => {
    const page = await pageJs(dist, 'embed/cook.html');
    expect(page.files(page.all)).toEqual(['/embed/assets/app.0123456789.js']);
    expect(embedEntryHashed(page.html, HASHED_APP_RE)).toBe(true);
  });

  it('fails the embed page when its app is not fingerprinted or missing', () => {
    expect(embedEntryHashed('<script type="module" src="/embed/app.js"></script>', HASHED_APP_RE)).toBe(false);
    expect(embedEntryHashed('<script src="/theme-boot.js"></script>', HASHED_APP_RE)).toBe(false);
    expect(embedEntryHashed('<script type="module" src="/embed/assets/app.abc.js"></script>', HASHED_APP_RE)).toBe(
      false,
    );
  });

  it('visits each file once even with cycles', async () => {
    await writeFile(path.join(dist, '_astro/cyc-a.js'), 'import"./cyc-b.js";');
    await writeFile(path.join(dist, '_astro/cyc-b.js'), 'import"./cyc-a.js";');
    const seen = await closure([path.join(dist, '_astro/cyc-a.js')], { dynamic: true });
    expect(seen.size).toBe(2);
  });
});
