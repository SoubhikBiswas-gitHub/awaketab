# Audit B: Pro, extension, embed and brand boards (27 September 2026)

An audit agent rendered each board in Chromium (131 renders across layout × theme × state, plus all 248 project boards for the consistency check). It checked overflow, 44 px targets, WCAG contrast against the real background pixels, tokens, copy, theme parity and motion, then fixed its assigned files. Renders, backups and the full consistency matrix are in the session scratchpad (`audit-b/`: after/, before/, orig/, consistency-after.txt). Those files are temporary; this document is the record.

## Result (assigned boards, 131 renders)
| Check | Before | After |
|---|---|---|
| Overflow, clipping, overlap | 17 | 0 |
| Targets < 44 px | 225 | 50 (all in the compact 320×96 embed, exempt) |
| Contrast failures | 147 | 0 |
| Transient (only while the sweep glow passes behind the text) | 95 | 56 |
| Overlapping controls | 2 | 0 |
| Input/select border contrast | 52 | 52 (needs a system decision) |
| Off-palette colours | 54 | 21 (mock host page and Chrome toolbar greys only) |
| Motion issues | 3 | 0 |
| Pill copy variants / missing holes / errors | 0 / 0 / 0 | 0 / 0 / 0 |

Smoke tests stayed green: ProSmoke (783 combinations) and the extension smoke test (12,602 holes).

## Main fixes
- **EmbedWidget:** below about 600 px wide the pill, timers and digits overlapped; now it stacks. Moved to the §11 metrics (38 px pill, radii, targets). Copy now says "while this page is visible".
- **Pro:**
  - Fixed nav target sizes and light-theme contrast (cards on surface, not on translucent tints).
  - Type scale moved to §11.5.
  - Copy: no struck-out $29, dated launch price, "Get yearly Pro" / "Get lifetime Pro", honest lifetime value line.
- **ProActivate / ProManage:** targets, type, input 48 px with radius 8, "Retry", token reds.
- **ExtPopup:** header 60 px, logo aligned with Main, pill 38 px, targets 44 px, contrast of "Open AwakeTab".
- **ExtOptions:**
  - The layout transition no longer animates width or left.
  - Palette and type fixed.
  - Segmented bars are 44 px.
  - Locked Pro sections use disabled controls instead of opacity 0.7, which had failed contrast.
  - Sync copy fixed.
- **EmbedShowcase:** added "Buy an Embed licence · $29 / year per site" and "Activate an Embed key". Also fixed targets, contrast and reduced-motion scope.
- **Brand:**
  - Rebuilt with the AA light lamps and the four named lamp colours with contrast and gates.
  - Added the seven-state colour map.
  - The pill shows the exact string with the time outside it, and uses AM/PM samples.
- **Focus rings** follow the theme's lamp colour.

## Exemptions kept on purpose
- The compact embed at 320×96 cannot fit 44 px targets. Proposal: a 320×104 compact size (owner decision O-58).
- Heatmap cells use a 5 px radius. The Message preview uses 32/40 px type to imitate the ambient screen.
- The recipe-site mock keeps Georgia and warm greys, and the Chrome toolbar mocks keep Chrome's greys.

## Left for other owners (fix batches)
- **DESIGN.md §11:**
  - Input/select borders on `line-strong` are 1.72:1 (dark) and 1.61:1 (light), below the 3:1 non-text rule (O-56).
  - The light ground's last gradient stop #E7EEF6 drops lamp text to 4.28:1 (O-57).
  - The theme switch uses 3 px padding, but the spec says 4 px.
- **Main and tool boards:** presets are 46 px and face tabs 38 px on some boards; the spec is 44. Muted text over the sweep is transient.
- **Header heights off 60/68:** Content, Guide, Hub and Page boards (52 boards), SysUpdate, and Size and Store logo metrics.
- **Pills that aren't 38/15:** Pip and Kiosk (probably intentional). Also AmbientMinimalDesk, Intl, A11y, Size, SysUpdate, Growth, EmbedCook and EmbedEdge.
- **Reduced motion:** EmbedCook and EmbedEdge scope it to `.atw *` / `.ee *` and miss the root.
- **Missing holes:** GuideOn (`w.what`, `w.soft` …) and GuideVs (`r.same`, `r.us` …).
- **Font weights above 600:** EmbedEdge, PageChangelog, PageExtension and StoreShot2.
- **Borders other than 1 px:** ToolSettings, AmbientFocusDesk and Kiosk.
- **Off-palette near-misses:** about 30 base files.
- **Radius and type-scale deviations:** about 115 boards.
- **Canvas sizes:** the Pro boards can shrink after the type fixes (about 7360 / 5580 / 5140).
