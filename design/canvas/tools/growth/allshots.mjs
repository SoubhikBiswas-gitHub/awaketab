// Render every Growth wrapper at its canvas size through shots.mjs.
import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dir } from '../directions/ProLib.mjs';
const jobs = [];
for (const f of readdirSync(dir).filter((x) => x.startsWith('Growth') && x.endsWith('.dc.html'))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  const m = src.match(/<dc-import name="(\w+)"([^>]*)hint-size/);
  if (!m) continue;
  const props = {};
  for (const [, k, v] of m[2].matchAll(/(\w+)="([^"]*)"/g)) props[k] = v;
  jobs.push({ file: m[1] + '.dc.html', props, out: f.replace('.dc.html', '') });
}
process.stdout.write(execFileSync(process.execPath, ['shots.mjs', JSON.stringify(jobs)], { encoding: 'utf8' }));
