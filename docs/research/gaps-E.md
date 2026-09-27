# Gap agent E: web pages (Page*) report, 27 September 2026

Scope: GAPS.md Agent C "Page*" set, handed to agent E: Page404, PageAbout, PageChangelog, PageExtension, PageKiosk, PageLegal, PageLibrary and their wrappers. Agent C had not started on these files, so nothing needed finishing. Nothing is committed.

## What changed
- **Footer language switcher (P-LANG)** on all 7 bases. It has the footer markup from `tools/gap-b/lang-footer.html`, the AT-LANG v1 JS copied verbatim from PRIMITIVES.md, `.at-chev`, and a `language` prop (closed | open) that seeds `langOpen` and follows prop changes. It is wired once in the shared `shell()`, and the 2b tokens pass `inputLine` as `inputBorder`.
  - None of these pages is translated, so `atLangHome()` points every non-English row at that locale's home (`/es/` …) and drops `hreflang` (set to empty; the runtime keeps the attribute, so arrow-key navigation still works). The English row links to the page itself: `/about`, `/changelog`, `/extension`, `/kiosk`, `/library`, `/privacy` or `/terms` (from the `doc` prop), and `/` for the 404.
  - Checked in the real runtime: the phone sheet (`dialog`), the tablet and desktop popover (`group`), focus moving to the current row, ↓/↑ with wrap, End, and Esc returning focus to the trigger.
- **Runtime style bug, fixed in these files.** The canvas runtime reads an attribute that starts with `{{` and ends with `}}` as one single hole. So `style="{{ty.kicker}}; color: {{t.muted}}"` rendered with no style at all: kickers, `ty.small` lines, mono code labels and digit spans lost their styling. 41 such attributes are now fixed with a trailing `;`. Following the lead's rule, every `style="{{x}}; …"` in Page404, PageAbout, PageChangelog, PageExtension, PageKiosk, PageLegal, PageLibrary and **Sys** also starts with `--dc: 0; ` (0 left according to the grep).
- **PageExtension popup preview** (owner threads 7ef7a6c0 and 2118d3c5; only the page's container changed, not ExtPopup):
  - The card is the 360 × 600 popup plus its 1 px border, so 362 × 602. The old 360 × 600 stage let it spill 2 px, which left it 14 px from the edge on phone.
  - The stage now has 16 px padding on every side. The desktop hero column is 394 wide. On phone the stage bleeds into the gutters, so the card scales 358/362 and sits 16 px from each board edge.
  - Checked with the real runtime at phone, tablet and desktop, for Screen and System: the pill ("Screen awake" / "System awake") shows in full, 45–46 px of room below "Open AwakeTab", and 16 px clear around the card.
- **Owner padding rule:**
  - Kiosk "Your kiosk link" well: padding 4 4 4 16 → 16, and the filled Copy button is no longer flush.
  - Library code block wraps lines (grid with a hanging indent under the line numbers) instead of clipping text at the card edge on phone.
  - Kiosk Theme and Duration are stacked on tablet too; side by side, the theme bar truncated "OLED bla…".
- **Heights** are natural heights measured with the real runtime (root `height: auto`), written to each base's `SIZES` and `$preview`. PageKiosk gets `SIZES_LIC` for `licensed=true`. Every board is ≤ 8000.
- **Copy decisions:** O-72 "How AwakeTab is checked", O-86 "Builds AwakeTab" and O-39 "npm package coming soon" (no GitHub or npm 404 links) were already in place. D-R20 is kept: Stop and Release use raised / ink / line-strong. The new markup adds no ink-filled buttons.

## Boards (wrapper heights)
New: PageKioskTablet 820×3598 (light) · PageLibraryTablet 820×3483 (dark) · PageExtensionTablet 820×4561 (light) · PageAboutTablet 820×2348 (dark) · PageChangelogTablet 820×5877 (light) · PageLegalTablet 820×4733 (dark, privacy) · Page404Tablet 820×1702 (light) · PageAboutPhoneDark 390×3156 · PageChangelogDeskLight 1280×5945 · PageLibraryPhoneLight 390×4470.

Existing, re-measured: PageKioskDesk 1280×2983 · PageKioskPhone 390×4353 · PageLibraryDesk 1280×3104 · PageExtensionDesk 1280×3545 · PageExtensionPhone 390×5624 · PageAboutDesk 1280×2066 · PageChangelogPhone 390×7894 · PagePrivacyDesk 1280×4311 · PageTermsPhone 390×2286 · Page404Phone 390×1588 · Page404Desk 1280×1039.

Base (▶) previews: PageKiosk 1280×2983 · PageLibrary 1280×3104 · PageExtension 1280×3545 · PageAbout 1280×2066 · PageLegal 1280×4311 · PageChangelog 390×7894 · Page404 390×1588.

**D-R18 theme flips re-applied.** PageKioskDesk, PageLibraryDesk, PageChangelogPhone and Page404Phone are light again, matching `dedupe-applied.json` "flip" and their canvas titles. The pages smoke imported `wrappers.mjs`, which rewrote the wrappers on every run and had reverted them to dark. `wrappers.mjs` now writes only with `WRITE_WRAPPERS=1`, and its list holds all 21 wrappers with the measured heights.

## Verification
- `tools/final/rtscan.sh` (real runtime) on the 28 Page boards: 0 flagged. With Sys* included, 43 scanned, 0 flagged.
- `tools/pages-agent/smoke.mjs`: 324 prop combinations (the language axis is added), 0 missing holes. New lang section: 7 pages × 3 layouts, locale order, locale-home links, `hreflang`, open/close, Esc, and `language=open` seeding. It also checks that the wrapper sizes equal `SIZES`. `tools/final/gapA-smoke.mjs` (covers Sys): ALL PASS.
- `fix1b/render.mjs` dumps then `final/analyze.mjs`: only "mono-for-text" on real code tokens (PageLegal `source: ext`, PageLibrary `$` prompt). These are false positives, visible only now because those mono styles render. `final/check.py`: 0 issues. `primvariance.py`: one footer-link hit, which is the About aside's 15 px Changelog link, not the footer.
- Padding-rule checker (real runtime, scratchpad `gapE/padcheck.mjs`) on the 21 wrappers: 0. The header is excluded because it is the fixed P-HEADER primitive; transparent buttons and links are measured by their text.

## Cross-file issues (not mine to fix)
- The same two-hole `style` drop exists in EmbedCook, EmbedEdge, EmbedShowcase (2), EmbedWidget, IconSet, KioskScreen and OgCards. Their kickers, digit fonts and mono text currently render unstyled in the real canvas.
- `canvas.json` / `sections.json` need the new boards, and new heights for the existing ones listed above.
- P-LANG popover: the rows sit 4 px inside the panel (spec padding 4, rows r12). This is a shared primitive; I left it as specified.
- PageLibrary code tabs have different line counts. The board height fits the default ESM tab; CDN wraps more on phone in Tweaks.

## Open questions
None for the owner.
