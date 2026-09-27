# Fix batch brief (system + critique fixes)

$D = /private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions

Read first: /home/user/awaketab/docs/redesign/README.md, DECISIONS.md (Decided items are law; D-R17 corrected the spec), /home/user/awaketab/DESIGN.md (corrected §2, §3, §5, §6, §11 — the only source for numbers), $D/BRIEF.md (incl. Accuracy corrections and Copy corrections), and /home/user/awaketab/docs/research/design-critique.md (§3.1 systemic primitives, §3.2 per-file table, §3.4 board defects, §4 wow moves, §5 your batch). Also docs/research/audit-b-pro-extension-embed.md "Left for other owners" and docs/research/canvas-copy-audit.md.

Goal: every board in your batch obeys DESIGN.md §11 exactly and the shared primitives are IDENTICAL across files (header 60/68 with logo 26/17 and the theme segmented bar per §11.4, status pill sizes L/M/S/XS, segmented bar 54, CTA 60 r20, secondary 52/44, cards r16 p20/24, tags, list rows, kbd, one footer spec, digits in system-ui 200–300 tabular with no slashed zero, mono only for digits/code/keys/URLs, spacing only on the scale, radii only 4/8/12/16/20/28/999, weights 400/500/600 (+200/300 digits), type tokens from §11.5, new tokens raised/sunken/horizon-ink/halo/night). Write the primitives once as a snippet at the top of your work and copy them verbatim into every file so they are byte-identical.

Also fix: every §3.4 board defect in your files, accuracy/copy corrections, notices never covering the CTA, boards ≤ 8000 tall with default layout matching width, reduced-motion covering the root, contrast AA incl. line numbers and locked controls (no opacity dimming of text), no text < 12 px.

Keep: behaviour, props and prop values (other boards import these files), the seven pill strings, real copy. Do not touch files outside your batch's prefixes; report cross-batch issues instead.

Verify (mandatory): re-run each existing smoke test for your files (e.g. $D/ProSmoke.mjs, ../ext-tools/smoke.mjs, ../pages-agent/smoke.mjs, ../bigscreens/smoke.mjs, ../growth/*smoke*, $D/ExtEdgeSmoke.mjs, $D/GuideSmoke.mjs, $D/SizeSmoke.mjs, $D/IntlA11y-smoke.mjs, $D/gen.mjs, ../tool-backup/tool-smoke.mjs — whichever cover your files) with 0 missing/0 failures, then re-run the critique's checker ../director/render-all.mjs + ../director/analyze.mjs (or audit-b/audit.mjs) on your files and report violation counts before → after. If a board's natural height changes, report the new height.

Documentation rule: write your report to /home/user/awaketab/docs/research/fix-batch-<N>.md (before/after table, what changed per file group, anything left, new owner questions — also append new open questions to docs/redesign/DECISIONS.md "Open" with the next free O- number).

Return: files changed, before/after counts, new board heights (JSON {"File.dc.html": {"w":..,"h":..}}), smoke results, open questions.
