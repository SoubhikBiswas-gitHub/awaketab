import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.env.RT_DIR;
const canvas = JSON.parse(fs.readFileSync(path.join(dir, 'canvas.json'), 'utf8')); // rtscan.sh copies it next to the boards
const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(r); }).listen(Number(process.env.RT_PORT||8766));
const b = await chromium.launch(); const out = [];
const only = process.argv.slice(2); const files = only.length ? only.map(f => [f, canvas.boards[f] || (() => { const m = /width:\s*(\d+)px;\s*height:\s*(\d+)px/.exec(fs.readFileSync(path.join(dir, f), 'utf8')) || [0, 1280, 2000]; return { w: +m[1], h: +m[2] }; })()]) : Object.entries(canvas.boards);
const worker = async (list) => { const pg = await b.newPage();
  for (const [f, bd] of list) { const errs = [];
    pg.removeAllListeners('pageerror'); pg.removeAllListeners('console');
    pg.on('pageerror', e => errs.push(String(e).slice(0,200))); pg.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,200)); });
    await pg.setViewportSize({ width: Math.min(bd.w, 4000), height: Math.min(bd.h, 8000) });
    await pg.goto('http://localhost:' + (process.env.RT_PORT||8766) + '/' + f, { waitUntil: 'load' }).catch(e => errs.push('goto '+e));
    await pg.waitForTimeout(1200);
    const i = await pg.evaluate(() => {
      const dropped = [...document.querySelectorAll('[data-sq]')].filter(e => !e.getAttribute('style')).map(e => e.textContent.trim().slice(0, 30));
      // Controls flush against the board edge (owner rule: 16 px minimum; header bars excluded).
      const bw = document.documentElement.scrollWidth, bh = document.documentElement.scrollHeight, edge = [];
      for (const e of document.querySelectorAll('button, a, input, select, [role=radio], [role=switch]')) {
        if (e.closest('header, [aria-hidden="true"]')) continue; const r = e.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden') continue;
        // Skip controls inside a scrolling area that reaches the board's bottom edge: its content continues below the fold.
        let cut = false; for (let a = e.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowY; if ((o === 'auto' || o === 'scroll') && a.scrollHeight > a.clientHeight + 1) { const ar = a.getBoundingClientRect(); if (ar.bottom >= bh - 13) { cut = true; break; } } } if (cut) continue;
        if (r.top >= bh || r.bottom <= 0) continue; // outside the board: a tall page split across a top and a bottom board
        if (r.left < 12 || bw - r.right < 12 || bh - r.bottom < 12) edge.push((e.textContent.trim() || e.getAttribute('aria-label') || e.tagName).slice(0, 24));
      }
      return { nodes: document.body.querySelectorAll('*').length, text: document.body.innerText.trim().length, h: Math.round(document.documentElement.scrollHeight), w: Math.round(document.documentElement.scrollWidth), dropped, edge: edge.slice(0, 4) }; });
    out.push({ f, ...i, bw: bd.w, bh: bd.h, errs: [...new Set(errs)].filter(e => !e.includes('{{')).slice(0,3) });
  } await pg.close(); };
const n = 6, chunks = Array.from({ length: n }, (_, k) => files.filter((_, j) => j % n === k));
await Promise.all(chunks.map(worker));
await b.close(); srv.close();
fs.writeFileSync(path.join(dir, 'scan.json'), JSON.stringify(out, null, 1));
// Boards that are sparse by design (one message, a promo tile, a 320×104 widget): skip only the element-count rule.
const SPARSE = new Set(['GrowthProMessageDeskDark.dc.html', 'GrowthProMessagePhoneLight.dc.html', 'KioskTvMessage.dc.html', 'KioskTvUnlicensed.dc.html', 'StorePromoSmall.dc.html', 'StoreMarquee.dc.html', 'EmbedCompactLight.dc.html', 'EmbedCookCompact.dc.html']);
const bad = out.filter(o => (o.nodes < 40 && o.bw * o.bh > 120000 && !SPARSE.has(o.f)) || o.text < 20 || o.errs.length || o.w > o.bw + 2 || o.dropped.length || o.edge.length);
console.log('scanned', out.length, 'flagged', bad.length);
for (const o of bad) console.log(o.f, 'nodes', o.nodes, 'text', o.text, 'w', o.w, '/', o.bw, o.dropped.length ? 'DROPPED ' + o.dropped.length + ' ' + JSON.stringify(o.dropped.slice(0, 3)) : '', o.edge.length ? 'EDGE ' + JSON.stringify(o.edge) : '', o.errs.join(' | '));
