# B1 token debt (for B2 and later)

Milestone B1 (27 Sep 2026) moved `tokens.css` to Clear Night (DESIGN.md §2, §12) without redesigning pages. These items were found on the way and are left for the milestone that rebuilds the surface. Remove a line when it is fixed.

## Responsive sweep (`apps/web/test/e2e/responsive.spec.ts`)

All routes pass at every 40 px step from 320 to 2560. B6 rebuilt `/embed` (the 320 px overflow from the "Activate your domain" link is gone with the link, decision O-29), emptied the spec's `DEBT` map and added `/changelog`, `/privacy`, `/kiosk` and `/library` to the sweep. Since B2 the sweep also fails on header and footer controls under 44 × 44 or within 16 px of a side edge (the shared shell passes at every width). Still to add as the page bodies are rebuilt (B3–B7): the same target and edge rules for every control on the page, clipped text, phone landscape and 400 % zoom.

## Stylelint guard (DESIGN.md §12.8)

- **Radius:** enforced in B1. The six raw radii that existed were on the scale and are now tokens (`embed.css` 999px ×2, 4px, 8px; `tool.css` 4px ×2). The two `border-radius:12px` strings in `src/tool/embed/snippet.ts` and `src/tool/embed/loader.ts` are inline styles on the host page's iframe, where the tokens do not exist; they stay raw on purpose.
- **Spacing, type size and control height:** enforced for `shell.css` since B2 (the shared shell and primitives: padding, margin, gap, `font`, `font-size`, `line-height` and block/inline sizes take tokens only; a `stylelint.config.mjs` override). Raw values still outside `tokens.css` (hand-written CSS only), for the milestone that rebuilds each surface:
  - `content.css`: lines 15, 25, 31, 43 (rem margins and padding). B5.
  - `embed.css` (rebuilt in B8): control heights and spacing use tokens; the remaining raw values are the widget-scoped `--at-embed-*` sizes (pill 26/32, reserved heights, 60 px primary) at the top of the file, the Start/Stop widths (96 / 104 / 120 px), the 264 px timer column, the 12 px glyph box and the 24 px notice link height, plus the board's digit and meta font sizes in rem.
  - `tool.css` (B2 line numbers): 435 (dialog `max-block-size` 2rem inset), 549, 1004 (44 px control heights), 584, 588 (ad slot boxes), 794, 859 (ambient digits `clamp()` in rem), 818, 958, 1030, 1036, 1048, 1145 (ambient and stats sizes), 838, 846 (64 px cook targets), 962 (`font-size: 8px`, below the 12 px floor). B3/B4.
  - Markup: shadcn/Tailwind utilities (`text-sm`, `px-4`, `h-9`, `rounded-md`, …) in `.astro`/`.tsx` bypass a CSS-only rule. The shared shell (header, footer, theme switch, language switcher, pill, chips, Stop, keycaps) uses `shell.css` classes on `--at-type-*`, `--at-h-*` and `--at-gap-*` since B2; page bodies still use the utilities until B3–B7. B6: the site pages (`/about`, `/changelog`, `/privacy`, `/terms`, `/extension`, `/kiosk`, `/library`, `/embed`, the 404 body) no longer use any utility or shadcn component; `pages.css` is under the strict override, with its off-scale sizes named once as `--at-pg-*` and three drawings (kiosk screen, host recipe page, state diagram) exempt in marked blocks.

## Colour

- `tool.css` `.at-stars` checked label: `--at-accent-text` on `--accent` (lamp 12 % tint) is 4.25:1 for Aqua in light (fine for the other lamps and in dark). Fix with the rating prompt in B3/B10 (ink text, lamp glyph).
- Ring track and ticks still use `--at-line`; B3 moves them to `--at-track` and `--at-tick`.
- The status halo (`--at-halo`) behind the pill and face comes with the tool face in B3 (the ground's radial lift shipped in B2: `--at-lift`, `--at-ground-end`).
- Brand assets still drawn in the old amber palette: `public/favicon.svg`, `public/og/awaketab-placeholder.svg`, `src/lib/og.ts` (OG card ground and ink), `apps/extension/scripts/icons.mjs` (toolbar ring), `apps/extension/scripts/store-assets.mts`. They move with the logo lockup and status favicon (B3), OG (B5/B12) and the extension (B9). `BADGE_COLORS.display` is already Aqua `#087B87`.

## Type and fonts

- Page bodies still use the `--at-t-*` sizes and Tailwind text utilities; since B2 the shared shell reads the `--at-type-*` roles. Each page moves over when B3–B7 rebuild it (the B6 site pages have: `--at-type-*` only).
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

## Found in B2 (for B3 and later)

- **Tool action row (`.at-tool-more`):** Share, floating window, keyboard shortcuts, Stats (phones) and Install left the header, which now holds only Stats (from 600) and Settings as on the canvas. They sit as icon buttons in a fixed five-column row under the tool until the dock (B3) and the floating window (B4) place them; on desktop the row is visibly off-centre because two of its five cells are empty (phone-only Stats, Install until installable).
- **Pill extra text:** "until 10:30 PM" (`[data-pill-extra]`) still sits inside the tool pill's button after the exact string; B3 moves it beside the pill (DESIGN.md §10: meaning around the pill copy, not inside it).
- **Preset chips:** the grid cell is 80 px (was 72) so "Custom…" no longer breaks mid-word at 1280; B3 replaces the grid with the preset segmented bar and phone grid (O-74).
- **Keyboard hints on buttons:** `.at-kbd-hint` honours `<html data-hints="off">`, but nothing sets it yet; B3 wires the Settings toggle (`settings.keyboardHints`).
- **Nav and footer links on localized pages** point at English-only routes (`/for`, `/on`, `/extension`, `/pro`, `/privacy`, …), as before; they carry no `hreflang="en"` yet.
- **Content-visibility sections** (`.at-prose`, `content-visibility: auto`) take their real height when scrolled into view, which can move the footer between a press and its release; B5 reserves better intrinsic sizes.
