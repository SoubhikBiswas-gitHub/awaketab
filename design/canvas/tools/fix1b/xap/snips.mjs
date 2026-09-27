// Extract primitives from PRIMITIVES.md into a JSON map for patching and verification.
import { readFileSync, writeFileSync } from 'node:fs';
const md = readFileSync(new URL('../PRIMITIVES.md', import.meta.url), 'utf8');
const out = {};
const re = /^## (P-[A-Z-]+|JS constants)[^\n]*\n([\s\S]*?)(?=^## |\Z)/gm;
let m;
while ((m = re.exec(md))) {
  const body = m[2];
  const f = /```(?:html|js)\n([\s\S]*?)\n```/.exec(body);
  if (f) out[m[1]] = f[1];
}
writeFileSync(new URL('./snips.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(Object.keys(out));
