// Compose contact sheets. usage: node sheet.mjs out.png segH cols name1 name2 ...
// Each image is cut into vertical segments of segH px (0 = whole), laid out left to right.
import { readFileSync } from 'node:fs';
const { chromium } = await import('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const SH = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/director/shots/';
const [out, segH, cols, ...names] = process.argv.slice(2);
const size = (p) => { const b = readFileSync(p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const cells = [];
for (const n of names) {
  const p = SH + n + '.png';
  const [w, h] = size(p);
  const s = Number(segH) || h;
  for (let y = 0, i = 0; y < h; y += s, i++) cells.push({ p, w, h: Math.min(s, h - y), y, label: n + (h > s ? ' #' + i : '') });
}
const C = Number(cols);
const html = '<body style="margin:0;background:#777;font:12px system-ui"><div style="width:max-content;display:grid;grid-template-columns:repeat(' + C + ',max-content);gap:8px;padding:8px;align-items:start">' +
  cells.map((c) => `<div><div style="color:#fff;height:16px">${c.label}</div><div style="width:${c.w}px;height:${c.h}px;overflow:hidden"><img src="file://${c.p}" style="display:block;margin-top:-${c.y}px"></div></div>`).join('') + '</div></body>';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 8000, height: 1000 } });
const { writeFileSync } = await import('node:fs'); writeFileSync(SH + '../_sheet.html', html); await page.goto('file://' + SH + '../_sheet.html');
await page.waitForTimeout(300);
const box = await page.evaluate(() => { const r = document.body.firstElementChild.getBoundingClientRect(); return [Math.ceil(r.width), Math.ceil(r.height)]; });
await page.setViewportSize({ width: box[0], height: box[1] });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out, box.join('x'));
