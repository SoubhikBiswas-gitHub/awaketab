// Builds dist/sw.js (docs/05 §8.2): bundles src/sw.ts with esbuild and injects the precache manifest.
// Runs after `astro build` and prune-unreferenced.mjs so the manifest lists exactly the files that ship;
// that ordering is why this is a post-build step rather than @vite-pwa/astro (docs/03 ADR-014).
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { LOCALES, servedFile } from './served.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.join(ROOT, 'dist');
const PRESET_ROUTES = ['15m', '30m', '45m', '1h', '2h', '4h', '8h'];
const MARKER = 'self.__WB_MANIFEST';

/**
 * Shell pages: the tool routes and locale homes, keyed by the URL a navigation requests — the URL Cloudflare
 * Pages serves without a redirect (scripts/served.mjs), so the precache key matches the request exactly.
 */
export const SHELL_PAGES = [
  '/',
  '/pip',
  ...PRESET_ROUTES.map((r) => `/${r}`),
  ...LOCALES.map((l) => `/${l}/`),
  ...LOCALES.map((l) => `/${l}/pip`),
].map((url) => [url, servedFile(url)]);

const STATIC = ['favicon.svg', 'manifest.webmanifest', ...LOCALES.map((l) => `${l}/manifest.webmanifest`)];

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

export async function precacheManifest(dist = DIST) {
  const entries = [];
  for (const [url, file] of SHELL_PAGES) {
    entries.push({ url, revision: revision(await readFile(path.join(dist, file))) });
  }
  for (const file of STATIC) {
    entries.push({ url: `/${file}`, revision: revision(await readFile(path.join(dist, file))) });
  }
  for (const file of await files(path.join(dist, 'icons'))) {
    entries.push({ url: `/${path.relative(dist, file).split(path.sep).join('/')}`, revision: revision(await readFile(file)) });
  }
  // Vite-hashed assets: the URL is the revision.
  for (const file of await files(path.join(dist, '_astro'))) {
    if (/\.(?:js|css)$/u.test(file)) entries.push({ url: `/${path.relative(dist, file).split(path.sep).join('/')}`, revision: null });
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
  if (!code.includes(MARKER)) throw new Error(`sw.mjs: ${MARKER} not found in the bundle`);
  const manifest = await precacheManifest(dist);
  await writeFile(path.join(dist, 'sw.js'), code.replace(MARKER, JSON.stringify(manifest)));
  return { entries: manifest.length, bytes: code.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await buildServiceWorker();
  process.stdout.write(`${JSON.stringify({ sw: result })}\n`);
}
