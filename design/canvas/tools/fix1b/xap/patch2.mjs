// Follow-up: owner-delegated decisions (O-02, O-09/O-82, O-12, O-56, O-57, O-81, O-83) + PRIMITIVES v1 update.
import { readFileSync, writeFileSync } from 'node:fs';
const D = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/';
const OLD = JSON.parse(readFileSync(new URL('./snips.old.json', import.meta.url), 'utf8'));
const NEW = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'));
let s;
const rep = (a, b, n = 1) => {
  const c = s.split(a).length - 1;
  if (c !== n) throw new Error('count ' + c + ' (want ' + n + ') for: ' + a.slice(0, 100));
  s = s.split(a).join(b);
};
const open = (k, x) => x[k].slice(0, x[k].indexOf('">') + 2);

// ---------------- Extras ----------------
s = readFileSync(D + 'Extras.dc.html', 'utf8');
rep(OLD['JS constants'], NEW['JS constants']);
{ const m = s.match(/<kbd style="[^"]*">/g); if (!m || m.length !== 2) throw new Error('kbd'); for (const x of new Set(m)) s = s.split(x).join(open('P-KBD', NEW)); }
// O-57 light ground end stop.
rep(`#F2F6FA 60%, #E7EEF6 100%)'`, `#F2F6FA 60%, #EEF3F8 100%)'`);
// O-56 input borders on --at-input-border.
rep(`border: 1px solid {{t.fieldLine}};`, `border: 1px solid {{t.inputBorder}};`, 3);
rep(`// Extras only: input borders stay on muted (3:1+ non-text contrast); wells use --at-sunken.
const XDARK = { fieldLine: '#8E9AAE' };
const XLIGHT = { fieldLine: '#5B6779' };
`, ``);
rep(`const t = Object.assign({}, dark ? DARK : LIGHT, dark ? XDARK : XLIGHT, dark ? AT_TOK.dark : AT_TOK.light);`,
  `const t = Object.assign({}, dark ? DARK : LIGHT, dark ? AT_TOK.dark : AT_TOK.light);`);
// O-12 rating stars: radio group with roving tabindex.
rep(`<div role="group" aria-label="Your rating" style="display: flex; gap: 4px; margin-inline-start: -8px">`,
  `<div role="radiogroup" aria-label="Your rating" style="display: flex; gap: 4px; margin-inline-start: -8px">`, 2);
rep(`<button aria-pressed="{{st.on}}" aria-label="{{st.label}}" onClick="{{st.pick}}" style="`,
  `<button role="radio" aria-checked="{{st.on}}" aria-label="{{st.label}}" tabindex="{{st.tab}}" onClick="{{st.pick}}" onKeyDown="{{st.key}}" style="`, 2);
rep(`        on: n === s.stars ? 'true' : 'false', label: starWords[n],`,
  `        // Radio group (docs/05 §3.22): one tab stop (the checked star, else the first); arrows move and select.
        on: n === s.stars ? 'true' : 'false', label: starWords[n], tab: (s.stars ? n === s.stars : n === 1) ? '0' : '-1',
        key: (e) => {
          const k = e && e.key;
          const to = { ArrowRight: n + 1, ArrowUp: n + 1, ArrowLeft: n - 1, ArrowDown: n - 1, Home: 1, End: 5 }[k];
          if (!to) return;
          if (e.preventDefault) e.preventDefault();
          const next = Math.max(1, Math.min(5, to));
          this.setState({ stars: next, ratingErr: false });
          try { e.currentTarget.parentNode.querySelectorAll('[role=radio]')[next - 1].focus(); } catch (err) {}
        },`);
// O-81 share: phone keeps the bottom sheet; tablet/desktop get an inline panel in the dock column (above the actions),
// so it never covers the pill or the primary action.
const a = s.indexOf(`  <sc-if value="{{shareOpen}}" hint-placeholder-val="{{false}}">\n    <div role="dialog" aria-modal="{{shareModal}}"`);
const endMark = `    </div>\n  </sc-if>\n\n  <sc-if value="{{keysOpen}}"`;
const b = s.indexOf(endMark, a);
if (a < 0 || b < 0) throw new Error('share block');
const block = s.slice(a, b + `    </div>\n  </sc-if>\n`.length);
const innerStart = block.indexOf('\n', block.indexOf('<div role="dialog"')) + 1;
const inner = block.slice(innerStart, block.lastIndexOf('    </div>\n  </sc-if>'));
const sheet = `  <sc-if value="{{shareSheet}}" hint-placeholder-val="{{false}}">
    <div role="dialog" aria-modal="true" aria-labelledby="x-share-title" class="at-sheet-up" style="{{sheetStyle}}">
${inner}    </div>
  </sc-if>
`;
s = s.slice(0, a) + sheet + s.slice(a + block.length);
const innerInline = inner.split('\n').map((l) => (l ? '    ' + l : l)).join('\n');
rep(`    <div style="grid-area: dock; display: flex; flex-direction: column; gap: 20px">
`, `    <div style="grid-area: dock; display: flex; flex-direction: column; gap: 20px">

      <sc-if value="{{shareInline}}" hint-placeholder-val="{{false}}">
        <section aria-labelledby="x-share-title" class="at-rise" style="display: flex; flex-direction: column; gap: 16px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; box-shadow: {{cardShadow}}; text-align: start">
${innerInline}        </section>
      </sc-if>
`);
rep(`aria-label="Share" title="Share" aria-haspopup="dialog" aria-expanded="{{shareOpen}}"`, `aria-label="Share" title="Share" aria-haspopup="{{sharePopup}}" aria-expanded="{{shareOpen}}"`);
rep(`      shareOpen, shareModal: phone ? 'true' : 'false',
      shareClass: phone ? 'at-sheet-up' : 'at-in',
      shareStyle: phone ? phoneSheet : panel + '; position: absolute; top: 64px; inset-inline-end: ' + (tab ? '32px' : '80px') + '; width: 400px; padding: 24px',`,
  `      shareOpen, shareSheet: phone && shareOpen, shareInline: !phone && shareOpen, sharePopup: phone ? 'dialog' : 'false',`);
writeFileSync(D + 'Extras.dc.html', s);

// ---------------- Ambient ----------------
s = readFileSync(D + 'Ambient.dc.html', 'utf8');
rep(OLD['JS constants'], NEW['JS constants']);
rep(`#F2F6FA 60%, #E7EEF6 100%)'`, `#F2F6FA 60%, #EEF3F8 100%)'`);
// O-09/O-82: the ambient pill is P-PILL-M with one hole swapped (pillInk): Night and Minimal use muted text.
const pillAmb = NEW['P-PILL-M'].replace('color: {{t.ink}}; white-space: nowrap">', 'color: {{pillInk}}; white-space: nowrap">');
rep(NEW['P-PILL-M'], pillAmb, 2);
rep(`pillInk: quiet || hidden ? t.muted : t.ink,`, `pillInk: quiet ? t.muted : t.ink,`);
// O-56 inputs.
rep(`border-radius: 8px; border: 1px solid {{lamp}}; background: {{t.sunken}};`, `border-radius: 8px; border: 1px solid {{t.inputBorder}}; background: {{t.sunken}};`);
rep(`border-radius: 8px; border: 1px solid {{t.muted}}; background: {{t.sunken}};`, `border-radius: 8px; border: 1px solid {{t.inputBorder}}; background: {{t.sunken}};`, 2);
rep(`raised: AT_NIGHT.line, sunken: AT_NIGHT.ground,`, `raised: AT_NIGHT.line, sunken: AT_NIGHT.ground, inputBorder: AT_NIGHT.muted,`);
writeFileSync(D + 'Ambient.dc.html', s);

// ---------------- PipWindow ----------------
s = readFileSync(D + 'PipWindow.dc.html', 'utf8');
rep(OLD['JS constants'], NEW['JS constants']);
// O-83: PiP display-s may reach 40 px; H:MM:SS drops to 28 so 12:59:59 never pushes the buttons.
rep(`digitSize: (bigA + bigB).length > 5 ? '24px' : '28px',`,
  `// display-s in PiP (O-83): up to 40 px, Geist 300 tabular.
      digitSize: (bigA + bigB).length > 5 ? '28px' : '40px',`);
writeFileSync(D + 'PipWindow.dc.html', s);
console.log('patch2 ok');
