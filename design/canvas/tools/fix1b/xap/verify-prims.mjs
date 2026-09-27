import { readFileSync } from 'node:fs';
const D = '/home/user/awaketab/design/canvas/project/';
const SN = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'));
const pre = (k, cut) => SN[k].slice(0, SN[k].indexOf(cut) + cut.length);
const checks = {
  'JS constants': SN['JS constants'],
  'P-HEADER': SN['P-HEADER'],
  'P-THEME': SN['P-THEME'],
  'P-PILL-M': SN['P-PILL-M'],
  'P-TAG': SN['P-TAG'],
  'P-KBD (open tag)': pre('P-KBD', '">'),
  'P-CTA (style)': SN['P-CTA'].slice(0, SN['P-CTA'].indexOf('">') + 1),
};
for (const f of ['Extras', 'Ambient', 'PipWindow']) {
  const s = readFileSync(D + f + '.dc.html', 'utf8');
  console.log(f, Object.entries(checks).map(([k, v]) => k + ':' + (s.split(v).length - 1)).join('  '));
}
