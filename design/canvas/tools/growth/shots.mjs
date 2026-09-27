// Render Growth boards in Chromium at their declared size: report natural content height,
// horizontal overflow, clipped content and small targets; save screenshots.
// Usage: node shots.mjs '[{"file":"GrowthX.dc.html","props":{...},"out":"name"}]'
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { load, toHtml } from '../directions/ProLib.mjs';
const require = createRequire('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');

const jobs = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
for (const job of jobs) {
  const { Component } = load(job.file);
  const c = new Component(job.props);
  if (job.patch) Object.assign(c.state, job.patch);
  const vals = c.renderVals();
  let html = toHtml(job.file, vals).replace('.at-root{height:auto!important}', '');
  const tmp = new URL('./.render-' + process.pid + '.html', import.meta.url);
  writeFileSync(tmp, html);
  const w = parseInt(vals.W, 10), h = parseInt(vals.H, 10);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(tmp.href);
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const root = document.querySelector('.at-root');
    const R = root.getBoundingClientRect();
    const all = [...root.querySelectorAll('*')];
    const vis = (e) => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && e.getBoundingClientRect().width > 0; };
    const out = all.filter((e) => vis(e) && !e.closest('[aria-hidden="true"]')).filter((e) => { const b = e.getBoundingClientRect(); return b.right > R.right + 1 || b.bottom > R.bottom + 1 || b.left < R.left - 1; })
      .filter((e) => { let p = e.parentElement; while (p && p !== root) { const s = getComputedStyle(p); if (s.overflowY === 'auto' || s.overflowY === 'scroll') return false; p = p.parentElement; } return true; })
      .slice(0, 6).map((e) => e.tagName + ':' + (e.textContent || '').trim().slice(0, 40));
    const clip = all.filter((e) => vis(e) && e.children.length === 0 && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').slice(0, 4).map((e) => e.tagName + ':' + e.textContent.trim().slice(0, 30));
    const small = [...root.querySelectorAll('button, a, input, textarea, [role=switch]')].filter(vis).filter((e) => { const b = e.getBoundingClientRect(); return b.height < 43.5 || b.width < 43.5; }).slice(0, 6).map((e) => e.tagName + ':' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
    const scrollers = [...root.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return (s.overflowY === 'auto') && e.scrollHeight > e.clientHeight + 1; }).map((e) => e.scrollHeight - e.clientHeight);
    const light = root.classList.contains('at-l');
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
    const bgOf = (e) => { const stack = []; let p = e; while (p) { const c = parse(getComputedStyle(p).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 0.99) break; } p = p.parentElement; } let base = light ? { r: 242, g: 246, b: 250, a: 1 } : { r: 10, g: 14, b: 22, a: 1 }; if (stack.length && stack[stack.length - 1].a >= 0.99) base = stack.pop(); for (let i = stack.length - 1; i >= 0; i--) base = mix(stack[i], base); return base; };
    const low = [];
    for (const e of all) {
      if (!vis(e) || e.closest('[aria-hidden="true"]') || e.closest('svg')) continue;
      const txt = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
      if (!txt) continue;
      const st = getComputedStyle(e); let op = 1; let q = e; while (q && q !== root) { op *= parseFloat(getComputedStyle(q).opacity); q = q.parentElement; }
      const fg0 = parse(st.color); if (!fg0) continue; const bg = bgOf(e); const fg = mix({ ...fg0, a: fg0.a * op }, bg);
      const L1 = lum(fg), L2 = lum(bg); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const size = parseFloat(st.fontSize), bold = parseInt(st.fontWeight) >= 700; const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (cr < need) low.push(txt.slice(0, 26) + ' ' + cr.toFixed(2));
    }
    return { out, clip, small, scrollers, docW: document.documentElement.scrollWidth, low: low.slice(0, 5) };
  });
  console.log(job.out.padEnd(28), JSON.stringify(job.props), 'size', w + 'x' + h, r.out.length ? 'OUT ' + r.out.join(' | ') : 'fits', r.clip.length ? 'CLIP ' + r.clip.join(' | ') : '', r.small.length ? 'SMALL ' + r.small.join(' | ') : '', r.scrollers.length ? 'inner-scroll ' + r.scrollers.join(',') : '', r.docW > w ? 'DOCW ' + r.docW : '', r.low.length ? 'CONTRAST ' + r.low.join(' | ') : '');
  await page.screenshot({ path: new URL('./shots/' + job.out + '.png', import.meta.url).pathname });
  await page.close();
}
await browser.close();
