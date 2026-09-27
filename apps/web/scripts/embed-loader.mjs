// Builds the two AwakeTab Embed bundles (docs/11) with esbuild, outside Astro's Rollup graph:
//
//   public/embed.js       the loader sites paste (docs/11 §1, ≤ 3 KB gz) — committed, so the file every site
//                         loads is reviewable in diffs; scripts/embed-loader.test.ts fails when it is stale.
//   public/embed/app.js   the /embed/cook iframe app (docs/11 §2, ≤ 25 KB gz) — generated, git-ignored. `astro dev`
//                         serves it at this stable URL; `--fingerprint` (run after `astro build`) moves the dist
//                         copy to /embed/assets/app.<hash>.js and rewrites the built HTML to match, so production
//                         serves it `immutable` (scripts/headers.mjs) instead of revalidating it on every load.
//                         /embed.js stays unhashed: host sites paste that URL, so it keeps its short cache.
//
// Why not a normal Astro <script>: the iframe app imports @awaketab/wake and @awaketab/core like the tool island,
// and Rollup would split every shared module into chunks the tool page then loads on its critical path (+900 B
// gz measured, 7 B short of the 15 KB budget). A separate bundle shares source with the tool but never a chunk,
// so neither budget can move the other. Runs first in `pnpm -F web build` and `pnpm -F web dev`.
import { createHash } from 'node:crypto';
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { polarDefines } from './polar-server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '../..');
const DIST = process.env.AT_DIST ? path.resolve(process.env.AT_DIST) : path.join(ROOT, 'dist');
const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
export const LOADER_OUT = path.join(ROOT, 'public/embed.js');
export const APP_OUT = path.join(ROOT, 'public/embed/app.js');
export const APP_URL = '/embed/app.js';
export const APP_ASSET_DIR = '/embed/assets/';
export const HASHED_APP_RE = /^\/embed\/assets\/app\.[0-9a-f]{10}\.js$/u;
const BANNER = '/*! AwakeTab Embed loader · https://awaketab.com/embed */';
const ALIAS = {
  '@awaketab/wake': path.join(REPO, 'packages/wake/src/index.ts'),
  '@awaketab/core': path.join(REPO, 'packages/core/src/index.ts'),
};

export async function catalogStrings(key) {
  const out = {};
  for (const locale of LOCALES) {
    const catalog = JSON.parse(await readFile(path.join(ROOT, `src/i18n/${locale}.json`), 'utf8'));
    const value = catalog[key];
    if (typeof value !== 'string' || !value) throw new Error(`embed-loader: ${locale}.json has no ${key}`);
    out[locale] = value;
  }
  return out;
}

export const frameTitles = () => catalogStrings('embed.frame.title');
export const creditTexts = () => catalogStrings('embed.attribution');

export async function buildLoader() {
  const result = await build({
    entryPoints: [path.join(ROOT, 'src/tool/embed/loader-entry.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    // es2020 (native ?? and ?.) like the iframe app and the @awaketab/wake IIFE: every browser with a wake lock
    // or the video fallback parses it, and it keeps the credit (O-47) inside the 3 KB budget.
    target: 'es2020',
    legalComments: 'none',
    banner: { js: BANNER },
    define: {
      __AT_FRAME_TITLES__: JSON.stringify(await frameTitles()),
      __AT_CREDITS__: JSON.stringify(await creditTexts()),
    },
  });
  return result.outputFiles[0]?.text ?? '';
}

export async function buildApp() {
  const result = await build({
    entryPoints: [path.join(ROOT, 'src/tool/embed/app.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    target: 'es2020',
    legalComments: 'none',
    alias: ALIAS,
    define: { 'import.meta.env.DEV': 'false', ...polarDefines() },
  });
  return result.outputFiles[0]?.text ?? '';
}

export function hashedAppUrl(code) {
  return `${APP_ASSET_DIR}app.${createHash('sha256').update(code).digest('hex').slice(0, 10)}.js`;
}

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(target)));
    else if (entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

export async function fingerprintApp(dist = DIST) {
  const source = path.join(dist, APP_URL.slice(1));
  const code = await readFile(source);
  const url = hashedAppUrl(code);
  const pages = [];
  for (const file of await htmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    if (!html.includes(`"${APP_URL}"`)) continue;
    await writeFile(file, html.replaceAll(`"${APP_URL}"`, `"${url}"`));
    pages.push(path.relative(dist, file).split(path.sep).join('/'));
  }
  if (pages.length === 0) throw new Error(`embed-loader: no built page references ${APP_URL}`);
  await mkdir(path.join(dist, APP_ASSET_DIR.slice(1)), { recursive: true });
  await writeFile(path.join(dist, url.slice(1)), code);
  await rm(source);
  return { url, pages: pages.sort() };
}

const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '');
if (isMain && process.argv.includes('--fingerprint')) {
  process.stdout.write(`${JSON.stringify({ embedApp: await fingerprintApp() })}\n`);
} else if (isMain) {
  const [loader, app] = await Promise.all([buildLoader(), buildApp()]);
  await mkdir(path.dirname(APP_OUT), { recursive: true });
  await Promise.all([writeFile(LOADER_OUT, loader), writeFile(APP_OUT, app)]);
  process.stdout.write(
    `${JSON.stringify({ embed: { loaderBytes: Buffer.byteLength(loader), appBytes: Buffer.byteLength(app) } })}\n`,
  );
}
