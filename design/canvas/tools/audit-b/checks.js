// In-page audit checks. window.__audit(W, H) -> { overflow, targets, contrast, ui, copy, metrics }
(function () {
  const parse = (s) => {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/.exec(s);
    if (!m) return null;
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  };
  const allColors = (s) => (s.match(/rgba?\([^)]*\)/g) || []).map(parse).filter(Boolean);
  const over = (f, b) => { const a = f[3]; return [f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a), 1]; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  const desc = (el) => {
    let s = el.localName;
    const al = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'));
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return s + (al ? '[' + al.slice(0, 30) + ']' : '') + (t ? ' "' + t + '"' : '');
  };
  const visible = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    }
    return true;
  };
  const effOpacity = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  const isAncestor = (a, b) => a !== b && a.contains(b);
  // Background candidates behind a point, starting from element `el` in the stack.
  function bgAt(x, y, el, meanMode) {
    const stack = document.elementsFromPoint(x, y);
    let i = stack.indexOf(el);
    if (i < 0) { for (let n = el.parentElement; n && i < 0; n = n.parentElement) i = stack.indexOf(n); }
    if (i < 0) i = 0;
    const covering = stack.slice(0, i).filter((n) => !n.contains(el) && !el.contains(n) && (() => { const b = parse(getComputedStyle(n).backgroundColor); return b && b[3] > 0.5; })());
    const layers = [];
    for (let k = i; k < stack.length; k++) {
      const n = stack[k];
      const cs = getComputedStyle(n);
      const op = effOpacity(n);
      const bc = parse(cs.backgroundColor);
      const gi = cs.backgroundImage && cs.backgroundImage !== 'none' ? allColors(cs.backgroundImage) : [];
      const L = [];
      if (gi.length) {
        const g = gi.map((c) => [c[0], c[1], c[2], c[3] * op]);
        const translucent = g.some((c) => c[3] < 0.999);
        if (meanMode && translucent) { const sa = g.reduce((s, c) => s + c[3], 0) || 1e-9; L.push({ solid: [g.reduce((s, c) => s + c[0] * c[3], 0) / sa, g.reduce((s, c) => s + c[1] * c[3], 0) / sa, g.reduce((s, c) => s + c[2] * c[3], 0) / sa, sa / g.length] }); }
        else L.push({ grad: g });
      }
      if (bc && bc[3] > 0) L.push({ solid: [bc[0], bc[1], bc[2], bc[3] * op] });
      layers.push(...L);
      const opaque = (bc && bc[3] * op >= 0.999) || (gi.length && gi.every((c) => c[3] * op >= 0.999));
      if (opaque) break;
    }
    let cands = [[255, 255, 255, 1]];
    for (let k = layers.length - 1; k >= 0; k--) {
      const L = layers[k];
      if (L.solid) cands = cands.map((c) => over(L.solid, c));
      else { const next = []; for (const g of L.grad) for (const c of cands) next.push(over(g, c)); cands = next.slice(0, 64); }
    }
    return { cands, covering };
  }
  window.__audit = function (W, H) {
    const root = document.getElementById('app').firstElementChild;
    const R = root.getBoundingClientRect();
    const res = { transient: [], overflow: [], targets: [], exempt: [], contrast: [], invisible: [], ui: [], overlap: [], covered: [], texts: [], outputs: [], metrics: {} };
    // --- overflow
    const sw = document.documentElement.scrollWidth;
    if (sw > W + 1) res.overflow.push({ kind: 'doc-scrollWidth', detail: sw + ' > ' + W });
    const clipOf = (el) => { for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return n; } return null; };
    const blockOf = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const d = getComputedStyle(n).display; if (d !== 'inline' && d !== 'contents') return n; } return root; };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) { const t = walker.currentNode; if (t.textContent.trim()) textNodes.push(t); }
    for (const t of textNodes) {
      const el = t.parentElement;
      if (!visible(el)) continue;
      const srOnly = (() => { for (let n = el; n && n !== root; n = n.parentElement) { const r = n.getBoundingClientRect(); const cs2 = getComputedStyle(n); if ((r.width <= 1.5 || r.height <= 1.5) && cs2.display !== 'inline' && cs2.display !== 'contents' && cs2.overflowX !== 'visible') return true; if (cs2.clip && cs2.clip !== 'auto') return true; } return false; })();
      if (srOnly) continue;
      if (el.closest('style,script,title')) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      const rects = [...rg.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      if (!rects.length) continue;
      const txt = t.textContent.trim().replace(/\s+/g, ' ');
      const cs = getComputedStyle(el);
      const hidden = !!el.closest('[aria-hidden="true"]');
      const clip = clipOf(el);
      const blk = blockOf(el);
      const B = blk.getBoundingClientRect();
      const C = clip ? clip.getBoundingClientRect() : R;
      let inRoot = false;
      for (const r of rects) {
        const scroller = clip && /auto|scroll/.test(getComputedStyle(clip).overflowY + getComputedStyle(clip).overflowX);
        if (r.top >= R.bottom - 1 || r.bottom > R.bottom + 2) { if (!scroller && !hidden) res.overflow.push({ kind: 'text-below-board', el: desc(el), detail: 'top ' + Math.round(r.top - R.top) + ' board h ' + Math.round(R.height) }); if (r.top >= R.bottom - 1) continue; }
        if (r.right < R.left || r.left > R.right || r.bottom < R.top) continue;
        if (scroller && (r.bottom > C.bottom + 2 || r.top < C.top - 2)) { inRoot = true; continue; }
        inRoot = true;
        if (r.right > R.right + 1 || r.left < R.left - 1) res.overflow.push({ kind: 'text-outside-root', el: desc(el), detail: Math.round(r.left) + '..' + Math.round(r.right) });
        else if (clip && (r.right > C.right + 1 || r.left < C.left - 1 || r.bottom > C.bottom + 2 || r.top < C.top - 2)) res.overflow.push({ kind: 'text-clipped', el: desc(el), clip: desc(clip).slice(0, 40), detail: 'text ' + Math.round(r.left) + '..' + Math.round(r.right) + ' x ' + Math.round(r.top) + '..' + Math.round(r.bottom) + ' clip ' + Math.round(C.left) + '..' + Math.round(C.right) + ' x ' + Math.round(C.top) + '..' + Math.round(C.bottom) });
        else if (r.right > B.right + 1.5 || r.left < B.left - 1.5) res.overflow.push({ kind: 'text-spills-box', el: desc(el), detail: 'text ' + Math.round(r.left) + '..' + Math.round(r.right) + ' box ' + Math.round(B.left) + '..' + Math.round(B.right) });
      }
      if (!inRoot) continue;
      for (const r of rects) (res._tr = res._tr || []).push({ el, r, hidden, txt });
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) res.overflow.push({ kind: 'ellipsised', el: desc(el) });
      // contrast
      const isSvg = el instanceof SVGElement;
      const fc = parse(isSvg ? cs.fill : cs.color);
      if (!fc) continue;
      const op = effOpacity(el);
      const r0 = rects[0];
      const px = Math.min(Math.max(r0.left + r0.width / 2, 1), window.innerWidth - 1), py = Math.min(Math.max(r0.top + r0.height / 2, 1), window.innerHeight - 1);
      const { cands, covering } = bgAt(px, py, el, false);
      const meanC = bgAt(px, py, el, true).cands;
      if (covering.length && !hidden) res.covered.push({ el: desc(el), by: covering.map(desc).slice(0, 2) });
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10);
      const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const need = large ? 3 : 4.5;
      let min = 99, worstBg = null;
      for (const b of cands) { const f = over([fc[0], fc[1], fc[2], fc[3] * op], b); const q = ratio(f, b); if (q < min) { min = q; worstBg = b; } }
      const disabled = !!el.closest('button[disabled],[aria-disabled="true"],input[disabled]');
      let minM = 99; for (const b of meanC) { const f = over([fc[0], fc[1], fc[2], fc[3] * op], b); minM = Math.min(minM, ratio(f, b)); }
      const entry = { text: txt.slice(0, 50), fg: hex(fc) + (fc[3] * op < 1 ? '@' + (fc[3] * op).toFixed(2) : ''), bg: hex(worstBg), ratio: +minM.toFixed(2), worst: +min.toFixed(2), need, fs, fw, hidden, disabled, font: cs.fontFamily.split(',')[0].replace(/"/g, '') };
      if (min < need && !disabled) { const u = rects.reduce((a, r) => ({ l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 }); entry.id = 'a' + (window.__aid = (window.__aid || 0) + 1); el.setAttribute('data-audit-id', entry.id); entry.rect = [u.l, u.t, u.r - u.l, u.b - u.t]; entry.fgRaw = [fc[0], fc[1], fc[2], fc[3] * op]; }
      res.texts.push(entry);
      if (minM < 1.5) res.invisible.push(entry);
      if (minM < need && !disabled) res.contrast.push(entry);
      else if (min < need && !disabled) (res.transient = res.transient || []).push(entry);
    }
    // --- text overlapping other text
    const TR = res._tr || []; delete res._tr;
    const seenPairs = new Set();
    for (let i = 0; i < TR.length; i++) for (let j = i + 1; j < TR.length; j++) {
      const A = TR[i], B = TR[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const ix = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), iy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (ix > 2 && iy > 3) { const k = A.txt + '|' + B.txt; if (seenPairs.has(k)) continue; seenPairs.add(k); res.overflow.push({ kind: 'text-overlap' + (A.hidden || B.hidden ? '(aria-hidden)' : ''), el: A.txt.slice(0, 30) + ' X ' + B.txt.slice(0, 30), detail: Math.round(ix) + 'x' + Math.round(iy) }); }
    }
    // --- targets
    const sel = 'button, a[href], input:not([type=hidden]), select, textarea, [role=switch], [role=button], [role=tab], [role=radio], [role=checkbox], summary';
    const ctrls = [...root.querySelectorAll(sel)].filter((e) => visible(e) && !e.closest('[aria-hidden="true"]'));
    const boxes = [];
    for (const e of ctrls) {
      let r = e.getBoundingClientRect();
      const lab = e.closest('label');
      if (lab) { const L = lab.getBoundingClientRect(); if (L.width * L.height > r.width * r.height) r = L; }
      if (r.width === 0 && r.height === 0) continue;
      if (r.bottom < R.top || r.top > R.bottom) continue;
      boxes.push([e, r, lab]);
      const cs = getComputedStyle(e);
      const inlineLink = e.localName === 'a' && cs.display === 'inline' && [...e.parentElement.childNodes].some((n) => n !== e && n.nodeType === 3 && n.textContent.trim());
      const small = r.width < 43.5 || r.height < 43.5;
      if (small) {
        const item = { el: desc(e), w: Math.round(r.width), h: Math.round(r.height) };
        if (inlineLink) res.exempt.push(Object.assign(item, { why: 'inline text link' }));
        else res.targets.push(item);
      }
      // non-text UI contrast for inputs, switches, checkboxes
      if (e.matches('input[type=text],input[type=email],input[type=url],input[type=number],input[type=search],input:not([type]),textarea,select,[role=switch],input[type=checkbox],input[type=range]')) {
        const outer = bgAt(r.left + 1, r.top + 1, e.parentElement).cands[0];
        const bc = parse(cs.borderTopColor), bw = parseFloat(cs.borderTopWidth);
        const ib = parse(cs.backgroundColor);
        let best = 1;
        if (bc && bw > 0) best = Math.max(best, ratio(over(bc, outer), outer));
        if (ib && ib[3] > 0) best = Math.max(best, ratio(over(ib, outer), outer));
        // switch: inner track/knob children
        if (e.matches('[role=switch]')) for (const k of e.querySelectorAll('*')) { const kb = parse(getComputedStyle(k).backgroundColor); if (kb && kb[3] > 0) best = Math.max(best, ratio(over(kb, outer), outer)); }
        if (best < 3) res.ui.push({ el: desc(e), ratio: +best.toFixed(2), border: bc ? hex(bc) : '-', bg: hex(outer) });
      }
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const [a, ra, la] = boxes[i], [b, rb, lb] = boxes[j];
      if (a.contains(b) || b.contains(a) || (la && la === lb)) continue;
      const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ix > 1 && iy > 1) res.overlap.push({ a: desc(a), b: desc(b), area: Math.round(ix * iy) });
    }
    // element boxes (interactive) outside root
    for (const [e, r] of boxes) if (r.right > R.right + 1 || r.left < R.left - 1) res.overflow.push({ kind: 'control-outside-root', el: desc(e), detail: Math.round(r.left) + '..' + Math.round(r.right) });
    // outputs (pills)
    for (const o of root.querySelectorAll('output')) { const cs = getComputedStyle(o); const r = o.getBoundingClientRect(); res.outputs.push({ text: o.textContent.trim().replace(/\s+/g, ' '), h: Math.round(r.height), fs: cs.fontSize, fw: cs.fontWeight, pad: cs.padding, radius: cs.borderTopLeftRadius, glyph: (() => { const s = o.querySelector('svg'); return s ? Math.round(s.getBoundingClientRect().width) : 0; })() }); }
    // --- metrics for consistency
    const m = res.metrics;
    const hdr = root.querySelector('header');
    if (hdr) {
      const hr = hdr.getBoundingClientRect();
      const logo = hdr.querySelector('a, div');
      const lsvg = hdr.querySelector('svg');
      const lcs = logo ? getComputedStyle(logo) : null;
      m.header = { h: Math.round(hr.height), pad: getComputedStyle(hdr).padding, logoSvg: lsvg ? Math.round(lsvg.getBoundingClientRect().width) : 0, logoFs: lcs && lcs.fontSize, logoFw: lcs && lcs.fontWeight, logoGap: lcs && lcs.gap, logoText: logo ? logo.textContent.trim().slice(0, 30) : '' };
    }
    const ts = root.querySelector('[role=radiogroup][aria-label*="heme" i]');
    if (ts) { const segs = [...ts.querySelectorAll('button,[role=radio]')]; const r0 = segs[0] && segs[0].getBoundingClientRect(); const tcs = getComputedStyle(ts); m.themeSwitch = { n: segs.length, segW: r0 ? Math.round(r0.width) : 0, segH: r0 ? Math.round(r0.height) : 0, pad: tcs.padding, radius: tcs.borderTopLeftRadius, labels: segs.map((s) => s.getAttribute('aria-label') || s.textContent.trim()).join('/') }; }
    const btn = {};
    for (const b of root.querySelectorAll('button, a[href]')) {
      if (!visible(b)) continue; const cs = getComputedStyle(b); const r = b.getBoundingClientRect(); if (!r.width) continue;
      if (b.localName === 'a' && cs.display === 'inline') continue;
      const hasBg = (parse(cs.backgroundColor) || [0, 0, 0, 0])[3] > 0 || parseFloat(cs.borderTopWidth) > 0;
      if (!hasBg) continue;
      if (b.getAttribute('role') === 'radio' || b.getAttribute('role') === 'tab' || b.getAttribute('role') === 'switch') continue;
      const k = Math.round(r.height) + 'h/r' + cs.borderTopLeftRadius;
      btn[k] = (btn[k] || 0) + 1;
    }
    m.buttons = btn;
    const fsz = {};
    for (const t of res.texts) { const k = t.fs; fsz[k] = (fsz[k] || 0) + 1; }
    m.fontSizes = fsz;
    const fonts = {};
    for (const t of res.texts) fonts[t.font] = (fonts[t.font] || 0) + 1;
    m.fonts = fonts;
    m.rootBg = getComputedStyle(root).backgroundImage !== 'none' ? getComputedStyle(root).backgroundImage.slice(0, 120) : getComputedStyle(root).backgroundColor;
    m.rootInk = getComputedStyle(root).color;
    const radii = {}, bws = {}, ctrlH = {}, weights = {};
    for (const n of root.querySelectorAll('*')) {
      if (n instanceof SVGElement && n.localName !== 'svg') continue;
      if (!visible(n) || n.closest('[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(n); const r = n.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const bgA = (parse(cs.backgroundColor) || [0, 0, 0, 0])[3] > 0 || cs.backgroundImage !== 'none';
      const bw = parseFloat(cs.borderTopWidth) || parseFloat(cs.borderLeftWidth) || 0;
      if ((bgA || bw) && cs.borderTopLeftRadius !== '0px') { let rv = cs.borderTopLeftRadius; if (cs.borderTopLeftRadius.endsWith('%') || parseFloat(rv) >= Math.min(r.width, r.height) / 2 - 0.5) rv = 'full'; radii[rv] = (radii[rv] || 0) + 1; }
      if (bw && cs.borderTopStyle !== 'none') bws[bw] = (bws[bw] || 0) + 1;
    }
    for (const e of ctrls) { if (e.closest('[aria-hidden="true"]')) continue; const cs = getComputedStyle(e); if (e.localName === 'a' && cs.display === 'inline') continue; const r = e.getBoundingClientRect(); if (!r.height) continue; const k = (e.getAttribute('role') || e.localName) + ':' + Math.round(r.height); ctrlH[k] = (ctrlH[k] || 0) + 1; }
    for (const t of res.texts) if (!t.hidden) weights[t.fw] = (weights[t.fw] || 0) + 1;
    m.radii = radii; m.borderW = bws; m.ctrlH = ctrlH; m.weights = weights;
    m.segBars = [...root.querySelectorAll('[role=tablist],[role=radiogroup]')].map((g) => { const cs = getComputedStyle(g); const r = g.getBoundingClientRect(); const it = g.querySelector('button'); return { label: g.getAttribute('aria-label'), h: Math.round(r.height), radius: cs.borderTopLeftRadius, itemH: it ? Math.round(it.getBoundingClientRect().height) : 0 }; });
    return res;
  };
})();
