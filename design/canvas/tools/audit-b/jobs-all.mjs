// Jobs for every board in the project (canvas.json boards + any other .dc.html), at canvas size.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const DIR = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const canvas = JSON.parse(readFileSync(DIR + 'canvas.json', 'utf8')).boards;
const jobs = [];
const seen = new Set();
for (const [f, b] of Object.entries(canvas)) { seen.add(f); jobs.push({ id: 'A-' + f.replace('.dc.html', ''), file: f, props: {}, w: b.w, scheme: /Light/.test(f) || /light/.test(b.title) ? 'light' : 'dark', shot: false, wait: 1500 }); }
for (const f of readdirSync(DIR)) if (f.endsWith('.dc.html') && !seen.has(f)) {
  const src = readFileSync(DIR + f, 'utf8');
  const m = /"\$preview":\{"width":(\d+),"height":(\d+)\}/.exec(src);
  jobs.push({ id: 'A-' + f.replace('.dc.html', ''), file: f, props: {}, w: m ? +m[1] : 1280, scheme: /Light/.test(f) ? 'light' : 'dark', shot: false, wait: 1500, notInCanvas: true });
}
writeFileSync(process.argv[2], JSON.stringify(jobs, null, 1));
console.log(jobs.length);
