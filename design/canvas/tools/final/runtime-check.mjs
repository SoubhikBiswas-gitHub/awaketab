// Render boards with the canvas's REAL runtime (artifact-type/dc-runtime.js served as support.js).
// Setup: copy design/canvas/project to a folder, copy dc-runtime.js (Artifact read path artifact-type/dc-runtime.js) in as support.js,
// serve it: python3 -m http.server 8765 -d <folder>. Usage: node runtime-check.mjs Board:w:h ... (prints text + console errors).
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const b = await chromium.launch();
for (const name of process.argv.slice(2)) {
  const [file, w, h] = name.split(':');
  const p = await b.newPage({ viewport: { width: +w || 390, height: +h || 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 300)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
  await p.goto('' + (process.env.BASE || 'http://localhost:8765/') + '' + file + '.dc.html');
  await p.waitForTimeout(3000);
  const txt = await p.evaluate(() => document.body.innerText.slice(0, 120).replace(/\s+/g, ' '));
  await p.screenshot({ path: (process.env.OUT || '/tmp/claude-0/rt/') + file + '.png' });
  console.log(file, '| text:', txt, '|', errs.slice(0, 4).join(' || '));
  await p.close();
}
await b.close();
