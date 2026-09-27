// Usage: node shot.mjs '[{"file":"KioskScreen.dc.html","props":{...},"out":"x.png","w":1920,"h":1080}]'
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { toPage } from './lib.mjs';
const require = createRequire('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');

const jobs = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
for (const job of jobs) {
  const { page: html } = toPage(job.file, job.props, job.patch);
  const tmp = new URL('./.render-' + Math.random().toString(36).slice(2) + '.html', import.meta.url);
  writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, colorScheme: 'dark' });
  await page.goto(tmp.href);
  await page.waitForTimeout(job.wait ?? 900);
  const info = await page.evaluate(([W, H]) => {
    const root = document.body.firstElementChild;
    const r = root.getBoundingClientRect();
    const over = [...root.querySelectorAll('*')].filter((e) => {
      const b = e.getBoundingClientRect();
      if (!b.width || !b.height) return false;
      return (b.right > W + 1 || b.bottom > H + 1) && !e.closest('[data-clip]');
    }).slice(0, 6).map((e) => e.tagName + '(' + Math.round(e.getBoundingClientRect().right) + ',' + Math.round(e.getBoundingClientRect().bottom) + '):' + (e.textContent || '').trim().slice(0, 30));
    return { w: r.width, h: r.height, scrollH: root.scrollHeight, over };
  }, [job.w, job.h]);
  console.log(job.out, JSON.stringify(info));
  await page.screenshot({ path: job.out, clip: { x: 0, y: 0, width: job.w, height: job.h } });
  const nat = await page.evaluate(() => { const r = document.body.firstElementChild; r.style.height = 'auto'; r.style.overflow = 'visible'; return Math.ceil(r.getBoundingClientRect().height); });
  console.log('   natural height', nat);
  await page.close();
  (await import('node:fs')).unlinkSync(tmp);
}
await browser.close();
