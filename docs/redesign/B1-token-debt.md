# B1 token debt (for B2 and later)

Milestone B1 (27 Sep 2026) moved `tokens.css` to Clear Night (DESIGN.md §2, §12) without redesigning pages. These items were found on the way and are left for the milestone that rebuilds the surface. Remove a line when it is fixed.

## Responsive sweep (`apps/web/test/e2e/responsive.spec.ts`)

All eight routes pass at every 40 px step from 320 to 2560, except:

| Route | Width | Cause | Fix in |
|---|---|---|---|
| `/embed` | 320 | "Already bought? Activate your domain" link is `whitespace-nowrap` inside a 283 px card, page scrollWidth 324 | B8 (embed page) |

That width runs as `test.fixme` (listed in the spec's `DEBT` map), so the suite is green and the debt stays visible. The sweep does not yet check the other §5 Gate rules (controls within 16 px of an edge, targets under 44 px, clipped text, phone landscape, 400 % zoom); add them with B2.

## Stylelint guard (DESIGN.md §12.8)

- **Radius:** enforced in B1. The six raw radii that existed were on the scale and are now tokens (`embed.css` 999px ×2, 4px, 8px; `tool.css` 4px ×2). The two `border-radius:12px` strings in `src/tool/embed/snippet.ts` and `src/tool/embed/loader.ts` are inline styles on the host page's iframe, where the tokens do not exist; they stay raw on purpose.
- **Spacing, type size and control height:** not enforced yet. Raw values outside `tokens.css` today (hand-written CSS only):
  - `content.css`: lines 15, 25, 31, 43 (rem margins and padding).
  - `embed.css`: lines 38, 72, 110 (`min-block-size` 44 / 28 / 44 px).
  - `tool.css`: lines 265 (`var(--at-s-12, 48px)` fallback), 273, 286, 386, 486, 648, 1106 (44 / 56 px control heights), 683, 687, 920, 940, 948, 1060, 1064 (`font-size: 8px`, below the 12 px floor), 1132, 1138, 1150; face digits at 896 and 961 use `clamp()` in rem.
  - Markup: shadcn/Tailwind utilities (`text-sm`, `px-4`, `h-9`, `rounded-md`, …) in `.astro`/`.tsx` bypass a CSS-only rule. B2 maps the shared shell to `--at-type-*`, `--at-h-*` and `--at-gap-*`; the rule is added once each surface is rebuilt.

## Colour

- `tool.css` `.at-stars` checked label: `--at-accent-text` on `--accent` (lamp 12 % tint) is 4.25:1 for Aqua in light (fine for the other lamps and in dark). Fix with the rating prompt in B3/B10 (ink text, lamp glyph).
- Inputs and toggles still use `--input` → `--at-line`; decision O-56 wants `--at-input-border` (≥ 3:1). Changing the alias also restyles outline buttons in dark (`dark:bg-input/30`), so it belongs to the B2 button/input work.
- Ring track and ticks still use `--at-line`; B3 moves them to `--at-track` and `--at-tick`.
- The ground's radial lift and the status halo (`--at-halo`) are page backgrounds, added with the shell in B2/B3.
- Brand assets still drawn in the old amber palette: `public/favicon.svg`, `public/og/awaketab-placeholder.svg`, `src/lib/og.ts` (OG card ground and ink), `apps/extension/scripts/icons.mjs` (toolbar ring), `apps/extension/scripts/store-assets.mts`. They move with the logo lockup and status favicon (B3), OG (B5/B12) and the extension (B9). `BADGE_COLORS.display` is already Aqua `#087B87`.

## Type and fonts

- Components still use the `--at-t-*` sizes and Tailwind text utilities; the `--at-type-*` roles exist but nothing reads them yet (B2 onwards).
- `--at-font-display` (Space Grotesk digits) is defined but unused until the Bold face lands (B3), so it downloads nothing yet.
- The extension popup and options keep the system stack (their token import skips the `@font-face` rules); B9 decides whether the extension bundles the woff2 files.
- The service worker does not precache `/fonts/*`; offline the tool falls back to the metric-matched system face. Add the Geist file to the precache in B3 if offline first paint should use it.
- "Custom…" wraps to two lines inside its 44 px chip at 1280 px (same with the system font); B3 rebuilds the preset bar.

## Performance (Lighthouse, local `LHCI_RUNS=1 pnpm lighthouse`, simulated slow 4G)

LCP budget is 1.2 s (docs/00 §11). Measured on 27 Sep 2026 on the owner's Mac:

| Path | Without web fonts | With Geist (preloaded, swap) |
|---|---|---|
| `/` | ≤ 1,200 ms (pass) | 1,352 ms |
| `/30m` | 1,351 ms | 1,501 ms |
| `/for/cooking` | 1,351 ms | 1,501 ms |
| `/guides/lock-screen-vs-sleep` | 1,351 ms | 1,501 ms |
| `/es/` | ≤ 1,200 ms (pass) | 1,202 ms |

Three paths already missed the lab LCP budget locally before the fonts; the preloaded 29 KB Geist file adds about 150 ms in the simulation (removing the preload or using `font-display: optional` does not change it; removing the preload adds CLS). CLS stays 0 in Lighthouse and in Playwright (`/` at 390 and 1280 with a working wake lock: 0.0000). Options for the owner: a smaller Geist subset (basic Latin + Latin-1 letters only), preloading only on the tool routes, or accepting the lab figure. Re-measure on the deployed preview (`LHCI_BASE_URL`), which is what CI audits.
