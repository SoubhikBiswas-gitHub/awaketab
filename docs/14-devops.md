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

Preview deployments send `X-Robots-Tag: noindex` from two host-keyed `_headers` rules, `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*` (`PREVIEW_HOST_RULES` in `scripts/headers.mjs`, last in the file so no path rule can detach them). They cover per-commit previews, branch aliases and the `awaketab.pages.dev` production alias, and cost nothing per request. `awaketab.com` is unaffected. Pages never applies `_headers` to Functions responses, so `functions/api/_middleware.ts` marks every `/api/*` response `noindex` itself. (The earlier plan, a root `functions/_middleware.ts` keyed on `CF_PAGES_BRANCH`, was dropped at M9, F-03: a root middleware makes every static file a Functions invocation.)

---

## 2. Cloudflare setup (one-time)

1. Pages project `awaketab` connected to `github.com/SoubhikBiswas-gitHub/awaketab`; build command `pnpm -F web build`, output `apps/web/dist`, Node 22.
2. Custom domains: `awaketab.com` (apex, CNAME flattening) and `www.awaketab.com`. Redirect domains `awaketab.app`, `awaketab.page`, `awaketab.dev` added as zones with a Bulk Redirect rule → `https://awaketab.com/$1` (301, preserve path and query).
3. KV namespaces `LICENSES` and `LICENSES_PREVIEW` bound to production/preview.
4. Analytics Engine datasets `awaketab_events`, `awaketab_events_preview` bound as `EVENTS`.
5. Secrets (production and preview separately) via `wrangler pages secret put`: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID`, `POLAR_BENEFIT_MAP`, `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY`, `RATE_LIMIT_SALT`, optional `TURNSTILE_SECRET_KEY`.
6. Public build vars: `PUBLIC_SITE_URL`, `PUBLIC_ADS_ENABLED`, `PUBLIC_SPONSOR_ENABLED`, `PUBLIC_POLAR_SERVER` (`production` on Production, `sandbox` on Preview), and optional `INDEXNOW_KEY` (Production only, §6). `PUBLIC_POLAR_SERVER` is the one Polar switch: the build reads it (checkout links, and whether the bundles trust the dev licence key) and so do the Functions at run time (Polar API base). A production build fails until `@awaketab/core` has a production licence key and real checkout links (`scripts/check-keys.mts`, `LAUNCH-AUDIT.md` N-03, N-04). There is no `POLAR_API_BASE`.
7. KV backups: GitHub repository secrets for the weekly `kv-backup.yml` job (§11). No R2 bucket is needed (as built, 2026-09-26).
8. Cloudflare Web Analytics is **not** enabled (no third-party script by design); Cloudflare's built-in zone analytics (requests, status codes, cache ratio) is used for traffic and errors.
9. Turnstile widget (optional) for `/pro/activate` if abuse appears.

### 2.1 Build output format and served URLs

Cloudflare Pages serves each static HTML file at exactly one URL and 308-redirects the other spellings ("route matching"): `x.html` is served at `/x` (`/x/` and `/x.html` redirect to `/x`); `x/index.html` is served at `/x/` (`/x` redirects to `/x/`). Every page URL in `00-conventions.md` §7 has no trailing slash, except `/` and the locale homes `/{lang}/`. So the file layout in `dist/` must match those URLs exactly, or every canonical, hreflang, sitemap entry and internal link would point at a redirect, and `_headers` / `robots.txt` rules written for `/embed` or `/pip` would not match the URL that answers.

| URL | Built file | Source |
|---|---|---|
| `/` | `index.html` | `src/pages/index.astro` |
| `/{lang}/` (locale homes) | `{lang}/index.html` | `src/pages/[lang]/index.astro` |
| `/30m`, `/pip`, `/about`, … | `30m.html`, `pip.html`, `about.html` | `[preset].astro`, `pip.astro`, `about.astro` |
| Hubs `/for` `/on` `/vs` `/guides` `/learn`, `/pro`, `/embed` | `for.html`, …, `pro.html`, `embed.html` | `for.astro`, …, `pro.astro`, `embed.astro` (not `for/index.astro`) |
| `/for/cooking`, `/es/for/cocinar`, `/embed/cook`, `/until/17-30` | `for/cooking.html`, `es/for/cocinar.html`, … | `for/[slug].astro`, `[lang]/[kind]/[slug].astro`, … |
| `/404` | `404.html` | `404.astro` |

How: `build.format: 'preserve'` in `apps/web/astro.config.mjs` writes `x.astro` as `x.html` and `x/index.astro` as `x/index.html`. The pages directory therefore decides the URL shape. **Rule:** a page whose URL has no trailing slash is `x.astro`, never `x/index.astro`; only the locale homes are directory indexes.

Alternatives rejected: `'directory'` (Astro's default, used until M9) wrote every page as `x/index.html`, served only at `/x/`. `'file'` writes the locale homes as `es.html`, served at `/es`, while their documented URL is `/es/`. It also gives `Astro.url.pathname` a `.html` suffix during the build.

`apps/web/scripts/served.mjs` holds the mapping in one place: `servedFile('/30m')` → `30m.html`, `servedPath('es/index.html')` → `/es/`, `isServedPath()`. The service-worker precache keys (`sw.mjs` `SHELL_PAGES`), the size gate (`size.mjs`) and the SEO tests use it. `apps/web/test/seo/served-urls.test.ts` (in `pnpm test:seo`) checks, over the real build:

- the only directory indexes are `/` and the seven locale homes;
- every sitemap `<loc>` and alternate, every canonical, hreflang, `og:url` and JSON-LD URL, every internal `<a href>`, and every exact page route in `_headers` and `robots.txt` is a served URL whose file exists.

`astro preview` (local e2e and Lighthouse) answers both spellings with a 200 and does not redirect, so it accepts more than Pages does. The e2e specs therefore navigate only to the production spellings (`/es/`, `/30m`). A 308 shows up only on a deployed preview (`LAUNCH-AUDIT.md` N-13).

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

# The /embed landing page (embed.html) — an ordinary, indexable, unframeable page
/embed
  ! Content-Security-Policy
  Content-Security-Policy: <the /* policy>
  ! X-Frame-Options
  X-Frame-Options: DENY
  ! X-Robots-Tag

# The loader sites paste
/embed.js
  ! Cache-Control
  Cache-Control: public, max-age=3600

# The fingerprinted /embed/cook app (scripts/embed-loader.mjs --fingerprint)
/embed/assets/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable

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

# Previews and the pages.dev alias are never indexed (§1). Last, so no path rule can detach them.
https://:project.pages.dev/*
  X-Robots-Tag: noindex
https://:version.:project.pages.dev/*
  X-Robots-Tag: noindex
```

Routes are the URLs Pages serves with a 200 (§2.1): `/embed`, not `/embed/`, which only 308-redirects to `/embed`. The `/embed/` rule that M8 added was removed at M9 when the build moved to `build.format: 'preserve'`. Content-route CSPs are generated at build from a single template plus the active network's host list (`apps/web/scripts/headers.mjs`) so the five families never drift. `/api/csp` collects CSP reports into Analytics Engine (`client_error {code:'csp'}`) — PROPOSED code value; accepted. Like `/api/e` it is rate-limited by salted IP hash (429 + `Retry-After`) and refuses bodies over 8 KB with 413 (`00-conventions.md` §13.14).

**M8 changes.** Cloudflare applies *every* matching rule and joins a header set twice with ", " — so `/_astro/*` used to ship `Cache-Control: public, max-age=0, must-revalidate, public, max-age=31536000, immutable`. Every specific rule now detaches the `/*` value first (`! Cache-Control`, `! X-Frame-Options`, `! Content-Security-Policy`). The `/embed` rule restores the tool policy on the landing page, so a `/embed/*` match could never make it frameable. Tool-route `img-src` gains `https:` for the Kiosk licence's operator logo (`logo=`, `09-monetization-impl.md` §7.2) — scripts, styles, fonts and connections stay `'self'`, and no default tool page loads a third-party image (decision under `19-master-build-prompt.md` C4, `00-conventions.md` §13.10; needs owner sign-off). `scripts/headers.mjs` exports `resolveHeaders(text, path)`, which evaluates these semantics; `headers.test.ts` runs it over the generated and the shipped `public/_headers`.

**Inline scripts (2026-09-27).** Every `script-src` allows `'self'` plus exactly one hash, the inline boot script (`BOOT_HASH`). Astro used to inline any processed `<script>` smaller than 4 KB, so the `/pip` mirror (all eight languages) and the Privacy and Terms "On this page" highlight shipped as inline modules with no hash and browsers refused to run them. `astro.config.mjs` now sets `vite.build.assetsInlineLimit` to a function that returns `false` for `.js`, so every page script is an `/_astro/*.js` file allowed by `'self'`; other assets keep Vite's 4 KB default. This was chosen over hashing each inline script per route in `_headers`: the policy keeps one hash and one rule per route class, and a new inline script fails the build's tests instead of being allowed silently. The cost is one cached request on `/pip`, `/privacy` and `/terms`; the tool page's bundle is unchanged. `test/seo/security.test.ts` checks every built page (443) at its served URL against that route's effective CSP: the only executable inline script is the boot script and its sha256 is in `script-src`, there is no `'unsafe-inline'`, and no page uses inline event handlers or `javascript:` URLs.

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

**Action versions (2026-09-27).** Every action runs on the Node 24 runtime, pinned by major tag: `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`, `actions/upload-artifact@v7`, `changesets/action@v2`. Upgrading from v4 (Node 20) changed no behaviour: `pnpm/action-setup` still gets `version: 9.15.9`, which must equal `packageManager` in `package.json` or the action fails; `actions/setup-node` still caches only where `cache: pnpm` is set (its automatic caching since v5 applies to npm projects only); `upload-artifact` still zips and still skips hidden files unless `include-hidden-files: true`. `checkout` v6+ keeps its token in a file under `$RUNNER_TEMP` rather than `.git/config`, and `git push` still works. `changesets/action@v2` needs `@changesets/cli` 3 and renamed its inputs (`version-script`, `pr-title`, `commit-message`) and its output (`has-changesets`); `release.yml` sets `push-with-git-cli: true` so the version PR is still pushed with git instead of v2's default GitHub API push, and passes `github-token` explicitly because v2 no longer reads `GITHUB_TOKEN` from the environment. The runner must be v2.327.1 or newer (GitHub-hosted runners are). Check `actionlint` locally before changing a workflow.

`ci.yml` (PR + main): checkout → pnpm install (cache) → `pnpm lint` → `pnpm typecheck` → `pnpm test:unit` → `pnpm test:functions` → `pnpm -F web build` → `pnpm test:seo` (over `dist/`) → `pnpm size` → upload `dist/` artifact. `pnpm typecheck` runs every workspace's `typecheck`; for `apps/web` that is `astro check && tsc -p functions/tsconfig.json && tsc -p functions/tsconfig.test.json`, so the Pages Functions are checked against `@cloudflare/workers-types` (without DOM or Node types) and their test suites against Workers + Node + DOM (F-08 follow-up, 2026-09-26; before that `functions/` was typechecked nowhere).

**Site build pipeline.** `pnpm -F web build` runs, in this order: `scripts/headers.mjs` (generate `_headers` from the CSP template, §3) → `scripts/icons.mjs` → `scripts/manifests.mjs` (per-locale web manifests) → `scripts/og.mts` (satori + resvg OG images) → `astro build` → `scripts/prune-unreferenced.mjs` → `scripts/defer-main.mjs` (moves the tool entry script onto `#awaketab-tool[data-main]` for the inline boot script to start after first paint; fails if no page carried it) → `scripts/sw.mjs` → `scripts/sitemap.mjs`. (M8 added `embed-loader.mjs`, `library.mjs`, `support-matrix.mts` before `astro build` and `embed-loader.mjs --fingerprint` after it — see `apps/web/package.json` for the exact order.) Tool, content and embed CSPs carry `script-src 'self' 'sha256-…'` for the one inline boot script (`BOOT_HASH`, §3). The prune step exists because of `03-architecture.md` ADR-013: `@astrojs/react` renders shadcn/ui components at build time only, but the integration still emits its ~224 KB client renderer chunk into `dist/_astro/` even when nothing hydrates; `prune-unreferenced.mjs` deletes every `_astro/*.js` chunk that no HTML, JS, manifest or JSON file in `dist/` references and prints `{ prunedUnreferencedChunks: [...] }`. It must run after `astro build` and before `sitemap.mjs`, and `pnpm size` afterwards asserts `hydrated: []` and `reactChunks: []` (`13-testing-strategy.md` §7). `scripts/sw.mjs` (M6, `03-architecture.md` ADR-014) runs right after the prune so the precache manifest lists exactly the files that ship: esbuild bundles `src/sw.ts` with the Workbox runtime modules (`workbox-precaching`, `-routing`, `-strategies`, `-expiration` 7.4.1; `esbuild` 0.28.2 — all dev dependencies of `apps/web`), replaces `self.__WB_MANIFEST` with the manifest built from `dist/`, writes `dist/sw.js` and prints `{ sw: { entries, bytes } }`; it fails the build if the marker is missing. It honours `AT_DIST`. `apps/web/public/sw.js` no longer exists. **Size gate change (M6):** `pnpm size` now counts `criticalJs` as each entry script plus its static-import closure rather than only the `<script src>` files, so a shared chunk Rollup splits out can no longer escape the 15 KB budget; `astro.config.mjs` sets `vite.build.modulePreload: false` so Vite adds no dependency map or modulepreload links for lazy chunks (its ~0.7 KB gz `preload-helper` chunk is still in the closure). At M6 close: `criticalJs` 14,415 B gz, `totalJs` 39,777 B gz (budget 40,960), `totalCss` 12,303 B gz. Two helpers keep parallel builds honest: `node scripts/locked.mjs -- <command>` holds a `mkdir` lock at `apps/web/.build-lock` (waits up to 15 min, releases on exit or signal) so concurrent `astro build` runs on one machine never race on `.astro/` or `public/`; `AT_DIST=<dir>` points `size.mjs`, `prune-unreferenced.mjs`, `sitemap.mjs` and the SEO tests at an alternate output directory (`apps/web/dist-*`; both paths are git-ignored).

`e2e.yml` (PR): waits for the Pages preview deployment (`cloudflare/pages-action` status or the deployment webhook) → `pnpm test:e2e --project=chromium --base-url=$PREVIEW_URL` → axe suite → Playwright report artifact.

`nightly.yml` (02:00 UTC): e2e firefox + webkit, visual regression, link check over all locales, CrUX pull (§9), dependency audit. Since M6 the job installs chromium too and runs `VISUAL=1 pnpm exec playwright test apps/web/test/e2e/visual.spec.ts --project=chromium --update-snapshots=missing` (the spec skips itself without `VISUAL=1`), then uploads `visual.spec.ts-snapshots` and `test-results` as the `visual-snapshots` artifact even on failure. Baselines are not committed yet. Playwright blocks service workers in every project (`playwright.config.ts`); only the offline journey allows them.

`lighthouse.yml` (PR, `deployment_status`, manual): LHCI with `lighthouserc.cjs` (`13-testing-strategy.md` §7). On a successful Pages preview deployment (`deployment_status` from the Cloudflare Pages GitHub integration) or a manual run with `base_url`, `LHCI_BASE_URL` is the preview origin and nothing is built; on a plain PR it builds and LHCI starts `pnpm --filter web preview` on 127.0.0.1:4321. On a `*.pages.dev` origin (every preview and the `awaketab.pages.dev` production alias, all `noindex` by §1) the SEO check asserts every SEO audit except `is-crawlable` on every URL, as it does for `/es/`; on `awaketab.com` and locally it still asserts SEO 100 on the indexable URLs. LHCI asserts the best of the three runs (its default `optimistic` aggregation), so a median above a budget can still pass. Reports upload to temporary public storage and as the `lighthouse-reports` artifact (with `include-hidden-files: true`: since `upload-artifact` 4.4 a dot-folder such as `.lighthouseci` is skipped by default, which left the step with no files); set the `LHCI_GITHUB_APP_TOKEN` secret to get status checks on the PR. Locally: `pnpm build && pnpm lighthouse`.

**Build pipeline and size gate (M8).** `pnpm -F web build` now starts `scripts/headers.mjs` → `scripts/embed-loader.mjs` (esbuild: `public/embed.js`, the committed ≤ 3 KB loader, and `public/embed/app.js`, the git-ignored `/embed/cook` app) → `scripts/library.mjs` (copies `packages/wake/dist/awaketab-wake.iife.js` to the git-ignored `public/library/`, building the package first if its dist is missing) → `pnpm exec tsx scripts/support-matrix.mts` (validates `docs/metrics/device-matrix.json` against `src/data/support-matrix.json`; `pnpm -F web matrix:sync` writes results once the run is complete) → the steps above. `pnpm -F web dev` runs the two embed/library steps before `astro dev`. The embed app is bundled outside Astro on purpose: as an Astro `<script>` it shared `@awaketab/wake`/`@awaketab/core` with the tool entry and Rollup split those modules into chunks on the tool's critical path (measured 15,353 B gz against the 15,360 budget). **Size gate change (M8):** `totalJs` is now the closure over static and dynamic `import()` edges from `index.html`'s module entries — everything the tool page can load — instead of every `dist/_astro/*.js`; new gates `embedJs` ≤ 25,600 B gz (closure from `embed/cook.html`) and `loaderJs` ≤ 3,072 B gz (`dist/embed.js`). At M8 close: `criticalJs` 14,508, `totalJs` 39,111 (37,877 for the pre-M8 build under the new rule; 39,805 under the old), `embedJs` 13,843, `loaderJs` 2,356, `totalCss` 12,679. **Embed app fingerprint (2026-09-26):** `node scripts/embed-loader.mjs --fingerprint` runs between `astro build` and `prune-unreferenced.mjs`; it moves `dist/embed/app.js` to `dist/embed/assets/app.<hash>.js`, rewrites the built `/embed/cook` HTML and prints `{ embedApp: { url, pages } }` (honours `AT_DIST`). `pnpm size` adds `embedHashed` and fails when the embed page's module entry is not fingerprinted (`11-embed-spec.md` §11.6).

`release.yml` (main, `workflow_dispatch`): job `version` runs `changesets/action` (version PR while changesets are pending); when none are pending and the repository variable `NPM_PUBLISH_ENABLED` is `true`, job `publish-wake` (GitHub environment `npm`) runs the library tests, build and size-limit, skips if `@awaketab/wake@<version>` is already on npm, prints `npm pack --dry-run`, then `npm publish --provenance --access public` from `packages/wake` and pushes the tag `@awaketab/wake@<version>`. Auth is npm trusted publishing over GitHub OIDC (no long-lived token; the job installs npm 11.6.2 because trusted publishing needs ≥ 11.5.1) with an optional `NPM_TOKEN` secret as the fallback — configure one of the two before the first run (`12-library-spec.md` §10.2).

`extension-release.yml` (tag `ext-v*`): `pnpm -F extension zip` → upload to Chrome Web Store via the Web Store API (refresh-token secret) as a draft → manual "publish" in the dashboard; Edge submission via the Partner Center API similarly.

`kv-backup.yml` (Mondays 03:17 UTC, `workflow_dispatch`): weekly encrypted KV export, uploaded as a 12-week artifact (§11). It is a no-op with a notice when none of its secrets are set (forks, fresh clones) and fails when only some are.

**Launch guards (M9, `LAUNCH-AUDIT.md` F-05, F-06, N-03).** `pnpm -F web build` now starts with `pnpm exec tsx scripts/check-keys.mts` and ends with `node scripts/indexnow.mjs write-key` and `check-keys.mts --dist dist`. Both key checks are no-ops unless `PUBLIC_POLAR_SERVER=production`; then the build fails on no production licence key, the dev key in `LICENSE_PUBLIC_KEYS`, a placeholder or sandbox checkout link, or the dev key's coordinates anywhere in `dist/`. `ci.yml` ends with a production-mode build (`PUBLIC_POLAR_SERVER=production AT_ALLOW_MISSING_PRODUCTION_KEY=1 pnpm -F web build && pnpm test:seo`): the waiver lets the build finish before N-03, but the dist scan and `test/seo/launch-audit.test.ts` still fail on any trace of the dev key. `release.yml` job `launch-guard` runs `PUBLIC_POLAR_SERVER=production pnpm keys:check` without the waiver once the repository variable `LAUNCH_READY` is `true` (or on a manual run); from then on it stays red until N-03 and N-04 are done. Before that it is skipped, since it could only fail and the production-mode build refuses the same problems. It does not block `publish-wake`.

`pnpm lint` first builds `@awaketab/wake` (other packages lint against its `dist` types) and runs `astro sync` (the content-collection types), so it passes on a fresh checkout such as CI.

`indexnow.yml` (`deployment_status`, `workflow_dispatch`): after a successful production deployment, `node apps/web/scripts/indexnow.mjs ping --base HEAD^1` submits the indexable URLs whose sources changed in the deployed commit (a template, style, string-catalog or engine change submits all of them), read from the live sitemaps. It checks that `/{INDEXNOW_KEY}.txt` is live, then sends `POST https://api.indexnow.org/indexnow` (Bing, Yandex and the other IndexNow engines share it). A manual run with `all` submits every indexable URL (launch day, `17-launch-checklist.md` §6). It needs the repository secret `INDEXNOW_KEY` equal to the Pages variable, and is skipped with a notice without it. The URL list comes only from the sitemaps (never `/pip`, `/until/*`, `/embed/*`, noindex or unreviewed pages) and is filtered again in the script. The same command runs locally as `pnpm -F web indexnow [--dry-run]`; no build ever pings.

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

`.dev.vars.example` lists every secret with a dummy value. Its `LICENSE_SIGNING_KEY` is the committed dev pair (`LICENSE_PUBLIC_KEYS[1]`), which only sandbox, dev and test bundles trust; `pnpm keys:dev` makes another throwaway pair, and `pnpm keys:prod` the production one (§10). `isSecureContext` is true on `localhost`, so the native wake lock works locally.

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

- Secret rotation: `RATE_LIMIT_SALT` quarterly; `LICENSE_KEY_ENC_KEY` never rotated without re-encrypting KV (`pnpm kv:reencrypt`, runbook below); ES256 key rotation yearly (runbook below): generate a new pair with `pnpm keys:prod` → add the public key to `PRODUCTION_LICENSE_PUBLIC_KEYS[ver+1]` and ship the app (and the extension) first → set `LICENSE_SIGNING_KEY`/`LICENSE_SIGNING_VER` → keep the old public key for 90 days → remove.
- Dependencies: Renovate weekly PRs, grouped; `pnpm audit` in nightly; lockfile committed.
- CSP report-only for two weeks after any header change, then enforce.
- Webhook endpoint verifies HMAC and rejects timestamps older than 5 minutes; idempotency keys 30 days.
- Access: GitHub org 2FA required; Cloudflare account 2FA + API tokens scoped per workflow; Polar org owner only.
- Data requests: "delete my licence data" handled manually from KV by `keyHash` within 7 days (documented on `/privacy`).

**ES256 licence signing key (as built, 2026-09-26; `LAUNCH-AUDIT.md` N-03).** The dev pair (`ver` 1) has its private half in `apps/web/.dev.vars.example`, so production must never trust it. `@awaketab/core` adds it to `LICENSE_PUBLIC_KEYS` only when the bundler defines `__AT_LICENSE_DEV_KEY__` as true, which `scripts/polar-server.mjs` does for every build except `PUBLIC_POLAR_SERVER=production`; production bundles then contain `PRODUCTION_LICENSE_PUBLIC_KEYS` only. `scripts/check-keys.mts` enforces it (§6).

1. On a trusted machine: `pnpm keys:prod`. It prints the next `ver` (2 for the first production key), the public JWK as a ready line, and the private JWK. Nothing is written to disk; do not redirect it into the repository.
2. **(code change, PR)** Paste the public line into `PRODUCTION_LICENSE_PUBLIC_KEYS` in `packages/core/src/license.ts`. `PUBLIC_POLAR_SERVER=production pnpm keys:check` must now report only placeholder checkout links, if any (N-04). Merge and deploy the web app, and rebuild the extension zip (`pnpm -F extension zip`) before a store upload.
3. Pages → Production → secrets: `LICENSE_SIGNING_KEY` = the private JWK line (`printf '%s' '<line>' | pnpm dlx wrangler pages secret put LICENSE_SIGNING_KEY --project-name awaketab`), `LICENSE_SIGNING_VER` = the printed `ver`. Redeploy. Store the private line in the password manager and clear the terminal scrollback.
4. Check: activate a test licence on production; the token header's `ver` is the new one and the app shows Pro offline.
5. Next rotation: the same steps with `ver + 1`, keeping the previous public key for 90 days. Known gap: `/api/license/validate` verifies only against the current signing key, so tokens of the old `ver` get `401 bad_token` and the client re-activates (same device, no extra activation).

**`LICENSE_KEY_ENC_KEY` rotation (as built, 2026-09-26).** `pnpm kv:reencrypt` (`apps/web/scripts/kv/`) re-encrypts `keyEnc` on every `lic:*` record from the old key to the new one over the Cloudflare REST API. It changes nothing else in the record (same key, value fields, `expiration` and metadata). Keys come from the environment, never from arguments, so they stay out of shell history.

1. Take a backup first: GitHub → Actions → KV backup → Run workflow, and download the artifact.
2. `openssl rand -base64 32` → the new key; save it in the password manager next to the old one.
3. Set the new `LICENSE_KEY_ENC_KEY` in Pages (Production), then redeploy (Pages reads secrets at deploy time). From here the functions write new-key records; until step 5 finishes, `/api/license/deactivate` cannot open old-key records (Polar deactivation fails and the client retries), so keep steps 3–5 together.
4. Dry run: `OLD_LICENSE_KEY_ENC_KEY=… NEW_LICENSE_KEY_ENC_KEY=… CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… pnpm kv:reencrypt --namespace-id <LICENSES id>`. Progress per listing page goes to stderr, a JSON summary to stdout (`scanned`, `rotated`, `alreadyNew`, `noKeyEnc`, `expiring`, `changed`, `failed`). `failed` must be empty.
5. Apply: the same command with `--apply --yes-production`. The API token needs Workers KV Storage **Edit**; use a short-lived personal token, not the backup job's read-only one.
6. Run step 5 again. It must report `rotated: 0` and every record `alreadyNew`. Then delete the old key.

Behaviour: **dry run by default**; `--apply` on a namespace whose title does not contain "preview" (or whose id equals `KV_LICENSES_ID`) also needs `--yes-production`. **Idempotent and resumable** without a state file: each record is tried with the new key first and skipped if it opens, so a re-run after an interruption touches only what is left, and records the functions wrote with the new key in the meantime are left alone. **Never guesses:** a record neither key opens is listed in `failed` and not written (exit 1). **Lost-update guard:** each batch is re-read just before the write; a record that changed in between (a webhook or activation) is skipped, listed in `changed`, and the command exits 1 so you run it again. Records expiring within 60 s are skipped (`expiring`): KV would reject the write. Exit codes: 0 ok, 1 failures or work left, 2 usage or configuration.

---

## 11. Backups and recovery

- **Weekly KV backup (as built, 2026-09-26).** `.github/workflows/kv-backup.yml` runs Mondays 03:17 UTC and on demand (`workflow_dispatch`). It runs `pnpm kv:backup`, which lists `lic:*`, `cus:*`, `embed:*`, `ord:*`, the D-06 Polar id indexes `lk:*`, `grant:*`, `sub:*`, and `rating:*` (not `wh:*` or `rl:*`: 30-day and 120-second keys) through the Cloudflare REST API, writes one JSONL snapshot per namespace, encrypts it, checks that it decrypts back to the same records, and uploads `LICENSES-YYYY-MM-DD.jsonl.enc` (plus `LICENSES_PREVIEW-…` when configured) as the artifact `kv-backup-<run id>`, kept 84 days (12 weeks). Any API error fails the run, and GitHub emails the owner about failed scheduled runs.
  - **Changed from the plan** (a `backup-kv` Worker cron writing to R2): the repo has no Worker and no `wrangler.toml`, and Pages projects cannot run crons. A GitHub Actions job needs no second deployable and keeps the copy with a second provider (GitHub, not Cloudflare), which is what a backup is for. No R2 bucket is needed. No wrangler dependency either: `apps/web/scripts/kv/lib/cloudflare.ts` uses `fetch` on five documented KV endpoints (namespace lookup, key listing with `expiration` and metadata, `bulk/get` with a per-key `values/` fallback, `bulk` write), retries 429 / 5xx / network errors with backoff (honouring `Retry-After`), and fails on anything else with the API's error code. A missing namespace or a bad token never reads as an empty KV.
  - **Format.** Line 1 is a header `{ format: 'awaketab-kv-backup', version: 1, namespace, namespaceId, createdAt, prefixes, count }`, then one `{ key, value, expiration?, metadata? }` per line (`value` = the raw KV string, `expiration` = absolute Unix seconds from the listing). A parse rejects truncated files, duplicate keys and malformed lines.
  - **Encryption at rest.** AES-256-GCM in Node WebCrypto with `BACKUP_ENCRYPTION_KEY` (32 bytes, base64): the file is `ATKVBK01` ‖ 12-byte IV ‖ ciphertext + tag, with the magic bytes as AAD. No plaintext licence data reaches the runner's disk or the artifact. `keyEnc` inside is still encrypted with `LICENSE_KEY_ENC_KEY` as well. The job logs only file name, size and SHA-256, never record counts, because workflow logs of a public repository are public. **Keep `BACKUP_ENCRYPTION_KEY` in the password manager**: without it no backup can be restored. After a `LICENSE_KEY_ENC_KEY` rotation, older backups still hold old-key `keyEnc`; restore one, then run `pnpm kv:reencrypt` with the old key.
  - **Secrets** (GitHub → Settings → Secrets and variables → Actions): `CLOUDFLARE_API_TOKEN` (Account → Workers KV Storage → **Read** only), `CLOUDFLARE_ACCOUNT_ID`, `KV_LICENSES_ID`, optional `KV_LICENSES_PREVIEW_ID`, `BACKUP_ENCRYPTION_KEY`. With none of them set the job logs "KV backup skipped" and succeeds (forks, fresh clones). With only some set it fails and names the missing ones.
  - **Retention.** Artifacts expire after 84 days. For a private repository, the repository or organisation artifact-retention limit must be ≥ 84 days. For a copy that outlives GitHub retention, download an artifact monthly into the password manager or an offline drive.
- **Restore: `pnpm kv:restore <file>`** (download and unzip the artifact first):
  - `BACKUP_ENCRYPTION_KEY=… pnpm kv:restore LICENSES-2026-09-28.jsonl.enc` decrypts and validates the file and prints the header and counts per key family. It needs no Cloudflare credentials, so this is the quick integrity check.
  - Add `--namespace-id <id>` (plus `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) for a **dry run** against a namespace (the default). It prints `create` (missing in the target), `same`, `conflict` (the live value differs), `expired` (past `expiration`, or less than the 60 s KV minimum away) and `willWrite`, and lists up to 20 conflict keys.
  - `--apply` writes, using bulk writes with each record's original `expiration` and metadata. It creates missing keys only. Conflicts are kept unless you add `--overwrite`, because the live value is usually newer. A restore never deletes. `--prefix lic:` (repeatable) limits the restore to some key families.
  - A production target (title without "preview", or the `KV_LICENSES_ID` id) refuses `--apply` without `--yes-production`. Restoring into another namespace (e.g. a production backup into `LICENSES_PREVIEW` for a drill) is allowed and noted.
  - **Drill (docs/17 §2 "KV backup cron ran once; restore dry-run succeeded"):** run the workflow once, download the artifact, run `pnpm kv:restore <file>`, then `pnpm kv:restore <file> --namespace-id <LICENSES_PREVIEW id>`.
- Code and tests: `apps/web/scripts/kv/{backup,restore,reencrypt}.ts` (entry points) over `lib/` (`format`, `crypto`, `store`, `cloudflare`, `backup`, `restore`, `reencrypt`, `cli`). The unit tests in `apps/web/scripts/kv/test/` run against an in-memory KV store and a fake of the Cloudflare REST API (no network). `apps/web/functions/_lib/kv-ops-interop.test.ts` checks that the script's `keyEnc` format matches `encryptUtf8` / `decryptUtf8` in the functions (`13-testing-strategy.md` §9).
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
