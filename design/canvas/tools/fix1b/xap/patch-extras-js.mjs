import { readFileSync, writeFileSync } from 'node:fs';
const P = '/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions/project/Extras.dc.html';
const J = JSON.parse(readFileSync(new URL('./snips.json', import.meta.url), 'utf8'))['JS constants'];
let s = readFileSync(P, 'utf8');
const rep = (a, b) => {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error('count ' + n + ' for: ' + a.slice(0, 80));
  s = s.replace(a, () => b);
};

rep(`const XDARK = { field: '#0A0E16', fieldLine: '#8E9AAE', tile: '#0A0E16', kbd: '#0A0E16' };
const XLIGHT = { field: '#F2F6FA', fieldLine: '#5B6779', tile: '#F2F6FA', kbd: '#F2F6FA' };`,
`// Extras only: input borders stay on muted (3:1+ non-text contrast); wells use --at-sunken.
const XDARK = { fieldLine: '#8E9AAE' };
const XLIGHT = { fieldLine: '#5B6779' };`);

rep(`const CHECK_ICON = 'M5 12.5l4.5 4.5L19 7.5';
`, `const CHECK_ICON = 'M5 12.5l4.5 4.5L19 7.5';

${J}
`);

rep(`const t = Object.assign({}, dark ? DARK : LIGHT, dark ? XDARK : XLIGHT);`,
  `const t = Object.assign({}, dark ? DARK : LIGHT, dark ? XDARK : XLIGHT, dark ? AT_TOK.dark : AT_TOK.light);`);

rep(`    const shadowA = dark ? 0.6 : 0.2;
    const sheetBase = 'box-sizing: border-box; z-index: 21; display: flex; flex-direction: column; gap: 16px; background: ' + t.surface + '; color: ' + t.ink + '; ';
    const phoneSheet = sheetBase + 'position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 20px 28px; border-radius: 28px 28px 0 0; border-top: 1px solid ' + t.line2 + '; box-shadow: 0 -24px 60px -20px rgba(0,0,0,' + shadowA + ')';
    const panel = sheetBase + 'border-radius: 28px; border: 1px solid ' + t.line2 + '; box-shadow: 0 30px 80px -30px rgba(0,0,0,' + (dark ? 0.8 : 0.3) + ')';`,
`    // Sheets and floating panels: DESIGN.md §11.6 shadow + AT_SCRIM.
    const sheetBase = 'box-sizing: border-box; z-index: 21; display: flex; flex-direction: column; gap: 16px; background: ' + t.surface + '; color: ' + t.ink + '; ';
    const phoneSheet = sheetBase + 'position: absolute; left: 0; right: 0; bottom: 0; padding: 8px 20px 32px; border-radius: 28px 28px 0 0; border-top: 1px solid ' + t.line2 + '; box-shadow: 0 -24px 64px -24px rgba(0,0,0,.45)';
    const panel = sheetBase + 'border-radius: 28px; border: 1px solid ' + t.line2 + '; box-shadow: 0 24px 64px -24px rgba(0,0,0,.45)';`);

rep(`        k1, k2, label, range: !!k2, line: t.line, ink: hit ? t.ink : t.ink2,
        kbd: 'display: inline-grid; place-items: center; min-width: 34px; height: 34px; padding: 0 9px; box-sizing: border-box; border-radius: 9px; border: 1px solid ' + (hit ? lamp : t.line2) + '; border-bottom-width: 2px; background: ' + (hit ? this.rgba(lamp, 0.16) : t.kbd) + '; color: ' + t.ink + '; font-family: \\'Geist Mono\\', ui-monospace, monospace; font-size: 13px; font-weight: 500; transform: translateY(' + (hit ? '1px' : '0') + ')'`,
`        // Keys are P-KBD verbatim; a pressed key lights its whole row (lamp 14 %) instead of restyling the key.
        k1, k2, label, range: !!k2, line: t.line, ink: hit ? t.ink : t.ink2,
        bg: hit ? this.rgba(lamp, 0.14) : 'transparent'`);

rep(`      W: desk ? '1280px' : tab ? '820px' : '390px', H: desk ? '800px' : tab ? '1180px' : '844px',
      isDesk: desk, isPhone: phone,
      hdrPad: tab ? '0 20px 0 32px' : extraIcon ? '0 8px 0 16px' : '0 12px 0 20px', hdrGap: extraIcon ? '2px' : '6px',
      linePad: tab ? '0 32px' : '0 20px',`,
`      W: desk ? '1280px' : tab ? '820px' : '390px', H: desk ? '800px' : tab ? '1180px' : '844px',
      isDesk: desk, isPhone: phone,
      hdr: AT_HDR[layout], cardPad: AT_CARD_PAD[layout], hdrGap: extraIcon ? '0px' : '8px',
      linePad: AT_HDR[layout].pad,
      p: { lampFill: lamp, lampInk },
      cardShadow: dark ? 'none' : '0 1px 2px rgba(14,23,38,.06)',
      deniedPad: phone ? '20px 20px 8px' : '24px 24px 12px',`);

rep(`column-gap: 64px; row-gap: 20px; padding: 8px 96px 40px 72px'`, `column-gap: 64px; row-gap: 20px; padding: 8px 80px 40px 80px'`);
rep(`row-gap: 20px; padding: 28px 24px 48px'`, `row-gap: 20px; padding: 24px 32px 48px'`);
rep(`row-gap: 14px; padding: 14px 16px 20px'`, `row-gap: 12px; padding: 12px 16px 20px'`);

rep(`themeLightInk: s.theme === 'light' ? t.ink : t.muted, themeDarkInk: s.theme === 'dark' ? t.ink : t.muted, themeAutoInk: s.theme === 'auto' ? t.ink : t.muted,`,
  `themeLightInk: s.theme === 'light' ? t.ink : t.ink2, themeDarkInk: s.theme === 'dark' ? t.ink : t.ink2, themeAutoInk: s.theme === 'auto' ? t.ink : t.ink2,`);
rep(`shareBtnBg: shareOpen ? t.chip : 'transparent', keysBtnBg: keysOpen ? t.chip : 'transparent',`,
  `shareBtnBg: shareOpen ? t.raised : 'transparent', keysBtnBg: keysOpen ? t.raised : 'transparent',`);
rep(`scrim: dark ? 'rgba(3,5,10,0.62)' : 'rgba(14,23,38,0.28)',`, `scrim: AT_SCRIM,`);
rep(`shareStyle: phone ? phoneSheet : panel + '; position: absolute; top: 64px; inset-inline-end: 16px; width: 392px; padding: 20px 22px 22px',`,
  `shareStyle: phone ? phoneSheet : panel + '; position: absolute; top: 64px; inset-inline-end: ' + (tab ? '32px' : '80px') + '; width: 400px; padding: 24px',`);
rep(`swBg: s.autostart ? lamp : t.track, swLine: s.autostart ? lamp : t.line2, swKnob: s.autostart ? lampInk : t.muted, swX: s.autostart ? '20px' : '0px',`,
  `swBg: s.autostart ? lamp : t.track, swLine: s.autostart ? lamp : t.line2, swKnob: s.autostart ? lampInk : t.muted, swX: s.autostart ? '20px' : '0px',`);
rep(`rowH: phone ? '46px' : '52px',`, `rowH: phone ? '48px' : '56px',`);
rep(`: panel + '; width: 720px; padding: 26px 34px 28px') + '; pointer-events: auto',`, `: panel + '; width: 720px; padding: 32px') + '; pointer-events: auto',`);
rep(`      toastPos: phone ? 'left: 16px; right: 16px; bottom: ' + (shareOpen ? '356px' : '100px') : tab ? 'left: 0; right: 0; margin-inline: auto; bottom: 128px; width: 520px' : 'inset-inline-end: 24px; bottom: 24px; width: 400px',`,
`      // Toasts never cover the status pill or the primary action (DESIGN.md §11.7): phone and tablet stack
      // them just under the pill, over the face; desktop keeps them in the right column below the dock.
      toastPos: phone ? 'left: 16px; right: 16px; top: 144px' : tab ? 'left: 0; right: 0; margin-inline: auto; top: 164px; width: 520px' : 'inset-inline-end: 80px; bottom: 24px; width: 436px',`);

writeFileSync(P, s);
console.log('patched');
