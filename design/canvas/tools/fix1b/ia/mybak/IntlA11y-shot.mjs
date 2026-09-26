// Render Intl/A11y boards statically in Chromium, report overflow (horizontal clipping inside controls,
// content past the right edge, content past the bottom of fixed-height boards) and take screenshots.
// Usage: node IntlA11y-shot.mjs '<jobs json>'   job: {file, props, out?, natural?}
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { load, toHtml } from './ProLib.mjs';
const require = createRequire('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');

const jobs = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
for (const job of jobs) {
  const { Component } = load(job.file);
  const c = new Component(job.props);
  const vals = c.renderVals();
  let html = toHtml(job.file, vals);
  if (!job.natural) html = html.replace('.at-root{height:auto!important}', '');
  html = html.replace('<html lang="en">', '<html lang="' + (vals.htmlLang || 'en') + '">');
  const tmp = new URL('./.intl-render.html', import.meta.url);
  writeFileSync(tmp, html);
  const w = parseInt(vals.W, 10) || 1280;
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: 'dark' });
  await page.goto(tmp.href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(job.wait ?? 400);
  const res = await page.evaluate(() => {
    const root = document.querySelector('.at-root');
    const R = root.getBoundingClientRect();
    const out = [];
    for (const e of root.querySelectorAll('button, a, output, p, span, h1, h2, time, li, div')) {
      const cs = getComputedStyle(e);
      if (cs.position === 'absolute' || cs.display === 'none' || e.closest('[aria-hidden="true"]')) continue;
      const r = e.getBoundingClientRect();
      if (!r.width) continue;
      const clipped = (e.tagName === 'BUTTON' || e.tagName === 'OUTPUT' || e.tagName === 'A') && e.scrollWidth > e.clientWidth + 1;
      const pastRight = r.right > R.right + 1;
      const pastBottom = r.bottom > R.bottom + 1 && !e.querySelector('*');
      if (clipped || pastRight || pastBottom) out.push((clipped ? 'CLIP ' : pastRight ? 'RIGHT ' : 'BOTTOM ') + e.tagName + ' "' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) + '" ' + Math.round(e.scrollWidth) + '/' + Math.round(e.clientWidth));
    }
    let dockBottom = 0;
    for (const b of root.querySelectorAll('main button')) dockBottom = Math.max(dockBottom, b.getBoundingClientRect().bottom);
    return { h: Math.ceil(R.height), natural: Math.ceil(root.scrollHeight), dockBottom: Math.round(dockBottom), out: [...new Set(out)].slice(0, 8) };
  });
  console.log(job.file, JSON.stringify(job.props), 'h', res.h, 'scrollH', res.natural, 'dockBottom', res.dockBottom, res.out.length ? '\n   ' + res.out.join('\n   ') : 'ok');
  if (job.out) await page.screenshot({ path: job.out, fullPage: true });
  await page.close();
}
await browser.close();
