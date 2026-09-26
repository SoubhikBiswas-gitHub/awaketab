// Extract primitive snippets from PRIMITIVES.md; with a file arg, report which snippets appear verbatim (trimmed per line) in it.
import { readFileSync } from 'node:fs';
const md = readFileSync(new URL('../PRIMITIVES.md', import.meta.url), 'utf8');
const out = {};
for (const sec of md.split(/^## /m).slice(1)) {
  const name = sec.split(/[\s(]/)[0];
  const blocks = [...sec.matchAll(/```(\w+)\n([\s\S]*?)```/g)];
  blocks.forEach((b, i) => { out[name + (i ? '#' + i : '') + ':' + b[1]] = b[2]; });
}
const f = process.argv[2];
if (!f) { for (const [k, v] of Object.entries(out)) console.log('=====', k, '\n' + v); process.exit(0); }
const src = readFileSync(f, 'utf8');
const norm = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const srcLines = norm(src).join('\n');
for (const [k, v] of Object.entries(out)) {
  const lines = norm(v);
  // check every line with a tag individually and contiguous
  const whole = srcLines.includes(lines.join('\n'));
  const each = lines.map((l) => srcLines.includes(l));
  console.log(k.padEnd(18), whole ? 'VERBATIM' : 'lines ' + each.filter(Boolean).length + '/' + lines.length);
}
