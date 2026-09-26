// Summarise audit results: per-run counts and detail listing.
import { readFileSync } from 'node:fs';
const res = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const detail = process.argv[3] === 'detail';
const PILLS = ['Ready', 'Starting…', 'Screen awake', 'Paused — tab hidden', "Blocked — here's the fix", 'Tap to use the fallback', 'Awake via video fallback', 'Starts when you open this tab', 'System awake'];
const tot = {};
for (const r of res) {
  if (r.failed) { console.log((r.id || r.file) + " FAILED " + r.failed); continue; }
  const a = r.audit;
  const fails = (x) => !x.pixel || x.pixel.p10 < x.need;
  const allC = [...a.contrast, ...(a.transient || [])];
  a.contrast = allC.filter((x) => fails(x) && (a.contrast.includes(x) || (x.pixel && x.pixel.p10 < x.need)));
  a.transient = allC.filter((x) => !a.contrast.includes(x) && (a.transient || []).includes(x));
  const texts = a.texts.map((t) => t.text);
  const pillBad = [];
  for (const o of a.outputs) { const t = o.text; if (!PILLS.includes(t) && /^(Ready|Starting|Screen awake|Paused|Blocked|Tap to|Awake via|Starts when|System awake)/.test(t)) pillBad.push(t); }
  for (const t of texts) if (/^(Paused|Blocked|Starting|Awake via|Tap to use|Starts when)/.test(t) && t.length < 40 && !PILLS.includes(t) && /—|-|:/.test(t)) pillBad.push('text: ' + t);
  const times = texts.filter((t) => /\b([01]?\d|2[0-3]):[0-5]\d\b(?!\s?(AM|PM|am|pm|:))/.test(t) && (/\b(1[3-9]|2[0-3]|0\d):[0-5]\d\b/.test(t) || /(at|until|since|by|from|Started|ends|Ends|Until|Since|to)\s+\d{1,2}:\d{2}\b(?!\s?(AM|PM))/.test(t)));
  const em = [...new Set(texts.filter((t) => t.includes('—') && !PILLS.includes(t)))];
  const c = { overflow: a.overflow.length, targets: a.targets.length, contrast: a.contrast.length, transient: (a.transient || []).length, invisible: a.invisible.length, ui: a.ui.length, overlap: a.overlap.length, covered: a.covered.length, pill: pillBad.length, time24: times.length, emdash: em.length, missing: r.dc.missing.length, errors: r.dc.errors.length + r.errs.length };
  for (const [k, v] of Object.entries(c)) tot[k] = (tot[k] || 0) + v;
  const nz = Object.entries(c).filter(([, v]) => v).map(([k, v]) => k + '=' + v).join(' ');
  console.log(r.id.padEnd(46), (r.size.w + 'x' + r.size.h).padEnd(10), nz || 'clean');
  if (detail && nz) {
    const show = (k, arr) => arr.length && console.log('   ' + k + ':', JSON.stringify(arr.slice(0, 12)));
    show('overflow', a.overflow); show('targets', a.targets); show('contrast', a.contrast.map((x) => `${x.text} ${x.fg}/${x.bg} ${x.ratio}<${x.need} px:${x.pixel ? x.pixel.p10 + '/' + x.pixel.median : '-'}${x.hidden ? ' (aria-hidden)' : ''}`)); show('transient', (a.transient || []).map((x) => `${x.text} ${x.fg}/${x.bg} worst ${x.worst} px:${x.pixel ? x.pixel.p10 + '/' + x.pixel.median : '-'}`)); show('invisible', a.invisible.map((x) => x.text)); show('ui', a.ui); show('overlap', a.overlap); show('covered', a.covered); show('pill', pillBad); show('time24', times); show('emdash', em); show('missing', r.dc.missing); show('errors', [...r.dc.errors, ...r.errs]);
  }
}
console.log('TOTAL', JSON.stringify(tot));
