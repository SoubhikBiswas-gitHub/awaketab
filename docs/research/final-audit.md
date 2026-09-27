# Final audit: every board on the canvas (status #45, 27 September 2026)

Run by the cloud agent after fix batches 1a, 2a, 2b and the 1b follow-up, the §5.1 integration (heights, D-R18 dedupe, O-77 primitives merge) and the canvas publish.

## How it was checked
- **One full render** of all 251 canvas boards (`tools/fix1b/render.mjs`) in Playwright/Chromium:
  - Geist, Geist Mono and Space Grotesk are installed locally (`tools/final/setup.sh`), so digits are measured in the real mock fonts.
  - The render waits for fonts and finishes entrance animations before measuring.
  - It ran on the live clock just after midnight (12:00–12:05 AM, 27 September 2026). That exercised the "tomorrow" / "since yesterday" edge cases on every time-aware board.
- **Automated checks:**
  - `tools/final/check.py`: contrast, targets, overflow, copy rules, pill strings, 24 h times.
  - `tools/final/analyze.mjs` (checker v3): §11 numbers, tokens, mono, dashed borders, side stripes, nested cards.
  - `tools/final/primvariance.py`: shared primitives render the same everywhere (O-77).
  - `tools/final/dedupe.py`: no duplicate boards (D-R18).
  - A source check: every base file's `prefers-reduced-motion` rule covers `*`.
- **Visual review:** contact sheets of all 251 renders, every board looked at.
- **Smoke tests after every fix:**
  - tool-smoke: ALL PASS.
  - Size: 42,894 combinations.
  - IntlA11y: 7,128.
  - Guide: 243.
  - Pro: 783.
  - ExtEdge: 54.
  - ext-tools: 13,308 holes.
  - bigscreens: 675.
  - growth: 333 combinations and 3,750 handler calls.
  - pages: 162.
  - gen: 417 holes.
  - All with 0 missing.

## Results
| Check | Result |
|---|---|
| Board height = content height | 251 of 251 match (61 synced in §5.1; ProActivate/ProManage phone footers and EmbedShowcase were clipped, now fixed) |
| Overflow (text or controls past the board) | 0 (code wells on phones scroll horizontally by design) |
| Targets ≥ 44 | 0 misses. Exempt: the inline embed credit link (24 px, WCAG 2.5.8), PiP window controls, toolbar badges, scaled store and OG images |
| Contrast, text on solid surfaces (DOM-computed) | 0 below AA. The two forced-colours boards use system colours by design |
| Contrast, text over gradients or images | The pixel estimate flagged 117 spots. All were reviewed by eye: text behind an open sheet's scrim (inert), dark ink on Tide water, pill borders caught by the sampling. None is a real failure |
| §11 numbers and tokens (checker v3) | 29 hits, all documented allowances (see below) |
| Shared primitives (O-77) | One variant each for header, theme bar, footer, footer link, kbd, logo and nav; "Pro" is 48 px, or 62 px where it is the current page with its lamp dot |
| Pill strings | Only the seven contract strings (plus "System awake" and "Starts when you open this tab"); translated pills on Intl boards |
| Times | 12-hour AM/PM in en; ja/zh use their 24 h defaults (§4); no 24 h time in en copy |
| Copy rules | No battery-saver blame, no "was $29", no "forever", no sponsor card, no "Try again", no "floating pill/timer", no "Who tested this", no "no limit" label (∞); em dashes only in contract pills and existing en.json strings |
| Reduced motion | 49 of 49 base files stop every animation and transition on `*` |
| Duplicates (D-R18) | 0 (18 removed, 8 switched to the opposite theme) |

## Fixed during the audit
- **Embed and kiosk timers:** they used a fixed `00:12:34` / `00:00:00` format. Every surface now follows DESIGN.md §4: `12:34` under 1 h, `5:28:14` from 1 h, `1d 02:15:00` from 24 h. Files: EmbedWidget, EmbedCook, EmbedEdge, KioskScreen, and the OG cook card.
- **Kiosk "No limit · since 6:36 PM" after midnight:** it now says "since yesterday 6:43 PM" (§4).
- **ExtPopupOvernight after midnight:** the seed showed "1d 00:02 · Until Monday 12:05 AM", which is more than a day for an overnight session. It now ends at the next 4:11 AM: "tomorrow" in the evening, later today after midnight. StoreShot4 inherits the fix.
- **GrowthDone (extension offer):** "Free. Chrome, Edge, Brave, Arc and Opera." is now "Free. Chrome and Edge." (O-41).
- **Earlier in the same pass (batch reports):**
  - Bold digits never clip.
  - Desktop focus order (O-65).
  - Footer and nav targets.
  - Library headline and code.
  - Sys previews marked as mocks.
  - Popup ∞ (O-87).

## Documented allowances (checker v3 hits that stay)
| Where | Why it is allowed |
|---|---|
| A11y zoom/reflow boards (fonts, 34 px logo) | They show 200 % and 400 % zoom on purpose |
| ExtOptions dashed schedule drafts and legend | "Add" affordances (§11.2); 56 px legend inset aligns with the 44 + 12 label column |
| Welcome 1 px divider | A column divider between two content columns (§11.2) |
| GrowthProMoment/GrowthTrust 520 px right padding | Space kept for the open side sheet |
| GrowthShare "min" unit at 0.4em | Display unit beside the digits |
| Code tokens in `<span>` (EmbedShowcase, PageLegal, PageLibrary) | Code; the build renders them as `<code>` |
| OgCards inner timer card | Part of a 1200 × 630 image, not UI |
| Main: two display sizes on the multi-day ring | Display digits (face-specific, §3) |

## Left for the build (not canvas defects)
- The O-78/O-79/O-80 source strings (the de/hi cooking Split View advice, en.json `pip.unsupported`, and others). These are fixed in the content files during the build, as decided.
- docs/00 `BADGE_COLORS` and docs/10 §Badge must switch the Screen badge from amber `#B86E00` to `#087B87` (DESIGN.md §2.1).
- DESIGN.md §5 now states the O-74 preset grid (updated during this audit).

## Owner questions
None. The canvas is ready for the owner's review (HANDOFF §5.3).
