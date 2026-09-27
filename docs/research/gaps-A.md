# Gap agent A: tool family (27 Sep 2026)

Brief: `design/canvas/GAPS.md`, assignment "Agent A: tool family". Files: Main and its wrappers, Extras*, Pip*, Ambient*, Sys*.

## What changed

- **D-R20 (verified, not redone).** The cloud agent's raised Stop tokens are in Main, Extras, Ambient, PipWindow and Sys (`primaryBg` / `stopBg` = raised, `primaryInk` = ink, `primaryLine` = line-strong; Ambient night uses the night tokens). No ink-filled neutral button is left. `tools/final/gapA-smoke.mjs` now checks the token values instead of the old names.
- **Language row in Main's Settings (P-LANG, settings variant).** It is the first row of the Time section, which is now titled "Language and time" because "Clock format: Follow language" sits right below it. The list opens inline in the sheet and pushes the rows below it down. There is a new `language` prop (`closed` | `open`, default `closed`). Every other Main prop is unchanged, and the 59 boards that mount Main still render.
- **Sys:**
  - Checkout now has a real tablet layout (820, one column). Pro lapsed now has phone and tablet layouts: the notice stacks on phone, the manage page is one column, and on phone the device rows put the date under the name. The other kinds still map tablet to desktop.
  - The P-LANG footer control is in both Sys page footers. The Pro pages are English only, so each other locale links to its home page.
- **Owner padding rule (min 16 px; 20 px below the last row of actions).** A real-runtime scan of all 88 tool-family boards found these, and all are fixed:
  - Main Until, Custom and More panels: 12 → 16/16/20. In the "time already passed" note, "Change time" is now a text button, so the Edge board's CTA stays 20 px above the board edge.
  - Main time's-up card: 16/16/20. At 320 × 568 it uses 44 px buttons and 8 px gaps. It used to overflow the board by 8 px.
  - Main, Extras and Sys toasts: padding 8 8 8 16 and min-height 60, matching Sys. The toast action ("Reload") is now a text button instead of an outlined button 4 px from the edge.
  - PiP window: padding 16/16/20 and an 8 px gap. It still fits 280 × 120 and 280 × 160.
  - Ambient: the cook timer cards have 16 px padding, and the phone control bar has 20 px below it.
  - Sys: device table 20 px under the last Remove, phone device rows padded 16, lapsed notice 20 px at the bottom, and the macOS and Windows notification mocks padded 16.
- **Runtime bug found and fixed in Sys.** The real runtime drops a whole `style` when it starts with a `{{hole}}` and has a second hole (`{{btnPrimary}}; {{co.btnFlex}}`, `{{card}}; … {{lapse.line}}`). Because of this, the checkout failed/cancelled/help action buttons and the lapsed panel card were rendering unstyled. The styles are now joined in JS (`co.btnP`, `co.btnM`, `lp.card`, `lp.dateCell`). Every `style="{{x}}; …"` in these files also starts with the literal `--dc: 0;`. `grep -E 'style="\{\{[^}]*\}\}[^"]+"'` finds 0 in the tool-family files.

## New and resized boards (natural heights measured in the real runtime)

| Board | Size | Note |
|---|---|---|
| ToolStatsDesk | 1280 × 800 | verified |
| ToolStatsTablet | 820 × 1180 | verified |
| ToolSettingsTablet | 820 × 1180 | `language="open"` now works |
| ExtrasTabletRating | 820 × 1180 | verified |
| AmbientClockTablet | 1180 × 820 | Ambient's tablet is landscape; no other tablet clock board |
| SysCheckoutSuccessPhone | 390 × 1659 | was 1660 |
| SysCheckoutFailedPhone | 390 × 1413 | was 1312 (buttons now render) |
| SysCheckoutSuccessTablet | 820 × 1445 | was 1420, and rendered the desktop page |
| SysProLapsedPhone | 390 × 2966 | was 2824, and rendered the desktop page |
| SysProLapsed (existing) | 1280 × 2055 | was 2044; canvas.json needs the new height |

## Verification

- `tools/final/rtscan.sh` on all 88 tool-family boards: 0 flagged on the first run.
  - The later version of rtscan.mjs adds an EDGE rule. It flags 5 sheet boards: ToolSettingsDark, ToolSettingsLight, ToolSettingsDesk, ToolSettingsTablet and ToolStats.
  - The only real hit was the sheet Close button (`margin-inline-end: -12px`, 8 px from the edge), and it is fixed.
  - The rest are controls that the Settings/Stats sheet has scrolled below the fold, so their boxes lie past the board bottom.
  - A copy of rtscan that skips controls cut off by a scrolling ancestor (`gapA/rtscan-clip.mjs` in the scratchpad) reports 0 flagged on all 88 boards (applied to `tools/final/rtscan.mjs` on 27 Sep; the whole canvas now scans with 0 flagged). The patch is one line after the visibility check: skip `e` when an ancestor with `overflow-y: auto|scroll` that reaches the board bottom clips it.
- Smoke tests:
  - `gapA-smoke.mjs`: ALL PASS.
  - `tool-backup/tool-smoke.mjs`: ALL PASS.
  - `SizeSmoke.mjs`: 42,899 combos, 0 failures. It was run from a copy with the wrapper writer disabled, because this script rewrites the Size/Edge wrappers unconditionally.
  - `fix1b/xap/ambient-smoke-w.mjs`: 0 missing.
  - `fix1b/xap/extras-test.mjs`: 0 missing.
- Static audit (`fix1b/render.mjs`, then `final/check.py` and `final/analyze.mjs`): 0 check issues. analyze.mjs reports only the existing 42 px multi-day digits on EdgeLongNoLimit, which are display digits.

## Left as is (exempt or out of scope)

- Header icon buttons sit 8 px (phone) or 12 px (68 px header) from the board top. This is the shared P-HEADER geometry and would need a PRIMITIVES change.
- The phone mocks inside SysUpdate and SysInstalledPhone are scaled (0.83 to 0.87), so their 16 px gutters measure 14 to 15 px. The browser tab strip mock in SysInstalledDesk is third-party chrome.
- Sheets that scroll (ToolSettingsTablet with the list open, ToolStats on phone) end mid-content at the board edge by design.

## Open questions

- P-LANG says to drop `hreflang` on rows whose page has no translation, but the shared `atLang` key handler finds rows with `a[hreflang]`. Sys keeps `hreflang` on every row. The spec needs one answer, for example a `data-lang-row` hook.
- The "Language and time" heading in the tool Settings is new copy. It needs a `settings.section.languageTime` key if it is kept.
- The two-hole style pattern was also in files owned by other agents (Embed*, Page*, KioskScreen, OgCards, IconSet). By the end of this run the grep found 0 matches in the whole project.
