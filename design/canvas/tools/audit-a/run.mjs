// Usage: node run.mjs jobs.json outdir [--noshot]
// jobs: [{id, file, props, patch, W, H, scheme}]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/Users/soubhik/Work/github/awaketab/package.json');
const { chromium } = require('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright');
const sharp = require('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const HERE = new URL('.', import.meta.url).pathname;
const DIR = process.env.DCDIR || '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const [jobsFile, outDir] = process.argv.slice(2);
const noshot = process.argv.includes('--noshot');
mkdirSync(outDir + '/res', { recursive: true });
mkdirSync(outDir + '/png', { recursive: true });
const jobs = JSON.parse(readFileSync(jobsFile, 'utf8'));
const files = {};
for (const f of readdirSync(DIR)) if (f.endsWith('.dc.html')) files[f.replace('.dc.html', '')] = readFileSync(DIR + f, 'utf8');
const inpage = readFileSync(HERE + 'inpage.js', 'utf8');

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const over = (fg, a, bg) => [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));

const browser = await chromium.launch();
const ctxs = {};
const summary = [];
for (const job of jobs) {
  const scheme = job.scheme || 'dark';
  const key = scheme;
  if (!ctxs[key]) ctxs[key] = await browser.newContext({ colorScheme: scheme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctxs[key].newPage({});
  await page.setViewportSize({ width: job.W, height: job.H });
  await page.clock.setFixedTime(new Date(job.time || '2026-09-26T21:12:00'));
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
  await page.addScriptTag({ content: inpage });
  const errors = await page.evaluate(({ files, name, props, patch }) => window.__render(files, name, props, patch), { files, name: job.file.replace('.dc.html', ''), props: job.props || {}, patch: job.patch || null });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  await page.waitForTimeout(job.wait ?? 250);
  const res = await page.evaluate((o) => window.__audit(o), { W: job.W, H: job.H });
  res.errors = errors;
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: job.W, height: job.H } });
  if (!noshot) writeFileSync(outDir + '/png/' + job.id + '.png', buf);
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { x = Math.max(0, Math.min(info.width - 1, Math.round(x))); y = Math.max(0, Math.min(info.height - 1, Math.round(y))); const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
  res.lowContrast = [];
  for (const t of res.texts) {
    if (t.occluded || !t.color || t.color.a === 0 || t.op < 0.05) continue;
    const a = t.color.a * t.op;
    const fgc = [t.color.r, t.color.g, t.color.b];
    const large = t.fs >= 24 || (t.fs >= 18.66 && t.fw >= 700);
    const need = large ? 3 : 4.5;
    let worst = Infinity, worstBg = null;
    for (const [x, y, w, h] of t.lineRects) {
      if (x + w < 0 || y + h < 0 || x > job.W || y > job.H) continue;
      const samples = [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2], [x - 1, y + h / 2], [x + w + 1, y + h / 2]];
      // mode of the interior (quantised)
      const hist = new Map();
      const step = Math.max(1, Math.floor(Math.min(w, h) / 12));
      for (let yy = y; yy < y + h; yy += step) for (let xx = x; xx < x + w; xx += step) { const p = px(xx, yy); const k = (p[0] >> 3) + ',' + (p[1] >> 3) + ',' + (p[2] >> 3); const e = hist.get(k); if (e) e.n++; else hist.set(k, { n: 1, p }); }
      const mode = [...hist.values()].sort((m, n) => n.n - m.n)[0].p;
      const cands = [mode, ...samples.map(([sx, sy]) => px(sx, sy))];
      const vals = cands.map((bg) => ({ bg, c: cr(over(fgc, a, bg), bg) }));
      const good = vals.filter((v) => v.c >= 1.25);
      const use = good.length >= 2 ? good : vals;
      // use mode unless it's text-like; else the median of remaining
      const modeC = vals[0].c >= 1.25 ? vals[0] : null;
      const sorted = use.map((v) => v).sort((m, n) => m.c - n.c);
      const pick = modeC && modeC.c < sorted[Math.floor(sorted.length / 2)].c ? modeC : sorted[Math.floor(sorted.length / 2)];
      const conservative = Math.min(pick.c, modeC ? modeC.c : pick.c);
      if (conservative < worst) { worst = conservative; worstBg = pick.bg; }
    }
    if (worst < need) res.lowContrast.push({ file: t.file, text: t.text, ratio: +worst.toFixed(2), need, fg: '#' + fgc.map((v) => v.toString(16).padStart(2, '0')).join('') + (a < 1 ? '@' + a.toFixed(2) : ''), bg: worstBg && '#' + worstBg.map((v) => v.toString(16).padStart(2, '0')).join(''), fs: t.fs, ariaHidden: t.ariaHidden, clipPath: t.clipPath });
  }
  res.inputContrast = [];
  for (const i of res.inputs) {
    const [x, y, w, h] = i.rect;
    const outside = px(x - 3, y + h / 2), inside = px(x + 5, y + h / 2);
    const b = i.border && i.bw > 0 ? over([i.border.r, i.border.g, i.border.b], i.border.a, outside) : outside;
    const c = Math.max(cr(b, outside), cr(inside, outside));
    if (c < 3 && !['checkbox', 'radio', 'range'].includes(i.type)) res.inputContrast.push({ file: i.file, el: i.el, ratio: +c.toFixed(2) });
  }
  delete res.texts; delete res.inputs;
  writeFileSync(outDir + '/res/' + job.id + '.json', JSON.stringify({ job, res }, null, 1));
  const n = (k) => res[k].length;
  summary.push({ id: job.id, textOverlap: n('textOverlap'), overflow: n('overflow'), textClip: n('textClip'), overlap: n('overlap'), occluded: n('occluded'), targets: n('targets'), lowContrast: n('lowContrast'), inputContrast: n('inputContrast'), times: n('times'), emdash: n('emdash'), errors: errors.length, docSW: res.docScroll.sw, contentBottom: res.contentBottom });
  await page.close();
}
await browser.close();
writeFileSync(outDir + '/summary.json', JSON.stringify(summary, null, 0));
console.log('done', summary.length);
