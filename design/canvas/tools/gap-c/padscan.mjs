// Owner padding rule (GAPS.md, 27 Sep 2026): nothing textual or interactive may sit flush against a board, card,
// sheet or panel edge: at least 16 px, and 20 px below the final row of actions. Renders boards with the REAL
// canvas runtime (support.js in RT_DIR) and lists offenders. Writes nothing in the repo.
// usage: copy next to support.js + node_modules/playwright (as rtscan.sh does), then RT_DIR=that dir node padscan.mjs File.dc.html ...
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.env.RT_DIR;
const PROJ = '/home/user/awaketab/design/canvas/project/';
for (const f of fs.readdirSync(PROJ)) if (f.endsWith('.dc.html')) fs.copyFileSync(PROJ + f, path.join(dir, f));
const canvas = JSON.parse(fs.readFileSync(PROJ + 'canvas.json', 'utf8'));
const PORT = Number(process.env.RT_PORT || 8786);
const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(r); }).listen(PORT);
const size = (f) => { const s = fs.readFileSync(path.join(dir, f), 'utf8'); const m = /"\$preview":\{"width":(\d+),"height":(\d+)/.exec(s); return m ? { w: +m[1], h: +m[2] } : canvas.boards[f]; };
const b = await chromium.launch(); let flagged = 0;
const work = async (list) => { const pg = await b.newPage();
  for (const f of list) { const bd = size(f);
    await pg.setViewportSize({ width: Math.min(bd.w, 4000), height: Math.min(bd.h, 8000) });
    await pg.goto(`http://localhost:${PORT}/${f}`, { waitUntil: 'load' }); await pg.waitForTimeout(1300);
    const hits = await pg.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && +cs.opacity > 0.05; };
      const ctl = (el) => el.matches('button, a, input, select, textarea, [role="button"], [role="radio"], [role="switch"], [role="tab"]');
      const bgOf = (cs) => { const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor); if (!m) return 0; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return p.length > 3 ? p[3] : 1; };
      // Containers: the board root, and boxed surfaces (radius >= 12 with a border or a fill) that are not controls.
      const all = [...document.body.querySelectorAll('*')];
      const root = all.find((d) => d.tagName === 'DIV' && /width:\s*\d+px;\s*height:\s*\d+px/.test(d.getAttribute('style') || ''));
      const boxes = all.filter((el) => {
        if (el === root || ctl(el) || el.closest('button, a, [role="radiogroup"], [role="tablist"], output') || !vis(el)) return false;
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        if (r.height < 72 || r.width < 120 || el.hasAttribute('data-placeholder') || el.getAttribute('aria-hidden') === 'true') return false;
        const rad = parseFloat(cs.borderTopLeftRadius) || 0, bw = parseFloat(cs.borderTopWidth) || 0;
        return rad >= 12 && (bw > 0 || bgOf(cs) > 0.5);
      });
      const out = [];
      // The page header (P-HEADER: 60 / 68 band, 44 targets) is the shared primitive; it is checked by primvariance.py.
      const leaves = all.filter((el) => vis(el) && !el.closest('header, [aria-hidden="true"], [data-placeholder]') && (ctl(el) ? !el.parentElement.closest('button, a') : ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !el.closest('button, a, output, select, option'))));
      for (const el of leaves) {
        const r = el.getBoundingClientRect(); let box = null;
        for (let p = el.parentElement; p; p = p.parentElement) if (boxes.includes(p) || p === root) { box = p; break; }
        if (!box) continue;
        const B = box.getBoundingClientRect();
        // Text lines: measure the text itself (a Range), not the block that holds it.
        let R = r;
        // Borderless, unfilled controls (icon buttons, text links) are judged by what is drawn, not by the 44 px hit area.
        const cs = getComputedStyle(el), bare = ctl(el) && bgOf(cs) < 0.05 && !(parseFloat(cs.borderTopWidth) > 0) && !(parseFloat(cs.borderBottomWidth) > 0);
        if (!ctl(el) || bare) { const rg = document.createRange(); rg.selectNodeContents(el); const rr = rg.getBoundingClientRect(); if (rr.width > 0) R = rr; }
        const gap = { l: R.left - B.left, r: B.right - R.right, t: R.top - B.top, b: B.bottom - R.bottom };
        const need = { l: 16, r: 16, t: 16, b: ctl(el) && !bare ? 20 : 16 };
        const bad = Object.keys(gap).filter((k) => gap[k] > -2 && gap[k] < need[k] - 0.5);
        if (bad.length) out.push(((el.innerText || el.getAttribute('aria-label') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 36)) + ' [' + bad.map((k) => k + Math.round(gap[k])).join(' ') + '] in ' + (box === root ? 'BOARD' : (box.getAttribute('aria-label') || box.tagName.toLowerCase() + ' r' + parseInt(getComputedStyle(box).borderTopLeftRadius) + ' ' + Math.round(B.width) + 'x' + Math.round(B.height))));
      }
      return [...new Set(out)];
    });
    if (hits.length) { flagged++; console.log('\n' + f + ' (' + hits.length + ')\n  ' + hits.slice(0, Number(process.env.MAX || 12)).join('\n  ')); }
  } await pg.close(); };
const files = process.argv.slice(2), n = 4;
await Promise.all(Array.from({ length: n }, (_, k) => work(files.filter((_, j) => j % n === k))));
await b.close(); srv.close();
console.log('\npadscan', files.length, 'boards, flagged', flagged);
