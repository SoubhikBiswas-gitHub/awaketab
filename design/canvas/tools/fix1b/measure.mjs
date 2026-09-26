// Director: render every board in canvas.json (plus unlisted ones) statically, screenshot it,
// and dump a computed-style audit per element for the §11 drift report.
// usage: node render-all.mjs [filter-regex]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = await import('/home/user/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const DIR = process.env.DIR || '/home/user/awaketab/design/canvas/project/';
const OUT = process.env.OUT || '/home/user/awaketab/design/canvas/tools/fix1b/before/';
const canvas = JSON.parse(readFileSync(DIR + 'canvas.json', 'utf8'));
const files = {};
for (const f of readdirSync(DIR)) if (f.endsWith('.dc.html')) files[f.replace('.dc.html', '')] = readFileSync(DIR + f, 'utf8');
const boards = { ...canvas.boards };
const extra = Object.fromEntries(Object.keys(files).map((n) => [n + '.dc.html', null]));
for (const k of Object.keys(extra)) if (!boards[k] && files[k.replace('.dc.html', '')]) {
  const m = /data-props='([^']*)'/.exec(files[k.replace('.dc.html', '')]);
  let w = 1280, h = 800;
  try { const p = JSON.parse(m[1]); w = p.$preview?.width ?? w; h = p.$preview?.height ?? h; } catch {}
  boards[k] = { w, h, title: '(unlisted) ' + k };
}

// usage: node measure.mjs Name '{"layout":"phone"}' width
const [name, propsJson, width] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 1000 } });
await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
const res = await page.evaluate(async ({ files, name, props }) => {
      class DCLogic { constructor(p) { this.props = p; this.state = {}; } setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state) : u) }; } forceUpdate() {} }
      const parse = (src) => {
        const js = src.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
        const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
        const root = src.split('</helmet>')[1].split('</x-dc>')[0];
        const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
        return { helmet, root, Component };
      };
      const get = (scope, path) => {
        path = (path || '').trim();
        if (path === 'true') return true; if (path === 'false') return false;
        if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
        return path.split('.').reduce((o, k) => (o == null ? o : o[k]), scope);
      };
      const whole = (v) => { const m = /^\{\{\s*([\w.$]+)\s*\}\}$/.exec(v || ''); return m ? m[1] : null; };
      const interp = (str, scope) => str.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
      const heads = new Set();
      function renderFile(nm, pr) {
        const { helmet, root, Component } = parse(files[nm]);
        if (!heads.has(nm)) { heads.add(nm); document.head.insertAdjacentHTML('beforeend', helmet); }
        const c = new Component(pr);
        try { c.componentDidMount && c.componentDidMount(); } catch {}
        const vals = c.renderVals();
        const tpl = document.createElement('template');
        tpl.innerHTML = root;
        const frag = tpl.content;
        walk(frag, vals, nm);
        return frag;
      }
      function walk(node, scope, src) {
        for (const ch of [...node.childNodes]) {
          if (ch.nodeType === 3) { ch.textContent = interp(ch.textContent, scope); continue; }
          if (ch.nodeType !== 1) continue;
          const tag = ch.tagName.toLowerCase();
          if (tag === 'sc-if') {
            const v = get(scope, whole(ch.getAttribute('value')));
            const f = document.createDocumentFragment();
            if (v) { walk(ch, scope, src); while (ch.firstChild) f.appendChild(ch.firstChild); }
            ch.replaceWith(f); continue;
          }
          if (tag === 'sc-for') {
            const list = get(scope, whole(ch.getAttribute('list'))) || [];
            const as = ch.getAttribute('as');
            const f = document.createDocumentFragment();
            list.forEach((item, i) => { const cl = ch.cloneNode(true); walk(cl, { ...scope, [as]: item, $index: i }, src); while (cl.firstChild) f.appendChild(cl.firstChild); });
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
            box.dataset.src = ch.getAttribute('name');
            const nm2 = ch.getAttribute('name');
            if (files[nm2]) box.appendChild(renderFile(nm2, pr));
            ch.replaceWith(box); continue;
          }
          ch.setAttribute('data-src', src);
          for (const at of [...ch.attributes]) {
            if (/^on[A-Z]/.test(at.name) || /^on[a-z]+$/.test(at.name)) { ch.removeAttribute(at.name); continue; }
            if (at.value.includes('{{')) {
              const wh = whole(at.value);
              const v = wh ? get(scope, wh) : interp(at.value, scope);
              if (v === false || v == null) ch.removeAttribute(at.name); else ch.setAttribute(at.name, v === true ? 'true' : String(v));
            }
          }
          walk(ch.tagName === 'TEMPLATE' ? ch.content : ch, scope, src);
        }
      }

      document.body.appendChild(renderFile(name, props));
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 400));
      const root = document.body.firstElementChild;
      const rr = root.getBoundingClientRect();
      let sum = 0; const kids = [];
      for (const ch of root.children) { const cs = getComputedStyle(ch); if (cs.position === 'absolute') continue; const r = ch.getBoundingClientRect(); const mt = parseFloat(cs.marginTop) || 0, mb = parseFloat(cs.marginBottom) || 0; const spacer = ch.children.length === 0 && !ch.textContent.trim() && cs.flexGrow === '1'; kids.push([ch.tagName, Math.round(r.height), spacer]); if (!spacer) sum += r.height + mt + mb; }
      const unresolved = (document.body.innerText.match(/\{\{[^}]*\}\}/g) || []).slice(0, 5);
      return { W: rr.width, H: rr.height, natural: Math.ceil(sum), kids, unresolved };
}, { files, name, props: JSON.parse(propsJson) });
console.log(JSON.stringify(res));
await browser.close();
