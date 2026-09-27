# Lighthouse: production check, 2026-09-27

## Production was not measured

The run was meant to audit `https://awaketab.pages.dev`, but the build container could not reach it. Its outbound proxy refused the connection: `CONNECT tunnel failed, response 403`, logged by the proxy as `connect_rejected` for `awaketab.pages.dev:443`. That is an egress policy denial, so this file has **no production numbers**. None were estimated.

To get the production numbers, run either of these from a machine that can reach the site:

- GitHub: Actions → Lighthouse → Run workflow, with `base_url` = `https://awaketab.pages.dev`. It runs three mobile runs per URL and uploads the reports as the `lighthouse-reports` artifact.
- Locally: `LHCI_BASE_URL=https://awaketab.pages.dev pnpm lighthouse` for mobile. `lighthouserc.cjs` has no desktop mode, because it pins `formFactor` and `screenEmulation` to mobile. For the desktop rows below, a scratch copy of the config was used with those two settings removed and `preset: 'desktop'` added.

Every `*.pages.dev` host sends `X-Robots-Tag: noindex` (`14-devops.md` §1), so `is-crawlable` fails on every URL there by design. Since this change, `lighthouserc.cjs` checks every other SEO audit on such hosts, as it already did for `/es/`.

## What was measured instead: the current `main` build, served locally

To get a useful signal on the budgets, the same five URLs were audited against a local build of `main` (commit `4c195bf`, `pnpm build`, served by `astro preview` on `127.0.0.1`). The run used the repository's `lighthouserc.cjs` settings with the local-only `*/api/*` block. This is not production. There is no Cloudflare edge, no `_headers`, no Brotli and no HTTP/2. Production may also run a different commit.

**Setup.**

- Tools: `@lhci/cli` 0.15.1 with Lighthouse 12.6.1, on Playwright's Chromium 141.0.7390.37 (headless, `--no-sandbox`). Three runs per URL for each form factor.
- Mobile: the repository config, 390 × 844 at 2× scale, with simulated throttling of 150 ms RTT, 1.6 Mbps down and 4× CPU slowdown.
- Desktop: Lighthouse's `desktop` preset, 1350 × 940 at 1× scale, with 40 ms RTT, 10 Mbps and no CPU slowdown.
- Machine: a cloud container with 4 vCPU of an Intel Xeon at 2.10 GHz. Lighthouse's `benchmarkIndex` ranged from 1,815 to 2,613 across runs.

Lab numbers from this CPU are not real-device numbers. Lighthouse multiplies the main-thread time it observes here by 4 on mobile. A faster machine gives a lower simulated LCP; the report of 2026-09-26 on an Apple M4 Pro measured 1.05 s on every URL.

Each cell is the median of 3 runs. The LCP column also lists all three runs in brackets. Budgets: LCP ≤ 1.2 s (lab), CLS 0, TBT ≤ 100 ms and Performance ≥ 95. Scores are Performance / Accessibility / Best Practices / SEO.

### `/`

| Form factor | Perf / A11y / BP / SEO | FCP     | LCP                                  | TBT   | CLS | Speed Index | Third-party requests |
| ----------- | ---------------------- | ------- | ------------------------------------ | ----- | --- | ----------- | -------------------- |
| Mobile      | 100 / 100 / 100 / 100  | 0.93 s  | 1.06 s ✓ (1.11 / 1.06 / 1.06)        | 65 ms | 0   | 0.93 s      | 0                    |
| Desktop     | 100 / 100 / 100 / 100  | 0.24 s  | 0.36 s ✓ (0.36 / 0.37 / 0.36)        | 0 ms  | 0   | 0.24 s      | 0                    |

### `/30m`

| Form factor | Perf / A11y / BP / SEO | FCP    | LCP                                   | TBT  | CLS | Speed Index | Third-party requests |
| ----------- | ---------------------- | ------ | ------------------------------------- | ---- | --- | ----------- | -------------------- |
| Mobile      | 100 / 100 / 100 / 100  | 0.90 s | **1.50 s ✗** (1.06 / 1.50 / 1.51)     | 0 ms | 0   | 0.90 s      | 0                    |
| Desktop     | 100 / 100 / 100 / 100  | 0.24 s | 0.36 s ✓ (0.36 / 0.36 / 0.37)         | 0 ms | 0   | 0.24 s      | 0                    |

### `/for/cooking`

| Form factor | Perf / A11y / BP / SEO     | FCP    | LCP                               | TBT  | CLS | Speed Index | Third-party requests |
| ----------- | -------------------------- | ------ | --------------------------------- | ---- | --- | ----------- | -------------------- |
| Mobile      | 100 / **96 ✗** / 100 / 100 | 1.03 s | **1.28 s ✗** (1.28 / 1.26 / 1.36) | 5 ms | 0   | 1.03 s      | 0                    |
| Desktop     | 100 / 100 / 100 / 100      | 0.28 s | 0.38 s ✓ (0.39 / 0.38 / 0.38)     | 0 ms | 0   | 0.28 s      | 0                    |

### `/guides/lock-screen-vs-sleep`

| Form factor | Perf / A11y / BP / SEO | FCP    | LCP                               | TBT  | CLS | Speed Index | Third-party requests |
| ----------- | ---------------------- | ------ | --------------------------------- | ---- | --- | ----------- | -------------------- |
| Mobile      | 100 / 100 / 100 / 100  | 1.13 s | **1.36 s ✗** (1.40 / 1.35 / 1.36) | 0 ms | 0   | 1.13 s      | 0                    |
| Desktop     | 100 / 100 / 100 / 100  | 0.32 s | 0.38 s ✓ (0.38 / 0.36 / 0.38)     | 0 ms | 0   | 0.32 s      | 0                    |

### `/es/`

| Form factor | Perf / A11y / BP / SEO | FCP    | LCP                               | TBT  | CLS | Speed Index | Third-party requests |
| ----------- | ---------------------- | ------ | --------------------------------- | ---- | --- | ----------- | -------------------- |
| Mobile      | 100 / 100 / 100 / 66 † | 0.84 s | **1.21 s ✗** (1.21 / 1.06 / 1.35) | 0 ms | 0   | 0.84 s      | 0                    |
| Desktop     | 100 / 100 / 100 / 66 † | 0.22 s | 0.32 s ✓ (0.32 / 0.32 / 0.32)     | 0 ms | 0   | 0.22 s      | 0                    |

† `/es/` is `noindex` until its translation is reviewed, so `is-crawlable` fails by design. Every other SEO audit passes.

## Which budgets fail

- **LCP ≤ 1.2 s, mobile only.** On the median, it fails on `/30m` (1.50 s), `/for/cooking` (1.28 s), the guide (1.36 s) and `/es/` (1.21 s). `/` passes at 1.06 s. Every URL passes on desktop, at 0.32 to 0.38 s. `lhci assert` reports only `/for/cooking` and the guide, because LHCI compares the **best** of the three runs by default (`aggregationMethod: optimistic`). `/30m` and `/es/` had one 1.06 s run each.
- **Accessibility 100, `/for/cooking` mobile.** The score is 96 in all three runs because `target-size` fails.
- **CLS 0:** passes everywhere. **TBT:** at most 65 ms (`/` mobile), within the 100 ms budget. **Performance ≥ 95:** 100 everywhere. **Zero third-party requests:** holds on every URL.

## Likely causes

**LCP on mobile.** The LCP element is text in every run: the `h1` on the tool pages, the page `h1` on `/for/cooking`, and a paragraph on the guide. Nothing is render-blocking; the render-blocking audit is empty. The CSS is inlined, the boot script is inline, and all fonts use `font-display: swap`. The observed paint happens after 83 to 133 ms. The simulated 1.06 to 1.51 s comes from Lighthouse's network simulation. It counts every request that starts before that observed paint as if the paint waited for it, at 150 ms RTT and 1.6 Mbps. The LCP breakdown agrees: in the simulation, about 450 ms is TTFB and 600 to 950 ms is render delay, with no load delay.

- **Web fonts on the LCP path.** `geist-latin-wght-normal.woff2` (29.7 KB, preloaded) is requested before the paint in every run on every URL. `geist-mono-latin-wght-normal.woff2` (23.4 KB, discovered from the inlined CSS at the highest priority) is also requested before the paint on `/`, `/30m` and the guide. Together they take about 290 ms to download at 1.6 Mbps. The manifest and favicon requests also land before the paint in most runs.
- **Run-to-run spread.** The requests before the paint are nearly the same in the fast and slow runs of `/30m` (1.06 s against 1.50 s): both fonts, the manifest and the favicon. The slow runs start them in a different order and add a second favicon request. `/es/` spreads the same way (1.06 to 1.35 s) with an identical request set. The simulation is sensitive to timings observed on a busy 4-vCPU container, and this run did not isolate the exact trigger.
- **Content pages carry more before the paint.** The HTML of `/for/cooking` and the guide is 37 to 38 KB, against 31 KB for `/30m`. The `ContentLayout` module (0.4 KB) and its `content-nav` chunk (1 KB) are also requested before the first paint, which adds a two-step chain. That explains why these two pages sit at 1.28 to 1.36 s in all three runs.
- **CPU.** Main-thread work observed on this container, multiplied by 4, lands inside the LCP window. In one run of the guide, two tasks of about 55 ms each ran around 0.8 s. In one run of `/for/cooking`, tasks of 107 ms and 71 ms ran. The same build measured 1.05 s everywhere on an Apple M4 Pro the day before, so part of the gap is the machine, not the site.

**Accessibility on `/for/cooking`.** A toast is visible in the headless mobile run. Its close button (`button.at-icon-btn`, `aria-label="Dismiss"`, created in `apps/web/src/tool/ui/toast.ts`) measures 7 × 20 px, against the 24 × 24 px minimum. No stylesheet defines `.at-icon-btn`, so the button is only as big as its "×" glyph.

## Recommendations (no app code was changed here)

1. **Get the production numbers** with the Lighthouse workflow's manual run and `base_url` = `https://awaketab.pages.dev` (see above). Add a desktop run too if the desktop budget matters.
2. **Toast close button.** Size `.at-icon-btn` the way Clear Night sizes every icon button: a 44 px target (`--at-h-control`, `DESIGN.md` §11 and §12). Use no new size or colour. Then re-run `/for/cooking` mobile.
3. **Check whether Geist Mono is needed for the first paint on `/`, `/30m` and the guide.** If it is not, the request can start after the paint. Measure any change with three runs, as above, before and after. Do not preload it, because that would put it on the path in every run.
4. **Content pages.** Start the `ContentLayout` module and its `content-nav` import after the first paint, the same way the tool entry is already deferred (`scripts/defer-main.mjs`). Then check whether `/for/cooking` and the guide drop to about 1.05 s.
5. **Decide how CI should judge LCP.** LHCI passes a URL if its best run meets the budget. If the budget is meant as a median, set `aggregationMethod: 'median'` on the LCP assertion in `lighthouserc.cjs`. With today's numbers that would fail `/30m` and `/es/` too, so the owner should choose.

Raw Lighthouse reports (JSON and HTML, 30 runs) were kept outside the repository.

## Production, measured on GitHub Actions

Run: https://github.com/SoubhikBiswas-gitHub/awaketab/actions/runs/36322585254 (Lighthouse workflow, `base_url=https://awaketab.pages.dev`, mobile, 3 runs per URL, 27 Sep 2026 7:04 PM IST).

| Page | LCP median | LCP best | CLS max | TBT median | Performance |
|---|---|---|---|---|---|
| `/` | 1.41 s | 1.22 s | 0.001 | 21 ms | 100 |
| `/30m` | 1.23 s | 1.21 s | 0 | 8 ms | 100 |
| `/es/` | 1.24 s | 1.22 s | 0 | 18 ms | 100 |
| `/for/cooking` | 1.87 s | 1.48 s | 0 | 9 ms | 99 |
| `/guides/lock-screen-vs-sleep` | 1.88 s | 1.42 s | 0 | 15 ms | 99 |

Every page misses the 1.2 s LCP budget on the median, and the content pages by about 0.7 s. CLS on `/` is 0.001 against a budget of 0. The fixes to try first: preload only the font the largest text uses, start content-page scripts after the first paint, and remove the layout shift of the blocked notice.
