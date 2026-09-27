// Minimal static expander for Main.dc.html (sc-if / sc-for / holes) + Playwright screenshots.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/');
const { chromium } = require('playwright');
const dir = '/home/user/awaketab/design/canvas/project/';
const out = '/home/user/awaketab/design/canvas/tools/tool-backup/';
const src = readFileSync(dir + 'Main.dc.html', 'utf8');
const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];
globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) };
class DCLogic { constructor(p) { this.props = p; } setState(u) { this.state = { ...this.state, ...u }; } }
const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
const body = src.split('</helmet>')[1].split('</x-dc>')[0];
const get = (scope, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), scope);
function expand(tpl, scope) {
  // Process innermost-first by scanning for matching tags.
  let s = tpl;
  const re = /<(sc-if|sc-for)\b([^>]*)>/;
  let m;
  let outStr = '';
  while ((m = re.exec(s))) {
    const tag = m[1];
    outStr += fill(s.slice(0, m.index), scope);
    // find matching close
    let depth = 1, i = m.index + m[0].length;
    const openRe = new RegExp('<' + tag + '\\b|</' + tag + '>', 'g'); openRe.lastIndex = i;
    let mm;
    while ((mm = openRe.exec(s))) { if (mm[0].startsWith('</')) { depth--; if (!depth) break; } else depth++; }
    const inner = s.slice(i, mm.index);
    const attrs = m[2];
    if (tag === 'sc-if') {
      const v = get(scope, attrs.match(/value="\{\{\s*([\w.$]+)\s*\}\}"/)[1]);
      if (v) outStr += expand(inner, scope);
    } else {
      const list = get(scope, attrs.match(/list="\{\{\s*([\w.$]+)\s*\}\}"/)[1]) || [];
      const as = attrs.match(/as="(\w+)"/)[1];
      list.forEach((it, idx) => { outStr += expand(inner, Object.assign({}, scope, { [as]: it, $index: idx })); });
    }
    s = s.slice(mm.index + mm[0].length);
  }
  return outStr + fill(s, scope);
}
function fill(s, scope) {
  return s.replace(/\s(on[A-Z]\w*)="\{\{[^}]*\}\}"/g, '').replace(/\s(disabled)="\{\{\s*([\w.]+)\s*\}\}"/g, (x, a, p) => (get(scope, p) ? ' disabled' : ''))
    .replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (x, p) => { const v = get(scope, p); return v === undefined ? 'MISSING' : String(v).replace(/"/g, '&quot;'); });
}
const shots = JSON.parse(process.argv[2]);
const browser = await chromium.launch();
for (const [name, props, act] of shots) {
  const c = new Component(props);
  c.state.now = new Date(2026, 8, 26, 22, 0, 0).getTime();
  if (act === 'violet') c.state.lampId = 'violet';
  if (act === 'oled') c.state.theme = 'oled';
  const v = c.renderVals();
  const html = '<!doctype html><html><head><meta charset="utf-8">' + helmet + '</head><body>' + expand(body, v) + '</body></html>';
  writeFileSync(out + name + '.html', html);
  const w = parseInt(v.W), h = parseInt(v.H);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('file://' + out + name + '.html');
  await page.waitForTimeout(700);
  await page.screenshot({ path: out + name + '.png' });
  if (act === 'scroll') { await page.evaluate(() => { const d = document.querySelector('[role=dialog]'); d.scrollTop = d.scrollHeight; }); await page.screenshot({ path: out + name + '-end.png' }); }
  await page.close();
}
await browser.close();
console.log('done');
