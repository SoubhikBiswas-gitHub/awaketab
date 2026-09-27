import { readFileSync, writeFileSync } from 'node:fs';
const D = '/home/user/awaketab/design/canvas/project/';
const SN = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'));
let s;
const rep = (a, b, n = 1) => {
  const c = s.split(a).length - 1;
  if (c !== n) throw new Error('count ' + c + ' (want ' + n + ') for: ' + a.slice(0, 90));
  s = s.split(a).join(b);
};

// ---------- PipWindow ----------
s = readFileSync(D + 'PipWindow.dc.html', 'utf8');
// P-PILL-S = P-PILL-M with the S geometry (DESIGN.md §11.4: 32, 14/600, padding 0 12 0 8, gap 8).
const pillS = SN['P-PILL-M']
  .replace('gap: 8px; height: 38px; padding: 0 16px 0 12px;', 'gap: 8px; height: 32px; padding: 0 12px 0 8px;')
  .replace('font-size: 15px; line-height: 22px;', 'font-size: 14px; line-height: 20px;');
if (pillS === SN['P-PILL-M']) throw new Error('pill S substitution failed');
const a = s.indexOf('<output aria-live="polite"');
rep(s.slice(a, s.indexOf('</output>', a) + 9), pillS);
rep(`button:focus-visible,a:focus-visible{outline:2px solid #5BE0E8;outline-offset:2px}`, `button:focus-visible,a:focus-visible{outline:2px solid #5BE0E8;outline-offset:3px}`);
rep(`display: flex; flex-direction: column; gap: {{gap}}; padding: 12px 12px 12px 14px">`, `display: flex; flex-direction: column; gap: {{gap}}; padding: 12px">`);
rep(`<span style="font-size: 12px; color: {{t.muted}}; white-space: nowrap">{{untilText}}</span>`,
  `<span style="font-size: 12px; line-height: 16px; color: {{t.muted}}; font-variant-numeric: tabular-nums; white-space: nowrap">{{untilText}}</span>`);
rep(`<div style="position: relative; display: flex; align-items: center; gap: 8px; height: 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {{t.muted}}">
      <span aria-hidden="true" style="width: 7px; height: 7px;`,
  `<div style="position: relative; display: flex; align-items: center; gap: 8px; height: 16px; font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">
      <span aria-hidden="true" style="width: 8px; height: 8px;`);
rep(`<div role="timer" aria-label="{{timerAria}}" style="font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 300;`,
  `<div role="timer" aria-label="{{timerAria}}" style="font-family: Geist, system-ui, sans-serif; font-weight: 300;`);
rep(`<div style="display: flex; gap: 6px; flex-shrink: 0">`, `<div style="display: flex; gap: 8px; flex-shrink: 0">`);
rep(`style="width: 52px; height: 44px; border-radius: 14px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; font-weight: 600; color: {{t.ink}}">+15</button>`,
  `style="width: 52px; height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid {{t.line2}}; background: {{t.surface}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}">+15</button>`);
rep(`style="width: 60px; height: 44px; border-radius: 14px; border: 0; background: {{t.primaryBg}}; font-size: 15px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>`,
  `style="width: 60px; height: 44px; padding: 0 12px; border-radius: 12px; border: 0; background: {{t.primaryBg}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>`);
rep(`<p class="at-in" style="position: relative; flex-grow: 1; margin: 0; display: flex; align-items: center; font-size: 15px; color: {{t.ink2}}">`,
  `<p class="at-in" style="position: relative; flex-grow: 1; margin: 0; display: flex; align-items: center; font-size: 15px; line-height: 22px; color: {{t.ink2}}">`);
// JS
rep(`const DARK = {`, SN['JS constants'] + `\nconst DARK = {`);
rep(`const t = dark ? DARK : LIGHT;`, `const t = Object.assign({}, dark ? DARK : LIGHT, dark ? AT_TOK.dark : AT_TOK.light);`);
rep(`t, H: pro ? '160px' : '120px', gap: pro ? '10px' : '12px',`, `t, H: pro ? '160px' : '120px', gap: pro ? '8px' : '12px',`);
// display-s (DESIGN.md §11.5): 24-28, Geist 300 tabular.
rep(`digitSize: (bigA + bigB).length > 5 ? '32px' : '42px',`, `digitSize: (bigA + bigB).length > 5 ? '24px' : '28px',`);
writeFileSync(D + 'PipWindow.dc.html', s);

// ---------- PipOverDesk ----------
s = readFileSync(D + 'PipOverDesk.dc.html', 'utf8');
rep(`<div aria-label="Spreadsheet app, placeholder" role="img" style="position: absolute; left: 56px; top: 48px; width: 1040px; height: 660px; border-radius: 14px;`,
  `<div aria-hidden="true" data-placeholder="foreign app: spreadsheet (exempt from token rules, DESIGN.md §11.2)" style="position: absolute; left: 56px; top: 48px; width: 1040px; height: 660px; border-radius: 12px;`);
rep(`<span style="width: {{w.w}}; height: 22px; border-radius: 6px; background: #EDF0F4"></span>`, `<span style="width: {{w.w}}; height: 24px; border-radius: 4px; background: #EDF0F4"></span>`);
rep(`display: flex; align-items: center; gap: 10px; padding: 0 16px; border-bottom: 1px solid #E4E8EE">`, `display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid #E4E8EE">`);
rep(`justify-content: {{x.align}}; padding: 0 10px;`, `justify-content: {{x.align}}; padding: 0 8px;`);
rep(`<div style="height: 28px; display: flex; align-items: center; justify-content: space-between; padding: 0 6px 0 12px; background: {{frame}}; color: {{frameInk}}; font-size: 12px">
      <span>awaketab.com</span>`,
  `<div data-placeholder="browser chrome: floating window title bar" style="height: 28px; display: flex; align-items: center; justify-content: space-between; padding: 0 0 0 12px; background: {{frame}}; color: {{frameInk}}; font-size: 12px; line-height: 16px">
      <span style="font-family: 'Geist Mono', ui-monospace, monospace">awaketab.com</span>`);
// Title-bar colours on tokens (surface/track and ink2).
rep(`frame: dark ? '#1A2233' : '#E6EBF1',`, `frame: dark ? '#1A2336' : '#E3E9F1',`);
writeFileSync(D + 'PipOverDesk.dc.html', s);

// ---------- PipDark / PipLight wrappers ----------
for (const f of ['PipDark.dc.html', 'PipLight.dc.html']) {
  s = readFileSync(D + f, 'utf8');
  rep(`border-radius: 10px; overflow: hidden;`, `border-radius: 12px; overflow: hidden;`, 2);
  rep(`<span style="font-size: 13px; color:`, `<span style="font-size: 13px; line-height: 18px; font-variant-numeric: tabular-nums; color:`, 2);
  writeFileSync(D + f, s);
}
console.log('patched pip');
