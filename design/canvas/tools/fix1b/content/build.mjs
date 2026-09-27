// Build the three content boards from src/*.src.html, pasting the fix-1b primitives verbatim.
import { readFileSync, writeFileSync } from 'node:fs';
const S = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'));
const D = '/home/user/awaketab/design/canvas/project/';
const trim = (s) => s.replace(/\s+$/, '');
const cardOpen = S['P-CARD'].split('>')[0] + '>';
const map = {
  '@@JS@@': trim(S['JS constants']),
  '@@P-HEADER@@': trim(S['P-HEADER']),
  '@@P-THEME@@': trim(S['P-THEME']),
  '@@P-PILL-M@@': trim(S['P-PILL-M']),
  '@@P-FOOTER@@': trim(S['P-FOOTER']),
  '@@P-NOTE@@': trim(S['P-NOTE']),
  '@@P-CARD@@': cardOpen
};
const SZ = JSON.parse(readFileSync(new URL('./sizes.json', import.meta.url), 'utf8'));
for (const name of process.argv.slice(2)) {
  let src = readFileSync(new URL('./src/' + name + '.src.html', import.meta.url), 'utf8');
  const z = SZ[name];
  src = src.split('@@PH@@').join(String(z.phone)).split('@@TH@@').join(String(z.tablet)).split('@@DH@@').join(String(z.desktop));
  for (const [k, v] of Object.entries(map)) src = src.split(k).join(v);
  src = src.replace(/@@KICKER:([^@]+)@@/g, (_, t) => trim(S['P-KICKER']).replace('>Kicker<', '>' + t + '<'));
  src = src.replace(/@@KBD:([^@]+)@@/g, (_, t) => trim(S['P-KBD']).replace('>K<', '>' + t + '<'));
  src = src.replace(/@@CODE:([^@]+)@@/g, (_, t) => trim(S['P-CODE']).replace('>x<', '>' + t + '<'));
  const left = src.match(/@@[^@\s]+@@/g);
  if (left) { console.error('unreplaced', name, left); process.exit(1); }
  writeFileSync(D + name + '.dc.html', src);
  console.log('built', name, src.length);
}
