// Remove built JS chunks that no page or chunk references.
// @astrojs/react emits its client renderer entry even when nothing hydrates
// (docs/03-architecture.md ADR-013: shadcn/ui renders at build time only), so that
// chunk is dead weight in dist. Anything a page or another chunk references is kept.
import { readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = process.env.AT_DIST
  ? `${path.resolve(process.env.AT_DIST)}/`
  : fileURLToPath(new URL('../dist/', import.meta.url));

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

const files = await walk(DIST);
const chunks = files.filter((f) => f.startsWith(path.join(DIST, '_astro')) && f.endsWith('.js'));
const referrers = files.filter((f) => /\.(html|js|mjs|webmanifest|json)$/u.test(f));
const corpus = new Map();
for (const f of referrers) corpus.set(f, await readFile(f, 'utf8'));

const removed = [];
for (const chunk of chunks) {
  const name = path.basename(chunk);
  let referenced = false;
  for (const [f, text] of corpus) {
    if (f !== chunk && text.includes(name)) {
      referenced = true;
      break;
    }
  }
  if (!referenced) {
    await rm(chunk);
    removed.push(path.relative(DIST, chunk));
  }
}
process.stdout.write(`${JSON.stringify({ prunedUnreferencedChunks: removed })}\n`);
