# Audit A: tool, ambient, floating window, banners and content boards (27 September 2026)

1,255 Chromium renders at canvas size, with the clock fixed at 9:12 PM on 26 Sep 2026:
- 152 base-file renders: every layout × light/dark × variant.
- 59 wrapper boards.
- 1,044 renders of Main: 7 layouts × 4 themes × 9 statuses × 4 faces, plus sheets, panels, Horizon phases and edge states.

Audit A fixed its own files. It did not edit Main; the Main issues below are handed to fix batch 1a. Renders and the audit scripts are in the session scratchpad (`audit-a/`), which is temporary.

## Result (Audit A files, Main excluded)
| Check | Base before → after | Wrappers before → after |
|---|---|---|
| Text overlapping text | 8 → 0 | 0 → 0 |
| Overflow / clipping | 0 → 0 | 1 → 1 (mock spreadsheet row, intended) |
| Overlapping controls | 2 → 0 | 0 → 0 |
| Targets < 44 px | 138 → 0 | 44 → 0 |
| Low text contrast | 7 → 0 | 27 → 1 (same mock row, off-frame) |
| Input border contrast (3:1) | 22 → 0 | 4 → 0 |
| Motion, pill copy, AM/PM times | pass | pass |

## Fixes
- **Extras:**
  - The toast stack no longer covers Stop.
  - Nav targets are now 44 px.
  - Rating and share inputs use a muted border that meets 3:1.
  - Colours outside the palette were replaced.
  - The denied card now reads "Your browser said no", with the Safari-tap copy and a Retry button. It no longer blames the battery saver.
  - "floating timer" was renamed to "floating window".
- **PipWindow:**
  - "until" no longer overlaps the pill on the fallback screen.
  - The title copy was fixed.
  - The mock spreadsheet greys now reach 4.5:1.
- **Ambient:**
  - Cook input borders were raised to 3:1.
  - The "Done at" line now passes contrast.
  - Tick and done colours now come from the palette.
  - Wrapper attributes changed to `cook-seed` / `focus-state`, because HTML lowercases attribute names and the camel-case ones never reached the component.
- **ContentArticle, HubFor, HomeBelow:**
  - Targets and footer links are now 44 px.
  - The hover tint now comes from the palette.
  - Copy corrections applied: no battery-saver blame, no "Split View", no "floating pill", no untestable claims, "screen" not "computer", ∞ / Until I stop, "wake lock".
- **HomeBelowPhone:** it was 9,120 px, over the 8,000 px limit. It is now split into part 1 (390×4920) and `HomeBelowPhoneEnd` (390×4200).

## Left for Main (handed to fix batch 1a)
1. **Blocked card copy:** replace the battery-saver line, rename "Try again" to Retry, and drop "works everywhere". Use "Your browser said no" with a line for each cause.
2. **Presets:** phones and landscape hide 45 min and 4 h. Show all seven, labelled "15 min … 4 h · ∞", with "Until I stop" as the accessible name.
3. **Stats:** remove the "Sample data / Demo numbers" note and aria prefix.
4. **Small layout:** the offline and return toasts cover the preset bar and the "More…" button.
5. **Until-time input:** its border is 1.6–1.9:1. Use `t.muted`.
6. **Tide underwater text** fails contrast in paused and blocked, and with lamp water in light:
   - drop the kicker's 0.75 opacity;
   - use dark ink on amber and red water;
   - make light `tideDeep` alpha 1.
7. **Ring kicker and meta over the sweep:** 3.4:1 in dark, 4.34:1 in light. Use `ink2`.
8. **Light CTA "Space" hint:** white at 0.7 opacity is 3.28:1. Use opacity 1.
9. **Heatmap level dots:** white on mid-level tints is 2.7:1. Use lamp ink only from level 4 up.
10. **"Pro" links:** 24×44. Set min-width to 44.
11. **Tokens:** off-spec hexes in the DARK/LIGHT objects. Map them to the DESIGN.md tokens `raised`, `sunken` and `horizon-ink`.
12. **Disabled "Stop at 15%" text:** 0.45 opacity. Disabled controls are exempt, so this is a flag only.

## Owner question
"Who tested this" is the existing section title on the home page. It sits oddly with the rule against testing claims we can't back. Rename it, for example to "How AwakeTab is checked"? (O-72)
