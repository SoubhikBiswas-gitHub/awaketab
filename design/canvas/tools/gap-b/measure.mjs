// Gap agent B: measure natural board heights with the REAL canvas runtime (support.js = dc-runtime.js).
// Mounts Name with props in a temporary wrapper, sets the base root (the footer's parent) to height:auto and
// reports its natural height. usage: node measure.mjs Name '{"layout":"phone","theme":"dark"}' ['{...}' ...]
// Env: RT_DIR (default: $TMPDIR/awaketab-rt, as rtscan.sh), RT_PORT (default 8792). Needs support.js in RT_DIR.
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.env.RT_DIR || path.join(process.env.TMPDIR || '/tmp', 'awaketab-rt'); // needs support.js (the canvas runtime) there
const PROJ = process.env.PROJ || '/home/user/awaketab/design/canvas/project/';
for (const f of fs.readdirSync(PROJ)) if (f.endsWith('.dc.html')) fs.copyFileSync(PROJ + f, path.join(dir, f));
const [name, ...combos] = process.argv.slice(2);
const W = { phone: 390, tablet: 820, desktop: 1280 };
const port = Number(process.env.RT_PORT || 8792);
const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(f).pipe(r); }).listen(port);
const b = await chromium.launch();
for (const [k, c] of combos.entries()) {
  const pr = JSON.parse(c); const w = W[pr.layout] || 390;
  const attrs = Object.entries(pr).map(([a, v]) => `${a}="${v}"`).join(' ');
  const file = `__m_${process.pid}_${k}.dc.html`;
  fs.writeFileSync(path.join(dir, file), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>m</title><script src="./support.js"></script></head><body><x-dc><helmet><style>body{margin:0}</style></helmet><div style="width: ${w}px; height: 8000px"><dc-import name="${name}" ${attrs} hint-size="${w}px,8000px"></dc-import></div></x-dc><script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":8000}}'>class Component extends DCLogic { renderVals() { return {}; } }</script></body></html>`);
  const pg = await b.newPage({ viewport: { width: w, height: 1000 } });
  await pg.goto(`http://localhost:${port}/${file}`, { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => {
    const fs_ = document.querySelectorAll('footer'); const foot = fs_[fs_.length - 1]; // the page footer is the last one (a popup mock can carry its own) if (!foot) return { err: 'no footer' };
    const root = foot.parentElement; const set = parseFloat(root.style.height);
    root.style.height = 'auto';
    const nat = root.getBoundingClientRect().height;
    // widest descendant (horizontal overflow check)
    let wide = 0; for (const el of root.querySelectorAll('a, button, p, h1, h2, h3, li, span, input, label, output')) { if (el.closest('[aria-hidden="true"]')) continue; const x = el.getBoundingClientRect().right - root.getBoundingClientRect().left; if (x > wide) wide = x; }
    root.style.height = set + 'px';
    return { set, natural: Math.ceil(nat), wide: Math.round(wide), rootW: Math.round(root.getBoundingClientRect().width) };
  });
  console.log(name, JSON.stringify(pr), JSON.stringify(r));
  await pg.close(); fs.unlinkSync(path.join(dir, file));
}
await b.close(); srv.close();
