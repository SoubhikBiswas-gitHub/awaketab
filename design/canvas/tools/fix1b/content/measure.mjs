// Measure natural content height: render NAME with props per layout, report root height minus the flex-grow spacer.
import { readFileSync, readdirSync } from 'node:fs';
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const DIR = '/home/user/awaketab/design/canvas/project/';
const files = {};
for (const f of readdirSync(DIR)) if (f.endsWith('.dc.html')) files[f.replace('.dc.html', '')] = readFileSync(DIR + f, 'utf8');
const name = process.argv[2];
const W = { phone: 390, tablet: 820, desktop: 1280 };
const combos = JSON.parse(process.argv[3] || '[{"layout":"phone","theme":"dark"},{"layout":"tablet","theme":"light"},{"layout":"desktop","theme":"light"}]');
const browser = await chromium.launch();
for (const pr of combos) {
  const page = await browser.newPage({ viewport: { width: W[pr.layout], height: 800 } });
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
  const r = await page.evaluate(async ({ files, name, pr }) => {
    class DCLogic { constructor(p) { this.props = p; this.state = {}; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } forceUpdate() {} }
    const src = files[name];
    const js = src.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
    const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
    const root = src.split('</helmet>')[1].split('</x-dc>')[0];
    const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
    document.head.insertAdjacentHTML('beforeend', helmet);
    const get = (scope, path) => { path = (path || '').trim(); if (path === 'true') return true; if (path === 'false') return false; if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path); return path.split('.').reduce((o, k) => (o == null ? o : o[k]), scope); };
    const whole = (v) => { const m = /^\{\{\s*([\w.$]+)\s*\}\}$/.exec(v || ''); return m ? m[1] : null; };
    const interp = (str, scope) => str.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
    function walk(node, scope) {
      for (const ch of [...node.childNodes]) {
        if (ch.nodeType === 3) { ch.textContent = interp(ch.textContent, scope); continue; }
        if (ch.nodeType !== 1) continue;
        const tag = ch.tagName.toLowerCase();
        if (tag === 'sc-if') { const v = get(scope, whole(ch.getAttribute('value'))); const f = document.createDocumentFragment(); if (v) { walk(ch, scope); while (ch.firstChild) f.appendChild(ch.firstChild); } ch.replaceWith(f); continue; }
        if (tag === 'sc-for') { const list = get(scope, whole(ch.getAttribute('list'))) || []; const as = ch.getAttribute('as'); const f = document.createDocumentFragment(); list.forEach((item, i) => { const cl = ch.cloneNode(true); walk(cl, { ...scope, [as]: item, $index: i }); while (cl.firstChild) f.appendChild(cl.firstChild); }); ch.replaceWith(f); continue; }
        for (const at of [...ch.attributes]) { if (/^on[A-Z]/.test(at.name)) { ch.removeAttribute(at.name); continue; } if (at.value.includes('{{')) { const wh = whole(at.value); const v = wh ? get(scope, wh) : interp(at.value, scope); if (v === false || v == null) ch.removeAttribute(at.name); else ch.setAttribute(at.name, v === true ? 'true' : String(v)); } }
        walk(ch, scope);
      }
    }
    const c = new Component(pr);
    const tpl = document.createElement('template'); tpl.innerHTML = root; walk(tpl.content, c.renderVals());
    document.body.appendChild(tpl.content);
    await document.fonts.ready; await new Promise((r) => setTimeout(r, 300));
    const rootEl = document.body.firstElementChild;
    const kids = [...rootEl.children];
    const grow = kids.find((k) => k.style.flexGrow === '1');
    const foot = rootEl.querySelector('footer');
    const rr = rootEl.getBoundingClientRect();
    const out = { H: rr.height, spacer: grow ? grow.getBoundingClientRect().height : null, footBottom: foot ? foot.getBoundingClientRect().bottom - rr.top : null };
    // marks for section tops
    out.marks = Object.fromEntries([...rootEl.querySelectorAll('section[id], aside[id]')].map((s) => [s.id, Math.round(s.getBoundingClientRect().top - rr.top)]));
    return out;
  }, { files, name, pr });
  console.log(JSON.stringify(pr), 'H', r.H, 'spacer', r.spacer, 'natural', r.H - r.spacer, 'footBottom', r.footBottom, JSON.stringify(r.marks));
  await page.close();
}
await browser.close();
