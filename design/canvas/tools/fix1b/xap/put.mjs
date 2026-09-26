// usage: node put.mjs File startMarker endMarker SNIPKEY  (replaces from startMarker through endMarker inclusive)
import { readFileSync, writeFileSync } from 'node:fs';
const [,, file, start, end, key] = process.argv;
const P = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const sn = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'))[key];
let src = readFileSync(P + file, 'utf8');
const i = src.indexOf(start);
if (i < 0) throw new Error('start not found');
const j = src.indexOf(end, i);
if (j < 0) throw new Error('end not found');
src = src.slice(0, i) + sn + src.slice(j + end.length);
writeFileSync(P + file, src);
console.log('replaced', key, 'at', i);
