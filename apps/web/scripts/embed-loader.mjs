// Builds the two AwakeTab Embed bundles (docs/11) with esbuild, outside Astro's Rollup graph:
//
//   public/embed.js       the loader sites paste (docs/11 §1, ≤ 3 KB gz) — committed, so the file every site
//                         loads is reviewable in diffs; scripts/embed-loader.test.ts fails when it is stale.
//   public/embed/app.js   the /embed/cook iframe app (docs/11 §2, ≤ 25 KB gz) — generated, git-ignored.
//
// Why not a normal Astro <script>: the iframe app imports @awaketab/wake and @awaketab/core like the tool island,
// and Rollup would split every shared module into chunks the tool page then loads on its critical path (+900 B
// gz measured, 7 B short of the 15 KB budget). A separate bundle shares source with the tool but never a chunk,
// so neither budget can move the other. Runs first in `pnpm -F web build` and `pnpm -F web dev`.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '../..');
const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];
export const LOADER_OUT = path.join(ROOT, 'public/embed.js');
export const APP_OUT = path.join(ROOT, 'public/embed/app.js');
const BANNER = '/*! AwakeTab Embed loader · https://awaketab.com/embed */';
const ALIAS = {
  '@awaketab/wake': path.join(REPO, 'packages/wake/src/index.ts'),
  '@awaketab/core': path.join(REPO, 'packages/core/src/index.ts'),
};

export async function frameTitles() {
  const titles = {};
  for (const locale of LOCALES) {
    const catalog = JSON.parse(await readFile(path.join(ROOT, `src/i18n/${locale}.json`), 'utf8'));
    const title = catalog['embed.frame.title'];
    if (typeof title !== 'string' || !title) throw new Error(`embed-loader: ${locale}.json has no embed.frame.title`);
    titles[locale] = title;
  }
  return titles;
}

export async function buildLoader() {
  const result = await build({
    entryPoints: [path.join(ROOT, 'src/tool/embed/loader-entry.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    target: 'es2019',
    legalComments: 'none',
    banner: { js: BANNER },
    define: { __AT_FRAME_TITLES__: JSON.stringify(await frameTitles()) },
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
    define: { 'import.meta.env.DEV': 'false' },
  });
  return result.outputFiles[0]?.text ?? '';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [loader, app] = await Promise.all([buildLoader(), buildApp()]);
  await mkdir(path.dirname(APP_OUT), { recursive: true });
  await Promise.all([writeFile(LOADER_OUT, loader), writeFile(APP_OUT, app)]);
  process.stdout.write(
    `${JSON.stringify({ embed: { loaderBytes: Buffer.byteLength(loader), appBytes: Buffer.byteLength(app) } })}\n`,
  );
}
