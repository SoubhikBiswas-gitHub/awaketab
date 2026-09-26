import { BOARDS } from './build.mjs';
const out = {};
for (const b of BOARDS) {
  const m = await import('./' + b + '.mjs');
  out[m.name + '.dc.html'] = { w: 390, h: m.heights.phone, title: '▶ ' + m.title + ' · play me', is_interactive: true };
  for (const [f, t, , w, h] of m.wrappers) out[f + '.dc.html'] = { w, h, title: t, is_interactive: true };
}
console.log(JSON.stringify(out));
