// Builds dist/sw.js (docs/05 §8.2): bundles src/sw.ts with esbuild and injects the precache lists.
// Runs after `astro build` and prune-unreferenced.mjs so the lists name exactly the files that ship;
// that ordering is why this is a post-build step rather than @vite-pwa/astro (docs/03 ADR-014).
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { LOCALES, servedFile } from './served.mjs';
import { closure, entryScripts } from './size-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.join(ROOT, 'dist');
const PRESET_ROUTES = ['15m', '30m', '45m', '1h', '2h', '4h', '8h'];
const MARKER = 'self.__WB_MANIFEST';
const SHELL_MARKER = 'self.__AT_SHELL';

// Per language: the start page and the /pip popup, cached when the worker installs for a visitor of that language.
// The English presets are shell pages too, cached only when they are the page being visited (src/sw.ts); offline,
// any other tool URL opens the cached home, which reads its preset from the URL.
export const SHELL_PAGES = [
  ['en', '/', true],
  ['en', '/pip', true],
  ...PRESET_ROUTES.map((r) => ['en', `/${r}`, false]),
  ...LOCALES.flatMap((l) => [
    [l, `/${l}/`, true],
    [l, `/${l}/pip`, true],
  ]),
].map(([lang, url, install]) => ({ lang, url, file: servedFile(url), install }));

const MANIFESTS = [['en', 'manifest.webmanifest'], ...LOCALES.map((l) => [l, `${l}/manifest.webmanifest`])];

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(target)));
    else out.push(target);
  }
  return out;
}

const revision = (buf) => createHash('md5').update(buf).digest('hex').slice(0, 12);
const urlOf = (dist, file) => `/${path.relative(dist, file).split(path.sep).join('/')}`;

// The scripts the shell pages run, with every chunk they can import (lazy tool modules too) and the stylesheets
// those chunks load by URL (the ambient CSS). Other pages' scripts are cached when those pages are visited.
async function shellAssets(dist) {
  const entries = new Set();
  for (const { file } of SHELL_PAGES) {
    for (const src of entryScripts(await readFile(path.join(dist, file), 'utf8'))) {
      if (src.startsWith('/_astro/')) entries.add(path.join(dist, src.slice(1)));
    }
  }
  // Feature packs load on first use and are cached then, so a visitor never downloads a feature they do not open.
  const scripts = [...(await closure([...entries], { dynamic: true }))].filter(
    (f) => !/(?:^|\/)pack-/u.test(path.basename(f)),
  );
  const styles = new Set();
  for (const file of scripts) {
    for (const m of (await readFile(file, 'utf8')).matchAll(/["'](\/_astro\/[^"'?#]+\.css)["']/gu)) {
      styles.add(path.join(dist, m[1].slice(1)));
    }
  }
  return [...scripts, ...styles].map((file) => urlOf(dist, file));
}

// The font the shell pages preload (BaseLayout: the one their largest text uses), so offline pages keep their type.
// The other fonts are not precached: they load after the first paint and only where a page uses them.
async function shellFonts(dist) {
  const fonts = new Set();
  for (const { file } of SHELL_PAGES) {
    const html = await readFile(path.join(dist, file), 'utf8');
    for (const m of html.matchAll(/<link rel="preload" href="(\/fonts\/[^"]+\.woff2)" as="font"/gu)) fonts.add(m[1]);
  }
  return [...fonts];
}

// Precached for every visitor by Workbox: files no language owns.
export async function precacheManifest(dist = DIST) {
  const entries = [{ url: '/favicon.svg', revision: revision(await readFile(path.join(dist, 'favicon.svg'))) }];
  for (const file of await files(path.join(dist, 'icons'))) {
    entries.push({ url: urlOf(dist, file), revision: revision(await readFile(file)) });
  }
  for (const url of await shellFonts(dist)) {
    entries.push({ url, revision: revision(await readFile(path.join(dist, url.slice(1)))) });
  }
  // Vite-hashed assets: the URL is the revision.
  for (const url of await shellAssets(dist)) entries.push({ url, revision: null });
  return entries.sort((a, b) => a.url.localeCompare(b.url));
}

// Cached by src/sw.ts per language, keyed by URL and revision so an update fetches only the pages that changed.
export async function shellManifest(dist = DIST) {
  const entries = [];
  for (const { lang, url, file, install } of SHELL_PAGES) {
    entries.push({ url, revision: revision(await readFile(path.join(dist, file))), lang, install });
  }
  for (const [lang, file] of MANIFESTS) {
    entries.push({ url: `/${file}`, revision: revision(await readFile(path.join(dist, file))), lang, install: true });
  }
  return entries.sort((a, b) => a.url.localeCompare(b.url));
}

export async function buildServiceWorker(dist = DIST) {
  const bundle = await build({
    entryPoints: [path.join(ROOT, 'src/sw.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    target: 'es2020',
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const code = bundle.outputFiles[0]?.text ?? '';
  // Each list is injected at one place; a second reference would stay undefined and break the worker at startup.
  for (const marker of [MARKER, SHELL_MARKER]) {
    const count = code.split(marker).length - 1;
    if (count !== 1) throw new Error(`sw.mjs: ${marker} must appear once in the bundle, found ${String(count)}`);
  }
  const manifest = await precacheManifest(dist);
  const shell = await shellManifest(dist);
  await writeFile(
    path.join(dist, 'sw.js'),
    code.replace(MARKER, () => JSON.stringify(manifest)).replace(SHELL_MARKER, () => JSON.stringify(shell)),
  );
  return { entries: manifest.length, shell: shell.length, bytes: code.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await buildServiceWorker();
  process.stdout.write(`${JSON.stringify({ sw: result })}\n`);
}
