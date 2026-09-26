// Render Main.dc.html statically at its fixed board size, flag clipped/overflowing content, save PNGs.
// Usage: node SizeShot.mjs '[{"name":"x","props":{...},"patch":{...}}]' [outDir]
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { load, toHtml } from './ProLib.mjs';
const require = createRequire('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');

const jobs = JSON.parse(process.argv[2]);
const out = process.argv[3] ?? new URL('./shots/size/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const job of jobs) {
  const { Component } = load('Main.dc.html');
  const c = new Component(job.props);
  if (job.patch) Object.assign(c.state, job.patch);
  const vals = c.renderVals();
  const esc = (v) => (typeof v === 'string' ? v.replace(/"/g, '&quot;') : Array.isArray(v) ? v.map(esc) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, esc(x)])) : v);
  const html = toHtml('Main.dc.html', esc(vals)).replace('.at-root{height:auto!important}', '');
  const tmp = out + job.name + '.html';
  writeFileSync(tmp, html);
  const w = parseInt(vals.W, 10), h = parseInt(vals.H, 10);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('file://' + tmp);
  await page.waitForTimeout(job.wait ?? 500);
  const issues = await page.evaluate(() => {
    const root = document.querySelector('.at-root');
    const R = root.getBoundingClientRect();
    const out = [];
    const skip = (e) => e.closest('[aria-hidden="true"]') || e.closest('[role="dialog"]') || e.closest('.at-sr');
    for (const e of root.querySelectorAll('button, output, p, time, input, [role="timer"], label, a, span')) {
      if (skip(e)) continue;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.bottom > R.bottom + 0.5 || r.right > R.right + 0.5 || r.left < R.left - 0.5 || r.top < R.top - 0.5) out.push('OUT ' + e.tagName + ':' + (e.textContent || e.value || '').trim().slice(0, 28) + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + '-' + Math.round(r.right) + ',' + Math.round(r.bottom));
      if (e.tagName === 'BUTTON' && (r.height < 43.5 || r.width < 43.5)) out.push('SMALL ' + (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 24) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if ((e.tagName === 'BUTTON' || e.tagName === 'OUTPUT' || e.tagName === 'P' || e.tagName === 'SPAN') && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') out.push('CLIP ' + e.textContent.trim().slice(0, 28));
    }
    // Text wider than its button (nowrap overflow).
    for (const b of root.querySelectorAll('button')) {
      if (skip(b)) continue;
      const range = document.createRange(); range.selectNodeContents(b);
      const tr = range.getBoundingClientRect(), br = b.getBoundingClientRect();
      if (tr.width > br.width + 1) out.push('TEXTWIDE ' + b.textContent.trim().slice(0, 28) + ' ' + Math.round(tr.width) + '>' + Math.round(br.width));
    }
    const dock = [...root.querySelectorAll('button')].filter((b) => !skip(b)).reduce((m, b) => Math.max(m, b.getBoundingClientRect().bottom), 0);
    return { issues: [...new Set(out)], dockGap: Math.round(R.bottom - dock) };
  });
  console.log(job.name, w + 'x' + h, 'bottom gap', issues.dockGap, issues.issues.length ? '\n   ' + issues.issues.join('\n   ') : 'ok');
  await page.screenshot({ path: out + job.name + '.png' });
  await page.close();
}
await browser.close();
