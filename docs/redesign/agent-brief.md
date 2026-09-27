# Shared brief for design agents

Base dir: /private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/directions  (call it $D)

Read first, fully:
1. /home/user/awaketab/DESIGN.md (design system: tokens, lamp colours, faces, motion, layout, time format) and /home/user/awaketab/PRODUCT.md.
2. $D/INVENTORY.md: real features and copy. Never invent features, prices or claims beyond it.
3. Canvas file format: /private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/artifact-files/a356d887-6aa5-4892-b761-78b7db615831/artifact-type/reference/format.md (and craft.md there).
4. Reference implementation: $D/project/Main.dc.html. Reuse its exact DARK/LIGHT token objects, helmet font link and CSS motion classes/keyframes, logo SVG, header, theme switch and segmented-bar pattern so every page looks like one product. Visual language must match Main exactly.

Format rules that bite (from format.md): one self-contained .dc.html per board; root div has fixed px size = board size; `{{hole}}` is a dotted lookup only (compute everything in renderVals); `<sc-if value hint-placeholder-val>` / `<sc-for list as hint-placeholder-count>` always with hint attrs; events `onClick="{{fn}}"`; logic is `class Component extends DCLogic` (plain JS, lifecycle allowed, setInterval ok); data-props JSON in single-quoted attribute; `<dc-import name="X" prop="v" hint-size="Wpx,Hpx"></dc-import>` mounts sibling X.dc.html (never self-close); `<script src="./support.js"></script>` in head; `<x-dc><helmet>…</helmet>root</x-dc>`. No fake phone status bar.

Every page must support props `theme` (auto|light|dark, auto follows prefers-color-scheme live via matchMedia listener) and `layout` (phone|tablet|desktop). Board sizes: phone 390 wide, tablet 820 wide, desktop 1280 wide; height = the page's natural content height for long pages (e.g. 390×2600) or 844 / 1180 / 800 for app screens. Then create small wrapper boards (dc-import with fixed props) so the canvas shows: phone dark, phone light, tablet (one theme), desktop dark, desktop light at minimum.

Design bar: this is a "wow" redesign. Calm night-instrument aesthetic, generous rhythm, big honest status, slow purposeful motion (CSS classes from Main), real buttons/links with aria labels, targets ≥44px, WCAG AA contrast, 12-hour AM/PM times and full dates, logical properties where possible. No em dashes in NEW copy (the exact pill strings and quoted existing copy are exempt). No gradient text, glassmorphism, side-stripe borders, identical icon-card grids, hero-metric templates. Cards only where they are the best affordance.

Boundaries: write ONLY files with your assigned filename prefix in $D/project/. Do not edit canvas.json, Main.dc.html (unless you are the tool agent), or anything in the git repo. Do not publish. Do not use heredocs inside bash functions (they hang); prefer the Write tool.

Verify before returning: write a node smoke test (Node 22: export PATH=$HOME/.nvm/versions/node/v22.22.2/bin:$PATH; see $D/gen.mjs for the pattern: stub DCLogic + window.matchMedia, instantiate Component for every prop combination, call renderVals and assert every {{hole}} in the markup resolves to a defined value, exercise handlers). It must pass with 0 missing. Also check sc-if/sc-for/div nesting balances.

Return (final message): 1) files written, 2) a JSON object of canvas board entries {"File.dc.html": {"w":..,"h":..,"title":"..","is_interactive":true|false}} in the order they should appear, 3) smoke-test result, 4) any assumptions or open questions for the owner (short).

## Wave 3 additions (read these too)
- CONTRAST FIX (mandatory): light-theme lamp fills are the darker shades: aqua #087B87, violet #5A47CF, mint #167A50, sky #255FBD. Never use #0A8F9B / #6B58E0 / #1B8F5E / #2F6FD6 (they fail AA with white text). DESIGN.md §2.2 is updated.
- Canvas limit: a board may be at most 8000 px tall. Split longer pages into two boards (top / bottom).
- Existing boards you can read for consistency (do not edit unless they carry your prefix): Main, Extras, Ambient, ContentArticle, HubFor, HomeBelow, Pro, ProActivate, ProManage, ExtPopup, ExtOptions, ExtBadges, EmbedWidget, EmbedShowcase, Pip*. Reuse their look exactly.
- Main.dc.html is being extended by the TOOL-SIZES agent during wave 3. Other agents may mount it with `<dc-import name="Main" …>` using ONLY these existing props: status (ready|starting|awake|paused|blocked|needtap|fallback|ended|timesup), face (ring|bold|horizon|tide), theme (auto|light|dark|oled), phase, layout (phone|tablet|desktop), panel (none|until|custom), sheet (none|settings|stats), accent.

## Accuracy corrections (fact-checked 26 Sep 2026 — apply on every board)
- Do NOT say battery saver / Energy saver / Low Power Mode "blocks" or "denies" the wake lock. Chromium has no battery-saver rejection (wake_lock.cc); WebKit has no Low Power Mode check.
- Real refusal causes: the tab is hidden or inactive; a Permissions-Policy blocks it (e.g. an iframe without allow="screen-wake-lock"); Safari/iOS needs a tap first (no user gesture); Firefox refuses at 5 % battery or less while not charging. Insecure pages have no wake lock at all (unsupported → fallback).
- iPhone Low Power Mode forces a 30-second Auto-Lock (true, Apple 101604) — say that, not "blocks the lock".
- Blocked card copy should be e.g. title "Your browser said no" + "Safari needs one tap to start. Tap Try again." / "Battery is very low. Plug in, then tap Try again." (pick per cause) — never battery-saver blame.
- Windows 11 24H2 calls it "Energy saver". iPadOS 26 removed Split View (use "side by side windows").
- Floating window (Document PiP): desktop Chrome, Edge and Firefox 151+.
- Caffeine for macOS uses a power assertion (no key presses). NoSleep.js uses the Wake Lock API when present, video only as fallback.

## Copy corrections (canvas copy audit, 26 Sep 2026 — apply in fix batches)
Full findings: /private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/copy_out.txt and the content agent report docs/research/content-audit.md.
- Pro price: never "was $29" ($29 was never charged). Use "$19 once. Launch price until 8 December 2026, then $29." Plan buttons "Get yearly Pro" / "Get lifetime Pro". Lifetime value line: "At the launch price, less than two years of the yearly plan."
- No testing claims we cannot back: say "Support claims come from browser documentation and automated tests. Real-device results appear in the matrix once recorded." Never "a device on a shelf here" or "in our tests".
- Web pages keep the SCREEN on, never "the computer" (the extension's System level is the exception).
- Extension has no video fallback: never show "Tap to use the fallback" in the extension; use "Blocked — here's the fix" with "Open AwakeTab in a tab".
- Pill text is exact and alone: never append "· until 5:30 PM" inside the pill.
- Reuse en.json wording for existing controls: Retry (not Try again) · Use fallback · Tap to start · Stay awake until · How long? · Add 15 minutes · "Locked — Pro keeps 12 weeks". Presets "15 min · 30 min · 45 min · 1 h · 2 h · 4 h · ∞" (∞ visible, accessible name "Until I stop"); phones must NOT hide presets (PRODUCT.md anti-reference) — show all seven (two rows or a wrapping bar) plus Until…/Custom….
- "floating window" (lowercase in prose) everywhere; not "floating pill/timer"; "wake lock" lowercase, "Screen Wake Lock API" as the API name.
- British spelling (licence, colour, behaviour, minimised). One apostrophe style: straight '.
- Video fallback copy: "It needs this tab visible and uses a little more battery." (not "works everywhere").
- Embed widget: "while this page is visible" (not "open"). Add Embed CTAs: "Buy an Embed licence · $29 / year per site" and "Activate an Embed key".
- Remove designer notes from product UI ("Sample data · Demo numbers…"): stats boards show realistic data without the note, or the real empty state.
- Legal: rating note max 280 characters. ExtOptions: "Settings save here and sync through your Chrome account; your licence never syncs."
- No em dashes in new copy (only contract pill strings and existing en.json strings keep them).

## Documentation rule (owner, 26 Sep 2026)
Read /home/user/awaketab/docs/redesign/README.md and DECISIONS.md first. Record anything you learn or decide that later agents need: open questions go to DECISIONS.md "Open", reports go to docs/research/. Never contradict a Decided item.
