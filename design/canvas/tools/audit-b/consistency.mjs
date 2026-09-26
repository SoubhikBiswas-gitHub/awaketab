// Cross-board consistency matrix vs Main + DESIGN.md §11. usage: node consistency.mjs all.json static-all.json [filterRegex]
import { readFileSync } from 'node:fs';
const DIR = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const res = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const stat = JSON.parse(readFileSync(process.argv[3], 'utf8'));
const filt = process.argv[4] ? new RegExp(process.argv[4]) : null;
const base = (f) => { const s = readFileSync(DIR + f, 'utf8'); const m = s.split('</helmet>')[1]?.match(/<dc-import name="(\w+)"/); const root = s.split('</helmet>')[1] || ''; const onlyImport = m && (root.match(/<dc-import/g) || []).length === 1 && root.replace(/<dc-import[\s\S]*?<\/dc-import>/, '').replace(/<[^>]+>/g, '').trim() === ''; return onlyImport ? m[1] + '.dc.html' : f; };
const SIZES = new Set([12, 13, 14, 15, 16, 17, 18, 20, 24, 28, 34, 48]);
const isDisplay = (t) => /^[\s\d:.,$∞·%+−-]*(AM|PM)?[\s\d:.,$∞·%+−-]*$/.test(t.text) || (/Mono|Grotesk/.test(t.font) && t.fs >= 20);
const RADII = new Set(['8px', '12px', '16px', '20px', '28px', '999px', 'full']);
const HEIGHTS = new Set([44, 48, 52, 60, 64]);
const rows = [];
const seenBase = new Set();
for (const r of res) {
  if (r.failed) { console.log((r.id || r.file) + " FAILED " + r.failed); continue; }
  const b = base(r.file);
  const key = b + JSON.stringify(r.props);
  const m = r.audit.metrics;
  const devs = [];
  const h = m.header;
  if (h) {
    if (h.h !== 60 && h.h !== 68) devs.push(`header h ${h.h} (spec 60 phone / 68 ≥tablet; Main 60)`);
    if (h.logoSvg && h.logoSvg !== 26) devs.push(`logo svg ${h.logoSvg} (Main 26)`);
    if (h.logoFs && h.logoFs !== '17px') devs.push(`logo text ${h.logoFs} (Main 17px)`);
    if (h.logoGap && h.logoGap !== '10px' && h.logoGap !== 'normal') devs.push(`logo gap ${h.logoGap} (Main 10px)`);
  }
  const ts = m.themeSwitch;
  if (ts) { if (ts.segW !== 44 || ts.segH !== 44) devs.push(`theme seg ${ts.segW}x${ts.segH} (44x44)`); if (ts.n !== 3) devs.push(`theme segs ${ts.n}`); if (ts.pad !== '3px') devs.push(`theme pad ${ts.pad} (Main 3px; §11.4 says 4px)`); }
  for (const o of r.audit.outputs) { if (o.h !== 38 || o.fs !== '15px' || o.fw !== '600' || o.radius !== '999px' || o.glyph !== 12) devs.push(`pill "${o.text.slice(0, 18)}" ${o.h}h ${o.fs}/${o.fw} r${o.radius} glyph${o.glyph} (Main 38h 15px/600 r999 glyph12)`); }
  const fsz = {};
  for (const t of r.audit.texts) { if (t.hidden) continue; if (t.fs >= 12 && (SIZES.has(t.fs) || isDisplay(t))) continue; const k = t.fs + (t.fs > 48 ? '(non-digit display)' : ''); fsz[k] = (fsz[k] || 0) + 1; }
  const offSize = Object.entries(fsz);
  if (offSize.length) devs.push('font sizes off §11.5 scale: ' + offSize.map(([s, c]) => s + 'px×' + c).join(', '));
  const heavy = Object.entries(m.weights || {}).filter(([w]) => +w > 600);
  if (heavy.length) devs.push('weights >600: ' + heavy.map(([w, c]) => w + '×' + c).join(', '));
  const offR = Object.entries(m.radii || {}).filter(([k]) => !RADII.has(k));
  if (offR.length) devs.push('radii off §11.3: ' + offR.map(([k, c]) => k + '×' + c).join(', '));
  const offB = Object.entries(m.borderW || {}).filter(([k]) => +k !== 1);
  if (offB.length) devs.push('border widths ≠1: ' + offB.map(([k, c]) => k + 'px×' + c).join(', '));
  const offH = Object.entries(m.ctrlH || {}).filter(([k]) => { const hh = +k.split(':')[1]; return !HEIGHTS.has(hh) && !/^(a|input|select|textarea)$/.test(k.split(':')[0]) ? true : (/^(input|select)$/.test(k.split(':')[0]) && hh !== 48) || (k.startsWith('a:') && hh < 44); });
  if (offH.length) devs.push('control heights off §11.4: ' + offH.map(([k, c]) => k + '×' + c).join(', '));
  const st = stat[b] || stat[r.file];
  if (st) { if (st.oldLamps.length) devs.push('OLD light lamps: ' + st.oldLamps.join(' ')); const off = Object.keys(st.offPalette); if (off.length) devs.push('off-palette colours: ' + off.map((x) => x + '→' + st.offPaletteNearest[x].split(' ')[0]).join(', ')); if (st.motion.length) devs.push('motion: ' + st.motion.join('; ')); }
  const fonts = Object.keys(m.fonts || {}).filter((f) => !/^(Geist|Geist Mono|Space Grotesk)$/.test(f));
  if (fonts.length) devs.push('fonts: ' + fonts.join(', '));
  rows.push({ board: r.file, base: b, header: h ? `${h.h}/${h.logoSvg}/${h.logoFs}/${h.logoFw}` : '-', theme: ts ? `${ts.n}×${ts.segW}x${ts.segH} p${ts.pad}` : '-', pill: r.audit.outputs.length ? [...new Set(r.audit.outputs.map((o) => `${o.h}h ${o.fs}/${o.fw} g${o.glyph}`))].join(' ; ') : '-', btn: Object.entries(m.buttons).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, c]) => k + '×' + c).join(' '), devs, dup: seenBase.has(key) });
  seenBase.add(key);
}
for (const r of rows) {
  if (filt && !filt.test(r.board) && !filt.test(r.base)) continue;
  console.log(`${r.board}${r.base !== r.board ? ' (→' + r.base + ')' : ''} | hdr ${r.header} | theme ${r.theme} | pill ${r.pill} | btn ${r.btn}`);
  if (!r.dup) for (const d of r.devs) console.log('    - ' + d); else if (r.devs.length) console.log('    (same base as above: ' + r.devs.length + ' deviations)');
}
