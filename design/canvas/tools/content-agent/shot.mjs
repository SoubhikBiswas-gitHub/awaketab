// Preview renderer for .dc.html boards: naive runtime (holes, sc-if, sc-for, onX handlers) in Chromium.
// Usage: node shot.mjs File.dc.html '{"layout":"phone","theme":"dark"}' out.png [actions-json]
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/awaketab/package.json');
const { chromium } = require('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright');

const D = '/home/user/awaketab/design/canvas/project/';
const [file, propsJson = '{}', out = 'out.png', actionsJson = '[]', scheme = 'dark'] = process.argv.slice(2);
const src = readFileSync(D + file, 'utf8');
const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
const markup = src.split('</helmet>')[1].split('</x-dc>')[0];
const js = src.split('data-dc-script')[1].split("}'>")[1].split('</script>')[0];

const runtime = `
class DCLogic { constructor(p){ this.props=p; this.state={}; } setState(u){ this.state={...this.state,...(typeof u==='function'?u(this.state):u)}; window.__rr && window.__rr(); } forceUpdate(){ window.__rr && window.__rr(); } }
${js}
const MARKUP = ${JSON.stringify(markup)};
const tpl = document.createElement('template'); tpl.innerHTML = MARKUP;
const lookup = (p, s) => p === 'true' ? true : p === 'false' ? false : /^-?\\d/.test(p) ? Number(p) : p.split('.').reduce((o, k) => o == null ? o : o[k], s);
const whole = (str) => { const m = str.match(/^\\s*\\{\\{\\s*([\\w.$]+)\\s*\\}\\}\\s*$/); return m ? m[1] : null; };
const interp = (str, s) => str.replace(/\\{\\{\\s*([\\w.$]+)\\s*\\}\\}/g, (_, p) => { const v = lookup(p, s); if (v === undefined) window.__missing.add(p); return v == null ? '' : String(v); });
function render(node, s, out) {
  for (const ch of node.childNodes) {
    if (ch.nodeType === 3) { out.appendChild(document.createTextNode(interp(ch.textContent, s))); continue; }
    if (ch.nodeType !== 1) continue;
    const tag = ch.localName;
    if (tag === 'sc-if') { const v = lookup(whole(ch.getAttribute('value')), s); if (v === undefined) window.__missing.add(ch.getAttribute('value')); if (v) render(ch, s, out); continue; }
    if (tag === 'sc-for') { const l = lookup(whole(ch.getAttribute('list')), s) || []; const as = ch.getAttribute('as'); l.forEach((it, i) => render(ch, { ...s, [as]: it, $index: i }, out)); continue; }
    if (tag === 'dc-import') { const d = document.createElement('div'); d.textContent = 'import ' + ch.getAttribute('name'); out.appendChild(d); continue; }
    const el = ch.cloneNode(false);
    for (const a of [...el.attributes]) {
      const w = whole(a.value);
      if (/^on[A-Z]/.test(a.name) || /^on[a-z]+$/.test(a.name) && w) { el.removeAttribute(a.name); const fn = lookup(w, s); if (typeof fn === 'function') el.addEventListener(a.name.slice(2).toLowerCase(), fn); else window.__missing.add('handler ' + w); continue; }
      if (a.value.includes('{{')) el.setAttribute(a.name, interp(a.value, s));
    }
    if (tag === 'template') { render(ch.content, s, el.content); } else render(ch, s, el);
    out.appendChild(el);
  }
}
window.__missing = new Set();
const props = ${propsJson};
const c = new Component(props);
window.__c = c;
window.__rr = () => { const app = document.getElementById('app'); app.innerHTML = ''; render(tpl.content, c.renderVals(), app); };
window.__rr();
c.componentDidMount && c.componentDidMount();
`;
const page0 = `<!doctype html><html><head><meta charset="utf-8">${helmet}</head><style>*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important}</style><body style="margin:0"><div id="app"></div><script>${runtime}<\/script></body></html>`;

const browser = await chromium.launch();
const props = JSON.parse(propsJson);
const w = props.layout === 'desktop' ? 1280 : props.layout === 'tablet' ? 820 : 390;
const page = await browser.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.setContent(page0, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
for (const act of JSON.parse(actionsJson)) {
  if (act.click) await page.click(act.click);
  if (act.wait) await page.waitForTimeout(act.wait);
  if (act.eval) console.log('eval:', await page.evaluate(act.eval));
}
const info = await page.evaluate(() => {
  const root = document.getElementById('app').firstElementChild;
  const fixed = root.getBoundingClientRect().height;
  const h0 = root.style.height; root.style.height = 'auto';
  const natural = root.getBoundingClientRect().height; root.style.height = h0;
  // overflow check: any element wider than the root
  const rw = root.getBoundingClientRect().width; const wide = [];
  root.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.right > rw + 1 && getComputedStyle(el).position !== 'absolute') wide.push(el.tagName + '.' + (el.textContent || '').trim().slice(0, 30)); });
  return { fixed, natural, missing: [...window.__missing], wide: wide.slice(0, 8) };
});
console.log(file, propsJson, JSON.stringify(info));
if (process.env.MEASURE) { const hs = []; for (let i = -1; i < Number(process.env.MEASURE); i++) { hs.push(await page.evaluate((i) => { window.__c.setState({ faqOpen: i }); const r = document.getElementById('app').firstElementChild; r.style.height = 'auto'; return Math.ceil(r.getBoundingClientRect().height); }, i)); } console.log('MEASURE', file, propsJson, 'max', Math.max(...hs), hs.join(',')); await browser.close(); process.exit(0); }
await page.evaluate(() => { clearInterval(window.__c.timer); window.__rr(); }); const total = await page.evaluate(() => document.body.scrollHeight);
const segH = Number(process.env.SEG || 1600);
for (let y = 0, i = 0; y < total; y += segH, i++) await page.screenshot({ path: out.replace('.png', '-' + i + '.png'), clip: { x: 0, y, width: w, height: Math.min(segH, total - y) }, fullPage: true });
await browser.close();
