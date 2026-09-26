// Browser-side: static renderer for .dc.html boards + automated audit checks.
// window.__render(files, name, props, patch) -> mounts into document.body
// window.__audit({W,H}) -> results object
(function () {
  class DCLogic {
    constructor(p) { this.props = p || {}; this.state = this.state || {}; }
    setState(u) { this.state = { ...this.state, ...(typeof u === 'function' ? u(this.state, this.props) : u) }; }
    forceUpdate() {}
  }
  const parse = (src) => {
    const js = src.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
    const helmet = src.split('<helmet>')[1].split('</helmet>')[0];
    const root = src.split('</helmet>')[1].split('</x-dc>')[0];
    const Component = new Function('DCLogic', js + '\nreturn Component;')(DCLogic);
    return { helmet, root, Component };
  };
  const lit = (p) => (p === 'true' ? true : p === 'false' ? false : /^-?\d+(\.\d+)?$/.test(p) ? Number(p) : undefined);
  const get = (scope, path) => {
    path = path.trim();
    const l = lit(path); if (l !== undefined) return l;
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  };
  const whole = (v) => { const m = /^\{\{\s*([\w.$]+)\s*\}\}$/.exec((v || '').trim()); return m ? m[1] : null; };
  const interp = (str, scope) => str.replace(/\{\{\s*([\w.$]+)\s*\}\}/g, (_, p) => { const v = get(scope, p); return v == null ? '' : String(v); });
  const BOOL = new Set(['disabled', 'checked', 'hidden', 'readonly', 'selected', 'open', 'required', 'multiple', 'autofocus']);
  const heads = new Set();
  const errors = [];
  function renderFile(files, nm, pr, patch) {
    if (!files[nm]) { errors.push('missing file ' + nm); return document.createDocumentFragment(); }
    const { helmet, root, Component } = parse(files[nm]);
    if (!heads.has(nm)) { heads.add(nm); document.head.insertAdjacentHTML('beforeend', helmet); }
    let c;
    try { c = new Component(pr); if (!c.state) c.state = {}; } catch (e) { errors.push(nm + ' ctor: ' + e.message); return document.createDocumentFragment(); }
    if (c.componentDidMount) { try { c.componentDidMount(); } catch (e) { errors.push(nm + ' didMount: ' + e.message); } }
    if (patch) Object.assign(c.state, patch);
    let vals;
    try { vals = c.renderVals(); } catch (e) { errors.push(nm + ' renderVals: ' + e.message); vals = {}; }
    const tpl = document.createElement('template');
    tpl.innerHTML = root;
    walk(files, tpl.content, vals, nm);
    const first = tpl.content.firstElementChild;
    if (first) first.setAttribute('data-dcfile', nm);
    return tpl.content;
  }
  function walk(files, node, scope, nm) {
    for (const ch of [...node.childNodes]) {
      if (ch.nodeType === 3) { if (ch.textContent.includes('{{')) ch.textContent = interp(ch.textContent, scope); continue; }
      if (ch.nodeType !== 1) continue;
      const tag = ch.tagName.toLowerCase();
      if (tag === 'sc-if') {
        const v = get(scope, whole(ch.getAttribute('value')) || 'false');
        const f = document.createDocumentFragment();
        if (v) { walk(files, ch, scope, nm); while (ch.firstChild) f.appendChild(ch.firstChild); }
        ch.replaceWith(f); continue;
      }
      if (tag === 'sc-for') {
        const list = get(scope, whole(ch.getAttribute('list')) || 'x') || [];
        const as = ch.getAttribute('as');
        const f = document.createDocumentFragment();
        list.forEach((item, i) => {
          const cl = ch.cloneNode(true);
          walk(files, cl, { ...scope, [as]: item, $index: i }, nm);
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
        box.setAttribute('data-dcimport', ch.getAttribute('name'));
        box.style.cssText = 'width:' + hs[0] + ';height:' + hs[1];
        box.appendChild(renderFile(files, ch.getAttribute('name'), pr));
        ch.replaceWith(box); continue;
      }
      for (const at of [...ch.attributes]) {
        if (/^on[A-Z]/.test(at.name) || /^on[a-z]+$/.test(at.name) || at.name === 'ref') { ch.removeAttribute(at.name); continue; }
        if (at.value.includes('{{')) {
          const wh = whole(at.value);
          const v = wh ? get(scope, wh) : interp(at.value, scope);
          if (v == null || (v === false && (BOOL.has(at.name.toLowerCase()) || !at.name.startsWith('aria-')))) ch.removeAttribute(at.name);
          else ch.setAttribute(at.name, v === true ? (BOOL.has(at.name.toLowerCase()) ? '' : 'true') : String(v));
        }
      }
      walk(files, tag === 'template' ? ch.content : ch, scope, nm);
    }
  }
  window.__render = function (files, name, props, patch) {
    const frag = renderFile(files, name, props, patch);
    document.body.appendChild(frag);
    return errors;
  };

  // ---------------- audit ----------------
  const parseColor = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s || '');
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const isSvgInner = (el) => el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg';
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5;
  };
  const effOpacity = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const fileOf = (el) => { const f = el.closest('[data-dcfile]'); return f ? f.getAttribute('data-dcfile') : '?'; };
  const desc = (el) => {
    if (!el) return 'null';
    const t = (el.getAttribute && (el.getAttribute('aria-label') || '')) || '';
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return el.tagName.toLowerCase() + (t ? '[' + t + ']' : '') + (txt ? ' "' + txt + '"' : '');
  };
  const clipAncestor = (el, root) => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || (cs.clipPath && cs.clipPath !== 'none')) return { el: e, cs };
      if (e === root) break;
    }
    return { el: root, cs: getComputedStyle(root) };
  };
  const INTER = 'button, a[href], input:not([type=hidden]), select, textarea, [role=switch], [role=button], [role=tab], [role=radio], [role=checkbox], summary';

  window.__audit = function ({ W, H }) {
    const root = document.body.firstElementChild;
    const R = root.getBoundingClientRect();
    const out = { overflow: [], textClip: [], overlap: [], occluded: [], targets: [], targetExempt: [], texts: [], pill: [], times: [], emdash: [], inputs: [] };
    out.docScroll = { sw: document.documentElement.scrollWidth, W };
    out.rootScroll = { sw: root.scrollWidth, sh: root.scrollHeight, W, H };
    const all = [...root.querySelectorAll('*')];
    // text nodes
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.textContent.trim() && n.parentElement && !['STYLE', 'SCRIPT', 'TITLE'].includes(n.parentElement.tagName)) textNodes.push(n);
    const dialogs0 = [...root.querySelectorAll('[role=dialog][aria-modal=true],[role=alertdialog]')].filter(visible);
    for (const n of textNodes) {
      const el = n.parentElement;
      if (!visible(el)) continue;
      if (el.closest('svg') && el.tagName.toLowerCase() !== 'text') { /* svg text */ }
      const cs = getComputedStyle(el);
      const range = document.createRange(); range.selectNodeContents(n);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      if (!rects.length) continue;
      const rr = range.getBoundingClientRect();
      const txt = n.textContent.trim().replace(/\s+/g, ' ');
      const file = fileOf(el);
      const op = effOpacity(el);
      const ariaHidden = !!el.closest('[aria-hidden="true"]');
      // clipping vs clip ancestor / root
      const ca = clipAncestor(el, root);
      const cr = ca.el.getBoundingClientRect();
      const scrollable = /auto|scroll/.test(ca.cs.overflowX + ca.cs.overflowY);
      const clipX = rr.left < cr.left - 1 || rr.right > cr.right + 1;
      const clipY = rr.top < cr.top - 1 || rr.bottom > cr.bottom + 1;
      const hasClipPath = ca.cs.clipPath && ca.cs.clipPath !== 'none';
      if ((clipX || clipY) && !hasClipPath && op > 0.05) {
        const fully = rr.right < cr.left || rr.left > cr.right || rr.bottom < cr.top || rr.top > cr.bottom;
        out.overflow.push({ file, text: txt.slice(0, 60), kind: scrollable ? 'in-scroller' : fully ? 'hidden-outside' : 'clipped', axis: (clipX ? 'x' : '') + (clipY ? 'y' : ''), by: desc(ca.el).slice(0, 40), rect: [Math.round(rr.left - R.left), Math.round(rr.top - R.top), Math.round(rr.width), Math.round(rr.height)], clipRect: [Math.round(cr.left - R.left), Math.round(cr.top - R.top), Math.round(cr.width), Math.round(cr.height)], ariaHidden });
      }
      // text exceeding own (block) box horizontally
      let box = el; while (box && getComputedStyle(box).display.startsWith('inline') && box !== root) box = box.parentElement;
      const br = box.getBoundingClientRect();
      const bcs = getComputedStyle(box);
      const padL = parseFloat(bcs.paddingLeft) || 0, padR = parseFloat(bcs.paddingRight) || 0;
      if ((rr.left < br.left - 1 || rr.right > br.right + 1) && op > 0.05 && !(clipX && !scrollable)) {
        out.textClip.push({ file, text: txt.slice(0, 60), kind: 'exceeds-box', box: desc(box).slice(0, 50), over: Math.round(Math.max(br.left - rr.left, rr.right - br.right)) });
      } else if ((rr.left < br.left + padL - 2 || rr.right > br.right - padR + 2) && op > 0.05 && padL + padR > 0 && box.tagName !== 'BUTTON') {
        // into padding: minor
      }
      if ((cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden') && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        out.textClip.push({ file, text: txt.slice(0, 60), kind: cs.textOverflow === 'ellipsis' ? 'ellipsised' : 'overflow-hidden-cut', sw: el.scrollWidth, cw: el.clientWidth });
      }
      // occlusion at centre
      const cx = rects[0].left + rects[0].width / 2, cy = rects[0].top + rects[0].height / 2;
      let occ = null;
      if (cx >= 0 && cy >= 0 && cx < innerWidth && cy < innerHeight && cs.pointerEvents !== 'none') {
        const hit = document.elementFromPoint(cx, cy);
        if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) occ = hit;
      }
      if (occ && !(dialogs0.length && !dialogs0.some((d) => d.contains(el)))) out.occluded.push({ file, text: txt.slice(0, 50), by: desc(occ).slice(0, 50), byFile: fileOf(occ) });
      const col = parseColor(cs.color);
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10);
      out.texts.push({ file, text: txt.slice(0, 50), color: col, op, fs, fw, rect: [rr.left - R.left, rr.top - R.top, rr.width, rr.height], lineRects: rects.slice(0, 3).map((r) => [r.left - R.left, r.top - R.top, r.width, r.height]), occluded: !!occ, ariaHidden, clipped: (clipX || clipY) && !scrollable, clipPath: hasClipPath });
      // copy checks
      if (/\b\d{1,2}:\d{2}\b/.test(txt)) out.times.push({ file, text: txt.slice(0, 90), tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || (el.closest('[role=timer]') ? 'in-timer' : '') });
      if (txt.includes('—')) out.emdash.push({ file, text: txt.slice(0, 100) });
      if (el.closest('output') || /^(Ready|Starting…|Screen awake|Paused|Blocked|Tap to use|Awake via|Starts when|System awake|Screen may dim)/.test(txt)) out.pill.push({ file, text: txt, inOutput: !!el.closest('output') });
    }
    // interactive targets + overlaps
    const dialogs = [...root.querySelectorAll('[role=dialog][aria-modal=true],[role=alertdialog]')].filter(visible);
    out.modal = dialogs.length > 0;
    const centreHit = (el) => { const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) return false; const h = document.elementFromPoint(cx, cy); return !!h && (h === el || el.contains(h) || h.contains(el)); };
    let inter = [...root.querySelectorAll(INTER)].filter((e) => visible(e) && getComputedStyle(e).pointerEvents !== 'none');
    if (out.modal) { out.inertCount = inter.filter((e) => !dialogs.some((d) => d.contains(e))).length; inter = inter.filter((e) => dialogs.some((d) => d.contains(e))); }
    for (const el of inter) {
      let r = el.getBoundingClientRect();
      let w = r.width, h = r.height;
      if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
        const lab = el.closest('label') || (el.id && root.querySelector('label[for="' + el.id + '"]'));
        if (lab && lab.contains(el)) { const lr = lab.getBoundingClientRect(); w = Math.max(w, lr.width); h = Math.max(h, lr.height); }
        // non-text contrast: border vs bg
        const cs = getComputedStyle(el);
        out.inputs.push({ file: fileOf(el), el: desc(el).slice(0, 40), border: parseColor(cs.borderTopColor), bw: parseFloat(cs.borderTopWidth), rect: [r.left - R.left, r.top - R.top, r.width, r.height], type: el.type });
      }
      const file = fileOf(el);
      if (w < 43.5 || h < 43.5) {
        const cs = getComputedStyle(el);
        const inlineLink = el.tagName === 'A' && cs.display === 'inline' && el.parentElement && [...el.parentElement.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
        const rec = { file, el: desc(el).slice(0, 60), w: Math.round(w), h: Math.round(h) };
        if (inlineLink) { rec.why = 'inline link'; out.targetExempt.push(rec); }
        else if (file === 'PipWindow') { rec.why = 'PiP window'; out.targetExempt.push(rec); }
        else out.targets.push(rec);
      }
    }
    for (let i = 0; i < inter.length; i++) for (let j = i + 1; j < inter.length; j++) {
      const a = inter[i], b = inter[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ix > 1 && iy > 1) out.overlap.push({ file: fileOf(a), a: desc(a).slice(0, 40), b: desc(b).slice(0, 40), ix: Math.round(ix), iy: Math.round(iy) });
    }
    // interactive element occlusion (centre)
    for (const el of inter) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) { out.occluded.push({ file: fileOf(el), text: desc(el).slice(0, 50), by: 'offscreen', interactive: true }); continue; }
      const hit = document.elementFromPoint(cx, cy);
      if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) out.occluded.push({ file: fileOf(el), text: desc(el).slice(0, 50), by: desc(hit).slice(0, 50), byFile: fileOf(hit), interactive: true });
      // clipped interactive
      const ca = clipAncestor(el, root); const cr = ca.el.getBoundingClientRect();
      if (!/auto|scroll/.test(ca.cs.overflowX + ca.cs.overflowY) && (r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1)) out.overflow.push({ file: fileOf(el), text: desc(el).slice(0, 50), kind: 'interactive-clipped', by: desc(ca.el).slice(0, 40), rect: [Math.round(r.left - R.left), Math.round(r.top - R.top), Math.round(r.width), Math.round(r.height)] });
    }
    // non-text elements (boxes) that stick out of the root horizontally (causing ugly clipping), non-decorative only
    for (const el of all) {
      if (isSvgInner(el) || !visible(el)) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.position === 'absolute' || cs.position === 'fixed') continue;
      if (r.right > R.right + 1 || r.left < R.left - 1) {
        const ca = clipAncestor(el, root);
        if (/auto|scroll/.test(ca.cs.overflowX)) continue;
        out.overflow.push({ file: fileOf(el), text: desc(el).slice(0, 50), kind: 'box-outside-root-x', rect: [Math.round(r.left - R.left), Math.round(r.top - R.top), Math.round(r.width), Math.round(r.height)] });
      }
    }
    // text-on-text collisions (glyph boxes approximated by line rects shrunk 22% vertically)
    out.textOverlap = [];
    const tr = [];
    for (const t of out.texts) { if (t.ariaHidden || t.occluded || t.op < 0.05) continue; for (const r of t.lineRects) tr.push({ t, x: r[0], y: r[1] + r[3] * 0.22, w: r[2], h: r[3] * 0.56 }); }
    for (let i = 0; i < tr.length; i++) for (let j = i + 1; j < tr.length; j++) {
      const a = tr[i], b = tr[j]; if (a.t === b.t) continue;
      const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ix > 2 && iy > 2) out.textOverlap.push({ file: a.t.file, a: a.t.text.slice(0, 40), b: b.t.text.slice(0, 40), ix: Math.round(ix), iy: Math.round(iy) });
    }
    // natural content bottom
    let maxB = 0;
    for (const t of out.texts) maxB = Math.max(maxB, t.rect[1] + t.rect[3]);
    out.contentBottom = Math.round(maxB);
    return out;
  };
})();
