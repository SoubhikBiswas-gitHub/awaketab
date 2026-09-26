// Pure helpers for scripts/size.mjs (unit-tested in size.test.ts).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

// `from"./x.js"` / `import"./x.js"` — static edges: the chunk loads before the importer runs.
export const STATIC_IMPORT = /\b(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/gu;
// `import("./x.js")` — dynamic edges: the chunk loads on first use (lazy tool modules).
export const DYNAMIC_IMPORT = /\bimport\s*\(\s*["'](\.{1,2}\/[^"']+\.js)["']\s*\)/gu;

export const gz = (buf) => gzipSync(buf, { level: 9 }).byteLength;

/**
 * The same-origin module entry scripts a page loads with `<script type="module" src>` — Astro's `/_astro/*`
 * chunks on the tool page, `/embed/app.js` (esbuild) on /embed/cook. Classic scripts (theme-boot.js) and JSON
 * blocks are not part of the island budgets.
 */
export function entryScripts(html) {
  const tags = [...html.matchAll(/<script\b[^>]*>/gu)].map((m) => m[0]);
  const srcs = tags
    .filter((tag) => /\btype="module"/u.test(tag))
    .map((tag) => /\bsrc="(?<src>[^"]+)"/u.exec(tag)?.groups?.src ?? '');
  return [...new Set(srcs.filter((s) => s.startsWith('/') && !s.startsWith('//') && s.endsWith('.js')))];
}

/**
 * Every file reachable from `entries` (absolute paths). With `dynamic: false` only static imports are followed
 * — the critical path. With `dynamic: true` lazy `import()` edges are followed too — everything the page can
 * ever load, which is what a page's total-JS budget must measure (docs/00 §11).
 */
export async function closure(entries, { dynamic }) {
  const seen = new Set();
  const visit = async (raw) => {
    const file = path.resolve(raw);
    if (seen.has(file)) return;
    seen.add(file);
    const code = await readFile(file, 'utf8');
    const edges = [...code.matchAll(STATIC_IMPORT)];
    if (dynamic) edges.push(...code.matchAll(DYNAMIC_IMPORT));
    for (const m of edges) await visit(path.resolve(path.dirname(file), m[1]));
  };
  for (const entry of entries) await visit(entry);
  return seen;
}

export async function gzTotal(files) {
  let total = 0;
  for (const file of files) total += gz(await readFile(file));
  return total;
}

/** Static and full closures for one built page (`rel` like `index.html` or `embed/cook/index.html`). */
export async function pageJs(dist, rel) {
  const html = await readFile(path.join(dist, rel), 'utf8');
  const entries = entryScripts(html).map((src) => path.resolve(dist, src.replace(/^\//u, '')));
  const critical = await closure(entries, { dynamic: false });
  const all = await closure(entries, { dynamic: true });
  return {
    html,
    critical,
    all,
    criticalBytes: await gzTotal(critical),
    totalBytes: await gzTotal(all),
    files: (set) => [...set].map((f) => `/${path.relative(dist, f).split(path.sep).join('/')}`).sort(),
  };
}
