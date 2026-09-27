// Measure natural heights of the four Guide boards (max over variants) and check rendered text for '{{'.
// usage: node measure.mjs [--write]   (--write updates directions/GuideSizes.json Guide entries only)
import { writeFileSync, readFileSync } from 'node:fs';
const D = '/home/user/awaketab/design/canvas/';
const { load, toHtml } = await import(D + 'ProLib.mjs');
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const FILES = ['GuideOn', 'GuideVs', 'GuideLearn', 'GuideGuides'];
const LAYOUTS = { phone: 390, tablet: 820, desktop: 1280 };
const variants = (f) => {
  const v = [{ status: 'ready' }, { status: 'awake' }];
  if (f === 'GuideOn') v.push({ status: 'ready', stale: true });
  if (f === 'GuideGuides') v.push({ status: 'ready', _done: [true, true, true, true] }, { status: 'ready', _done: [false, false, false, false] });
  return v;
};
const browser = await chromium.launch();
const out = {};
let braces = 0;
for (const f of FILES) {
  out[f + '.dc.html'] = {};
  for (const [layout, w] of Object.entries(LAYOUTS)) {
    let max = 0;
    for (const vr of variants(f)) {
      for (const theme of ['dark', 'light']) {
        const { Component } = load(f + '.dc.html');
        const props = { layout, theme, status: vr.status, stale: vr.stale };
        const c = new Component(props);
        if (vr._done) c.state.done = vr._done;
        const vals = c.renderVals();
        const tmp = new URL('./.m.html', import.meta.url);
        writeFileSync(tmp, toHtml(f + '.dc.html', vals));
        const page = await browser.newPage({ viewport: { width: w, height: 900 } });
        await page.goto(tmp.href);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        const r = await page.evaluate(() => {
          const root = document.querySelector('.at-root');
          const W = root.getBoundingClientRect().width;
          const over = [...root.querySelectorAll('*')].filter((e) => {
            const b = e.getBoundingClientRect();
            if (!b.width) return false;
            let a = e.parentElement;
            while (a && a !== root) { const cs = getComputedStyle(a); if (cs.overflowX === 'auto' || cs.overflowX === 'hidden') return false; a = a.parentElement; }
            return b.right > W + 1 || b.left < -1;
          }).slice(0, 4).map((e) => e.tagName + ':' + (e.textContent || '').trim().slice(0, 40));
          return { h: Math.ceil(root.getBoundingClientRect().height), over, braces: root.innerText.includes('{{') };
        });
        if (r.braces) { braces++; console.log('BRACES in', f, layout, JSON.stringify(vr)); }
        if (r.over.length) console.log('OVERFLOW', f, layout, r.over.join(' | '));
        max = Math.max(max, r.h);
        await page.close();
      }
    }
    const h = Math.ceil(max / 10) * 10;
    out[f + '.dc.html'][layout] = [w, h];
    console.log(f, layout, 'natural max', max, '->', h);
  }
}
await browser.close();
console.log('rendered text with {{ :', braces);
if (process.argv.includes('--write')) {
  const p = D + 'GuideSizes.json';
  const cur = JSON.parse(readFileSync(p, 'utf8'));
  Object.assign(cur, out);
  writeFileSync(p, JSON.stringify(cur));
  console.log('updated', p);
}
