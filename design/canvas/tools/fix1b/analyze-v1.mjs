// Check audit dumps against DESIGN.md §11 and group violations by source file.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const A = process.env.A || '/home/user/awaketab/design/canvas/tools/fix1b/before/audit/';
const SPACE = new Set([0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96]);
const RADII = new Set([0, 4, 8, 12, 16, 20, 28, 999]);
const HEIGHTS = new Set([44, 48, 52, 60, 64]);
const FS = new Set([12, 13, 14, 15, 16, 17, 18, 20, 24, 28, 34, 48]);
const TOK = `0A0E16 13203A F2F6FA FFFFFF 111826 1F2940 DCE3EC 33405C C3CDDA EAF0F7 0E1726 B7C1D1 3A4659 8E9AAE 5B6779 1A2336 E3E9F1 2A3752 CCD5E1 F2B34C B7791F FF7A7A D14343 04232A 26324B 0D131F F6F9FC F6F2EA FF5A3C E8563C A89690 3A2E2A 5BE0E8 087B87 A594FF 5A47CF 7EF0B8 167A50 7CB8FF 255FBD 000000 0A0A0A`.split(' ');
const tokRGB = TOK.map((h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
const px = (v) => parseFloat(v);
const rgb = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase();
const offTok = (c) => { if (!c || c.a === 0) return false; return !tokRGB.some((t) => Math.abs(t[0] - c.r) + Math.abs(t[1] - c.g) + Math.abs(t[2] - c.b) <= 6); };
const isDisplay = (it) => px(it.fs) > 48 || (/Mono|Grotesk/.test(it.ff) && px(it.fs) >= 28);
const isControl = (it) => ['button', 'input', 'select', 'textarea'].includes(it.tag) || it.role === 'tab' || it.role === 'radio' || it.role === 'switch' || (it.tag === 'a' && (it.bg !== 'rgba(0, 0, 0, 0)' || px(it.bw.split(' ')[0]) > 0) && it.disp !== 'inline');
const V = {}; // key: src -> list
const counts = {};
const boardsBySrc = {};
function add(src, kind, snippet, current, required, board) {
  const k = src || '?';
  V[k] ??= new Map();
  const key = kind + '|' + current + '|' + snippet;
  const e = V[k].get(key) ?? { kind, snippet, current, required, n: 0, boards: new Set() };
  e.n++; e.boards.add(board); V[k].set(key, e);
  counts[k] ??= {}; counts[k][kind] = (counts[k][kind] ?? 0) + 1;
}
const perBoard = {};
for (const f of readdirSync(A)) {
  const d = JSON.parse(readFileSync(A + f, 'utf8'));
  const board = d.file.replace('.dc.html', '');
  perBoard[board] = {};
  const pb = (k) => { perBoard[board][k] = (perBoard[board][k] ?? 0) + 1; };
  const items = d.items;
  // index for nesting via geometry
  const cards = items.filter((it) => { const bw = it.bw.split(' ').map(px); return bw.every((b) => b >= 1) && px(it.br) >= 12 && px(it.br) < 999 && !isControl(it) && it.w > 120 && it.h > 60 && it.tag !== 'svg'; });
  for (const it of items) {
    const src = it.src;
    if (process.env.SKIP && new RegExp(process.env.SKIP).test(src)) continue;
    const snip = (it.aria ? '[' + it.aria + '] ' : '') + (it.text ? '"' + it.text.slice(0, 28) + '"' : '') + (it.style ? ' {' + it.style.slice(0, 70) + '}' : '');
    const tag = '<' + it.tag + (it.role ? ' role=' + it.role : '') + '>';
    const where = tag + ' ' + snip;
    if (it.tag === 'svg' || it.tag === 'path' || it.tag === 'img' || it.tag === 'iframe') continue;
    // borders
    const bw = it.bw.split(' ').map(px);
    const bad = bw.filter((b) => b > 0 && Math.abs(b - 1) > 0.01);
    if (bad.length) { add(src, 'border-width', where, bad[0] + 'px', '1px', board); pb('border'); }
    const nz = bw.map((b) => b > 0);
    if (nz[3] && !nz[0] && !nz[1] && !nz[2] && it.h > 20) { add(src, 'side-stripe', where, 'border-inline-start only (' + bw[3] + 'px)', 'no side stripes', board); pb('stripe'); }
    if (/dashed/.test(it.bs) && bw.some((b) => b > 0) && !/Until|Custom|Add|custom|until|add/i.test(it.text + it.aria)) { add(src, 'dashed-decorative', where, 'dashed', 'dashed only on choose/add affordances', board); pb('dashed'); }
    // radius
    const r = px(it.br);
    if (!/%/.test(it.br) && r > 0 && !RADII.has(Math.round(r)) && r < 500) { add(src, 'radius', where, r + 'px', 'one of 8/12/16/20/28/999', board); pb('radius'); }
    // spacing: padding + gap
    const pads = it.pad.split(' ').map(px);
    const badPad = pads.filter((p) => !SPACE.has(Math.round(p)) || Math.abs(p - Math.round(p)) > 0.01);
    if (badPad.length && !(it.tag === 'input' || it.tag === 'textarea' || it.tag === 'select')) { add(src, 'padding', where, it.pad, 'scale 4/8/12/16/20/24/32/40/48/64/96', board); pb('spacing'); }
    const gaps = it.gap.split(' ').filter((g) => g !== 'normal').map(px);
    const badGap = gaps.filter((g) => !SPACE.has(Math.round(g)));
    if (badGap.length && /flex|grid/.test(it.disp)) { add(src, 'gap', where, badGap[0] + 'px', 'scale value', board); pb('spacing'); }
    // controls
    if (isControl(it) && it.h >= 20 && it.w >= 20) {
      const h = Math.round(it.h);
      if (!HEIGHTS.has(h) && !(it.tag === 'textarea') && h < 120) { add(src, 'control-height', where, h + 'px', h < 44 ? '>=44 (44/48/52/60/64)' : '44/48/52/60/64', board); pb(h < 44 ? 'target<44' : 'height'); }
    }
    // type
    if (it.own && it.text) {
      const fs = px(it.fs);
      if (!isDisplay(it) && !FS.has(Math.round(fs * 10) / 10)) { add(src, 'font-size', where, fs + 'px', 'type scale 12/13/14/15/16/18/20/24/28/34/48', board); pb(fs < 12 ? 'fs<12' : 'font-size'); }
      const fw = Number(it.fw);
      if (!isDisplay(it) && ![400, 500, 600].includes(fw)) { add(src, 'font-weight', where, String(fw), '400/500/600', board); pb('weight'); }
      if (isDisplay(it) && fw > 600) { add(src, 'font-weight', where, String(fw) + ' (display)', '200-600', board); pb('weight'); }
      if (/Mono/.test(it.ff) && !isDisplay(it) && !/^[\d:\s.,·APMamp–-]+$/.test(it.text) && !['code', 'kbd', 'pre', 'samp'].includes(it.tag)) { add(src, 'mono-for-text', where, it.ff + ' ' + fs + 'px', 'mono only for digits/code', board); pb('mono'); }
    }
    // colours
    for (const [prop, val] of [['color', it.color], ['background', it.bg], ['border-color', bw.some((b) => b > 0) ? it.bc : null]]) {
      const c = rgb(val);
      if (c && offTok(c)) { add(src, 'off-token-colour', where, prop + ' ' + hex(c) + (c.a < 1 ? ' @' + c.a : ''), 'a --at-* token (or its alpha)', board); pb('colour'); }
    }
  }
  // nested cards
  for (const outer of cards) for (const inner of cards) {
    if (inner === outer) continue;
    if (inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5 && (inner.w < outer.w - 4 || inner.h < outer.h - 4)) {
      const bgIn = rgb(inner.bg);
      if (bgIn && bgIn.a === 0 && inner.bc === outer.bc && px(inner.br) >= 999) continue;
      add(inner.src, 'nested-card', '<' + inner.tag + '> "' + inner.text.slice(0, 30) + '" inside "' + outer.text.slice(0, 24) + '"', 'card r' + px(inner.br) + ' in card r' + px(outer.br), 'no nested cards: dividers/spacing', board); pb('nested');
      break;
    }
  }
}
const OUTP = process.env.OUTP || A + '../';
writeFileSync(OUTP + 'violations.json', JSON.stringify(Object.fromEntries(Object.entries(V).map(([k, m]) => [k, [...m.values()].map((e) => ({ ...e, boards: [...e.boards] }))])), null, 1));
writeFileSync(OUTP + 'perboard.json', JSON.stringify(perBoard, null, 1));
console.log('== counts by source file');
for (const [k, c] of Object.entries(counts).sort()) console.log(k.padEnd(20), JSON.stringify(c));
