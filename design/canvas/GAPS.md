# Gap-closing brief (27 Sep 2026, lead takeover after the cloud session stopped)

Repo: /Users/soubhik/Work/github/awaketab, branch `redesign/clear-night`. $C = design/canvas.

Read first:
- `HANDOFF.md` §2 (owner preferences)
- `docs/redesign/DECISIONS.md` (all decided; law)
- `DESIGN.md` (§11 strict spec, §4 time format, §11.4 keycap)
- `design/canvas/PRIMITIVES.md` (the ONE shared header / footer / pill / segmented bar / keycap: copy it verbatim)
- `docs/redesign/agent-brief.md` (format rules, accuracy and copy corrections)

Node 22: `export PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH`.

> **Update 27 Sep, 11:05 AM (after merging the cloud commits 074013c..a7ee4c1):** D-R20 (Stop and strong buttons follow the theme) is DONE on every base file by the cloud agent, and the ExtPopup/ExtEdge spacing is fixed (owner threads 7ef7a6c0 and 2118d3c5). Do NOT redo those; just keep them and apply D-R20 to any NEW markup. The language switcher spec is in PRIMITIVES.md section P-LANG; the markup snippets are in `tools/gap-b/lang-footer.html` and `lang-settings.html`, with the inserter `tools/gap-b/addlang.py`. Agent A's first run already created these wrappers (verify them, do not recreate): ToolStatsDesk, ToolStatsTablet, ToolSettingsTablet, ExtrasTabletRating, SysCheckoutSuccessPhone, SysCheckoutFailedPhone, SysCheckoutSuccessTablet, SysProLapsedPhone, AmbientClockTablet. Owner padding rule: nothing textual or interactive may sit flush against a board, card, sheet or panel edge (min 16 px; 20 px below the final row of actions).

## Rules
1. **Ownership.** Edit ONLY the files in your list. Create new wrapper boards only with the names given. Do not edit `canvas.json`, `sections.json`, `status.json` or another agent's files. Report cross-file issues.
2. **Keep every prop working.** Other boards import base files: Main alone is mounted by ~60. Never re-run the old wrapper generators (see `tools/final/setup.sh` note).
3. **No duplicates (D-R18).** A new board must differ from every existing board in page, state, size or theme.
4. **Verify with the REAL canvas runtime** (mandatory): `design/canvas/tools/final/rtscan.sh <Files...>`. It must report 0 flagged for your files. Also run the relevant smoke test(s) for your base files (they rewrite nothing unless `WRITE_WRAPPERS=1`) and `python3 design/canvas/tools/final/check.py` / `node design/canvas/tools/final/analyze.mjs` on your boards if they accept a file list.
5. **Wrappers.** A new wrapper is a ~550-byte `.dc.html` with a fixed-size root div, one `<dc-import name="Base" layout=… theme=… (state props) hint-size="Wpx,Hpx">` and `$preview` = the same size. Copy the shape of an existing wrapper exactly. Height = the base's natural height at that layout: measure it with rtscan or the base's `SIZES` table. Boards must be ≤ 8000 tall; split top/bottom if taller.

## D-R20: buttons follow the theme (owner, canvas thread 84d59664)
No button may use the opposite theme's colours. Stop, and every other ink-filled button (Retry / Try again, Stop in the popup, floating window, embed, kiosk, Extras, Sys, Growth, Pro manage and similar), becomes:
- **Fill:** background `raised` (#26324B dark / #E3E9F1 light).
- **Text and border:** text `ink` (#EAF0F7 dark / #0E1726 light), 1 px `line-strong` (#33405C dark / #C3CDDA light).
- **Metrics:** same height, radius and weight as today.

The lamp CTA stays the only coloured primary. +15 min and other secondaries stay outlined. OLED uses dark values. Night mode uses the night tokens.

## Language switcher (new component; decision O-60 / owner gap list)
Put one spec in PRIMITIVES.md; every page footer and the tool Settings get it.
- **Footer control:** a 44 px button with a 16 px globe icon and the current language's native name ("English"), plus a chevron. It opens an **inline list, not a modal** (a bottom sheet on phone ≤ 599 px). The list shows the 8 locales in native names in this order: English, Español, Português (Brasil), Deutsch, Français, 日本語, 中文（简体）, हिन्दी.
  - The current language is marked with a lamp dot and "Current". Locales not yet reviewed show a muted "Translation in review".
  - Each row is a real link to the same page in that locale: `/`, `/es/`, `/pt-br/`, `/de/`, `/fr/`, `/ja/`, `/zh/`, `/hi/` plus the path.
  - Each option carries `lang` and `hreflang`. Rows are 48 px, the radio-style list is keyboard operable, and Esc closes it.
- **Settings row (tool):** "Language", showing the current native name, opens the same list inline in the sheet.

## Assignments

### Agent A: tool family
**Files:** Main, all Main wrappers (Ring*/Bold*/Horizon*/Tide*/Paused*/Blocked*/Done*/UntilDark/UntilLight/Desk*/Tool*/Size*/Edge*), Extras*, Pip*, Ambient*, Sys*.

**Work:**
- Apply D-R20 to every button in those files.
- Add a language row to Main's Settings sheet.
- New boards:
  - `ToolStatsDesk` (desktop 1280×800, light, sheet stats)
  - `ToolStatsTablet` (tablet 820×1180, dark, stats)
  - `ToolSettingsTablet` (tablet, light, settings)
  - `ExtrasTabletRating` (tablet, light, kind rating)
  - `SysCheckoutSuccessPhone` (phone, dark)
  - `SysCheckoutFailedPhone` (phone, light)
  - `SysProLapsedPhone` (phone, dark)
  - `SysCheckoutSuccessTablet` (tablet, light)
  - `AmbientClockTablet`: only if no tablet clock board exists (Ambient cook tablets exist).

### Agent B: content family
**Files:** ContentArticle*, HubFor*, HomeBelow*, Guide* (edit `$C/GuideGen.mjs` for GuideOn/GuideVs/GuideLearn/GuideGuides and regenerate), PresetPage/Preset*, UntilPage/UntilPhoneLight/UntilDeskDark, Intl*, A11y*.

**Work:**
- Apply D-R20.
- Add the footer language switcher to every content page.
- New boards:
  - Tablet 820 wide for HomeBelow (`HomeBelowTablet`, dark), HubFor (`HubForTablet`, dark), GuideOn (`GuideOnTablet`, dark), GuideVs (`GuideVsTablet`, light), GuideLearn (`GuideLearnTablet`, light), GuideGuides (`GuideGuidesTablet`, dark), UntilPage (`UntilTablet`, dark), Intl (`IntlJaTablet`, light), A11y (`A11yReducedTablet`, dark).
  - Missing dark: `HubForDeskDark`, `HomeBelowPhoneDarkAlt` only if HomeBelow has no dark board (check existing themes first), `GuideOnPhoneDark` (or the desktop dark variant), `GuideGuidesDeskDark`.
- **The four other hubs** `/on`, `/vs`, `/guides`, `/learn`: extend HubFor with a `hub` prop (for | on | vs | guides | learn), with real titles and descriptions from `apps/web/src/content/{on,vs,guides,learn}/en/*.md` frontmatter. Group them sensibly:
  - on: by platform (phones, tablets, computers, browsers)
  - vs: by kind of alternative
  - guides: by OS
  - learn: by topic

  Apply the SEO/content decisions: honest descriptions, and no testing claims we cannot back. Add wrappers `HubOnPhoneDark`, `HubOnDeskLight`, `HubVsPhoneLight`, `HubVsDeskDark`, `HubGuidesPhoneDark`, `HubGuidesDeskLight`, `HubLearnPhoneLight`, `HubLearnDeskDark`.
- A language switcher showcase board `LangSwitcherPhoneDark` (phone, list open) and `LangSwitcherDeskLight` (desktop footer, list open), mounting HubFor or HomeBelow with a prop that opens the list.

### Agent C: product and business family
**Files:** Pro*, ProActivate*, ProManage*, ExtPopup*, ExtOptions*, ExtBadges, ExtEdge*, Welcome*, Embed*, EmbedEdge*, EmbedCook*, EmbedShowcase, Page* (404, About, Changelog, Extension, Kiosk, Legal, Library), Kiosk*, Og*, Store*, IconSet, Growth*, Brand.

**Work:**
- Apply D-R20 everywhere.
- Add the footer language switcher to every web page (Pro, Activate, Manage, Page*, EmbedShowcase). The extension options get a Language row in its "Look and language" section.
- New boards:
  - `EmbedShowcasePhone` (phone 390, dark) and `EmbedShowcaseTablet` (tablet 820, light). Make EmbedShowcase responsive via `layout` if it is desktop-only.
  - Tablet 820: `PageKioskTablet` (light), `PageLibraryTablet` (dark), `PageExtensionTablet` (light), `PageAboutTablet` (dark), `PageChangelogTablet` (light), `PageLegalTablet` (dark, privacy), `Page404Tablet` (light), `ProActivateTablet` (dark), `ProManageTablet` (light).
  - Missing size/theme: `PageAboutPhoneDark`, `PageChangelogDeskLight`, `PageLibraryPhoneLight`.
- Brand board: add D-R20 (the button family chart) and the language switcher to the component inventory.

## Return (each agent)
- Files changed and new boards as JSON `{"File.dc.html": {"w":..,"h":..,"title":"..","section":"<existing section title or NEW: title>","is_interactive":true}}`.
- rtscan result (0 flagged for your files).
- Smoke results.
- Open questions.
- Also write `docs/research/gaps-<A|B|C>.md` (short report).
