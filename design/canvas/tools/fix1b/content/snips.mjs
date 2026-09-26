import { readFileSync, writeFileSync } from 'node:fs';
const md = readFileSync(new URL('../PRIMITIVES.md', import.meta.url), 'utf8');
const out = {};
let cur = null;
const re = /^## (P-[A-Z-]+|JS constants)[^\n]*\n([\s\S]*?)(?=^## |\Z)/gm;
for (const m of md.matchAll(re)) {
  const blocks = [...m[2].matchAll(/```(?:html|js)\n([\s\S]*?)```/g)].map((b) => b[1]);
  if (blocks.length) out[m[1]] = blocks[0];
}
writeFileSync(new URL('./snips.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(Object.keys(out));
