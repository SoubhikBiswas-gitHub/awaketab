# Product

## Register

product

## Users

People who need a screen to stay on and cannot or will not change system settings (personas in `docs/02-prd.md` §2):

- **Priya**, analyst on a locked-down Windows laptop (Edge, 5-minute group-policy lock, no admin rights), reading reports and watching a dashboard.
- **Marco**, home cook with an iPad propped on the counter, floury hands, recipe open; needs big timers and no touching.
- **Lena**, lecturer with a MacBook on a projector who needs the screen on until a clock time (11:30), often in another window.
- **Tomás**, ops lead running wall dashboards and kiosks nobody touches; needs them on all day, with his own logo.
- **Kenji**, developer running long builds and agents overnight in a tab; distrusts tools that claim more than they do.

They arrive with one job, often from search, often on a phone or a secondary screen, and want it done in one tap. Many glance at the screen from across a room.

## Product Purpose

AwakeTab is the browser tab that keeps your screen awake and tells you, honestly, whether it is working. It uses the Screen Wake Lock API (video fallback where needed), ends sessions at a duration or clock time, survives reloads, works installed and offline in 8 languages, and never shows ads on the awake screen.

Success: the screen stays on, the status pill is always true, and the page is useful from across the room.

## Brand Personality

Calm, honest, precise. A good instrument, not an app begging for attention.

- **Calm:** nothing shouts, nothing blinks without reason; the awake state feels restful, not alarming.
- **Honest:** status is unmistakable and never overstated; limits are said plainly (hidden tab, lid closed, Low Power Mode).
- **Precise:** big, exact numerals; clean alignment; every control has one clear job.

Emotional goal: relief and trust. "It's handled, and I can see that it's handled."

## Anti-references

- **nosleep.page and clones:** a bare toggle that claims "awake" from the button click, hides presets on phones, gives no end time.
- **Ad-farm timer sites:** clutter, pop-ups, fake download buttons, layout shift, ads next to the control.
- **Generic SaaS landing:** gradient hero, hero-metric tiles, identical icon-card grids, glassmorphism, marketing adjectives.
- **Mouse-jiggler / "stay green on Teams" tools:** the promise AwakeTab refuses to make.

## Design Principles

1. **The pill never lies.** Status is the product. It is the most legible, most trustworthy element on screen and only reflects real engine state.
2. **Readable from across the room.** Numerals, ring and status are sized and contrasted for a glance at a distance, not for a mouse at arm's length.
3. **One tap to done.** The common path (open page, screen stays on) needs zero or one action; everything else is secondary and quiet.
4. **Quiet by default, clear when it matters.** Restraint everywhere except state changes and problems, which are explicit and actionable.
5. **Honest limits, plainly said.** Explain what the browser can and cannot do in the user's language, right where it matters.

## Accessibility & Inclusion

WCAG 2.2 AA is a release gate: 4.5:1 text, 3:1 UI, 44×44 px targets (64 px in cook mode), visible focus, keyboard-operable with single-key shortcuts that can be turned off, `prefers-reduced-motion` honoured (burn-in pixel shift still applies, instantly), no colour-only state (glyph + text on the pill, dashed strokes on the ring), forced-colours support, 400 % zoom and 320 px width without loss. Eight languages including CJK and Devanagari; layout is RTL-ready (logical properties only).
