# Lighthouse — local run, 2026-09-26 (M9 launch readiness)

**Setup.** `pnpm build && pnpm lighthouse` (`lighthouserc.cjs`, `@lhci/cli` 0.15.1 → Lighthouse 12.6.1, HeadlessChrome 153) against `pnpm --filter web preview` on `http://127.0.0.1:4321`. Three runs per URL. Mobile emulation 390 × 844 @2x with Lighthouse's default simulated throttling (150 ms RTT, 1.6 Mbps, 4× CPU). Machine: Apple M4 Pro, macOS 26.6. `astro preview` serves gzip but not the production `_headers` or Pages Functions, so local runs block `*/api/*` (see `13-testing-strategy.md` §7). Score order: Performance / Accessibility / Best Practices / SEO.

The five URLs are those in `19-master-build-prompt.md` §E.

## Result after the M9 fixes (median of 3)

| URL | Perf | A11y | BP | SEO | FCP | LCP (≤ 1.2 s) | TBT | CLS (0) | 3rd-party requests | LHCI |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | 99 | 100 | 100 | 100 | 1.36 s | **1.82 s** ✗ | 0 ms | 0 | 0 | LCP fails |
| `/30m` | 99 | 100 | 100 | 100 | 1.36 s | **1.82 s** ✗ | 0 ms | 0 | 0 | LCP fails |
| `/for/cooking` | 99 | 100 | 100 | 100 | 1.36 s | **1.82 s** ✗ | 0 ms | 0 | 0 (not asserted: content route) | LCP fails |
| `/guides/lock-screen-vs-sleep` | 99 | 100 | 100 | 100 | 1.47 s | **1.84 s** ✗ | 0 ms | 0 | 0 (not asserted) | LCP fails |
| `/es/` | 99 | 100 | 100 | 66 † | 1.36 s | **1.82 s** ✗ | 0 ms | 0 | 0 | LCP fails |

† `/es/` is `noindex, follow` while its translation is `reviewed: false` (`07-i18n.md`), so Lighthouse's `is-crawlable` audit (≈ 34 % of the SEO score) fails by design. `lighthouserc.cjs` asserts every other SEO audit on `/es/` (title, description, status, link text, crawlable anchors, robots.txt, image alt, hreflang, canonical); all pass. It reaches 100 once the page is reviewed and indexable.

Desktop preset (`--preset=desktop`, one run, same build): 100 / 100 / 100 / 100 on `/`, `/30m`, `/for/cooking` and the guide, and 100 / 100 / 100 / 66 † on `/es/`. LCP is 0.41–0.50 s and CLS is 0.

**Installable PWA.** Lighthouse 12 has no PWA category. Chromium's own check (`Page.getInstallabilityErrors`) returns no errors on `/` and `/es/`, each with its own manifest. This is asserted in `apps/web/test/e2e/security.spec.ts`.

## Before the fixes (same setup, first run of the day)

| URL | Perf | A11y | BP | SEO | LCP | CLS | Failing audits |
|---|---|---|---|---|---|---|---|
| `/` | 99 | 96 | 96 | 92 | 1.83 s | 0.058 | `target-size`, `errors-in-console`, `link-text`, CLS |
| `/30m` | 99 | 100 | 96 | 92 | 1.82 s | 0.053 | `errors-in-console`, `link-text`, CLS |
| `/for/cooking` | 99 | 100 | 96 | 92 | 1.82 s | 0 | `errors-in-console`, `link-text` |
| `/guides/lock-screen-vs-sleep` | 99 | 100 | 96 | 92 | 1.82 s | 0 | `errors-in-console`, `link-text` |
| `/es/` | 99 | 100 | 96 | 58 | 1.67–1.84 s | 0.053 | the same, plus `is-crawlable` (expected) |

## What was fixed

| Audit | Cause | Fix |
|---|---|---|
| `cumulative-layout-shift` (tool routes) | On autostart the timer caption filled in, the pill widened from "Ready" to "Screen awake" and re-centred, Stop appeared above the article, and the header's Install button appeared at the start of a left-packed row. On locale homes the language suggestion was inserted above the chips. | CSS only. The PiP slot and timer stretch, the caption line is reserved, the pill is ring-wide with centred text, Stop has a reserved 44 px slot on the full tool, the header action row fills its line and packs to the end, and the language suggestion is a fixed bottom banner. See `05-frontend-spec.md` §4.1. |
| `link-text` (all pages) | The capability notice's hidden link read "Learn more" (and "Más información" and so on). | `tool.advice.learn` is now "Why this happens and how to fix it" in all eight locales. The link wraps at 320 px. |
| `target-size` (`/`) | The home page's card links were 18 px tall inline text. | `.at-links a` is a block at least 24 px tall. |
| `errors-in-console` (local only) | `astro preview` has no Functions, so the telemetry beacon to `/api/e` got a 404. | Local runs block `*/api/*` (`ERR_BLOCKED_BY_CLIENT.Inspector` is ignored by the audit). Separately, `flush(false)` in `src/lib/analytics.ts` now catches a failed `fetch`. Before, an offline or blocked beacon raised an unhandled rejection, which was reported as a `client_error` and queued yet another flush. |
| `/es/` resolved as `/` | `parseToolParams().canonicalPath` dropped the locale prefix, so `history.replaceState` rewrote `/es/` to `/` and `/es/for/cocinar` to `/for/cocinar`, a 404 on reload. | `canonicalPath` keeps the locale and drops only the query and the trailing slash (`src/tool/params.ts`, `test/tool/params.test.ts`). |

The size budgets still hold: `totalJs` 40,796 B gz (was 40,780; budget 40,960), `criticalJs` 14,623 (budget 15,360) and `totalCss` 12,925 (budget 20,480).

## Still failing: LCP ≤ 1.2 s (simulated mobile). This needs `src/tool/main.ts`.

Observed (unthrottled) LCP is 40–70 ms. The 1.8 s is Lighthouse's Lantern simulation. Lantern counts every script that is *evaluated before the observed LCP paint* as render-blocking, along with every request that script starts before that paint. On these pages the island module (`ToolIsland…js`, 14.3 KB) is evaluated before first paint, and `boot()` immediately starts its dynamic imports (`extras`, `pwa`, `lang-suggest`, then `analytics`, `license` and `accent`). That is a 4-deep chain at 150 ms RTT, so all of it lands on the LCP path. Content pages are affected the same way because they embed the tool.

Experiments on copies of `dist/` (same machine and settings, one run each):

| Variant of `/for/cooking` | FCP | LCP |
|---|---|---|
| As built | 1.36 s | 1.82 s |
| Without `theme-boot.js` (render-blocking, 878 B) | 1.21 s | 1.82 s |
| With `boot()` deferred to `requestAnimationFrame(() => setTimeout(boot))` (`/30m`) | 1.13 s | 1.50 s |
| Without the island module (theme-boot kept) | 0.90 s | **1.05 s** |

So LCP reaches the budget only when the island's module is not evaluated before the first paint. That means a change to the boot sequence in `src/tool/main.ts`, which is out of scope for this change. For example: start `boot()` after the first frame, move the dynamic imports that do not affect the first paint (`extras`, `pwa`, `lang-suggest`) to idle, or load the module after first paint while keeping the wake-lock request ≤ 300 ms after DOMContentLoaded (NFR). `theme-boot.js` is not the LCP driver. Inlining it would need a CSP hash and saves only about 150 ms of FCP. The LCP assertion stays at `error` in `lighthouserc.cjs`. The budget was not weakened.
