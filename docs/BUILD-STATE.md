# AwakeTab build state

Current milestone: **M5 complete (local)**. Next: M6 (PWA Workbox / remaining platform work). Do not start until `"go M6"`.

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

## Execution model

Single-writer for contract and island work. Fan-out to parallel subagents starts at M5 for the 51 content pages; `docs/00-conventions.md`, `docs/BUILD-STATE.md`, `src/i18n/en.json` and `apps/web/src/tool/**` stay single-writer.

## Proposed identifiers

None. Lock reasons and advice codes follow `docs/00-conventions.md` §13.1.

## Known gaps

- Locale homes (`/es` … `/hi`) are UI + intro stubs, `reviewed: false`, `noindex`. Full 1,200-word translated homes wait on native review (E6-T04).
- Translated content slugs exist in `slugs.json` but locale article routes are not built yet (E6-T06).
- `@vite-pwa/astro` / Workbox injectManifest, per-locale manifests, and LHCI on a preview URL are not in this checkpoint.
- `/pip` popup fallback does not yet fully sync over `BroadcastChannel('awaketab')`.
- `@awaketab/wake` gzip with inlined fallback assets is ~3.2 kB (size-limit 3.4 kB); docs/12 still cites 2 kB core.
- Lighthouse SEO 100 on five URLs was not re-run this checkpoint (no preview URL).
- Polar live products, a real-card purchase e2e, Funding Choices CMP script, Miniflare function tests, and production ES256 key rotation remain external.
- No Conventional Commits in this session (commit only when asked).

## Known external gaps

- Cloudflare Pages, custom domains, KV, Analytics Engine, and secrets require Soubhik's Cloudflare account.
- GitHub, npm, Search Console, Polar production, AdSense, and Chrome Web Store remain external.
- Native browser and real-device checks remain release-gate work.
- Native-speaker reviewers for `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi` before those homes can be indexed.

## Next

M6 (awaiting `"go M6"`): Workbox PWA, remaining E4/E10/E12 items as scheduled. Do not start until approved.
