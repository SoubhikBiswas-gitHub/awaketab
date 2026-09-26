// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as headerTools from './headers.mjs';
import { precacheManifest, SHELL_PAGES } from './sw.mjs';

const LOCALES = ['es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
const PRESETS = ['15m', '30m', '45m', '1h', '2h', '4h', '8h'];

let dist = '';

async function put(rel: string, body: string) {
  const file = path.join(dist, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

beforeAll(async () => {
  dist = await mkdtemp(path.join(tmpdir(), 'awaketab-sw-'));
  await put('index.html', '<!doctype html><title>home</title>');
  await put('pip/index.html', '<!doctype html><title>pip</title>');
  for (const p of PRESETS) await put(`${p}/index.html`, `<!doctype html><title>${p}</title>`);
  for (const l of LOCALES) {
    await put(`${l}/index.html`, `<!doctype html><title>${l}</title>`);
    await put(`${l}/pip/index.html`, `<!doctype html><title>${l} pip</title>`);
    await put(`${l}/manifest.webmanifest`, `{"lang":"${l}"}`);
  }
  await put('favicon.svg', '<svg/>');
  await put('theme-boot.js', '(()=>{})();');
  await put('manifest.webmanifest', '{"name":"AwakeTab"}');
  await put('icons/a.png', 'png');
  await put('_astro/x.js', 'export{};');
  await put('_astro/x.css', 'a{}');
  await put('_astro/font.woff2', 'woff2');
  // Content pages ship too but are not part of the offline shell.
  await put('learn/index.html', '<!doctype html><title>learn</title>');
});

afterAll(async () => {
  await rm(dist, { recursive: true, force: true });
});

describe('precacheManifest (docs/05 §8.2)', () => {
  it('lists the shell pages by navigation URL with content revisions', async () => {
    const entries = await precacheManifest(dist);
    const urls = entries.map((e) => e.url);
    for (const u of ['/', '/pip', '/es/pip', '/zh/pip', '/15m', '/8h', '/es/', '/pt-br/', '/hi/']) expect(urls).toContain(u);
    expect(urls).not.toContain('/index.html');
    expect(urls).not.toContain('/learn/');
    expect(urls.some((u) => u.startsWith('/learn'))).toBe(false);
    for (const [url] of SHELL_PAGES) {
      const entry = entries.find((e) => e.url === url);
      expect(entry?.revision, url).toMatch(/^[0-9a-f]{12}$/u);
    }
  });

  it('gives different pages different revisions', async () => {
    const entries = await precacheManifest(dist);
    const rev = (url: string) => entries.find((e) => e.url === url)?.revision;
    expect(rev('/')).not.toBe(rev('/pip'));
    expect(rev('/15m')).not.toBe(rev('/30m'));
  });

  it('includes static files, locale manifests and icons', async () => {
    const entries = await precacheManifest(dist);
    const byUrl = new Map(entries.map((e) => [e.url, e.revision]));
    for (const u of ['/favicon.svg', '/theme-boot.js', '/manifest.webmanifest', '/es/manifest.webmanifest', '/icons/a.png']) {
      expect(byUrl.get(u), u).toMatch(/^[0-9a-f]{12}$/u);
    }
  });

  it('lists hashed /_astro scripts and styles with a null revision, and nothing else from there', async () => {
    const entries = await precacheManifest(dist);
    expect(entries).toContainEqual({ url: '/_astro/x.js', revision: null });
    expect(entries).toContainEqual({ url: '/_astro/x.css', revision: null });
    expect(entries.some((e) => e.url === '/_astro/font.woff2')).toBe(false);
  });

  it('is sorted and free of duplicates', async () => {
    const urls = (await precacheManifest(dist)).map((e) => e.url);
    expect(urls).toEqual([...urls].sort((a, b) => a.localeCompare(b)));
    expect(new Set(urls).size).toBe(urls.length);
    // 1 home + pip + 7 presets + 7 locale homes + 7 locale pips; 3 static + 7 locale manifests; 1 icon; 2 hashed assets.
    expect(urls).toHaveLength(23 + 10 + 1 + 2);
  });

  it('fails loudly when a shell page is missing', async () => {
    await rm(path.join(dist, 'pip/index.html'));
    await expect(precacheManifest(dist)).rejects.toThrow();
    await put('pip/index.html', '<!doctype html><title>pip</title>');
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
