import { readFileSync } from 'node:fs';
const pb = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let tot = {}, all = 0;
const rows = [];
for (const [b, c] of Object.entries(pb).sort()) { const n = Object.values(c).reduce((a, x) => a + x, 0); all += n; for (const [k, v] of Object.entries(c)) tot[k] = (tot[k] ?? 0) + v; rows.push(b + ' ' + n + ' ' + JSON.stringify(c)); }
console.log(rows.join('\n')); console.log('TOTAL', all, JSON.stringify(tot));
