// Usage: node shot.mjs File.dc.html layout theme [k=v ...] [--shot] [--act=fnName,fnName]
// Renders statically (root height auto), prints the natural height, optionally screenshots.
import { load, parse, render } from './dc.mjs';
import { mkdirSync } from 'node:fs';
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');

const OUT = new URL('./shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const jobs = process.argv.slice(2).join(' ').split(' | ');
const browser = await chromium.launch();
for (const job of jobs) {
  const [file, layout, theme, ...rest] = job.trim().split(/\s+/);
  const props = { layout, theme };
  let shot = false, acts = [];
  for (const r of rest) {
    if (r === '--shot') shot = true;
    else if (r.startsWith('--act=')) acts = r.slice(6).split(',');
    else { const [k, v] = r.split('='); props[k] = v; }
  }
  const { helmet, markup, Component } = load(file);
  const c = new Component(props);
  for (const a of acts) { const v = c.renderVals(); if (typeof v[a] === 'function') v[a](); else if (a.includes('.')) { const [l, i, f] = a.split('.'); v[l][Number(i)][f](); } }
  const vals = c.renderVals();
  vals.H = 'auto';
  const missing = [];
  let html = render(parse(markup), vals, missing);
  html = html.replace(/<dc-import[^>]*hint-size="([^",]+),([^"]+)"[^>]*><\/dc-import>/g, '<div style="width:$1;height:$2;background:repeating-linear-gradient(45deg,#8883 0 10px,transparent 10px 20px);border-radius:12px"></div>');
  const W = parseInt(vals.W, 10);
  const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8">${helmet}<style>*{animation:none!important;transition:none!important}</style></head><body>${html}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const h = await page.evaluate(() => Math.ceil(document.body.firstElementChild.getBoundingClientRect().height));
  const over = await page.evaluate(() => {
    const W = document.body.firstElementChild.getBoundingClientRect().width;
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 && r.width > 0 && !el.closest('[aria-hidden="true"]')) bad.push(el.tagName + ' ' + (el.textContent || '').trim().slice(0, 30) + ' right=' + Math.round(r.right));
    }
    return bad.slice(0, 6);
  });
  const name = [file.replace('.dc.html', ''), layout, theme, ...rest.filter((r) => !r.startsWith('--'))].join('_');
  console.log(name, 'height', h, 'missing', missing.length, missing.slice(0, 5).join(' ; '), over.length ? 'OVERFLOW ' + over.join(' ; ') : '');
  if (shot) await page.screenshot({ path: OUT + name + '.png', fullPage: true });
  await page.close();
}
await browser.close();
