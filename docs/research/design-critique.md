# AwakeTab design critique: director review of the "Clear Night" canvas

Date: 27 September 2026 · Scope: every board in `scratchpad/directions/project` (199 boards in `canvas.json` plus 49 unlisted source and edge boards: 248 renders) · Reviewer stance: design director, read-only (no `.dc.html` edited).

**Method.** Each board was rendered in Chromium with the canvas-format renderer (`dc-import` resolved recursively), screenshotted, and audited element by element: 28,833 visible elements, each with its computed font size, weight, line height, border widths and colours, radius, padding, gap, height, colours and a WCAG contrast estimate. Every value was checked against DESIGN.md §11. Tools and outputs are in `scratchpad/director/`: `render-all.mjs` (render and audit), `analyze.mjs` (the §11 checker), `violations.json` (every violation grouped by source file), `perboard.json`, `shots/` (one PNG per board) and `sheets/` (contact sheets). Motion was judged from the CSS classes and keyframes, not watched live.

---

## 1. Summary for the owner

- **Is it wow yet?** On the tool itself it is close. The phone Ring and Horizon screens, the desktop XL Ring, the Night kiosk clock and the extension popup look like one calm, expensive instrument. The status system (pill, glyph, ring pattern and header bead) is the best I have seen in this category. Across the whole product it is not wow yet. It reads as eight good designers working from the same mood board, not from one system.
- **What holds it back is drift, not taste.** The same primitives are rebuilt slightly differently in every file. I measured 18 different H1 sizes, 3 header heights (60, 64 and 72), 3 footers (one with different honest-line copy), primary buttons at 48, 52, 56, 60 and 64 px, and card radii of 14, 16, 18, 22 and 24. The main gaps in use, 10, 14, 6, 3 and 2 px, are all off the scale.
- **DESIGN.md contradicts itself, and that causes much of the drift.** §5 says "section rhythm 14 / 20 / 24" (14 is not on the §11 scale) and "cards 24" (§11.3 says 16). §6 sets a 38 px pill that §11.4 does not list. §3 sets a Bold digit weight of 650, which §11.5 forbids. The §11.4 segmented bar adds up to 54 px, not the stated 52. The fix agents copied the wrong line in good faith. Fix the spec first (diff in §6 of this document).
- **Typography is the weakest craft area.** Geist Mono's slashed zero turns every Ready state into "3Ø:ØØ" and the kiosk clock into "11:Ø1". It reads as a terminal, not a calm instrument. Mono is also used for meta text ("4 guides", "No limit · Cook mode", "$29 / year per site"), which cheapens it.
- **The honesty story is excellent and under-sold.** The GrowthFirstVisit "What just happened" receipt (asked, confirmed 0.4 s later, pill switched), the session timeline on Done, and "How AwakeTab knows" all turn the product's principle into something you can see. They sit in growth boards instead of being the default experience.
- **The Pro page is correct but long and flat.** It runs 7,540 px on a phone, with features listed before the story, and it is almost identical to the Pro Plan helper, which sells better. Sell the evening, not the list.
- **Five moves matter most:**
  1. **Fix the spec, then ship one shared primitives patch** (header, theme switch, pill, segmented bar, CTA, card, footer, kbd, tag) applied the same way in every file. This alone removes about 70 % of the measured drift.
  2. **Give the numerals one voice.** Display digits should use tabular sans (weight 200/300) or a mono without the slashed zero, and every digit surface (tool, kiosk, OG, store, popup) should use the same numeral style.
  3. **Make the lock moments signature moments.** On a real grant, show a one-time "ignition" from the CTA to the pill, the ring tip and the header bead. At the end, show a slow "lamp off" and the timeline receipt. Both are honest: they fire only on real engine events.
  4. **Promote the receipts into the core flow:** the first-visit receipt on /, the Done timeline at session end, and "How do we know?" next to the pill everywhere.
  5. **Rebuild /pro as one evening with AwakeTab**, with the live lamp-colour hero recolouring the page, the plan helper inline, and 30 % less length.
- **Accessibility is mostly strong.** The A11y focus-order board is exemplary. It still needs fixes for 1 real contrast failure (library line numbers, 2.32:1), about 60 text runs under 12 px, 50 %-opacity Pro-locked controls in extension settings, and one notice that covers the primary CTA (SysProLapsed).
- **Canvas hygiene:** HomeBelowPhone renders 9,120 px tall on an 8,000 px board (the bottom 1,120 px is cut off). PageChangelogPhone renders 8,024 px. The Page404 and PageChangelog "play me" boards are 390 px wide but render the 1,280 px desktop layout. OgDevice wraps "24" and ":18" onto two lines. GuideOn and GuideVs desktop comparison tables render empty in a static render, so check them in the live canvas.

---

## 2. Scored critique

### 2.1 By dimension (whole product)

| Dimension | Score | Why |
|---|---|---|
| Brand distinctiveness | 7 | The ring and lamp bead mark as a status light is ownable, and Horizon and Tide are genuinely distinctive. But navy, Geist and cyan glow is also the default "premium dark SaaS" look, and nothing yet says AwakeTab without the logo. |
| Visual hierarchy | 8 | The tool is textbook: status, then time, then primary control, then options, with the phone dock in the thumb zone. Content and Pro pages flatten into long even columns where every H2 has the same weight. |
| Typography | 5 | 18 H1 sizes, H2 at 24/26/27/28/30/32/38/44, lead at 19/21, labels at 10/11/11.5/12.5/13.5, slashed zeros on display digits, and mono used for prose meta. |
| Spacing rhythm | 5 | Gaps of 10 (more than 300 uses in Main alone), 14, 6, 3 and 2. Section gaps of 44/52/56/72/88/120 against a spec of 48/64/96. Desktop gutters of 20 (tool), 56 (content) and 72–96 (Growth/Sys) against a spec of 80. |
| System consistency | 5 | The primitives are copied, not shared. Header 60/64/72, three footers, CTA 48–64, theme switch padding 3, pill padding 17/13, and 24-radius cards everywhere against a 16 spec. |
| Colour and light | 8 | The lamp glow, the radial lift and the Horizon skies are beautiful, and the light theme uses the corrected AA teal. Recurring off-token neutrals (#26324B, #0D131F/#0D1320, #F6F9FC/#F7F9FC, #070A11) and a Night palette that sits outside the system need tokens. The Brand board still documents old hex values (#0B0F17 as ground, #121826 as surface, #0A9AA6). |
| Motion quality | 7 | The principles and classes are right: quint ease-out, a 16 s sweep, a 3.4 s halo, reduced-motion kills everything. There is no signature event yet, and everything loops at the same "ambient" register, so starting a session feels no different from a clock ticking. |
| Clarity of status and honesty | 9 | The seven states carry glyph, text, ring pattern and bead. The extension's "System awake / Screen may dim or lock" is exemplary. The badge board and tab-strip board extend the truth to every surface. |
| Interaction and ergonomics | 8 | One-tap phone dock, inline panels instead of modals, 64 px cook targets. Deductions: presets at 46 px, a notice covering the CTA in SysProLapsed, and popup chips scaling to 40–41 px in marketing previews. |
| Content and copy | 8 | Plain, specific and honest ("Nothing here is a guess dressed up as a fact."). Em dashes are creeping into new copy (Kiosk "Welcome — please ring the bell", the extension hero "— or just the computer —", "You're offline — the tool works", /kiosk "— no install", ProActivate errors). The guides are dense. |
| Delight | 6 | Horizon setting exactly at session end is a genuinely delightful idea, and Done "Session complete 28 min" with the timeline is lovely. There is no first-five-seconds moment and no start or end ritual on the default Ring face. |
| Persuasion and sell-ability | 6 | Pricing is honest and clear and the refund line builds trust. The lamp-preview Pro moment and the Plan helper sell well. The /pro page itself leads with a list, repeats "Get Pro" twice at equal weight, and hides the story below the fold. |
| Accessibility craft | 7 | The focus-order board, arrow-key composites, visible 2 px focus and forced-colour-safe patterns are strong. Remaining: about 60 text runs under 12 px, library line numbers at 2.32:1, Pro-locked settings at 50 % opacity (2.4–3.4:1), a kbd hint at 4.4:1, and "How to fix" at 4.42:1. |

### 2.2 By surface

Scores run 0–10. Columns: Br = brand, Hi = hierarchy, Ty = type, Sp = spacing, Sy = system, Co = colour, Mo = motion, St = status, In = interaction, Cp = copy, De = delight, Se = sell, A11y = accessibility.

| Surface (boards) | Br | Hi | Ty | Sp | Sy | Co | Mo | St | In | Cp | De | Se | A11y | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Tool: phone (Main, Ring/Bold/Horizon/Tide/Paused/Blocked/Done/Until ×2, Size*, Edge*, Intl, Sys, Tool*) | 8 | 9 | 6 | 7 | 7 | 9 | 8 | 10 | 9 | 9 | 7 | 7 | 8 | The hero of the product. Fix the slashed zeros, 46 px presets and gap-10 drift, then add a start and end ritual. |
| Tool: tablet (ToolTablet*, SizeTabletLandscape) | 8 | 8 | 6 | 6 | 7 | 9 | 8 | 10 | 8 | 9 | 7 | 6 | 8 | The landscape Horizon composition is the best tablet layout. Portrait floats in empty space above the dock. |
| Tool: desktop and XL (Desk*, SizeXL, EdgeLongNoLimit, EdgeReturn) | 8 | 8 | 6 | 6 | 6 | 9 | 8 | 10 | 8 | 9 | 7 | 6 | 8 | Header is 60 with a 20 px gutter where the spec says 68 and 80. The face tabs sit last in the right column, which the A11y board correctly flags. |
| Ambient (Ambient*, Pip*) | 8 | 8 | 6 | 6 | 5 | 7 | 7 | 9 | 8 | 8 | 7 | 6 | 7 | Clock and Cook are strong. Night uses an off-system warm palette. The 180 tick marks are 1.5 px wide with 1 px radius (not tokens). PiP radius is 10/14. |
| Content pages (ContentArticle*, HubFor*, HomeBelow*, Guide*, Preset*, Until*) | 6 | 7 | 5 | 5 | 5 | 8 | 6 | 9 | 7 | 8 | 5 | 6 | 7 | Credible and readable, but long and uniform, with mono meta everywhere. HomeBelow has its own footer copy and a clipped phone board. |
| Pro (Pro*, ProActivate*, ProManage*, Growth Plan/ProMoment, SysProLapsed, SysCheckout*) | 7 | 6 | 5 | 5 | 5 | 8 | 6 | 9 | 7 | 8 | 6 | 6 | 7 | The lamp-colour hero is the right idea. The page is too long, has 84 px H1s and 24-radius cards, and is weaker than the Plan helper. |
| Extension (ExtPopup*, ExtOptions*, ExtBadges, ExtEdge*, Welcome*, PageExtension*, Store*) | 8 | 9 | 6 | 6 | 6 | 8 | 7 | 10 | 8 | 9 | 7 | 7 | 6 | The popup is excellent. The options page has 24-radius cards, a 72 px header, 3 px keycap borders and 50 %-opacity locked Pro controls. |
| Embed (Embed*, EmbedEdge*, EmbedCook*) | 7 | 8 | 5 | 5 | 6 | 7 | 6 | 9 | 7 | 8 | 6 | 7 | 6 | The honest "Blocked — here's the fix" inside a host page is a great sales asset. Type is 11–12.5 px and the timer tap target is 40 px. |
| Kiosk, library and other (Kiosk*, Page*, Og*, IconSet, Brand, A11y) | 7 | 8 | 5 | 5 | 5 | 8 | 6 | 9 | 7 | 8 | 6 | 7 | 7 | KioskTv screens are striking but have slashed zeros. The library live state machine is a delight for developers. Brand is out of date. OgDevice layout is broken. |

---

## 3. System drift report against DESIGN.md §11

Legend: "×n" is the number of rendered elements across all boards. "Current" is the computed value measured in Chromium. Wrapper boards (RingDark, DeskRingLight, ContentArticlePhoneDark and similar) inherit from their source file, so fix the source.

### 3.1 Systemic drift: shared primitives copied into every file

Apply these once, identically, in every file that carries them. In the table, "P-" marks a shared primitive.

| ID | Primitive (search snippet) | Files | Current | Required |
|---|---|---|---|---|
| P1 | Logo lockup `<a …>AwakeTab` `gap: 10px` | all with a header | gap 10 | gap 8 |
| P2 | Theme switch `role="radiogroup" aria-label="Theme"` `padding: 3px` | all with a header | padding 3, total 52, indicator `left:3px;top:3px` | padding 4, 1 px `line` border, items 44, total 54, indicator `left:4px;top:4px` |
| P3 | Theme or segment indicator `background: #26324B` | Main, Extras, ExtPopup, ExtOptions, all pages ×100+ | off-token #26324B | new token `--at-raised` (dark #26324B, light #E3E9F1), or per §11.2 selected = lamp 14 % fill + lamp 45 % border |
| P4 | Status pill `<output …>` `padding: 0 17px 0 13px; gap: 10px` | Main, Extras, Ambient, ContentArticle, HubFor, Guide*, Growth*, Page404, PageLibrary | padding 0 17 0 13, gap 10 | padding 0 16 0 12, gap 8, height 38 (see the §11.4 addition) |
| P5 | Extension or embed pill `gap: 9px`/`7px`, `padding: 0 14px 0 11px` / `0 11px 0 9px` / `0 13px 0 11px` | ExtPopup, ExtEdge, EmbedWidget, EmbedCook, EmbedEdge, KioskScreen | gap 7/9, padding 11/13/9 | S pill 32: padding 0 12 0 8, gap 8. XS pill 26 (compact embed): padding 0 8, gap 4 |
| P6 | Preset or length segmented `presetH: 46` (Main `BASE_GEO`) | Main (every tool board, Size*, Edge*, Growth*, Guide*, Preset*) ×230 | 46 | 44 (48 is allowed only at tabletLandscape and xl if the spec adds it; otherwise 44) |
| P7 | Header height `hdrH`/`height: 64px`/`72px` | Main desktop 60, content Page*/Guide*/HubFor*/ContentArticle* 64, ExtOptions/EmbedShowcase/Welcome 72 | 60 / 64 / 72 | 60 on phone, 68 on tablet and up (Main `desktop` and `tablet` geo must set `hdrH: 68`) |
| P8 | Header gutter `hdrPad: '0 12px 0 20px'`, `padding: 0 56px` | Main desktop, all Page*, HubFor, ContentArticle, Guide* | 20 (tool desktop), 56 (pages) | phone 16, tablet 32, desktop 80, xl 120 (§11.1) |
| P9 | Footer | HomeBelow ("No ads on this screen, now or later." with About first), Pro (links only, no honest line), ProActivate/ProManage (none) | 3 variants | one footer: "No ads on the awake screen, now or later." · Privacy · Terms · Changelog · About · Buy me a coffee, `border-top` 1 px `line`, padding 24/32 |
| P10 | Primary CTA height and radius | Pro 56/r20, PageExtension 56, Extras resume 56, PageKiosk 52/r18, PageLibrary 52/r18, EmbedEdge 52/r16, ExtOptions 48/r16, Growth "Get Pro" 56 | 48–64 | primary 60/r20. Medium 52/r20. Small 44/r12. Cook 64/r20 |
| P11 | Card radius `border-radius: 24px` | ContentArticle, HomeBelow table, ExtOptions, Pro figures, ProActivate form, ProManage list, PageExtension tables, PageKiosk table, PageLibrary table, Growth asides, Guide step cards, GuideVs rows (22) | 24 (also 22, 18) | 16 for cards and list containers. 28 only for faces and hero panels (the embedded tool card may be 28) |
| P12 | Small button and input radius `border-radius: 14px` | Pro inputs and day buttons ×66, ExtOptions ×71, ProManage "Remove", PageKiosk inputs/Copy, PageLibrary Copy/select, ExtPopup "+15 min", PipWindow, EmbedWidget timers, EmbedShowcase Copy | 14 | inputs 8. Icon or small buttons (44) 12. Chips 999 |
| P13 | `<kbd>` | Main (r6, pad 2/7), Extras (r9, 2 px border), HomeBelow (2 px), ExtOptions (3 px bottom, r10), Welcome (r?, 64 tall) | r6/9/10, 2–3 px borders | r8, 1 px `line-strong`, padding 0 8, height 24 (inline) or 32, 12/16 mono |
| P14 | Non-interactive tag ("Pro", "Free", "Kiosk licence", "Release", "Sample data", "Proposed") | Main 10–11 px, Pro 11 px/600, ExtOptions 11–12 px/700, PageChangelog 700, PageExtension 10 px/700 | 10–11 px, weight 700 | new `tag`: height 24, 12/16, weight 600, r999, padding 0 8, 1 px `line-strong` |
| P15 | Scrim `rgba(3,5,10,0.62)` | Main, Extras, Growth sheets | off-token | `rgba(4,7,12,.55)` (§11.6) |
| P16 | Recessed well (code, timers, URL output, popup inner) `#0D131F` / `#0D1320` / `#F6F9FC` / `#F7F9FC` | ExtOptions, EmbedShowcase, EmbedWidget, PageLibrary, PageKiosk, PageExtension, GuideLearn, Pro input, Growth | 4 near-duplicates | new token `--at-sunken` (dark #0D131F, light #F6F9FC) |
| P17 | FAQ row `min-height: 60px; padding: 14px 2px` | ContentArticle, HomeBelow, Guide*, Pro | 62–76 tall, padding 14/2 | list row: min 56, padding 16 0 (on scale). The toggle icon is a 44 target |
| P18 | Honest-limit note `padding: 18px 20px; column-gap: 14px` | ContentArticle, Guide*, Preset*, Until*, Page* | pad 18/20, gap 14 | card: padding 20 (phone) / 24, gap 12, r16 |

### 3.2 Per-file violations (executable)

Batch 1 files come first, then batch 2. The snippet is the unique inline-style fragment to search for.

| File | Selector / snippet | Current | Required |
|---|---|---|---|
| Main | `presetH: 46` in `BASE_GEO` | 46 | 44 |
| Main | `desktop: { W: 1280 …}` / `tablet: {…}` geo lacks `hdrH` | header 60, pad `0 12px 0 20px` | `hdrH: 68`, pad `0 80px` (desktop), `0 32px` (tablet) |
| Main | Face card `padding: 14px 16px 20px 16px` (×36) | 14/16/20/16 | 16 all round, or 12/16/20/16 |
| Main | Settings rows `button role=switch min-height: 56px; padding: 6px 0` | 56, pad 6 | row min 56 is fine; padding 8 0 |
| Main | Settings sections `gap: 18px` / `gap: 30px` / `gap: 28px` | 18/30/28 | 20 inside and 32 between groups |
| Main | Settings row text `gap: 2px` (×23) | 2 | 4 |
| Main | Lamp swatch `button role=radio min-height: 92px; padding: 20px 4px 10px 4px; border: 2px` | 2 px border, pad 20/4/10 | 1 px lamp 45 % border + lamp 14 % fill (§11.2 selected). Padding 12. Height 88 or 96 |
| Main | "Reset to defaults" `height: 52px; border-radius: 18px` | r18 | r20 |
| Main | Stats heatmap cell `border-radius: 5px`, row label `font-size: 11px`, streak dots `font-size: 8px` | r5, 11 px, 8 px | r4 (a new `micro` radius, see §6) or 8. Labels 12. Replace the 8 px dot glyphs with drawn dots and an `aria-label` |
| Main | Until panel slot sub-label `today` / `tomorrow` `font-size: 11px` | 11 | 12 |
| Main | Pro tag in settings `font-size: 10px; padding: 1px 6px` | 10 | tag (P14) |
| Main | Stats `<dd>` `font-family: Geist Mono; font-size: 22px; font-weight: 300` "2 h 9 min" | mono 22/300 on mixed text | digits only in mono. Use sans 24/600 with the units at 15 (`ui`) |
| Main | Horizon digits `color: #F6F2EA` | off-token | token `--at-horizon-ink` |
| Main | Settings side sheet `border-inline-start` only | 1 px side edge | allowed for sheets. Document it in §11.6 (sheet edge) |
| Main | Ready digits "30:00" in Geist Mono (slashed zero) | "3Ø:ØØ" | see §6 display digits: no slashed zero |
| Main | Low-battery "15%" / "Stop at" disabled at `opacity:.45` | 2.95:1 (light) | disabled may skip contrast, but prefer a lock or explanatory note at full contrast |
| Extras | Resume and second-tab actions `height: 56px` | 56 | 60 primary / 52 secondary |
| Extras | Sections `padding: 18px; border-radius: 24px` | 18, r24 | 20, r16 |
| Extras | Toast `padding: 6px 6px 6px 16px; border-radius: 18px` | 6/16, r18 | height 52: padding 4 4 4 16, r999 (pill toast) or r16 |
| Extras | kbd in the shortcuts overlay `border: 2px; border-radius: 9px; padding: 0 9px` | 2 px, r9 | P13 |
| Extras | Rating star button `border-radius: 14px` | r14 | r12 |
| Extras | Install icon tile `border-radius: 10px`, `background: #0D1320` | r10 | r12, `--at-sunken` |
| Ambient | Mode bar `padding: 12px 40px 22px 40px` | 12/40/22 | 12/40/24 |
| Ambient | Exit link `padding: 0 18px` | 18 | 16 |
| Ambient | Mode segmented items `font-size: 12.5px` | 12.5 | 13 (caption) or 14 |
| Ambient | Clock date `font-size: 26px`, "Tap anywhere to pause" 22, "left" 11 px | 26/22/11 | 24 / 20 / 12 |
| Ambient | Clock ticks `width: 1.5px; border-radius: 1px; background: #46557A / #98A5B8` (×180) | off-token, r1 | `--at-tick` / `--at-muted`, width 2, r999 |
| Ambient | Night palette `#FF5A3C`, `#E8563C`, `#E9DDD8`, `#CDBDB7`, `#A89690`, border `#3A2E2A` | off-token | a documented Night token set (§6 addition). Check AA of the red digits on #000 (#FF5A3C ≈ 6.0:1, which passes) |
| Ambient | Cook timer row `padding: 12px 12px 14px 18px; border-radius: 24px` | r24, pad 18 | r16, padding 12 16 |
| Ambient | "Pro" tag `font-weight: 700` | 700 | 600 |
| Ambient | Pause glyph `border: 2px` | 2 px | drawn SVG glyph (as in the pill) |
| PipWindow / PipDark / PipLight | Window `border-radius: 10px`, buttons `border-radius: 14px`, `padding: 12px 12px 12px 14px`, `gap: 6px` | r10/14, pad 14, gap 6 | window r12 (OS), buttons r12, padding 12, gap 8 |
| PipOverDesk | Spreadsheet placeholder colours `#1E2633`, `#6A7587` | off-token | fine as a "foreign app" placeholder. Mark it `data-placeholder`; no fix required |
| ContentArticle | H1 `font-size: 36px` (phone) / 48 (tablet) / 56 (desktop) | 36/48/56 | 34 / 48 / 48 |
| ContentArticle | Lead `font-size: 19px` / `21px` | 19/21 | 18/28 |
| ContentArticle | Pull quote `<blockquote> font-size: 27px` | 27 | 28/36 |
| ContentArticle | Checklist row `button role=checkbox padding: 13px 14px; border-radius: 18px; gap: 14px` | 13/14, r18, gap 14 | these are rows inside a card, so use no radius and dividers (no nested card). Padding 12 16, gap 12 |
| ContentArticle | Checklist container `border-radius: 24px` | r24 | r16 |
| ContentArticle | Inline code `font-size: 0.86em; padding: 2px 6px; border-radius: 6px` | 14.62/15.48 px, r6 | 14 px fixed, padding 2 6 → 0 4 (4 grid), r8 → inline code r4 (see §6) |
| ContentArticle | "Advertisement" label `font-size: 11px` | 11 | 12 kicker |
| ContentArticle | Embedded tool `Elapsed` button `padding: 4px 8px; margin-inline: -8px` | 106 tall | fine. Label it as a 64 px cook target in the spec |
| ContentArticle | Remove-timer button `width: 40px; height: 42px` | 40×42 | 44×44 |
| ContentArticle | "Start this session" link `height: 50` | 50 | 52 |
| ContentArticle | Mono "2 of 6 checked", "336 × 280" | mono text | sans caption 13 (`tabular-nums`) |
| HubFor | Guide rows `padding: 16px 10px` (×54), meta row mono 13 (×66) | pad 10, mono | padding 16 0 (align to text column). Meta in sans caption 13 with `tabular-nums` |
| HubFor | H1 36 (phone) / 52 (desktop), group titles `font-size: 19px` | 36/52/19 | 34/48, H3 20 |
| HubFor | Section `gap: 14px`, `gap: 52px`, `gap: 44px`, grid `gap: 88px` | off-scale | 12 / 48 / 48 / 96 |
| HubFor | Try-it card `border-radius: 24px; padding: 18px 18px 20px` | r24, 18 | r16 (or r28 as a hero panel), 20 |
| HomeBelow | Footer text "No ads on this screen, now or later." | different copy | P9 |
| HomeBelow | Board height: HomeBelowPhone renders 9,120 on an 8,000 board | clipped by 1,120 | split into Top and End boards (HomeBelowPhoneEnd exists, so trim the first) |
| HomeBelow | H2 `font-size: 27px` (phone) / `32px` (desktop), H3 19, intro 21/500 | 27/32/19/21 | 24/28, H3 20, lead 18/400 |
| HomeBelow | Guide links `padding: 6px 10px; border-radius: 14px` (×57) | pad 6/10, r14 | rows: padding 12 0, no radius, or chips r999 with 44 height |
| HomeBelow | State list `<dt>` pill `height: 34px; padding: 0 14px 0 11px; gap: 9px` | 34 | pill S 32, padding 0 12 0 8, gap 8 |
| HomeBelow | Sections `padding: 72px 0` | 72 | 96 desktop / 48 phone |
| HomeBelow | Table and author card `border-radius: 24px` | r24 | r16 |
| HomeBelow | kbd `border: 2px` | 2 px | P13 |
| HomeBelow | Support table row `padding: 14px 16px` / `14px 20px`, cell `gap: 3px` | 14, gap 3 | 12 16 / 16 20, gap 4 |
| Size* (via Main) | SizeSmall presets `presetH: 44`, CTA `ctaH: 52` | 52 | 60 is the primary action. If 568 px height forbids it, document "small: 52" in the spec |
| Size* | SizeLandscape `hdrH: 52` | 52 | 60 (or document 52 for landscape phones) |
| Edge* | EdgeMultiDay chip "1 day 2 h" dashed while selected | dashed as a state | dashed only for "choose/add". Selected = lamp 14 % + 45 % border, solid |
| Edge* | EdgeOffline toast "You're offline — the tool works" | em dash in new copy | "You're offline. The tool still works; guides may not load." |
| Intl | "Bis…" / "Benutzerdefiniert…" dashed chips, 8 px padding | pad 8/16 OK | OK. Check that "Benutzerdefiniert…" fits at 320 px |
| A11y | Order badges `font-size: 11px` (×40), list `padding: 2px 8px 2px 4px` | 11, pad 2/4 | 12, padding 4 8 |
| A11y | Tabs `min-height: 38` | 38 | 44 |
| Guide* | Step card with screenshot `figure` inside (`border-radius: 22px` inside r24) | nested card | a figure without a border inside the step, or a two-column row without an outer card |
| Guide* | Screenshot label `font-size: 11px`, dashed figure border (×20) | 11, dashed | 12. Dashed placeholder is acceptable in mocks only; label it `data-placeholder` |
| Guide* | Breadcrumb path chips `padding: 5px 10px; border-radius: 10px`, mono 13 | 5/10, r10 | padding 4 8, r8 (code) |
| Guide* | Result badge `padding: 3px 12px 3px 10px` ("Works", "Blocked") | 3/12/10 | tag P14 (24 tall, 0 8) |
| GuideGuides | Step rail `width: 2px` line, check circle `border: 2px`, progress `height: 6px` r99 | 2 px | 1 px line. Circle: filled lamp when done, 1 px `line-strong` when not. r999 |
| GuideGuides | Checkbox `border-radius: 7px`, 22 px box | r7 | 24 box, r8 |
| GuideLearn | Code line numbers `color: #5E6A80` / `#8A95A6`, `font-size: 13.5px` (×282) | off-token, 13.5 | `--at-muted` (≥4.5:1), 13 or 14 |
| GuideVs | Row cards `border-radius: 22px` | r22 | r16 |
| GuideOn / GuideVs (desktop) | Comparison table renders empty in static render | empty | verify in the live canvas. If `sc-for` sits directly inside `<table>`, move it to `role="table"` div rows (the phone variant works) |
| Preset* / Until* | H1 30/40, route mono 12/12.5, "Nearby times" H2 21, time tiles `height 99` mono 22 | off-scale | H1 34/48, H2 24/28. Tiles as list rows (56) or cards r16 with sans digits |
| Until* | "Pick a length" dashed chip | OK (choose affordance) | OK |
| Pro | H1 84 (desktop) / 60 (tablet) / 48 (phone). H2 32/38/44 | off-scale | H1 48 / 34 phone. H2 28 / 24 phone |
| Pro | Price suffix `/ year` 22, figure padding 14, `gap: 28px`, `gap: 14px` (×96) | off-scale | 20, 16, 32/24, 12/16 |
| Pro | Lamp swatch `height: 76px; border-radius: 18px` | 76, r18 | the selectable tile r16, height 80 (on the 4 grid). This is a large selectable card, so document it |
| Pro | Figures (Message, Schedule) `border-radius: 24px` containing r16/r14 panels | nested cards | the figure has no border (image well `--at-sunken` r28 as a hero panel) and the inner panel r16 |
| Pro | Heatmap `border-radius: 5px` (×504), labels 11 px | r5, 11 | r4 micro (spec addition), 12 |
| Pro | "Get Pro" `height: 56px` (both plans) | 56, and both CTAs strong | lifetime primary 60. Yearly secondary 52 (outline). Only one lamp fill per viewport |
| Pro | Embed/Kiosk prices in Geist Mono 15 | mono prose | sans 15 `tabular-nums` |
| Pro | Footer has no honest line | missing | P9 |
| ProActivate | H1 40 (phone) / 56 (desktop), lead 19, card H2 22, form r24 pad 28 | off-scale | 34/48, 18, 20, r16 pad 24 |
| ProActivate | Error list `padding: 12px 14px; border-radius: 14px` | 14 | 12 16, r16 or rows |
| ProActivate | Error copy "retry in a minute", "You're offline — try again when connected." | em dashes | "Your purchase is still syncing. Try again in a minute." / "You're offline. Try again when you're connected." |
| ProManage | "Remove" `color: #FF9A9A; border-radius: 14px; padding: 0 18px` | off-token, r14 | `--at-bad` text + `line-strong` border, r12, padding 0 16 |
| ProManage | Device meter segments `height: 10px; border-radius: 99px` | r99 | r999 |
| ProManage | Empty state dashed card | decorative dashed | solid `line` card r16 |
| ExtPopup | Length block card inside the popup frame (r16 inside r22/r16) | nested card | segmented bar style (r999 rows) or no border, divider only |
| ExtPopup | Timer `font-size: 23px; weight 300` (hours variant) | 23 | 24 |
| ExtPopup | Status caption `font-size: 12.5px` | 12.5 | 13 |
| ExtPopup | Brand `gap: 9px`, footer `gap: 2px; padding-top: 10px`, add-time `gap: 6px` | off-scale | 8, 4, 12, 8 |
| ExtPopup | "+15 min" `border-radius: 14px` | r14 | r12 (44 small) |
| ExtOptions | Header 72, nav items `padding: 0 14px; border-radius: 14px` | 72, r14 | 68, padding 0 16, r12 |
| ExtOptions | Cards `border-radius: 24px; padding: 20px 28px / 24px 28px` (×30) | r24, 28 | r16, padding 20 24 / 24 |
| ExtOptions | kbd `border: 3px` bottom, r10, `padding: 0 10px` | 3 px | P13 |
| ExtOptions | Radio circles `border: 2px` | 2 px | 1 px `line-strong`, selected = lamp dot |
| ExtOptions | Screen/System cards `height: 104`, `padding: 18px`, `background: #0D131F`/`#F6F9FC` | off-scale | padding 20, `--at-sunken`, r16 |
| ExtOptions | Segmented `height: 38px` (Screen/System in the schedule form) | 38 | 44 |
| ExtOptions | H1 36, H2 22 | off-scale | 34/48, 24 |
| ExtOptions | Pro-locked controls `opacity: .5` in light | 2.4–3.4:1 | full contrast plus a lock icon and "Pro" tag. Disable input, not legibility |
| ExtOptions | Schedule bars `border-radius: 10px/4px/3px`, dashed "new" block | r10/4/3 | r8 bars, r4 micro legend. Dashed OK (add affordance) |
| ExtOptions | "Saved" toast `opacity: 0` in static state | invisible | fine (transient) |
| ExtOptions | Switch off-knob `rgba(16,16,16,.3)` | off-token | `--at-muted` |
| ExtBadges | Toolbar mock colours `#F1F3F6`, `#2A2D33`, `#D5DAE1`, `#40454E` | off-token | fine as Chrome chrome (foreign UI). Mark `data-placeholder` |
| ExtBadges | Badge text 11.5 px / 700, legend 12.5 | 11.5/700 | badge text is rendered by Chrome at its own size (note it). Legend 13 |
| ExtBadges | Tiles `border-radius: 14px`, sample icon r11 | r14/r11 | r12 |
| ExtEdge* | Timer 23 px, caption 12.5, "Edit" `font-size: 13.5px`, r14 | off-scale | 24, 13, 14, r12 |
| ExtEdge* | Schedule section `padding: 6px 6px 6px 14px` | off-scale | 8 8 8 16 |
| Welcome* | Section `padding: 0 80px 96px` (OK), kbd 64×64 `padding: 0 18px`, "ON" tag `padding: 0 7px; r8` | kbd 18, tag 7 | kbd padding 0 16. Tag P14 |
| Welcome* | Illustration borders `5px`, r3, dashed icon ring | 5 px | drawn SVG strokes 1.5–2 in illustration (exempt if `aria-hidden` art). Document an "illustration" exemption |
| Welcome* | Nested cards (popup mock in browser mock) | 3 levels | acceptable for device mocks. Flatten the explanatory cards |
| Embed* (EmbedWidget, EmbedCook) | Compact timer button `height: 40px` | 40 | 44 (grow the region to 100 or drop the timer label) |
| Embed* | Remove-timer `height: 42px` | 42 | 44 |
| Embed* | Quick-add chips `font-size: 12.5px`, dashed | 12.5 | 13, dashed OK (add affordance) |
| Embed* | Attribution "Keep awake by AwakeTab" `font-size: 11px` | 11 | 12 |
| Embed* | Timer 26 px / 300 | 26 | 24 or 28 display (declare `display-s` 28) |
| Embed* | Widget `border-radius: 22px`, rows r14, `background: #0D131F` | r22/14 | r16 (compact) / r28 (full), rows r12, `--at-sunken` |
| Embed* | Region `padding: 10px 12px 8px 14px` / `18px 22px 14px 22px` | off-scale | 8 12 8 16 / 16 24 |
| Embed* | Timers column `border-inline-start` divider | side rule | a vertical divider is fine; document "column divider 1 px `line`" |
| EmbedShowcase | Snippet code `font-size: 13.5px`, H2 26, host colours #22201C/#3D3A33 | 13.5/26 | 13 or 14, 28. Host colours OK (foreign page) |
| EmbedShowcase | Segmented items `padding: 0 6px` | 6 | 8 |
| EmbedEdge* | "How to fix" link 4.42:1 on the bad-tint note | fails AA | `--at-bad` text on the 8 % tint, or ink |
| EmbedEdge* | Notice card r12 inside widget r16 inside host r18 | nested | notice as a full-width tinted row, no border |
| KioskScreen / KioskTv* | Clock digits in Geist Mono (slashed zero "11:Ø1") | Ø | §6 display digits |
| KioskScreen | Pill 76 tall / 34 px / 2 px border | 2 px, 76 | pill L 64: 1 px border, 24 px text (define in spec) |
| KioskScreen | Logo placeholder `border: 2px dashed; r32` | 2 px dashed, r32 | 1 px dashed (placeholder), r28 |
| KioskScreen | Minute ticks `width: 3px; border-radius: 2px` | r2 | r999 |
| KioskScreen | Date 40/44, since-line 30/32 | off-scale | TV scale: declare `tv-meta 32` and `tv-date 40` or use ×2 of the scale (28→56?). Document the TV scale |
| KioskPortraitLogo | 160 px empty space below the date; the logo slot is empty and dashed on the live screen | composition | centre the stack vertically. On a live kiosk, never show the empty dashed logo slot |
| PageKiosk | H1 36/56, H2 30, prices 40, lead 21 | off-scale | 34/48, 28, 48 display-price (declare) or 34, 18 |
| PageKiosk | Buy buttons 52/r18, inputs r14 | r18/r14 | 60/r20 primary, 52/r20 secondary. Inputs r8 |
| PageKiosk | Table rows `padding: 14px 24px`, cell `gap: 3px`, param `code` 12.5 | off-scale | 12 24 / 16 24, gap 4, 13 |
| PageKiosk | Mono URL `span` (×33) | mono | OK (URL) |
| PageKiosk | Copy "keeps the display on … — no install, no account", "Welcome — please ring the bell" | em dashes | "No install, no account." / "Welcome. Please ring the bell." |
| PageLibrary | Code line numbers `color: #46516A` | 2.32:1, fails | `--at-muted` |
| PageLibrary | State nodes `li` r16 inside the r28 card; edge labels 11.5 mono, r6 | nested, 11.5 | nodes as pills (r999, no card). Labels 12 |
| PageLibrary | Request/Release `height: 52px; border-radius: 18px`; "Simulate" disabled at .45 | r18, 4.06:1 | r20. Disabled state label with an explanation line |
| PageLibrary | Code panel r22, table r24 | r22/24 | r16 |
| PageLibrary | Header `padding: 0 56px`, main `40px 56px` | 56 | 80 |
| PageExtension | Hero "Add to Chrome" 56, H2 30, lead 21, H3 19, "ON" badge 10 px/700 | off-scale | 60, 28, 18, 20, tag P14 |
| PageExtension | Hero copy "— or just the computer —" | em dashes | "…to keep the display awake, or just the computer, so it keeps working…" |
| PageExtension | Preview popup scaled to 0.92 (targets 40–41) | <44 | render the popup at 1:1 or mark it `aria-hidden` and `inert` (a picture, not controls) |
| PageAbout | State tiles `li` r18 `padding: 14px 14px 12px`, principles `padding: 22px 0`, grid `gap: 88px`/`72px` | off-scale | r16, 16; 24 0; 96/64 |
| PageAbout | H2 30, H3 19, lead 21 | off-scale | 28, 20, 18 |
| PageLegal | TOC active `border-inline-start: 2px` (×17) | side stripe, 2 px | active = ink 600 + lamp dot (as in ContentArticle TOC) |
| PageLegal | Inline code `0.86em` (14.62/12.9 px), r6 (×98) | off-scale | 14 px, r4 |
| PageLegal | Storage-key rows `padding: 14px 0` | 14 | 12 or 16 |
| PageLegal | "In short" note `padding: 14px 18px` | off-scale | 16 20 |
| PageChangelog | Board PageChangelogPhone renders 8,024 on 8,000 | clipped | trim or split |
| PageChangelog | Release card: `dl` r18 inside r28 card | nested | `dl` rows with dividers inside the release panel, no inner card |
| PageChangelog | Tag chips `height: 26px; padding: 0 10px 0 8px`, "Release" 700 | 26, 700 | tag P14 (24, 600) |
| PageChangelog | Timeline dots `border: 2px` | 2 px | 1.5 px SVG ring or 1 px |
| PageChangelog | Filter segmented `height: 46px; gap: 6px` | 46 | 44, gap 0 (single indicator) |
| PageChangelog | "1.0 — launch" H2 30 | em dash, 30 | "1.0 launch" 28 |
| Page404 / Page404Desk | "play me" board is 390 wide but renders the desktop 1280 layout | wrong default | set the `layout` default to `phone` on the 390 board |
| Page404 | Night mini face digits `#F6F2EA`, captions 12.5 | off-token, 12.5 | `--at-horizon-ink`, 13 |
| Page404 | Guide rows `padding: 8px 2px`, route mono 12.5 | off-scale | 12 0, 13 |
| Page404 | CTA text on lamp at 0.9 opacity (4.37:1) | fails | full opacity |
| OgCards / Og* | Card `padding: 64px 64px 64px 80px` | asymmetric | 64 all round or 80 all round |
| OgDevice | iPad digits wrap to "24" over ":18" | broken layout | `white-space: nowrap`, reduce size |
| OgCards | Body 27/30/22/19 | off-scale | OG scale (1200×630): kicker 20, title 64, body 28, url 22 (declare) |
| StoreAssets / Store* | Browser mock colours `#171D29`, `#0E131C`, `#222B3C` | off-token | tokens (surface/sunken) |
| StoreMarquee | Popup overlaps the ring glow, ring cut at the right edge | composition | keep the ring fully inside or clearly bleeding. Do not collide with the popup chrome |
| IconSet | Tile radii 4/7/11/21 | platform-derived | exempt (icon grid). Document it |
| IconSet | Swatch dark tile `#262D3A` | off-token | `--at-raised` |
| Brand | Documents `#0B0F17 · ground`, `#121826 · surface`, `#0A9AA6`, `#263047`, `#9BEFF3` | old tokens | replace with the §2.1 tokens (#0A0E16, #111826, #087B87, #1F2940). Brand must be the source of truth |
| Brand | Swatches r14/r22, caption mono 12 | off-scale | r16 / r28 |
| Sys* | Installed and PWA mocks `#4A4F59`, `#BAC3CF`, `#33373F`, `#F7F9FB` | foreign UI | mark `data-placeholder` |
| SysProLapsed | "Pro has ended" notice overlaps the "Keep awake" CTA and face tabs | covers the primary action | anchor the notice above the dock (inline, pushes content) or as a top banner. Never over the CTA |
| SysOffline*, SysUpdate | "You're offline — …" | em dash | see Edge* |
| Growth* | Plan helper options `padding: 10px 16px; border-radius: 18px; height: 77–96` (×50), check `r6` | r18, off-scale | r16, padding 12 16. Check r8 (24 box) |
| Growth* | GrowthB2B mock screen `border: 6px` | 6 px | device bezel is illustration (exempt) or 1 px + `--at-sunken` padding |
| Growth* | GrowthDone "min" unit in Geist Mono 24/300, "0 / 280" mono | mono prose | sans 24/400 unit |
| Growth* | GrowthPlan price `$12` weight 300 | 300 on price | 600 (prices are not clock digits) or declare price-display |
| Growth* | GrowthProMoment lamp tiles `height: 84px; r18`, "PRO" 11 px | r18, 11 | r16, 12 |
| Growth* | GrowthProMessagePhoneLight "Back at 11:30 AM" muted grey on light | low emphasis | intentional (preview ended), but keep ≥3:1 for 44 px text (currently ≈3.2:1, OK) |
| Growth* | "Get Pro" / "Open AwakeTab" 56 | 56 | 60 / 52 |

### 3.3 Per-board counts

The per-board violation-count table, generated from the audit, is in Appendix A. Wrapper boards repeat their source's counts. Boards with non-trivial counts are driven by the shared primitives above: P2, P4 and P6 alone account for about 40 % of all "spacing" and "height" hits.

### 3.4 Board-level defects (not §11, but visible)

| Board | Defect |
|---|---|
| HomeBelow, HomeBelowPhone | Renders 390×9,120 on an 8,000 px board. The bottom 1,120 px (FAQ end, author, footer) is clipped. Over the 8,000 px canvas limit. |
| PageChangelogPhone | Renders 8,024 px on 8,000. |
| Page404, PageChangelog ("play me") | Board is 390 wide; the component defaults to desktop and renders 1,280 wide. |
| OgDevice | Digits break onto two lines. |
| GuideOnDeskLight, GuideVsDeskDark | Comparison table body empty in the static render. Leaves about 700 px of dead space at the end of GuideVsDeskDark. Verify in the live canvas. |
| SysProLapsed | The notice covers the primary CTA and the clock-face tabs. |
| KioskPortraitLogo | Composition sits high, with about 450 px of empty space at the bottom. |
| StoreMarquee | The popup collides with the ring glow at the right edge. |
| PageExtensionPhone, PageExtensionDesk | Popup preview scaled below 1:1, so preview "buttons" are 40–41 px. Mark the preview `inert`. |

---

## 4. "Wow" design moves

Each move says what it is, why it sells, where it goes and the effort (S = hours, M = a day or two, L = several days). All are CSS-first and honest: nothing animates a claim the engine has not made.

1. **Ignition: the moment a session starts.** On the real `requesting → held` transition only, one 600 ms lamp pulse travels from the CTA into the pill glyph, then the ring tip bead lights and the 16 s sweep begins. The header bead and favicon light in the same frame. Paused and Blocked get the inverse: the sweep stops and the arc re-patterns (dashes or dots) with no motion flourish.
   - *Why it sells:* the first held moment is the product's promise made physical ("it's handled, and I can see it"), and it becomes the screenshot and GIF people share.
   - *Where:* Main (all faces), ExtPopup, EmbedWidget, PiP.
   - *Effort:* M (keyframes keyed on `data-state` changes. The island already writes `data-state`, so no new JS beyond one class toggle).
2. **Lamp off: the moment a session ends.** Over 900 ms the arc drains its last sliver, the bead dims to the hollow Ready glyph, and the Done timeline receipt (held segments in lamp, paused in amber hatching, with start and end times) rises in place of the face. The tab title reads "Done — AwakeTab".
   - *Why it sells:* closure breeds return visits. The receipt is proof and makes the case for the 12-week stats (Pro).
   - *Where:* Done*/GrowthDone* into Main `ended`, ExtPopup end state.
   - *Effort:* S–M.
3. **The first five seconds on /.** Ready shows the consequence in large type ("Keeps this screen on until 11:32 PM"). One tap on the lamp CTA plays Ignition, and the "What just happened" receipt from GrowthFirstVisit ticks off in real time: asked at 11:01:56 PM, browser confirmed 0.4 s later, pill switched. It shows once per device, then collapses to "How do we know?".
   - *Why it sells:* no competitor can show this, because they claim "awake" on click. Honesty becomes the hero.
   - *Where:* Main, GrowthFirstVisit.
   - *Effort:* M.
4. **One numeral voice.** Every clock and duration digit uses the same face: system sans tabular at weight 200/300 for large display (Ring, Horizon, Tide, Kiosk, OG, store), no slashed zeros, and a single colon treatment (a lamp-tinted colon at 60 % in held, muted in Ready).
   - *Why it sells:* numerals are the brand at 3 m. "3Ø:ØØ" says developer tool, while a clean "30:00" says instrument.
   - *Where:* Main, KioskScreen, KioskTv*, EmbedWidget, ExtPopup, Og*, Store*.
   - *Effort:* S (a token change plus §3 of DESIGN.md).
5. **A signature texture: the minute-tick rule.** The ring's 60 ticks become the brand's only ornament: a horizontal tick rule, already prototyped on KioskTvClock, used as a section divider on /pro, as the progress bar in PiP and embed, and as the loading state. It pairs with one standard lamp halo token (`--at-halo`, a radial behind the status element) instead of per-file radial gradients.
   - *Why it sells:* recognisable without the logo, and it replaces generic gradients.
   - *Where:* all surfaces.
   - *Effort:* S–M.
6. **Horizon as the story.** "The sun touches the water when your session ends." Make this the headline of the OG home card and the store marquee, and the default face for first-time desktop visits after 5 PM (Ring stays the default otherwise).
   - *Why it sells:* it is the most shareable idea in the product, and it is truthful.
   - *Where:* OgHome, StoreMarquee, Main defaults.
   - *Effort:* S.
7. **/pro as one evening with AwakeTab.** Structure the page around the hours of a day:
   - 5:30 PM at the lectern: Message mode, live and typed by the visitor.
   - 7 PM in the kitchen: end sound and Cook timers.
   - 11 PM on the nightstand: lamp colours, where the swatch picker recolours the whole page live.
   - Overnight: 12-week stats with the visitor's own real 7 days if present.
   - Monday on the wall: schedules.

   The Plan helper sits inline after the hero on phones. There is one lamp CTA per viewport, and the yearly plan is an outline secondary. Cut from 7,540 to about 5,000 px on phones.
   - *Why it sells:* people buy the evening, not the feature list.
   - *Where:* Pro*, GrowthPlan*, GrowthProMoment*.
   - *Effort:* L.
8. **Extension popup polish.**
   - Make the popup ring exactly the tool ring (same tick density, tip bead and halo).
   - Flatten the nested length card into the standard segmented bar.
   - Add a 400 ms arc draw from zero to the current value on popup open only.
   - Tie the badge and popup together: the badge "25m" and the popup "25:xx" always agree to the minute.
   - Replace the generic gear with the settings glyph used in the tool header.
   - *Why it sells:* store screenshots are the popup. Polish converts store visitors.
   - *Where:* ExtPopup*, ExtEdge*, Store*.
   - *Effort:* S.
9. **Micro-interactions with meaning.**
   - Changing length while running re-eases the arc over 600 ms and cross-fades the "until" time.
   - +15 min slides the tip bead back along the arc.
   - Resume after a pause briefly draws the paused segment in amber hatch on the arc for 2 s (the same language as the Done receipt).
   - Preset keyboard hints (`kbd`) appear only on focus-visible.
   - *Where:* Main.
   - *Effort:* S each.
10. **The embed as a trust ad.** The EmbedEdge "Blocked — here's the fix" state inside a host recipe page is the best B2B sales visual in the canvas. Lead /embed with it ("It tells your readers the truth, even when your CMS strips the permission").
    - *Where:* EmbedShowcase, GrowthB2B*.
    - *Effort:* S.
11. **The tab as a product surface.** Ship the SysTabs proposals (`● 24:18 left`, `‖ Paused · 24:18 left`, `▲ Blocked · AwakeTab`). It is free marketing every time a user looks at their tab strip, and it is honest by construction.
    - *Where:* Main (title and favicon).
    - *Effort:* S.

---

## 5. Prioritised fix plan

Order inside each batch: (1) apply the shared primitives patch P1–P18 exactly as specified in §3.1, (2) fix the per-file rows in §3.2, (3) fix the board defects in §3.4, (4) apply the wow moves marked for that batch. Re-run `scratchpad/director/render-all.mjs` and `analyze.mjs` after each file. The goal is zero spacing, radius, height, type and border hits outside the documented exemptions.

**Precondition for both batches:** the owner accepts the §11 corrections in §6 below. Otherwise the agents will keep reading §5 of DESIGN.md.

### Batch 1: Main, Tool*, Extras*, Ambient*, Pip*, Content*, HubFor*, HomeBelow*, Size*, Edge*, Intl*, A11y*, Guide*, Preset*, Until*

| # | Task | Files | Effort |
|---|---|---|---|
| 1.1 | `BASE_GEO`: presetH 46→44, desktop/tablet `hdrH: 68`, gutters 16/32/80/120, face card padding 16, section gaps on scale. This one edit fixes every wrapper (Ring*, Bold*, Horizon*, Tide*, Paused*, Blocked*, Done*, Until*, Desk*, Tool*, Size*, Edge*). | Main | S |
| 1.2 | Primitives P1, P2, P3, P4, P13, P14, P15 in Main, then copy the exact snippets into Extras, Ambient, ContentArticle, HubFor, HomeBelow, Guide*, Preset*, Until*, A11y, Intl, Edge*. | all batch 1 | M |
| 1.3 | Display digits without slashed zero (§6 diff). Horizon ink token. Stats `<dd>` to sans with units. | Main, Ambient, Pip* | S |
| 1.4 | Settings sheet: swatches 1 px selected style, 12 px minimum labels, heatmap r4, remove 8 px dot glyphs, Pro tag P14. | Main | S |
| 1.5 | Night token set. Tick marks to tokens. Mode bar padding. Cook row r16. | Ambient | S |
| 1.6 | Content type scale (H1 34/48, H2 24/28, lead 18, H3 20), checklist flattened (no nested card), code 14 px r4, FAQ rows P17, honest note P18, cards r16, "Advertisement" 12. | ContentArticle, HubFor, HomeBelow, Guide*, Preset*, Until* | M |
| 1.7 | Footer P9 on HomeBelow ("No ads on the awake screen, now or later."). Split and trim HomeBelowPhone to under 8,000. | HomeBelow* | S |
| 1.8 | Mono only for digits, code and URLs: HubFor meta, "2 of 6 checked", ad sizes, route slugs (keep them as code but use 13). | HubFor, ContentArticle, Guide*, Preset*, Until* | S |
| 1.9 | Guide step cards: un-nest screenshot figures. GuideLearn line-number colour. GuideGuides rail 1 px, check r8. Verify the desktop comparison tables render. | Guide* | M |
| 1.10 | Em dashes in new copy: EdgeOffline and Sys offline toast, Ambient, Extras (3), ContentArticle (1), GuideOn (1), Intl (review the German strings). | Edge*, Extras, Ambient, Intl | S |
| 1.11 | Wow: Ignition (4.1), Lamp off and receipt (4.2), first five seconds (4.3), micro-interactions (4.9), tab title (4.11). | Main, Tool*, Done wrappers | M–L |
| 1.12 | PiP r12 window/buttons, padding 12, gap 8. | Pip* | S |

### Batch 2: Pro*, Ext*, Embed*, Page*, Kiosk*, EmbedEdge*, EmbedCook*, Og*, Store*, Icon*, ExtEdge*, Welcome*, Sys*, Growth*, Brand

| # | Task | Files | Effort |
|---|---|---|---|
| 2.1 | Brand first: replace the old hex values with §2.1 tokens, add the new tokens (`--at-raised`, `--at-sunken`, `--at-halo`, Night set, Horizon ink), show the numeral voice and the tick-rule texture. Brand becomes the reference for everyone else. | Brand | S |
| 2.2 | Primitives P1–P18 applied identically (same snippets as batch 1). | all batch 2 | M |
| 2.3 | Pro: type scale (H1 48/34, H2 28/24), cards r16, un-nest figures, one lamp CTA per viewport (lifetime 60, yearly outline 52), P9 footer, mono prices to sans. Then wow 4.7 (one evening) as a follow-up. | Pro*, GrowthPlan*, GrowthProMoment* | M → L |
| 2.4 | ProActivate and ProManage: type scale, `--at-bad` Remove, r12/r16, solid empty-state card, em-dash-free error copy, footer. | ProActivate*, ProManage* | S |
| 2.5 | Extension options: header 68, cards r16 padding 20/24, keycaps P13, radios 1 px, segmented 44, Pro-locked controls at full contrast with a lock, `--at-sunken`. | ExtOptions* | M |
| 2.6 | Popup: flatten the nested length card, type 24/13, gaps 8/12, r12 small buttons. Wow 4.8. | ExtPopup*, ExtEdge*, Store* | S |
| 2.7 | Embed: 44 targets (timer, remove), 12/13 px text minimum, r16/r28, `--at-sunken`, pill S/XS metrics, flatten the EmbedEdge notice, fix "How to fix" contrast. | EmbedWidget, EmbedCook*, EmbedEdge*, EmbedShowcase | M |
| 2.8 | Kiosk: numeral voice, pill L metrics, 1 px borders, declared TV type scale, portrait composition centred, em-dash-free default message ("Welcome. Please ring the bell."). | KioskScreen, KioskTv*, KioskPortraitLogo, PageKiosk* | S–M |
| 2.9 | Pages: type scale, gutters 80, r16, TOC without side stripe (PageLegal), library line numbers, nodes as pills, changelog `dl` un-nested, 404/Changelog board default layout, Changelog phone height, extension preview `inert`. | Page* | M |
| 2.10 | OG and store: fix OgDevice wrap, an OG type scale, symmetric padding, StoreMarquee composition, Horizon headline (4.6). | Og*, Store* | S |
| 2.11 | SysProLapsed notice must not cover the CTA. Placeholder colours marked `data-placeholder`. | Sys*, Welcome*, Icon* | S |
| 2.12 | Growth: Plan helper tiles r16 padding 12/16, price weight 600, CTAs 60/52, GrowthB2B bezel. | Growth* | S |

---

## 6. Proposed corrections and additions to DESIGN.md §11 (for owner approval; DESIGN.md not edited)

```diff
@@ §3 Type
-| Ring digits, clock | `ui-monospace, "SF Mono", Menlo, Consolas, monospace`, weight 300, `tabular-nums` | Geist Mono 300 |
-| Bold face digits | `system-ui` weight 650, letter-spacing −0.06em, `tabular-nums` | Space Grotesk 600 |
+| Display digits (Ring, Tide, Kiosk, OG, store, popup) | `system-ui` weight 200–300, `font-variant-numeric: tabular-nums`, no slashed zero | Geist 200–300 |
+| Bold face digits | `system-ui` weight 600, letter-spacing −0.06em, `tabular-nums` | Space Grotesk 600 |
+| Small counters (≤ 28 px: PiP, embed, extension badge text) | `ui-monospace` allowed, but only with a plain (unslashed) zero | Geist Mono |

@@ §5 Layout and breakpoints
-Spacing: 4 px grid; section rhythm 14 / 20 / 24. Radii: pill bars 999, buttons 20, cards and sheets 24, faces 28. Targets ≥ 44 px (60 px primary actions, 64 px in cook mode).
+Spacing, radii and control sizes: see §11 (the only source). Targets ≥ 44 px (60 px primary actions, 64 px in cook mode).

@@ §6 Components
-- **Status pill:** 38 px, tone 12% fill + 38% border, glyph 12 px, `<output aria-live="polite">`.
+- **Status pill:** see §11.4 pill sizes; tone 12 % fill + 38 % border, glyph 12 px, `<output aria-live="polite">`.

@@ §11.2 Borders
 - No side-stripe borders, no double borders, no border + heavy shadow together.
+- Allowed single-side rules: the leading edge of a side sheet, a 1 px `line` column divider between two content columns, and a 1 px timeline rule. An "active" indicator is never a side stripe (use ink 600 + lamp dot).
+- Illustrations and device mocks (`aria-hidden` art, browser or OS chrome placeholders marked `data-placeholder`) are exempt from border, colour and radius rules.

@@ §11.3 Radii
-`8` inputs, code, kbd · `12` icon buttons, small tiles · `16` cards, list rows, inline panels, secondary blocks · `20` large buttons (52/60) · `28` clock faces, sheets (top corners), hero panels · `999` pills, segmented bars, chips, switches.
+`4` micro (inline code, heatmap cells, legend swatches) · `8` inputs, code blocks, kbd, checkboxes · `12` icon buttons, small buttons (44), small tiles, toolbar/PiP windows · `16` cards, list containers, inline panels, selectable tiles · `20` large buttons (52/60/64) · `28` clock faces, sheets (top corners), hero panels (including the embedded tool card) · `999` pills, tags, segmented bars, chips, switches, progress tracks.
+Never 14, 18, 22 or 24.

@@ §11.4 Control sizes
-- Segmented bar = 4 px padding + 44 items + 1 px border (52 total). Sliding indicator same height as items.
+- Segmented bar = 1 px border + 4 px padding + 44 px items (54 total). Sliding indicator same height as items, inset 4 px. Theme switch is a segmented bar (no 3 px padding).
+- Status pill (not a control): **L 48** (kiosk ≥ 1180 wide, xl; text 20) · **M 38** (tool; text 15/600, padding 0 16 0 12, gap 8) · **S 32** (extension popup, PiP, full embed; text 14/600, padding 0 12 0 8) · **XS 26** (compact embed; text 13/600, padding 0 8, gap 4).
+- Tag (non-interactive: Pro, Free, Proposed, Release, licence): height 24, 12/16 weight 600, r999, padding 0 8, 1 px `line-strong` or tone 12 % fill.
+- List row (FAQ, device, guide link): min-height 56, padding 16 0; its trailing icon button is 44.
+- Small screens (≤ 568 tall) and landscape phones may use 52 for the primary action and header; nothing else shrinks.

@@ §11.5 Type scale
+| `display-s` | 24–28 | 300 | small counters (PiP, embed, popup) |
+| `price` | 48/56 (phone 40/48) | 600 | plan prices only |
 Weights allowed: 400, 500, 600 (+200/300 for digits). Primary action label 17/24 600. Never below 12 px.
+Mono is allowed only for digits, code, keys, file names and URLs; never for meta prose ("4 guides", "2 of 6 checked", prices, units).
+Inline code is 14 px fixed (not em-relative), r4, padding 0 4.
+TV / kiosk scale (≥ 1920 wide): meta 32, date 40, message 96–128, clock digits face-specific. OG (1200×630) scale: kicker 20, title 64, body 28, url 22.

@@ §2.1 Theme tokens (new)
+| `--at-raised` (new) | `#26324B` | `#E3E9F1` | Neutral selected segment (theme switch), raised tile |
+| `--at-sunken` (new) | `#0D131F` | `#F6F9FC` | Code blocks, timer wells, URL outputs, input fill |
+| `--at-horizon-ink` (new) | `#F6F2EA` | `#F6F2EA` | Digits on the Horizon sky and water |
+| `--at-halo` (new) | lamp at 18 % → 0, radial 50 % 26 % | lamp at 10 % → 0 | The single status halo behind pill/face on every surface |
+Night mode tokens (OLED, red digits): `--at-night-ink #FF5A3C`, `--at-night-ink-2 #E8563C`, `--at-night-muted #A89690`, `--at-night-line #3A2E2A`; ground `#000`.
+Scrim is always `rgba(4,7,12,.55)`.

@@ §11.6 Surfaces and elevation
-- Header 60 (phone) / 68 (≥ tablet), bottom border 1 px `line` only when content scrolls under it.
+- Header 60 (phone) / 68 (≥ tablet) on every product: tool, content, Pro, extension options, embed docs. Header gutter = page gutter (§11.1).
+- A device or window mock (popup inside a browser, widget inside a host page) is not a nested card; explanatory cards inside cards are.

@@ §11.7 Composition rules
 - Every page ends with the same footer (links, honest line "No ads on the awake screen, now or later.").
+  Footer spec: 1 px `line` top border, padding 24 (phone 32 bottom), honest line left in caption 13 `muted`, links right in the order Privacy · Terms · Changelog · About · Buy me a coffee. Pro, Activate and Manage pages included.
+- A notice, toast or banner never covers the primary action or the status pill; it pushes content or sits above the dock.
+- Canvas boards: height ≤ 8000; a board's default `layout` prop must match its width.
```

---

## Appendix A: per-board violation counts (computed)

Counts are rendered elements that break §11. Columns: spacing = padding or gap off the scale · radius = not in the set · height = control height not in 44/48/52/60/64 (≥ 44) · target<44 · font-size = not in the scale (≥ 12) · fs<12 · weight = outside 400/500/600 (digits excepted) · border = width ≠ 1 · colour = off-token · mono = mono used for prose · nested = card inside card · stripe = single-side border · dashed = dashed outside choose/add affordances. The detector is strict; the §6 exemptions (illustrations, foreign UI placeholders, sheet edges) are not yet subtracted.

| Board | Renders | spacing | radius | height | target<44 | font-size | fs<12 | weight | border | colour | mono | nested | stripe | dashed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A11y | A11y | 32 | 0 | 0 | 4 | 2 | 40 | 0 | 0 | 0 | 1 | 0 | 1 | 0 |
| Ambient | Ambient | 8 | 60 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| AmbientClockDesk | Ambient | 8 | 60 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| AmbientClockPhone | Ambient | 7 | 60 | 0 | 0 | 8 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| AmbientCookTablet | Ambient | 23 | 10 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| AmbientCookTabletDark | Ambient | 20 | 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| AmbientFocusDesk | Ambient | 11 | 2 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 |
| AmbientMessageDesk | Ambient | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| AmbientMinimalDesk | Ambient | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| AmbientNightPhone | Ambient | 6 | 0 | 0 | 0 | 7 | 0 | 1 | 0 | 34 | 1 | 0 | 0 | 0 |
| BlockedDark | Main | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| BlockedLight | Main | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| BoldDark | Main | 18 | 2 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| BoldLight | Main | 18 | 2 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Brand | Brand | 11 | 10 | 0 | 0 | 1 | 0 | 0 | 0 | 17 | 8 | 0 | 0 | 0 |
| ContentArticle | ContentArticle | 48 | 10 | 10 | 0 | 6 | 1 | 0 | 0 | 1 | 2 | 0 | 0 | 0 |
| ContentArticleDeskDark | ContentArticle | 62 | 10 | 6 | 0 | 4 | 2 | 1 | 0 | 1 | 3 | 0 | 0 | 0 |
| ContentArticleDeskLight | ContentArticle | 62 | 10 | 6 | 0 | 4 | 2 | 1 | 0 | 0 | 3 | 0 | 0 | 0 |
| ContentArticlePhoneDark | ContentArticle | 48 | 10 | 10 | 0 | 6 | 1 | 0 | 0 | 1 | 2 | 0 | 0 | 0 |
| ContentArticlePhoneLight | ContentArticle | 48 | 10 | 10 | 0 | 6 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| ContentArticleTablet | ContentArticle | 50 | 10 | 5 | 0 | 15 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| DeskHorizonDark | Main | 19 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 |
| DeskHorizonLight | Main | 19 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 |
| DeskRingDark | Main | 18 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| DeskRingLight | Main | 18 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DeskTideDark | Main | 17 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| DeskTideLight | Main | 17 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DoneDark | Main | 13 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| DoneLight | Main | 13 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EdgeDeferred | Main | 14 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| EdgeLastMinute | Main | 17 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| EdgeLongNoLimit | Main | 17 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EdgeLowBattery | Main | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| EdgeMultiDay | Main | 18 | 2 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| EdgeOffline | Main | 19 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EdgeOled | Main | 17 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| EdgeReturn | Main | 22 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 |
| EdgeUntilPassed | Main | 18 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
| EmbedCompactLight | EmbedWidget | 5 | 0 | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| EmbedCook | EmbedCook | 9 | 7 | 0 | 2 | 5 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 |
| EmbedCookCompact | EmbedCook | 4 | 0 | 0 | 1 | 1 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| EmbedCookFull | EmbedCook | 10 | 4 | 0 | 3 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 1 | 0 |
| EmbedEdge | EmbedEdge | 13 | 13 | 0 | 0 | 9 | 1 | 3 | 0 | 45 | 6 | 2 | 0 | 0 |
| EmbedEdgeBatteryPhone | EmbedEdge | 13 | 10 | 0 | 0 | 3 | 1 | 3 | 0 | 39 | 0 | 2 | 0 | 0 |
| EmbedEdgeLicensed | EmbedEdge | 13 | 13 | 0 | 0 | 7 | 0 | 3 | 0 | 42 | 4 | 1 | 0 | 0 |
| EmbedEdgeNoAllow | EmbedEdge | 13 | 13 | 0 | 0 | 9 | 1 | 3 | 0 | 45 | 6 | 2 | 0 | 0 |
| EmbedEdgeSidebar | EmbedEdge | 15 | 16 | 0 | 0 | 3 | 1 | 4 | 0 | 57 | 0 | 1 | 0 | 0 |
| EmbedEdgeUnsupportedTablet | EmbedEdge | 12 | 13 | 0 | 0 | 3 | 1 | 3 | 0 | 42 | 0 | 2 | 0 | 0 |
| EmbedFullDark | EmbedWidget | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| EmbedShowcase | EmbedShowcase+EmbedWidget | 36 | 3 | 0 | 1 | 3 | 0 | 1 | 0 | 47 | 10 | 1 | 0 | 0 |
| EmbedWidget | EmbedWidget | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| ExtBadges | ExtBadges | 39 | 22 | 0 | 0 | 8 | 8 | 8 | 0 | 47 | 6 | 0 | 0 | 0 |
| ExtEdge | ExtEdge | 22 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtEdgeAutostart | ExtEdge | 19 | 0 | 0 | 1 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtEdgeError | ExtEdge | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtEdgeFirstOpen | ExtEdge | 27 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| ExtEdgeProLocked | ExtEdge | 14 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtEdgeScheduled | ExtEdge | 15 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtEdgeTimesUp | ExtEdge | 19 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtEdgeUpdate | ExtEdge | 21 | 0 | 0 | 1 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtOptions | ExtOptions | 108 | 5 | 2 | 0 | 1 | 0 | 1 | 2 | 3 | 2 | 0 | 0 | 3 |
| ExtOptionsDark | ExtOptions | 108 | 5 | 2 | 0 | 1 | 0 | 1 | 2 | 3 | 2 | 0 | 0 | 3 |
| ExtOptionsLight | ExtOptions | 104 | 5 | 2 | 0 | 1 | 0 | 1 | 2 | 3 | 2 | 0 | 0 | 1 |
| ExtPopup | ExtPopup | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtPopupAwakeDark | ExtPopup | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtPopupAwakeLight | ExtPopup | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtPopupReady | ExtPopup | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtPopupSystem | ExtPopup | 19 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 |
| Extras | Extras | 18 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtrasDenied | Extras | 19 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtrasInstall | Extras | 20 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtrasRating | Extras | 25 | 8 | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| ExtrasResume | Extras | 18 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ExtrasSecondTab | Extras | 17 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtrasShareDesk | Extras | 24 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ExtrasShortcutsDesk | Extras | 39 | 11 | 0 | 0 | 0 | 0 | 0 | 11 | 3 | 0 | 0 | 0 | 0 |
| ExtrasToasts | Extras | 24 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthB2B | GrowthB2B | 20 | 8 | 1 | 0 | 2 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 1 |
| GrowthB2BKioskDeskLight | GrowthB2B | 20 | 4 | 1 | 0 | 3 | 0 | 0 | 1 | 2 | 1 | 1 | 0 | 0 |
| GrowthB2BKioskPhoneDark | GrowthB2B | 21 | 4 | 1 | 0 | 2 | 0 | 0 | 1 | 2 | 1 | 1 | 0 | 0 |
| GrowthB2BRecipeDeskDark | GrowthB2B | 19 | 8 | 1 | 0 | 3 | 0 | 0 | 0 | 1 | 0 | 2 | 0 | 1 |
| GrowthB2BRecipePhoneLight | GrowthB2B | 20 | 8 | 1 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 1 |
| GrowthDone | GrowthDone | 20 | 6 | 5 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthDoneExtensionDeskDark | GrowthDone | 20 | 10 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthDoneInstallPhoneDark | GrowthDone | 20 | 6 | 5 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthDoneIosPhoneLight | GrowthDone | 22 | 3 | 5 | 0 | 0 | 0 | 1 | 0 | 3 | 1 | 0 | 0 | 0 |
| GrowthDoneNonePhoneLight | GrowthDone | 17 | 5 | 5 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 |
| GrowthDoneProDeskLight | GrowthDone | 19 | 3 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthFirstVisit | GrowthFirstVisit | 21 | 0 | 5 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthFirstVisitDeskDark | GrowthFirstVisit | 21 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthFirstVisitDeskLight | GrowthFirstVisit | 21 | 0 | 7 | 0 | 1 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 |
| GrowthFirstVisitPhoneDark | GrowthFirstVisit | 21 | 0 | 5 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthFirstVisitPhoneLight | GrowthFirstVisit | 21 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthFirstVisitTabletDark | GrowthFirstVisit | 20 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 |
| GrowthPaused | GrowthPaused | 24 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthPausedDeskDark | GrowthPaused | 24 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthPausedDeskLight | GrowthPaused | 22 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthPausedPhoneDark | GrowthPaused | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthPausedPhoneLight | GrowthPaused | 24 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthPlanDeskDark | GrowthPlanHelper | 35 | 18 | 6 | 0 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthPlanDeskLight | GrowthPlanHelper | 25 | 8 | 4 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthPlanHelper | GrowthPlanHelper | 31 | 16 | 1 | 0 | 2 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthPlanPhoneDark | GrowthPlanHelper | 31 | 16 | 1 | 0 | 2 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthPlanPhoneLight | GrowthPlanHelper | 35 | 18 | 1 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthPlanTabletLight | GrowthPlanHelper | 24 | 8 | 4 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| GrowthProLampDeskLight | GrowthProMoment | 19 | 5 | 5 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| GrowthProLampPhoneDark | GrowthProMoment | 18 | 6 | 5 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthProMessageDeskDark | GrowthProMoment | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthProMessagePhoneLight | GrowthProMoment | 2 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| GrowthProMoment | GrowthProMoment | 18 | 6 | 5 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthProStatsDeskDark | GrowthProMoment | 21 | 89 | 1 | 0 | 0 | 3 | 0 | 0 | 2 | 4 | 0 | 1 | 0 |
| GrowthProStatsPhoneLight | GrowthProMoment | 20 | 90 | 1 | 0 | 0 | 3 | 0 | 0 | 5 | 4 | 0 | 0 | 0 |
| GrowthShare | GrowthShare | 16 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthShareLowPhoneLight | GrowthShare | 16 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 2 | 0 | 0 | 0 |
| GrowthSharePresetDeskLight | GrowthShare | 22 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthSharePresetPhoneDark | GrowthShare | 21 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthShareTellDeskDark | GrowthShare | 17 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| GrowthShareTellPhoneDark | GrowthShare | 16 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 |
| GrowthTrust | GrowthTrust | 32 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| GrowthTrustDeskDark | GrowthTrust | 32 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 |
| GrowthTrustDeskLight | GrowthTrust | 31 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| GrowthTrustPhoneDark | GrowthTrust | 32 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| GrowthTrustPhoneLight | GrowthTrust | 32 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| GuideGuides | GuideGuides | 35 | 15 | 9 | 0 | 2 | 1 | 0 | 4 | 1 | 7 | 0 | 0 | 0 |
| GuideGuidesDeskLight | GuideGuides | 40 | 15 | 11 | 0 | 1 | 2 | 0 | 4 | 0 | 9 | 0 | 0 | 0 |
| GuideGuidesPhoneDark | GuideGuides | 35 | 15 | 9 | 0 | 2 | 1 | 0 | 4 | 1 | 7 | 0 | 0 | 0 |
| GuideLearn | GuideLearn | 62 | 14 | 9 | 0 | 155 | 1 | 0 | 0 | 30 | 7 | 0 | 0 | 0 |
| GuideLearnDeskDark | GuideLearn | 73 | 14 | 12 | 0 | 14 | 2 | 1 | 0 | 30 | 8 | 0 | 0 | 0 |
| GuideLearnPhoneLight | GuideLearn | 62 | 14 | 9 | 0 | 155 | 1 | 0 | 0 | 25 | 7 | 0 | 0 | 0 |
| GuideOn | GuideOn | 67 | 20 | 9 | 0 | 2 | 6 | 0 | 0 | 1 | 8 | 0 | 0 | 5 |
| GuideOnDeskLight | GuideOn | 70 | 20 | 12 | 0 | 2 | 7 | 1 | 0 | 0 | 9 | 5 | 0 | 5 |
| GuideOnPhoneDark | GuideOn | 67 | 20 | 9 | 0 | 2 | 6 | 0 | 0 | 1 | 8 | 0 | 0 | 5 |
| GuideOnStalePhone | GuideOn | 68 | 20 | 9 | 0 | 2 | 6 | 0 | 0 | 0 | 8 | 0 | 0 | 5 |
| GuideVs | GuideVs | 34 | 10 | 9 | 0 | 4 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| GuideVsDeskDark | GuideVs | 50 | 2 | 12 | 0 | 2 | 2 | 1 | 0 | 1 | 3 | 0 | 0 | 0 |
| GuideVsPhoneLight | GuideVs | 34 | 10 | 9 | 0 | 4 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| HomeBelow | HomeBelow | 99 | 21 | 9 | 0 | 11 | 0 | 0 | 5 | 0 | 1 | 0 | 0 | 0 |
| HomeBelowDesk | HomeBelow | 115 | 21 | 9 | 0 | 10 | 0 | 0 | 5 | 0 | 1 | 0 | 0 | 0 |
| HomeBelowPhone | HomeBelow | 99 | 21 | 9 | 0 | 11 | 0 | 0 | 5 | 0 | 1 | 0 | 0 | 0 |
| HomeBelowPhoneEnd | HomeBelow+HomeBelowPhoneEnd | 99 | 21 | 9 | 0 | 11 | 0 | 0 | 5 | 0 | 1 | 0 | 0 | 0 |
| HorizonDark | Main | 18 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 |
| HorizonLight | Main | 18 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 |
| HubFor | HubFor | 57 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 22 | 0 | 0 | 0 |
| HubForDesk | HubFor | 59 | 1 | 0 | 0 | 19 | 0 | 0 | 0 | 0 | 22 | 0 | 0 | 0 |
| HubForPhone | HubFor | 57 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 22 | 0 | 0 | 0 |
| IconSet | IconSet | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 28 | 12 | 0 | 0 | 2 |
| Intl | Intl | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 2 |
| KioskPortraitLogo | KioskScreen | 2 | 61 | 0 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 1 |
| KioskScreen | KioskScreen | 4 | 60 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| KioskTvClock | KioskScreen | 4 | 60 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| KioskTvDashboard | KioskScreen | 4 | 12 | 1 | 0 | 2 | 1 | 1 | 6 | 0 | 0 | 0 | 0 | 0 |
| KioskTvMessage | KioskScreen | 2 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| KioskTvUnlicensed | KioskScreen | 2 | 0 | 0 | 0 | 3 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| Main | Main | 14 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| OgArticle | OgCards | 6 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 |
| OgCards | OgCards | 4 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| OgDevice | OgCards | 5 | 2 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| OgHome | OgCards | 5 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| OgPreset | OgCards | 5 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| OgPro | OgCards | 3 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| OgVs | OgCards | 5 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| Page404 | Page404 | 31 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 8 | 6 | 0 | 0 | 0 |
| Page404Desk | Page404 | 31 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 7 | 6 | 0 | 0 | 0 |
| Page404Phone | Page404 | 28 | 0 | 0 | 0 | 9 | 0 | 0 | 0 | 8 | 6 | 0 | 0 | 0 |
| PageAbout | PageAbout | 47 | 8 | 0 | 0 | 8 | 0 | 0 | 0 | 1 | 7 | 0 | 0 | 0 |
| PageAboutDesk | PageAbout | 47 | 8 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 |
| PageChangelog | PageChangelog | 146 | 11 | 4 | 0 | 32 | 0 | 1 | 4 | 1 | 9 | 1 | 0 | 0 |
| PageChangelogPhone | PageChangelog | 143 | 11 | 4 | 0 | 11 | 0 | 1 | 4 | 1 | 9 | 1 | 4 | 0 |
| PageExtension | PageExtension+ExtPopup | 67 | 6 | 5 | 0 | 9 | 1 | 1 | 0 | 4 | 1 | 1 | 0 | 0 |
| PageExtensionDesk | PageExtension+ExtPopup | 67 | 6 | 5 | 0 | 9 | 1 | 1 | 0 | 2 | 1 | 1 | 0 | 0 |
| PageExtensionPhone | PageExtension+ExtPopup | 78 | 6 | 6 | 13 | 1 | 1 | 1 | 0 | 4 | 1 | 1 | 0 | 0 |
| PageKiosk | PageKiosk | 53 | 10 | 3 | 0 | 13 | 0 | 0 | 0 | 3 | 12 | 0 | 0 | 0 |
| PageKioskDesk | PageKiosk | 53 | 10 | 3 | 0 | 13 | 0 | 0 | 0 | 3 | 12 | 0 | 0 | 0 |
| PageKioskPhone | PageKiosk | 50 | 10 | 4 | 0 | 11 | 0 | 0 | 0 | 2 | 12 | 0 | 0 | 0 |
| PageLegal | PageLegal | 96 | 49 | 0 | 0 | 76 | 0 | 0 | 7 | 1 | 49 | 0 | 8 | 0 |
| PageLibrary | PageLibrary | 65 | 19 | 5 | 0 | 15 | 7 | 0 | 0 | 13 | 20 | 1 | 0 | 0 |
| PageLibraryDesk | PageLibrary | 65 | 19 | 5 | 0 | 15 | 7 | 0 | 0 | 13 | 20 | 1 | 0 | 0 |
| PagePrivacyDesk | PageLegal | 96 | 49 | 0 | 0 | 76 | 0 | 0 | 7 | 0 | 49 | 0 | 8 | 0 |
| PageTermsPhone | PageLegal | 18 | 0 | 0 | 0 | 4 | 0 | 0 | 3 | 1 | 0 | 0 | 4 | 0 |
| PausedDark | Main | 17 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| PausedLight | Main | 17 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PipDark | PipWindow+PipDark | 11 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PipLight | PipWindow+PipLight | 11 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PipOverDesk | PipOverDesk+PipWindow | 151 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 352 | 2 | 0 | 0 | 0 |
| PipWindow | PipWindow | 4 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PresetDeskLight | PresetPage+Main | 31 | 2 | 7 | 0 | 6 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 |
| PresetPage | PresetPage+Main | 28 | 1 | 5 | 0 | 7 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 0 |
| PresetPhoneDark | PresetPage+Main | 28 | 1 | 5 | 0 | 7 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 0 |
| PresetTablet | PresetPage+Main | 30 | 2 | 7 | 0 | 6 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 0 |
| Pro | Pro | 101 | 110 | 8 | 0 | 7 | 8 | 0 | 0 | 2 | 3 | 1 | 0 | 2 |
| ProActivate | ProActivate | 17 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ProActivateDesk | ProActivate | 23 | 2 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ProActivatePhone | ProActivate | 19 | 1 | 2 | 0 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ProDeskDark | Pro | 101 | 110 | 7 | 0 | 8 | 8 | 0 | 0 | 2 | 3 | 2 | 0 | 2 |
| ProDeskLight | Pro | 101 | 110 | 7 | 0 | 8 | 8 | 0 | 0 | 1 | 3 | 2 | 0 | 2 |
| ProManage | ProManage | 17 | 10 | 0 | 0 | 1 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| ProManageDesk | ProManage | 29 | 10 | 0 | 0 | 1 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| ProManagePhoneEmpty | ProManage | 15 | 1 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| ProPhoneDark | Pro | 101 | 110 | 8 | 0 | 7 | 8 | 0 | 0 | 2 | 3 | 1 | 0 | 2 |
| ProPhoneLight | Pro | 101 | 110 | 8 | 0 | 7 | 8 | 0 | 0 | 1 | 3 | 1 | 0 | 2 |
| ProTablet | Pro | 100 | 110 | 7 | 0 | 8 | 8 | 0 | 0 | 1 | 3 | 2 | 0 | 2 |
| RingDark | Main | 17 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| RingLight | Main | 17 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SizeLandscape | Main | 18 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| SizeLandscapeLight | Main | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SizeSmallDark | Main | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SizeSmallLight | Main | 9 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SizeTabletLandscape | Main | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 7 | 0 | 0 | 0 | 0 |
| SizeXL | Main | 20 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| SizeXLLight | Main | 19 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| StoreAssets | ExtPopup+StoreAssets | 19 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 4 | 0 | 2 | 0 | 0 |
| StoreMarquee | ExtPopup+StoreAssets | 19 | 0 | 0 | 13 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
| StorePromoSmall | StoreAssets | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| StoreShot1 | ExtPopup+StoreAssets | 19 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 4 | 0 | 2 | 0 | 0 |
| StoreShot2 | ExtOptions+StoreAssets | 107 | 5 | 2 | 42 | 1 | 0 | 1 | 2 | 3 | 2 | 0 | 0 | 3 |
| StoreShot3 | StoreAssets | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 |
| StoreShot4 | ExtPopup+StoreAssets | 38 | 0 | 0 | 0 | 2 | 0 | 2 | 0 | 2 | 0 | 2 | 0 | 0 |
| StoreShot5 | ExtOptions+StoreAssets | 107 | 5 | 2 | 42 | 1 | 0 | 1 | 2 | 3 | 2 | 1 | 0 | 3 |
| Sys | Main+Sys | 18 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| SysCheckoutFailed | Sys | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SysCheckoutSuccess | Sys | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SysInstalledDesk | Main+Sys | 18 | 1 | 2 | 18 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 |
| SysInstalledPhone | Main+Sys | 18 | 0 | 0 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SysNotify | Sys | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 22 | 0 | 0 | 0 | 0 |
| SysOfflineDesk | Main+Sys | 19 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 |
| SysOfflinePhone | Main+Sys | 18 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| SysProLapsed | Sys+Main | 20 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 4 | 1 | 0 | 0 | 0 |
| SysTabsDark | Sys | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 62 | 0 | 0 | 0 | 0 |
| SysTabsLight | Sys | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 55 | 0 | 0 | 0 | 0 |
| SysUpdate | Main+Sys | 33 | 0 | 3 | 32 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| TideDark | Main | 16 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| TideLight | Main | 16 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ToolSettingsDark | Main | 46 | 2 | 15 | 0 | 0 | 2 | 0 | 4 | 9 | 1 | 0 | 0 | 0 |
| ToolSettingsDesk | Main | 47 | 2 | 17 | 0 | 0 | 2 | 0 | 4 | 1 | 1 | 0 | 1 | 0 |
| ToolSettingsLight | Main | 46 | 2 | 15 | 0 | 0 | 2 | 0 | 4 | 1 | 1 | 0 | 0 | 0 |
| ToolStats | Main | 33 | 91 | 5 | 0 | 4 | 11 | 4 | 0 | 2 | 4 | 0 | 0 | 1 |
| ToolTabletDark | Main | 18 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ToolTabletLight | Main | 18 | 1 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ToolTimesUp | Main | 17 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| ToolTimesUpLight | Main | 17 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| UntilDark | Main | 25 | 1 | 4 | 0 | 0 | 4 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| UntilDeskDark | UntilPage | 26 | 0 | 4 | 0 | 5 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 1 |
| UntilLight | Main | 25 | 1 | 4 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| UntilPage | UntilPage | 23 | 0 | 4 | 0 | 6 | 0 | 0 | 0 | 1 | 4 | 0 | 0 | 1 |
| UntilPhoneLight | UntilPage | 23 | 0 | 4 | 0 | 6 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 1 |
| Welcome | Welcome | 33 | 2 | 2 | 0 | 0 | 0 | 0 | 2 | 31 | 0 | 3 | 1 | 1 |
| WelcomeDark | Welcome | 33 | 2 | 2 | 0 | 0 | 0 | 0 | 2 | 31 | 0 | 3 | 1 | 1 |
| WelcomeLight | Welcome | 33 | 2 | 2 | 0 | 0 | 0 | 0 | 2 | 29 | 0 | 3 | 1 | 1 |
