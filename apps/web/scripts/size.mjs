import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { HASHED_APP_RE } from './embed-loader.mjs';
import { embedEntryHashed, gz, pageJs } from './size-lib.mjs';
import { servedFile } from './served.mjs';

// AT_DIST lets parallel verification builds target their own output directory.
const DIST = process.env.AT_DIST
  ? `${path.resolve(process.env.AT_DIST)}/`
  : fileURLToPath(new URL('../dist/', import.meta.url));

// docs/00 §11 and §13.10. Tool page = `/`; embed page = the /embed/cook iframe app; loader = the host-page script at
// /embed.js that sites paste (docs/11 §1). Pages are read from the file Cloudflare Pages serves them from (served.mjs).
const limits = {
  css: 20 * 1024,
  criticalJs: 15 * 1024,
  totalJs: 40 * 1024,
  embedJs: 25 * 1024,
  loaderJs: 3 * 1024,
  // Feature packs load only when a visitor opens that feature, so each has its own budget outside totalJs.
  packs: {
    faces: 30 * 1024,
    sound: 110 * 1024,
    notes: 120 * 1024,
    themes: 25 * 1024,
    extras: 15 * 1024,
    customize: 2 * 1024,
  },
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(target)));
    else out.push(target);
  }
  return out;
}

// Tool page: `criticalJs` is the entry scripts plus their static-import closure (loads before the island runs);
// `totalJs` is everything the page can ever load — the closure over static AND dynamic `import()` edges.
// Before M8 `totalJs` summed every dist/_astro/*.js, which charged other pages' chunks (the embed app, /pro
// scripts) to the tool page's 40 KB budget.
const tool = await pageJs(DIST, servedFile('/'));
const criticalJs = tool.criticalBytes;
// A pack may split into named chunks (pack-faces-flip); they count toward their pack.
const packOf = (f) => /(?:^|\/)pack-([a-z]+)(?:-[a-z]+)?\.[\w-]+\.js$/u.exec(f)?.[1];
const packs = {};
for (const f of tool.all) {
  const name = packOf(f);
  if (name) packs[name] = (packs[name] ?? 0) + gz(await readFile(f));
}
const totalJs = tool.totalBytes - Object.values(packs).reduce((a, b) => a + b, 0);
const packOver = Object.entries(packs).filter(([name, bytes]) => bytes > (limits.packs[name] ?? 0));

// Embed iframe app (docs/11 §2, ≤ 25 KB gz): same full closure, from its own page.
const embed = await pageJs(DIST, servedFile('/embed/cook'));
const embedJs = embed.totalBytes;
// The app must ship fingerprinted (embed-loader.mjs --fingerprint) so /embed/assets/* can be served immutable; an
// empty closure would also make embedJs read 0 and pass.
const embedHashed = embedEntryHashed(embed.html, HASHED_APP_RE);

// Loader (docs/11 §1, ≤ 3 KB gz): a single classic script, no imports.
const loaderPath = path.join(DIST, 'embed.js');
const loaderJs = (await stat(loaderPath).catch(() => null)) ? gz(await readFile(loaderPath)) : Number.POSITIVE_INFINITY;

const styles = [...tool.html.matchAll(/<style[^>]*>(?<css>.*?)<\/style>/gsu)].map((m) => m.groups?.css ?? '').join('');
const totalCss = gz(Buffer.from(styles));

// docs/03-architecture.md ADR-013: shadcn/ui renders at build time only. A hydrated
// framework island (<astro-island>) or a React runtime chunk in dist is a budget breach.
const htmlFiles = (await walk(DIST)).filter((f) => f.endsWith('.html'));
const hydrated = [];
for (const f of htmlFiles) {
  const doc = await readFile(f, 'utf8');
  if (doc.includes('<astro-island')) hydrated.push(path.relative(DIST, f));
}
const astroJs = (await walk(path.join(DIST, '_astro'))).filter((f) => f.endsWith('.js'));
const reactChunks = astroJs
  .map((f) => path.relative(DIST, f))
  .filter((f) => /(^|\/)(react|jsx-runtime|client)\.[A-Za-z0-9_-]+\.js$/u.test(f));

const report = {
  criticalJs,
  totalCss,
  totalJs,
  embedJs,
  loaderJs,
  packs,
  files: tool.files(tool.critical),
  lazyFiles: tool.files(tool.all).filter((f) => !tool.files(tool.critical).includes(f)),
  embedFiles: embed.files(embed.all),
  embedHashed,
  hydrated,
  reactChunks,
};
process.stdout.write(`${JSON.stringify(report)}\n`);
if (
  totalJs > limits.totalJs ||
  packOver.length > 0 ||
  criticalJs > limits.criticalJs ||
  totalCss > limits.css ||
  embedJs > limits.embedJs ||
  !embedHashed ||
  loaderJs > limits.loaderJs ||
  hydrated.length > 0 ||
  reactChunks.length > 0
) {
  process.exitCode = 1;
}
