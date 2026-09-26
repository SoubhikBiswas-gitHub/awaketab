# Fix batch 2a: Pro, extension, welcome, store, growth, brand (27 September 2026, cloud agent)

Scope: Pro*, ExtPopup*, ExtOptions*, ExtBadges, ExtEdge*, Welcome*, Store*, Growth*, Brand (91 boards).

## Finding at resume
The local agent had finished most of 2a before it was stopped. The popup boards ExtPopupLong2h, ExtPopupOvernight, ExtPopupMultiDay and ExtPopupUnlimited existed and followed DESIGN.md §4. The decisions were already in the copy:

- O-01 Aqua/Violet free, Mint/Sky Pro.
- O-02/O-03: all ambient modes and faces are free; Message is Pro.
- O-04: no Sponsored card.
- O-05: schedules are sold only as an extension feature, and custom end sounds are gone.
- O-31: the logo is Kiosk only, "$19 one site, $49 five sites".
- O-33: the shutdown promise.
- O-38: "Pay once, no renewal", never "forever".
- O-52: "Launch price for the first 90 days after launch, then $29"; no "was $29" anywhere.
- O-37/O-53: store name "AwakeTab: Keep Screen Awake".
- O-40: tagline on the store assets.
- O-56/O-57: input border and the light ground stop.
- O-35/O-67: price only in Ready, Done or /pro.

## Fixed in this pass
- **Footer and header nav targets (all products):** footer links such as "Terms" and "About", and the header "Pro" link, were 38 × 44. Every footer link and every header nav link now has `min-width: 44px` (both primitive sets and the `atHeader`/`atFooter` helpers). This touched 2b and 1b files too, because the rule is shared.
- **Theme switch (atHeader helper):** unselected icons use `ink2` like the 1b primitive (they used `muted`). This is the first step of the O-77 merge.
- **ExtPopup O-87:** "Start · no limit" is now "Start · ∞", with the accessible name "Start, until I stop".
- **Pro:** the lamp-name preview used weight 300 on text; it is now 400 (300 is for digits only).
- **GrowthProMoment:** message-panel top padding 28 → 24 (on the scale).
- **Placeholders:** the ExtBadges icon tiles and the Welcome toolbar tile are marked `data-placeholder` (Chrome's own UI, per §11.2).
- **DESIGN.md §2.1:** the extension badge colours are now recorded. Screen is `#087B87` and System is `#2B3A67`, both with white text. The build must update docs/00 `BADGE_COLORS` and docs/10 §Badge, where the display badge is still amber `#B86E00`. Amber means "paused" in Clear Night.

## Checks
- Smoke: ProSmoke 783 combinations, 0 failures · ExtEdgeSmoke 54, 0 · ext-tools 13,308 holes, 0 missing · growth 333 combinations, 3,750 handler calls, 0 missing.
- `tools/final/check.py` (contrast, targets, overflow, copy) on all 91 boards: **0 issues**. Before, it found 118 target and 7 contrast hits. The contrast hits were render artifacts: text caught mid fade-in. The renderer now finishes entrance animations before it measures.
- Checker v3 (`tools/final/analyze.mjs`) went from 148 hits (v2, before) to 21. Every remaining hit is allowed:
  - ExtOptions dashed draft blocks and legend: "add" affordances.
  - ExtOptions 56 px legend inset: aligns with the 44 + 12 label column.
  - Welcome's 1 px divider between two content columns (§11.2).
  - The screen-reader-only h2 in ExtEdge.
  - GrowthShare's display unit "min" at 0.4em beside the digits.
  - The 520 px reserve that GrowthProMoment/GrowthTrust keep for the open side sheet.
  - The popup mock inside StoreShot5.
- Board heights unchanged.

## Open questions
None.
