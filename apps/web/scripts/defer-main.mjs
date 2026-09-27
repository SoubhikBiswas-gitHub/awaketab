// Moves module entry <script type="module"> tags onto a [data-main] attribute of the element they run, in every
// built page, so the inline boot script (src/boot/boot.js) starts them after the first paint instead of the parser
// running them before (docs/00 §11 LCP lab ≤ 1.2 s; docs/05 §13). Runs after prune-unreferenced.mjs, which still
// sees the tags. The tool island is on every tool page; the content-page script is on /for, /on, /vs, /guides, /learn.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = process.env.AT_DIST
  ? path.resolve(process.env.AT_DIST)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist');

export const DEFERRED = [
  {
    entry: /<script type="module" src="(\/_astro\/ToolIsland[^"]+\.js)"><\/script>/u,
    root: /<div id="awaketab-tool"(?![^>]*data-main)/u,
  },
  {
    entry: /<script type="module" src="(\/_astro\/ContentLayout[^"]+\.js)"><\/script>/u,
    root: /<main class="at-cp"(?![^>]*data-main)/u,
  },
];

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(target)));
    else if (entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

export function deferMain(html) {
  let out = html;
  for (const { entry, root } of DEFERRED) {
    const tag = entry.exec(out);
    const at = root.exec(out);
    if (!tag || !at) continue;
    out = out.replace(tag[0], '').replace(root, () => `${at[0]} data-main="${tag[1]}"`);
  }
  return out === html ? null : out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let pages = 0;
  let tool = 0;
  for (const file of await htmlFiles(DIST)) {
    const next = deferMain(await readFile(file, 'utf8'));
    if (next === null) continue;
    await writeFile(file, next);
    pages += 1;
    if (next.includes('<div id="awaketab-tool" data-main=')) tool += 1;
  }
  if (tool === 0) throw new Error('defer-main: no page carried the tool entry script');
  process.stdout.write(`${JSON.stringify({ deferredMain: pages, toolPages: tool })}\n`);
}
