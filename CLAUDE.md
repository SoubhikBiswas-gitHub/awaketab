# AwakeTab — agent guide
Purpose: a browser tab that keeps the screen awake, honestly. Monorepo: apps/web (Astro 5 + vanilla-TS island + Pages Functions), apps/extension (WXT MV3), packages/wake (@awaketab/wake), packages/core (@awaketab/core), docs/.
Start here: docs/00-conventions.md (identifiers, budgets, gates) → docs/02-prd.md (requirements) → the spec for the area you touch.
Redesign in progress: read docs/redesign/README.md first (status, decisions, briefs, research). UI/UX work: PRODUCT.md → DESIGN.md (Clear Night design system) → skill `.claude/skills/awaketab-design` (Cursor: `.cursor/rules/awaketab-design.mdc`).
Commands: pnpm install · pnpm dev · pnpm test · pnpm test:e2e · pnpm build && pnpm test:seo · pnpm -F extension dev.
Contracts you may not change without a docs update: the seven lock states and pill copy (docs/04, docs/05), storage keys (docs/08), routes and slugs (docs/00 §7), ad placement rules (docs/00 §8.3, docs/09), performance budgets (docs/00 §11), `--at-*` tokens and their shadcn aliases (docs/05 §1.1, §1.5), zero hydration / shadcn build-time only (docs/03 ADR-013).
Definition of done: acceptance criteria met, tests green, docs updated (00-conventions.md first for identifiers), changelog fragment when user-visible.
Code comments: only a short `//` line where the reason is not obvious; no block, JSDoc, HTML or CSS comments (tool directives excepted). `pnpm lint` runs `scripts/comments.mjs`; `--fix` strips them.
Commits and PRs: plain English, no internal codes, no AI attribution; author is the owner.
