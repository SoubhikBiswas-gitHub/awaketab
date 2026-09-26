// Render .dc.html boards in Chromium (full runtime incl. dc-import + componentDidMount) and run audit checks.
// usage: node audit.mjs jobs.json out.json [shotDir]
// job: { id, file, props, w, scheme, shot:true|false, actions:[{click:selector}|{wait:ms}] }
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/Users/soubhik/Work/github/awaketab/package.json');
const { chromium } = require('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright');
const HERE = new URL('.', import.meta.url).pathname;
const DIR = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const [jobsPath, outPath, shotDir = HERE + 'shots/'] = process.argv.slice(2);
mkdirSync(shotDir, { recursive: true });
const jobs = JSON.parse(readFileSync(jobsPath, 'utf8'));
const files = {};
for (const f of readdirSync(DIR)) if (f.endsWith('.dc.html')) files[f.replace('.dc.html', '')] = readFileSync(DIR + f, 'utf8');
const runtime = readFileSync(HERE + 'runtime.js', 'utf8');
const checks = readFileSync(HERE + 'checks.js', 'utf8');
const browser = await chromium.launch();
const results = [];
const conc = Number(process.env.CONC || 4);
let qi = 0;
async function worker() {
  while (qi < jobs.length) {
    const job = jobs[qi++];
    try { await runJob(job); } catch (e) { results.push({ id: job.id, file: job.file, props: job.props, failed: String(e.message).slice(0, 200) }); process.stderr.write('x'); }
  }
}
async function runJob(job) {
  {
    const ctx = await browser.newContext({ viewport: { width: job.w, height: job.h || 1000 }, colorScheme: job.scheme || 'dark', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(job.time || '2026-09-26T21:04:00'));
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"><div id="app"></div></body></html>');
    await page.evaluate((f) => { window.__FILES = f; }, files);
    await page.addScriptTag({ content: runtime });
    await page.addScriptTag({ content: checks });
    await page.evaluate(({ name, props }) => window.__dc.mount(name, props), { name: job.file.replace('.dc.html', ''), props: job.props || {} });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(job.wait ?? 1200);
    for (const a of job.actions || []) {
      if (a.click) await page.click(a.click);
      if (a.wait) await page.waitForTimeout(a.wait);
      if (a.eval) await page.evaluate(a.eval);
    }
    await page.evaluate(() => { window.__freeze = true; });
    const size = await page.evaluate(() => { const r = document.getElementById('app').firstElementChild.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
    const H = Math.min(size.h || 800, 8000);
    await page.setViewportSize({ width: Math.max(job.w, size.w), height: H });
    await page.waitForTimeout(150);
    if (job.shot !== false) {
      const seg = Number(process.env.SEG || 0);
      if (seg && H > seg * 1.2) { for (let y = 0, i = 0; y < H; y += seg, i++) await page.screenshot({ path: shotDir + job.id + '-' + i + '.png', clip: { x: 0, y, width: size.w, height: Math.min(seg, H - y) } }); }
      else await page.screenshot({ path: shotDir + job.id + '.png', clip: { x: 0, y: 0, width: size.w, height: H } });
    }
    await page.addStyleTag({ content: '*{pointer-events:auto!important}' });
    const audit = await page.evaluate(({ w, h }) => window.__audit(w, h), { w: size.w, h: H });
    // pixel verification of flagged contrast: hide the text, sample the real background pixels
    for (const e of [...audit.contrast, ...(audit.transient || [])]) {
      if (!e.rect) continue;
      const [x, y, w, h] = e.rect.map(Math.round);
      if (w < 1 || h < 1) continue;
      await page.evaluate((id) => { const el = document.querySelector('[data-audit-id="' + id + '"]'); if (!el) return; el.dataset.oc = el.style.color; el.style.setProperty('color', 'transparent', 'important'); el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important'); el.style.setProperty('text-shadow', 'none', 'important'); }, e.id);
      const buf = await page.screenshot({ clip: { x: Math.max(0, x), y: Math.max(0, y), width: Math.max(1, w), height: Math.max(1, h) } });
      e.pixel = await page.evaluate(async ({ b64, fg }) => {
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const bmp = await createImageBitmap(new Blob([bin], { type: 'image/png' }));
        const cv = new OffscreenCanvas(bmp.width, bmp.height); const cx = cv.getContext('2d'); cx.drawImage(bmp, 0, 0);
        const d = cx.getImageData(0, 0, bmp.width, bmp.height).data;
        const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
        const rs = [];
        for (let i = 0; i < d.length; i += 4 * 3) { const b = [d[i], d[i + 1], d[i + 2]]; const a = fg[3]; const f = [fg[0] * a + b[0] * (1 - a), fg[1] * a + b[1] * (1 - a), fg[2] * a + b[2] * (1 - a)]; const x = lum(f), y = lum(b); rs.push((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)); }
        rs.sort((p, q) => p - q);
        return { p10: +rs[Math.floor(rs.length * 0.1)].toFixed(2), median: +rs[Math.floor(rs.length / 2)].toFixed(2) };
      }, { b64: buf.toString('base64'), fg: e.fgRaw });
      await page.evaluate((id) => { const el = document.querySelector('[data-audit-id="' + id + '"]'); if (!el) return; el.style.color = el.dataset.oc; el.style.removeProperty('-webkit-text-fill-color'); el.style.removeProperty('text-shadow'); }, e.id);
    }
    const dc = await page.evaluate(() => ({ missing: [...window.__dc.missing], errors: window.__dc.errors }));
    results.push({ id: job.id, file: job.file, props: job.props, scheme: job.scheme, size, errs, dc, audit });
    process.stderr.write('.');
    await ctx.close();
  }
}
await Promise.all(Array.from({ length: conc }, worker));
await browser.close();
results.sort((a, b) => jobs.findIndex((j) => j.id === a.id) - jobs.findIndex((j) => j.id === b.id));
writeFileSync(outPath, JSON.stringify(results, null, 1));
console.log('\nwrote', results.length);
