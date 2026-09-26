# HANDOFF: continue the AwakeTab "Clear Night" redesign

You are taking over from a local Claude Code session (lead) that ran the redesign on 26–27 September 2026. Read this whole file first, then `docs/redesign/README.md`. Do not ask the owner things this file or the docs already answer.

## 1. Who and what
- **Owner:** Soubhik Biswas, a front-end engineer. UI/UX is the top priority. He wants a "wow, next level" product that people use and pay for, and he delegated every open decision to the lead (all 87 are recorded in `docs/redesign/DECISIONS.md`).
- **Product:** AwakeTab is a browser tab that keeps the screen awake and tells the truth about whether it is working.
  - Monorepo: `apps/web` (Astro 5, a vanilla-TS island, Pages Functions), `apps/extension` (WXT, MV3), `packages/wake`, `packages/core`, `docs/`.
  - Hosted on Cloudflare Pages. `main` auto-deploys to https://awaketab.pages.dev (sandbox). Checkout is Polar, sandbox only.
- **Branch:** all redesign work lives on **`redesign/clear-night`**. Never commit to or push `main` until the owner approves and every gate is green.

## 2. Owner preferences (apply to everything)
- UI/UX first. Research-driven. Don't copy the current UI.
- **Honesty is the brand.** No dark patterns. No fake reviews, numbers or scarcity. No claims we can't back.
- Times in 12-hour AM/PM (en), with the full date line ("Saturday, 26 September 2026"). Say "tomorrow" when a time is past midnight. Show the end time before a session starts.
- Theme is Auto / Light / Dark (+ OLED). Auto follows the system live. Every screen must work in both light and dark, at phone, tablet and desktop sizes (320 px phone up to 1920 px / TV).
- Motion is slow and calm. Everything stops under reduced motion.
- **No duplicate screens** (D-R18).
- Document everything in the repo so any agent has full context (D-R16). Keep the status table updated.
- **Domain and accounts are the LAST step**, after design and build. That covers registering awaketab.com, GitHub org, npm scope, store submission, production checkout, and GST/LUT. Don't raise them again until then.
- Verify before any push: `pnpm test`, `pnpm test:e2e`, `pnpm build && pnpm test:seo`, and the size gate must all be green. `main` auto-deploys.
- Node 22: `export PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH`. Run `pnpm build` before lint.
- Shell quirks: `cp` is interactive, so use `command cp -f`. `ls` is eza. Avoid heredocs inside shell functions (they hang).

## 3. Where things are
- **Design system:** `DESIGN.md`. §11 is the strict spec; it was corrected by D-R17 and updated with the delegated decisions. **Product:** `PRODUCT.md`.
- **Hub:** `docs/redesign/README.md` (read order, research index, log).
- **Status table:** `docs/redesign/STATUS.md`.
- **Decisions:** `docs/redesign/DECISIONS.md`. The Decided table plus "Decided under owner delegation". These are law.
- **Briefs:** `docs/redesign/agent-brief.md` (canvas format, shared rules, **accuracy corrections**, **copy corrections**), `fix-batch-brief.md`, `audit-brief.md`, `research-brief.md`, `marketing-brief.md`, `ui-inventory.md`.
- **Research and audits:** `docs/research/*.md` (22+ files: fact-check, editorial, content, copy, market, growth, design gaps, design critique, 4 marketing reports, audits A/B, i18n/a11y, fix batches).
- **Design canvas (interactive prototype, about 265 boards):** https://claude.ai/artifact/MArJ4zoZRiYmppEd9hXv5e (Design type, private to the owner).
  - Source in the repo: `design/canvas/project/` (every `.dc.html` board plus `canvas.json`).
  - `design/canvas/tools/` holds the smoke tests, renderers and checkers.
  - `design/canvas/*.json|py` holds the layout scripts: `sections.json` + `layout.py` rebuild `canvas.json`; `status.json` + `status.py` rebuild the status note and `docs/redesign/STATUS.md`.
- **Skills:** `.claude/skills/awaketab-design/SKILL.md` and `.cursor/rules/awaketab-design.mdc`.

## 4. Where we stopped (27 Sep 2026, ~4 AM IST)
- **Design phase is about 95 % done.** Every page, product, size, theme, language, accessibility mode and edge case is on the canvas.
- **Fix batches** apply DESIGN.md §11, the design-critique fixes, the accuracy and copy corrections, and the delegated decisions:
  - 1b (content, ambient, i18n, a11y): done.
  - 1a (Main tool + wow moves: ignition, lamp off, receipt, "How do we know?", all 7 presets on phones, one digit style), 2a (Pro rebuilt as "one evening", extension ignition/lamp off, long-session popup boards ExtPopupLong2h/Overnight/MultiDay/Unlimited, growth, brand) and 2b (embed, pages, kiosk, OG, icons, system states; broken OgDevice "24:18" wrap fixed): each finished before this handoff if a `docs/research/fix-batch-*.md` report exists; otherwise redo that batch from `fix-batch-brief.md`.
  - 1b also got a follow-up to apply the delegated decisions (see the "Follow-up" section of `fix-batch-1b.md`).
- **Owner comments on the canvas** (reply and resolve with the ArtifactComments tool when fixed):
  - Thread 5143c842: OgDevice "24:18" wrap.
  - Thread b7f5ae08: how the popup shows sessions over 1 h and unlimited. The rule is in DESIGN.md §4.

### 4a. Exact stop point (owner asked to stop local work and continue in the cloud)
At about 4:10 AM IST the lead **stopped all local agents mid-work**. `design/canvas/project/` is the exact state at that moment, and some boards in batches 1a, 2a and 2b are **partially edited**. Resume like this:
1. **Fix the script paths first.** Scripts in `design/canvas/` and `design/canvas/tools/` still point at the old scratchpad. From the repo root, run:
   `OLD=/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad; grep -rl "$OLD" design/canvas | xargs sed -i.bak -e "s#$OLD/directions#$PWD/design/canvas#g" -e "s#$OLD/#$PWD/design/canvas/tools/#g"; find design/canvas -name '*.bak' -delete`
   Also replace `/Users/soubhik/Work/github/awaketab` with `$PWD` where it appears. Install Playwright + Chromium for the renderers.
2. **Run every smoke test** (`design/canvas/*Smoke*.mjs`, `gen.mjs`, `tools/*/smoke*.mjs`, `tools/tool-backup/tool-smoke.mjs`) and the renderer/checker `tools/director/render-all.mjs` + `analyze.mjs`. Anything broken shows where each batch stopped.
3. **Batch 1a (Main + its wrappers + Size*/Edge*/Tool*): barely started.**
   - Backups are in `tools/tool-backup/` (`Main.batch1.bak.html`, `Main.wave3.bak.html`). If Main fails its smoke test, restore from `Main.batch1.bak.html`.
   - Redo 1a from `docs/redesign/fix-batch-brief.md`, using these inputs:
     - the 12 Main fixes in `docs/research/audit-a-tool-ambient-content.md` ("Left for Main");
     - the critique wow moves: one digit voice with no slashed zero; "ignition" on a real grant; "lamp off" plus the session timeline receipt on Done; a "How do we know?" link beside the pill; the first-visit receipt line;
     - the keycap rule (DESIGN.md §11.4);
     - the delegated decisions O-08, O-11, O-20, O-21, O-70, O-73, O-74, O-75, O-76, O-87, O-56, O-57, O-01, O-12.
   - Keep every Main prop working; about 60 boards mount it.
4. **Batch 2a (Pro*, ExtPopup*, ExtOptions*, ExtBadges, ExtEdge*, Welcome*, Store*, Growth*, Brand): mostly done.** It was on ExtBadges, StoreAssets and Brand. To finish:
   - Check the /pro "one evening" rebuild.
   - Add popup boards **ExtPopupLong2h, ExtPopupOvernight, ExtPopupMultiDay, ExtPopupUnlimited** (rules in DESIGN.md §4).
   - Keycap rule.
   - Decisions O-01, O-02, O-03, O-04, O-05, O-31, O-33, O-38, O-52 ("launch price for the first 90 days after launch, then $29"), O-35/O-67, O-37/O-53, O-17, O-40, O-56, O-57.
   - Write `docs/research/fix-batch-2a.md`.
5. **Batch 2b (Embed*, EmbedEdge*, EmbedCook*, Page*, Kiosk*, Og*, IconSet, Sys*): mostly done.** It was on source fixes (Library node ids, log well r8, Kiosk clock padding, Sys aside, switch row). To finish:
   - Fix **OgDevice "24:18" on one line** (owner comment 5143c842).
   - Keycap rule.
   - Decisions O-58 (compact embed 320×104), O-18, O-19, O-29 ("Licences open soon"), O-31, O-34, O-69, O-39, O-41, O-44, O-47, O-72, O-86, O-04, O-56, O-57, O-09.
   - Write `docs/research/fix-batch-2b.md`.
6. **Batch 1b follow-up (Extras*, Ambient*, Pip*, Content*, HubFor*, HomeBelow*, Intl*, A11y*, Guide*, Preset*, UntilPage*): not started.** Apply O-72, O-86, O-81 (share becomes an inline panel), O-09/O-82, O-83 (PiP digits up to 40 px), O-12, O-75, O-87, O-74, O-63, O-62, O-65, O-02, O-04, O-56, O-57, and kbd padding 0 8. Append a "Follow-up" section to `fix-batch-1b.md`.
7. Only one agent edits a given file at a time. Use the prefixes above as ownership boundaries if you run sub-agents in parallel.

## 5. What to do next, in order
1. **Integrate the fix batches.** Read each `docs/research/fix-batch-*.md` and apply any new board heights to `design/canvas/sections.json`, then run `python3 layout.py`. Remove duplicate boards per D-R18: keep the ▶ play-me board plus one opposite-theme board, drop boards whose props equal another's. Merge the two shared-primitive sets into one (O-77). Publish to the canvas if your environment has the Artifact tool, otherwise record "needs publish" in SYNC.md. Publish the whole `design/canvas/project/` with root `design/canvas` and `file_path` `design/canvas/project/canvas.json`.
2. **Final audit (status #45).** Render every board and check: overflow, targets ≥ 44, AA contrast, tokens, copy rules, pill strings, AM/PM, theme parity, reduced motion, §11 numbers, no duplicates. Fix, re-verify, then write `docs/research/final-audit.md`.
3. **Ask the owner to review the canvas.** This is the one approval gate before the build.
4. **Build phase** (after approval), on this branch:
   - Implement the design in `apps/web` (Astro + CSS; zero hydration; JS budget has about 1 KB headroom, so motion is CSS-only), `apps/extension` and the embed.
   - Update the `docs/05` tokens, `docs/00` identifiers and routes, and the `docs/07`/`docs/09` contracts in the same change.
   - Fix the content per `docs/research/content-audit.md`, `fact-check-2026-09-26.md`, `editorial-audit-articles.md` and `marketing-seo-content.md`: retire the generator, rewrite about 20 key pages, noindex the rest, and remove the battery-saver claims in all 8 locales.
   - Fix Pro per `marketing-pricing-cro.md` and the decisions: remove unbuilt features, runtime launch-price switch, "Pro is active" page, hold Embed sales, honour the telemetry opt-out on /pro.
   - Add a changelog fragment.
   - Run all gates, then open a PR from `redesign/clear-night` to `main`. Don't merge without the owner.
5. **Last step (owner, later):** domain, accounts, stores, production checkout, GST/LUT, then launch (Show HN 17 Nov, Product Hunt 1 Dec, go/no-go 10 Nov).

## 5a. Always update the SAME canvas (owner rule)
- The only canvas is https://claude.ai/artifact/MArJ4zoZRiYmppEd9hXv5e. **Never create a new artifact.**
- Publish with the Artifact tool:
  - `url` = that link
  - `root` = `design/canvas`
  - `file_path` = `design/canvas/project/canvas.json`
  - `files` = every changed `project/*.dc.html`
  - `null` for any board you delete
- Before every publish, read the live `project/canvas.json` (action `read`, `paths`), because the canvas re-saves it when viewed. Merge only real layout changes, never the owner's comments, then publish.
- Keep the pinned status note current: run `python3 design/canvas/status.py`, which rewrites the note inside `canvas.json` and `docs/redesign/STATUS.md`. Also update the canvas layout: run `python3 design/canvas/layout.py` after editing `sections.json`.
- Owner comments on the canvas: read them with ArtifactComments. Fix, reply once with what changed, then resolve.
- If your environment cannot publish to the artifact, commit and push anyway, and log `needs publish` in SYNC.md. The lead will pull the branch and publish the same files from the local machine.

## 6. Keep the lead in sync (mandatory)
The lead session watches this branch and cannot receive messages from you. So after **every finished step**:
- Commit and push to `redesign/clear-night` with a clear message.
- Update `docs/redesign/STATUS.md`: edit `design/canvas/status.json` and run `python3 status.py`, which also rewrites the canvas status note.
- Append one line to `docs/redesign/SYNC.md` in this format: `YYYY-MM-DD HH:MM IST · agent · what was done · what is next · questions for the owner (or "none")`.
- Put any new owner question in DECISIONS.md "Open" with the next free O- number, and make it the first thing you say to the owner.

If the lead sends you a message (owner feedback or corrections), apply it before continuing and log it in SYNC.md.
