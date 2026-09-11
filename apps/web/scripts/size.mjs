import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// AT_DIST lets parallel verification builds target their own output directory.
const DIST = process.env.AT_DIST
  ? `${path.resolve(process.env.AT_DIST)}/`
  : fileURLToPath(new URL('../dist/', import.meta.url));
const limits = { css: 20 * 1024, criticalJs: 15 * 1024, totalJs: 40 * 1024 };

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

const html = await readFile(path.join(DIST, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script[^>]+src="(?<src>[^"]+)"/g)].map((m) => m.groups?.src ?? '');
const initial = [...new Set(srcs.filter((s) => s.endsWith('.js')))];
const criticalFiles = initial.filter((s) => s.includes('/_astro/'));
const gz = async (buf) => gzipSync(buf, { level: 9 }).byteLength;

let criticalJs = 0;
for (const src of criticalFiles) {
  const target = path.join(DIST, src.replace(/^\//, ''));
  criticalJs += await gz(await readFile(target));
}

const astroJs = (await walk(path.join(DIST, '_astro'))).filter((f) => f.endsWith('.js'));
let totalJs = 0;
for (const f of astroJs) totalJs += await gz(await readFile(f));

const styles = [...html.matchAll(/<style[^>]*>(?<css>.*?)<\/style>/gsu)].map((m) => m.groups?.css ?? '').join('');
const totalCss = await gz(Buffer.from(styles));

// docs/03-architecture.md ADR-013: shadcn/ui renders at build time only. A hydrated
// framework island (<astro-island>) or a React runtime chunk in dist is a budget breach.
const htmlFiles = (await walk(DIST)).filter((f) => f.endsWith('.html'));
const hydrated = [];
for (const f of htmlFiles) {
  const doc = await readFile(f, 'utf8');
  if (doc.includes('<astro-island')) hydrated.push(path.relative(DIST, f));
}
const reactChunks = astroJs
  .map((f) => path.relative(DIST, f))
  .filter((f) => /(^|\/)(react|jsx-runtime|client)\.[A-Za-z0-9_-]+\.js$/u.test(f));

const report = { criticalJs, totalCss, totalJs, files: criticalFiles, hydrated, reactChunks };
process.stdout.write(`${JSON.stringify(report)}\n`);
if (
  totalJs > limits.totalJs ||
  criticalJs > limits.criticalJs ||
  totalCss > limits.css ||
  hydrated.length > 0 ||
  reactChunks.length > 0
) {
  process.exitCode = 1;
}
