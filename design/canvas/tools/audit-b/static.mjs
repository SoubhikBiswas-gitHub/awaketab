// Source-level checks: tokens (colour literals vs palette), motion (reduced-motion coverage, layout animation), nesting balance.
// usage: node static.mjs File1.dc.html File2.dc.html ...  -> JSON on stdout
import { readFileSync } from 'node:fs';
const DIR = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const norm = (h) => { h = h.toUpperCase(); if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return h.slice(0, 7); };
const main = readFileSync(DIR + 'Main.dc.html', 'utf8');
const PALETTE = new Set((main.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g) || []).map(norm));
// DESIGN.md tokens (explicit)
'#0A0E16 #13203A #111826 #1F2940 #33405C #EAF0F7 #B7C1D1 #8E9AAE #1A2336 #2A3752 #F2B34C #FF7A7A #04232A #F2F6FA #FFFFFF #DCE3EC #C3CDDA #0E1726 #3A4659 #5B6779 #E3E9F1 #CCD5E1 #B7791F #D14343 #5BE0E8 #A594FF #7EF0B8 #7CB8FF #087B87 #5A47CF #167A50 #255FBD #000000 #0A0A0A'.split(' ').forEach((h) => PALETTE.add(h));
const OLD = new Set(['#0A8F9B', '#6B58E0', '#1B8F5E', '#2F6FD6']);
const rgbHex = (r, g, b) => '#' + [r, g, b].map((v) => (+v).toString(16).padStart(2, '0')).join('').toUpperCase();
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const nearest = (h) => { const c = toRgb(h); let best = null, bd = 1e9; for (const p of PALETTE) { const q = toRgb(p); const d = Math.hypot(c[0] - q[0], c[1] - q[1], c[2] - q[2]); if (d < bd) { bd = d; best = p; } } return best + ' (d=' + Math.round(bd) + ')'; };
const out = {};
for (const f of process.argv.slice(2)) {
  const src = readFileSync(DIR + f, 'utf8');
  const r = { offPalette: {}, oldLamps: [], motion: [], balance: [] };
  const lits = [];
  for (const m of src.matchAll(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])/g)) {
    const before = src.slice(Math.max(0, m.index - 12), m.index);
    if (/url\($|href="$|id="$|&$/.test(before)) continue;
    lits.push(norm(m[0]));
  }
  for (const m of src.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) lits.push(rgbHex(m[1], m[2], m[3]));
  for (const h of lits) {
    if (OLD.has(h)) r.oldLamps.push(h);
    else if (!PALETTE.has(h) && h !== '#000000' && h !== '#FFFFFF') r.offPalette[h] = (r.offPalette[h] || 0) + 1;
  }
  r.offPaletteNearest = Object.fromEntries(Object.keys(r.offPalette).map((h) => [h, nearest(h)]));
  // motion
  const helmet = (src.split('<helmet>')[1] || '').split('</helmet>')[0];
  const rmM = /prefers-reduced-motion:\s*reduce\)\s*\{([^{]*)\{([^}]*)\}/.exec(helmet);
  const sel = rmM ? rmM[1].trim() : '';
  const hasRM = !!rmM && /animation:\s*none\s*!important/.test(rmM[2]) && /transition:\s*none\s*!important/.test(rmM[2]) && sel.includes('*');
  if (hasRM && !/^\*/.test(sel) && !sel.split(',').some((x) => /^\.[\w-]+$/.test(x.trim()))) r.motion.push('reduced-motion block is scoped (' + sel.slice(0, 40) + ') and does not cover the root element');
  const animUsed = /animation\s*:|transition\s*:|class="[^"]*at-/.test(src.split('</helmet>')[1] || '') || /animation|transition/.test(helmet);
  if (animUsed && !hasRM) r.motion.push('no universal prefers-reduced-motion block (animation:none + transition:none on *)');
  for (const m of helmet.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)) if (/(^|[;{\s])(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|inset)\s*:/.test(m[2])) r.motion.push('keyframes ' + m[1] + ' animates layout');
  for (const m of src.matchAll(/transition(?:-property)?\s*:\s*([^;"'}]+)/g)) {
    const v = m[1];
    if (/\b(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|max-height|inset|grid-template[\w-]*)\b/.test(v)) r.motion.push('transition on layout: ' + v.trim().slice(0, 80));
    if (/(^|,)\s*all\b/.test(v)) r.motion.push('transition: all (may animate layout): ' + v.trim().slice(0, 60));
  }
  // balance
  const markup = (src.split('</helmet>')[1] || '').split('</x-dc>')[0];
  for (const t of ['sc-if', 'sc-for', 'div', 'span', 'button', 'a', 'section', 'svg', 'dc-import', 'p', 'ul', 'li', 'label', 'nav', 'header', 'footer', 'main', 'output']) {
    const o = (markup.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length, c = (markup.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) r.balance.push(t + ' ' + o + '/' + c);
  }
  out[f] = r;
}
console.log(JSON.stringify(out, null, 1));
