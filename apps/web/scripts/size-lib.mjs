// Pure helpers for scripts/size.mjs (unit-tested in size.test.ts).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

// `from"./x.js"` / `import"./x.js"` — static edges: the chunk loads before the importer runs.
export const STATIC_IMPORT = /\b(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/gu;
// `import("./x.js")` — dynamic edges: the chunk loads on first use (lazy tool modules).
export const DYNAMIC_IMPORT = /\bimport\s*\(\s*["'](\.{1,2}\/[^"']+\.js)["']\s*\)/gu;

export const gz = (buf) => gzipSync(buf, { level: 9 }).byteLength;

export function entryScripts(html) {
  const tags = [...html.matchAll(/<script\b[^>]*>/gu)].map((m) => m[0]);
  const srcs = tags
    .filter((tag) => /\btype="module"/u.test(tag))
    .map((tag) => /\bsrc="(?<src>[^"]+)"/u.exec(tag)?.groups?.src ?? '');
  // Entry scripts that defer-main.mjs moved onto [data-main] (src/boot/boot.js starts them after the first paint).
  for (const m of html.matchAll(/<[a-z]+\b[^>]*\bdata-main="(?<src>[^"]+)"/gu)) srcs.push(m.groups?.src ?? '');
  return [...new Set(srcs.filter((s) => s.startsWith('/') && !s.startsWith('//') && s.endsWith('.js')))];
}

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

export function embedEntryHashed(html, pattern) {
  const entries = entryScripts(html);
  return entries.length === 1 && pattern.test(entries[0] ?? '');
}
