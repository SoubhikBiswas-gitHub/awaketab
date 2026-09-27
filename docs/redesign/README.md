# Redesign hub: start here

**Every agent (Claude, Cursor or a sub-agent) reads this page before writing, designing or changing anything.** Owner: Soubhik Biswas. Status: design phase. Nothing in the real app has been rebuilt yet.

## 1. What is happening
AwakeTab is getting a full UI/UX redesign called **"Clear Night" (version D)**. It covers every product (web tool, content pages, Pro, Chrome extension, embed, kiosk, library), every screen size (320 px phone to 1920 px and TV), light and dark themes, every edge case, and 8 languages. The design is prototyped as interactive boards on a design canvas. After the owner approves, the real app is rebuilt with all gates green, then pushed (main auto-deploys).

- Canvas (interactive prototype, 100+ boards): the 12 redesign canvases (docs/redesign/CANVASES.md)
- Live status table: [STATUS.md](STATUS.md) (auto-generated; mirrors the status note on the canvas)
- Decisions made and open questions: [DECISIONS.md](DECISIONS.md)

## 2. Read in this order
1. [/PRODUCT.md](../../PRODUCT.md): users, personality, anti-references, principles.
2. [/DESIGN.md](../../DESIGN.md): the Clear Night design system. §11 is the strict spec (spacing, borders, radii, sizes, type); anything outside it is a bug.
3. [DECISIONS.md](DECISIONS.md): what is settled and what is open.
4. [agent-brief.md](agent-brief.md): canvas file format, shared rules, **accuracy corrections** and **copy corrections** that apply to every board.
5. [ui-inventory.md](ui-inventory.md): every real feature, route and string in the product. Never invent beyond it.
6. `/CLAUDE.md` contracts: pill copy, storage keys, routes, ad rules, budgets, zero hydration.
7. Skill: `.claude/skills/awaketab-design/SKILL.md` · Cursor rule: `.cursor/rules/awaketab-design.mdc`.

## 3. Research and audits (docs/research)
| File | What it is |
|---|---|
| [fact-check-2026-09-26.md](../research/fact-check-2026-09-26.md) | Browser/OS claims checked against Chromium, WebKit and Firefox source and vendor docs. Battery-saver claims are false; the real refusal causes are listed |
| [editorial-audit-articles.md](../research/editorial-audit-articles.md) | All 51 articles are one generated template (84–90% duplicate); fixed descriptions and titles, terminology |
| [canvas-copy-audit.md](../research/canvas-copy-audit.md) | Every visible string on the canvas checked for honesty, consistency and pricing |
| [content-audit.md](../research/content-audit.md) | Full text verification of the product (combined report) |
| [growth-conversion.md](../research/growth-conversion.md) | Funnels per persona, retention levers, honest monetisation, KPIs, 10 experiments |
| [market.md](../research/market.md) | Competitors, demand, pricing, positioning, go-to-market |
| [design-gaps.md](../research/design-gaps.md) | What the design is missing to earn trust, use and purchase, plus Growth boards |
| [design-critique.md](../research/design-critique.md) | Design director scores, system drift table, "wow" moves, fix batches |
| [marketing-positioning.md](../research/marketing-positioning.md) | Positioning, messaging hierarchy, voice, page-by-page copy rewrites |
| [marketing-seo-content.md](../research/marketing-seo-content.md) | Keyword universe, technical SEO, content recovery, 90-day plan |
| [marketing-pricing-cro.md](../research/marketing-pricing-cro.md) | Packaging, pricing, /pro sales page copy, upgrade microcopy, revenue scenarios |
| [marketing-gtm-launch.md](../research/marketing-gtm-launch.md) | Launch readiness, 90-day GTM, channel post drafts, ASO, partnerships |
| [i18n-a11y-canvas.md](../research/i18n-a11y-canvas.md) | Languages and accessibility boards: real locale strings, measured wrapping, missing keys, focus order, forced colours, zoom, screen reader |
(A file that doesn't exist yet is still being written by its agent.)

## 4. How the work runs
- **Design:** the canvas project lives in `design/canvas/project` (one file per board; `canvas.json` places them, generated from `sections.json` by `layout.py`) and is published to the canvas artifact. One base `.dc.html` per page takes props `theme`, `layout` and state; small wrapper boards mount it with fixed props. Each agent owns a filename prefix and never edits another's files. Gates before any publish: `tools/final/rtscan.sh` (0 flagged) and `tools/final/rtaudit.sh` (0 violations), both with the canvas's real runtime.
- **Checks:** every agent runs a node smoke test (every prop combination, 0 unresolved bindings). Audit agents render every board in Playwright and check overflow, 44 px targets, AA contrast, tokens, copy and theme parity.
- **Process rules:** research first; cite sources; no dark patterns; no invented numbers, reviews or quotes; no pushes until every gate is green (`pnpm test`, `pnpm test:e2e`, `pnpm build && pnpm test:seo`, size gate).
- **Build phase (after approval):** implement in apps/web (Astro + CSS), apps/extension and the embed. Update docs/05 tokens and docs/00 identifiers in the same change. Fix the content per the research files. Add a changelog fragment.

## 5. Log
- 26 Sep 2026: Version D chosen; Clear Night palette; four faces; phone dock rule.
- 26 Sep 2026: 26 core page designs on canvas, then edge cases, sizes, languages, accessibility and assets.
- 26 Sep 2026: Contrast fix for light lamps. Strict system spec (DESIGN.md §11). Fact-check and editorial audit. Growth research done.
- 26 Sep 2026: Kiosk, embed edge states, OG images, store assets, icons on canvas. /on, /vs, /learn, /guides, /30m and /until page types on canvas (accuracy corrections applied; ContentArticle still has battery-saver wording, fixed in batch 1).
- 26 Sep 2026: Market research done (market.md): keep pricing; silent failure is the gap competitors leave; teachers unserved; several launch channels closed.
- 26 Sep 2026: Extension edge states, welcome page and system states on canvas (199 boards).
- 27 Sep 2026 2:50 AM: 10 agents stopped by the account usage limit; resumed at 2:58 AM from their saved work (i18n/a11y, critique, audits A/B, design gaps, content summary, 4 marketing reports).
- 27 Sep 2026: Design critique done (design-critique.md): tool close to wow, product not yet (drift); DESIGN.md corrected (D-R17). Audit B fixes published. All 4 marketing reports and the content audit done.
- 27 Sep 2026: Languages/accessibility boards and 46 Growth boards on canvas (264 boards). Fix batch 2 (2a Pro/extension/growth, 2b embed/pages/kiosk/system) started from fix-batch-brief.md.
- 27 Sep 2026: Owner delegated every open question; all 87 decided (DECISIONS.md "Decided under owner delegation"). Owner: domain and accounts are the last step, after design and build.
- 27 Sep 2026 (cloud agent): fix batches 1a, 2a, 2b and the 1b follow-up finished (docs/research/fix-batch-*.md); board heights synced; 18 duplicate boards removed (D-R18); primitives merged into design/canvas/PRIMITIVES.md (O-77); final audit done (docs/research/final-audit.md); canvas published (251 boards).
- 27 Sep 2026 (local): gaps closed on every page, size and theme (310 boards after the coverage check, 63 of 63 status items done). Every board passes the real-runtime scan and the DESIGN.md §11 audit. Responsive contract (D-R22) and token system (D-R23, DESIGN.md §12) written. Canvas published (v51). Next: owner review, then the build.
- Next: owner reviews the canvas (the one approval gate), then the build phase on redesign/clear-night.
