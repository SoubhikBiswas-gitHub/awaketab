// Generate render jobs for Audit B's assigned boards (base files at each layout x theme, plus wrappers at canvas size).
import { writeFileSync, readFileSync } from 'node:fs';
const DIR = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const canvas = JSON.parse(readFileSync(DIR + 'canvas.json', 'utf8')).boards;
const W = { phone: 390, tablet: 820, desktop: 1280 };
const jobs = [];
const add = (id, file, props, w, extra = {}) => jobs.push(Object.assign({ id, file, props, w, scheme: props.theme === 'light' ? 'light' : 'dark' }, extra));
const themes = ['dark', 'light'];
for (const l of ['phone', 'tablet', 'desktop']) for (const t of themes) {
  add(`Pro-${l}-${t}`, 'Pro.dc.html', { layout: l, theme: t }, W[l]);
  add(`ProManage-${l}-${t}`, 'ProManage.dc.html', { layout: l, theme: t }, W[l]);
  for (const s of ['idle', 'success', 'error']) add(`ProActivate-${s}-${l}-${t}`, 'ProActivate.dc.html', { layout: l, theme: t, state: s }, W[l]);
}
add('ProActivate-checking-phone-dark', 'ProActivate.dc.html', { layout: 'phone', theme: 'dark', state: 'checking' }, 390);
add('ProActivate-ext-phone-light', 'ProActivate.dc.html', { layout: 'phone', theme: 'light', state: 'success', ext: true }, 390);
for (const e of ['activation_limit', 'revoked', 'polar_unavailable', 'offline', 'bad_token']) add(`ProActivate-err-${e}-phone-dark`, 'ProActivate.dc.html', { layout: 'phone', theme: 'dark', state: 'error', error: e }, 390, { shot: false });
add('ProManage-empty-phone-dark', 'ProManage.dc.html', { layout: 'phone', theme: 'dark', empty: true }, 390);
for (const st of ['ready', 'awake', 'system', 'dim', 'ended']) for (const t of themes) add(`ExtPopup-${st}-${t}`, 'ExtPopup.dc.html', { status: st, theme: t, layout: 'desktop' }, 360);
for (const t of themes) for (const pro of [true, false]) add(`ExtOptions-${t}-${pro ? 'pro' : 'free'}`, 'ExtOptions.dc.html', { theme: t, pro, layout: 'desktop' }, 1280);
for (const t of themes) add(`ExtBadges-${t}`, 'ExtBadges.dc.html', { theme: t, layout: 'desktop' }, 1280);
for (const t of themes) add(`EmbedShowcase-${t}`, 'EmbedShowcase.dc.html', { theme: t, layout: 'desktop' }, 1280);
for (const size of ['compact', 'full']) for (const mode of ['cook', 'standard', 'clock', 'minimal']) for (const t of ['dark', 'light', 'oled']) for (const running of [true, false]) {
  const w = size === 'compact' ? 320 : 720;
  add(`EmbedWidget-${size}-${mode}-${t}-${running ? 'run' : 'idle'}`, 'EmbedWidget.dc.html', { size, mode, theme: t, running, width: w, layout: 'desktop' }, w, { shot: running || mode === 'cook' });
}
add('EmbedWidget-full-cook-dark-320', 'EmbedWidget.dc.html', { size: 'full', mode: 'cook', theme: 'dark', running: true, width: 320 }, 320);
add('EmbedWidget-full-standard-light-1200', 'EmbedWidget.dc.html', { size: 'full', mode: 'standard', theme: 'light', running: true, width: 1200 }, 1200);
add('Brand', 'Brand.dc.html', {}, 1280);
// wrappers at canvas size
const mine = /^(Pro|ExtPopup|ExtOptions|ExtBadges|EmbedWidget|EmbedShowcase|EmbedCompactLight|EmbedFullDark|Brand)/;
for (const [f, b] of Object.entries(canvas)) if (mine.test(f) && !['Pro.dc.html', 'ProActivate.dc.html', 'ProManage.dc.html', 'ExtPopup.dc.html', 'ExtOptions.dc.html', 'ExtBadges.dc.html', 'EmbedWidget.dc.html', 'EmbedShowcase.dc.html', 'Brand.dc.html'].includes(f) && !/^Pro(?!Activate|Manage|Phone|Desk|Tablet)/.test(f)) add('W-' + f.replace('.dc.html', ''), f, {}, b.w, { scheme: /Light/.test(f) ? 'light' : 'dark', canvasH: b.h });
// base boards at canvas default
for (const f of ['Pro.dc.html', 'ProActivate.dc.html', 'ProManage.dc.html', 'ExtPopup.dc.html', 'ExtOptions.dc.html', 'EmbedWidget.dc.html', 'EmbedShowcase.dc.html']) add('C-' + f.replace('.dc.html', ''), f, {}, canvas[f].w, { canvasH: canvas[f].h });
writeFileSync(process.argv[2] || 'jobs-b.json', JSON.stringify(jobs, null, 1));
console.log(jobs.length, 'jobs');
