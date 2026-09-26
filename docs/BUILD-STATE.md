# AwakeTab build state

Current milestone: **M6 complete (local)**. Next: M7 (extension, E11). Do not start until `"go M7"`.

## Completed

### M0–M1

- pnpm workspace with strict ESM TypeScript projects for the Astro site, WXT extension, `@awaketab/wake`, and `@awaketab/core`.
- Static Astro holding page with canonical metadata, social metadata, JSON-LD, and a static OG placeholder.
- Tailwind CSS v4 token foundation using the `--at-*` namespace and logical CSS properties.
- Generated Cloudflare `_headers` and `_redirects`, canonical robots and sitemap stubs, and `/api/health`.
- Linting, formatting, unit/function/SEO testing, Playwright, axe, size budgets, Lighthouse assertions, Changesets, and GitHub workflows.
- `@awaketab/wake`: seven lock states, `classifyDenial` → `TAdviceCode`, video fallback, T01–T16 transition tests.
- `@awaketab/core`: session engine, `at.v1.*` storage, local-date stats (Asia/Kolkata + America/Los_Angeles fixtures), ES256 licence verify, capability probe, BroadcastChannel protocol.

### M2 (E3 + E4)

- Vanilla-TS tool island in `apps/web/src/tool` projecting the seven lock states via `t('tool.pill.*')`.
- Allow-listed URL params, preset/until/custom plans, resume banner, toasts (no `alert`/`confirm`/`prompt`).
- Settings sheet, shortcuts overlay, share sheet, capability notice, extend prompt, PiP stub (280×120) + `/pip`.
- PWA: `public/manifest.webmanifest`, `public/sw.js` (static; not `@vite-pwa/astro`), install + iOS hint.
- Playwright journeys 1–9, 11–12 on Chromium (mocked Pro activate + ads guard). Beacon intercept for `page_view` / `session_start` / `lock_state`. `ext=1` copy panel on `/pro/activate`.

### Type-naming refactor (post-M2, owner-directed)

- Every interface is now `I` + PascalCase and every type alias `T` + PascalCase across all four workspaces, including the `@awaketab/wake` and `@awaketab/core` public surfaces (46 declarations).
- Exemptions: `Props` in `.astro` (Astro derives `Astro.props` from that name) and `IEnv` in Pages Functions.
- Enforced by `@typescript-eslint/naming-convention`; `enum` is banned by `no-restricted-syntax`.
- Recorded in `docs/00-conventions.md` §2 and `.cursorrules`. Type names only — lock-state strings, `at.v1.*` keys and preset ids are byte-identical.

### M3 (E5 + E6)

- BaseLayout (tool routes) and ContentLayout (ad slots present, `PUBLIC_ADS_ENABLED` off). Ads imports banned from tool routes by ESLint.
- SeoHead: title formula, description, canonical, hreflang `en` + `x-default`, OG/Twitter. Unreviewed locales stay `noindex` and out of hreflang/sitemap.
- JSON-LD: Organization + WebSite + WebApplication on home; `aggregateRating` omitted while `data/ratings.json` count is 0.
- Build-time OG via satori + resvg; support matrix from `src/data/support-matrix.json`; slugs map for all convention collections.
- English home: tool + 1,682 words, seven-state table, honest limits, support matrix, 8 FAQs, hub links, author box.
- Preset pages `/15m`…`/8h`, `/until/*` (noindex, canonical `/`), hubs `/for` `/on` `/vs` `/guides` `/learn`, trust `/about` `/privacy` `/terms` `/changelog`, `/404` with the tool.
- Eight locale JSON files at key/placeholder parity. Footer locale switcher always links to locale homes. Accept-Language banner writes `lang-suggest` to `at.v1.onboarding.dismissedTips`; never auto-redirects.
- Server `t()` is locale-explicit (`createT`) so static builds cannot leak Hindi (or any locale) into English titles.
- PWA boot and language suggestion are lazy island chunks so critical JS stays under 15 KB gz.

### M4 (E8 + E9)

- First-party analytics: `lib/analytics.ts` queues ≤20 events / 8 KB, `sendBeacon` on hide, per-tab `sid` in memory, 10% `client_error`. Island loads it lazily.
- `POST /api/e` allow-list + size limits + IP-hash rate limit (`rl:e:{ipHash}:{bucket}`); Analytics Engine column map from docs/08 §5. `POST /api/csp` → `client_error` / `csp`.
- `docs/metrics/queries.sql` and `apps/web/scripts/metrics-week.mjs`.
- G0: footer + `/about` Buy Me a Coffee (`rel="noopener"`); GitHub Sponsors on `packages/wake/README.md`.
- G1: `AdSlot.astro`, ads loader in ContentLayout only, `/ads.txt`, `/config/ads.json`, `PUBLIC_ADS_ENABLED=0`.
- G2: ES256 JWT, Polar client, licence activate/validate/deactivate, Polar webhooks (Standard Webhooks HMAC, `wh:{eventId}`), embed config, rating. Pages `/pro`, `/pro/activate` (error table + `?ext=1` copy panel), `/pro/manage` (server activations + remove). Dev `LICENSE_PUBLIC_KEYS[1]` pair in `@awaketab/core` + `.dev.vars.example` (rotate before production). `ads.free` skips ContentLayout ads. Client errors sampled 10% per sid. Refund + uptime notes in `docs/17-launch-checklist.md`.

### M5 (E7)

- English content collections: 18 `/for`, 12 `/on`, 8 `/guides`, 7 `/vs`, 6 `/learn` (51 pages). Markdown + Astro wrappers; tool embedded with `autostart=0` and the scenario preset/mode.
- Hubs list live articles. Home spokes point at real slugs. Sitemap-en includes the 51 URLs. SEO suite asserts one h1, unique descriptions (HTML-decoded), and 600–1,000 words in `.at-prose`. Descriptions avoid `&` so escaped meta tags stay ≤155.

### shadcn/ui adoption (post-M5, owner-directed)

- shadcn/ui (new-york, neutral, CSS variables) is the UI component library for `apps/web`, installed via the official Astro path: `@astrojs/react` 4.4.2, `react`/`react-dom` 19.3.0, `class-variance-authority`, `cn`, `radix-ui` (Slot/Separator/Toggle), `lucide-react`, `tw-animate-css`. `components.json` points `tailwind.css` at `src/styles/tokens.css`; `@/*` → `./src/*`, `jsx: react-jsx`.
- Primitives in `apps/web/src/components/ui/`: button, badge, card, table, alert, separator, input, label, kbd, breadcrumb, toggle (`pnpm dlx shadcn@4.21.0 add <name>` from `apps/web` for more).
- **Rule: zero hydration.** Components render in `.astro` at build time or lend their cva class helpers (`buttonVariants()`, `badgeVariants()`, `toggleVariants()`) to plain HTML. No `client:*` directive anywhere; React never ships. Interactive shadcn primitives (Dialog, Sheet, Tabs, Accordion, Tooltip, Select, DropdownMenu) are not used — the island keeps native `<dialog>`, `<details>` and vanilla TS (ADR-002). Runtime-created nodes (toasts) get the look via `@apply` in `tool.css`.
- Enforced by `scripts/size.mjs`: fails on any `<astro-island` in built HTML or any `dist/_astro/*.js` matching `react.*` / `jsx-runtime.*` / `client.*`. Build gained `scripts/prune-unreferenced.mjs` (after `astro build`, before `sitemap.mjs`) to drop the ~224 KB client renderer `@astrojs/react` emits regardless; `scripts/locked.mjs -- <cmd>` serialises concurrent builds; `AT_DIST=<dir>` targets an alternate output dir for size/prune/sitemap/SEO.
- Theme bridge in `tokens.css`: shadcn semantic variables alias the canonical `--at-*` tokens (`--primary` → `--at-accent-text`, `--accent` → the 12% state tint, `--border` → `--at-line`, custom `--success`/`--warning`/`--night`, radius scale onto `--at-r-*`); `@custom-variant dark` follows `data-theme` (`dark`, `oled`) and `prefers-color-scheme`. `--at-*` hex values are byte-identical to docs/05 §1.1.
- Converted surfaces: tool routes (header ghost icon buttons, Pro badge, outline-toggle preset chips on `aria-pressed`, Card/Alert banners and capability notice, `<dialog>` with the Dialog look, `Kbd` shortcuts, `Table` support matrix, Cards for the seven-state list, `Alert` honest limits), content pages (Breadcrumb, Card grids, Alert, link buttons, `<details>` FAQ as cards; ad slots unchanged), Pro pages (plan Cards, error/activation Tables, Input/Label/Button forms, `<template>`-cloned rows), trust pages, `LocaleNav` ghost buttons, footer `Separator` + link buttons.
- Measured after the change: critical JS 14,876 B gz (budget 15,360), total JS 30,428 B gz (budget 40,960), inlined CSS ≈ 7.3 KB gz (budget 20 KB), `hydrated: []`, `reactChunks: []`. No change to behaviour, budgets or third-party requests.
- Tooling: `stylelint.config.mjs` ignores Tailwind at-rules (`custom-variant`, `slot`, `apply`, `utility`, `variant`, `source`, `plugin`) and `@apply` preludes; `.gitignore` adds `apps/web/.build-lock` and `apps/web/dist-*`; `src/lib/og.ts` casts the satori element to `ReactNode`.
- Recorded in `docs/00-conventions.md` §3, §11, §13.7; `docs/03-architecture.md` ADR-013; `docs/05-frontend-spec.md` §1.5, §13; `docs/13`, `docs/14`; `.cursorrules`; `CLAUDE.md`; `changelog/2026-09-shadcn-ui.md`.

### M6 (E10 + remaining E4)

- Engagement layer in `apps/web/src/tool`, all lazy behind one `IToolCtx` (`ctx.ts`): `ambient/` (`shell.ts` modal `<dialog data-ambient>` re-parenting pill/ring/timer, auto-hide 3 s, pixel shift ±2 px / 60 s, night dim 30 s, OLED burn-in dim 30 min; `clock.ts` for `clock`/`night`, `focus.ts`, `message.ts`, `cook.ts`; `logic.ts` pure maths), `end.ts` (chime, SW notification, title flash, extend prompt with grace lock, session count ≥ 5 min, rating hand-off), `signal.ts` (Web Audio oscillator chimes `end`/`focus`/`timer`; notifications via the SW registration), `stats/` (12-week heatmap, today/week/streak/total, CSV), `ui/rating.ts`, `ui/settings.ts` (fill/read round trip, gated accents and message, notification permission on enable), `ui/actions.ts` (custom/until/share dialogs, theme cycle), `accent.ts`, `sponsor.ts`, `fullscreen.ts`.
- Accents `amber`/`indigo`/`teal`/`rose` on `<html data-accent>` (teal/rose = first `ambient.packs` pack), mirrored in `theme-boot.js`; tokens `--at-t-ambient`, `--at-night-digit`, `--at-d-slow`. 55 new i18n keys in all 8 locales.
- PiP: Document PiP moves pill + timer into 280 × 120 with Stop / `+15` (`engine.addTime`), `P` toggles closed. `/pip` popup is a bare page running `pip-mirror.ts` — no engine, no lock; mirrors `state` snapshots over `BroadcastChannel('awaketab')` and posts `intent` messages back.
- PWA: `src/sw.ts` (Workbox runtime modules) bundled by esbuild in `scripts/sw.mjs` after the prune step, manifest injected from `dist/` (58 entries; `sw.js` ≈ 9.7 KB gz); not `@vite-pwa/astro` (ADR-014). `public/sw.js` removed; `/sw.js` served `no-cache` + `Service-Worker-Allowed: /`. `pwa.ts` offers "Update available" only when no session is live and reloads once after `controllerchange`; sticky offline toast. Per-locale manifests already existed (`scripts/manifests.mjs`).
- `@awaketab/core`: `pause({ keepLock })`, `addTime(ms)`, `updateSession({ mode, modeState })`; `state` snapshots on every tick/status/lock change and in reply to `hello`; `TTabMessage` gains snapshot fields and `intent`; battery monitor caches one `BatteryManager`, warns once per session, hysteresis re-arm; `stop()` after completion releases the extend-grace lock (bug fix); `IMeta.ratingPrompt.rearmAt`. Changeset `.changeset/core-m6-engagement.md` (minor).
- Budgets: `src/i18n/critical.json` removed (catalog embedded per page as `data-i18n-catalog`); `vite.build.modulePreload: false`; `scripts/size.mjs` now counts the entry's static-import closure (it previously missed split-out shared chunks). Measured: critical JS 14,415 B gz (budget 15,360), total JS 39,777 B gz (budget 40,960), CSS 12,303 B gz, `hydrated: []`, `reactChunks: []`. Lazy chunks (gz): `shell` 2,582 · `cook` 1,728 · `focus` 1,024 · `message` 710 · `clock` 517 · `tick` 262 · `panel` (stats) 1,878 · `settings` 1,825 · `actions` 1,554 · `rating` 1,130 · `end` 1,092 · `pip` 1,034 · `pwa` 775 · `sponsor` 670 · `signal` 610 · `fullscreen` 280 · `accent` 268 · `ctx` 139.
- Decisions: only `message` is gated (`ambient.packs` gates palettes; docs/05 §3.13 wins over docs/15 E10-T01); night dim is 65% opacity (not 35/40%) to keep digits ≥ 3:1; the "60% opacity" pill with hidden controls is the muted ink colour to stay AA; heatmap tint capped at 40%.
- Tests: `packages/core/test/session-m6.test.ts`; `apps/web/test/tool/{ambient,stats,end,rating,pip-mirror,accent,settings,pwa,sponsor,actions}.test.ts` with `ctx-helper.ts`; `apps/web/scripts/sw.test.ts`; e2e `m6.spec.ts` (ambient, cook, message, stats, rating, `/pip` mirror, offline SW, axe on M6 surfaces), journey 6 extended (chime + title flash), `visual.spec.ts` (36 shots, `VISUAL=1`, run by `nightly.yml` on chromium). Playwright blocks service workers by default (`page.route` cannot see SW fetches); the offline journey opts in.
- Recorded in `docs/00-conventions.md` v1.3 §13.8; `docs/03` ADR-014; `docs/04` §9–§11, §14, §16; `docs/05` §1.1a, §3.13–§3.23, §8.2, §9, §13; `docs/08` §2.1, §2.2, §2.5, §6; `docs/13`; `docs/14`; `changelog/2026-09-m6-engagement.md`.

## Execution model

Single-writer for contract and island work. Fan-out to parallel subagents starts at M5 for the 51 content pages; `docs/00-conventions.md`, `docs/BUILD-STATE.md`, `src/i18n/en.json` and `apps/web/src/tool/**` stay single-writer.

## Proposed identifiers

None. Lock reasons and advice codes follow `docs/00-conventions.md` §13.1.

## Known gaps

- Locale homes (`/es` … `/hi`) are UI + intro stubs, `reviewed: false`, `noindex`. Full 1,200-word translated homes wait on native review (E6-T04).
- Translated content slugs exist in `slugs.json` but locale article routes are not built yet (E6-T06).
- LHCI on a preview URL is not in this checkpoint.
- Stats: `at.v1.stats` has no per-day session count, so "today" shows minutes only and the CSV `sessions` column is empty; focus mode's "N focus blocks today" line is not shown.
- Document PiP does not request a sentinel from the PiP document; the pill reflects the main tab's lock (honest, reads `lost` when that tab is hidden). Pending the device matrix. `pip.pro` ambient layouts inside PiP are not built.
- The `/pip` popup UI is English only (embeds the `en` catalog).
- The 55 new M6 strings need native review in every locale, especially `ja` and `hi`.
- Visual-regression baselines are not committed; the first nightly run records them (`--update-snapshots=missing`, `visual-snapshots` artifact).
- `sponsor.test.ts` and `actions.test.ts` cover the pure helpers (`parseSponsor`, `sharePath`) only; the sponsor slot's DOM behaviour and the dialog binders are covered by e2e/manual checks.
- Total tool-page JS is 1,183 B gz under the 40 KB budget; the next lazy feature needs a size plan.
- SponsorCard renders in `idle` only; the `ExtendPrompt` placement is not built.
- Lighthouse SEO 100 on five URLs was not re-run this checkpoint (no preview URL).
- Polar live products, a real-card purchase e2e, Funding Choices CMP script, Miniflare function tests, and production ES256 key rotation remain external.

## Known external gaps

- Cloudflare Pages, custom domains, KV, Analytics Engine, and secrets require Soubhik's Cloudflare account.
- GitHub, npm, Search Console, Polar production, AdSense, and Chrome Web Store remain external.
- Native browser and real-device checks remain release-gate work.
- Native-speaker reviewers for `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi` before those homes can be indexed.

## Next

M7 (awaiting `"go M7"`): the extension, E11 (`docs/10-extension-spec.md`). Do not start until approved.
