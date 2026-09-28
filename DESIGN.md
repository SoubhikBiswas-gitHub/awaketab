# AwakeTab design system — "Clear Night" (version D)

Status: **approved direction, not yet implemented.** The interactive source of truth is the design canvas: the 12 redesign canvases linked from `docs/redesign/CANVASES.md` (the `Main` board on the Tool canvas holds the reference logic). When this file and `docs/05-frontend-spec.md` disagree, this file describes the target and docs/05 must be updated in the same PR that implements it (CLAUDE.md contracts rule). Product context lives in `PRODUCT.md`.

Contracts that do **not** change: the seven lock states and their exact pill copy, storage keys `at.v1.*`, routes and slugs, ad placement rules, performance budgets, zero hydration, self-hosted fonts only (no third-party font request; D-R26), `--at-*` token names and their shadcn aliases.

---

## 1. Scene and principles

- **Scene:** a screen left on for a long time. A cook glancing at an iPad across the kitchen, an analyst's second monitor, a lecture projector, a wall dashboard at night. It must be calm for hours and readable from 3 m.
- **Honest first:** state is carried by the pill (text + glyph), the ring pattern and the logo bead together. Never colour alone.
- **One tap to done:** the primary action sits in the thumb zone on phones.
- **Alive, not busy:** slow ambient motion keeps a long-running screen from feeling frozen; nothing blinks, bounces or demands attention.

## 2. Colour

Strategy: **restrained**. Tinted neutrals plus one lamp colour for "awake". Amber and red keep their aviation meanings (caution = paused, alert = blocked); a lamp is never a saturated red, and the warm lamps (Amber, Coral, Gold) are told apart from the paused tone by the pill text, glyph and ring pattern, never by colour alone. Colour themes (§2.4) re-map the neutrals, not these meanings.

### 2.1 Theme tokens (map onto existing `--at-*` names)

| Token | Dark (default at night) | Light (default by day) | Role |
|---|---|---|---|
| `--at-ground` | `#0A0E16` (radial lift `#13203A` at 50% 26%) | `#F2F6FA` (radial lift `#FFFFFF`, end stop `#EEF3F8` per O-57) | Page background, `theme-color` |
| `--at-surface` | `#111826` | `#FFFFFF` | Bars, chips, sheets, cards |
| `--at-line` | `#1F2940` | `#DCE3EC` | Borders |
| `--at-line-strong` (new) | `#33405C` | `#C3CDDA` | Secondary button borders, dashed chips |
| `--at-ink` | `#EAF0F7` | `#0E1726` | Primary text |
| `--at-ink-2` (new) | `#B7C1D1` | `#3A4659` | Secondary text |
| `--at-muted` | `#8E9AAE` | `#5B6779` | Captions, meta (≥ 4.5:1 on ground) |
| `--at-track` (new) | `#1A2336` | `#E3E9F1` | Ring track, progress bar track |
| `--at-tick` (new) | `#2A3752` | `#CCD5E1` | Ring minute ticks |
| `--at-warn` | `#F2B34C` | `#98641A` | Paused (lost); light darkened from `#B7791F` (3.4:1) so warning text passes 4.5:1 (B1) |
| `--at-bad` | `#FF7A7A` | `#C63F3F` | Blocked (denied); light darkened from `#D14343` (4.2:1 on ground) for 4.5:1 error text (B1) |
| `--at-accent` | lamp, dark value | lamp, light value | Awake: ring, bead, primary CTA |
| `--at-on-accent` | `#04232A` | `#FFFFFF` | Text on lamp-filled buttons |

The `oled` theme keeps pure black ground (`#000`) and surface `#0A0A0A`; all other oled values follow dark.

Additional tokens (from the design critique, 27 Sep 2026):

| Token | Dark | Light | Role |
|---|---|---|---|
| `--at-raised` | `#26324B` | `#E3E9F1` | Neutral selected segment (theme switch), raised tile |
| `--at-sunken` | `#0D131F` | `#F6F9FC` | Code blocks, timer wells, URL outputs, input fill |
| `--at-input-border` | `#5A6781` | `#818C9C` | Input, select and textarea borders (≥ 3:1, decision O-56; light was `#8C98AA`, only 2.7:1 on ground, B1) |
| `--at-horizon-ink` | `#F6F2EA` | `#F6F2EA` | Digits on the Horizon sky and water |
| `--at-halo` | lamp 18 % → 0, radial 50 % 26 % | lamp 10 % → 0 | The single status halo behind pill/face on every surface |
| `--at-shadow-color` | `#000` | `#0E1726` | Drop shadows, mixed with transparent (`color-mix(in srgb, var(--at-shadow-color) 25%, transparent)`) |
| `--at-bezel` | `#05070B` | `#1A2230` | Device glass and bezels in drawings, dark in both themes; `--at-bezel-ink` `#8E9AAE` is text on it |

Extension toolbar badge (Chrome draws it; white text): Screen level `#087B87` (5.0:1), System level `#2B3A67` (11:1); tokens `--at-badge-screen`, `--at-badge-system`, `--at-badge-ink` for every drawing of it. Replaces the amber display badge in docs/00 `BADGE_COLORS` and docs/10, because amber means paused.

Night mode (OLED, red digits): `--at-night-ink #FF5A3C`, `--at-night-ink-2 #E8563C`, `--at-night-muted #A89690`, `--at-night-line #3A2E2A`; ground `#000`. Scrim is always `rgba(4,7,12,.55)`.

### 2.2 Lamp colours (user choice)

| Id | Dark | Light (ring, fills and accent text) | Gate |
|---|---|---|---|
| `aqua` (default) | `#5BE0E8` | `#087B87` | free |
| `violet` | `#A594FF` | `#5A47CF` | free |
| `amber` | `#FFAF6B` | `#A34F00` | free |
| `teal` | `#4FD8BE` | `#0A7565` | free |
| `mint` | `#7EF0B8` | `#167A50` | `ambient.packs` |
| `sky` | `#7CB8FF` | `#255FBD` | `ambient.packs` |
| `ice` | `#A8DDF5` | `#2A6A8A` | `ambient.packs` |
| `lavender` | `#CDB8FF` | `#7446B0` | `ambient.packs` |
| `rose` | `#FF9CC6` | `#B0366A` | `ambient.packs` |
| `coral` | `#FF9B85` | `#B1452F` | `ambient.packs` |
| `gold` | `#EBCB5A` | `#7F6400` | `ambient.packs` |
| `lime` | `#B5E36A` | `#4D7300` | `ambient.packs` |
| custom | the light value mixed 40 % with white | any colour, fitted | `ambient.packs` |

Light values are the darker accent-text shades because lighter fills (for example `#0A8F9B`, 3.9:1) fail AA for white button text. Rules: lamps are calm and **never a saturated red**, so a lamp cannot read as "blocked"; state is never colour alone (pill text, glyph, ring pattern), so a warm lamp next to the amber paused tone stays honest. Every lamp on every colour theme (§2.4) in light, dark and OLED: accent ≥ 3:1 on ground, accent-text ≥ 4.5:1 on ground and surface, label ≥ 4.5:1 on the fill (checked with culori). The custom lamp is fitted (same hue, lightness moved the least, red capped at 55 % saturation) until it passes on every theme. The picker is Settings → Appearance → Lamp colour: named swatches drawn as a mini ring, never colour alone. A lapsed licence falls back to Aqua. Old stored hexes (amber `#B86E00`, indigo, teal `#0F766E`, rose `#BE123C`) keep mapping to Aqua, Violet, Mint and Sky; the new lamps use other hexes.

### 2.3 State colour map

| Lock state | Pill copy (unchanged) | Tone | Pill glyph | Ring pattern |
|---|---|---|---|---|
| idle | Ready | muted | hollow circle | full arc in lamp at 45% opacity, no glow |
| requesting | Starting… | lamp | hollow circle | full arc, sweep starts |
| held | Screen awake | lamp | filled dot with glow | depleting arc + glowing tip + slow sweep |
| lost | Paused — tab hidden | warn | two pause bars | amber long dashes `18 12`, no tip |
| denied | Blocked — here's the fix | bad | triangle | red dots `1 13`, no tip |
| unsupported | Tap to use the fallback | lamp | filled dot | full arc, CTA floats |
| fallback | Awake via video fallback | lamp | dot in ring | depleting arc + dashed track `3 9` |

The logo bead in the header takes the current tone, so the brand mark is itself a status light. The tab favicon and title mirror it (`● 24:18 left`).

### 2.4 Theme layer (colour themes, backgrounds, presets)

A colour theme re-maps the same tokens; it never adds names. `html[data-palette="<id>"]` with `data-theme` sets the neutrals and tones of §2.1 (`ground`, `surface`, `line`, `line-strong`, `ink`, `ink-2`, `muted`, `track`, `tick`, `raised`, `sunken`, `input-border`, `warn`, `bad`, `good`, `lift`, `ground-end`, `shadow-color`, `bezel`), so the shadcn aliases, the ambient ground and every component follow. Each theme has light and dark; OLED keeps the theme's inks on pure black. The lamp, night mode and the Horizon art are not re-mapped.

| Theme | Character | Light ground · ink | Dark ground · ink | Gate |
|---|---|---|---|---|
| Clear Night | the default (§2.1) | `#F2F6FA` · `#0E1726` | `#0A0E16` · `#EAF0F7` | free |
| Paper | warm sepia, like a notebook | `#F8F3E9` · `#2B2118` | `#15110C` · `#F2E9DA` | free |
| Nord | cool arctic greys | `#F1F3F7` · `#2E3440` | `#242933` · `#ECEFF4` | free |
| Solarized | Schoonover's base tones | `#FDF6E3` · `#073642` | `#002B36` · `#FDF6E3` | Pro |
| Midnight | deep indigo night | `#F2F3FA` · `#0B1030` | `#070B1A` · `#E8ECFF` | Pro |
| Forest | moss and pine | `#F2F6F1` · `#13221A` | `#0B130F` · `#E6F0E8` | Pro |
| Sunset | dusk rose | `#FBF2ED` · `#2A1418` | `#160E14` · `#FBECE6` | Pro |
| Mono | pure greys | `#F4F4F4` · `#111111` | `#0B0B0B` · `#EDEDED` | Pro |
| High contrast | black and white, strong lines | `#FFFFFF` · `#000000` | `#000000` · `#FFFFFF` | Pro |

Backgrounds sit behind the page and every ambient mode but Night and Minimal: None, Grain, Dots, Grid (free), Contours, Waves, Aurora, Stars, Drift (Pro). They are drawn from tokens (ink at 7 %, 60 % of that on OLED; lamp at ≤ 8 % for Aurora and Drift), so text stays AA over them; they move only by slow transform or opacity (a 240 s drift keeps them burn-in safe; Stars twinkle over 11 s, Drift rises over 320 s), stop under reduced motion and hide under forced colours. Presets are one-tap theme + lamp + background: Classic, Library, Fjord (free), Night desk, Kitchen, Focus, Campfire, Northern lights (Pro).

The boot script paints the stored theme, lamp and background before the first frame (a parser-inserted link to `public/assets/themes.css` only when one is set), so nothing flashes. Settings → Appearance shows every option as a live mini (ground, background, lamp ring, a card with two lines), drawn with the real tokens on the tile itself. A Pro option previews for 5 minutes: a calm chip above the dock ("Previewing Nord · 4:59 left · Keep it with Pro", folds to a dot), a toast at 1 minute, then a slow cross-fade back to the last free choice. Nothing is stored and a session is never touched; while a session runs the chip carries no Pro link (D-R15).

## 3. Type

The product uses the canvas's fonts (decision D-R26, replacing the earlier "system fonts only" rule). All three are SIL OFL 1.1 and **self-hosted** from `/fonts` (Latin woff2, licence files alongside); no third-party font request, and a metric-matched local fallback face per font (size-adjust and ascent/descent/line-gap overrides). Only Geist is preloaded, with `font-display: optional`: it paints when it arrives in time and otherwise the page keeps its fallback rather than swapping text under the reader. Geist Mono and Space Grotesk load after the first paint with `swap`; their fallbacks match their advances, so the swap never moves layout. Scripts outside Latin (ja, zh, hi) fall through to the system stack.

| Role | Token and font | Notes |
|---|---|---|
| UI text | `--at-font`: Geist (variable 100–900), then "Geist Fallback", then the system stack | Every UI string |
| Code, keys, file names, URLs, small counters (≤ 28 px: PiP, embed, extension badge text) | `--at-font-mono`: Geist Mono (variable), then fallback, then `ui-monospace` | Plain (unslashed) zero only |
| Display digits (Ring, Tide, Kiosk, OG, store, popup) | Geist weight 200–300, `font-variant-numeric: tabular-nums`, no slashed zero | |
| Bold and Flip face digits | `--at-font-display`: Space Grotesk 600 (digits-only subset: 0–9 : . , space d h m), letter-spacing −0.06em, `tabular-nums` | Used by the Bold and Flip faces only |
| Nixie face digits | Nixie One 400 (SIL OFL, self-hosted, unmodified) | Loaded only with the Nixie face |
| LCD face digits | DSEG7 Classic Italic (SIL OFL, self-hosted, unmodified) | Loaded only with the LCD face |
| Ring / Horizon / Tide digits | Geist weight 250 (Ring, Horizon) and 200 (Tide) | Horizon and Tide go 100 heavier in the final minute |

Scale: kicker 12/uppercase/0.16em tracking · caption 13 · body 14–16 · button 15–17 · date/time line 15 · digits (in face units, 358 × 340 box): ring 80 (62 with hours, 42 with days), bold 168 (112, 64) with seconds at 36 %, horizon 64 (48, 34), tide 88 (64, 50); desktop scales the face ×1.55. All digits are tabular with tight display tracking (−0.045em Geist, −0.065em Space Grotesk); the face box scales with its cell, so the widest value (12:59:59, 1d 02:15:00) always fits.

## 4. Time and dates

- Times: 12-hour with AM/PM in `en` (`5:30 PM`); other locales follow `Intl` defaults unless the user picks 12/24 h in Settings.
- Date line under the header: full weekday, day, month name, year: `Saturday, 26 September 2026` and the current time on the right.
- A time past midnight says `tomorrow` (`12:30 AM tomorrow`).
- Show consequences before acting: Ready shows `ends at 10:30 PM`; running shows `until 10:30 PM`; no-limit shows `since 9:12 PM`.
- End times are rounded to the nearest minute before display.
- Long sessions, same rule on every surface (tool, popup, PiP, embed, kiosk): under 1 h "MM:SS"; 1 h and over "H:MM:SS" (tabular, sized so 12:59:59 never wraps); 24 h and over "1d 02:15:00" with the full end line ("Sunday, 27 September · 10:30 AM"); ends 2+ days away show the weekday.
- No limit (∞, "Until I stop"): no countdown. Ready shows the count-up at rest, 00:00. Digits count up as elapsed with the caption "Awake for" and "since 9:04 PM" ("since yesterday 7:43 PM" after midnight); ring full and steady; extend buttons hidden; Stop stays; extension badge ON/SYS.

## 5. Layout and breakpoints

| Size | Width | Tool layout |
|---|---|---|
| Phone | 360–599 | Single column: header · date line · face switch · pill · face (340 tall) · note · spacer · length block · 20 px gap · actions at the very bottom |
| Tablet | 600–1023 | Single column centred, face scaled ×1.35, controls max 520 wide, actions stay bottom |
| Desktop | ≥ 1024 | Two columns: face left (×1.55), right column pill · note · length block · actions · face switch |

Responsive contract (owner requirement, 27 Sep 2026): every screen is responsive at every width, not only at the drawn ones.

- **Canvas:** the reference. Each screen is drawn at the key sizes (phone 390, tablet 820, desktop 1280; small phone 320/360, landscape and 1920 where the layout changes) in dark and light. It shows how the layout adapts; it cannot show every width.
- **Code:** fluid between the drawn sizes. Layout comes from flex/grid, `max-width` and the gutter steps (16 / 32 / 80 / 120), never from fixed page widths. Logical properties only. No horizontal page scroll at any width from 320 to 2560. Text reflows at 400 % zoom (WCAG 1.4.10). Nothing sits flush against an edge (16 px minimum, 20 px below the last row of actions). Targets stay ≥ 44 px at every width.
- **Gate:** an e2e sweep loads every route at every 40 px step from 320 to 2560 (plus phone landscape and 400 % zoom). It fails on horizontal scroll, controls within 16 px of the viewport edge, targets under 44 px, or clipped text. It runs in CI and blocks the release.

Phone bottom dock (user decision): the length block (15m · 30m · 1h · 2h · No limit, then Until a time… · Custom…) always stays above the actions with a 20 px gap; the actions (+15 min · Stop, or the lamp CTA "Keep awake · 30 min") sit at the very bottom. Changing the length while running applies immediately.

Presets per size (decision O-74): every phone shows all seven in a two-row grid, 15 min · 30 min · 45 min · 1 h · 2 h / 4 h · ∞ · Until… · Custom… (at 320 px four columns, the eighth cell More… holds Until… and Custom…); tablet and desktop show 15 min · 30 min · 45 min · 1 h · 2 h · 4 h · ∞ in one bar. ∞ is named "Until I stop".

Ads and sponsor (contract, docs/00 §8.3): no Google ads on the tool, presets, `/until`, `/pip`, `/embed`, `/pro*` or the extension. Content pages (`/for`, `/on`, `/vs`, `/guides`, `/learn`) may carry a 160×600 desktop rail and one inline 336×280 (300×250 on phones), labelled "Advertisement", never touching the tool card. The 300×100 "Sponsored" card may appear only in Ready/held and the extend prompt, never in Night or Minimal.

Spacing, radii and control sizes: see §11 (the only source). Targets ≥ 44 px (60 px primary actions, 64 px in cook mode).

## 6. Components

- **Header:** logo lockup (ring + lamp bead) · three menus (Use it for ▾, Devices ▾, Resources ▾, native popovers that rise in with a lamp glow; use cases carry their suggested length as a ring around the icon) · Extension · Pro · theme switch (Light · Dark · Auto, sliding indicator, 44 px segments) · Add to Chrome (Add to Edge, or Add to Home Screen on iOS). Narrower headers and every tool page fold the menus into one Menu button: a bottom sheet on phones, an anchored panel from 600. The tool header keeps Stats (desktop) and Settings.
- **Segmented bars** (presets, theme): surface pill with one sliding indicator (`translateX(index × 100%)`, 600 ms ease-out), selected text ink 600, others ink-2 500.
- **Status pill:** see §11.4 pill sizes; tone 12 % fill + 38 % border, glyph 12 px, `<output aria-live="polite">`.
- **Primary CTA:** lamp fill, on-accent text, logo glyph, soft lamp shadow. **Stop** (and every strong neutral action: Retry, Stop for today, Send, Install, Exit): `raised` fill + 1 px `line-strong` + `ink` text, so it follows the theme (dark button on dark, light button on light; decision D-R20). **Secondary:** surface + strong line.
- **Inline panels, not modals:** Until a time (4 half-hour slots with `today`/`tomorrow` sub-labels) and Custom (± 5 min stepper) replace the preset bar in place.
- **Blocked card:** tinted bad 8% with 32% border, title + one-paragraph fix; actions become "Use video fallback" · "Try again".
- **Settings sheet:** bottom sheet on phone, side sheet on desktop; sections Appearance (theme, lamp colour, clock face), Time (12/24 h, show seconds), Behaviour (existing settings from docs/05 §3.18).
- **Dialogs, sheets and drawers** (one set: `components/ui/Dialog.astro`, `Sheet.astro`, `Drawer.astro`, native `<dialog>`, docs/05 §3.30): surface fill, 1 px line, `--at-shadow-float`, backdrop `--at-scrim`; header = 36 × 4 grab handle (phones), title 20/28 600, optional description (small, ink-2) and a labelled 44 × 44 Close at the end; body scrolls inside; footer holds the actions, primary last. Phones always get a bottom sheet in the thumb zone (r28 top corners, above the safe area and the keyboard). From 600: `Dialog` is a centred card (r28), `Sheet` a full-height side sheet (inner corners r28, 1 px line on the leading edge), a docked card (share, rating) sits in the tool dock and keeps the page live. Motion: slides up or in from its side while the backdrop fades, `--at-d-slide` in and `--at-d-slow` out, ease-out, no bounce, instant under reduced motion. One layer at a time; the page behind never scrolls. Still a last resort: inline panels come first.

- **Notes drawer** (docs/05 §3.34): the one `Sheet` for notes, end side from 600 (30rem from 1024, scrim at 45 % so the face column stays readable), full-height bottom drawer on phones. First row: a bead in the state tone with the pill text and time left, then All notes · New note. The page of text is a sunken r16 sheet with a faint 24 px dot grid (ink 7 %), body 16/26; a sticky toolbar of 44 px icon buttons (selected = lamp 14 % fill + lamp 45 % line); the mic sits last and fills with the lamp while listening, with a breathing ring (still under reduced motion). Inline panels (r16, lamp 7 % tint) carry the voice notice and the Pro offer; Clear confirms inline with the strong neutral button, never red. Footer: word count and a check-marked "Saved at 10:42 PM", then Copy · .md · .txt · Clear.

## 7. Clock faces (user-switchable, remembered)

1. **Ring:** a watch dial. 60 fine minute ticks with 12 longer hour ticks, the depleting lamp arc with its glow, a bright tip bead with a 3.4 s halo, a soft lamp glow inside the dial, and a one-minute second sweep: a band of light circling the tick ring once a minute with a bright leading edge (it starts with the session, so the edge passes the top as the seconds read :00; it holds still, amber, while paused). Digits Geist 250, tracking −0.045em, seconds muted.
2. **Bold:** editorial and left-aligned. A kicker with a state dot, display numerals (Space Grotesk 600, 168; the seconds a raised small figure beside them), a 6 px bar in a lamp gradient that glows while held (dashed while paused, dotted while blocked, like the Ring), then "until 10:30 PM" with the time in ink and "of 30 min" muted.
3. **Horizon:** a living sky. Five-stop skies for dawn, day, dusk and night; the sun (a lit core; a crescent moon at night) travels a faint dotted arc and sets behind two layers of hills exactly when the session ends, at a small mark on the ridge; the sky warms as it sets; clouds drift (90 s / 130 s), stars twinkle at night and dawn, and the sun lays a broken glint on water with fine reflection lines. Phase follows the real local time (dawn 5–8, day 8–17, dusk 17–20, night). Digits (Geist 250) sit on the water so they never collide with the sun.
4. **Tide:** water level equals time left. The water has depth (the lamp darkening towards the bottom, a soft light under the surface), a bright meniscus on the front wave, a gently bobbing back wave (13 s / 21 s), glassy rising bubbles; digits are drawn twice and clipped at the waterline so they stay readable above and below the surface.
5. **Flip:** split-flap cards that really turn on each digit change (the top leaf falls, the bottom leaf lands, 660 ms, shaded as they go); a 1 px hinge with side notches, a soft shadow and a lamp under-glow while the screen is held; seconds on smaller cards.
6. **Rolling:** odometer drums that roll to the next digit (downward while counting down) in a sunken window, with a hairline of time left beneath.
7. **Analog:** an SVG dial showing the local time, with a sweeping lamp second hand and time left drawn as an arc on the bezel. Two styles in Settings: Minimal (twelve indices) and Luxe (minute ticks, heavier indices, lume dots, hand inlays, a fine sunburst plate).
8. **Rings:** three concentric arcs in graded lamp tints, like activity rings: time left of the session (hours awake with no limit), minutes, seconds; the time sits inside.
9. **Words:** a letter grid that lights "IT IS HALF PAST TEN" for the local time in five-minute steps, with corner dots for the minutes between; lit letters glow softly. One table per language, English first.
10. **Nixie:** glowing tube digits on a base, with a faint wire mesh and the unlit cathodes as ghost numerals. The glow is a warm-white core with a halo in the lamp colour, amber only while paused.
11. **LCD:** a seven-segment display on lamp-tinted glass with every unlit segment faintly visible, seconds smaller, an outlined annunciator for the state word.
12. **LED:** a dot-matrix panel of unlit dots with the digits lit in the lamp colour.

All twelve are free. The newer eight load only when chosen, keep the face box reserved (no layout shift on a switch or a saved face), follow every state through the lamp (`--at-face-c`) with the Ring's arc patterns where they have an arc, respect light, dark and OLED, shift 2 px a minute while the screen is held, and stop flipping, rolling, sweeping and fading under reduced motion.

**Choosing a face.** The order is the gallery's, in three groups: Classic (Ring, Bold, Horizon, Tide), Retro (Flip, Nixie, LCD, LED), Modern (Rolling, Analog, Rings, Words).

- *Face switch* (where the tabs were): one surface pill, Previous · Clock face *name* · Next, 44 px segments, the four-dials icon in the state tone. Previous and Next step at once.
- *Gallery* (a sheet: bottom on phones, side from 600): every face as a live miniature of the real thing, in the current state, lamp and theme, two per row under kicker headings; still at rest, playing while pointed at or focused, never under reduced motion. The face in use has a lamp border and an "In use" tag; Analog carries its Minimal · Luxe switch. Arrow keys move between tiles, Enter picks and closes.
- *Swipe* on the clock (touch, trackpad, mouse drag): the face follows the finger and fades while the neighbour's name slides in; past halfway it changes, otherwise it springs back. Page scroll and the dock are never affected.
- *Keyboard:* `C` next face, `Shift+C` previous (`F` stays fullscreen).
- Settings → Clock face still shows all twelve as tiles.
- A switch never shows an empty or unstyled box: the old face stays until the new one is ready.

## 8. Motion

- Easing `cubic-bezier(.22,1,.36,1)` (ease-out-quint family); no bounce, no elastic.
- Durations: state colour 450–600 ms, slides 600 ms, content rise 700–900 ms, time-driven transforms 1 s linear (matches the tick), ambient loops 3–130 s.
- Animate `transform`, `opacity`, `clip-path`, `stroke-dasharray` only; never layout properties.
- `prefers-reduced-motion: reduce` stops every loop and transition (burn-in pixel shift still applies, instantly).
- Nothing moves into its first place: the page paints its settled state (docs/05 §3.33, First load), so primary buttons, the pill, the note and the selected-segment indicators never fade or slide on load. Motion answers a change the user can see coming; a theme swap runs no transitions at all.
- Implementation is CSS-only (keyframes + `@property --at-p` for progress); the island only writes `--at-p` and `data-state`. JS budget has ~1 KB headroom.
- **Interactive cards and icons** (content pages, the homepage below the tool, header menus). No raster or 3D-engine icons: the inline SVG line icons do the work.
  - *Tilt:* cards marked `[data-tilt]` lean toward a mouse pointer (`perspective(64rem)`, at most 5° on each axis) and a soft lamp-tinted glow (`--at-accent` at 14 %) follows it; the card's icon (`[data-tilt-z]`) floats 24 px above the card plane. Only for `(hover: hover) and (pointer: fine)`. A keyboard-focused card lifts 4 px and never tilts; on touch a pressed card dips to 98.5 % for a moment. The pointer position comes from `lib/tilt.ts` (one passive listener, one write per frame), never from the tool's critical bundle.
  - *Icons act out their use:* each use case and device icon has named parts (`.at-ico-part-*`) that play one short motion (about 900 ms, ease-out, no bounce, no loop) when its card or menu row is hovered or keyboard-focused: steam rises, a page turns, a screen lights, bars grow, a camera light blinks, the download arrow drops into the tray, a phone screen wakes, a laptop lid settles. At rest every icon looks exactly as drawn; parts that only appear while acting carry `opacity="0"`.
  - *Ring fill:* the lamp arc around a use-case icon in the header menus sweeps from empty to its suggested length (600 ms, ease-out) on hover or focus.
  - Nothing moves unless pointed at or focused, so a tab left open for hours spends nothing on it. Under reduced motion everything is static and the rings show full; under forced colours the icons keep `currentColor` and the glows are hidden.

## 9. Theme behaviour

`auto` follows `prefers-color-scheme` live (listener on the media query). Horizon's sky phase is independent of theme and follows local time. The boot script applies theme, colour theme, lamp and background before first paint (no flash). Every colour theme has a light and a dark variant, so Auto switches both live.

## 10. Do and don't

- Do keep every control a real `<button>`/`<a>` with a label; icon buttons get `aria-label`.
- Do keep the pill copy exact; add meaning around it, not inside it.
- Don't add ads on the awake screen, modals as a first resort, gradient text, glassmorphism, side-stripe borders, identical icon-card grids, or em dashes in new copy (the fixed pill strings are the only exception).

## 11. System spec (strict — every screen, every product)

Only these values. Anything else is a bug. Canvas boards, the web app, the extension and the embed all obey the same numbers.

### 11.1 Spacing
Scale: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96` px.
- Inside a control or chip: 8–12. Between related items: 8 / 12. Between groups: 20 / 24. Between sections: phone 48, tablet 64, desktop 96.
- Page gutters: phone 16, tablet 32, desktop 80, xl 120. Max content width 1200; reading measure 68ch.
- Phone dock: length block → 20 → actions; actions 20 from the bottom edge.
- Below the last row or button of a sheet, panel or dock: 20. **Exception, the extension popup:** it is a fixed 360 × 600 frame (Chrome caps a popup at 600 px and scrolls anything taller), so it keeps **8** below its last row inside that frame instead of 20. The tallest states end on the frame's last 8 px; a longer translation scrolls inside the frame rather than growing it.

### 11.2 Borders
- Width is always **1 px** (focus ring is the only 2 px line, offset 3 px).
- `line` for card edges, dividers and bars; `line-strong` for secondary buttons and inputs.
- **Dashed** 1 px `line-strong` only for "choose / add" affordances (Until a time…, Custom…, Add timer, Add schedule). Never decorative.
- State borders: tone at 38 % alpha (pill, blocked card at 32 %). Selected item: 1 px lamp at 45 % + lamp 14 % fill.
- No side-stripe borders, no double borders, no border + heavy shadow together.
- Allowed single-side rules: the leading edge of a side sheet, a 1 px `line` column divider between two content columns, and a 1 px timeline rule. An "active" indicator is never a side stripe (use ink 600 + lamp dot).
- Illustrations and device mocks (`aria-hidden` art, browser or OS chrome placeholders marked `data-placeholder`) are exempt from border, colour and radius rules.

### 11.3 Radii
`4` micro (inline code, heatmap cells, legend swatches) · `8` inputs, code blocks, kbd, checkboxes · `12` icon buttons, small buttons (44), small tiles, toolbar/PiP windows · `16` cards, list containers, inline panels, selectable tiles · `20` large buttons (52/60/64) · `28` clock faces, sheets (top corners), hero panels (including the embedded tool card) · `999` pills, tags, segmented bars, chips, switches, progress tracks.
Never 14, 18, 22 or 24.
Nested radius rule: inner radius = outer radius − padding (e.g. bar 999 → item 999; card 16 with 8 padding → inner 8).

### 11.4 Control sizes
- Height: chip / segmented item / icon button / small button **44**; input **48**; medium button **52**; primary action **60**; cook mode targets **64**.
- Segmented bar = 1 px border + 4 px padding + 44 px items (54 total). Sliding indicator same height as items, inset 4 px. Theme switch is a segmented bar (no 3 px padding).
- Status pill (not a control): **L 48** (kiosk ≥ 1180 wide, xl; text 20) · **M 38** (tool; text 15/600, padding 0 16 0 12, gap 8) · **S 32** (extension popup, PiP, full embed; text 14/600, padding 0 12 0 8) · **XS 26** (compact embed; text 13/600, padding 0 8, gap 4).
- Tag (non-interactive: Pro, Free, Proposed, Release, licence): height 24, 12/16 weight 600, r999, padding 0 8, 1 px `line-strong` or tone 12 % fill.
- Keyboard hint (kbd), one style everywhere: a theme keycap that never inherits the button it sits on. Height 24, min-width 24, padding 0 8, r8, 12/16 ui-monospace weight 500, background `raised`, 1 px `line-strong` border plus a 1 px bottom inset (`inset 0 -1px 0 line-strong`), text `ink`. Dark theme = dark keycap with light text; light theme = light keycap with dark text, on every button (lamp CTA, ink Stop, secondary) and in the shortcuts overlay, settings and extension options. Shown only on hover-capable devices (`@media (hover: hover) and (pointer: fine)`) and when "Show keyboard hints on buttons" is on; hidden on phones; `aria-hidden` (the button's accessible name already says the action; `aria-keyshortcuts` carries the key).
- List row (FAQ, device, guide link): min-height 56 (grows when text wraps), padding 16 0; its trailing icon button is 44. Selectable time tiles (/until) may be taller than 56.
- Status pill text may wrap to two lines in long locales (min-height 38, radius 20, balanced wrap; decision O-62).
- PiP window digits use display-s up to 40 px (decision O-83). Compact embed is 320 × 104 (decision O-58).
- Night mode pill and bead use `--at-night-muted`, never red or lamp; Minimal uses `muted` (decision O-09).
- Small screens (≤ 568 tall) and landscape phones may use 52 for the primary action and header; nothing else shrinks.
- Switch 52×32 track, 24 knob. Checkbox/radio 24 visual inside a 44 target.
- Icons 16 / 20 / 24 px, stroke 1.8, round caps. Icon + label gap 8. Every inline SVG carries `width`, `height` and `viewBox` at its design size (drawings at their viewBox size), so an icon never renders larger than designed while its stylesheet is still loading.

### 11.5 Type scale (size / line-height, weight)
| Token | Size/LH | Weight | Use |
|---|---|---|---|
| `kicker` | 12/16, +0.14em, uppercase | 600 | section eyebrow, face kicker |
| `caption` | 13/18 | 400–500 | meta, timestamps, helper |
| `small` | 14/20 | 400–500 | secondary UI, notes |
| `ui` | 15/22 | 500–600 | buttons, chips, pill, nav |
| `body` | 16/26 | 400 | paragraphs |
| `lead` | 18/28 | 400 | intros |
| `h3` | 20/28 | 600 | card titles |
| `h2` | 28/36 (phone 24/32) | 600 | section headings |
| `h1` | 48/56 (phone 34/42) | 600, −0.02em | page titles |
| `display` | face-specific (§3) | 200–600 | clock digits only |
| `display-s` | 24–28 | 300 | small counters (PiP, embed, popup) |
| `price` | 48/56 (phone 40/48) | 600 | plan prices only |

Weights allowed: 400, 500, 600 (+200/300 for digits). Primary action label 17/24 600. Never below 12 px.
Mono is allowed only for digits, code, keys, file names and URLs; never for meta prose ("4 guides", "2 of 6 checked", prices, units).
Inline code is 14 px fixed (not em-relative), r4, padding 0 4.
TV / kiosk scale (≥ 1920 wide): meta 32, date 40, message 96–128, clock digits face-specific. OG (1200×630) scale: kicker 20, title 64, body 28, url 22.

### 11.6 Surfaces and elevation
- Card: `surface`, 1 px `line`, radius 16, padding 20 (phone) / 24 (≥ tablet). No nested cards: inner groups use dividers or spacing.
- Elevation: dark and OLED use borders only; light adds `0 1px 2px rgba(14,23,38,.06)`. Sheets and floating panels: `0 24px 64px -24px rgba(0,0,0,.45)` + scrim `rgba(4,7,12,.55)`.
- Header 60 (phone) / 68 (≥ tablet) on every product: tool, content, Pro, extension options, embed docs. Header gutter = page gutter (§11.1). Bottom border 1 px `line` only when content scrolls under it.
- Header menus (Use it for, Devices, Resources, then Extension and Pro) show when the header is at least 1000 px wide inside its gutters (a container query); below that, and on every tool page, they fold into one Menu button. On the tool page the header also carries the date line, the Pro badge, Install, the theme switch and the Share, Shortcuts, Floating window, Stats and Settings icon buttons (below 768 px Share and Shortcuts move to the Settings footer, as on phones). Below 768 px the tool header's theme switch is the one-button cycle, and below 360 px every header's logo keeps its ring and bead but drops the word so Menu fits. Header, content and footer share one column edge at every width (max 1200 plus gutters).
- A device or window mock (popup inside a browser, widget inside a host page) is not a nested card; explanatory cards inside cards are.

### 11.7 Composition rules
- One primary action per screen (lamp fill). Stop is the strong neutral: `raised` fill, 1 px `line-strong`, `ink` text; it follows the theme and never inverts (D-R20). Everything else secondary or quiet.
- Align to a 4 px baseline; left edges of text in a column share one x.
- Consistent order in every product: status → time → primary control → options.
- Every page ends with the same footer (links, honest line "No ads on the awake screen, now or later."; wording depends on owner decision O-04 about the sponsor card).
  Footer spec: a site map that mirrors the header. 1 px `line` top border; brand block (logo lockup, one-line promise in small `ink-2`, "Open source · MIT" in caption `muted`); five columns Product · Use it for · Devices · Resources · About with kicker titles and caption 500 `ink-2` links (44 × 44 targets); a base row with the honest line in caption 13 `muted` and the language switcher last. Phones: the columns are native `<details>` accordions (48 px rows, no JS). 3 columns from 600, 5 from 1024, brand beside the map when the footer is 1120 wide inside its gutters. Pro, Activate and Manage pages included. Full spec in docs/05 §3.27.
- A notice, toast or banner never covers the primary action or the status pill; it pushes content or sits above the dock.
- Toasts: one region above the dock, newest nearest it; a distinct icon shape per kind (check, info ring, triangle, octagon); errors stay until dismissed; while a sheet, dialog or menu is open they rise above it at the bottom centre instead of hiding behind it (docs/05 §3.7).
- Canvas boards: height ≤ 8000; a board's default `layout` prop must match its width.

## 12. Token system (scalable, responsive; how §11 is built)

§11 lists the allowed values. This section names them, so code and canvas use **names, never raw numbers**. It is one system for the web app, content pages, Pro, the extension and the embed.

### 12.1 Three layers
1. **Primitives:** the scales in §11 (spacing, radius, type, control sizes). Defined once, in `apps/web/src/styles/tokens.css` (the extension and embed import the same file).
2. **Semantic tokens:** what a value is for (`--at-gutter`, `--at-section`, `--at-type-h1`). Only these change per breakpoint.
3. **Components:** use semantic tokens and primitives by name. A component never holds a raw px or rem value for spacing, radius, font size or control height.

Existing `--at-*` names and their shadcn aliases stay (contract, docs/05 §1.1, §1.5). New names are additions. Two values change: `--at-r-sm` 6 → 8 and `--at-r-md` 10 → 12. The build adds the new names to docs/00 §13 and docs/05 §1.1 first (CLAUDE.md contracts rule).

### 12.2 Breakpoints (the only four)
| Band | Width | Used for |
|---|---|---|
| phone | < 600 | one column, actions at the bottom, phone type step |
| tablet | 600–1023 | one column centred (controls max 520), large type step |
| desktop | 1024–1599 | two columns where the layout has them |
| xl | ≥ 1600 | xl gutter; TV and kiosk scale from 1920 |

Media queries use `min-width: 600px`, `1024px` and `1600px` only (mobile first). Components that live inside other layouts (the tool card on content pages, the embed, the popup) respond to their **container** with container queries at the same widths, not to the viewport.

### 12.3 Spacing
Primitives: `--at-s-N` = N × 4 px: `s-1` 4 · `s-2` 8 · `s-3` 12 · `s-4` 16 · `s-5` 20 · `s-6` 24 · `s-8` 32 · `s-10` 40 · `s-12` 48 · `s-16` 64 · `s-20` 80 · `s-24` 96 · `s-30` 120 (existing: s-1, 2, 3, 4, 6, 8).

| Semantic | phone | tablet | desktop | xl |
|---|---|---|---|---|
| `--at-gutter` (page side padding) | 16 | 32 | 80 | 120 |
| `--at-section` (between sections) | 48 | 64 | 96 | 96 |
| `--at-card-pad` | 20 | 24 | 24 | 24 |
| `--at-edge-min` (nothing closer to an edge) | 16 | 16 | 16 | 16 |
| `--at-dock-bottom` (below the last row of actions) | 20 | 20 | 20 | 20 |

Gaps are fixed at every width and chosen by relationship: `--at-gap-tight` 8 (inside a control, icon + label) · `--at-gap-item` 12 (related items) · `--at-gap-group` 20 (between groups) · `--at-gap-group-lg` 24 (between groups in a card or wide column). Max content width `--at-content-max` 1200; reading measure `--at-measure` 68ch.

### 12.4 Radius
`--at-r-xs` 4 · `--at-r-sm` 8 · `--at-r-md` 12 · `--at-r-lg` 16 · `--at-r-xl` 20 · `--at-r-2xl` 28 · `--at-r-pill` 999. What each is for: §11.3. Radii do not change per breakpoint. Nested rule: inner = outer − padding, so an inner radius is always a smaller step of the same scale.

### 12.5 Type
Each role is one `font` shorthand token (weight, size/line-height, family), in rem so the user's browser font size scales everything (1rem = 16 px). Use `font: var(--at-type-body)`.

| Token | phone (< 600) | ≥ 600 | Weight |
|---|---|---|---|
| `--at-type-kicker` (+ `letter-spacing: .14em; text-transform: uppercase`) | 12/16 | 12/16 | 600 |
| `--at-type-caption` | 13/18 | 13/18 | 400 |
| `--at-type-small` | 14/20 | 14/20 | 400 |
| `--at-type-ui` | 15/22 | 15/22 | 500 |
| `--at-type-action` (primary action label) | 17/24 | 17/24 | 600 |
| `--at-type-body` | 16/26 | 16/26 | 400 |
| `--at-type-lead` | 18/28 | 18/28 | 400 |
| `--at-type-h3` | 20/28 | 20/28 | 600 |
| `--at-type-h2` | 24/32 | 28/36 | 600 |
| `--at-type-h1` (+ `letter-spacing: -.02em`) | 34/42 | 48/56 | 600 |
| `--at-type-price` | 40/48 | 48/56 | 600 |

Where §11.5 gives a weight range (caption and small 400–500, ui 500–600), the token carries the lower weight and the stronger one is set with `font-weight` after it (`--at-type-ui` + 600 for the pill, selected items and buttons). Two steps only: headings and prices grow at 600 px, and nothing else changes size between bands. This matches every board on the canvas: tablet and desktop share the large step. Display digits keep their face-specific sizes (§3) and scale with the face through container units, capped as in §3. Existing `--at-t-*` size primitives stay; `--at-t-xl` changes 22 → 20 (`h3`), since 22 is off the scale.

### 12.6 Control sizes and icons
`--at-h-control` 44 (chip, segmented item, icon button, small button) · `--at-h-input` 48 · `--at-h-button` 52 · `--at-h-primary` 60 (52 on screens ≤ 568 tall and landscape phones) · `--at-h-cook` 64 · `--at-h-header` 60 phone / 68 ≥ 600 · `--at-h-row` 56 (min-height of list rows). Icons `--at-icon-sm` 16 · `--at-icon-md` 20 · `--at-icon-lg` 24. Border `--at-border` 1px; focus ring 2px, offset 3px. Targets are never below 44 at any width.

### 12.7 Patterns (how every screen is put together)
- **Page:** header (`--at-h-header`) → main with `padding-inline: var(--at-gutter)`, `max-width: var(--at-content-max)`, sections separated by `--at-section` → footer. Same on every product.
- **Stack:** vertical `display: flex; flex-direction: column; gap:` a spacing token. Space comes from `gap` on the parent, never margins on the children. Margins are 0 except `margin-inline: auto` for centring.
- **Cluster:** a wrapping row (`flex-wrap: wrap; gap: var(--at-gap-item)`) for chips, tags and button rows; it wraps instead of overflowing at any width.
- **Grid:** `grid-template-columns: repeat(auto-fit, minmax(min(100%, <n>px), 1fr))` for card lists and tiles, so columns follow the width without breakpoints.
- **Two-column tool:** from 1024 the face column and the control column; the control column never goes below 400 px, and the face scales to the space left (see the 1024 board).
- **Dock (phone):** status and content on top; length block, 20 px gap, actions at the bottom, 20 px from the bottom edge.
- **Sheets and panels:** bottom sheet on phone; from 600 a side sheet, a centred dialog or a card docked in place (§6 dialogs, sheets and drawers); inline panel wherever a modal is not needed; padding `--at-card-pad`, 20 px below the last button.
- **Text:** `max-inline-size: var(--at-measure)` for paragraphs; `text-wrap: balance` on headings, `pretty` on paragraphs; long words and URLs break (`overflow-wrap: anywhere`) and never push the page wider.

### 12.8 Gates
- **Canvas:** every board, rendered with the real canvas runtime, follows §11 (radius, spacing, gap, type size and weight, control height, borders, colours, no nested cards) and has no empty board, overflow, dropped style or control within 12 px of an edge. The render and audit scripts that checked this were removed with the canvas sources; `docs/redesign/CANVASES.md` says how to restore them from git history.
- **Code:** a stylelint rule rejects raw px or rem for `padding`, `margin`, `gap`, `border-radius`, `font-size`, `line-height`, `height` of controls and `font` outside `tokens.css` (allowed: 0, 1px borders, percentages, `auto`). Plus the responsive sweep in §5 (every route, every 40 px from 320 to 2560). Both run in CI and block the release.
