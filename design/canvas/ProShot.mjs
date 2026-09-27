// Render Pro boards statically in Chromium: measure natural height and take screenshots.
// Usage: node ProShot.mjs <File.dc.html> '<props json>' [out.png] [statePatch json]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { load, toHtml } from './ProLib.mjs';
const require = createRequire('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');

const jobs = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
for (const job of jobs) {
  const { Component } = load(job.file);
  const c = new Component(job.props);
  if (job.patch) Object.assign(c.state, job.patch);
  const vals = c.renderVals();
  const html = toHtml(job.file, vals);
  const tmp = new URL('./.pro-render.html', import.meta.url);
  writeFileSync(tmp, html);
  const w = parseInt(vals.W, 10);
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: 'dark' });
  await page.goto(tmp.href);
  await page.waitForTimeout(job.wait ?? 600);
  const h = await page.evaluate(() => Math.ceil(document.querySelector('.at-root').getBoundingClientRect().height));
  const over = await page.evaluate(() => {
    const root = document.querySelector('.at-root');
    const W = root.getBoundingClientRect().width;
    return [...root.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > W + 1 && getComputedStyle(e).position !== 'absolute').slice(0, 5).map((e) => e.tagName + ':' + (e.textContent || '').trim().slice(0, 30));
  });
  console.log(job.file, JSON.stringify(job.props), JSON.stringify(job.patch ?? {}), 'natural height', h, 'declared', vals.H, over.length ? 'OVERFLOW ' + over.join(' | ') : '');
  if (job.out) await page.screenshot({ path: job.out, fullPage: true });
  if (job.crops) {
    await page.setViewportSize({ width: w, height: h });
    for (const [n, [y, ch]] of job.crops.entries()) await page.screenshot({ path: job.base + '-' + n + '.png', clip: { x: 0, y, width: w, height: Math.min(ch, h - y) } });
  }
  await page.close();
}
await browser.close();
