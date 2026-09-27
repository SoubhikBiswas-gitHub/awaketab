# Lighthouse: LCP budget work, local, 2026-09-27

## Setup

- Build: `pnpm build` in production mode, served by `astro preview` on `127.0.0.1:4471`. There is no Cloudflare edge, so pages are sent with gzip over HTTP/1.1.
- Config: the repository's `lighthouserc.cjs` (mobile, 390 × 844 at 2×, 150 ms RTT, 1.6 Mbps, 4× CPU, `*/api/*` blocked). Only the port was changed. Three runs per URL; every cell is the median.
- Tools: `@lhci/cli` 0.15.1 with Lighthouse 12.6.1 on Google Chrome, running on an Apple M4 Pro (`benchmarkIndex` about 4,100).
- "Before" is `origin/main` at `bab2504` (after the small-polish merge). "After" is `perf/lcp-budget` with that merge.

## Result

| Page | LCP before | LCP after | FCP before → after | CLS after | Perf after | LCP element |
|---|---|---|---|---|---|---|
| `/` | 2.11 s | 1.96 s | 1.05 → 0.95 s | 0 | 99 | clock digits, after the island rewrites them |
| `/30m` | 2.10 s | 1.81 s | 1.05 → 0.79 s | 0 | 100 | clock digits, after the island rewrites them |
| `/es/` | 1.95 s | 1.80 s | 0.94 → 0.79 s | 0.002 | 100 | clock digits, after the island rewrites them |
| `/for/cooking` | 1.65 s | 1.50 s | 1.13 → 0.95 s | 0 | 100 | `p.at-lead`, painted with the first paint |
| `/guides/lock-screen-vs-sleep` | 1.65 s | 1.50 s | 1.28 → 0.95 s | 0 | 100 | `p.at-lead`, painted with the first paint |

The budget of ≤ 1.2 s is still missed on every page. CLS 0.002 on `/es/` is the same on `main` (it comes from `.at-pillline` when the island starts). Accessibility, Best Practices and SEO are unchanged (`/es/` SEO is 66 by design while it is `noindex`).

## How the simulation counts

Lighthouse does not use the paint time it sees. It replays the page's requests at 150 ms RTT and 1.6 Mbps and counts every request that **finished before the observed largest paint**. Locally every request finishes within milliseconds, so everything fetched before that paint is on the LCP path. Each extra round trip costs about 150 ms. Experiments on edited copies of `dist/` gave these steps:

- **The document.** TCP slow start sends 14.6 KB in the first round and 29.2 KB in the second. HTML up to 43.8 KB (headers included) arrives in two rounds, and more takes three. After this change the pages are `/` 47.8, `/30m` 42.0, `/es/` 43.4, `/for/cooking` 44.4 and the guide 46.0 KB gz. Most of that is the tool: inlined CSS (about 19–20 KB gz), the island's i18n catalog (7.4 KB gz) and inline SVG (about 4.5 KB gz).
- **Geist, preloaded.** 29.4 KB takes two rounds on the warm connection. A font under about 28.9 KB would take one. Loading it after the first paint removes it from the path, but the swap then moves text: CLS 0.009 on the guide and 0.014 on `/for/cooking`. So it stays preloaded.
- **The web manifest.** Chrome fetches it on its own connection right after `load`, before the headless first paint. Inserting the link after the first paint saved 150 ms on the content pages (1.50 → 1.35 s). But `beforeinstallprompt` then reaches `src/tool/pwa.ts` on every visit, and the header's Install button moves `.at-header-end` (CLS 0.0025 on the tool pages). The change was reverted.
- **Tool pages.** The clock face rises in from `opacity: 0` (`.at-face` in `tool.css`, `at-in` 0.7 s), and Chrome does not count content painted at opacity 0. The digits become the LCP only when the island rewrites them, so the whole island chain comes before the LCP: `ToolIsland`, `tool-boot`, `tool-ui`, `tool-more.css`, `analytics` and `license`. With the face visible in its first frame, `/30m` measured 1.20 s. The island's first render then moves the face (CLS 0.022), which it does unseen today.

## Changes in this branch

- The content-page script (`ContentLayout` with `content-nav`) now starts after the first paint, the same way as the tool island. `scripts/defer-main.mjs` moves it onto `main.at-cp[data-main]`, and `boot.js` imports every `[data-main]`.
- Geist Mono no longer loads before the first paint. It was fetched at the highest priority for below-the-fold keycaps, paths and code. `<html data-font-hold>` maps `--at-font-mono` to its metric-matched fallback, which measures the same width to 0.02 %, until one frame after the page's modules load.
- The boot script is inlined minified, which saves about 1.7 KB gz of HTML on every page.
- Space Grotesk loads only when the Bold face is on, because of its unicode range and the hidden faces. No change was needed.
- ∞ no longer comes from Arial. The Geist and Space Grotesk fallbacks skip U+221E, so ∞ comes from `system-ui`, as on the canvas.
- The service worker precaches Geist, so pages keep their font offline.

## What reaching 1.2 s still needs (outside this branch)

1. **Tool pages:** the clock face must be visible in its first frame (`tool.css`). The island's first render must also not move the face (`src/tool/*`).
2. **Every page:** HTML at or under 43.8 KB gz. For example, the i18n catalog could stop being inlined, or the inlined CSS could shrink.
3. **Every page:** keep the manifest off the first paint. That needs a reserved slot for the header Install button first (`shell.css`, `pwa.ts`).
4. **Optional:** a Geist file under about 28.9 KB. Subsetting its unused OpenType features would get there without changing any glyph.

Production numbers will differ. HTTP/2 shares one connection, and Brotli makes the HTML about 15 % smaller. Measure again with the Lighthouse workflow and `base_url` once this change is deployed.
