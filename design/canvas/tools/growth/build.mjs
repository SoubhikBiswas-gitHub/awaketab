// Build every Growth board and its wrappers into the canvas project folder.
import { writeFileSync } from 'node:fs';
import { page, wrapper, PROJECT } from './common.mjs';

export const BOARDS = ['b1-firstvisit', 'b2-trust', 'b3-done', 'b4-paused', 'b5-promoment', 'b6-planhelper', 'b7-share', 'b8-b2b'];
const only = process.argv[2];
const mods = [];
for (const b of BOARDS) {
  try { mods.push(await import('./' + b + '.mjs')); } catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
}
for (const m of mods) {
  if (only && m.name !== only) continue;
  const html = page({ title: m.title, props: m.props, markup: m.markup, logic: m.logic, preview: { width: 390, height: m.heights.phone } });
  writeFileSync(new URL(m.name + '.dc.html', PROJECT), html);
  for (const [file, t, p, w, h] of m.wrappers) writeFileSync(new URL(file + '.dc.html', PROJECT), wrapper(m.name, t, p, w, h));
  console.log('wrote', m.name, '+', m.wrappers.length, 'wrappers');
}
