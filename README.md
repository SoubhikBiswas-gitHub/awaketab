# AwakeTab — documentation set

Complete product and engineering documentation for **AwakeTab** (awaketab.com), a browser tab that keeps your screen awake — honestly. Drop this folder into the repository root (`docs/` plus the two agent files) and point Cursor at it.

Version 1.0 · 7 Sep 2026 · Owner: Soubhik

## How the set fits together

| # | Document | What it answers | Read it when |
|---|---|---|---|
| 00 | [Conventions and canonical facts](docs/00-conventions.md) | The exact names of everything: states, keys, routes, plans, gates, budgets, config | **Always first.** Every other doc defers to it |
| — | [Blueprint](awaketab-blueprint.md) | Why: incumbent teardown, market, scenarios, SEO plan, monetization decision | Before the BRD, and whenever a "why" comes up |
| 01 | [BRD](docs/01-brd.md) | Business objectives, scope, requirements BR-##, budget, revenue scenarios, risks | Kick-off; investor/partner conversations |
| 02 | [PRD](docs/02-prd.md) | Personas, journeys, every FR/NFR with acceptance criteria, edge cases, release criteria | Before building any feature |
| 03 | [Architecture](docs/03-architecture.md) | System context, monorepo, runtime, build, security, ADR-001…012 | Before E0; when questioning a stack choice |
| 04 | [Engine spec](docs/04-engine-spec.md) | The seven lock states and transition table; session, tick, stats, multi-tab, capability probe | E1, E2; any bug in the lock or timer |
| 05 | [Frontend spec](docs/05-frontend-spec.md) | Tokens, components, state → UI matrix, keyboard, a11y, PWA, PiP, URL params | E3, E4, E10 |
| 06 | [Content and SEO spec](docs/06-content-seo-spec.md) | Page templates, frontmatter, JSON-LD, hreflang, sitemaps, slug lists with intents, editorial workflow | E5, E7 |
| 07 | [i18n](docs/07-i18n.md) | Locales, string files, formatting, translation workflow, localized keywords, QA | E6, E7 |
| 08 | [Data and storage](docs/08-data-storage.md) | Every localStorage key schema, licence token, KV model, Analytics Engine columns, privacy map | E2, E8, E9 |
| 09 | [Monetization implementation](docs/09-monetization-impl.md) | Polar licensing end-to-end, ads loader and placement contract, sponsor card, affiliates, Business licences | E9, E10, gates G1–G5 |
| 10 | [Extension spec](docs/10-extension-spec.md) | MV3 manifest, `chrome.power`, popup/options, licence reuse, store listing | E11 |
| 11 | [Embed spec](docs/11-embed-spec.md) | Cook Mode widget loader, iframe, `allow="screen-wake-lock"`, postMessage API, licence binding | E12 |
| 12 | [Library spec](docs/12-library-spec.md) | `@awaketab/wake` API, package layout, comparison with NoSleep.js, release | E1, E12 |
| 13 | [Testing strategy](docs/13-testing-strategy.md) | Test pyramid, T## transition tests, e2e journeys, SEO/perf/a11y checks, device matrix | Every epic |
| 14 | [DevOps](docs/14-devops.md) | Environments, Cloudflare setup, `_headers`, CI workflows, monitoring, incidents, backups, costs | E0, launch, operations |
| 15 | [Implementation plan](docs/15-implementation-plan.md) | Epics E0–E12, ~110 tickets with estimates and acceptance criteria, 10-week sprint plan, risks, cut list | Planning each sprint |
| 16 | [Cursor prompts](docs/16-cursor-prompts.md) | `.cursorrules`, `CLAUDE.md`, one prompt per epic, four utility prompts | Every coding session |
| 17 | [Launch checklists](docs/17-launch-checklist.md) | P0–P3 checklists, gate checklists, launch-day runbook, 7-day watch | Phase exits and launch |
| 18 | [Analytics and KPIs](docs/18-analytics-kpis.md) | North star, KPI tree, event mapping, SQL, tracked queries, targets, alerts, experiments | E8 and every weekly review |
| 19 | [Master production build prompt](docs/19-master-build-prompt.md) | One Cursor Agent prompt that builds M0–M9 to production with checkpoints; resume prompt; follow-ups | Kick-off of the build; after any context reset |

Repo-root files included here: `.cursorrules` and `CLAUDE.md` (also reproduced in doc 16).

## Working rules

1. `docs/00-conventions.md` is the single source of truth. Change an identifier there first, then grep the docs and the code.
2. Requirements are testable; every FR in the PRD has acceptance criteria, and `13-testing-strategy.md` says how each is proven.
3. The product's one promise — *the pill never lies* — is a contract in 04 and 05. Do not simplify the seven states.
4. Money rules are contracts too: Google ads never on the awake screen, `/pip`, `/embed/*` or the extension; never auto-refresh under AdSense.
5. Numbers from the revenue model are estimates; targets in 18 say so.

## Suggested reading order for a new contributor

00 → Blueprint (skim §01, §04, §05, §11) → 02 §1–§4 → 03 §1–§6 → 04 → 05 → then the doc for your epic, with 13 and 16 open beside it.

## Open decisions (owner: Soubhik)

Name confirmation (AwakeTab), open-source scope (engine + library MIT vs. whole repo), stack confirmation (Astro + Cloudflare), launch locales (8 listed), weekly capacity assumption (20–25 h). Each is flagged where it matters; the docs assume the recommended option.
