# 14 · DevOps, hosting and operations

Status: v1.2 · 2026-09-26 · Owner: Soubhik

**Purpose.** How AwakeTab is built, deployed, secured, monitored and recovered — on Cloudflare Pages with Pages Functions, KV and Workers Analytics Engine, from a GitHub monorepo. Written for one operator who also writes the code.

Related docs: `03-architecture.md` (config, security model) · `08-data-storage.md` §4–§5 · `09-monetization-impl.md` (secrets in use) · `13-testing-strategy.md` (what CI runs) · `17-launch-checklist.md` (runbooks) · `00-conventions.md` §13.3 (canonical secret names).

---

## 1. Environments

| Env | URL | Source | Data |
|---|---|---|---|
| Local | `http://localhost:4321` (Astro) + `wrangler pages dev` for `/api/*` | working tree | local KV (Miniflare), Polar sandbox, `PUBLIC_ADS_ENABLED=0` |
| Preview | `https://<branch>.awaketab.pages.dev` | every PR | KV `LICENSES_PREVIEW`, AE dataset `awaketab_events_preview`, Polar sandbox, ads off, `noindex` header |
| Production | `https://awaketab.com` | `main` | KV `LICENSES`, AE `awaketab_events`, Polar production |

Preview deployments send `X-Robots-Tag: noindex` via `_headers` keyed on the `*.pages.dev` host (Pages supports per-environment env vars; the header is added by a tiny middleware function when `CF_PAGES_BRANCH !== 'main'`).

---

## 2. Cloudflare setup (one-time)

1. Pages project `awaketab` connected to `github.com/awaketab/awaketab`; build command `pnpm -F web build`, output `apps/web/dist`, Node 22.
2. Custom domains: `awaketab.com` (apex, CNAME flattening) and `www.awaketab.com`. Redirect domains `awaketab.app`, `awaketab.page`, `awaketab.dev` added as zones with a Bulk Redirect rule → `https://awaketab.com/$1` (301, preserve path and query).
3. KV namespaces `LICENSES` and `LICENSES_PREVIEW` bound to production/preview.
4. Analytics Engine datasets `awaketab_events`, `awaketab_events_preview` bound as `EVENTS`.
5. Secrets (production and preview separately) via `wrangler pages secret put`: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`, `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY`, `RATE_LIMIT_SALT`, optional `TURNSTILE_SECRET_KEY`.
6. Public build vars: `PUBLIC_SITE_URL`, `PUBLIC_ADS_ENABLED`, `PUBLIC_SPONSOR_ENABLED`, `PUBLIC_POLAR_SERVER`.
7. R2 bucket `awaketab-backups` for weekly KV exports (Worker cron, §11).
8. Cloudflare Web Analytics is **not** enabled (no third-party script by design); Cloudflare's built-in zone analytics (requests, status codes, cache ratio) is used for traffic and errors.
9. Turnstile widget (optional) for `/pro/activate` if abuse appears.

---

## 3. `_headers`

```
# Tool routes (strict; zero third parties). Applies to everything by default.
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://polar.sh https://*.polar.sh; upgrade-insecure-requests; report-to csp
  Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self), camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  X-Frame-Options: DENY
  Reporting-Endpoints: csp="/api/csp"
  Cache-Control: public, max-age=0, must-revalidate

# Content routes (ads after G1). Each network's documented hosts are appended here when the gate opens.
/for/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://*.googletagservices.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' data:; connect-src 'self' https://*.google.com https://*.doubleclick.net; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com; frame-ancestors 'none'; base-uri 'self'; report-to csp
/on/*
  Content-Security-Policy: <same as /for/*>
/vs/*
  Content-Security-Policy: <same as /for/*>
/guides/*
  Content-Security-Policy: <same as /for/*>
/learn/*
  Content-Security-Policy: <same as /for/*>

# Embeddable widget (the iframe app /embed/cook)
/embed/*
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' data:; connect-src 'self'; frame-ancestors *
  ! X-Frame-Options
  X-Robots-Tag: noindex

# The /embed landing page also matches /embed/* — make it an ordinary, indexable, unframeable page again
/embed
/embed/
  ! Content-Security-Policy
  Content-Security-Policy: <the /* policy>
  ! X-Frame-Options
  X-Frame-Options: DENY
  ! X-Robots-Tag

# The loader sites paste
/embed.js
  ! Cache-Control
  Cache-Control: public, max-age=3600

# PiP document
/pip
  X-Robots-Tag: noindex

# Remote flags
/config/*
  ! Cache-Control
  Cache-Control: public, max-age=300

# Service worker (built by scripts/sw.mjs; must revalidate so updates are seen)
/sw.js
  ! Cache-Control
  Cache-Control: no-cache
  Service-Worker-Allowed: /

# Hashed assets
/_astro/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable

# API
/api/*
  ! Cache-Control
  Cache-Control: no-store
  X-Robots-Tag: noindex
```

(`/embed` and `/embed/` are two identical rules in the generated file.) Content-route CSPs are generated at build from a single template plus the active network's host list (`apps/web/scripts/headers.mjs`) so the five families never drift. `/api/csp` collects CSP reports into Analytics Engine (`client_error {code:'csp'}`) — PROPOSED code value; accepted.

**M8 changes.** Cloudflare applies *every* matching rule and joins a header set twice with ", " — so `/_astro/*` used to ship `Cache-Control: public, max-age=0, must-revalidate, public, max-age=31536000, immutable`. Every specific rule now detaches the `/*` value first (`! Cache-Control`, `! X-Frame-Options`, `! Content-Security-Policy`). The `/embed/*` rule matches the landing page too, hence the `/embed` + `/embed/` rules. Tool-route `img-src` gains `https:` for the Kiosk licence's operator logo (`logo=`, `09-monetization-impl.md` §7.2) — scripts, styles, fonts and connections stay `'self'`, and no default tool page loads a third-party image (decision under `19-master-build-prompt.md` C4, `00-conventions.md` §13.10; needs owner sign-off). `scripts/headers.mjs` exports `resolveHeaders(text, path)`, which evaluates these semantics; `headers.test.ts` runs it over the generated and the shipped `public/_headers`.

---

## 4. `_redirects`

```
https://www.awaketab.com/*   https://awaketab.com/:splat   301
/support-matrix              /learn/browser-support-matrix  301
/how-we-tested               /learn/how-we-tested           301
/pro/buy                     /pro                            302
```

TLD redirects (`awaketab.app`, `.page`, `.dev`) are handled by Cloudflare Bulk Redirects at the zone level, not here.

---

## 5. Repository and branching

Trunk-based: short-lived branches → PR → squash merge to `main`. Required checks: `ci` (lint, typecheck, unit, DOM, functions, build, SEO checks, size-limit), `e2e-chromium`, `lighthouse` (on the preview URL), `axe`. One approving review is not required (solo) but the PR template's checklist must be ticked; CODEOWNERS routes `docs/00-conventions.md` changes to a separate "conventions" label so they are deliberate.

Commit messages: Conventional Commits (`feat(engine): …`, `fix(seo): …`, `content(for): cooking page`); changesets for `packages/*`; changelog fragments in `changelog/*.md` for user-visible site changes, compiled into `/changelog` at build.

---

## 6. GitHub Actions

`ci.yml` (PR + main): checkout → pnpm install (cache) → `pnpm lint` → `pnpm typecheck` → `pnpm test:unit` → `pnpm test:functions` → `pnpm -F web build` → `pnpm test:seo` (over `dist/`) → `pnpm size` → upload `dist/` artifact.

**Site build pipeline.** `pnpm -F web build` runs, in this order: `scripts/headers.mjs` (generate `_headers` from the CSP template, §3) → `scripts/icons.mjs` → `scripts/manifests.mjs` (per-locale web manifests) → `scripts/og.mts` (satori + resvg OG images) → `astro build` → `scripts/prune-unreferenced.mjs` → `scripts/sw.mjs` → `scripts/sitemap.mjs`. The prune step exists because of `03-architecture.md` ADR-013: `@astrojs/react` renders shadcn/ui components at build time only, but the integration still emits its ~224 KB client renderer chunk into `dist/_astro/` even when nothing hydrates; `prune-unreferenced.mjs` deletes every `_astro/*.js` chunk that no HTML, JS, manifest or JSON file in `dist/` references and prints `{ prunedUnreferencedChunks: [...] }`. It must run after `astro build` and before `sitemap.mjs`, and `pnpm size` afterwards asserts `hydrated: []` and `reactChunks: []` (`13-testing-strategy.md` §7). `scripts/sw.mjs` (M6, `03-architecture.md` ADR-014) runs right after the prune so the precache manifest lists exactly the files that ship: esbuild bundles `src/sw.ts` with the Workbox runtime modules (`workbox-precaching`, `-routing`, `-strategies`, `-expiration` 7.4.1; `esbuild` 0.28.2 — all dev dependencies of `apps/web`), replaces `self.__WB_MANIFEST` with the manifest built from `dist/`, writes `dist/sw.js` and prints `{ sw: { entries, bytes } }`; it fails the build if the marker is missing. It honours `AT_DIST`. `apps/web/public/sw.js` no longer exists. **Size gate change (M6):** `pnpm size` now counts `criticalJs` as each entry script plus its static-import closure rather than only the `<script src>` files, so a shared chunk Rollup splits out can no longer escape the 15 KB budget; `astro.config.mjs` sets `vite.build.modulePreload: false` so Vite adds no dependency map or modulepreload links for lazy chunks (its ~0.7 KB gz `preload-helper` chunk is still in the closure). At M6 close: `criticalJs` 14,415 B gz, `totalJs` 39,777 B gz (budget 40,960), `totalCss` 12,303 B gz. Two helpers keep parallel builds honest: `node scripts/locked.mjs -- <command>` holds a `mkdir` lock at `apps/web/.build-lock` (waits up to 15 min, releases on exit or signal) so concurrent `astro build` runs on one machine never race on `.astro/` or `public/`; `AT_DIST=<dir>` points `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO tests at an alternate output directory (`apps/web/dist-*`; both paths are git-ignored).

`e2e.yml` (PR): waits for the Pages preview deployment (`cloudflare/pages-action` status or the deployment webhook) → `pnpm test:e2e --project=chromium --base-url=$PREVIEW_URL` → axe suite → Playwright report artifact.

`nightly.yml` (02:00 UTC): e2e firefox + webkit, visual regression, link check over all locales, CrUX pull (§9), dependency audit. Since M6 the job installs chromium too and runs `VISUAL=1 pnpm exec playwright test apps/web/test/e2e/visual.spec.ts --project=chromium --update-snapshots=missing` (the spec skips itself without `VISUAL=1`), then uploads `visual.spec.ts-snapshots` and `test-results` as the `visual-snapshots` artifact even on failure. Baselines are not committed yet. Playwright blocks service workers in every project (`playwright.config.ts`); only the offline journey allows them.

`lighthouse.yml` (PR): LHCI against the preview URL with `lighthouserc.json` budgets; comment on the PR.

**Build pipeline and size gate (M8).** `pnpm -F web build` now starts `scripts/headers.mjs` → `scripts/embed-loader.mjs` (esbuild: `public/embed.js`, the committed ≤ 3 KB loader, and `public/embed/app.js`, the git-ignored `/embed/cook` app) → `scripts/library.mjs` (copies `packages/wake/dist/awaketab-wake.iife.js` to the git-ignored `public/library/`, building the package first if its dist is missing) → `pnpm exec tsx scripts/support-matrix.mts` (validates `docs/metrics/device-matrix.json` against `src/data/support-matrix.json`; `pnpm -F web matrix:sync` writes results once the run is complete) → the steps above. `pnpm -F web dev` runs the two embed/library steps before `astro dev`. The embed app is bundled outside Astro on purpose: as an Astro `<script>` it shared `@awaketab/wake`/`@awaketab/core` with the tool entry and Rollup split those modules into chunks on the tool's critical path (measured 15,353 B gz against the 15,360 budget). **Size gate change (M8):** `totalJs` is now the closure over static and dynamic `import()` edges from `index.html`'s module entries — everything the tool page can load — instead of every `dist/_astro/*.js`; new gates `embedJs` ≤ 25,600 B gz (closure from `embed/cook/index.html`) and `loaderJs` ≤ 3,072 B gz (`dist/embed.js`). At M8 close: `criticalJs` 14,508, `totalJs` 39,111 (37,877 for the pre-M8 build under the new rule; 39,805 under the old), `embedJs` 13,843, `loaderJs` 2,356, `totalCss` 12,679.

`release.yml` (main, `workflow_dispatch`): job `version` runs `changesets/action` (version PR while changesets are pending); when none are pending, job `publish-wake` (GitHub environment `npm`) runs the library tests, build and size-limit, skips if `@awaketab/wake@<version>` is already on npm, prints `npm pack --dry-run`, then `npm publish --provenance --access public` from `packages/wake` and pushes the tag `@awaketab/wake@<version>`. Auth is npm trusted publishing over GitHub OIDC (no long-lived token; the job installs npm 11.6.2 because trusted publishing needs ≥ 11.5.1) with an optional `NPM_TOKEN` secret as the fallback — configure one of the two before the first run (`12-library-spec.md` §10.2).

`extension-release.yml` (tag `ext-v*`): `pnpm -F extension zip` → upload to Chrome Web Store via the Web Store API (refresh-token secret) as a draft → manual "publish" in the dashboard; Edge submission via the Partner Center API similarly.

`backup.yml` is not needed — backups run as a Cloudflare Worker cron (§11).

---

## 7. Local development

Prerequisites: Node 22, pnpm 9, `wrangler` 3, Playwright browsers (`pnpm exec playwright install`).

```
git clone git@github.com:awaketab/awaketab.git && cd awaketab
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars   # POLAR sandbox token, test signing key, etc.
pnpm dev            # Astro + wrangler pages dev (functions) concurrently
pnpm test           # unit + DOM + functions
pnpm test:e2e       # chromium against the local dev server
pnpm build && pnpm test:seo
pnpm -F web size    # byte budgets + zero-hydration check over apps/web/dist
pnpm -F extension dev   # WXT dev with a temporary Chromium profile
```

To build while another build may be running (parallel agents, a second terminal): `cd apps/web && node scripts/locked.mjs -- pnpm build`. When a verification build was written somewhere other than `dist/`, set `AT_DIST=<that dir>` so `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO tests read it (§6).

`.dev.vars.example` lists every secret with a dummy value; the ES256 dev keypair is generated by `pnpm keys:dev` (never committed). `isSecureContext` is true on `localhost`, so the native wake lock works locally.

---

## 8. Versioning

- Site: no version numbers in URLs; `ver` (short git SHA + date) is injected at build into `<meta name="version">`, the beacon and `at.v1.meta.lastSeenVersion`; `/changelog` renders fragments newest first with month headings.
- `@awaketab/wake`, `@awaketab/core`: semver via changesets; `core` is private to the monorepo (not published) unless later requested.
- Extension: semver in the manifest; store release notes from the fragments tagged `ext`.

---

## 9. Monitoring and alerting

| Signal | Source | Threshold → action |
|---|---|---|
| 5xx rate on `/api/*` | Cloudflare zone analytics | > 1% over 15 min → email + Slack webhook |
| `/api/health` and `/` availability | External uptime check every 5 min (Cloudflare Health Checks or UptimeRobot free) | 2 failures → alert |
| Autostart success (`held` ≤ 300 ms / `session_start`) | Analytics Engine SQL, hourly Worker cron | < 90% for 3 h → alert (likely browser change) |
| `lock_denied` share | AE | > 5% of starts → investigate advice mapping |
| CWV p75 (LCP, INP, CLS) | CrUX API weekly via nightly job; PageSpeed Insights API for lab | INP > 200 ms or CLS > 0.1 on any route class → open issue; ads kill switch per `09-monetization-impl.md` §3 |
| Licence activation errors | AE `client_error {code:'license_verify_failed'}` + function logs | > 2% of activations → check Polar status |
| Search Console coverage/indexing | weekly manual review | drops → content backlog |
| Budget regressions | LHCI + size-limit in CI | fail PR |

Alerts go to a single email and an optional Slack webhook (secret `ALERT_WEBHOOK_URL` — PROPOSED, accepted). No paid APM in v1.

---

## 10. Security operations

- Secret rotation: `RATE_LIMIT_SALT` quarterly; `LICENSE_KEY_ENC_KEY` never rotated without re-encrypting KV (script `pnpm kv:reencrypt`); ES256 key rotation yearly: generate new keypair → add public key to `LICENSE_PUBLIC_KEYS[ver+1]` and ship the app first → set `LICENSE_SIGNING_KEY`/`LICENSE_SIGNING_VER` → keep the old public key for 90 days → remove.
- Dependencies: Renovate weekly PRs, grouped; `pnpm audit` in nightly; lockfile committed.
- CSP report-only for two weeks after any header change, then enforce.
- Webhook endpoint verifies HMAC and rejects timestamps older than 5 minutes; idempotency keys 30 days.
- Access: GitHub org 2FA required; Cloudflare account 2FA + API tokens scoped per workflow; Polar org owner only.
- Data requests: "delete my licence data" handled manually from KV by `keyHash` within 7 days (documented on `/privacy`).

---

## 11. Backups and recovery

- Weekly Worker cron (`backup-kv`) lists `lic:*`, `cus:*`, `embed:*`, `ord:*`, `rating:*` and writes a JSONL snapshot to R2 `awaketab-backups/YYYY-MM-DD.jsonl` (retain 12 weeks). Restore: `pnpm kv:restore <date>` (dry-run by default).
- Site rollback: Cloudflare Pages → Deployments → "Rollback to this deployment" (instant, static). Functions roll back with the same deployment.
- Analytics Engine has 90-day retention; monthly KPI snapshots in `docs/metrics/` are the long-term record.
- Domains: auto-renew on, registrar 2FA, expiry alerts 60 days ahead; DNS in Cloudflare with change history.

---

## 12. Incident playbook (short)

| Incident | First 15 minutes | Then |
|---|---|---|
| AdSense policy notice | Set `/config/ads.json` `enabled:false` (5-min propagation); screenshot the notice | Fix placement, request review, note in `docs/metrics/` |
| `/api/license/*` down or Polar outage | Nothing user-facing breaks (offline verification + grace); post status on `/changelog` if > 1 h | Replay failed webhooks from Polar dashboard; verify KV consistency |
| Bad deploy (blank page, broken island) | Pages rollback to the previous deployment | Add the missing e2e assertion; postmortem in `docs/incidents/YYYY-MM-DD.md` (PROPOSED path, accepted) |
| Browser update breaks the lock (e.g., new release policy) | Update advice mapping + support matrix; ship | Update `/learn/browser-support-matrix`, changelog, library patch release |
| Spike of `denied` from one OS | Check advice mapping; add guidance | Device-matrix re-test |
| Domain/TLS issue | Cloudflare dashboard → SSL/TLS; check redirects | Registrar lock status |

---

## 13. Cost table (monthly, estimates)

| Item | Free tier covers | Expected cost |
|---|---|---|
| Cloudflare Pages | 500 builds/mo, unlimited requests | $0 (Pro $20 only if needed for more builds/functions limits) |
| Pages Functions / Workers | 100k req/day free; paid $5/mo for 10M | $0–5 |
| KV | 100k reads/day free | $0 (paid plan $5 bundles more) |
| Analytics Engine | 100k data points/day free on the Workers paid plan | $5 (Workers paid) once traffic > 100k events/day |
| R2 | 10 GB free | $0 |
| Domains | — | ≈ $4/mo (four TLDs) |
| GitHub Actions | 2,000 min/mo free (private) or unlimited (public repo) | $0 |
| Playwright/LHCI | runs in Actions | $0 |
| Polar | 5% + 50¢ per sale | variable |
| Total infra | | ≈ $5–15/mo before traffic scales |

---

## 14. Launch-day runbook pointer

See `17-launch-checklist.md` §6 for the timed runbook (DNS cutover from holding page, cache purge, sitemap submission, Show HN timing, monitoring watch).
