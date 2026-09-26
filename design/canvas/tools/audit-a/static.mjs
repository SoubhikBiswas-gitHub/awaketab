// Static source checks: colour tokens, motion rules, copy (em dashes / 24h) in source strings.
// node static.mjs File1.dc.html File2.dc.html ...
import { readFileSync } from 'node:fs';
const DIR = process.env.DCDIR || '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const hex6 = (h) => { h = h.replace('#', '').toUpperCase(); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return '#' + h.slice(0, 6); };
const DESIGN = ['0A0E16', '13203A', '111826', '1F2940', '33405C', 'EAF0F7', 'B7C1D1', '8E9AAE', '1A2336', '2A3752', 'F2B34C', 'FF7A7A', '04232A',
  'F2F6FA', 'FFFFFF', 'DCE3EC', 'C3CDDA', '0E1726', '3A4659', '5B6779', 'E3E9F1', 'CCD5E1', 'B7791F', 'D14343', '000000', '0A0A0A',
  '5BE0E8', 'A594FF', '7EF0B8', '7CB8FF', '087B87', '5A47CF', '167A50', '255FBD'].map((x) => '#' + x);
const OLD = ['#0A8F9B', '#6B58E0', '#1B8F5E', '#2F6FD6'];
// Horizon sky palettes (Main SKIES) are allowed.
const mainSrc = readFileSync(DIR + 'Main.dc.html', 'utf8');
const skies = mainSrc.split('const SKIES')[1].split('};')[0];
const SKY = new Set([...skies.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => hex6(m[0])));
for (const m of skies.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)) SKY.add('#' + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, '0')).join('').toUpperCase());
const mainTok = mainSrc.split('const DARK')[1].split('const SKIES')[0];
const MAINREF = new Set([...mainTok.matchAll(/#[0-9A-Fa-f]{3,6}\b/g)].map((m) => hex6(m[0])));
const allowed = new Set([...DESIGN, ...SKY]);
const out = {};
for (const f of process.argv.slice(2)) {
  const src = readFileSync(DIR + f, 'utf8');
  const r = { offPalette: {}, mainRefOnly: {}, old: [], motion: [], emdash: [], h24: [] };
  const lines = src.split('\n');
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])/g)) {
      if (/href="#|url\(#|aria-|id="/.test(ln.slice(Math.max(0, m.index - 6), m.index + 1))) continue;
      const h = hex6(m[0]);
      if (OLD.includes(h)) r.old.push(i + 1 + ': ' + h);
      if (allowed.has(h)) continue;
      const bucket = MAINREF.has(h) ? r.mainRefOnly : r.offPalette;
      (bucket[h] ||= []).push(i + 1);
    }
    for (const m of ln.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)) {
      const h = '#' + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, '0')).join('').toUpperCase();
      if (h === '#000000' || h === '#FFFFFF' || allowed.has(h)) continue;
      const bucket = MAINREF.has(h) ? r.mainRefOnly : r.offPalette;
      (bucket[h + ' (rgba)'] ||= []).push(i + 1);
    }
    if (ln.includes('—')) r.emdash.push(i + 1 + ': ' + ln.trim().slice(0, 160));
    for (const m of ln.matchAll(/\b([01]?\d|2[0-3]):[0-5]\d\b(?!\s*[AP]M)/g)) if (!/viewBox|stroke|path|d="/.test(ln)) r.h24.push(i + 1 + ': ' + ln.trim().slice(Math.max(0, m.index - 40), m.index + 40));
  });
  // motion
  const css = (src.split('<helmet>')[1] || '').split('</helmet>')[0];
  const rm = /prefers-reduced-motion:\s*reduce\)\s*\{\s*\*\s*,\s*\*::before\s*,\s*\*::after\s*\{\s*animation:\s*none\s*!important;\s*transition:\s*none\s*!important/.test(css);
  if (!rm) r.motion.push('no universal reduced-motion block');
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    if (/(^|[;{\s])(width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|inset[\w-]*)\s*:/.test(m[2])) r.motion.push('keyframes ' + m[1] + ' animates layout: ' + m[2].slice(0, 120));
  }
  const trans = [...src.matchAll(/transition:\s*([^;"}]+)/g)].map((m) => m[1]);
  for (const t of trans) if (/(^|,\s*)(all|width|height|top|left|right|bottom|margin[\w-]*|padding[\w-]*|inset[\w-]*|max-height|max-width|flex[\w-]*|grid[\w-]*)\b/.test(t)) r.motion.push('transition on layout property: ' + t.slice(0, 100));
  out[f] = r;
}
console.log(JSON.stringify(out, null, 1));
