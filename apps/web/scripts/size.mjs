import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gz, pageJs } from './size-lib.mjs';

// AT_DIST lets parallel verification builds target their own output directory.
const DIST = process.env.AT_DIST
  ? `${path.resolve(process.env.AT_DIST)}/`
  : fileURLToPath(new URL('../dist/', import.meta.url));

// docs/00 §11 and §13.10. Tool page = dist/index.html; embed page = the /embed/cook iframe app; loader = the
// host-page script at /embed.js that sites paste (docs/11 §1).
const limits = {
  css: 20 * 1024,
  criticalJs: 15 * 1024,
  totalJs: 40 * 1024,
  embedJs: 25 * 1024,
  loaderJs: 3 * 1024,
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
const tool = await pageJs(DIST, 'index.html');
const criticalJs = tool.criticalBytes;
const totalJs = tool.totalBytes;

// Embed iframe app (docs/11 §2, ≤ 25 KB gz): same full closure, from its own page.
const embed = await pageJs(DIST, 'embed/cook/index.html');
const embedJs = embed.totalBytes;

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
  files: tool.files(tool.critical),
  lazyFiles: tool.files(tool.all).filter((f) => !tool.files(tool.critical).includes(f)),
  embedFiles: embed.files(embed.all),
  hydrated,
  reactChunks,
};
process.stdout.write(`${JSON.stringify(report)}\n`);
if (
  totalJs > limits.totalJs ||
  criticalJs > limits.criticalJs ||
  totalCss > limits.css ||
  embedJs > limits.embedJs ||
  loaderJs > limits.loaderJs ||
  hydrated.length > 0 ||
  reactChunks.length > 0
) {
  process.exitCode = 1;
}
