// Smoke test for Intl.dc.html and A11y.dc.html (+ their wrappers):
// every {{hole}} resolves for every prop combination, handlers run, tags balance.
// Usage: node IntlA11y-smoke.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { load, missing, balance } from './ProLib.mjs';

const combos = (spec) => Object.entries(spec).reduce((acc, [k, vs]) => acc.flatMap((a) => vs.map((v) => ({ ...a, [k]: v }))), [{}]);
let total = 0, bad = 0, runs = 0;
const report = [];

function check(file, spec, exercise) {
  const { Component, markup } = load(file);
  const off = balance(file);
  if (off.length) { console.log(file, 'UNBALANCED', off.join(', ')); bad++; }
  for (const props of combos(spec)) {
    const c = new Component(props);
    const v = c.renderVals();
    const miss = missing(markup, v);
    runs++;
    total += 1;
    if (miss.length) { bad += miss.length; if (report.length < 30) report.push(file + ' ' + JSON.stringify(props) + ' missing ' + miss.join(',')); }
    if (exercise) exercise(c, v);
  }
}

const fns = (c, v) => {
  for (const [k, f] of Object.entries(v)) if (typeof f === 'function') { try { f({ target: { value: '10' }, preventDefault() {} }); } catch (e) { bad++; report.push('handler ' + k + ' threw ' + e.message); } }
  for (const list of Object.values(v)) if (Array.isArray(list)) for (const it of list) if (it && typeof it === 'object') for (const f of Object.values(it)) if (typeof f === 'function') { try { f(); } catch (e) { bad++; report.push('item handler threw ' + e.message); } }
  const v2 = c.renderVals();
  if (!v2) bad++;
};

check('Intl.dc.html', {
  lang: ['de', 'es', 'pt-br', 'fr', 'ja', 'zh', 'hi'], layout: ['phone', 'tablet', 'desktop'], theme: ['light', 'dark', 'auto'],
  status: ['ready', 'starting', 'awake', 'paused', 'blocked', 'needtap', 'fallback'], screen: ['tool', 'article'], banner: ['none', 'review', 'suggest', 'both'], qa: [true, false]
}, fns);

if (readdirSync(new URL('./project/', import.meta.url)).includes('A11y.dc.html')) {
  check('A11y.dc.html', {
    mode: ['keyboard', 'forced', 'zoom', 'reduced', 'nojs', 'screenreader'], theme: ['light', 'dark', 'auto'], layout: ['phone', 'desktop'], variant: ['text200', 'reflow320']
  }, fns);
}

// Wrappers: each must mount an existing file with a matching hint-size.
const dir = new URL('./project/', import.meta.url);
for (const f of readdirSync(dir).filter((f) => /^(Intl|A11y)\w+\.dc\.html$/.test(f))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  const m = src.match(/<dc-import name="(\w+)"[^>]*hint-size="(\d+)px,(\d+)px"><\/dc-import>/);
  const root = src.match(/<div style="width: (\d+)px; height: (\d+)px">/);
  if (!m || !root || m[2] !== root[1] || m[3] !== root[2]) { bad++; report.push('wrapper ' + f + ' malformed'); continue; }
  if (!readdirSync(dir).includes(m[1] + '.dc.html')) { bad++; report.push('wrapper ' + f + ' mounts missing ' + m[1]); }
}

console.log(report.join('\n'));
console.log('prop combinations rendered:', runs, '| missing holes / errors:', bad);
process.exit(bad ? 1 : 0);
