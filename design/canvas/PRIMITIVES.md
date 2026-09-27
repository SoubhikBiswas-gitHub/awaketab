# AwakeTab shared primitives: the one set (O-77 merge, 27 September 2026)

This file replaces `tools/fix1b/PRIMITIVES.md` (batch 1b) and the batch 2a `prim.mjs` snippet. Three code shapes carry the **same numbers**; the build implements them once as Astro components:
- 1b boards (Main, Extras, Ambient, Pip, Content, HubFor, HomeBelow, Intl, A11y, Guide, Preset, Until): the markup below with holes `t.* tone toneSoft hdr.* foot.* cardPad`.
- 2a boards (Pro, Ext, Welcome, Store, Growth, Brand): `AT_DARK`/`AT_LIGHT`/`AT_OLED`/`AT_LAMPS` constants and `footPad`/`cardPad` holes.
- 2b boards (Page, Embed, Kiosk, Og, IconSet, Sys): `atHeader()`, `atFooter()`, `atPill()` helpers and `AT_PILL`.
`tools/final/primvariance.py` renders-and-compares the primitives across every board (header, theme bar, nav, pill, footer, kbd, logo); any second variant is a bug.


Source of numbers: /home/user/awaketab/DESIGN.md §2.1, §3, §11. Every file in batch 1b that shows one of
these primitives must contain exactly the markup below (whitespace inside the tag included). Where a primitive needs
data, the file's renderVals() must expose the hole names used here (add aliases if the file uses other names).
Indentation before the first `<` may differ; everything from the first `<` to the matching close must match.

Required holes (add to renderVals where missing):
- `t.ink t.ink2 t.muted t.surface t.line t.line2 t.raised t.sunken t.track` (t.line2 = line-strong)
- `tone toneSoft toneLine toneGlow glyph glyphFill statusLabel` (pill; glyph = SVG path for the current state)
- `hdr.h hdr.pad` (header), `foot.pad` (footer), `cardPad` (cards), `themeX themeLight themeDark themeAuto themeLightInk themeDarkInk themeAutoInk setLight setDark setAuto`
- `p.lampFill p.lampInk lampGlow` (primary CTA)

## JS constants (paste into the component script, above `class Component`)

```js
// AT-PRIMITIVES v1 (fix batch 1b): DESIGN.md §2.1 tokens and §11 geometry. Keep identical across files.
const AT_TOK = {
  dark: { raised: '#26324B', sunken: '#0D131F', horizonInk: '#F6F2EA', line2: '#33405C', inputBorder: '#5A6781', groundEnd: '#070A11' },
  light: { raised: '#E3E9F1', sunken: '#F6F9FC', horizonInk: '#F6F2EA', line2: '#C3CDDA', inputBorder: '#8C98AA', groundEnd: '#EEF3F8' }
};
const AT_NIGHT = { ground: '#000000', ink: '#FF5A3C', ink2: '#E8563C', muted: '#A89690', line: '#3A2E2A' };
const AT_SCRIM = 'rgba(4,7,12,.55)';
const AT_HDR = { phone: { h: '60px', pad: '0 16px' }, tablet: { h: '68px', pad: '0 32px' }, desktop: { h: '68px', pad: '0 80px' }, xl: { h: '68px', pad: '0 120px' } };
const AT_FOOT = { phone: '24px 16px 32px', tablet: '24px 32px', desktop: '24px 80px', xl: '24px 120px' };
const AT_CARD_PAD = { phone: '20px', tablet: '24px', desktop: '24px', xl: '24px' };
const AT_TYPE = {
  phone: { h1: '34px', h1lh: '42px', h2: '24px', h2lh: '32px', gutter: '16px', section: '48px' },
  tablet: { h1: '48px', h1lh: '56px', h2: '28px', h2lh: '36px', gutter: '32px', section: '64px' },
  desktop: { h1: '48px', h1lh: '56px', h2: '28px', h2lh: '36px', gutter: '80px', section: '96px' }
};
```

Follow-up (owner delegation): inputs/selects/textareas use `border: 1px solid` AT_TOK.*.inputBorder (O-56, ≥ 3:1); the light ground's last gradient stop is #EEF3F8 (O-57; was #E7EEF6), use AT_TOK.light.groundEnd.
Token rules: dark `chip`/indicator = `raised` (#26324B), light = #E3E9F1 (NOT #E3EAF2). Code blocks, timer wells, URL
outputs, input fills = `sunken`. Horizon digits = `horizonInk`. Night mode = AT_NIGHT. Scrim = AT_SCRIM.
Elevation: dark borders only; light cards may add `0 1px 2px rgba(14,23,38,.06)`.

## P-HEADER (60 phone / 68 tablet+; logo 26 / wordmark 17, gap 8; gutter = page gutter)

```html
<header style="position: relative; height: {{hdr.h}}; flex-shrink: 0; box-sizing: border-box; padding: {{hdr.pad}}; display: flex; align-items: center; justify-content: space-between; gap: 12px">
    <a href="#" aria-label="AwakeTab home" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: {{t.ink}}; font-weight: 600; font-size: 17px; line-height: 24px; letter-spacing: -0.01em; min-height: 44px">
      <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true" style="overflow: visible"><path d="M32.8 11.4A16 16 0 1 1 15.2 11.4" fill="none" stroke="{{t.ink}}" stroke-width="4.5" stroke-linecap="round"></path><circle cx="24" cy="9" r="7.5" fill="{{tone}}" opacity="0.28"></circle><circle cx="24" cy="9" r="4.2" fill="{{tone}}" style="transition: fill .6s"></circle></svg>
      AwakeTab
    </a>
```
(desktop nav, if the page has one, sits between the logo and the theme switch: `<nav aria-label="Main" style="display: flex; gap: 8px; font-size: 15px; line-height: 22px; font-weight: 500">`, items `padding: 0 12px; box-sizing: border-box; min-height: 44px; min-width: 44px` (so the visible rhythm between labels is 32 and even "Pro" is a 48 px target), current item = ink 600 + 6 px lamp dot, others ink2. No side stripes.)

## P-THEME (segmented bar: 1 px line + 4 px padding + 44 px items = 54 total; indicator inset 4, `raised`)

```html
<div role="radiogroup" aria-label="Theme" style="position: relative; display: grid; grid-template-columns: repeat(3, 44px); padding: 4px; border-radius: 999px; background: {{t.surface}}; border: 1px solid {{t.line}}">
      <div aria-hidden="true" class="at-slide" style="position: absolute; left: 4px; top: 4px; width: 44px; height: 44px; border-radius: 999px; background: {{t.raised}}; transform: translateX({{themeX}})"></div>
      <button role="radio" aria-checked="{{themeLight}}" aria-label="Light" title="Light" onClick="{{setLight}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; color: {{themeLightInk}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"></path></svg></button>
      <button role="radio" aria-checked="{{themeDark}}" aria-label="Dark" title="Dark" onClick="{{setDark}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; color: {{themeDarkInk}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg></button>
      <button role="radio" aria-checked="{{themeAuto}}" aria-label="Auto, follows your system" title="Auto: follows your system" onClick="{{setAuto}}" style="position: relative; height: 44px; padding: 0; border: 0; background: transparent; border-radius: 999px; color: {{themeAutoInk}}; display: grid; place-items: center"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"></path></svg></button>
    </div>
```
themeX = `0px` / `44px` / `88px` (Light / Dark / Auto). Selected ink = t.ink, others t.ink2 (never muted-on-surface below 4.5:1).

## P-PILL-M (tool pill, 38; text 15/600; padding 0 16 0 12; gap 8)

```html
<output aria-live="polite" class="at-slide" style="display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px 0 12px; box-sizing: border-box; border-radius: 999px; background: {{toneSoft}}; border: 1px solid {{toneLine}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; white-space: nowrap">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 5px {{toneGlow}})"><path d="{{glyph}}" fill="{{glyphFill}}" stroke="{{tone}}" stroke-width="1.6" fill-rule="evenodd" stroke-linejoin="round"></path></svg>
            {{statusLabel}}
          </output>
```
toneSoft = tone at 12 %, toneLine = tone at 38 %. Pill copy is one of the seven exact strings, alone.

## P-PILL-S (popup, PiP, full embed, home state list: 32; text 14/600; padding 0 12 0 8; gap 8)
Same as M with: `gap: 8px; height: 32px; padding: 0 12px 0 8px; ... font-size: 14px; line-height: 20px;`

## P-PILL-XS (compact embed: 26; text 13/600; padding 0 8; gap 4)
Same as M with: `gap: 4px; height: 26px; padding: 0 8px; ... font-size: 13px; line-height: 18px;`

## P-PILL-L (kiosk ≥ 1180 wide, xl: 48; text 20/600; padding 0 20 0 16; gap 8; glyph 16)

## P-TAG (non-interactive: Pro, Free, Proposed, Release, licence, result badges)

```html
<span style="display: inline-flex; align-items: center; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{t.line2}}; font-size: 12px; line-height: 16px; font-weight: 600; color: {{t.ink2}}; white-space: nowrap">Pro</span>
```
Tone variant (Works / Blocked / Paused): replace the border with `border: 1px solid transparent; background: {{toneSoft}}` and keep text at ink (never tone-coloured small text unless ≥ 4.5:1).

## P-KBD (keyboard hint; DESIGN.md §11.4 "Keyboard hint (kbd)", owner rule 27 Sep: one style everywhere)

```html
<kbd style="display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 8px; box-sizing: border-box; border-radius: 8px; border: 1px solid {{t.line2}}; background: {{t.raised}}; box-shadow: inset 0 -1px 0 {{t.line2}}; font-family: 'Geist Mono', ui-monospace, monospace; font-size: 12px; line-height: 16px; font-weight: 500; color: {{t.ink}}">K</kbd>
```
Height 24, min-width 24, padding 0 8, r8, 12/16 mono 500, background `raised`, 1 px `line-strong` border plus
`inset 0 -1px 0 line-strong`, text `ink`. Never inherits the button it sits on (it sets its own background and colour).
On buttons: wrap in `<span aria-hidden="true">`, render only on hover-capable layouts (desktop/tablet with a pointer;
never phone) and put the key in `aria-keyshortcuts` on the button. In the shortcuts overlay and prose it is content
(no aria-hidden).

## P-CODE (inline code: 14 px fixed, r4, padding 0 4)

```html
<code style="font-family: 'Geist Mono', ui-monospace, monospace; font-size: 14px; padding: 0 4px; border-radius: 4px; background: {{t.sunken}}; color: {{t.ink}}; overflow-wrap: anywhere">x</code>
```
Code block: `background: {{t.sunken}}; border: 1px solid {{t.line}}; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 22px`. Line numbers colour `{{t.muted}}` (never a dimmer grey), 14 px.

## P-KICKER

```html
<span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Kicker</span>
```

## P-CTA (primary 60 r20, label 17/24 600; secondary 52 r20; small 44 r12; cook 64 r20)
Every button sets an explicit padding on the scale (the UA default 1px 6px is a checker hit): theme items `padding: 0`, CTAs `padding: 0 16px`.

```html
<button style="width: 100%; height: 60px; padding: 0 16px; border-radius: 20px; border: 0; background: {{p.lampFill}}; color: {{p.lampInk}}; font-size: 17px; line-height: 24px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 30px -8px {{lampGlow}}">…</button>
```
Stop: same geometry, `border: 1px solid {{t.primaryLine}}; background: {{t.primaryBg}}; color: {{t.primaryInk}}`, no glow. primaryBg = `raised` (dark #26324B / light #E3E9F1), primaryLine = `line-strong` (#33405C / #C3CDDA), primaryInk = `ink` (#EAF0F7 / #0E1726). It follows the theme; never an inverted ink slab (D-R20). 2b boards name the same values stopBg / stopLine / stopInk.
Secondary: `height: 52px; border-radius: 20px; border: 1px solid {{t.line2}}; background: {{t.surface}}; color: {{t.ink}}; font-size: 15px; line-height: 22px; font-weight: 600`.
Small: `height: 44px; border-radius: 12px; padding: 0 16px;` + secondary colours. Chips: 44 r999.
One lamp-filled action per screen.

## P-CARD (r16, padding 20 phone / 24 ≥ tablet, 1 px line; no nested cards)

```html
<div style="border-radius: 16px; padding: {{cardPad}}; background: {{t.surface}}; border: 1px solid {{t.line}}">…</div>
```
Inside a card, groups use dividers (`border-top: 1px solid {{t.line}}`) or spacing, never another bordered box.
Hero panels / embedded tool card / clock faces: r28.

## P-NOTE (honest-limit note; a card: r16, padding cardPad, 20 px icon column, gap 12)

```html
<div role="note" style="display: grid; grid-template-columns: 20px minmax(0, 1fr); column-gap: 12px; row-gap: 4px; padding: {{cardPad}}; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}">
```

## P-ROW (list row: FAQ, device, guide link; min 56, padding 16 0; trailing icon button 44)

```html
<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px; padding: 16px 0; box-sizing: border-box; border-bottom: 1px solid {{t.line}}">…</div>
```
FAQ question button: `min-height: 56px; padding: 16px 0` (no 2 px side padding), chevron in a 44 × 44 box.

## P-FOOTER (one footer everywhere; DESIGN.md §11.7)

```html
<footer style="border-top: 1px solid {{t.line}}; padding: {{foot.pad}}; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px">
    <p style="margin: 0; font-size: 13px; line-height: 18px; color: {{t.muted}}">No ads on the awake screen, now or later.</p>
    <nav aria-label="Footer" style="display: flex; flex-wrap: wrap; column-gap: 16px; font-size: 13px; line-height: 18px; font-weight: 500">
      <a href="#" style="min-height: 44px; min-width: 44px; justify-content: center; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Privacy</a>
      <a href="#" style="min-height: 44px; min-width: 44px; justify-content: center; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Terms</a>
      <a href="#" style="min-height: 44px; min-width: 44px; justify-content: center; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Changelog</a>
      <a href="#" style="min-height: 44px; min-width: 44px; justify-content: center; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">About</a>
      <a href="#" style="min-height: 44px; min-width: 44px; justify-content: center; display: inline-flex; align-items: center; color: {{t.ink2}}; text-decoration: none">Buy me a coffee</a>
    </nav>
  </footer>
```

## Type (DESIGN.md §11.5): size/line-height, weight
kicker 12/16 600 +0.14em upper · caption 13/18 · small 14/20 · ui 15/22 · body 16/26 · lead 18/28 · h3 20/28 600 ·
h2 28/36 (phone 24/32) 600 · h1 48/56 (phone 34/42) 600 −0.02em · price 48/56 (phone 40/48) 600.
Allowed sizes only: 12 13 14 15 16 17 (primary label) 18 20 24 28 34 40 48, plus display digits; TV/kiosk meta 32 and date 40, OG url 22 (§11.5). Weights 400/500/600
(digits 200/300). Never below 12 px. Never 11, 12.5, 13.5, 19, 21, 22, 26, 27, 30, 36 etc.

## Digits (one numeral voice)
`font-family: Geist, system-ui, sans-serif; font-weight: 300; font-variant-numeric: tabular-nums` (200–300 for large
display; Bold face 600). No Geist Mono for clock digits (its zero is slashed). Small counters ≤ 28 px also use Geist.
Mono ('Geist Mono') is only for code, keys, file names, URLs and route slugs. Never for meta prose ("4 guides",
"2 of 6 checked", "336 × 280", prices, units): those use Geist caption 13 with `font-variant-numeric: tabular-nums`.

## Spacing, radii, borders
Spacing only 4 8 12 16 20 24 32 40 48 64 96 (padding, gap, margins between blocks). Radii only 4 8 12 16 20 28 999
(never 6 10 14 18 22 24). Borders 1 px (focus ring 2 px is the only exception). Dashed 1 px line-strong only on
"choose / add" affordances (Until a time…, Custom…, Add timer); a screenshot placeholder in a mock must carry
`data-placeholder` and is exempt. No side stripes (sheet leading edge, column divider, timeline rule are allowed).
Selected item = 1 px lamp 45 % border + lamp 14 % fill.

## Motion
Keep the file's `@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`
(the `*` covers the root; never scope it to a class).
