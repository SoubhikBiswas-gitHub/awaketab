# Gap agent D: embed family (27 Sep 2026)

Brief: `design/canvas/GAPS.md` (the embed part of agent C's list, handed to D). Files: EmbedWidget, EmbedShowcase, EmbedCompactLight, EmbedFullDark, EmbedEdge*, EmbedCook*. Agent C had not started on these files (`git diff` was empty), so this work started from the committed versions.

## What changed
- **EmbedShowcase (/embed) is responsive.** The `layout` prop now accepts phone | tablet | desktop.
  - Desktop keeps its two columns (704 px + the rest).
  - Tablet (32 px gutter) and phone (16 px gutter) use one column. The column wrappers switch to `display: contents` and the sections carry `order`, so the reading order is: demo page, Install, Your snippet, Free or licensed.
  - On phone the placeholder recipe page tightens (16 px padding, no nav bars, 28 px title, 120 px photo, Ingredients above Method). The full-width widget fills the host column there (324 px), so Cook stacks its timers (420 px tall, labelled "100% × 420").
  - Heights come from the `PAGE_H` table (natural height per layout, size and mode, measured with the real runtime): desktop 1552 / 1688, tablet 2456 / 2592, phone 2961 / 3097 / 3277 (full-width Cook).
- **New wrappers:** `EmbedShowcasePhone` (390 × 2961, dark) and `EmbedShowcaseTablet` (820 × 2456, light). Both copy the existing wrapper shape.
- **Footer language switcher (P-LANG) on EmbedShowcase.** It uses the verbatim footer markup, the AT-LANG v1 JS (identical to Main) and the `.at-chev` helmet rule. A `language` prop (closed | open) opens the list. The rows link to `/embed` in each locale. 2b tokens have no `inputBorder`, so the file passes `t` with `inputBorder: t.inputLine`, which is the same hex.
- **O-47 (visible nofollow credit).** "Keep awake by AwakeTab" is no longer inside the frame (EmbedWidget, EmbedCook, and the two widget mocks in EmbedEdge). It now appears only in the host page's own HTML, as a `rel="nofollow"` link under the widget: on the Showcase demo page, and on EmbedEdge's host page, where it hides when Licensed is on. The Showcase snippet still shows it as the second line. EmbedEdge's caption now reads "free, credit line in the page's own HTML".
- **O-58 and the owner padding rule on the compact 320 × 104 frame.** The frame now has 16 px padding on every side. The pill sits above the digits, and Start/Stop is in its own column, 20 px from the bottom edge.
  - The digit button (44 px hit area) is lifted 4 px under the non-interactive pill, so it also clears the bottom by 20 px.
  - Minimal mode on compact uses a shorter live note, "On while this page is visible.", so the note fits in two lines.
  - The earlier layout (12 px padding with the credit on the pill row) could not fit the credit and 16/20 px padding in 104 px.
- **EmbedEdge.**
  - The widget mocks use the same geometry. A long state ("Blocked — here's the fix", "Tap to use the fallback", "Awake via video fallback") takes the full width, and the frame grows to 116 px, like the existing "grows for a notice".
  - The notice band now has 16/16/20 px padding.
  - The mock browser bar is 56 px with a 32 px field (the URL text was 13 px from the frame edge).
  - `STACK_H` was re-measured with the real runtime. Most values moved by 2 px or less. Running phone grew 26 px because the caption is longer.
- **EmbedShowcase mock browser bar** is 56 px, so "Placeholder site" sits 16 px from the edge. The code box has 20 px padding below the Copy button.
- **Runtime bug fixed.** In the real canvas runtime, a `style` attribute that *starts* with a `{{hole}}` followed by literal text is dropped. So the Showcase kicker ("AwakeTab Embed"), "No payment is taken…", the EmbedEdge kicker and the digit fonts had lost their styles. Each one now starts with a literal (`margin: 0; …`). Other agents' files may have the same pattern: search for `style="\{\{[^}]*\}\}[^"]+"`.
- **D-R20** was already applied to these files (`smallStop` / `stop` = raised + line-strong + ink). No new strong buttons were added. The Stop buttons were checked in dark and light screenshots.
- **O-29:** the "Licences open soon" tag and "No payment is taken until a purchase can set up your domain" are unchanged, and the free widget is described as available now.
- EmbedWidget props are unchanged (theme, size, mode, running, width, layout). EmbedShowcase gained phone/tablet `layout` values and `language`.

## Verification
- `tools/final/rtscan.sh` on all 14 embed boards: 12 clean. The 2 flagged are `EmbedCompactLight` and `EmbedCookCompact`: "nodes 21 < 40" on a 320 × 104 frame. They were already flagged before this work (20 nodes), and the frame has fewer elements now that the credit is outside it. This comes from the scanner's node-count threshold, not from an empty board (no errors, no overflow, text present).
- Real-runtime probe of every Showcase layout × size × mode and every EmbedEdge edge × layout × licence: no console errors, no horizontal overflow. Natural heights match the tables above. The only padding hits left are in the shared P-HEADER (44 px targets in a 60/68 px bar) and the P-LANG rows (panel padding 4 + row padding 12 = text 16 px from the edge), which are both shared-primitive geometry.
- `tools/ext-tools/smoke.mjs`: 13,397 holes, 0 missing. `tools/bigscreens/smoke.mjs`: 675 combinations, 0 failures.
- `fix1b/render.mjs '^Embed'`, then `final/analyze.mjs` / `final/check.py`: 0 boards with issues. The analyzer reports 9 `mono-for-text` in EmbedShowcase: these are the snippet code spans, where mono is allowed.

## Open questions and cross-file items
1. **O-47 scope:** is it right to take the credit *out* of the frame (as done here), or should the frame keep a credit as well as the host line? Keeping both does not fit 320 × 104 under the padding rule.
2. `docs/11-embed-spec.md` (lines 18, 44, 46) still says compact is 320×96 and puts the "Keep awake by AwakeTab" line inside the widget. `docs/redesign/ui-inventory.md:35` says the same. Both need the O-58 and O-47 wording (not in D's file list).
3. `sections.json` / `canvas.json` (lead): board titles "Embed · Compact 320 × 96 · light" and "/embed/cook · 320×96 running" should read 320 × 104. EmbedShowcase is now 1280 × 1552 (was 1548).
4. `KioskScreen.dc.html:124` (not D's) still has an in-frame `rel="noopener"` credit.
5. rtscan's `nodes < 40` rule flags the two 320 × 104 compact boards by design. Should the lead exempt them, or should those boards be enlarged to show the frame on a host page?
