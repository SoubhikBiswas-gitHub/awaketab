# AwakeTab — agent guide
Purpose: a browser tab that keeps the screen awake, honestly. Monorepo: apps/web (Astro 5 + vanilla-TS island + Pages Functions), apps/extension (WXT MV3), packages/wake (@awaketab/wake), packages/core (@awaketab/core), docs/.
Start here: docs/00-conventions.md (identifiers, budgets, gates) → docs/02-prd.md (requirements) → the spec for the area you touch.
Commands: pnpm install · pnpm dev · pnpm test · pnpm test:e2e · pnpm build && pnpm test:seo · pnpm -F extension dev.
Contracts you may not change without a docs update: the seven lock states and pill copy (docs/04, docs/05), storage keys (docs/08), routes and slugs (docs/00 §7), ad placement rules (docs/00 §8.3, docs/09), performance budgets (docs/00 §11), `--at-*` tokens and their shadcn aliases (docs/05 §1.1, §1.5), zero hydration / shadcn build-time only (docs/03 ADR-013).
Definition of done: acceptance criteria met, tests green, docs updated (00-conventions.md first for identifiers), changelog fragment when user-visible.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
