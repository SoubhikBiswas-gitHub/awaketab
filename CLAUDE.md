# AwakeTab — agent guide
Purpose: a browser tab that keeps the screen awake, honestly. Monorepo: apps/web (Astro 5 + vanilla-TS island + Pages Functions), apps/extension (WXT MV3), packages/wake (@awaketab/wake), packages/core (@awaketab/core), docs/.
Start here: docs/00-conventions.md (identifiers, budgets, gates) → docs/02-prd.md (requirements) → the spec for the area you touch.
Design: PRODUCT.md → DESIGN.md (Clear Night design system) → docs/redesign/DECISIONS.md and docs/redesign/CANVASES.md (the canvas boards) → skill `.claude/skills/awaketab-design` (Cursor: `.cursor/rules/awaketab-design.mdc`). Internal planning, research and process records live in the private repo SoubhikBiswas-gitHub/awaketab-internal.
Commands: pnpm install · pnpm dev · pnpm format · pnpm lint (includes pnpm knip: unused files, exports, dependencies) · pnpm typecheck · pnpm test · pnpm test:e2e · pnpm build && pnpm test:seo · pnpm -F extension dev.
Contracts you may not change without a docs update: the seven lock states and pill copy (docs/04, docs/05), storage keys (docs/08), routes and slugs (docs/00 §7), ad placement rules (docs/00 §8.3, docs/09), performance budgets (docs/00 §11), `--at-*` tokens and their shadcn aliases (docs/05 §1.1, §1.5), zero hydration / shadcn build-time only (docs/03 ADR-013).
Definition of done: acceptance criteria met, tests green, docs updated (00-conventions.md first for identifiers), changelog fragment when user-visible.
Formatting: Prettier (`.prettierrc.json`, 120 columns; `.astro` templates excluded because their whitespace is page text). Run `pnpm format` before committing; `pnpm lint` checks it.
Code comments: only a short `//` line where the reason is not obvious; no block, JSDoc, HTML or CSS comments (tool directives excepted). `pnpm lint` runs `scripts/comments.mjs`; `--fix` strips them.
Commits and PRs: plain English, no internal codes, no AI attribution; author is the owner.
Testing cadence: every change runs lint, typecheck, unit tests, build and size. Run `pnpm test:e2e --project=chromium` only when UI behaviour changes, once before merging to main; GitHub runs Chromium e2e on every push and Firefox + WebKit nightly.
