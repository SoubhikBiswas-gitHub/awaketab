# 05 · Front-end specification — tokens, tool island, PWA, PiP

Status: v1.2 · 2026-09-26 · Owner: Soubhik

**Purpose.** This document specifies everything a developer needs to build the AwakeTab web front end: the design tokens, every component of the vanilla-TypeScript tool island (props, state, behaviour, copy, accessibility), page layout, the lock-state × session-status UI matrix, keyboard and accessibility rules, the PWA and Document Picture-in-Picture behaviour, URL parameter handling, theming, error states and the performance rules the island must meet. Identifiers (states, keys, routes, shortcuts, gates) are used exactly as defined in `00-conventions.md`; anything new is marked **PROPOSED — add to 00-conventions.md** and collected in §15.

**Related docs.** `00-conventions.md` (identifiers) · `04-engine-spec.md` (lock state machine, session timing, `@awaketab/wake`, `@awaketab/core`) · `06-content-seo-spec.md` (page templates around the tool) · `07-i18n.md` (string keys, formatting) · `08-data-storage.md` (`ISettings`, `ISession`, `IStats` schemas) · `09-monetization-impl.md` (Pro card, sponsor card, licence UI) · `13-testing-strategy.md` (a11y and e2e coverage) · `awaketab-blueprint.md` §01–§06 (why the UI is honest first).

---

## 1. Design tokens

Tokens are CSS custom properties declared in `apps/web/src/styles/tokens.css` and consumed by Tailwind v4 (`@theme`) and by hand-written CSS in the island. Token names use the `--at-` prefix (accepted — `00-conventions.md` §13.1). Themes are selected by `data-theme` on `<html>` (§12). `auto` resolves to `light` or `dark` from `prefers-color-scheme`; `oled` is never auto-selected.

### 1.1 Colour

| Token | `light` | `dark` | `oled` | Use |
|---|---|---|---|---|
| `--at-ground` | `#FAF7F2` | `#14161C` | `#000000` | Page background; `<meta name="theme-color">` |
| `--at-surface` | `#FFFFFF` | `#1C1F27` | `#0A0A0A` | Cards, sheets, dialogs, chips |
| `--at-ink` | `#1A1A1A` | `#F2F2F2` | `#E6E6E6` | Primary text (contrast ≥ 12:1 on ground) |
| `--at-muted` | `#5C5C5C` | `#A3A6AE` | `#8A8A8A` | Secondary text (≥ 4.5:1 on ground) |
| `--at-line` | `#E3DED6` | `#2A2E38` | `#1F1F1F` | Borders, ring track |
| `--at-accent` | `#B86E00` | `#FFB84D` | `#FFB84D` | Ring progress, held state, primary buttons, focus ring |
| `--at-accent-text` | `#8A5200` | `#FFB84D` | `#FFB84D` | Accent-coloured *text* (light amber `#B86E00` is only 3.7:1 on ground — fine for the ring and borders, not for body-size text) |
| `--at-on-accent` | `#FFFFFF` | `#1A1200` | `#1A1200` | Text on accent-filled buttons (dark: 11:1; light: use only at ≥ 18.66 px bold or with `--at-accent-text` background) |
| `--at-night` | `#2B3A67` | `#9DB0FF` | `#9DB0FF` | Night mode digits and accents (in `night` ambient mode digits use `--at-night-digit` `#FF5A3C` on `oled`; see §3.13) |
| `--at-good` | `#1E7B4D` | `#5FD39A` | `#5FD39A` | Completed flash, success toasts |
| `--at-warn` | `#A64B00` | `#FF9F6E` | `#FF9F6E` | `lost` pill, warnings |
| `--at-bad` | `#B3261E` | `#FF8A80` | `#FF8A80` | `denied` pill, error toasts |
| `--at-focus` | `#B86E00` | `#FFB84D` | `#FFB84D` | 2 px outline + 2 px offset, ≥ 3:1 against every adjacent colour |

State-tinted surfaces are derived, never hand-picked: `color-mix(in srgb, var(--at-accent) 12%, var(--at-surface))` for the `held` pill, `--at-warn` 12% for `lost`, `--at-bad` 12% for `denied`. Every text/background pair used in the island must be listed in `13-testing-strategy.md`'s contrast test fixture; CI fails below WCAG 2.2 AA (4.5:1 text, 3:1 UI/large text).

### 1.1a Accent palettes

`settings.accent` stores the light-theme hex (`08-data-storage.md` §2.1); `apps/web/src/tool/accent.ts` maps it to a palette id set as `data-accent` on `<html>` (amber, the default, sets no attribute), and `tokens.css` overrides four tokens per palette. the inline boot script (`src/boot/boot.js`, §11) mirrors the map so the accent is applied before first paint; the island re-checks pack palettes against the licence and falls back to amber when `ambient.packs` is missing or lapsed.

| Id | `settings.accent` | Gate | `light`: `--at-accent` · `--at-accent-text` · `--at-on-accent` · `--at-focus` | `dark` / `oled`: same four |
|---|---|---|---|---|
| `amber` | `#B86E00` (default) | free | `#B86E00` · `#8A5200` · `#FFFFFF` · `#B86E00` (§1.1) | `#FFB84D` · `#FFB84D` · `#1A1200` · `#FFB84D` |
| `indigo` | `#4F46E5` | free | `#4F46E5` · `#4338CA` · `#FFFFFF` · `#4F46E5` | `#A5B4FC` · `#A5B4FC` · `#0F1233` · `#A5B4FC` |
| `teal` | `#0F766E` | `ambient.packs` | `#0F766E` · `#0F766E` · `#FFFFFF` · `#0F766E` | `#5EEAD4` · `#5EEAD4` · `#042F2E` · `#5EEAD4` |
| `rose` | `#BE123C` | `ambient.packs` | `#BE123C` · `#BE123C` · `#FFFFFF` · `#BE123C` | `#FDA4AF` · `#FDA4AF` · `#3F0613` · `#FDA4AF` |

Teal and Rose are the first `ambient.packs` palette pack. Contrast rules per pair: accent ≥ 3:1 on ground, accent-text ≥ 4.5:1 on ground and surface, on-accent ≥ 4.5:1 on accent-text. The state tints and shadcn aliases (§1.5) follow the accent automatically because they are derived from `--at-accent`.

### 1.2 Type

System stack only — tool pages load no web fonts (`00-conventions.md` §3):

```css
--at-font: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Ubuntu, Cantarell,
           "Noto Sans JP", "Noto Sans SC", "Noto Sans Devanagari", sans-serif;
--at-font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; /* code blocks on /learn only */
```

| Token | Size / line | Use |
|---|---|---|
| `--at-t-xs` | 12 / 16 | Legal, "last verified", CPU notice |
| `--at-t-sm` | 14 / 20 | Chips, pill, captions |
| `--at-t-md` | 16 / 24 | Body |
| `--at-t-lg` | 18 / 28 | Lead paragraphs, dialog titles |
| `--at-t-xl` | 22 / 30 | Section headings (h2) |
| `--at-t-2xl` | 28 / 36 | Page h1 (mobile) |
| `--at-t-3xl` | 40 / 48 | Page h1 (≥ md) |
| `--at-t-timer` | `clamp(40px, 12vw, 64px)` / 1 | The `Timer`; always `font-variant-numeric: tabular-nums` |
| `--at-t-ambient` | `clamp(72px, 22vw, 240px)` / 1 (`clamp(4.5rem, 22vw, 15rem)` in `tokens.css`) | Clock/Cook/Focus digits in ambient modes |

Weights: 400 body, 600 headings and pill, 700 timer. Letter-spacing 0 except the timer (`-0.02em`).

### 1.3 Spacing, radii, elevation

4 px base grid: `--at-s-1: 4px` · `-2: 8` · `-3: 12` · `-4: 16` · `-6: 24` · `-8: 32` · `-12: 48` · `-16: 64`. Radii: `--at-r-sm: 6px` (inputs) · `--at-r-md: 10px` (cards) · `--at-r-lg: 16px` (sheets, dialogs) · `--at-r-pill: 999px` (pill, chips). Elevation is a 1 px `--at-line` border plus, in `light` only, `0 1px 2px rgb(0 0 0 / 6%)`; `dark`/`oled` use borders only.

### 1.4 Motion

`--at-d-fast: 120ms` · `--at-d-base: 200ms` · `--at-d-slow: 320ms`; easing `cubic-bezier(.2,.7,.2,1)`. Ring progress uses `transition: stroke-dashoffset 1s linear` so one-second ticks look continuous. Under `@media (prefers-reduced-motion: reduce)` all transitions and animations are set to `1ms` (not removed, so `transitionend` handlers still fire), the held-dot pulse is disabled, indeterminate spinners become a static three-dot glyph, and toasts appear without slide. The burn-in pixel shift (§3.14) remains active under reduced motion because it is a hardware-protection feature, but it moves instantly instead of easing.

### 1.5 shadcn/ui theme bridge

Shared UI chrome — buttons, badges, cards, tables, alerts, breadcrumbs, form fields, `<kbd>` — comes from shadcn/ui (new-york style, neutral base, CSS variables) in `apps/web/src/components/ui/*.tsx`, rendered by Astro **at build time only** (`03-architecture.md` ADR-013; §13 below). The `--at-*` tokens in §1.1–§1.4 stay the canonical palette, byte for byte; shadcn's semantic variables are *aliases* of them, declared once in `tokens.css` and re-resolved per theme because the `--at-*` values switch on `data-theme`. Nobody hand-picks a colour for a shadcn component — if a variant needs a colour that does not exist here, the token is added to §1.1 first.

| shadcn variable | Resolves to | Notes |
|---|---|---|
| `--background` | `--at-ground` | `@layer base` applies `bg-background text-foreground font-sans` to `body` |
| `--foreground` | `--at-ink` | |
| `--card` · `--popover` | `--at-surface` | `--card-foreground` / `--popover-foreground` → `--at-ink` |
| `--primary` | `--at-accent-text` | Not `--at-accent`: filled primary buttons must be AA in `light` too |
| `--primary-foreground` | `--at-on-accent` | |
| `--secondary` · `--muted` | `color-mix(in srgb, var(--at-ink) 6%, var(--at-surface))` | `--secondary-foreground` → `--at-ink`; `--muted-foreground` → `--at-muted` |
| `--accent` | `color-mix(in srgb, var(--at-accent) 12%, var(--at-surface))` | The §1.1 state-tint rule; `--accent-foreground` → `--at-ink` |
| `--destructive` | `--at-bad` | `--destructive-foreground` `#fff` |
| `--success` · `--warning` · `--night` | `--at-good` · `--at-warn` · `--at-night` | Custom (not in stock shadcn); foregrounds `#fff` |
| `--border` · `--input` | `--at-line` | `@layer base` applies `border-border outline-ring/50` to `*` |
| `--ring` | `--at-focus` | |
| `--radius` | `--at-r-md` | |
| `--font-sans` | `--at-font` | System stack; still no web fonts on tool pages |

Radius scale (Tailwind `rounded-*` → `--at-r-*`): `--radius-sm` 4 px (not a token; badges only) · `--radius-md` → `--at-r-sm` (6, inputs and buttons) · `--radius-lg` and `--radius-xl` → `--at-r-md` (10, cards and alerts) · `--radius-2xl` and above → `--at-r-lg` (16, dialogs and sheets). `--at-r-pill` stays the pill's and chips' radius.

Theme plumbing: `@custom-variant dark` matches `[data-theme="dark"]`, `[data-theme="oled"]`, and `prefers-color-scheme: dark` when no `data-theme` is set, so shadcn's `dark:` utilities follow §11 without a second theme switch. `tw-animate-css` is imported for the entrance/exit keyframes shadcn classes reference; every animation still collapses to 1 ms under reduced motion (§1.4).

Variant map (which shadcn variant styles which surface; the component sections in §3 repeat the relevant line):

| Surface | shadcn source | How it is applied |
|---|---|---|
| Header icon buttons (Stats, Share, Settings, Install, theme, PiP), `LocaleNav` links | `buttonVariants({ variant: 'ghost' })` (icon size for the header) | Class helper on plain `<button>`/`<a>` in `.astro` frontmatter |
| Primary actions (Start, Resume, Retry, Use video fallback, Pro checkout) | `Button` `default` | `<Button>` in `.astro` or `buttonVariants()` on `<button>`; `--primary` = `--at-accent-text` |
| Stop, Dismiss, Cancel, Maybe later | `Button` `secondary` / `outline` | Same |
| Link buttons in content and footer | `buttonVariants({ variant: 'link' })` | On `<a>` |
| Preset chips | `toggleVariants({ variant: 'outline' })` | On `<button aria-pressed>`; the pressed look is keyed on `[aria-pressed="true"]`, not on Radix state |
| Pro badge in the header, "Sponsored" label, plan labels | `Badge` `secondary` / `outline` | `<Badge>` or `badgeVariants()` |
| `ResumeBanner`, `SecondTabWarning`, `FallbackConsent`, `ProCard`, `SponsorCard`, plan cards on `/pro`, seven-state list, content card grids, FAQ `<details>` | `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) | `<Card>` in `.astro`; `<details>` gets the Card classes directly |
| `CapabilityNotice`, honest-limits callouts, banners on tool and content pages | `Alert` | `<Alert>` with `AlertTitle`/`AlertDescription` |
| Support matrix, `/pro/activate` error table, `/pro/manage` activations | `Table` | `<Table>`; `/pro/manage` rows are cloned from a `<template>` by the small client script |
| `/pro/activate`, `/pro/manage` forms | `Input`, `Label`, `Button` | Plain `<form>` posting to `/api/license/*` |
| `ShortcutsOverlay` key caps | `Kbd` | Inside the `<dl>` |
| Content breadcrumbs | `Breadcrumb` | `BreadcrumbList` JSON-LD unchanged |
| Footer section dividers | `Separator` | Radix Separator, build time only |
| `CustomDurationDialog`, `UntilTimePicker`, `ExtendPrompt`, `SettingsSheet`, `ShortcutsOverlay`, `RatingPrompt`, `ShareSheet` | *none* — native `<dialog>` styled to match shadcn `Dialog` | `showModal()`; classes in `tool.css`; no Radix Dialog or Sheet |
| `Toast` | *none* — `@apply` rules in `tool.css` reproduce the `Card` surface and `Button` `ghost` close | Nodes are created by the island at runtime, so no `.tsx` is involved |

---

## 2. The tool island — structure and store

The island lives in `apps/web/src/tool/` and is mounted once per page on the element `#awaketab-tool` that the Astro layout renders server-side (the ring SVG, pill and chips are in the HTML before JS runs, so the LCP element is static markup and the tool is usable at first paint modulo interactivity).

```
src/tool/
├─ main.ts            # boot: parse URL params, hydrate store, mount components, register SW
├─ store.ts           # tiny observable store (see below); no framework
├─ ui/                # Ring, StatusPill, PresetChips, Timer, Toast, dialogs, banners, cards
├─ ambient/           # AmbientShell + modes (dynamic import)
├─ pip/               # Document PiP + /pip fallback (dynamic import)
└─ stats/             # StatsPanel + heatmap (dynamic import)
```

`store.ts` exposes `get()`, `set(patch)`, `subscribe(selector, fn)`; state is a plain object:

```ts
interface IToolState {
  lock: 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';
  advice: TAdviceCode | null;             // why denied/unsupported (§3.10)
  session: ISession | null;               // from @awaketab/core; status inactive|active|paused|completed|aborted
  settings: ISettings;                    // at.v1.settings
  license: License | null;               // at.v1.license (features[])
  ui: {
    mode: TAmbientMode;                   // standard|clock|focus|minimal|night|message|cook
    controlsHidden: boolean;
    dialog: 'custom' | 'until' | 'settings' | 'shortcuts' | 'share' | 'extend' | 'rating' | null;
    toasts: Toast[];
    secondTab: boolean;
    pip: 'closed' | 'document' | 'popup';
  };
}
```

Components are plain functions `mount(root: HTMLElement, store): () => void` that render into server-rendered nodes, subscribe to the slices they need and return an unmount function. No component talks to `navigator.wakeLock` directly — the engine from `@awaketab/wake` and the session from `@awaketab/core` write to the store; components only read it and dispatch intents (`start(plan)`, `stop()`, `extend(ms)`, `pause()`). `has(feature)` checks `license.features` against the gates in `00-conventions.md` §8.2.

---

## 3. Components

Copy below is the English source; every string is an i18n key in `src/i18n/en.json` (`07-i18n.md`). Copy in this document is canonical for English.

Styling: static markup that the Astro layout renders (`ToolPanel`, `ToolIsland`, `BaseLayout`) uses shadcn/ui components or their cva class helpers at build time per the variant map in §1.5; the island attaches behaviour to that markup and never renders a shadcn component itself. Nodes the island creates at runtime (toasts, dialog contents it rewrites) are styled by `@apply` rules in `tool.css` that reproduce the same variants. Nothing below carries a `client:*` directive (§13).

### 3.1 `Ring`

192 × 192 px SVG, `viewBox="0 0 192 192"`, inline in HTML. Track circle `r=88`, `stroke-width=8`, stroke `--at-line`. Progress circle same geometry, stroke `--at-accent`, `stroke-linecap="round"`, rotated `-90deg` so progress starts at 12 o'clock. A 10 px dot at `(96, 8)` marks 12 o'clock and is the brand motif.

Math: `C = 2 * Math.PI * 88 = 552.92`. `stroke-dasharray = C`; `stroke-dashoffset = C * (1 - progress)` where `progress = clamp((now - startedAt) / (endsAt - startedAt), 0, 1)` for `duration` and `until` plans. For `indefinite` plans the ring is solid (`dashoffset = 0`) and the dot pulses (opacity 1 → .55, 2 s) unless reduced motion. In `requesting` the progress circle is hidden and the dot orbits once per 1.2 s (indeterminate); under reduced motion the dot is static at 12 o'clock and the pill carries the "Starting…" cue. In `lost` the stroke colour becomes `--at-warn` and progress freezes visually (the underlying deadline does not move — see §6); in `denied` the track becomes a 4/6 dashed `--at-bad` stroke; in `fallback` the progress stroke is dashed 12/6 in `--at-accent` at 70% opacity.

Below 360 px viewport width the ring scales to 160 px via `width: clamp(160px, 50vw, 192px)`; the viewBox does not change. Accessibility: `role="img"` with an `aria-label` that the store keeps in sync ("Progress ring: 42 minutes of 60 remaining" / "Progress ring: keeping the screen awake until you stop"); it is **not** a live region (the pill and timer announce). Props: `progress`, `lock`, `planType`.

### 3.2 `StatusPill`

A rounded pill (height 44 px, padding 0 16 px) directly under the ring. Contains a 16 px state glyph (inline SVG symbol, never emoji), the state text, and for `held`/`fallback` a subtle end time ("until 17:30") when the plan is not indefinite. The pill is `<output aria-live="polite" aria-atomic="true">` so state changes are announced once, in full. Colour is never the only cue: glyph shape and text differ per state.

| Lock state | Text (en) | Glyph | Tokens (border / tint / text) | Interactive? |
|---|---|---|---|---|
| `idle` | Ready | hollow circle | `--at-line` / none / `--at-ink` | No |
| `requesting` | Starting… | three dots | `--at-line` / none / `--at-muted` | No |
| `held` | Screen awake | filled dot with glow | `--at-accent` / accent 12% / `--at-ink` | No |
| `lost` | Paused — tab hidden | pause bars | `--at-warn` / warn 12% / `--at-ink` | No |
| `denied` | Blocked — here's the fix | cross in circle | `--at-bad` / bad 12% / `--at-ink` | Yes → opens `CapabilityNotice` |
| `unsupported` | Tap to use the fallback | question mark | `--at-line` / none / `--at-ink` | Yes → opens `FallbackConsent` |
| `fallback` | Awake via video fallback | small play triangle | `--at-accent` at 60% / accent 8% / `--at-muted` | No |

When interactive, the pill is rendered as a `<button>` wrapping the `<output>` text; the button has `aria-describedby` pointing at the notice it opens. The pill must reflect the engine state within one frame of the store update — it never shows "Screen awake" from a click handler (the nosleep.page defect the blueprint calls trust-breaking).

### 3.3 `PresetChips`

A `<div role="group" aria-label="Duration">` of `<button aria-pressed>` chips: `p15` "15 min" · `p30` "30 min" · `p45` "45 min" · `p60` "1 h" · `p120` "2 h" · `p240` "4 h" · `pinf` "∞" (visible) with `<span class="sr-only">Until I stop</span>` · `custom` "Custom…" · `until` "Until…". Layout: `grid-template-columns: repeat(auto-fit, minmax(72px, 1fr))` — at 320 px this yields two rows; nothing is ever hidden at any width (nosleep.page hides "1 hr" on phones). Chip min size 44 × 44, gap 8. Pressing a chip in `idle` starts a session with that plan; pressing a different chip while `active` switches the plan in place (lock stays held, timer restarts, toast "Switched to 2 hours"). Pressing the pressed chip does nothing (stopping is `Space`/the stop button, never an accidental chip tap). `custom` and `until` open their dialogs. Keyboard `1`–`6`, `0`, `U` map to the chips (§7). The default pressed chip in `idle` is `settings.defaultPreset` or the route's preset (§11). Styling: `toggleVariants({ variant: 'outline' })` applied to each `<button>` at build time; the pressed state is selected on `[aria-pressed="true"]` (never on Radix `data-state`, which does not exist here) and tints with `--accent` (§1.5).

### 3.4 `CustomDurationDialog`

Native `<dialog>` (modal; `showModal()`), title "Custom duration". Three `<input type="number" inputmode="numeric">` fields: Days 0–30, Hours 0–23, Minutes 0–59, each labelled, with `+`/`−` steppers (44 × 44). Live summary line: "Keeps the screen awake for 1 day 2 h 30 min — until Tue 09:15". Validation on submit: total must be ≥ 1 minute ("Choose at least 1 minute") and ≤ 30 days ("The longest custom session is 30 days"); non-integers are rounded down; empty = 0. Primary button "Start", secondary "Cancel". The last valid value is persisted in `at.v1.settings.lastCustomMs` (accepted — `00-conventions.md` §13.1) and pre-filled next time. Starting creates a `duration` plan with `presetId: 'custom'`. Styling: native `<dialog>` with the shadcn `Dialog` look (overlay, `--at-r-lg` panel, header/footer spacing) from `tool.css`; fields use the `Input`/`Label` classes, buttons `Button` `default`/`secondary`.

### 3.5 `UntilTimePicker`

Native `<dialog>`, title "Keep awake until…". Uses `<input type="time">` where supported; where the control is unusable (older Safari desktop) falls back to two `<select>`s (hour, minute in 5-min steps) plus AM/PM when the locale is 12-hour (`07-i18n.md` §5). Interpretation is always **local time**: if the chosen time is ≤ now, the target is tomorrow and the summary reads "Tomorrow at 06:18 — in 8 h 42 min"; otherwise "Today at 17:30 — in 2 h 14 min". Maximum lead is 24 h by construction. "Start" creates an `until` plan (`endsAt` epoch ms) with `presetId: 'until'`; the engine re-computes remaining time against the local clock on each tick and on `visibilitychange`, so a DST change or a laptop sleep keeps the deadline correct. Deep link written to the `ShareSheet`: `/until/17-30`. Styling: native `<dialog>` with the `Dialog` look, as §3.4.

### 3.6 `Timer`

`<div role="timer" aria-live="off">` with `font-variant-numeric: tabular-nums` so digits never jitter. Format: `HH:MM:SS` (hours always shown, zero-padded); ≥ 24 h shows `1d 02:15:00`. For `duration`/`until` plans it counts down; for `indefinite` it counts up with the caption "Elapsed". In `idle` it shows the pressed chip's duration statically in `--at-muted` (e.g. `00:30:00`) so the layout never shifts when a session starts; for `pinf` it shows `--:--:--`. A visually hidden `aria-live="polite"` sibling announces "42 minutes left" every 5 minutes, "1 minute left" at 60 s, and "Session complete" at zero — the `role="timer"` element itself stays `aria-live="off"` so screen readers are not flooded every second. Ticks come from the engine (1000 ms, wall-clock aligned, `Date.now()` arithmetic); the component never runs its own interval.

### 3.7 `Toast`

There is exactly one toast region: `<section aria-label="Notifications">` fixed bottom-centre (mobile) / bottom-right (≥ md), max 3 stacked, newest at the bottom. API: `toast({ id, kind: 'info'|'success'|'warn'|'error', text, action?: { label, onClick }, sticky?: boolean })`. Same `id` replaces instead of stacking. Info/success auto-dismiss after 6 s (paused while hovered or focused); `error` and `sticky` toasts stay until dismissed. Info toasts render as `role="status"`; errors as `role="alert"`. Each toast has a 44 × 44 close button labelled "Dismiss". The word `alert(` is banned in the island by an ESLint rule (`no-restricted-globals`). Styling: toasts are created by the island at runtime, so no `.tsx` is involved — `@apply` rules in `tool.css` give the toast the `Card` surface and the close button the `Button` `ghost` icon look; `kind` colours come from `--success`, `--warning`, `--destructive` (§1.5), never from new hex values.

### 3.8 `ResumeBanner`

On boot, if `at.v1.session` has `status: 'active'` or `'paused'` and either `endsAt > Date.now()` or the plan is `indefinite` with `startedAt` within 12 h, show a banner above the chips: "Resume your 1 h session? 42 min left" with buttons "Resume" and "Dismiss". Fires `resume_shown`; "Resume" fires `resume_accepted` and calls `start(session.plan)` with the original `endsAt`. If the URL carries `autostart=1`, resume happens without the banner. Dismiss marks the stored session `aborted` with reason `user`. Styling: a `Card` rendered at build time and unhidden by the island; "Resume" is `Button` `default`, "Dismiss" `Button` `ghost`.

### 3.9 `ExtendPrompt`

Shown when a `duration`/`until` session reaches `endsAt` and `settings.endBehaviour === 'prompt_extend'` (default). The engine keeps the lock **held** for a 60 s grace period so the screen does not go dark while the user decides; the dialog counts that grace down ("Screen stays awake for 48 s more"). Contents: title "Time's up — keep going?", buttons "+15 min", "+30 min", "+60 min", "Stop" (Stop is the default-focused button so `Enter`/`Esc` both stop). Extending creates a new session (`session_start` with `source: 'extend'`). Alongside: the chime (if `settings.sound`), a Web Notification "AwakeTab: your 1 h session is done" (if `settings.notifications` and permission granted), and a `document.title` flash alternating "Done — AwakeTab" / the original title every second until focus returns. The `ProCard` may appear below the buttons (§3.23), and, behind `PUBLIC_SPONSOR_ENABLED`, the `SponsorCard` slot (§3.23, built in the M6 follow-ups). These are the only monetization inside this dialog; Google ads never appear here. Styling: native `<dialog>` with the `Dialog` look (§3.4); the four buttons use `Button` variants per §1.5, with "Stop" visually secondary so the extend options read as the offer and Stop as the safe exit.

### 3.10 `CapabilityNotice`

Inline card that replaces the `Timer` area when `lock` is `denied` or `unsupported`, keyed by an advice code the engine sets (`advice`). Codes (`TAdviceCode`, accepted — `00-conventions.md` §13.1): `battery_saver` · `low_power_ios` · `hidden_document` · `permissions_policy` · `insecure_context` · `unsupported_browser` · `ios_safari_old` · `firefox_old` · `iframe_no_allow`. Each code maps to i18n keys `tool.advice.<code>.title`, `.body` and `.steps.<os>` where `<os>` ∈ `windows|macos|android|ios|chromeos|linux|other` chosen from the UA class. Example (`battery_saver`, `windows`): title "Battery saver is blocking the wake lock"; body "Windows and Chrome refuse wake locks while Battery saver is on."; steps "1. Open Settings › System › Power & battery. 2. Turn Battery saver off, or plug in. 3. Tap Retry." Every notice ends with a "Retry" button (re-requests the lock) and a descriptive link (`tool.advice.learn`, "Why this happens and how to fix it" — never a generic "Learn more", which fails Lighthouse `link-text`) to the matching `/guides/*` or `/on/*` page. The notice never claims success — after "Retry" the pill speaks. Styling: an `Alert` with `AlertTitle`/`AlertDescription` (state colour from the pill tokens, §3.2, not a new palette); "Retry" is `Button` `default`, the link `buttonVariants({ variant: 'link' })` with `h-auto whitespace-normal` so the longer phrase wraps at 320 px.

### 3.11 `FallbackConsent`

Shown for `unsupported` (and offered under `denied` when the advice code is `unsupported_browser`/`ios_safari_old`/`firefox_old`). Card text: "Your browser has no Wake Lock API. AwakeTab can keep the screen on by looping a tiny silent video instead." Button "Use video fallback" (the user gesture the video needs). Small print (`--at-t-xs`): "Uses a little more battery — a 1-frame video plays in the background. Works only while this tab is visible." On success the pill moves to `fallback` and `fallback_used` fires. If playback is rejected, toast (error) "Couldn't start the fallback — check that autoplay isn't blocked for this site." Styling: `Card` with `CardDescription` for the small print; the consent button is `Button` `default`.

### 3.12 Stop control

A full-width secondary button "Stop" under the chips while `active`/`paused`; hidden in `idle`. `Space` toggles the same intent. Stopping ends the session with reason `user`, releases the lock, and returns to `idle` with no confirmation dialog. Styling: `Button` `secondary`, full width.

### 3.13 `AmbientShell`

Wraps the whole island when `ui.mode !== 'standard'`. Modes: `standard` · `clock` · `focus` · `minimal` · `night` · `message` · `cook`. Behaviour common to all non-standard modes:

- **Auto-hide controls** after 3 s (`settings.ambient.autoHideMs`) without pointer movement, key press or touch (`controlsHidden: true` → the ambient control bar fades to 0 and becomes `inert`; the pill stays visible because the honest status must never hide — M6 decision: instead of 60% opacity it steps down to the muted ink `--muted-foreground`, which stays ≥ 4.5:1). Any pointer/key/touch shows them again for 3 s. Auto-hide is off while a dialog is open or when a screen reader is detected via `forced-colors`/keyboard-only heuristics (first `Tab` press disables auto-hide until reload).
- **Pixel shift**: every 60 s the mode content wrapper translates by a random `(±2px, ±2px)` (`transform`, composited) to guard OLED burn-in. Active in every mode except `standard`; instant under reduced motion.
- **Fullscreen**: `F` or the fullscreen button calls `documentElement.requestFullscreen({ navigationUI: 'hide' })`; failure (iPhone Safari has no element fullscreen API) toasts "Fullscreen isn't available here — add AwakeTab to your Home Screen for a full-screen clock" with a link to `/on/ios-home-screen`.
- **Wake on pointer**: in `night`, the mode content dims after 30 s idle (`NIGHT_DIM_AFTER_MS`) and returns to full on pointer/key/touch. M6 decision: the dim is 65% opacity, not 35%, so the red digits stay ≥ 3:1 (E10-T07). **Burn-in guard**: on the `oled` palette every non-`standard` mode dims the same way after 30 min without input (`BURNIN_DIM_AFTER_MS`).
- The `Ring`, `StatusPill` and `Timer` are re-parented into each mode's layout rather than duplicated, so there is one source of truth for state.

Mode layouts:

| Mode | Layout | Gate |
|---|---|---|
| `clock` | Local time `HH:MM` (`--at-t-ambient`), seconds small, date line; ring shrinks to 96 px top-right | free |
| `focus` | Pomodoro (§3.14) | free |
| `minimal` | Ground colour only, pill in the muted ink (not 40% opacity, to stay AA) and timer at `--at-t-sm` bottom-left | free |
| `night` | `oled` palette forced, local-time digits in `--at-night-digit` `#FF5A3C` (red preserves night vision), dimmed to 65% after 30 s idle, no ring | free |
| `message` | §3.15 | `ambient.message` |
| `cook` | §3.16 | free (attribution-free embed is Business, §11-embed-spec) |

`M` cycles modes in the order listed (skipping gated modes the user lacks, with a toast "Message mode is a Pro feature" the first time). Theme packs (`ambient.packs`) change palettes and digit faces, not layouts.

**As implemented (M6).** Only `message` is gated (`MODE_GATES` in `ambient/logic.ts`); `ambient.packs` gates the Teal/Rose palettes (§1.1a), never a layout — this table wins over the E10-T01 wording in `15-implementation-plan.md`. A gated mode reached through `mode=`, Settings or a resumed session renders its honest Pro card (§3.15) instead of a broken screen; only `M` skips it. The layer is a modal `<dialog data-ambient>` (the page behind it is inert and focus stays inside); the `[data-pip-slot]` holding pill, ring and timer, and the toast region, are moved into it and back on exit. `ambient/shell.ts` loads on the first non-`standard` mode and each mode is its own lazy chunk (`clock.ts` serves `clock` and `night`; `focus.ts`, `message.ts`, `cook.ts`; `minimal` is CSS only). The control bar has Next mode, Fullscreen and Exit. Pressing `Tab` once disables auto-hide for the rest of the page view; auto-hide never fires while a dialog is open. Pixel shift writes `translate` on the stage when `settings.ambient.pixelShift` is on. `Esc` closes the innermost layer: an open dialog, then the ambient mode (back to `standard`, the session keeps running), then the session (§5). While a session is live, mode changes are persisted with `engine.updateSession({ mode })` and a resumed session restores its mode.

### 3.14 `FocusMode`

Pomodoro: 25 min focus / 5 min break, four cycles, then a 15 min long break. The wake lock is held through breaks — the "session" is the whole block (`duration` plan of 130 min, `presetId: 'custom'`, `mode: 'focus'`). Display: interval label ("Focus 2 of 4" / "Break"), interval countdown in `--at-t-ambient`, four small dots for cycle progress. Chime at each boundary (respects `settings.sound`); a Web Notification "Break time — 5 min" if permitted. Session count for the day is read from `at.v1.stats` and shown as "3 focus blocks today". Intervals are computed from `startedAt` with `Date.now()`, never from accumulated ticks, so a tab left in the background is still correct when revisited.

**As implemented (M6).** Work/break/cycles come from `settings.ambient.focus` (defaults 25/5/4); the long break is `FOCUS_LONG_BREAK_MIN` (15). "Start focus" starts one `duration` plan of `focusPlanMs()` (130 min with the defaults). The phase is derived on every repaint from *active* elapsed time (wall time minus every pause, including one in progress). A boundary plays the `focus` chime (523/659 Hz), shows a toast, updates a polite live region and sends a notification tagged `at-focus`. *M6 follow-ups:* "Start a focus block" marks the session with `modeState.focusBlock = true`. When that session completes, the engine counts it in `at.v1.stats.dayFocus[localDay]` (`08-data-storage.md` §2.3). The mode shows "N focus blocks today" (`ambient.focus.today`, `[data-focus-today]`) under the controls, hidden at 0, and re-reads it when a block starts or ends. A block stopped early or an extension does not count.

### 3.15 `MessageMode`

Shows one line of user text (≤ 80 chars) centred in `--at-t-ambient` with `text-wrap: balance`, plus the pill. Source: `msg=` URL param or the saved message in `at.v1.settings.ambient.message` (accepted — `00-conventions.md` §13.1). Sanitisation: read as a string, `normalize('NFC')`, strip C0/C1 control characters and bidi overrides (`‪-‮`, `⁦-⁩`), collapse whitespace, truncate to 80 code points, render with `textContent` (never `innerHTML`). Gate `ambient.message`: without Pro, choosing the mode from the cycle shows the layout with sample text behind a scrim and the `ProCard`; a shared link with `msg=` renders the message for 60 s (so shared links still delight), then toasts "Custom messages are a Pro feature" and falls back to `clock`.

**As implemented (M6).** Text is re-sanitised with `sanitizeMsg()` in the mode module and written with `textContent` only, with `dir="auto"`. The 60 s preview (`MESSAGE_PREVIEW_MS`) is spent once per page view; returning to the mode afterwards shows the sample text and Pro card. The Pro card's link tracks `pro_view {from: 'message'}`. With Pro, `msg=` wins over the saved message.

### 3.16 `CookMode`

Designed for a propped-up phone and wet hands: everything ≥ 64 × 64 px, high contrast, no auto-hide of the pause hint. Elements: big elapsed timer (`--at-t-ambient`, counting up since the session started), caption "Tap anywhere to pause the timer", the pill, and up to three kitchen timers. Tap-anywhere toggles the session between `active` and `paused` — the **lock stays held** while paused (the screen must not go dark mid-recipe; `paused` affects the elapsed count only), and the pill still reads "Screen awake". Kitchen timers: name ≤ 20 chars (defaults "Timer 1"), duration 1 min–12 h via a 5/10/15/30/60-minute quick row plus custom; each shows its own countdown, chimes at zero (distinct from the session chime), flashes its card in `--at-good` for 10 s and triggers a notification "Pasta — done". Timers persist in `at.v1.session.modeState.cookTimers[]` (accepted — `00-conventions.md` §13.1, §13.8) so a reload resumes them. Only the `cook` plan default is `pinf`; the `ExtendPrompt` never appears in cook mode.

**As implemented (M6).** The tap target pauses with `engine.pause({ keepLock: true })` (`04-engine-spec.md` §9), so the lock stays held and the pill keeps reporting the real lock state; with no live session, a tap (or adding a timer) starts an indefinite `pinf` session. Timer shape `{ id, name, durationMs, endsAt, doneAt }` (`08-data-storage.md` §2.2), written through `engine.updateSession({ modeState: { cookTimers } })` and read back defensively (malformed entries dropped, at most `COOK_MAX_TIMERS` = 3). Names are NFC-normalised, stripped of control/format characters and cut to 20 code points; the default is "Timer N". Durations: quick row 5/10/15/30/60 min or a custom 1–720 min field (`COOK_MIN_MS`–`COOK_MAX_MS`); out-of-range input toasts `ambient.cook.timer.invalid`. At zero a timer plays the `timer` chime (three 988 Hz beeps, distinct from the end chime), toasts, notifies with tag `at-cook-{id}`, and its card carries `data-flash` for `COOK_FLASH_MS` (10 s). Kitchen timers count against wall time and keep running while the session clock is paused. Cards are keyed by id so focus on a Remove button survives the per-second repaint; the add form hides at three timers.

### 3.17 `StatsPanel`

Dynamic import; opened from the header ("Stats"). Reads `at.v1.stats`. Shows: Today (minutes and sessions), This week (last 7 local days), Current streak (consecutive local days with ≥ 1 min; day key from `Intl.DateTimeFormat('en-CA')`), and a 12-week heatmap (`<table>` 7 rows × 12 columns, each cell a `<td>` with `aria-label="Mon 3 Aug: 42 min"`, five intensity steps mapped by quantile, colour plus a visible dot count so intensity is not colour-only). Gates: without `stats.history`, only the last 7 days render; older cells are shown as a blurred placeholder with a lock glyph and the caption "Pro keeps 12 weeks of history". `stats.export` adds "Export CSV" (`date,minutes,sessions`), generated client-side with `Blob` + `<a download>`; in the embed and PiP contexts the button is hidden. Empty state: "No sessions yet — start one and your first day appears here."

**As implemented (M6).** `stats/panel.ts` + `stats/heatmap.ts`, opened by the header Stats button into `<dialog data-dialog="stats">` (`TDialogName` `'stats'`). Rows are Monday first, columns oldest week first (`HEATMAP_WEEKS` 12); cells are keyed by local calendar date. Levels 1–4 are the quartiles of the visible non-zero days; tints are 10/20/30/40% of `--at-accent` over the surface — capped at 40% so the ink dot glyphs (`•` to `••••`, the non-colour cue) stay readable. Without `stats.history` days older than `FREE_HISTORY_DAYS` (7) are hatched, labelled "locked", and the "Pro keeps 12 weeks of history" line shows; future days of the current week are dashed and `aria-hidden`. Summary: today, last 7 local days, current streak, and total time with the lifetime `sessions` count. *M6 follow-ups:* "Today" reads "42 min · 2 sessions" from `daySessions[today]` (`IStatsSummary.todaySessions`, reusing `stats.totalValue`), and the CSV's `sessions` column is filled from `daySessions`. Data recorded before per-day counts shows 0 sessions today, and those days have an empty CSV cell (`08-data-storage.md` §6). Export (`stats.export`) downloads `awaketab-stats-YYYY-MM-DD.csv` from `exportStatsCsv()`; hidden in `/pip` and the embed.

### 3.18 `SettingsSheet`

Bottom sheet (mobile) / right panel 360 px (≥ md), native `<dialog>`, title "Settings". Every field is a setting in `at.v1.settings` (schema owned by `08-data-storage.md`; names below are the canonical field list from `00-conventions.md` §6):

| Field | Control | Values / copy |
|---|---|---|
| `theme` | segmented | Auto · Light · Dark · OLED (`auto`/`light`/`dark`/`oled`) |
| `accent` | swatches | Amber (default) · Indigo · Teal · Rose — Teal and Rose disabled with a Pro note unless `ambient.packs` (§1.1a) |
| `defaultPreset` | select | one of the preset IDs, default `p30` |
| `sound` | switch + select | "Chime at the end" · one free chime, more with `sounds.custom` |
| `notifications` | switch | "Notify me when a session ends" → requests permission on enable (never otherwise); disabled with `settings.notifications.unavailable` where the API is absent (iOS outside the installed app), and a "blocked" note when permission is denied |
| `endBehaviour` | segmented | "Ask to extend" (`prompt_extend`, default) · "Just stop" (`stop`) |
| `battery` | switch + slider | "Stop automatically on low battery" · threshold 5–30 %, default 15 % (Chromium only; hidden elsewhere with note) |
| `ambient` | group | default mode, message (editable only with `ambient.message`), clock seconds on/off, 12/24 h override (Auto · 24 h · 12 h) |
| `locale` | select | 8 launch locales; changes the UI strings immediately and links to the localized URL |
| `telemetry` | switch | "Send anonymous usage events" default on; explains exactly what is sent (link `/privacy`) |
| `keyboardHints` | switch | "Show keyboard hints on buttons" |

Changes apply immediately (no Save button) and persist on `change`. "Reset to defaults" at the bottom with a two-step confirm inline ("Reset? Yes, reset"). A "Pro" row shows plan and "Manage devices" → `/pro/manage`. Styling: native `<dialog>` with the `Dialog` look from `tool.css` (panel geometry per this section, not Radix Sheet); rows use the `Label` and `Input` classes; the plan row carries a `Badge` `secondary`.

### 3.19 `ShortcutsOverlay`

`?` opens a `<dialog>` listing the map in §7 as a two-column `<dl>`; `Esc` or `?` closes. Also linked from the footer ("Keyboard shortcuts"). Styling: native `<dialog>` with the `Dialog` look; every key in the `<dl>` is rendered with `Kbd` at build time.

### 3.20 `ShareSheet`

Opened from the header ("Share"). Builds the shortest equivalent link: preset routes (`/30m`, `/1h`, …), `/until/HH-MM` for until plans, `/?preset=custom&…` is **not** supported — custom durations share as the nearest preset with a note. Optional toggles append `autostart=1` and `mode=`. Uses `navigator.share({ url, title })` when available, otherwise a read-only input with a "Copy" button (toast "Link copied"). Fires `share_click`. Never appends `ref=`.

### 3.21 `SecondTabWarning`

`BroadcastChannel('awaketab')` announces lock claims. When another tab reports `held`/`fallback`, this tab shows a banner: "AwakeTab is already keeping the screen awake in another tab." Buttons: "Use this tab instead" (asks the other tab to release, then starts here) and "Keep the other one" (dismiss; this tab stays `idle`). Only one tab holds a lock at a time; message protocol is in `04-engine-spec.md`. Styling: `Card`, as `ResumeBanner` (§3.8).

### 3.22 `RatingPrompt`

Shown once, after the fifth *counted* session — reason `completed` and ≥ 5 min awake (`COUNTED_SESSION_S`) — (`at.v1.meta.sessionCount ≥ 5` and `ratingPrompt.action` unset), 2 s after the `ExtendPrompt` closes, never during an active session. Dialog: "Is AwakeTab doing its job?" with five star buttons (radio group, 44 × 44 each, labelled "1 star" … "5 stars"), an optional `<textarea maxlength="280">` "Anything we should fix?", and buttons "Send", "Maybe later", "Don't ask again". Actions map to `rating_prompt {action}` with `rate` / `later` / `never`; `later` re-arms after 10 more completed sessions, `never` is permanent. "Send" posts `{ stars, text, locale, ver }` to `POST /api/rating` (accepted — `00-conventions.md` §13.3; stores to KV for the build-time ratings export used by `aggregateRating` in 06-content-seo-spec.md). Only ratings the user actually submits feed `aggregateRating`; "later"/"never" are never counted. Styling: native `<dialog>` with the `Dialog` look; "Send" is `Button` `default`, "Maybe later" and "Don't ask again" `Button` `ghost`; star buttons keep their own 44 × 44 styling.

**As implemented (M6).** `ui/rating.ts` runs `RATING_DELAY_MS` (2 s) after the `ExtendPrompt` closes, or after the completion toast when there is no prompt. It stays silent while a session is `active`/`paused`, while the lock is `held`, while another dialog is open, or while an ambient mode is showing. `later` stores `ratingPrompt.rearmAt = sessionCount + 10` (`RATING_REARM_SESSIONS`); closing with `Esc` counts as `later`; `rated` and `never` are final. Events: `rating_prompt {action: 'rate' | 'later' | 'never', stars?}` and, on Send, `rating_submitted {stars}`. The POST uses `keepalive`; a failed POST shows `rating.failed` and still records `rated`. A missing star choice shows `rating.error.stars` inline.

### 3.23 `ProCard` and `SponsorCard`

`ProCard` (`09-monetization-impl.md`): a single card "AwakeTab Pro — ambient packs, schedules, 12-week stats. $12/year." with "See what's in Pro" → `/pro` (`pro_view`). Placements: (a) below the chips in `idle` state only; (b) inside the `ExtendPrompt`. It unmounts the moment the lock is `held`/`fallback`. `SponsorCard`: one disclosed "Sponsored" card, fixed 300 × 100 slot (reserved even when empty so CLS is 0), placement (a) only in v1; the G5 awake-screen placement from `00-conventions.md` §8.3 is a later, separately specified placement and ships off by default. Google ads never render inside the island, `/pip` or `/embed/*` — the ads module is not even imported on tool routes. Styling: both are `Card`s rendered at build time; the Pro header badge is `Badge` `secondary`, "See what's in Pro" is `buttonVariants({ variant: 'link' })`, and `SponsorCard` carries a `Badge` `outline` reading "Sponsored".

**As implemented (M6, `sponsor.ts`).** The slot `<aside data-sponsor>` is rendered at build time only when `PUBLIC_SPONSOR_ENABLED=1`; the island then fetches `/config/sponsor.json` (`{ enabled, id, name, text, url }`, validated: `id` `[a-z0-9_-]`, `url` `https:` only; the shipped file is `{ "enabled": false }`). The card is visible only in `idle` with no live session; otherwise it is `visibility: hidden` and `inert`, keeping its 300 × 100 box (CLS 0). Pro `ads.free` skips it. `sponsor_view {sponsorId}` fires once per page view, `sponsor_click {sponsorId}` on the link (`rel="sponsored noopener"`). *M6 follow-ups — ExtendPrompt placement:* both slots come from one build-time `SponsorCard.astro` (`data-sponsor="idle" | "extend"`), rendered only when `PUBLIC_SPONSOR_ENABLED=1`, and filled from the same single `/config/sponsor.json` fetch. The `extend` slot sits below the four buttons inside the `ExtendPrompt` with the same fixed 300 × 100 box, so the dialog never reflows when the card fills in. When there is nothing to show (Pro `ads.free`, or no or invalid config), it is set to `hidden` long before any session can end and the dialog open. `sponsor_view` still fires once per page view, from whichever slot the user sees first (the idle card, or the ExtendPrompt opening). Google ads remain absent from the island.

### 3.24 `InstallPrompt`

Captures `beforeinstallprompt`, calls `preventDefault()`, and shows a small "Install" header button once `at.v1.meta.sessionCount ≥ 2` or when Settings opens. Clicking calls `prompt()`; `appinstalled` fires `pwa_install`. On iOS (no event) the button opens a sheet: "Add AwakeTab to your Home Screen: tap Share, then Add to Home Screen. Installed, it can notify you when a session ends and run full screen." Hidden when `display-mode: standalone` matches.

---

## 4. Layout

### 4.1 Tool pages (`/`, preset routes, `/for/*`, `/on/*`, etc.)

The tool occupies the first viewport on every tool page, including a 320 × 568 phone: header 56 px → `Ring` 192 (160 at < 360) → `StatusPill` 44 → `Timer` 64 → `PresetChips` 2 × 44 + 8 → Stop/ResumeBanner slot 48 (reserved) — 520 px in total. Header: wordmark (ring motif + "AwakeTab"), then right-aligned Install, Stats, Share, Theme, Settings icon buttons (44 × 44, `aria-label`ed, `keyboardHints` add `<kbd>` badges). The `<h1>` is the first element under the header and is visually `--at-t-2xl`; on `/` it reads "Keep your screen awake" and on content pages it matches the page intent (`06-content-seo-spec.md`).

**Layout stability on autostart (M9, CLS 0 in Lighthouse).** Everything that changes when a session starts keeps its box: `[data-pip-slot]` spans the panel (`justify-self: stretch`) so a wider caption never re-centres it; the pill is at least ring-wide (`min-inline-size: 12rem`, text centred in a full-width `<output>`) so Ready → Starting… → Screen awake changes words, not geometry (the widest of those three in any locale is 168 px, German); the timer spans the slot and its caption line is reserved (`min-block-size: 1lh`); Stop sits in `.at-stop-slot`, whose 44 px row is reserved on the full tool (not in the embedded tool, which only starts on a click that CLS already excludes); the header action row fills its line and packs to the end, so the Install button or Pro badge appearing at its start moves nothing; and the one-time language suggestion (`07-i18n.md` §2) is a fixed banner at the bottom of the viewport instead of an in-flow block above the chips. Longer pill states (lost, denied, fallback) may still widen the pill; they never happen during load.

### 4.2 Below-fold section order on `/`

1. Answer paragraph (first 100 words: what it does, that it uses the browser's Wake Lock API, that the tab must stay visible).
2. "How it works" — three steps with the pill states shown honestly.
3. Honest limits callout (`<aside>`): tab hidden, lid closed, Low Power Mode, Teams/Slack presence.
4. Browser and OS support matrix (`<table>` with "Last verified" line) linking `/learn/browser-support-matrix`.
5. Scenarios grid → the 18 `/for/*` pages.
6. Devices row → `/on/*`.
7. Comparisons → `/vs/*`.
8. Eight FAQs as `<details>`.
9. Pro strip (from G2) and extension/embed/library cards.
10. Author box → `/about`, changelog link, footer (privacy, terms, shortcuts, language switcher).

Each section is `content-visibility: auto; contain-intrinsic-size: auto 480px` and lazily hydrates nothing — sections are static HTML.

### 4.3 Breakpoints

`sm` 480 · `md` 768 · `lg` 1024 · `xl` 1280 (min-width queries; 320 is the floor). ≥ `md`: chips in one row, toasts bottom-right, Settings as a side panel, heatmap full width. ≥ `lg`: content column max 720 px with the tool centred in a 960 px band. Ambient modes ignore breakpoints and use viewport units.

---

## 5. Keyboard map and focus management

From `00-conventions.md` §5.3, active on web and `/pip`:

| Key | Action | Guard |
|---|---|---|
| `Space` | Toggle: start default/pressed preset, or stop | Only when focus is on `<body>` or a non-interactive element (native button activation wins otherwise) |
| `1`–`6` | Start/switch to `p15` `p30` `p45` `p60` `p120` `p240` | Not while a dialog is open or focus is in an input |
| `0` | `pinf` | same |
| `U` | Open `UntilTimePicker` | same |
| `F` | Toggle fullscreen | same |
| `D` | Cycle theme `auto → light → dark → oled` | same |
| `M` | Cycle ambient mode | same |
| `P` | Toggle PiP | same |
| `Esc` | Close the innermost layer: an open dialog/overlay, else leave the ambient mode, else stop the session | always |
| `?` | Toggle `ShortcutsOverlay` | not in inputs |

Rules: shortcuts are letters, so they are disabled while `event.target` is an input, textarea, select or `contenteditable`; they ignore events with `ctrl`/`meta`/`alt` held; they use `event.key` compared case-insensitively so `Shift+/` (`?`) works on every layout. Focus: dialogs use native `<dialog>` focus trapping; on close, focus returns to the element that opened them. Starting a session from a chip keeps focus on that chip; a toast never steals focus; the `ExtendPrompt` moves focus to "Stop". A visible skip link "Skip to content" precedes the header for content pages. Focus is always visible (`:focus-visible` outline `2px solid var(--at-focus)`, offset 2 px), never removed.

---

## 6. State → UI matrix

Lock state comes from `@awaketab/wake`; session status from `@awaketab/core`. Combinations not listed cannot occur (the engine prevents them; if observed, log `client_error {code: 'state_mismatch'}` and render the row for the lock state with the session treated as `inactive`).

| Lock | Session | Ring | Pill | Timer | Chips | Toast / banner |
|---|---|---|---|---|---|---|
| `idle` | `inactive` | Track only, dot `--at-muted` | Ready | Selected preset duration, muted | Enabled; default pressed | `ResumeBanner` if a stored session qualifies; `ProCard`/`SponsorCard` eligible |
| `requesting` | `active` | Indeterminate dot | Starting… | Planned duration, muted | `aria-disabled` until resolved (≤ 300 ms typical) | — |
| `held` | `active` | Progress in accent, dot glow | Screen awake · "until 17:30" | Counting down/up | Pressed = current; others switch plan | "Switched to 2 hours" on plan change only |
| `held` | `paused` (cook only) | Frozen progress, no glow | Screen awake | Frozen, caption "Paused" | Hidden by cook layout | — |
| `lost` | `active` | Stroke `--at-warn`, frozen look | Paused — tab hidden | Keeps counting (deadline fixed) | Enabled | On return to visible: none if re-acquired within 2 s; otherwise info toast "Re-acquiring the wake lock" |
| `lost` → timeout | `aborted` (`lost_timeout`) | Track only | Ready | Static | Enabled | Warn toast "Stopped — the tab was hidden for 15 minutes. Start again when you're back." |
| `denied` | `inactive` / `aborted` (`denied`) | Dashed `--at-bad` track | Blocked — here's the fix (button) | Replaced by `CapabilityNotice` | Enabled (retry) | — (notice is inline) |
| `unsupported` | `inactive` | Track only | Tap to use the fallback (button) | Replaced by `FallbackConsent` | Enabled; pressing opens consent first | — |
| `fallback` | `active` | Dashed accent progress | Awake via video fallback | Counting | As `held` | Small CPU note under pill |
| any | `completed` | Full ring, `--at-good` flash 600 ms, then track | Ready (after release) | `00:00:00` + "Session complete" | Enabled | `ExtendPrompt` (if `prompt_extend`), chime, notification, title flash |
| any | `aborted` (`battery`) | Track | Ready | Static | Enabled | Warn toast "Stopped at 15 % battery to save power. Plug in and start again." |
| any | `aborted` (`error`) | Track | Ready | Static | Enabled | Error toast "Something went wrong — try again." + `client_error` |
| any | `aborted` (`user`) | Track | Ready | Static | Enabled | — |

---

## 7. Accessibility (WCAG 2.2 AA)

- **Contrast**: all pairs in §1.1 pass 4.5:1 (text) / 3:1 (UI, large text); the CI fixture enumerates them. State tints are backgrounds behind `--at-ink`, never behind accent text.
- **Targets**: every interactive element ≥ 44 × 44 CSS px (2.5.8 Target Size); cook mode ≥ 64.
- **Focus**: visible on all controls (2.4.11 Focus Not Obscured — toasts sit outside the focus path; sheets never cover a focused element).
- **Live regions**: `StatusPill` (`polite`, atomic), `Timer` companion (`polite`, throttled), error toasts (`alert`). Nothing else is live.
- **No colour-only state**: glyph + text on the pill, dashed strokes on the ring, dots on heatmap cells, text labels on every state.
- **Motion**: §1.4; no content flashes more than 3 times per second (the title flash alternates at 1 Hz; the good-flash is a single 600 ms fade).
- **Names**: ring `role="img"` + label; timer `role="timer"`; chips `aria-pressed`; icon buttons have `aria-label`; kitchen timers are `<section aria-labelledby>`.
- **Keyboard**: everything reachable and operable; no keyboard trap; single-key shortcuts can be turned off (2.1.4 Character Key Shortcuts requires a way to turn them off: the separate `settings.keyboardShortcuts` boolean, accepted — `00-conventions.md` §13.1; `keyboardHints` only shows hints).
- **Language**: `<html lang>` per locale; the message mode text gets `lang` from the page.
- **Zoom**: 400 % zoom and 320 px width lose no content (2 × 2 chip grid; ring scales).
- **Forced colours**: `@media (forced-colors: active)` sets ring strokes to `CanvasText`/`Highlight` and keeps borders.
- Lighthouse Accessibility 100 and axe-core zero violations are release gates (`00-conventions.md` §11).

---

## 8. PWA

### 8.1 Manifest

One manifest per locale at `/{lang}/manifest.webmanifest` (root for `en`), localized strings only; generated by `scripts/manifests.mjs` before `astro build`.

```json
{
  "id": "/",
  "name": "AwakeTab — keep your screen awake",
  "short_name": "AwakeTab",
  "description": "Keeps your screen awake with the browser's Wake Lock API. Presets, until-time, clock modes. No account, no tracking.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone"],
  "orientation": "any",
  "lang": "en",
  "dir": "ltr",
  "background_color": "#FAF7F2",
  "theme_color": "#FAF7F2",
  "categories": ["utilities", "productivity"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-mono.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "monochrome" }
  ],
  "shortcuts": [
    { "name": "30 minutes", "url": "/30m?autostart=1", "icons": [{ "src": "/icons/sc-30m.png", "sizes": "96x96" }] },
    { "name": "Until I stop", "url": "/?preset=pinf&autostart=1", "icons": [{ "src": "/icons/sc-inf.png", "sizes": "96x96" }] },
    { "name": "Clock", "url": "/?mode=clock", "icons": [{ "src": "/icons/sc-clock.png", "sizes": "96x96" }] }
  ],
  "screenshots": [
    { "src": "/screens/phone-held.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screens/desktop-clock.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide" }
  ]
}
```

Locale manifests set `id`/`start_url`/`scope` to `/{lang}/…` so each locale installs as its own app. `theme_color` and `background_color` are the `light` ground (the manifest allows one value); runtime theme colour is handled by `<meta name="theme-color">` (§12). `source=pwa` is read into the `source` field of `session_start`/`page_view` and stripped after read like `ref=` (accepted — `00-conventions.md` §13.2). Also ship `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` (180 px) and `<meta name="apple-mobile-web-app-title" content="AwakeTab">`.

### 8.2 Service worker (`src/sw.ts`, Workbox runtime modules, built by `scripts/sw.mjs` — `03-architecture.md` ADR-014)

| Scope | Strategy | Cache | Notes |
|---|---|---|---|
| App shell: `/`, `/pip`, `/15m`…`/8h`, the seven locale homes `/{lang}/`, `favicon.svg`, the eight manifests, `/icons/*`, every hashed `_astro/*.js` and `*.css` | Precache (`precacheAndRoute`) | Workbox precache | Manifest built from `dist/` after the prune step (58 entries at M6 close). Pages and static files carry an MD5 revision; hashed assets use `revision: null`. Query strings are ignored when matching (`ignoreURLParametersMatching: [/.*/]`) because the island reads them. The fallback video is inline base64, so there is no file to cache |
| Content navigations `/for/*` `/on/*` `/vs/*` `/guides/*` `/learn/*`, `/about`, `/privacy`, `/terms`, `/changelog`, `/pro*` (all locales) | `StaleWhileRevalidate` | `at-content`, max 80 entries, 30 days | Same-origin only; third-party ad scripts are cross-origin and never match a route |
| Images under `/og/`, `/screens/`, `/img/` | `CacheFirst` | `at-img`, max 60, 30 days | |
| `/api/*` | `NetworkOnly` | — | Never cached; events queue in memory and retry |
| `/embed/*` | `NetworkFirst` (3 s timeout) | `at-embed` | Widget must reflect current licence when online |
| Navigation fallback | precached `/{lang}/` (or `/`) | — | `setCatchHandler`; never for `/api/*`, `/embed/*` or `/pip` |

The offline page **is the tool**: an offline navigation to any uncached route renders the precached locale home with the pill working normally, and while `navigator.onLine` is false the island shows a sticky toast "You're offline — the tool works, content pages may be unavailable." (`tool.offline`), dismissed on `online`. Update flow (`pwa.ts`, prompt style): the worker never skips waiting on its own. When a new worker is `waiting` and no session is `active`/`paused`, the island shows a sticky info toast "Update available" with action "Reload"; if a session is live it re-checks on every store change and offers the toast as soon as the session ends (FR-PWA-01). "Reload" posts `SKIP_WAITING` and reloads once on `controllerchange`. The worker calls `clients.claim()` on activate, and its `notificationclick` focuses an open AwakeTab tab or opens `/`. The worker is registered only in production builds; `/sw.js` is served `Cache-Control: no-cache` with `Service-Worker-Allowed: /`. `cleanupOutdatedCaches()` removes earlier precaches, and precache revisioning is content-hash based so an update downloads only changed files.

---

## 9. Document Picture-in-Picture

`P`, the header PiP button, or `pip_open` from a shortcut opens a floating always-on-top window that shows the pill and timer while the user works in other windows.

```ts
const pip = await documentPictureInPicture.requestWindow({ width: 280, height: 120 });
for (const sheet of document.styleSheets) { /* copy <style>/<link> nodes into pip.document.head */ }
pip.document.documentElement.dataset.theme = document.documentElement.dataset.theme;
pip.document.body.append(pillEl, timerEl);           // move, do not clone — one DOM, one truth
pip.addEventListener('pagehide', () => { originalSlot.append(pillEl, timerEl); store.set({ ui: { pip: 'closed' } }); });
store.subscribe(s => s.ui.mode, applyPipTheme);
```

Rules: the PiP window is same-origin and shares the store, so no messaging is needed; keyboard shortcuts `Space`, `Esc`, `P` work inside it (`P` closes). The window shows: pill, timer, a 32 px Stop button, and a `+15` button; nothing else. `pip.pro` gates ambient layouts inside PiP (clock/focus digits); the basic pill+timer is free. **Lock behaviour**: when PiP opens, the engine also requests a sentinel from the PiP document (`pip.navigator.wakeLock.request('screen')`), which stays visible when the main tab is backgrounded; when PiP closes that sentinel is released and the main document's sentinel governs. If the test matrix (`13-testing-strategy.md`) shows the PiP sentinel is released on main-tab hide in a given browser, the pill must show `lost` there — the UI never assumes. Fallback when `documentPictureInPicture` is undefined (Firefox, Safari, mobile): `window.open('/pip', 'awaketab-pip', 'popup,width=280,height=120')`; `/pip` renders the pill and timer and syncs state over `BroadcastChannel('awaketab')`, and its buttons post intents back to the owning tab. If the popup is blocked, toast "Allow pop-ups for awaketab.com to use the floating timer." `/pip` is `noindex` and never shows cards or ads.

**As implemented (M6).**

- *Document PiP* (`tool/pip.ts`): `P` or the header button opens a 280 × 120 window (`PIP_SIZE`), copies `<style>`/`<link rel="stylesheet">` nodes, theme and `lang`, and **moves** the pill and timer out of `[data-pip-slot]`, which keeps its height (CLS 0). `+15` calls `engine.addTime(PIP_ADD_MS)` and is shown only for a live finite plan; Stop is shown only for a live session. Inside the window `P` closes it and `Esc`/`Space` stop the session. `pagehide` moves the nodes back and sets `ui.pip = 'closed'`; closing never stops the session. A second `P` from the page closes the window. If `requestWindow()` throws (e.g. no user activation) the popup fallback is used. `pip_open` is tracked for both kinds.
- *Lock*: v1 does **not** request a sentinel from the PiP document. The pill reflects the main tab's lock, which reads `lost` when that tab is hidden — honest, but less useful than the design above. Known gap until the device matrix confirms per-browser PiP sentinel behaviour.
- *`pip.pro`* (M6 follow-ups): with the licence feature, the window opens at `PIP_PRO_SIZE` (280 × 160), and `mirrorAmbient()` clones the page's ambient digits above the pill. That is the clock in `clock`/`night`, or the phase label and interval countdown while a focus block runs. It uses a `MutationObserver`, so the maths stays in the mode modules and nothing chimes twice. While those digits show, `body[data-ambient]` hides the session timer. The honest pill is always there. Other modes, focus before a block starts, and free users get pill + timer + two buttons.
- *Popup fallback* (`/pip`, `tool/pip-mirror.ts`): a chrome-less page (`BaseLayout bare`) with no engine and no wake lock. It posts `hello`, keeps the latest `state` snapshot per tab, and mirrors the newest live session (`pickOwner`), computing the timer locally each second from `endsAt`/`pausedMs`/`pausedAt` so a throttled owner never freezes it. The pill shows the owner's real lock state; after `MIRROR_STALE_MS` (4 s) without a snapshot it falls back to "Ready" plus a link to open AwakeTab. Stop and `+15` post `intent { target: ownerTabId, action: 'stop' | 'add', ms }` (`04-engine-spec.md` §14); `P` closes the popup and `Esc`/`Space` send Stop. The module is self-contained (only types cross from `@awaketab/core`) so it cannot pull a shared chunk onto the island's critical path. *M6 follow-ups:* the popup opens in the opener's language. `pipPath(<html lang>)` picks `/pip` (en) or `/{lang}/pip` for the seven locale folders through an allow-list; any other value opens `/pip`. Each route is built from `PipPage.astro`, which renders the static text at build time and embeds only the runtime strings the mirror needs (`tool.pill.*`, `tool.timer.indefiniteIdle`). Every `/pip` route is `noindex` (meta + `X-Robots-Tag`), `Disallow`ed in `robots.txt`, absent from every sitemap, carries no cards or ads, and is precached by the service worker.
- Blocked popup → toast `tool.toast.pipBlocked`.

---

## 10. URL parameters and deep links

Parsed once in `main.ts` from `location`, applied in this order, then removed with `history.replaceState` to the canonical path (so copied links stay clean and `ref` never leaks into analytics paths) — the canonical path is the current pathname without its query and trailing slash, locale prefix kept (`/es/for/cocinar`, never `/for/cocinar`; `parseToolParams().canonicalPath`, fixed at M9 — it used to drop the prefix, so a reload of a locale page landed on English or a 404). A locale home keeps its slash, `/es/`: that is its served and canonical URL (`14-devops.md` §2.1):

| Param | Effect | Validation |
|---|---|---|
| `theme=` | Sets `data-theme` for this page view only (not persisted) | one of `auto|light|dark|oled` |
| `mode=` | Sets `ui.mode` (gated modes fall back per §3.15) | one of the seven modes |
| `preset=` | Selects the pressed chip | one of the preset IDs except `custom`/`until` |
| `until=HH-MM` | Selects an `until` plan for that local time | `^([01]\d|2[0-3])-[0-5]\d$` |
| `msg=` | Message-mode text (§3.15) | ≤ 80 code points after sanitising |
| `autostart=1` | Requests the lock immediately when `document.visibilityState === 'visible'`; if `unsupported`, shows `FallbackConsent` with the button labelled "Tap to start" (video needs a gesture) | exactly `1` |
| `ref=` | Copied into the `source` field of the first `page_view`/`session_start`; never stored | ≤ 32 chars `[a-z0-9_-]` |
| `source=` | PWA/shortcut origin, same handling as `ref` | as `ref=` (accepted — `00-conventions.md` §13.2) |

Routes: `/15m` → `p15`, `/30m` → `p30`, `/45m` → `p45`, `/1h` → `p60`, `/2h` → `p120`, `/4h` → `p240`, `/8h` → `custom` 480 min (there is no `p480`; the chip row shows "Custom…" pressed with "8 h" in the summary). `/until/HH-MM` → `until` plan. Content pages pass their scenario via `data-preset`/`data-mode` on `#awaketab-tool` (`06-content-seo-spec.md`), which the island reads with the same precedence as URL params (URL wins). Invalid values are ignored silently and logged as `client_error {code: 'bad_param'}` at the sampled rate.

---

## 11. Theme handling

- `<html data-theme="light|dark|oled">`; `auto` is resolved at boot by an inline script in `<head>` that reads `at.v1.settings.theme` and `prefers-color-scheme` before first paint (no flash), and by a `matchMedia` listener afterwards. **As built:** `apps/web/src/boot/boot.js`, inlined by `BaseLayout` and `/embed/cook` with `set:html` (the file is the single source; `public/theme-boot.js` is gone) and allowed by a CSP `sha256-` hash that `scripts/headers.mjs` computes from the same file (`BOOT_HASH`; never `'unsafe-inline'`; `test/seo/security.test.ts` hashes the built pages' inline scripts against `_headers`). The same script starts the tool island: `scripts/defer-main.mjs` (post-build) moves the entry `<script type="module">` onto `#awaketab-tool[data-main]`, and `boot.js` imports it on the first-contentful-paint entry (PerformanceObserver `paint`), capped at 150 ms after `DOMContentLoaded` so the wake lock is still requested within 300 ms (asserted in e2e journey 1). `#awaketab-tool[data-booted]` marks the island interactive.
- `color-scheme: light` or `dark` is set on `:root` per theme (`oled` → `dark`) so form controls and scrollbars match.
- Three `<meta name="theme-color">` tags: `media="(prefers-color-scheme: light)"` `#FAF7F2`, `media="(prefers-color-scheme: dark)"` `#14161C`, and one without `media` that JS rewrites to the active ground (`#000000` for `oled`).
- `D` cycles and persists `settings.theme`; `theme=` param overrides for the view only.
- `night` ambient mode forces the `oled` palette while active and restores the previous theme on exit.

---

## 12. Error and empty states

| Situation | UI |
|---|---|
| `localStorage` unavailable (private mode, quota) | In-memory store; one info toast "Settings won't be saved in private browsing." |
| Notification permission denied | Settings row shows "Blocked in browser settings" with a link to the OS/browser steps |
| Fullscreen rejected | Toast per §3.13 |
| PiP unsupported | Falls back to `/pip` popup; if blocked, toast |
| Offline | Tool works; content sections show cached copy or a one-line notice |
| JavaScript disabled | `<noscript>` inside the tool: "AwakeTab needs JavaScript to request a wake lock. Enable it, or see the manual steps for your device." + links to `/guides/*` |
| Licence token invalid/expired | Pro features degrade to free instantly; toast "Your Pro licence needs re-validation — connect to the internet" (`/pro/activate`) |
| Stats empty | §3.17 copy |
| `/404` | Renders the tool with h1 "That page isn't here — but the tool is." |
| Second tab | §3.21 banner |

---

## 13. Performance rules for the island

- **Zero hydration.** shadcn/ui components (§1.5) are rendered by Astro at build time — `<Card>`, `<Table>`, … in `.astro` with no `client:*` directive, or their cva class helpers applied to plain HTML in frontmatter. No `client:*` directive exists anywhere in `apps/web`; React never ships to the browser. Interactive shadcn primitives that need client JS (Dialog, Sheet, Tabs, Accordion, Tooltip, Select, DropdownMenu, …) are not used — the island keeps native `<dialog>`, `<details>` and vanilla TS (`03-architecture.md` ADR-002, ADR-013).
- **The size gate enforces it.** `pnpm size` (`apps/web/scripts/size.mjs`) fails the build if any built HTML contains `<astro-island` or any `dist/_astro/*.js` matches a React runtime chunk name (`react.*`, `jsx-runtime.*`, `client.*`); the report's `hydrated` and `reactChunks` fields must both be `[]`. `scripts/prune-unreferenced.mjs` removes the client renderer that `@astrojs/react` emits regardless, so the gate is meaningful rather than trivially failing (`14-devops.md` §6).
- No framework in the island; TypeScript compiled by Vite to one `main` chunk containing boot, store, `Ring`, `StatusPill`, `PresetChips`, `Timer`, `Toast`, `ResumeBanner`, URL parsing and the `@awaketab/wake` engine — this is the critical path and must stay ≤ 15 KB gz. Everything else — `ambient/*` (shell plus one chunk per mode), `stats/*`, `pip.ts`, `end.ts`, `SettingsSheet`, `ShareSheet`, `CustomDurationDialog`, `UntilTimePicker` (`ui/actions.ts`), `CapabilityNotice` step texts, `RatingPrompt`, `sponsor.ts`, `pwa.ts` — loads by `import()` on first use or after boot, receiving one `IToolCtx` (`tool/ctx.ts`). Total tool-page JS ≤ 40 KB gz.
- **Strings are data, not code.** Each tool page embeds its full locale catalog as `<script type="application/json" data-i18n-catalog>` and `setCatalog()` reads it at boot; the former `src/i18n/critical.json` subset bundled into the critical chunk is removed.
- **The critical path is the static-import closure.** `scripts/size.mjs` counts each entry script plus every chunk it imports statically (shared chunks Rollup splits out load before the entry runs); `import()` targets are excluded. Before M6 only `<script src>` files were counted, which let split-out shared chunks escape the 15 KB budget. Measured at M6 close: `criticalJs` 14,415 B gz, `totalJs` 39,777 B gz, `totalCss` 12,303 B gz, `hydrated: []`, `reactChunks: []`. Total JS is within ~1.2 KB of the 40 KB budget, so the next lazy feature needs a size plan.
- Critical CSS (tokens, layout of the first viewport, pill/ring/chips) is inlined in `<head>` ≤ 8 KB; the rest is one `<link rel="stylesheet">` with `media="print" onload="this.media='all'"`.
- The ring SVG, pill and chips are server-rendered; the island only attaches behaviour. LCP = the ring (inline SVG, no image request).
- Wake lock time-to-request ≤ 300 ms after `DOMContentLoaded` when `autostart`/resume conditions are met: the engine request is the first statement after store hydration.
- Zero third-party requests on tool pages; zero layout shift: every slot (banner, stop button, card, toast region) has a reserved height; fonts are system so no swap.
- `content-visibility: auto` on every below-fold section with `contain-intrinsic-size`.
- Ticks update text via `textContent` and the ring via one `style.strokeDashoffset` write; no per-second layout reads.
- `<script type="module" src="/_astro/main.[hash].js">`; `vite.build.modulePreload: false` so Vite adds no dependency map or modulepreload links for lazy chunks (its ~0.7 KB gz `preload-helper` chunk is still imported by the entry and counted in `criticalJs`); no inline `import()` before interaction.
- Lighthouse mobile: Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100; CI budgets in `13-testing-strategy.md`/`14-devops.md`.

---

## 14. Acceptance criteria (selection; full set in `13-testing-strategy.md`)

- **FR-UI-01** Given the wake lock request rejects, when the promise settles, then the pill reads "Blocked — here's the fix" within one frame and no timer is running.
- **FR-UI-02** Given a `p60` session is `held`, when the user presses `2`, then the plan switches to `p30`, the lock is still `held`, and a toast reads "Switched to 30 minutes".
- **FR-UI-03** Given `prefers-reduced-motion: reduce`, when a session starts, then no element animates for longer than 1 ms and the pixel shift still applies every 60 s in ambient modes.
- **FR-PWA-01** Given an active session, when a new service worker is waiting, then no toast appears until the session is `inactive`.
- **FR-PIP-01** Given Chromium with Document PiP, when `P` is pressed, then the pill and timer move into a 280 × 120 window and the main page shows an empty slot of identical size (CLS 0).
- **NFR-A11Y-01** All pairs in §1.1 meet 4.5:1 for text.

---

## 15. PROPOSED identifiers (add to 00-conventions.md)

All rows below are resolved: accepted in `00-conventions.md` §13.1–§13.3 (v1.1), §13.7 (v1.2) and §13.8 (v1.3, M6).

| Identifier | Where used | Proposal |
|---|---|---|
| `--at-*` CSS token namespace | §1 | Add to §2 identifier schemes |
| `--at-accent-text` `#8A5200` (light) | §1.1 | Derived token for AA-compliant amber text |
| `TAdviceCode` set: `battery_saver` `low_power_ios` `hidden_document` `permissions_policy` `insecure_context` `unsupported_browser` `ios_safari_old` `firefox_old` `iframe_no_allow` | §3.10 | Engine emits; UI maps to `tool.advice.*` |
| `Settings.lastCustomMs`, `Settings.ambient.message` | §3.4, §3.15 | Fields for 08-data-storage.md |
| `Session.modeState` (e.g. `cookTimers[]`) | §3.16 | Field for 08-data-storage.md |
| `POST /api/rating` | §3.22 | `{ stars, text, locale, ver }` → KV; feeds build-time ratings export |
| `source=` query param | §8.1, §10 | For `start_url` and shortcuts; same handling as `ref=` |
| `keyboardShortcuts` setting (or rename `keyboardHints`) | §7 | WCAG 2.1.4 requires a way to disable single-key shortcuts |
| `client_error` codes `state_mismatch`, `bad_param` | §6, §10 | Values for the existing event |
| `apps/web/src/components/ui/*.tsx` (shadcn/ui primitives, build time only) | §1.5, §3, §13 | Accepted in 00-conventions.md §13.7 |
| `@/*` path alias → `./src/*` | §1.5 | Accepted in 00-conventions.md §13.7 |
| shadcn semantic variables as `--at-*` aliases; custom `--success`, `--warning`, `--night` | §1.5 | Accepted in 00-conventions.md §13.7; no new hex values |
| `hydrated: []`, `reactChunks: []` in the `size.mjs` report | §13 | Accepted in 00-conventions.md §11, §13.7 |
| Accent palettes `amber`/`indigo`/`teal`/`rose`, `data-accent`, `--at-t-ambient`, `--at-night-digit`, `--at-d-slow` | §1.1a, §1.2, §3.13 | Accepted in 00-conventions.md §13.8 |
| `IToolCtx`, `TDialogName` `'stats'`, ambient/end/rating/heatmap/PiP constants | §3.13–§3.22, §9 | Accepted in 00-conventions.md §13.8 |
| `src/sw.ts` + `scripts/sw.mjs`, `modulePreload: false`, embedded `data-i18n-catalog`, static-closure `criticalJs` | §8.2, §13 | Accepted in 00-conventions.md §13.8; ADR-014 |
