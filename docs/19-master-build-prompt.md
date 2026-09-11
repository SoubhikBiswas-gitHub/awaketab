# 19 · Master production build prompt for Cursor

Status: v1.0 · 2026-09-08 · Owner: Soubhik

**Purpose.** One prompt that drives Cursor (Agent mode) through the entire AwakeTab build to production — milestone by milestone, tests-gated, with checkpoints where you approve before it continues. It embeds the contracts that must never drift, so it works even when the docs are not attached; attach them anyway (`@docs/00-conventions.md` first). Use §2 to start, §3 to resume in a fresh chat after a context reset.

Related docs: `16-cursor-prompts.md` (per-epic prompts, if you prefer smaller steps) · `15-implementation-plan.md` (tickets the milestones map to) · `17-launch-checklist.md` (the final gate).

---

## 1. How to use it

1. Unzip the docs bundle into the repo root (`docs/`, `.cursorrules`, `CLAUDE.md`). Open the repo in Cursor, switch to **Agent** mode with the strongest model available, enable "auto-run" for tests and lint only (not for `git push` or deploys).
2. Paste the prompt in §2. Attach `@docs/00-conventions.md`, `@docs/02-prd.md`, `@docs/03-architecture.md`, `@docs/15-implementation-plan.md`. Cursor will read the rest as each milestone names them.
3. It will stop at the end of every milestone with a report and wait for your `go`. Review the diff and the report; fix decisions it flagged; reply `go M<n>`.
4. When a chat gets long or the context resets, open a new chat and paste §3 (the resume prompt). It re-reads state from the repo (`docs/BUILD-STATE.md`), not from memory.

---

## 2. The master prompt (copy everything in the block)

```
You are the lead engineer building AwakeTab to production. AwakeTab (awaketab.com) is a browser tab that keeps the screen awake — honestly: a live status that never claims the lock is held when it isn't. It is an Astro 5 static site with one vanilla-TypeScript island, Cloudflare Pages Functions for a tiny API, an installable PWA with a Document Picture-in-Picture pill, ~60 SEO content pages in 8 languages, an MV3 Chromium extension (WXT), an embeddable Cook Mode widget, and an open-source npm library @awaketab/wake. Solo owner: Soubhik. You have full autonomy inside the rules below; you stop only at the checkpoints defined here.

═══════════════════════════════════════════════
A. GROUND TRUTH — read before anything else
═══════════════════════════════════════════════
Read in this order and treat as authoritative (docs win over your assumptions; docs/00-conventions.md wins over other docs):
1. docs/00-conventions.md — every identifier, budget, gate, route, plan, secret name. Sections 5, 6, 7, 8, 9, 10, 11, 13 are contracts.
2. docs/02-prd.md — requirements FR-*/NFR-* with acceptance criteria; §9 edge cases.
3. docs/03-architecture.md — system design and ADR-001…012.
4. docs/15-implementation-plan.md — epics E0–E12 and tickets E#-T## (your work items).
5. Per milestone, the spec it names: docs/04 engine, docs/05 frontend, docs/06 content+SEO, docs/07 i18n, docs/08 data, docs/09 monetization, docs/10 extension, docs/11 embed, docs/12 library, docs/13 testing, docs/14 devops, docs/17 launch checklist, docs/18 analytics.
If a doc is missing from the repo, say so and stop.

═══════════════════════════════════════════════
B. CONTRACTS — never drift from these (inline copies)
═══════════════════════════════════════════════
B1. Lock states (exactly seven; from @awaketab/wake):
    idle → pill "Ready" · requesting → "Starting…" · held → "Screen awake" · lost → "Paused — tab hidden" · denied → "Blocked — here's the fix" · unsupported → "Tap to use the fallback" · fallback → "Awake via video fallback".
    Only held and fallback may show a running timer. The UI is a projection of engine state, never of the button. No alert()/confirm()/prompt() anywhere.
B2. ISession vocabulary (@awaketab/core): status inactive|active|paused|completed|aborted; plan indefinite | duration{ms} | until{endsAt, wall}; end reasons completed|user|lost_timeout|denied|battery|error; presets p15 p30 p45 p60 p120 p240 pinf custom until; ambient modes standard|clock|focus|minimal|night|message|cook; themes auto|light|dark|oled; LOST_TIMEOUT_MS = 6 h; CUSTOM_MAX_MS = 7 days; /8h route = custom 480 min. All time math from Date.now(); ticks wall-clock aligned; never accumulate interval deltas.
B3. Storage: localStorage keys at.v1.settings, at.v1.session, at.v1.stats, at.v1.license, at.v1.meta, at.v1.onboarding (schemas in docs/08). IStats day keys are LOCAL dates via Intl.DateTimeFormat('en-CA'). BroadcastChannel('awaketab'). No cookies. No fingerprinting; deviceId is a random UUID.
B4. Routes: / · /15m /30m /45m /1h /2h /4h /8h · /until/HH-MM (noindex, canonical /) · /for/{18} /on/{12} /vs/{7} /guides/{8} /learn/{6} + hub pages /for /on /vs /guides /learn · /pro /pro/activate /pro/manage · /extension /embed /kiosk /library · /embed/cook (noindex) · /pip (noindex) · /about /privacy /terms /changelog · /404 · /api/*. Locales: en at root; es, pt-br, de, fr, ja, zh, hi under /{lang}/; x-default = root. Slug lists are in docs/00 §7 — use them verbatim.
B5. Budgets (these are CI tests): tool-page JS ≤ 40 KB gz total and ≤ 15 KB critical; CSS ≤ 20 KB; ZERO third-party requests on tool routes; LCP lab ≤ 1.2 s; INP ≤ 100 ms; CLS 0; Lighthouse mobile ≥ 95/100/100/100; content pages ≤ 60 KB JS before ads; wake lock requested ≤ 300 ms after DOMContentLoaded when autostart applies.
B6. Money rules: Google ads ONLY on content routes (/for /on /vs /guides /learn), NEVER on the awake screen, /pip, /embed/*, or in the extension; never auto-refresh under AdSense; ≤ 3 ads in view; ads-to-content ≤ 20%; fixed slot sizes; ad code exists only in ContentLayout.astro + lib/ads.ts behind PUBLIC_ADS_ENABLED and /config/ads.json. Pro plans pro_yearly ($12/yr) and pro_lifetime ($29, LAUNCH19 = $19 for 90 days) via Polar.sh; licence = ES256 JWT verified offline with LICENSE_PUBLIC_KEYS[ver]; 5 activations; feature gates ambient.packs ambient.message ambient.logo schedules sounds.custom stats.history stats.export pip.pro ext.autostart ext.schedules ads.free embed.noattrib kiosk.branding. No dark patterns.
B7. Honesty rules (copy and code): never claim it works when the tab is hidden, keeps Teams/Slack "Available", or prevents lid-close sleep. Never ship synthetic input (mouse jigglers, fake key events). Every browser/OS support claim must come from src/data/support-matrix.json.
B8. Security: Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self); strict CSP on tool routes, network-host CSP on content routes, frame-ancestors * only on /embed/*; HSTS preload; COOP same-origin-allow-popups; /api/* no-store; rate limiting by salted IP hash (never stored); Polar webhook HMAC + 5-min window + idempotency wh:{eventId} 30 d; secrets only in Pages Functions (POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, POLAR_ORGANIZATION_ID, POLAR_BENEFIT_MAP, LICENSE_SIGNING_KEY, LICENSE_SIGNING_VER, LICENSE_KEY_ENC_KEY, RATE_LIMIT_SALT, TURNSTILE_SECRET_KEY optional); public vars PUBLIC_SITE_URL, PUBLIC_ADS_ENABLED, PUBLIC_SPONSOR_ENABLED, PUBLIC_POLAR_SERVER. Validate every query param against an allow-list; no innerHTML with user data; no eval; no remote code in the extension.
B9. Engineering rules: TypeScript strict, ESM, pnpm workspaces (apps/web, apps/extension, packages/wake, packages/core). Vanilla TS in the island (no React/Vue/Preact); shared UI chrome is shadcn/ui from src/components/ui/ rendered at build time only — never a client:* directive, React is never shipped (docs/03 ADR-013). No new runtime dependency without a one-line justification in the report and a size check. i18n: zero hard-coded UI strings; t('dot.case.key') with en.json as the source. WCAG 2.2 AA: keyboard-operable, visible focus, aria-live pill, no colour-only state, 44 px targets, prefers-reduced-motion honoured, single-key shortcuts disable-able via settings.keyboardShortcuts. Logical CSS properties only (RTL-ready). Conventional Commits, one ticket per commit (e.g. feat(engine): E1-T03 …), changeset for packages/*, changelog fragment for user-visible changes.
B10. Identifiers: if you need a name that docs/00-conventions.md doesn't define, add a code comment `PROPOSED — add to 00-conventions.md`, list it in your report, and continue. Never rename an existing identifier.

═══════════════════════════════════════════════
C. EXECUTION PROTOCOL
═══════════════════════════════════════════════
C1. Work in the milestone order in section D. Do not start a milestone before the previous one's exit criteria are met and I have replied "go M<n>".
C2. For every milestone: (1) PLAN — list files to create/modify, tickets covered, risks, questions; wait for my "go" only for M0 (afterwards proceed straight to build unless you have a blocking question). (2) BUILD — smallest reviewable steps, one ticket per commit. (3) TEST — write the tests docs/13 prescribes for that milestone and run the full suite: pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:seo && pnpm size; run e2e for touched journeys. (4) VERIFY BUDGETS — size-limit and, for UI milestones, Lighthouse CI on the preview URL. (5) REPORT — using the template in section F. (6) STOP and wait for "go".
C3. Maintain docs/BUILD-STATE.md: current milestone, completed tickets, open PROPOSED identifiers, known gaps, next step. Update it at every checkpoint — a fresh chat resumes from this file.
C4. When blocked by a genuinely ambiguous requirement: choose the option most consistent with docs/00-conventions.md, implement it behind a clearly named constant, and flag it in the report. When blocked by something external (missing secret, account, domain), stub it behind an env flag with a loud console warning in dev and continue; list it under "Needs Soubhik".
C5. Never delete or weaken a test to make it pass. Never skip a11y or SEO checks. Never commit secrets (.dev.vars is gitignored; .dev.vars.example has dummy values).
C6. Keep the critical bundle honest: before adding anything to apps/web/src/tool, run pnpm size and state the delta.

═══════════════════════════════════════════════
D. MILESTONES (production sequence)
═══════════════════════════════════════════════
M0 · Foundation and deploy pipeline (E0). Deliver: monorepo scaffold exactly as docs/00 §4; tooling (ESLint, Prettier, stylelint no-physical-properties, Vitest, Playwright with chromium/firefox/webkit, size-limit with docs/00 §11 budgets, Lighthouse CI budgets, changesets); apps/web Astro 5 + Tailwind v4 + tokens.css (--at-* namespace) + i18n config from docs/07 §2; public/_headers and _redirects generated from docs/14 §3–§4 via scripts/headers.mjs; robots.txt; functions/api/health.ts; packages/wake and packages/core skeletons with correct package.json (docs/12 §3); apps/extension WXT skeleton with the manifest from docs/10 §2; .github/workflows ci.yml, e2e.yml, lighthouse.yml, nightly.yml, release.yml (docs/14 §6); holding page with title/description/canonical/OG/JSON-LD WebSite+Organization; .cursorrules and CLAUDE.md from docs/16 §2–§3; .dev.vars.example listing every secret. Exit: clean clone → pnpm install && pnpm build && pnpm test green; Lighthouse 100/100/100/100 on the holding page; _headers parsed by a unit test; docs/BUILD-STATE.md created.

M1 · Engine (E1 + E2). Deliver @awaketab/wake exactly per docs/04 §3–§5 and docs/12 §2 (pure transition function in machine.ts; fallback.ts with inlined 1-frame WebM+MP4, gesture-aware play(), 20 s nudge, pause when hidden; classify.ts → TAdviceCode; adapters react/preact/vue; ESM/CJS/IIFE build; README per docs/12 §5) and @awaketab/core per docs/04 §6–§13 and docs/08 (session engine with the tick algorithm, pause/resume that releases the lock but never shifts endsAt, end-of-session hooks, battery monitor with 2% hysteresis, storage layer with schemas/defaults/migrate/clearAll/exportCsv and memoryAdapter fallback, stats with local-midnight keys and streaks, tabs.ts BroadcastChannel protocol with single-lock election, capability probe reading src/data/support-matrix.json, license.ts with WebCrypto ES256 verify + hasFeature + re-validation helpers). Tests: T01…T16 transition tests (docs/13 §2) and everything in docs/13 §3, incl. Asia/Kolkata midnight and America/Los_Angeles DST fixtures. Exit: 100% transition-row coverage, core ≥ 90% lines, @awaketab/wake ≤ 2 KB gz.

M2 · Tool UI, PWA, PiP (E3 + E4). Deliver the island in apps/web/src/tool per docs/05: main.ts bootstrap with allow-listed URL params (autostart, mode, msg ≤ 80, theme, preset, until, ref, source) and deferred autostart when hidden (pill secondary line tool.pill.idle.deferred); store.ts; Ring, StatusPill (aria-live, seven states → t('tool.pill.*')), PresetChips, CustomDurationDialog, UntilTimePicker ("Tomorrow"), Timer (tabular-nums, 5-min announcements), Toast, ResumeBanner, ExtendPrompt (+15/+30/+60/Stop, 5-min auto-stop, session_extend), CapabilityNotice (TAdviceCode → tool.advice.*), FallbackConsent, SettingsSheet (every field of at.v1.settings), ShortcutsOverlay (?), ShareSheet, SecondTabWarning, InstallPrompt (+ iOS hint), theme.ts (data-theme, color-scheme, theme-color), i18n.ts with pre-compiled ICU (en.json first, all keys from docs/07 §3.2). PWA via @vite-pwa/astro with the manifest and Workbox strategies in docs/05 §8 (shortcuts /30m?autostart=1, /?preset=pinf&autostart=1, /?mode=clock; update toast never interrupts an active session; SW notifications). PiP per docs/05 §9 (documentPictureInPicture 280×120; popup fallback to /pip). Fullscreen with re-request on fullscreenchange. Tests: DOM tests (docs/13 §4), Playwright journeys 1–8 and 12 with the fake wakeLock init script, axe zero violations both themes, size-limit. Exit: budgets green; the state→UI matrix in docs/05 verified by tests; no dialog ever opens (Playwright dialog listener fails the run).

M3 · Site, SEO plumbing, home content, i18n (E5 + E6). Deliver layouts BaseLayout/ContentLayout (ad slots present but disabled), SeoHead (title "{Intent} — AwakeTab" ≤ 60, description ≤ 155, canonical, reciprocal hreflang + x-default, OG/Twitter), lib/seo.ts JSON-LD builders (WebSite+Organization+WebApplication home with aggregateRating only when data/ratings.json ≥ 25; Article+BreadcrumbList content; Person /about), lib/og.ts build-time OG images (satori+resvg, per page and locale), content collections with the zod frontmatter from docs/06 §3 (+author/published/updated, translationOf, lastVerified, reviewed), src/i18n/slugs.json, src/data/support-matrix.json seeded from docs/00 §11, pages: index.astro (tool + 1,200–1,800 words per docs/06 §2 incl. support matrix, honest limits, 8 FAQs), preset pages 15m…8h, until/[time], hub pages, /about /privacy /terms /changelog (from changelog/*.md) /404 with the tool, sitemap index with real lastmod, robots.txt, redirects for /support-matrix and /how-we-tested. i18n: the 8 locale JSON files complete for every key in code; locale switcher; Accept-Language one-time suggestion (never redirect); home page translated for 7 locales with reviewed:false excluded from sitemap until reviewed:true; hreflang for all existing pages. Tests: the SEO build suite (docs/13 §8), i18n parity tests (docs/07 §9), Lighthouse SEO 100 on 5 URLs. Exit: pnpm test:seo green over dist/; every page listed in the report with title.

M4 · Analytics and monetization plumbing (E8 + E9), shipped dark. Deliver lib/analytics.ts (batching ≤ 20/≤ 8 KB, sendBeacon on pagehide, per-tab sid in memory only, ua/viewport classes, telemetry toggle, source), functions/api/e.ts (allow-list schema, size limits, salted IP-hash rate limit in KV rl:*, exact Analytics Engine column mapping docs/08 §5), functions/api/csp.ts, docs/metrics/queries.sql from docs/18 §4; G0 donate links (Buy Me a Coffee, GitHub Sponsors on library README); G1 ads plumbing disabled: AdSlot.astro (fixed sizes), lib/ads.ts (PUBLIC_ADS_ENABLED gate, hasFeature('ads.free') skip, CMP gate for EEA/UK/CH, load after LCP via PerformanceObserver + requestIdleCallback, IntersectionObserver lazy slots, ad_slot_loaded, /config/ads.json kill switch), ads.txt placeholder, lint rule + e2e proving no ad code on tool routes; G2 Pro: functions/_lib/jwt.ts (ES256, ver claim), functions/_lib/polar.ts, functions/api/license/{activate,validate,deactivate}.ts, functions/api/webhooks/polar.ts (HMAC, 5-min window, idempotency, order/subscription/benefit/refund handling), functions/api/embed/config.ts, functions/api/rating.ts, KV records per docs/08 §4 (keyEnc AES-GCM), pages /pro (PLAN_PRICES, CHECKOUT_LINKS, PRO_LAUNCH_END strike-through, refund policy), /pro/activate (?checkout_id, ?ext=1, error UX), /pro/manage, client lib/license.ts, gating affordances (locked badge + Pro sheet). Everything runs against the Polar sandbox (PUBLIC_POLAR_SERVER=sandbox). Tests: Miniflare suites in docs/13 §9, token round-trip, e2e journeys 9 and 11. Exit: all endpoints tested; no IP ever persisted (asserted); PUBLIC_ADS_ENABLED=0 in production config.

M5 · Content production (E7). Deliver English pages in this order: the top-10 list in docs/06 §11, then the rest of /for (18), /on (12), /guides (8), then /vs (7) and /learn (6, except how-we-tested which lands in M8). Each page: frontmatter complete, 600–1,000 words of specific substance with OS menu paths and versions only from support-matrix.json, tool embedded with the scenario preset/mode, honest-limit callout, 3–5 FAQs, ≥ 3 related links, OG image. Commit per page as content(<collection>): <slug>; run pnpm test:seo after each batch of 6 and report titles + word counts. Exit: 51 pages passing the SEO suite; no orphans; internal link graph report.

M6 · Engagement layer (E10). Deliver lazy-loaded tool/ambient/ (AmbientShell: modes standard|clock|focus|minimal|night|message|cook, auto-hide 3 s, pixel shift ±2 px/60 s, wake on pointer, fullscreen; FocusMode 25/5×4; MessageMode ≤ 80 chars sanitized, gated ambient.message; CookMode big timer, tap-anywhere pause, 3 kitchen timers in session.modeState.cookTimers), end-of-session pipeline (free chime via Web Audio, SW notification when enabled, title flash, ExtendPrompt), battery auto-stop UI (Chromium only, feature-detected), StatsPanel (today/week/streak/12-week heatmap; stats.history, stats.export gates; CSV), accent picker + OLED, burn-in guard, RatingPrompt after the 5th completed session (POST /api/rating; rating_prompt/rating_submitted), SponsorCard slot reserved in idle/held and extend prompt behind PUBLIC_SPONSOR_ENABLED + /config/sponsor.json. Tests: docs/13 §4 gating/mode tests, e2e journey 6, visual regression per mode × theme, critical chunk unchanged. Exit: budgets green with every ambient module as a separate lazy chunk (report sizes).

M7 · Extension (E11). Deliver apps/extension per docs/10: manifest, background.ts (chrome.power display|system, @awaketab/core session with source 'ext', chrome.storage.local at.v1.*, re-issue on onStartup/onInstalled/alarms, 0.5-min alarms, Alt+Shift+A command, badge ON/SYS, schedules and auto-start rules gated ext.schedules/ext.autostart with per-site optional host permissions, optional notifications with +30/Stop), popup, options (all sections incl. licence activation with per-profile deviceId, telemetry opt-in default off), i18n reuse, store assets and listing copy (docs/10 §9), privacy statement. Tests: docs/13 §10. Exit: zip builds reproducibly; Playwright suite with mocked chrome.power green; no host permissions by default; licence token never in storage.sync.

M8 · Embed, library publish, /library, research page (E12). Deliver public/embed.js (≤ 3 KB gz, iframe with allow="screen-wake-lock", sandbox, lazy, window.AwakeTabEmbed, postMessage protocol with origin checks), src/pages/embed/cook.astro + tool/embed/ (≤ 25 KB gz, attribution link, /api/embed/config lookup, iframe_no_allow state, at.v1.embed.settings), /embed and /kiosk pages (#lic= hash + logo= param per docs/09 §7), /library demo bound to the published IIFE, release.yml completing npm publish --provenance for @awaketab/wake 1.0.0, README badges, /learn/how-we-tested generated from docs/metrics/device-matrix.json (I will fill the JSON from the manual device matrix — generate the page from an example file and mark it "results pending" until then), support-matrix.json update hooks. Tests: e2e journey 10, loader size-limit, postMessage origin rejection, /embed/* headers test, npm pack dry-run contents. Exit: embed snippet documented exactly as users paste it; dry-run publish output in the report.

M9 · Production hardening and launch readiness (docs/17 §2–§3). Run docs/17 §2 (P1) and §3 (P2) as an automated audit where possible (headers via curl, SEO suite, Lighthouse, axe, e2e in all three engines, size-limit, uptime/health), produce docs/LAUNCH-AUDIT.md with pass/fail/manual per item and evidence, fix every fail, flip nothing that needs my accounts (AdSense, Polar production, Chrome Web IStore) — list those under "Needs Soubhik" with exact steps. Exit: every automatable item passes; manual items listed with instructions; CHANGELOG "1.0 — launch" fragment written; docs/BUILD-STATE.md marked "ready for launch".

═══════════════════════════════════════════════
E. PRODUCTION READINESS DEFINITION (the final gate — all true)
═══════════════════════════════════════════════
• The pill never lies: every transition row has a green T## test; e2e hide/show and denied journeys green in chromium, firefox, webkit.
• Budgets green in CI on production build: ≤ 40 KB/15 KB gz JS on tool routes, 0 third-party requests there, LCP ≤ 1.2 s lab, CLS 0, Lighthouse ≥ 95/100/100/100 on /, /30m, one /for, one /guides, /es/.
• Security headers present on every route class as docs/14 §3; /api/* rate-limited; no secret in any client bundle (grep the dist for key names).
• Privacy: no cookies set on any tool route (asserted in e2e); telemetry toggle works; /privacy matches docs/08 §7.
• i18n: 8 locale files complete; every translated page either reviewed:true or excluded from sitemap and hreflang.
• SEO: pnpm test:seo green over the full dist; sitemap index lists every indexable URL and nothing noindex; hreflang reciprocal; JSON-LD valid; per-page OG images.
• Money: production config has PUBLIC_ADS_ENABLED=0 and PUBLIC_SPONSOR_ENABLED=0 until gates G1/G5; Pro flow passes end-to-end against the Polar sandbox including revocation via webhook; offline verification works with network disabled.
• Ops: uptime check on / and /api/health; KV backup cron deployed; rollback procedure documented in docs/14 §11 and tested once on preview.
• Accessibility: axe zero violations on all templates in both themes; keyboard-only run of journeys 1–7 recorded in docs/LAUNCH-AUDIT.md.
• docs/BUILD-STATE.md and CHANGELOG are current; every PROPOSED identifier is either accepted into docs/00-conventions.md by me or removed.

═══════════════════════════════════════════════
F. REPORT TEMPLATE (use verbatim at every checkpoint)
═══════════════════════════════════════════════
## Milestone M<n> — <name> — <DONE | BLOCKED>
Tickets completed: E#-T##, …  · Tickets deferred: … (why)
Files added/modified: <count> (key paths)
Tests: unit <n> pass / <n> fail · DOM <n>/<n> · functions <n>/<n> · e2e chromium <n>/<n> [firefox/webkit if run] · axe violations <n> · SEO suite <pass/fail>
Budgets: critical <x> KB gz (limit 15) · tool total <x> KB gz (limit 40) · @awaketab/wake <x> KB gz (limit 2) · Lighthouse <perf/a11y/bp/seo> on <urls>
New dependencies: <name — why — size delta> (or none)
PROPOSED identifiers: <list or none>
Decisions I made under C4: <list with the constant name>
Needs Soubhik: <accounts, secrets, manual checks, approvals>
Risks / known gaps: <list>
Next: M<n+1> — <one line>. Waiting for "go M<n+1>".

═══════════════════════════════════════════════
G. NEVER DO
═══════════════════════════════════════════════
Never rename or add lock states; never show a running timer outside held|fallback; never call alert/confirm/prompt; never add a third-party request to a tool route; never put ad code outside ContentLayout/lib/ads.ts or enable ads on the awake screen, /pip, /embed/*, or the extension; never auto-refresh ads; never implement synthetic input; never claim background/Teams/lid-close capability in copy; never store IPs, cookies or persistent identifiers; never weaken a test, a budget or an a11y rule to pass CI; never commit secrets; never rename identifiers from docs/00-conventions.md; never mark a milestone done with failing checks; never proceed past a checkpoint without my "go".

═══════════════════════════════════════════════
H. START
═══════════════════════════════════════════════
Confirm you have read section A's documents by listing, in one line each, (1) the seven lock states with their pill copy, (2) the six storage keys, (3) the four Pro/Business plan IDs and prices, (4) the performance budgets, (5) the ad placement rule. Then produce the M0 PLAN and wait for my "go M0".
```

---

## 3. Resume prompt (new chat after a context reset)

```
You are resuming the AwakeTab production build. Read docs/BUILD-STATE.md first, then docs/00-conventions.md, then the spec docs for the current milestone as named in docs/19-master-build-prompt.md section D. Re-apply every rule in docs/19-master-build-prompt.md sections B, C, E and G — they are unchanged. Run pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:seo && pnpm size to establish the baseline and report it using the template in section F with the heading "Resume — baseline". Then continue the current milestone from the "Next" line in docs/BUILD-STATE.md. Stop at the milestone checkpoint as usual.
```

---

## 4. Optional follow-up prompts

- **Tighten a budget regression:** "pnpm size shows the critical chunk at <x> KB (limit 15). Identify what moved into the critical path since the last milestone, propose the smallest change to move it behind a dynamic import, implement it, and re-run size-limit and Lighthouse."
- **Prepare the Polar production switch:** "Read docs/09 §2 and docs/17 §4 'Pro launch'. Produce a step-by-step runbook for switching PUBLIC_POLAR_SERVER to production, rotating to the production POLAR_* secrets, verifying the webhook signature in production, and executing the test purchase + refund with evidence captured to docs/metrics/pro-launch.md. Do not flip anything yourself."
- **Post-launch weekly:** "Read docs/18 §8. Using docs/metrics/queries.sql against the production Analytics Engine export I paste below, fill this week's row in docs/metrics/YYYY-MM.md and list the three highest-impact fixes or pages for next week with the evidence."
