# Gap agent F: guides, Intl, A11y (27 Sep 2026)

Scope: `design/canvas/GuideGen.mjs` (+ its `GuideSizes.json`), the Guide*, Intl* and A11y* boards. Nothing committed.

## What changed
- **GuideGen.mjs brought back in sync.** The generator lagged the committed guide files (D-R20 Stop, nav padding, P-FOOTER link targets). Those edits now live in the generator, and a scratch regeneration matched the committed files byte for byte before any new work went in.
- **P-LANG footer control on all four guides.** The markup and the AT-LANG v1 block are read verbatim from `tools/gap-b/lang-footer.html` and `lang.js`. The `language` prop (closed | open) seeds `langOpen`, and `t.inputBorder` was added for the radio rings. Each locale row points to the real translation, worked out from `apps/web/src/content` and `i18n/slugs.json`:
  - /on/iphone-safari exists in all 8 locales.
  - /guides/iphone-auto-lock-never-greyed-out exists in all 8, with translated slugs for es, pt-br, de and fr.
  - /vs/nosleep-page and /learn/screen-wake-lock-api-guide exist in English only, so the other locales link to their home page.
- **Natural heights come from the real runtime (dc-runtime).** Before this change, GuideVs phone (6289 vs 6250), GuideLearn phone (8013 vs 7970) and GuideOn stale (6846 vs 6810) were already clipping their footers. New `GuideSizes.json` values:
  - GuideOn: 6910 / 6160 / 6180
  - GuideVs: 6350 / 4780 / 4840
  - GuideLearn: 8070 / 6620 / 6910
  - GuideGuides (max over step states): 5180 / 4320 / 4350
- **GuideLearn phone split (8069 > 8000).**
  - New `part` prop (auto | all | top | bottom). It exists only on pages that have a `SIZES.cut`.
  - The cut is at y 3976, inside the 48 px gap between "When the tab is hidden" and "The lifecycle", so each half keeps 24 px at the cut edge.
  - `auto` shows the top half on the phone layout, so the base board previews at 390 × 3976.
- **A11y gains a `tablet` layout.** It is an 820 × 1180 screen plus the 480 px rail, using Intl's tablet geometry: a 520 px column, 432 px ring, segmented presets and tablet header/gutters. Zoom modes stay phone-sized. `IntlA11y-smoke.mjs` still only exercises phone and desktop, so tablet was checked with a separate script: 36 combinations, 0 missing.

## Boards (w × h)
| Board | Size | Notes |
|---|---|---|
| GuideOnTablet | 820 × 6160 | dark |
| GuideOnPhoneDark | 390 × 6910 | dark, awake |
| GuideVsTablet | 820 × 4780 | light |
| GuideLearnTablet | 820 × 6620 | light |
| GuideGuidesTablet | 820 × 4320 | dark |
| GuideGuidesDeskDark | 1280 × 4350 | |
| IntlJaTablet | 820 × 1180 | light, awake, review banner |
| A11yReducedTablet | 1300 × 1180 | dark |
| GuideLearnPhoneLightBottom | 390 × 4094 | the split's second half |

Resized wrappers:
- GuideOnStalePhone: 6910
- GuideVsPhoneLight: 6350
- GuideGuidesPhoneLight: 5180
- GuideLearnPhoneLight: now the top half, 3976

canvas.json needs the base sizes updated:
- GuideOn: 390 × 6910
- GuideVs: 390 × 6350
- GuideLearn: 390 × 3976
- GuideGuides: 390 × 5180

## Verification
- **rtscan** (all 40 Guide*/Intl*/A11y* boards): 0 flagged.
- **GuideSmoke.mjs:** 243 combinations, 0 failures.
- **IntlA11y-smoke.mjs:** 7128 combinations, 0 missing.
- **Owner padding probe:** every hit is either the shared P-HEADER (see open questions) or a code token inside a horizontal-scroll code block.
- **Screenshots checked:**
  - the A11y and Intl tablet boards
  - the desktop panel open
  - the phone and tablet footers
  - both edges of the GuideLearn split

## Open questions
1. **hreflang on fallback rows.**
   - P-LANG says to drop `hreflang` when a row falls back to the locale home.
   - But AT-LANG v1 moves between rows with `a[hreflang]`, so rows without the attribute would be skipped by the arrow keys.
   - I kept `hreflang` on every row. It is still accurate, because the linked home page is in that language.
   - Suggestion: AT-LANG v2 selects rows with `a[lang]` instead, and the fallback rows drop `hreflang`.
2. **Shared header vs the padding rule.** The P-HEADER theme switch sits 8 px (phone) or 12 px (tablet and desktop) from the top edge on every board, from the 60/68 px header with its 52 px control. It is a shared primitive, so I did not change it. The owner padding rule (16 px minimum) would need a lead decision.
3. **Split board name.** `GuideLearnPhoneLightBottom` is not in the GAPS name list. The brief allowed splitting, so I added it as the second half.
