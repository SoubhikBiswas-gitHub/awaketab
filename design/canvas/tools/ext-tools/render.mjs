// Static preview renderer for .dc.html boards (approximation of the canvas runtime, for visual checks only).
// usage: node render.mjs File.dc.html '{"prop":"v"}' out.png [width height] [actions-json]
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/awaketab/package.json');
const { chromium } = require('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright');
const DIR = '/home/user/awaketab/design/canvas/project/';
const [file, propsJson = '{}', out = '/tmp/x.png', w, h, actionsJson = '[]', scheme = 'dark'] = process.argv.slice(2);
const files = {};
for (const f of readdirSync(DIR)) if (f.endsWith('.dc.html')) files[f.replace('.dc.html', '')] = readFileSync(DIR + f, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w || 1400), height: Number(h || 1000) }, colorScheme: scheme });
await page.setContent('<!doctype html><html><head></head><body style="margin:0"></body></html>');
const size = await page.evaluate(async ({ files, name, props, actions }) => {
  class DCLogic { constructor(p) { this.props = p; this.state = {}; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } forceUpdate() {} }
  const parse = (src) => {
    const js = src.split('data-dc-script')[1].split(">").slice(1).join('>').split('</script>')[0];
    const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
    const root = src.split('</helmet>')[1].split('</x-dc>')[0];
    const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
    return { helmet, root, Component };
  };
  const get = (scope, path) => {
    path = path.trim();
    if (path === 'true') return true; if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), scope);
  };
  const whole = (v) => { const m = /^\{\{\s*([\w.$]+)\s*\}\}$/.exec(v); return m ? m[1] : null; };
  const interp = (str, scope) => str.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
  const heads = new Set();
  let allActions = actions;
  function renderFile(nm, pr) {
    const { helmet, root, Component } = parse(files[nm]);
    if (!heads.has(nm)) { heads.add(nm); document.head.insertAdjacentHTML('beforeend', helmet); }
    const c = new Component(pr);
    const top = nm === name;
    if (top) for (const a of allActions) { const v = c.renderVals(); const fn = a.split('.').reduce((o, k) => o?.[k], v); if (typeof fn === 'function') fn({ preventDefault() {}, target: { value: '' } }); }
    const vals = c.renderVals();
    const tpl = document.createElement('template');
    tpl.innerHTML = root;
    const frag = tpl.content;
    walk(frag, vals);
    return frag;
  }
  function walk(node, scope) {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) { ch.textContent = interp(ch.textContent, scope); continue; }
      if (ch.nodeType !== 1) continue;
      const tag = ch.tagName.toLowerCase();
      if (tag === 'sc-if') {
        const v = get(scope, whole(ch.getAttribute('value')));
        const f = document.createDocumentFragment();
        if (v) { walk(ch, scope); while (ch.firstChild) f.appendChild(ch.firstChild); }
        ch.replaceWith(f); continue;
      }
      if (tag === 'sc-for') {
        const list = get(scope, whole(ch.getAttribute('list'))) || [];
        const as = ch.getAttribute('as');
        const f = document.createDocumentFragment();
        list.forEach((item, i) => {
          const cl = ch.cloneNode(true);
          walk(cl, { ...scope, [as]: item, $index: i });
          while (cl.firstChild) f.appendChild(cl.firstChild);
        });
        ch.replaceWith(f); continue;
      }
      if (tag === 'dc-import') {
        const pr = {};
        for (const at of [...ch.attributes]) {
          if (at.name === 'name' || at.name.startsWith('hint-')) continue;
          const k = at.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          const wh = whole(at.value);
          pr[k] = wh ? get(scope, wh) : interp(at.value, scope);
        }
        const hs = (ch.getAttribute('hint-size') || '').split(',');
        const box = document.createElement('div');
        box.style.cssText = 'width:' + hs[0] + ';height:' + hs[1];
        box.appendChild(renderFile(ch.getAttribute('name'), pr));
        ch.replaceWith(box); continue;
      }
      for (const at of [...ch.attributes]) {
        if (/^on[A-Z]/.test(at.name) || /^on[a-z]+$/.test(at.name)) { ch.removeAttribute(at.name); continue; }
        if (at.value.includes('{{')) {
          const wh = whole(at.value);
          const v = wh ? get(scope, wh) : interp(at.value, scope);
          if (v === false || v == null) ch.removeAttribute(at.name); else ch.setAttribute(at.name, v === true ? 'true' : String(v));
        }
      }
      walk(ch.tagName === 'TEMPLATE' ? ch.content : ch, scope);
    }
  }
  document.body.appendChild(renderFile(name, props));
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 400));
  const el = document.body.firstElementChild;
  const r = el.getBoundingClientRect();
  // measure natural content height
  let maxB = 0;
  el.querySelectorAll('*').forEach((n) => { const b = n.getBoundingClientRect().bottom; if (b > maxB && n.offsetParent !== null) maxB = b; });
  return { w: r.width, h: r.height, contentBottom: Math.round(maxB) };
}, { files, name: file.replace('.dc.html', ''), props: JSON.parse(propsJson), actions: JSON.parse(actionsJson) });
await page.addStyleTag({ content: '*{animation-play-state:paused!important}' });
const crop = Number(process.env.CROP || 0);
if (crop) { let i = 0; for (let y = 0; y < size.h; y += crop, i++) await page.screenshot({ path: out.replace('.png', '-' + i + '.png'), clip: { x: 0, y, width: size.w, height: Math.min(crop, size.h - y) } }); }
else await page.screenshot({ path: out, clip: { x: 0, y: 0, width: Math.max(1, size.w), height: Math.max(1, size.h) } });
console.log(JSON.stringify(size));
await browser.close();
