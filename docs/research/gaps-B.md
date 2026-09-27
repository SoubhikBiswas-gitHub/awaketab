# Gap agent B: content family (27 Sep 2026)

Brief: `design/canvas/GAPS.md` (Agent B). Scope after the lead's split: HubFor* (plus the four other hubs), HomeBelow*, ContentArticle*, PresetPage/Preset*, UntilPage/UntilPhoneLight/UntilDeskDark/UntilTablet and the LangSwitcher showcase boards. Guide*, Intl* and A11y* moved to agent F; agent B did not edit them.

## What changed
- **Footer language switcher (P-LANG)** on ContentArticle, HubFor, HomeBelow, PresetPage and UntilPage: the footer markup, the AT-LANG v1 JS and the `.at-chev` rule, copied verbatim from PRIMITIVES.md. A new `language` prop (closed | open) seeds the open state. Each row links to the same page in that locale (`/for/cooking` becomes `/es/for/cocinar`, `/pt-br/for/cozinhar`, `/de/for/kochen` and `/fr/for/cuisine` per `slugs.json`). Tools: `design/canvas/tools/gap-b/addlang.py` (inserter), `lang.js` (the JS block from PRIMITIVES.md; the inserter needed it), `wirelang.py` (renderVals wiring). Both scripts are idempotent.
- **Four more hubs through HubFor's `hub` prop** (for | on | vs | guides | learn). Each hub has its own breadcrumb, H1, lead, jump bar (the column count follows the number of groups), desktop nav current item, count unit and SIZES. Titles are the article H1s after marketing-seo-content.md §7. Lines are condensed from the en frontmatter and corrected per the fact-check. The en frontmatter still says "Battery saver denies" and "in our tests/checks"; those phrases are not used. Grouping:
  - /on (11): Phones, Tablets, Computers, Browsers. OD-3 merges windows-10 into "Windows 11 and 10".
  - /vs (7): Other tabs and libraries, Mac apps and commands, Windows tools, Tools that fake input.
  - /guides (7): iPhone and Android, Windows, Mac, Any computer. OD-3 folds modern-standby into lock-screen-vs-sleep.
  - /learn (6): Browser support, For developers, Myths and limits. how-we-tested is listed as "How AwakeTab is checked" (O-72). The nosleep-js article links to /vs/nosleep-js (OD-3). The Teams title is the question (OD-12).
  - /on and /learn carry the agreed honesty line: "Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded."
- **Heights** were re-measured with the real canvas runtime (`tools/gap-b/measure.mjs`), which found that the old phone sizes already clipped about 43 px of footer. HomeBelow phone would have reached 8054 px, so its FAQ now starts closed on phones only (7908 px, under the 8000 px limit). Tablet and desktop still open the first answer.
- **Owner padding rule:** the ContentArticle checklist rows went from 12 px to 16 px vertical padding (min-height 56). Nothing else in scope sat under 16 px. The language list rows use P-LANG's own spec (panel padding 4, row padding 12, so text sits 17 px from the edge).
- **D-R20:** already applied in these files (Stop = `raised` + `line-strong` + `ink`); no new ink-filled buttons were added.
- HomeBelow's "Eleven browsers and platforms" (was "Twelve", after the OD-3 merge), "All seven comparisons", "Troubleshooting guides" and "Learn about wake locks" now link to the new hub boards.

## Verification
- `rtscan` (real runtime) on all 32 boards in scope: 0 flagged.
- `tools/gap-b/smoke.mjs`: 234 prop combinations, 27 wrappers, 0 failures. It checks holes, tag balance, hints, SIZES against the wrapper sizes, P-LANG (8 rows in order, one current, the phone sheet, toggle, arrow wrap, Esc) and hub copy (no em dash, no unbacked testing or battery-saver claims).
- `tools/content-agent/smoke.mjs`: interactions unchanged. Its hard-coded SZ table was already stale before this work.
- `fix1b/render.mjs`, then `final/analyze.mjs` and `final/check.py`: 0 issues on these boards.

## Open questions
1. OD-3 also cuts /for/navigation, /for/live-streams, /for/exams-proctoring and /for/baby-monitor, and 301s /for/second-monitor. The /for hub still lists all 18 (and HomeBelow still says "All eighteen scenarios"). Should they come off the hub now, or when the routes change?
2. `HomeBelowPhoneDarkAlt` was not created. The new HomeBelowTablet is dark, and the play-me board already shows phone in the system theme (D-R18), so a phone dark wrapper would duplicate it.
3. The en frontmatter of the on/vs/guides/learn pages still carries disproved claims ("Battery saver denies", "in our tests"). The hub boards use corrected wording; the source .md files need the same fix (O-79).
