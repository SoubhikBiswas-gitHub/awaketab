// Smoke test + optional screenshots for ExtEdge / Welcome / Sys boards.
// Usage: node ExtEdgeSmoke.mjs [shots]
import { createRequire } from 'node:module';
import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { load, missing, balance, toHtml, dir } from './ProLib.mjs';

const shots = process.argv[2] === 'shots';
const only = process.argv[3];
const combos = [];
for (const edge of ['scheduled', 'autostart', 'prolocked', 'error', 'timesup', 'update', 'incognito', 'firstopen'])
  for (const theme of ['light', 'dark'])
    for (const error of edge === 'error' ? ['denied', 'unsupported'] : ['denied'])
      combos.push(['ExtEdge.dc.html', { edge, theme, error }]);
for (const theme of ['light', 'dark']) combos.push(['Welcome.dc.html', { theme }]);
const SYS = { offline: ['phone', 'desktop'], notify: ['desktop'], tabs: ['desktop'], prolapsed: ['desktop'], checkout: ['desktop', 'phone'], update: ['desktop'], install: ['desktop', 'phone'] };
for (const [kind, layouts] of Object.entries(SYS))
  for (const layout of layouts)
    for (const theme of ['light', 'dark'])
      for (const state of kind === 'checkout' ? ['success', 'cancelled', 'failed', 'help'] : kind === 'prolapsed' ? ['grace', 'lapsed'] : ['success'])
        combos.push(['Sys.dc.html', { kind, layout, theme, state }]);

let bad = 0;
const files = [...new Set(combos.map((c) => c[0]))].filter((f) => { try { readFileSync(new URL(f, dir)); return true; } catch { return false; } });
for (const f of files) {
  const off = balance(f);
  if (off.length) { bad++; console.log('UNBALANCED', f, off.join(', ')); }
}
const jobs = [];
for (const [file, props] of combos) {
  if (!files.includes(file)) continue;
  const { Component, markup } = load(file);
  const c = new Component(props);
  let v = c.renderVals();
  const miss = missing(markup, v);
  if (miss.length) { bad += miss.length; console.log('MISSING', file, JSON.stringify(props), miss.join(', ')); }
  // Exercise every zero-arg handler once, then re-render and re-check.
  for (const [k, fn] of Object.entries(v)) {
    if (typeof fn === 'function' && fn.length === 0) { try { fn(); } catch (e) { bad++; console.log('HANDLER', file, k, e.message); } }
  }
  for (let i = 0; i < 3; i++) c.tick?.();
  v = c.renderVals();
  const miss2 = missing(markup, v);
  if (miss2.length) { bad += miss2.length; console.log('MISSING after handlers', file, JSON.stringify(props), miss2.join(', ')); }
  // Per-item handlers in lists.
  for (const val of Object.values(v)) if (Array.isArray(val)) for (const it of val) if (it && typeof it === 'object') for (const fn of Object.values(it)) if (typeof fn === 'function') { try { fn({ target: { value: '' }, preventDefault() {} }); } catch (e) { bad++; console.log('ITEM HANDLER', file, e.message); } }
  jobs.push([file, props]);
}
console.log('combos:', jobs.length, 'missing/bad:', bad);

if (shots) {
  const require = createRequire('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  for (const [file, props] of jobs) {
    if (only && !file.startsWith(only)) continue;
    if (props.theme === 'light' && file === 'ExtEdge.dc.html' && props.edge !== 'scheduled') continue;
    const { Component } = load(file);
    const c = new Component(props);
    const vals = c.renderVals();
    const html = toHtml(file, vals).replace('.at-root{height:auto!important}', file !== 'ExtEdge.dc.html' ? '.at-root{height:auto!important}' : '.at-root{}');
    const tmp = new URL('./.ee-render.html', import.meta.url);
    writeFileSync(tmp, html);
    const w = parseInt(vals.W ?? '360', 10) || 360;
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(tmp.href);
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const root = document.querySelector('.at-root');
      const r = root.getBoundingClientRect();
      const kids = [...root.children];
      const last = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
      const over = [...root.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.bottom > r.bottom + 1) && getComputedStyle(e).position !== 'absolute'; }).slice(0, 4).map((e) => e.tagName + ':' + (e.textContent || '').trim().slice(0, 24));
      return { h: Math.round(r.height), scrollH: root.scrollHeight, last: Math.round(last - r.top), over };
    });
    const name = file.replace('.dc.html', '') + '-' + Object.values(props).join('-');
    console.log(name, JSON.stringify(info));
    await page.screenshot({ path: new URL('./shots/ee-' + name + '.png', import.meta.url).pathname, fullPage: true });
    if (info.scrollH > 1100) {
      await page.setViewportSize({ width: w, height: info.scrollH });
      for (let y = 0, i = 0; y < info.scrollH; y += 1000, i++) await page.screenshot({ path: new URL('./shots/ee-' + name + '-' + i + '.png', import.meta.url).pathname, clip: { x: 0, y, width: w, height: Math.min(1000, info.scrollH - y) } });
    }
    await page.close();
  }
  await browser.close();
}
