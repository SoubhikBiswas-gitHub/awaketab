# AwakeTab UI inventory (facts from the repo; do not invent beyond this)

## Routes
- Tool: `/` (tool + long-form sections below: What AwakeTab does, How it works, Honest limits, Browser and device support, Pick the guide for what you are doing, Your device specifically, When something else is the better tool, Or fix the setting itself, Questions we are asked most, The rest of AwakeTab, Who tested this). Presets /15m /30m /45m /1h /2h /4h /8h. /until/HH-MM.
- Hubs /for /on /vs /guides /learn. Articles /for/[slug] (18: ai-agents, baby-monitor, cooking, dashboards, downloads, exams-proctoring, kiosk, live-streams, navigation, night-clock, presentations, reading, second-monitor, sheet-music, teleprompter, video-calls, work-laptop, workouts; redesign OD-3 keeps 14: drops exams-proctoring, second-monitor, baby-monitor, live-streams, navigation and adds classroom), /on (12 devices/browsers), /vs (7 competitors), guides (8), learn (6).
- /pro, /pro/activate, /pro/manage, /embed, /embed/cook, /kiosk, /library, /extension, /about, /privacy, /terms, /changelog, /pip, /404 ("That page isn't here — but the tool is.").
- Locales en, es, pt-br, de, fr, ja, zh, hi. Unreviewed: badge "Translated from English — native review pending." + "Read the English original".

## Use-case page /for/cooking (order)
Header wordmark → breadcrumb AwakeTab › Keep your screen awake for a task › H1 → H1 "Keep your screen on while cooking" + badge "Last verified: {date}" → honest-limit note "Works while the AwakeTab tab is on screen…" → embedded tool in a card (cook mode, ∞ preset, no autostart) → H2s: What you are actually asking / How the lock works on this page / Practical setup / Operating-system notes / What success looks like / Related paths / A short checklist before you walk away / Why the pill is the product / Battery, heat and overnight use → "Questions" FAQ (details, 3 items) → links row "Start this session", hub, related → author card "Soubhik Biswas · Builds and tests AwakeTab · About AwakeTab".

## /pro
H1 "AwakeTab Pro". Lead: "Pro is optional. The awake screen stays honest and ad-free either way. Polar handles checkout; AwakeTab never stores a password." Two plans: "$12 / year" and "$19 once" with struck "$29" (launch price until 8 December 2026, then $29 once). Both "5 devices", button "Get Pro". "Charged in USD; taxes added at checkout where applicable." "Enter licence key" → /pro/activate. "14-day refund, no questions asked". No monthly plan.
Pro features (from code gates, write in plain words): extra lamp colour packs, Message ambient mode, your own logo in ambient/kiosk, weekly schedules, custom end sounds, 12 weeks of stats history, stats CSV export, taller floating window, extension auto-start and schedules, no ads on guide pages.
/pro/activate: "Activate Pro", key field, "Activate on this device". /pro/manage: table Device / Activated / Remove; empty "No licence on this device yet. Activate a key first."
Business: Embed $29/yr per site; Kiosk $19 one site, $49 five sites.

## Tool island
Header icons: Pro badge (when active), Install (when available), Stats, Share, Floating window, Theme, Keyboard shortcuts, Settings.
Presets: 15 min, 30 min, 45 min, 1 h, 2 h, 4 h, ∞ (no limit), Custom…, Until…
Banners: second tab ("Use this tab instead" / "Keep the other one"), resume ("You had {time} left" Resume / Start fresh), denial notice (Retry / Use fallback / Why this happens and how to fix it).
Custom: days/hours/minutes (max 7 days). Until: time. Share: URL + Copy.
Settings: Theme (Auto / Light / Dark / OLED black) · Accent (lamp colour) · Default duration · End sound (Chime / None) · Notify me when time is up · When time is up (Ask to extend / Just stop) · Stop automatically on low battery (5–30% slider) · Ambient default mode · Message text (80 chars, Pro) · Show clock seconds · Clock format (Follow language / 24-hour / 12-hour) · Share anonymous usage data · Single-key shortcuts · Show keyboard hints on buttons · links Pro, Manage devices, See what's in Pro · Close settings · Reset to defaults.
Stats: Today / This week / Streak / All time; 12-week day heatmap (5 levels); free sees 7 days, older weeks "Locked · Pro keeps 12 weeks"; Export CSV (Pro); empty "No sessions yet…".
Ambient modes (full-screen, bar: Next mode / Fullscreen / Exit): Standard; Clock (time, small seconds, date line, 96 px ring); Focus (Pomodoro 25/5 × 4, long break 15; "Cycle n of 4", Break, Long break, "Start a focus block", "{n} focus blocks today"); Minimal; Night (OLED, red digits, dims after 30 s); Message (Pro, 60 s free preview); Cook (elapsed, "Tap anywhere to pause", up to 3 named kitchen timers, quick 5/10/15/30/60 min + custom, 1 min to 12 h; targets 64 px).
End of session: extend prompt "Time's up. Keep going?" +15 min / +30 min / +1 h / Stop, "Stops in {s} s"; chime; tab title "Done — AwakeTab".
Rating prompt after 5th session: "Is AwakeTab doing its job?" 1–5 stars, optional text 280 chars, Send / Maybe later / Don't ask again.
PiP: 280×120 (Pro 280×160) with +15 and Stop.
Shortcuts: Space start/stop · 1–6 presets · 0 until I stop · U until a time · F fullscreen · D theme · M ambient mode · P floating window · Esc close · ? overlay.

## Extension (Chrome MV3)
Uses Chrome power API: level Screen (display on) or System (computer awake, screen may dim). Works with the tab hidden. Popup: wordmark + gear; ring + timer + caption (Elapsed / Until …); pill incl. "System awake", "Screen may dim or lock"; advice line; extend row +15 / +30 / +1 h / Stop; Start/Stop; segmented "Keep awake": Screen | System with help text; chips 15 min–4 h, ∞, Until… (inline time form); footer "Open AwakeTab" + limits sentence. Options: Defaults (level, default duration) · When time is up (notifications, sound) · Look and language · Keyboard (shortcuts, "Change shortcut") · Schedules (Pro: days, From/To, level, Add schedule) · Auto-start (Pro: "Keep awake whenever Chrome starts", Sites host + duration, Add site) · Pro licence (Activate / Remove / Manage devices) · Privacy (telemetry) · About (version, What's new). Badge: blank unless held; ON or SYS for open-ended; minutes left "25m" / "3h". Shortcut Alt+Shift+A. No ads.

## Embed / library / kiosk
Embed: script tag injects iframe /embed/cook. Sizes Compact 320×96, Full width 240 tall (redesign O-58: compact becomes 320×104). Modes cook, standard, clock, minimal. Widget: "Keep screen awake", Start, kitchen timers, attribution "Keep awake by AwakeTab" (removed with Embed licence); redesign O-47 moves it outside the iframe as a visible nofollow link in the host page, see docs/11 "Redesign changes"). /embed page: Try it · Install: one line · snippet builder · Why the allow attribute matters · JavaScript API · Free vs licence · Questions.
Library /library: "@awaketab/wake: the honest wake lock library"; live state machine demo (Scenario select, Request / Release / Simulate tab hidden / Simulate tab visible, Transition log, Advice code).
Kiosk: URL builder (mode, message, logo, token, autostart).

## Ads (contract)
Google ads only on /for/*, /on/*, /vs/*, /guides/*, /learn/*: rail 160×600 (320×50 small screens) and inline 336×280 (300×250 small). Never on /, presets, /until, /pip, /embed, /pro*, extension. ≤3 in view, ≤20% ads, fixed sizes, after LCP. Label ads "Advertisement". Sponsor card 300×100 "Sponsored" only on the awake screen in Ready/held and in the extend prompt; hidden in Night and Minimal.

## Pill strings (contract, exact)
Ready · Starting… · Screen awake · Paused — tab hidden · Blocked — here's the fix · Tap to use the fallback · Awake via video fallback. Extension adds: System awake · Screen may dim or lock.
