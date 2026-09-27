// Real-runtime computed-style dump for the DESIGN.md §11 system audit (input for analyze.mjs).
// The older dumper (tools/fix1b/measure.mjs) used a stand-in renderer; this one renders every board with the
// canvas's real runtime (dc-runtime.js served as support.js), like rtscan.
// usage (via rtaudit.sh): node rtdump.mjs [File.dc.html ...]   env: RT_DIR, RT_PORT, OUT (dump dir)
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.env.RT_DIR;
const OUT = process.env.OUT; fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));
const canvas = JSON.parse(fs.readFileSync(path.join(dir, 'canvas.json'), 'utf8'));
const port = Number(process.env.RT_PORT || 8767);
const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(r); }).listen(port);
const only = process.argv.slice(2);
const files = only.length ? only.map((f) => [f, canvas.boards[f] || { w: 1280, h: 2000 }]) : Object.entries(canvas.boards);
const b = await chromium.launch();
const worker = async (list) => {
  const pg = await b.newPage();
  for (const [f, bd] of list) {
    await pg.setViewportSize({ width: Math.min(bd.w, 4000), height: Math.min(bd.h, 8000) });
    await pg.goto(`http://localhost:${port}/${f}`, { waitUntil: 'load' }).catch(() => {});
    await pg.waitForTimeout(1200);
    const items = await pg.evaluate((board) => {
      const out = [];
      for (const el of document.body.querySelectorAll('*')) {
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'template', 'helmet', 'x-dc', 'dc-import', 'sc-for', 'sc-if', 'br', 'wbr'].includes(tag)) continue;
        if (el.closest('svg') && tag !== 'svg') continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
        const imp = el.closest('dc-import');
        out.push({
          src: (imp ? imp.getAttribute('name') + '.dc.html' : board), tag, role: el.getAttribute('role') || '',
          aria: (el.getAttribute('aria-label') || '').slice(0, 40), text: (own || (el.children.length ? '' : el.textContent.trim())).slice(0, 60),
          style: (el.getAttribute('style') || '').replace(/--dc: 0; /g, '').slice(0, 120), ph: !!el.closest('[data-placeholder]'),
          bw: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(' '), bs: cs.borderTopStyle + ' ' + cs.borderLeftStyle,
          bc: cs.borderTopColor, br: cs.borderTopLeftRadius, pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
          gap: cs.rowGap + ' ' + cs.columnGap, disp: cs.display, h: r.height, w: r.width, x: r.left, y: r.top,
          own: !!own, full: el.textContent.trim().slice(0, 60), inCode: !!el.closest('code, pre, kbd, samp, [data-kind="code"], [data-kind="kbd"]'), kind: el.getAttribute('data-kind') || '', fs: cs.fontSize, lh: cs.lineHeight, fw: cs.fontWeight, ff: cs.fontFamily, color: cs.color, bg: cs.backgroundColor, forced: /^A11yForced/.test(board), zoom: /^A11yZoom/.test(board),
        });
      }
      return out;
    }, f);
    fs.writeFileSync(path.join(OUT, f.replace('.dc.html', '.json')), JSON.stringify({ file: f, items }));
  }
  await pg.close();
};
const n = 6; await Promise.all(Array.from({ length: n }, (_, k) => worker(files.filter((_, j) => j % n === k))));
await b.close(); srv.close();
console.log('dumped', files.length, 'boards to', OUT);
