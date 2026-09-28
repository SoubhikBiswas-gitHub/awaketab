// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { langOf, offlinePages } from '../src/sw-fallback';
import * as headerTools from './headers.mjs';
import { buildServiceWorker, precacheManifest, SHELL_PAGES, shellManifest } from './sw.mjs';

const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const PRESETS = ['15m', '30m', '45m', '1h', '2h', '4h', '8h'];

let dist = '';

async function put(rel: string, body: string) {
  const file = path.join(dist, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

const font = '<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>';
const tool = `${font}<div id="awaketab-tool" data-main="/_astro/main.a1.js"></div><link rel="stylesheet" href="/_astro/footer.h8.css">`;
const pip = '<script type="module" src="/_astro/pip-page.b2.js"></script>';

beforeAll(async () => {
  dist = await mkdtemp(path.join(tmpdir(), 'awaketab-sw-'));
  await put('index.html', `<!doctype html><title>home</title>${tool}`);
  await put('pip.html', `<!doctype html><title>pip</title>${pip}`);
  for (const p of PRESETS) await put(`${p}.html`, `<!doctype html><title>${p}</title>${tool}`);
  for (const l of LOCALES) {
    await put(`${l}/index.html`, `<!doctype html><title>${l}</title>${tool}`);
    await put(`${l}/pip.html`, `<!doctype html><title>${l} pip</title>${pip}`);
    await put(`${l}/manifest.webmanifest`, `{"lang":"${l}"}`);
  }
  await put('favicon.svg', '<svg/>');
  await put('manifest.webmanifest', '{"name":"AwakeTab"}');
  await put('icons/a.png', 'png');
  // The tool's closure: a static import, a lazy chunk, and a stylesheet the lazy chunk loads by URL.
  await put('_astro/main.a1.js', 'import"./shared.c3.js";const l=()=>import("./lazy.d4.js");');
  await put('_astro/shared.c3.js', 'export const s=1;');
  await put('_astro/lazy.d4.js', 'const css="/_astro/ambient.e5.css";export{css};');
  await put('_astro/ambient.e5.css', 'a{}');
  await put('_astro/footer.h8.css', 'f{}');
  await put('_astro/pip-page.b2.js', 'export{};');
  await put('_astro/font.woff2', 'woff2');
  await put('fonts/main.woff2', 'main-woff2');
  await put('fonts/mono.woff2', 'mono-woff2');
  // Other pages' scripts and styles ship too, but only the pages that use them load them.
  await put('_astro/pro-page.f6.js', 'export{};');
  await put('_astro/content.g7.css', 'b{}');
  await put(
    'learn.html',
    '<!doctype html><title>learn</title><script type="module" src="/_astro/pro-page.f6.js"></script>',
  );
  // So does the embed iframe and its fingerprinted app: runtime-cached by src/sw.ts, never precached.
  await put('embed/cook.html', '<script type="module" src="/embed/assets/app.0123456789.js"></script>');
  await put('embed/assets/app.0123456789.js', 'export{};');
  await put('embed.js', '/*! loader */');
});

afterAll(async () => {
  await rm(dist, { recursive: true, force: true });
});

describe('precacheManifest: what every visitor gets (docs/05 §8.2)', () => {
  it('holds only language-neutral files: the favicon, icons, the preloaded font and the shell pages’ scripts and styles (linked ones too)', async () => {
    const urls = (await precacheManifest(dist)).map((e) => e.url);
    expect(urls).toEqual([
      '/_astro/ambient.e5.css',
      '/_astro/footer.h8.css',
      '/_astro/lazy.d4.js',
      '/_astro/main.a1.js',
      '/_astro/pip-page.b2.js',
      '/_astro/shared.c3.js',
      '/favicon.svg',
      '/fonts/main.woff2',
      '/icons/a.png',
    ]);
  });

  it('gives hashed assets a null revision and static files a content revision', async () => {
    const entries = await precacheManifest(dist);
    expect(entries).toContainEqual({ url: '/_astro/main.a1.js', revision: null });
    expect(entries.find((e) => e.url === '/favicon.svg')?.revision).toMatch(/^[0-9a-f]{12}$/u);
  });

  it('gives the preloaded font a content revision', async () => {
    const entries = await precacheManifest(dist);
    expect(entries.find((e) => e.url === '/fonts/main.woff2')?.revision).toMatch(/^[0-9a-f]{12}$/u);
  });

  it('never precaches a page, another page’s scripts, other fonts or the embed', async () => {
    const urls = (await precacheManifest(dist)).map((e) => e.url);
    expect(urls.filter((u) => !u.startsWith('/_astro/') && !u.startsWith('/icons/'))).toEqual([
      '/favicon.svg',
      '/fonts/main.woff2',
    ]);
    for (const u of ['/_astro/pro-page.f6.js', '/_astro/content.g7.css', '/_astro/font.woff2', '/fonts/mono.woff2']) {
      expect(urls).not.toContain(u);
    }
    expect(urls.filter((u) => u.startsWith('/embed'))).toEqual([]);
  });
});

describe('shellManifest: pages cached per language by src/sw.ts', () => {
  it('lists each language’s home, /pip and manifest to cache at install, by the URL Pages serves', async () => {
    const shell = await shellManifest(dist);
    const install = (lang: string) =>
      shell
        .filter((e) => e.lang === lang && e.install)
        .map((e) => e.url)
        .sort();
    expect(install('en')).toEqual(['/', '/manifest.webmanifest', '/pip']);
    expect(install('es')).toEqual(['/es/', '/es/manifest.webmanifest', '/es/pip']);
    for (const l of LOCALES) expect(install(l)).toHaveLength(3);
    for (const e of shell) expect(e.revision, e.url).toMatch(/^[0-9a-f]{12}$/u);
  });

  it('keeps the English presets as shell pages cached only when visited', async () => {
    const shell = await shellManifest(dist);
    for (const p of PRESETS) expect(shell).toContainEqual(expect.objectContaining({ url: `/${p}`, install: false }));
    expect(shell.filter((e) => !e.install)).toHaveLength(PRESETS.length);
  });

  it('keys each shell page by the URL Cloudflare Pages serves it at, without a redirect (docs/14 §2.1)', () => {
    const pairs = SHELL_PAGES.map((p) => [p.url, p.file]);
    expect(pairs).toContainEqual(['/', 'index.html']);
    expect(pairs).toContainEqual(['/30m', '30m.html']);
    expect(pairs).toContainEqual(['/pip', 'pip.html']);
    expect(pairs).toContainEqual(['/es/', 'es/index.html']);
    expect(pairs).toContainEqual(['/es/pip', 'es/pip.html']);
  });

  it('gives different pages different revisions', async () => {
    const shell = await shellManifest(dist);
    const rev = (url: string) => shell.find((e) => e.url === url)?.revision;
    expect(rev('/')).not.toBe(rev('/pip'));
    expect(rev('/15m')).not.toBe(rev('/30m'));
  });

  it('is sorted and free of duplicates: 23 pages and 8 manifests', async () => {
    const urls = (await shellManifest(dist)).map((e) => e.url);
    expect(urls).toEqual([...urls].sort((a, b) => a.localeCompare(b)));
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toHaveLength(23 + 8);
  });

  it('fails loudly when a shell page is missing', async () => {
    await rm(path.join(dist, 'pip.html'));
    await expect(shellManifest(dist)).rejects.toThrow();
    await expect(precacheManifest(dist)).rejects.toThrow();
    await put('pip.html', `<!doctype html><title>pip</title>${pip}`);
  });
});

describe('offline fallback in src/sw.ts (docs/05 §8.2, §9)', () => {
  const homes = ['/', '/es/', '/pt-br/', '/de/', '/fr/', '/ja/', '/zh/', '/hi/'];
  const pips = homes.map((h) => `${h === '/' ? '' : h.slice(0, -1)}/pip`);

  it('opens a floating timer only in place of a floating timer, own language first, English next', () => {
    expect(offlinePages('/pip')).toEqual(pips);
    expect(offlinePages('/es/pip')).toEqual(['/es/pip', '/pip', ...pips.slice(2)]);
    expect(offlinePages('/de/pip')[0]).toBe('/de/pip');
    expect(offlinePages('/de/pip')[1]).toBe('/pip');
    for (const pip of pips) {
      expect(offlinePages(pip), pip).toHaveLength(8);
      expect(
        offlinePages(pip).some((p) => p.endsWith('/') || !p.endsWith('/pip')),
        pip,
      ).toBe(false);
    }
  });

  it('opens a cached home for any other page, which reads its preset or end time from the URL', () => {
    expect(offlinePages('/')).toEqual(homes);
    expect(offlinePages('/30m')).toEqual(homes);
    expect(offlinePages('/until/17-30')[0]).toBe('/');
    expect(offlinePages('/es/30m').slice(0, 2)).toEqual(['/es/', '/']);
    expect(offlinePages('/hi/')[0]).toBe('/hi/');
  });

  it('never falls back for the API or the embed', () => {
    expect(offlinePages('/api/license')).toEqual([]);
    expect(offlinePages('/embed/cook')).toEqual([]);
  });

  it('reads the language from the first path segment', () => {
    expect(langOf('/pt-br/pip')).toBe('pt-br');
    expect(langOf('/pip')).toBe('en');
    expect(langOf('/learn/x')).toBe('en');
  });

  it('knows the same locales as the build', () => {
    for (const l of LOCALES) expect(langOf(`/${l}/`)).toBe(l);
  });
});

describe('buildServiceWorker', () => {
  it('bundles src/sw.ts and injects both lists in place of their markers', async () => {
    const result = await buildServiceWorker(dist);
    const code = await readFile(path.join(dist, 'sw.js'), 'utf8');
    expect(code).not.toContain('__WB_MANIFEST');
    expect(code).not.toContain('__AT_SHELL');
    expect(code).toContain(JSON.stringify(await precacheManifest(dist)));
    expect(code).toContain(JSON.stringify(await shellManifest(dist)));
    expect(result).toMatchObject({ entries: 9, shell: 31 });
  });
});

describe('_headers for the service worker', () => {
  it('serves /sw.js with Cache-Control: no-cache so updates are picked up', () => {
    const headers = headerTools.generateHeaders();
    const rule = headerTools.parseRules(headers).find(({ route }) => route === '/sw.js');
    expect(rule).toBeDefined();
    const block = /^\/sw\.js\n((?:[ \t]+.+\n?)+)/mu.exec(headers)?.[1] ?? '';
    expect(block).toMatch(/^\s+Cache-Control: no-cache\s*$/mu);
    expect(block).not.toMatch(/immutable|max-age=[1-9]/u);
  });
});
