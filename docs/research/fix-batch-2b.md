# Fix batch 2b: embed, pages, kiosk, OG, icons, system states (27 September 2026, cloud agent)

Scope: Embed*, EmbedEdge*, EmbedCook*, Page*, Kiosk*, Og*, IconSet, Sys* (66 boards).

## Finding at resume
Most of 2b was already done before the local stop:

- **Owner comment 5143c842:** OgDevice "24:18" is on one line.
- **Decisions in the copy:**
  - O-58: the compact embed is 320 × 104.
  - O-18: the sidebar widget asks the host for 24 px more.
  - O-19: tab titles "Paused · 24:18 left" and "Blocked · AwakeTab", plus a favicon shape per state.
  - O-29: "Licences open soon", with no Embed buy button.
  - O-31/O-34: the logo is Kiosk only.
  - O-39: "npm package coming soon".
  - O-41: no Brave/Arc/Opera or AMP claims; the embed discloses its start and end counts, including the host domain.
  - O-47: a visible nofollow credit in the host page's HTML.
  - O-69: a message needs a Kiosk licence or Pro, with a 60 s preview.
  - O-04, O-56 and O-57.
- **Not applicable:** O-44. No board mentions staging.
- **Keycaps:** every `<kbd>` follows §11.4. The last byte differences go in the O-77 merge.

## Fixed in this pass
- **PageLibrary:**
  - H1 "the honest wake lock library" is now "a wake lock that says when it works" (O-40: never "honest" in a headline).
  - The table row "Honest state" is now "State reporting".
  - Two code comments were cut off at the card edge; they are now short enough to fit.
  - State-diagram edge labels are in the UI font; only `request()` stays mono.
- **Sys:** two scaled phone previews of Main are marked `data-placeholder` (device mocks, §11.2), like the third one already was.
- **All Page\*/Embed\*/Kiosk\*/Sys\*:** header nav and footer links are at least 44 px wide (done in batch 2a through the shared `atHeader`/`atFooter` helpers).

## Checks
- Smoke: pages-agent 162 combinations, 0 missing · bigscreens 678, 0 failures · ext-tools (embed) 13,308 holes, 0 missing.
- `tools/final/check.py` on all 66 boards: **0 issues**. Before, there were 44 target hits (the Sys phone previews and footer links), 4 overflow hits (Library code) and 4 false copy flags. The embed credit link "Keep awake by AwakeTab" is 24 px tall. It is an inline text link: exempt from the 44 px rule, and it meets WCAG 2.5.8.
- Checker v3: 8 hits are left.
  - Seven are code tokens written as `<span>` in code wells (`data-mode`, `source: ext`, the `$` prompt). In the build these become `<code>`.
  - One is the OG cook image's inner timer card. It is an image, not UI.
- Height mismatches between canvas.json and the rendered pages are listed in the integration step (HANDOFF §5.1).

## Open questions
None.
