// Moves the tool island's entry <script type="module"> onto #awaketab-tool[data-main] in every built page, so
// the inline boot script (src/boot/boot.js) starts it after the first paint instead of the parser running it
// before (docs/00 §11 LCP lab ≤ 1.2 s; docs/05 §13). Runs after prune-unreferenced.mjs, which still sees the tag.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = process.env.AT_DIST
  ? path.resolve(process.env.AT_DIST)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');

const ENTRY = /<script type="module" src="(\/_astro\/ToolIsland[^"]+\.js)"><\/script>/u;
const ROOT = /<div id="awaketab-tool"(?![^>]*data-main)/u;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(target)));
    else if (entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

/** Returns the rewritten HTML, or null when the page has no tool entry (or no island root to carry it). */
export function deferMain(html) {
  const entry = ENTRY.exec(html);
  if (!entry || !ROOT.test(html)) return null;
  return html.replace(entry[0], '').replace(ROOT, `<div id="awaketab-tool" data-main="${entry[1]}"`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let pages = 0;
  for (const file of await htmlFiles(DIST)) {
    const next = deferMain(await readFile(file, 'utf8'));
    if (next === null) continue;
    await writeFile(file, next);
    pages += 1;
  }
  if (pages === 0) throw new Error('defer-main: no page carried the tool entry script');
  process.stdout.write(`${JSON.stringify({ deferredMain: pages })}\n`);
}
