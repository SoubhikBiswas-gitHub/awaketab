# Audit brief (design system + overflow)

Base: $D = /private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions. Read $D/BRIEF.md (incl. Wave 3 additions), /Users/soubhik/Work/github/awaketab/DESIGN.md, PRODUCT.md, and the canvas format reference listed in BRIEF.md.

## Render every assigned board for real
Earlier agents built static renderers you can reuse (template expander for {{holes}}, sc-if, sc-for, dc-import + Playwright screenshots): $D/ProLib.mjs + $D/ProShot.mjs, ../ext-tools/render.mjs, ../content-agent/shot.mjs, ../tool-backup/*.mjs. Pick the most complete one (it must expand dc-import wrappers, run the Component class incl. componentDidMount, and apply the helmet CSS), or improve it. Playwright + Chromium are available (see memory: Node 22 at $HOME/.nvm/versions/node/v22.22.2/bin; browsers installed for the repo). Render each board at its canvas size (take w/h from $D/project/canvas.json boards, or the wrapper's root size) and for base files at each layout × theme.

## Automated checks per render (write them as a script, report numbers)
1. Overflow: document/root scrollWidth > width; any element whose bounding box exceeds the root or its clipping ancestor; text with scrollWidth > clientWidth (clipped/ellipsised unintentionally); overlapping interactive elements (button/a rects intersecting); content hidden under sticky elements.
2. Targets: every button / a / input / [role=switch] ≥ 44×44 CSS px (PiP window, badges and inline text links exempt; report the exemptions).
3. Contrast: for every visible text node compute contrast of its colour vs the effective background (walk up for the first opaque background); flag < 4.5:1 (< 3:1 for ≥ 24 px or ≥ 18.66 px bold). Non-text UI (borders of inputs, ring, focus) ≥ 3:1 where it conveys state.
4. Tokens: collect every hex/rgb colour used; flag any not in DESIGN.md palette (theme tokens, lamp colours dark/light, amber/red states, horizon sky palettes, OLED, the Night mode red digits, placeholder brand-neutral greys in mock host pages are allowed). Flag old light lamps #0A8F9B #6B58E0 #1B8F5E #2F6FD6.
5. Copy: pill strings exactly one of: Ready · Starting… · Screen awake · Paused — tab hidden · Blocked — here's the fix · Tap to use the fallback · Awake via video fallback · Starts when you open this tab · System awake (ext) — flag any variant. Times must be AM/PM for en (flag 24 h like 17:30 except where the 24-hour setting is shown). Flag em dashes in NEW copy (existing product strings exempt; list them).
6. Theme parity: each base file renders in light and dark without invisible text (same colour as background) or missing surfaces.
7. Motion: every animation/transition class covered by the prefers-reduced-motion block; no animation of width/height/top/left/margin.

## Fix
Fix everything you find in YOUR assigned files only (layout, wrapping, min-width:0, flex-wrap, font-size clamps, contrast, targets, tokens). Keep behaviour and props unchanged; re-run the relevant smoke test in $D if one exists for those files, and re-render to confirm. Never edit files outside your assignment; report issues in other files (especially Main.dc.html) instead.

## Return
A table: board · issue · severity (blocker/major/minor) · fixed? ; totals before/after per check; list of issues left for other owners; path to a screenshot folder of final renders (scratchpad/audit-<name>/).
