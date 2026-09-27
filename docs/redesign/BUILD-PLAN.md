# Clear Night: build plan (real app)

Owner decision, 27 Sep 2026: stop reviewing on the canvas and build the real app. The owner reviews each milestone live in the browser (`pnpm dev`, then the local URL), not on the canvas. The canvases (docs/redesign/CANVASES.md) stay as the design reference.

## Rules for every milestone
- Branch `redesign/clear-night`. Never push to `main`; the last step is a PR the owner merges.
- One worker per file at a time. Agents run in parallel only on disjoint files.
- Contracts (CLAUDE.md): seven lock states and pill copy, storage keys, routes and slugs, ad rules, budgets, `--at-*` names, zero hydration. A contract change updates its doc in the same commit (docs/00 first for identifiers).
- Source of truth for look and behaviour: DESIGN.md (§11 values, §12 tokens), then the canvas board for the screen.
- Every milestone ends with the gates below green, a commit, a SYNC.md line, and a STATUS "Real app" update.

## Gates (all green before a milestone counts as done)
`pnpm build` · `pnpm size` (tool ≤ 15 KB critical / ≤ 40 KB JS gz, CSS ≤ 20 KB gz) · `pnpm test` · `pnpm test:seo` · `pnpm lint` · `pnpm test:e2e` · CLS 0 · WCAG 2.2 AA · responsive sweep 320–2560 (added in B1).

## Milestones (in order)

| # | Milestone | Scope | Done when |
|---|---|---|---|
| B0 | Baseline | Record current gate results and sizes | Baseline logged in SYNC.md |
| B1 | Foundation | `tokens.css` → DESIGN §12 (spacing, radius, type, control, breakpoint tokens; theme values; Auto/Light/Dark/OLED); docs/05 §1.1 + docs/00 §13 updated; stylelint rule against raw values; responsive-sweep e2e | Existing pages render with new tokens, gates green |
| B2 | Shared shell | Header (60/68, nav, theme segmented bar, stats, settings), footer with language switcher (P-LANG), buttons (lamp CTA, raised Stop D-R20, secondary), segmented bar, pill (7 states, exact copy), chips, kbd, sheet | Used by every page; unit and e2e green |
| B3 | Tool page | `/`, presets, `/until`: Ring face default, face tabs (Bold/Horizon/Tide), status pill, dock (presets, actions at bottom), Until/Custom inline panels, settings sheet (incl. language row), stats, time's up, blocked with fix, toasts, edge states, 320/600/1024/1920 layouts | Matches Tool + Tool states canvases; JS budget held |
| B4 | Ambient & PiP | Clock, focus, minimal, message, night, cook; floating window | Matches Ambient canvas |
| B5 | Content | Article template, hubs (/for 14 per OD-3 with 301s, /on /vs /guides /learn), home below the tool | Matches Content canvas; `test:seo` green |
| B6 | Site pages | About, changelog, privacy, terms, 404, /extension, /kiosk, /library | Matches Site + Embed canvases |
| B7 | Pro & checkout | /pro, /pro/activate, /pro/manage, checkout states, Pro lapsed (per marketing-pricing-cro.md) | Matches Pro canvas |
| B8 | Embed | Widget 320×104 compact, credit outside the widget (O-47, O-58), /embed page | docs/11 "Redesign changes" applied |
| B9 | Extension | Popup and states, options (language row), welcome | Matches Extension canvas; `test:e2e:ext` green |
| B10 | Growth moments | First visit, trust panel, done, paused, Pro moments, share, plan helper, business entry points | Matches Growth canvas |
| B11 | Content fixes | Per content-audit, fact-check, editorial audit, SEO plan: rewrite key pages, noindex the rest, fix claims in 8 locales | Research items closed |
| B12 | Release | Changelog fragment, full gates, Lighthouse, PR to main | Owner merges |

Domain, accounts, stores and production checkout stay last, after B12.
