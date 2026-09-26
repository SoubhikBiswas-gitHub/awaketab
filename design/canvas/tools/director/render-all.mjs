// Director: render every board in canvas.json (plus unlisted ones) statically, screenshot it,
// and dump a computed-style audit per element for the §11 drift report.
// usage: node render-all.mjs [filter-regex]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = await import('/Users/soubhik/Work/github/awaketab/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs');
const DIR = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const OUT = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/director/';
mkdirSync(OUT + 'shots', { recursive: true });
mkdirSync(OUT + 'audit', { recursive: true });
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
const filter = new RegExp(process.argv[2] || '.');
const browser = await chromium.launch();
const summary = [];
for (const [file, b] of Object.entries(boards)) {
  if (!filter.test(file)) continue;
  const name = file.replace('.dc.html', '');
  const page = await browser.newPage({ viewport: { width: b.w, height: Math.min(b.h, 8000) }, colorScheme: /Light/.test(name) ? 'light' : 'dark' });
  await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
  let res;
  try {
    res = await page.evaluate(async ({ files, name }) => {
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
      document.body.appendChild(renderFile(name, {}));
      await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 500));
      const parseC = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const blend = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
      const opac = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return Math.round(o * 100) / 100; };
      const contrast = (el, cs) => {
        const layers = []; let grad = false;
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); const c = parseC(s.backgroundColor); if (s.backgroundImage !== 'none') grad = true; if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
        let bg = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
        let fg = parseC(cs.color); if (!fg) return null; const o = opac(el); fg = blend([fg[0], fg[1], fg[2], fg[3] * o], bg);
        const a = lum(fg), b = lum(bg); return { r: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100, grad };
      };
      // audit
      const root = document.body.firstElementChild;
      const rr = root.getBoundingClientRect();
      const items = [];
      for (const el of root.querySelectorAll('*')) {
        if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const ownText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
        items.push({
          tag: el.tagName.toLowerCase(), src: el.getAttribute('data-src') || '', role: el.getAttribute('role') || '', aria: el.getAttribute('aria-label') || '',
          text: (ownText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), own: !!ownText,
          style: (el.getAttribute('style') || '').replace(/\s+/g, ' ').slice(0, 140),
          x: Math.round(r.left - rr.left), y: Math.round(r.top - rr.top), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
          fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ff: cs.fontFamily.split(',')[0], ls: cs.letterSpacing,
          bw: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].join(' '), bs: cs.borderTopStyle + ' ' + cs.borderLeftStyle,
          bc: cs.borderTopColor, bcl: cs.borderLeftColor, br: cs.borderTopLeftRadius, pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '),
          gap: cs.rowGap + ' ' + cs.columnGap, mar: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].join(' '),
          color: cs.color, bg: cs.backgroundColor, bgi: cs.backgroundImage.slice(0, 60), sh: cs.boxShadow.slice(0, 80), ol: cs.outlineWidth,
          disp: cs.display, cr: ownText ? contrast(el, cs) : null, op: opac(el),
        });
      }
      return { w: rr.width, h: rr.height, items };
    }, { files, name });
  } catch (e) { console.log('FAIL', file, e.message.slice(0, 200)); await page.close(); continue; }
  await page.addStyleTag({ content: '*{animation-play-state:paused!important}' });
  await page.waitForTimeout(100);
  const H = Math.min(res.h || b.h, 8000);
  await page.setViewportSize({ width: b.w, height: Math.max(1, Math.round(H)) });
  await page.screenshot({ path: OUT + 'shots/' + name + '.png', clip: { x: 0, y: 0, width: b.w, height: Math.max(1, Math.round(H)) } });
  writeFileSync(OUT + 'audit/' + name + '.json', JSON.stringify({ file, board: b, size: [res.w, res.h], items: res.items }));
  summary.push([file, b.w + 'x' + b.h, Math.round(res.w) + 'x' + Math.round(res.h), res.items.length]);
  console.log(file, b.w + 'x' + b.h, 'rendered', Math.round(res.w) + 'x' + Math.round(res.h), res.items.length, 'els');
  await page.close();
}
await browser.close();
writeFileSync(OUT + 'summary.json', JSON.stringify(summary));
