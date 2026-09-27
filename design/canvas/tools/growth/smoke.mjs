// Smoke test for the Growth boards: every {{hole}} resolves for every prop combination,
// markup tags balance, handlers run without throwing, wrappers point at a real base with real props.
import { readFileSync, readdirSync } from 'node:fs';
import { load, missing, balance, dir } from '../directions/ProLib.mjs';
// P-LANG handlers focus rows through document (browser only); a stub keeps them callable here.
globalThis.document = globalThis.document ?? { querySelector: () => ({ focus() {} }), querySelectorAll: () => [], activeElement: null };

const files = readdirSync(dir).filter((f) => f.startsWith('Growth') && f.endsWith('.dc.html'));
const bases = files.filter((f) => /data-props='\{"theme"/.test(readFileSync(new URL(f, dir), 'utf8')));
let totalMissing = 0, combos = 0, handlerCalls = 0, errors = 0;
const product = (lists) => lists.reduce((acc, [k, vs]) => acc.flatMap((a) => vs.map((v) => ({ ...a, [k]: v }))), [{}]);

for (const f of bases) {
  const { src, Component, markup } = load(f);
  const schema = JSON.parse(src.split("data-props='")[1].split("'>")[0]);
  const enums = Object.entries(schema).filter(([k, v]) => v && v.editor === 'enum').map(([k, v]) => [k, v.options]);
  const off = balance(f);
  if (off.length) { console.log('UNBALANCED', f, off.join(', ')); errors++; }
  const mainTag = (markup.match(/<main\b/g) || []).length - (markup.match(/<\/main>/g) || []).length;
  const olTag = (markup.match(/<ol\b/g) || []).length - (markup.match(/<\/ol>/g) || []).length;
  if (mainTag || olTag) { console.log('UNBALANCED main/ol', f); errors++; }
  let fm = 0;
  for (const props of product(enums)) {
    combos++;
    const c = new Component(props);
    let v = c.renderVals();
    const miss = missing(markup, v);
    if (miss.length) { fm += miss.length; if (fm < 12) console.log('missing', f, JSON.stringify(props), miss.join(', ')); }
    // Exercise every handler once (top level and inside lists), re-rendering after each.
    const fns = [];
    for (const [k, val] of Object.entries(v)) {
      if (typeof val === 'function') fns.push([k, val]);
      if (Array.isArray(val)) val.forEach((it, i) => it && typeof it === 'object' && Object.entries(it).forEach(([kk, vv]) => typeof vv === 'function' && fns.push([k + '[' + i + '].' + kk, vv])));
      if (val && typeof val === 'object' && !Array.isArray(val)) Object.entries(val).forEach(([kk, vv]) => typeof vv === 'function' && fns.push([k + '.' + kk, vv]));
    }
    for (const [k, fn] of fns) {
      try { fn({ target: { value: 'Back at 11:30 AM', checked: true } }); handlerCalls++; const v2 = c.renderVals(); const m2 = missing(markup, v2); if (m2.length) { fm += m2.length; if (fm < 12) console.log('missing after', k, f, m2.join(', ')); } }
      catch (e) { errors++; console.log('handler threw', f, k, e.message); }
      (c.timers || []).forEach((x) => clearTimeout(x));
    }
    try { c.tick(); c.renderVals(); } catch (e) { errors++; console.log('tick threw', f, e.message); }
  }
  totalMissing += fm;
  console.log(f.padEnd(34), 'combos', product(enums).length, 'missing', fm);
}
// Wrappers: base exists and every prop value is a declared option.
let wrappers = 0;
for (const f of files.filter((x) => !bases.includes(x))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  const m = src.match(/<dc-import name="(\w+)"([^>]*)hint-size/);
  if (!m) { console.log('NO IMPORT', f); errors++; continue; }
  const base = m[1] + '.dc.html';
  if (!bases.includes(base)) { console.log('BAD BASE', f, base); errors++; continue; }
  const schema = JSON.parse(readFileSync(new URL(base, dir), 'utf8').split("data-props='")[1].split("'>")[0]);
  for (const [, k, v] of m[2].matchAll(/(\w+)="([^"]*)"/g)) {
    if (!schema[k] || (schema[k].options && !schema[k].options.includes(v))) { console.log('BAD PROP', f, k, v); errors++; }
  }
  wrappers++;
}
setTimeout(() => {
  console.log(`\nbases ${bases.length} · wrappers ${wrappers} · prop combos ${combos} · handler calls ${handlerCalls} · missing holes ${totalMissing} · errors ${errors}`);
  process.exit(totalMissing || errors ? 1 : 0);
}, 10);
