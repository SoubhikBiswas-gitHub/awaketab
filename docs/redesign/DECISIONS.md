# Redesign decisions log

Every design and product decision taken during the Clear Night redesign, newest last. **Open** items wait for the owner (Soubhik). Agents: read this before designing or writing anything, and never contradict a **Decided** item without a new entry here. The canvas links are in `CANVASES.md`. Files named in the Where column under `research/`, `design/canvas/` or the agent briefs are no longer in this repository: research and briefs live in the private repo SoubhikBiswas-gitHub/awaketab-internal, and the canvas sources are in git history (`CANVASES.md` says how to restore them).

## Decided
| # | Date | Decision | Why | Where |
|---|---|---|---|---|
| D-R01 | 26 Sep 2026 | Stay on Astro (no Next.js); zero hydration stays | The design is achievable in CSS; the JS budget has about 1 KB of headroom | docs/03 ADR-013 |
| D-R02 | 26 Sep 2026 | Direction **Version D**: B's pill tabs, A's Ring clock, C's Bold clock and phone layout, plus a living Horizon face | Owner picked the pieces from A, B and C | canvas, DESIGN.md |
| D-R03 | 26 Sep 2026 | Palette **"Clear Night"**: night ink ground, aqua lamp = awake, amber = paused, red = blocked | Owner rejected amber/beige. Blue-amber is colour-blind safe and far from Teams green | DESIGN.md §2 |
| D-R04 | 26 Sep 2026 | Logo: ring with a gap and a lit bead; the bead shows the current state colour | Brand mark doubles as a status light | DESIGN.md §2.3 |
| D-R05 | 26 Sep 2026 | Four switchable clock faces: Ring, Bold, Horizon, **Tide** (new) | Engagement on long-running screens (owner) | DESIGN.md §7 |
| D-R06 | 26 Sep 2026 | Phone dock: length block → 20 px gap → +15 min · Stop at the very bottom | Owner comment on the canvas | DESIGN.md §5 |
| D-R07 | 26 Sep 2026 | Times in 12-hour AM/PM for en; full date line; "tomorrow" past midnight; end time shown before start | Owner request | DESIGN.md §4, ~/.claude/CLAUDE.md |
| D-R08 | 26 Sep 2026 | Theme Auto / Light / Dark (+ OLED in Settings); Auto follows the system live | Owner request | DESIGN.md §9 |
| D-R09 | 26 Sep 2026 | Slow, calm motion on the components that benefit; everything off under reduced motion; CSS only | Owner request, JS budget | DESIGN.md §8 |
| D-R10 | 26 Sep 2026 | Light-theme lamps are the darker shades (#087B87, #5A47CF, #167A50, #255FBD) | #0A8F9B with white text is 3.9:1 and fails AA | DESIGN.md §2.2 |
| D-R11 | 26 Sep 2026 | Strict system spec: spacing, 1 px borders, radii, control heights, type scale | Owner: "same border pattern, spacing, sizing" | DESIGN.md §11 |
| D-R12 | 26 Sep 2026 | Never claim battery saver / Energy saver / Low Power Mode "blocks" the wake lock | Chromium and WebKit source show no such check | research/fact-check-2026-09-26.md |
| D-R13 | 26 Sep 2026 | Never show "was $29" or a strike-through on a price nobody paid; use a dated launch price | Honesty; US 16 CFR 233.1 fictitious former price | research/growth-conversion.md |
| D-R14 | 26 Sep 2026 | Phones must not hide presets | PRODUCT.md anti-reference | agent-brief.md |
| D-R15 | 26 Sep 2026 | Upgrade prompts never appear on the awake screen during a session or in the "Time's up" countdown | Honesty principle | research/growth-conversion.md |
| D-R16 | 26 Sep 2026 | Everything is documented in the repo (docs/redesign, docs/research) so every agent has context | Owner request | this file |
| D-R17 | 27 Sep 2026 | DESIGN.md contradictions removed per the design critique: digits in system-ui 200–300 with no slashed zero, Bold 600, §5 defers to §11, pill sizes L/M/S/XS, radius 4 added (never 14/18/22/24), segmented bar 54, tag and list-row specs, mono only for digits/code/keys/URLs, new tokens raised/sunken/horizon-ink/halo/night, footer spec, notices never cover the CTA | Critique measured 18 H1 sizes, 3 headers, 5 radii; drift came from the spec | DESIGN.md §2, §3, §5, §6, §11 |
| D-R18 | 27 Sep 2026 | No duplicate screens. In the product every template exists once. On the canvas the final audit removes every board that shows the same page, state, size and theme as another (37 wrappers currently repeat their ▶ play-me board); the play-me board has the live theme switch, and one wrapper keeps the opposite theme for side-by-side review | Owner: no duplicate screens | canvas, final audit |
| D-R19 | 27 Sep 2026 | Keyboard hints use one theme keycap style everywhere (never inherit the button colour); only on hover-capable devices | Owner: the Space hint looked inverted between dark and light | DESIGN.md §11.4 |
| D-R20 | 27 Sep 2026 | Stop and every strong neutral button (Retry, Stop for today, Send, Install, Exit, Activate) use `raised` fill + 1 px `line-strong` + `ink` text, so they follow the theme instead of an inverted ink slab (white on dark, near-black on light). The lamp CTA stays the one primary | Owner canvas comment 84d59664: "why stop are not following theme, please check in all place" (same principle as D-R19) | DESIGN.md §6, §11.7; PRIMITIVES.md P-CTA |
| D-R21 | 27 Sep 2026 | Canvas layout packs sections into 6 columns (extent about 38k × 28k px instead of one 130k px stack); every board is verified with the canvas's real runtime (tools/final/rtscan.sh, runtime-check.mjs), not only the static renderer | Owner saw empty boards: far-off boards on a very tall canvas, and static-renderer-only checks | design/canvas/layout.py |
| D-R22 | 27 Sep 2026 | Every screen is responsive at every width. The canvas is the reference at the key sizes; the code is fluid in between (flex/grid, max-width, gutter steps, no fixed page widths). An e2e sweep of every route at every 40 px step from 320 to 2560, plus phone landscape and 400 % zoom, fails on horizontal scroll, controls within 16 px of an edge, targets under 44 px or clipped text, and blocks the release. Tool boards at the 600 and 1024 px breakpoint edges are added to the canvas. | Owner question "every screen should be responsive"; DESIGN.md §5 |
| D-R23 | 27 Sep 2026 | One scalable token system (DESIGN.md §12): primitives → semantic tokens → components, names instead of raw numbers. Four breakpoints (600 / 1024 / 1600, mobile first; container queries for embedded components). Type has two steps (phone, ≥ 600), matching every board. Existing `--at-*` names stay; `--at-r-sm` 8, `--at-r-md` 12 and `--at-t-xl` 20 change value. Gates: `rtaudit.sh` (real-runtime §11 audit, 0 violations on all boards) and `rtscan.sh` on the canvas; stylelint (no raw spacing, radius or type values outside tokens.css) and the responsive sweep in code. | Owner request for a consistent, fully responsive design system |
| D-R24 | 27 Sep 2026 | The canvas is split into 30 pages of at most 16 boards, grouped in 12 areas (Tool · Tool states · Ambient & floating window · Content & guides · Site pages · Pro & checkout · Chrome extension · Embed, kiosk & library · Growth moments · Languages & accessibility · Brand & share images · Components), each page roughly screen-shaped. The canvas app loads a board only once it is in view and big enough on screen (otherwise a blank frame with a faint "Click to load"), so big pages looked empty when zoomed out. With 310 boards on one page the canvas parked far-off boards behind blank "Tap to load" faces, so rows looked empty. `layout.py` assigns sections to pages (MAX_PER_PAGE). A coverage check also added 47 boards (ambient modes, tool overlays, growth moments and edge states at every size): 357 boards. | Owner: "canvas are empty, only headings"; "build separate pages" |
| D-R25 | 27 Sep 2026 | The design moves to 12 separate canvases, one per product area (docs/redesign/CANVASES.md); each holds its boards plus the component files they mount. The single canvas (357 boards, 30 pages) still did not load for the owner. `design/canvas/split.py` rebuilds the bundles. The old canvas is to be deleted by the owner. | Owner: "create multiple canvases" |
| D-R26 | 27 Sep 2026 | Dedicated fonts (Geist, Geist Mono, Space Grotesk digits), self-hosted, metric-matched fallback, CLS 0 | Owner request |
| D-R27 | 27 Sep 2026 | Floating window button: an icon in the tool header from 600, between Keyboard shortcuts and Stats (the canvas draws no button for it; `P` works everywhere). Phones get "Share this session" and "Keyboard shortcuts" as links in the Settings footer, next to "Your stats" | The old action row under the tool is gone and no feature may lose its entry point; the header is where Extras puts Share, Shortcuts and Install, and the Settings footer is where the canvas puts phone-only links. Phones have no floating window | docs/05 §3.33 |
| D-R28 | 27 Sep 2026 | The wake library drops the `battery_saver` and `low_power_ios` advice: a denial with no known cause has advice `null`, and the tool, embed and `/library` demo name no cause for it | Battery savers and Low Power Mode never refuse a wake lock (fact check 26 Sep 2026: Chromium and WebKit have no such check); on iOS a refusal is usually Safari wanting a tap | docs/04 §3, docs/12, docs/00 §13.22 |
| D-R29 | 27 Sep 2026 | The tool stylesheets join the strict token rule. Their off-scale sizes are named once as `--at-tl-*` at the top of `tool.css` / `tool-more.css`; the four clock faces (art and digits scaled by the face unit `--u`) sit in one marked exempt block, as pages.css does for its drawings | Owner rule: tokens only, one design system; the faces are drawn art (DESIGN.md §3, §11.2) | stylelint.config.mjs, docs/00 §13.22 |
| D-R30 | 27 Sep 2026 | A refused auto-start (no tap yet) keeps the Ready layout: the pill says "Blocked — here's the fix", the face says "One tap needed · tap the button below" and the lamp button is the fix; the blocked card with the causes shows after a refused tap. On the auto-start routes the pill and note stay invisible until the start's outcome is known (at most 2 s), so first paint never shifts. **Replaced 28 Sep 2026:** a start the page made on load that the browser refuses leaves the calm Ready state exactly as painted (pill "Ready", face "Keeps awake for", the lamp button), and its request shows nothing either; only a grant changes the screen. Blocked is for a refused tap. The markup and the boot script paint the settled Ready state on the first frame; only the pill waits (its box kept) until the browser answers, then shows that answer once | Decision O-70 (Safari/iOS show the tap button) and the CLS 0 budget: swapping in the card or re-centring the pill on first load moved the layout. The owner saw "One tap needed" and a red Blocked pill on every first visit before doing anything, and the pill and lamp button fading in: a refusal nobody asked for is not news, and the first frame must be the settled one | docs/05 §3.33 |
| D-R31 | 27 Sep 2026 | Stylesheets split by where they are needed: `base.css` on every page (BaseLayout), `tool.css` wherever the tool renders (ToolIsland, including the article card), `tool-full.css` only on the full tool pages, `tool-more.css` on demand | Content, site and Pro pages stop carrying the four faces and the full tool layout, so the article pages stay inside the 20 KB CSS budget | docs/05 §3.33 |
| D-R32 | 28 Sep 2026 | Colour themes are a layer over the same `--at-*` tokens (`html[data-palette]` × `data-theme`, light and dark each, OLED on black), with nine themes (Clear Night, Paper, Nord free; Solarized, Midnight, Forest, Sunset, Mono, High contrast Pro), twelve lamps plus a fitted custom lamp (Aqua, Violet, Amber, Teal free), nine backgrounds (None, Grain, Dots, Grid free) and eight presets (three free). The lamp rule relaxes from "blue–green–violet only" to "calm, never a saturated red" | Owner request for themes, colours and backgrounds; state stays text + glyph + ring pattern, so a warm lamp cannot read as paused, and red stays the blocked tone. Every combination is checked for AA with culori | DESIGN.md §2.2, §2.4; docs/05 §1.1a–§1.1c |
| D-R33 | 28 Sep 2026 | One Pro preview for every locked item: 5 minutes, unlimited, a chip with the countdown (foldable to a dot), a toast at 1 minute (Get Pro · End now), then a cross-fade back to the last free choice; nothing stored, reload ends it, the lock and timer untouched. While a session runs the chip and toasts carry no Pro link (D-R15, O-35/O-67). Night and Focus stay free (O-02), so only Message mode's shared link uses it among the modes | docs/02 FR-AMBIENT-01 (updated by the owner to 5 minutes); one helper keeps faces, sounds and themes consistent | docs/05 §1.1d, `packs/themes/preview.ts` |
| D-R34 | 28 Sep 2026 | Stars and Drift are CSS, not `@tsparticles/slim`; Contours is an own 0.7 KB SVG, not Hero Patterns' Topography | Measured: `@tsparticles/slim` 45 KB gz, `@tsparticles/basic` 27 KB, the engine alone 21 KB, against the themes pack's 25 KB budget; Hero's topography SVG is 39 KB gz. CSS gradients twinkle and drift with transform/opacity only, stop under reduced motion and paint on the first frame with no JS. Dots, Grid and Waves stay Hero Patterns (CC BY 4.0, credited on /about) | docs/05 §1.1c |
| D-R35 | 28 Sep 2026 | Sounds opens from a header icon (every width, between Floating window and Stats), from `S` and from Settings → End sound, not from a new dock button. The icon's bars move while sound plays (still under reduced motion) | D-R06 fixes the phone dock as length block → 20 px → actions; a sound button there would push the actions or add a row. The header already carries the tool's secondary entry points (D-R27) and has room for one more 44 px icon on phones | docs/05 §3.34 |
| D-R36 | 28 Sep 2026 | The notepad is Tiptap (StarterKit's extensions taken one by one, plus task lists and placeholder), and the `notes` pack budget rises from 70 KB to 120 KB gz. It opens as a modal end-side sheet (bottom drawer on phones) with a lighter scrim on desktop and a pill mirror in its first row; its dock button shows from 1024 px only, and phones and tablets reach it from Settings and `N`. Free keeps one editable note; notes added in a Pro preview stay readable and read only afterwards, never deleted | Measured with esbuild: Tiptap's core with ProseMirror is 86 KB gz on its own and the whole pack about 110 KB, so no ProseMirror editor fits 70 KB (bare ProseMirror is 67 KB before any UI); Lexical measured larger. StarterKit's link (linkifyjs), code block, rule and cursor extensions are dropped to save about 16 KB. The pack loads only on first open. A modal keeps focus, Esc and toasts working as in every other sheet; the desktop sheet leaves the face column in view. The tablet and phone docks are sized to the pixel (`--at-u-max` from 100dvh), so a new row there would shrink the face | docs/05 §3.34, docs/00 §13.26 |
| D-R37 | 28 Sep 2026 | The face tabs become a face switch (Previous · Clock face *name* · Next) that opens a gallery sheet of live miniatures in three groups (Classic, Retro, Modern); a sideways swipe on the clock (Embla) and `C` / `Shift+C` step through the same order. `C`, not the requested `F`: `F` has been fullscreen since launch, is in the shortcuts list, docs and tests, and is the key people use on a wall screen, so "C for clock face" keeps it | Twelve faces no longer fit a tab row, and a More popover hid two thirds of them; a gallery shows each face as it really looks in the current state and lamp before you pick it. Swipe is the natural gesture on a phone left on a stand | docs/05 §3.33, §5; DESIGN.md §7 |
| D-R38 | 28 Sep 2026 | The Bold, Horizon and Tide art moves out of the inlined CSS into `public/assets/faces.css` (hashed), linked render-blocking by `boot.js` only on tool pages whose saved face is one of them, and by the faces pack before it switches to one; Ring, the default, stays inlined | The inlined CSS was within 60 B of its 20 KB budget and the redesigned faces needed more art. The move frees about 1.8 KB gz for everyone; visitors who saved one of the three pay one small cached request, the same trade the colour themes made (D-R32) | docs/05 §3.33; docs/00 "Face gallery, swipe and the redesigned original faces" |
| D-R39 | 28 Sep 2026 | The version people see is "Version YYYY.MM.DD · 7-character commit", printed at build time in the footer and at the bottom of Settings (with "What's new" to /changelog, in a new tab so a session keeps running). A new version during a session gets one quiet note with no button ("Reload when you're done") and the Reload toast when the session ends; pages without the tool get a small bottom banner | Owner request; honesty principle (D-R15: nothing interrupts the awake screen) | docs/00 §13.28 |
| D-R40 | 28 Sep 2026 | The home page's "Make it yours" section draws every face as CSS or SVG art in the lamp colour, reusing the faces pack's own LED font and word grid at build time; no screenshots, no face fonts on the home page. Pro items are marked with a small dot and a legend, never a lock | Owner request (real renders, not images); budgets | docs/05 §3.31 |
| D-R41 | 28 Sep 2026 | The mixer and the lo-fi library use the shared five-minute preview (D-R33); the mix made in a preview stays in memory only | D-R33; FR-AMBIENT-01 | docs/05 §3.34 |


## Open questions (history; all decided below on 27 Sep 2026)
| # | Question | Options / recommendation | Raised by |
|---|---|---|---|
| O-01 | Lamp colours: replace Amber/Indigo/Teal/Rose with Aqua/Violet (free) + Mint/Sky (Pro)? | Recommended: yes. Needs docs/05 §1.1a, en.json and the `settings.accent` mapping updated | design, growth |
| O-02 | Which ambient modes are free? | Canon: Standard, Clock, Minimal free; Focus/Night/Cook as packs? The Pro canvas lists them as free | copy audit |
| O-03 | Are all four clock faces free? | Recommended: yes (faces drive engagement); packs could add more later | copy audit |
| O-04 | Remove the "Sponsored" card from the awake screen? | Recommended: remove. It contradicts "no ads on the awake screen" and earns about 120 clicks/month at 100k views. Contract change in docs/00 and docs/09 | growth |
| O-05 | Web schedules and custom end sounds are sold in Pro but not built on the web | Remove from Pro copy now, or build before production checkout | growth |
| O-06 | Refund window 14 days or 30? | Keep 14 for now; test later | growth |
| O-07 | Add privacy-safe visit-age and session-count ranges to telemetry? | Needs a privacy page update | growth |
| O-08 | Time's up grace: 30 s (canvas) or 60 s (docs/05)? | Recommended: 60 s per spec | tool agent |
| O-09 | Night mode: status bead warm grey (not lamp/red) so red digits never read as "blocked"? | Recommended: yes | ambient agent |
| O-10 | Ads on the /for hub page? | Contract allows /for/*; the agent left the hub clean | content agent |
| O-11 | "Until" a time that has already passed: offer tomorrow (canvas) or show an error (en.json)? | Recommended: offer tomorrow with one tap | copy audit |
| O-12 | Rating stars: radio group (docs/05) or aria-pressed buttons? | Recommended: radio group per spec | extras agent |
| O-13 | Approve new copy: legal plain summaries, changelog tags, hub group names, new state lines | Review on canvas | several |
| O-14 | Terms "Last updated 9 September 2026" line OK? | Confirm | pages agent |
| O-15 | Retire or fix the content generator (write-content.mjs) before rewriting the 51 articles | Recommended: retire; rewrite each page to its docs/06 §2 template | editorial audit |
| O-16 | Custom domain awaketab.com ownership (from the launch audit) | Still unanswered | launch audit |
| O-17 | Chrome Web Store screenshot set: canvas set (popup, schedule editor, badges, Screen vs System, Pro auto-start) or docs/10 §9 set (held popup, presets+until, schedules, web+extension, honest limits)? | Pick one; update store/listing.md | assets agent |
| O-18 | Embed in a sidebar under 300 px: widget asks the host for 24 px more height (new behaviour)? | Approve or keep fixed height | assets agent |
| O-19 | Favicon shape per state (pause bars, triangle, tick), tab titles "Paused · 24:18 left" / "Blocked · AwakeTab", manifest background_color #0A0E16? | Recommended: yes (state never by colour alone) | assets agent |
| O-20 | Return from a hidden tab: welcome-back toast after 2 s away (canvas) vs docs/05 §6 (no toast within 2 s, else "Re-acquiring the wake lock")? | Recommended: follow docs/05 wording, keep the 2 s rule | tool-sizes agent |
| O-21 | Low-battery auto-stop: inline amber card with "Start anyway" that overrides the battery setting for this session? | Approve behaviour, or keep the docs/05 toast | tool-sizes agent |
| O-22 | 320 px phones: presets 15m 30m 1h ∞ + More… (45m, 2h, 4h inside), face tabs moved to Settings. PRODUCT.md says do not hide presets on phones | Accept for 320 px only (390 px shows all) or wrap to two rows | tool-sizes agent |
| O-23 | New routes suggested by market research: /for/classroom (teachers are unserved), a Windows lid-closed guide, later a WordPress plugin for the embed | Routes need docs/00 §7 first; recommended: add /for/classroom | market research |
| O-24 | Position the extension as the maintained alternative to Google's Keep Awake (1M users, not updated since Aug 2023, ChromeOS/schools) | Recommended: yes, honestly and without naming claims we cannot back | market research |
| O-25 | Extension features designed but not in code: welcome page, first-open tips, "New in" chip, private-window note, Pro entry row in the popup | Approve to build | ext-edge agent |
| O-26 | After activation, show a "Pro is active" page with next steps (today it redirects to /); add our own return pages for cancelled and failed checkout | Recommended: yes | ext-edge agent |
| O-27 | Pro lapse and 7-day grace copy (all new); paid devices pick up renewal automatically | Approve copy | ext-edge agent |
| O-28 | Offline: when the service worker serves the tool in place of a content page, add one line explaining it | Recommended: yes | ext-edge agent |
| O-29 | Hold Embed sales until a sandbox purchase ends with a licensed domain (no post-checkout domain capture exists; brand colour not settable) | Recommended: hold | pricing agent |
| O-30 | Launch price must switch at runtime, not build time (today /pro keeps showing $19 after 8 Dec until a redeploy); cut-off timezone (UTC midnight = evening of 7 Dec in the Americas) | Recommended: runtime check + state the timezone | pricing agent |
| O-31 | Move the logo feature from Pro to Kiosk only (Pro lifetime $19 undercuts Kiosk $49 for 5 screens) | Recommended: yes | pricing agent |
| O-32 | Regional pricing via Polar multi-currency: INR about 40 % of USD, BRL about 50 % | Decide | pricing agent |
| O-33 | Publish a promise that lifetime Pro is unlocked for everyone if AwakeTab shuts down | Recommended: yes (trust) | pricing agent |
| O-34 | Kiosk "site" = one location with any number of screens | Confirm | pricing agent |
| O-35 | Message preview ends with a neutral line; the Pro offer shows when the user picks Message, never on the awake screen (corrects growth-conversion.md) | Recommended: yes (D-R15) | pricing agent |
| O-36 | **URGENT: awaketab.com is not registered** (whois: no match). Canonicals, OG images, store homepage and support@awaketab.com (refund address) depend on it | Register today (owner account step); replaces O-16 | positioning agent (M-01) |
| O-37 | Store title: drop "for Chrome" (Google branding rules; the listing also shows on Edge) | Recommended: yes | positioning agent (M-04) |
| O-38 | Lifetime Pro wording: licence re-checks every 90 days, so say "pay once, no renewal", never "forever", until O-33 is decided | Recommended: yes | positioning agent (M-05) |
| O-39 | @awaketab/wake is not on npm and the GitHub link 404s: publish it, or reword /library until then | Decide | positioning agent (M-07) |
| O-40 | New tagline "Keeps your screen awake. Says so only when it is." and one-liner; "honest" at most once per page, never in headlines | Recommended: adopt | positioning agent |
| O-41 | Unverified claims to remove now: Brave/Arc/Opera support on /extension; AMP limitation on /embed; disclose that the embed sends start/end counts including the host domain | Recommended: yes | positioning agent |
| O-42 | Remaining positioning decisions M-02, M-03, M-06, M-08 to M-13 (see marketing-positioning.md) | Review | positioning agent |
| O-43 | Telemetry is ON by default on the web but privacy copy says "only when enabled"/"opt-in": keep default-on and say so plainly, or switch to off by default | Decide; copy must match either way | content audit |
| O-44 | Embed staging: one staging subdomain (docs) or several (page copy)? | Confirm | content audit |
| O-45 | Launch with ~20 rewritten pages indexed; keep the other 51 articles live but noindex (draft/ready flag) until each is rewritten | Recommended: yes (avoid scaled-content pattern on a new domain) | SEO agent |
| O-46 | Replace "Last verified" with two stamps: "Sources checked {date}" and "Tested on {device}" (only for rows that actually pass) | Recommended: yes | SEO agent |
| O-47 | Embed credit: a visible branded nofollow link in the host page's own HTML (today the credit is inside a noindex iframe and earns nothing) | Recommended: yes | SEO agent |
| O-48 | New pages from real demand: live wake-lock test page, "screen wake lock is not allowed in this document" error page, laptop-lid guide, AI-agents page rewrite (routes need docs/00 §7) | Decide | SEO agent |
| O-49 | Remaining SEO decisions OD-01..OD-13 incl. merges/cuts and the Teams page title (question form) — see marketing-seo-content.md | Review | SEO agent |
| O-50 | Register awaketab.com + .app/.page/.dev, GitHub org, npm scope, Buy Me a Coffee (the /about donate link is 404) — all unclaimed; repo is public | URGENT owner steps (extends O-36) | GTM agent |
| O-51 | Launch dates: Show HN Tue 17 Nov 2026 19:30 IST, Product Hunt Tue 1 Dec 2026 13:31 IST; gate check 10 Nov (else 12 Jan 2027) | Decide | GTM agent |
| O-52 | Launch price end date: hold 8 Dec 2026 (market.md) or set once to 90 days after checkout goes live (GTM) | Decide before the first real sale | GTM vs market |
| O-53 | Extension store name "AwakeTab: Keep Screen Awake"; one honest review request after the 5th session, never mid-session, shown to everyone | Recommended: yes | GTM agent |
| O-54 | Budget about $67 cash for 90 days, no paid ads; Workers Paid $5/month from launch week; GST/LUT via accountant before the first real sale | Approve | GTM agent |
| O-55 | Remaining GTM decisions MG-01..MG-14 (see marketing-gtm-launch.md) | Review | GTM agent |
| O-56 | Input/select borders on line-strong are 1.72:1 (dark) / 1.61:1 (light), below the 3:1 non-text rule: add a darker input-border token | Recommended: yes (DESIGN.md §11.2) | audit B |
| O-57 | Light ground last gradient stop #E7EEF6 drops lamp text to 4.28:1: lighten the stop or keep lamp text on surfaces | Recommended: lighten to #EEF3F8 | audit B |
| O-58 | Compact embed 320×96 cannot fit 44 px targets: move to 320×104? | Decide | audit B |

| O-59 | All 8 locale files carry `tool.advice.battery_saver`, which says battery saver blocks the wake lock (contradicts D-R12). Remove the key and add translated per-cause lines (Safari needs one tap; Firefox low battery) plus the blocked-card title | Recommended: yes, before any locale ships. Intl boards omit the string | i18n agent |
| O-60 | Language suggestion banner (`i18n.suggest`) is written in the current page's language with the target's native name ("Dies auf English lesen?"), so the reader it targets may not understand it | Recommended: render the banner from the suggested locale's catalog with its `lang` attribute | i18n agent |
| O-61 | New UI strings on the redesign have no i18n keys: face names, ring kickers, blocked-card title, desktop nav labels, "Honest limit" label, and the CTA "Keep awake · {duration}" (needs one ICU key, not concatenation) | Add keys to en.json and all locales before build; Intl boards show them only in QA mode | i18n agent |
| O-62 | Status pill may wrap to two lines (fr `tool.pill.unsupported` is 44 characters; Hindi needs a taller line). docs/07 §4 says the pill stays on one line and scrolls | Recommended: allow two lines (min-height 38, radius 20, balanced wrap); update docs/07 §4 | i18n agent |
| O-63 | Phone with both the language suggestion and the translation note does not fit 844 px with all seven presets | Recommended: phones show one at a time (suggestion first, note after dismissal); desktop and tablet show both | i18n agent |
| O-64 | Screen reader cadence: canvas board announces every 5 min after start ("42 minutes left"); shipped timer.ts announces on multiples of 5 min left (45, 40 … 5) | Pick one; recommended: keep shipped behaviour | a11y agent |
| O-65 | Desktop focus order: Main renders the clock face tabs first in the DOM but shows them last in the right column | Recommended: reorder the desktop markup so focus follows the visual order | a11y agent |
| O-66 | At 200% text the ring digits are sized by the ring (container units), not by the text setting; they already exceed double body size | Confirm this reading of WCAG 1.4.4 | a11y agent |
| O-67 | Pro lamp preview during a session: FR-PRO-08 allows locked-feature previews but says "never during held"; D-R15 bans upgrade prompts on the awake screen | Recommended: the preview may run during a session, but price and Pro link show only in Ready or on the Done screen (same rule as O-35) | design-gap agent |
| O-68 | Message preview length: code and canvas use 60 s, FR-PRO-07 says 30 s | Recommended: 60 s; update FR-PRO-07 | design-gap agent |
| O-69 | Kiosk `msg=`: docs/09 says free kiosk links carry a message, yet the Kiosk licence unlocks `ambient.message` | Recommended: message needs the Kiosk licence or Pro, with the 60 s preview; fix docs/09 | design-gap agent |
| O-70 | First visit to `/`: auto-start (PRD J1) or show "Keep awake · 30 min" (redesign)? | GrowthFirstVisit supports both; pick one | design-gap agent |
| O-71 | Done-screen install card trigger: 2nd completed session by `meta.sessionCount` (misses ∞ and user-stopped sessions) or a broader count? | Recommended: count user-stopped sessions of 5 min or more first (growth-conversion #10) | design-gap agent |
| O-72 | Home section "Who tested this": rename (e.g. "How AwakeTab is checked") while real-device results are pending? | Recommended: rename | audit A |
| O-73 | Stop on the tool now ends in the Done screen with the session receipt when at least 1 min was held (shorter sessions go straight back to Ready). Before, Stop always went to Ready | Recommended: yes (closure and proof; feeds O-71 user-stopped counting) | fix batch 1a |
| O-74 | Phone length block: all seven presets in a two-row grid (15 min · 30 min · 45 min · 1 h · 2 h / 4 h · ∞ · Until… · Custom…). 320 px: four columns, two rows, the eighth cell More… holds only Until… and Custom… (all seven presets visible). Chips use the en.json label "Until…" instead of "Until a time…". Replaces the O-22 proposal; DESIGN.md §5 text still says phones show five | Recommended: accept, then update DESIGN.md §5 | fix batch 1a |
| O-75 | Offline toast keeps the en.json string "You're offline — the tool works, content pages may be unavailable." (existing copy, em dash exempt). The critique proposed "You're offline. The tool still works; guides may not load." | Decide; change en.json and all locales together if yes | fix batch 1a |
| O-76 | Blocked card on the tool lists all three real causes (Safari needs a tap, hidden tab, Firefox at 5 % battery or less). The engine often knows the cause | Recommended: show only the detected cause when known (existing tool.advice.* keys, without battery_saver per O-59), the list otherwise | fix batch 1a |
| O-77 | Two shared-primitive sets exist: batch 1b PRIMITIVES.md (Main uses it, hole names tone/toneSoft/hdr.*) and batch 2a prim.mjs (pl.*, gutter, bead). Same numbers, different bytes (theme button padding 0 vs width 44, pill holes) | Merge into one snippet file before the build phase | fix batch 1a (cross-batch) |
| O-78 | Unverified facts on the new guide boards: nosleep.page "Free", no until-time and no resume after reload (GuideVs table); iOS "Profiles or Device Management" naming on iOS 14 and earlier and Low Power Mode turning off at 80 % charge (GuideGuides) | Check and date each before the pages ship | fix batch 1b |
| O-79 | docs/06 §12 honest-limit tables still carry claims the fact-check disproved ("NotAllowedError on battery saver", "even AwakeTab is overridden", "Battery saver denies" for android-chrome, windows-11, edge, "macOS idle sleep not held", "PiP pill") | Update docs/06 §12 to the fact-check wording; the canvas boards already follow it | fix batch 1b |
| O-80 | Locale and content files contradict the canvas: en.json `pip.unsupported` ("needs Chrome or Edge —"; Firefox 151+ also works), `tool.toast.pipBlocked` ("floating timer"), `tool.toast.fullscreen` (em dash); `content/for/ja/cooking.md` says power saving refuses the lock; de and hi cooking pages recommend Split View | Fix the source strings (the Intl board hides them at render time) | fix batch 1b |
| O-81 | ExtrasShareDesk: the desktop share popover covers the status pill (§11.7) | Recommended: an inline panel in the right column | fix batch 1b |
| O-82 | Ambient Night and Minimal now use the standard M pill, so the pill text is red (Night) or ink (Minimal) instead of muted | Decide with O-09 | fix batch 1b |
| O-83 | PiP digits are now display-s 28 px, which leaves space in the 280 × 120 window | Allow a larger display size for PiP, or keep 28 | fix batch 1b |
| O-84 | Spec gaps found by the checker: list rows (FAQ, checklist) grow past 56 px when the text wraps; selectable time tiles on /until are 110 px tall; the kbd rule's 6 px padding is off the spacing scale | Document all three as allowed in DESIGN.md §11.4 | fix batch 1b |
| O-85 | Shared theme switch: add roving `tabindex="-1"` to unselected options (the A11y board describes it); the header "AwakeTab home" label needs an i18n key on localised pages | Recommended: yes to both | fix batch 1b |
| O-86 | /for/cooking copy: states plainly that an iPhone shows one app at a time (AwakeTab cannot keep a recipe in another app awake) and points to side by side windows on iPad and split screen on Android; author line "Builds and tests AwakeTab" sits next to the no-unbacked-testing rule | Confirm the framing and the author line | fix batch 1b |
| O-87 | Content boards show the CTA as "Keep awake · ∞" (accessible name "Keep awake until I stop"); Main still says "Keep awake · no limit" | Align Main to the ∞ rule | fix batch 1b |

## Decided under owner delegation (27 Sep 2026)
The owner delegated all open questions to the lead ("you take the decision"). Principles used: honesty first (PRODUCT.md), one tap to done, give away what brings people back, charge for personalisation and business use, never pushy, and follow the written spec unless research proved it wrong. Items marked **OWNER STEP** need the owner's own accounts or money and cannot be done by an agent.

| # | Decision |
|---|---|
| O-01 | **Yes.** Lamps Aqua (default) + Violet free; Mint + Sky in Pro (ambient.packs). Replaces Amber/Indigo/Teal/Rose; update docs/05 §1.1a, en.json + locales, `settings.accent` map and boot script together. Lapsed Pro falls back to Aqua. |
| O-02 | **All ambient modes are free** (Standard, Clock, Focus, Minimal, Night, Cook) because they are the reasons people keep the tab open; **Message stays Pro** with the 60 s preview. Pro sells personalisation and business use, not core use cases. |
| O-03 | **All four faces free.** |
| O-04 | **Remove the Sponsored card from the awake screen.** Contract change: update docs/00 §8.3 and docs/09 in the build. Keeps "No ads on the awake screen, now or later" true. |
| O-05 | **Remove web schedules and custom end sounds from all Pro copy now** (schedules stay as an extension feature). Build later only if demand shows. |
| O-06 | Keep **14-day refund**. |
| O-07 | **Yes**, coarse on-device ranges (visit age, session count buckets), no identifiers; privacy page updated in the same change. |
| O-08 | **60 s** (docs/05). |
| O-09 / O-82 | Night: pill text and bead use the night muted token, never red/lamp; state carried by glyph + text. Minimal: muted pill. |
| O-10 | **No ads on hub pages**; ads only inside articles per the contract. |
| O-11 | **Offer tomorrow with one tap** ("7:00 AM is tomorrow. Keep awake until then?"); update en.json `tool.until.error.past`. |
| O-12 | **Radio group** per docs/05. |
| O-13 | Approve new copy **subject to the copy rules**; the final audit checks it. |
| O-14 | Yes, when it matches the Effective date. |
| O-15 | **Retire the generator**; rewrite each page to its docs/06 §2 template. |
| O-16 / O-36 / O-50 | **OWNER STEP (urgent):** register awaketab.com (+ .app/.page/.dev), claim GitHub org and npm scope, create Buy Me a Coffee or remove the link. |
| O-17 | Store screenshots in this order: 1 popup "Screen awake" over a page, 2 Screen vs System, 3 badges and honest states, 4 presets + until, 5 Pro schedules and auto-start. Update store/listing.md. |
| O-18 | **Approve** (+24 px request via embed.js). |
| O-19 | **Yes**: favicon shape per state, tab titles "Paused · 24:18 left" / "Blocked · AwakeTab", manifest background #0A0E16. |
| O-20 | **Follow docs/05**: no toast if back within 2 s; otherwise "Re-acquiring the wake lock", then "Screen awake again". |
| O-21 | **Approve** the inline amber card with "Start anyway" (user's choice, stated plainly). |
| O-22 | Superseded by O-74. |
| O-23 | **Yes** to /for/classroom and the laptop-lid guide (routes added to docs/00 §7 first); WordPress plugin later. |
| O-24 | **Yes**, factual framing only (maintained, honest status); never disparage. |
| O-25 | **Build all**: welcome page, first-open tips, "New in" chip, private-window note, Pro entry row. |
| O-26 | **Yes**: "Pro is active" page; our own cancelled/failed return pages. |
| O-27 | **Approve** lapse and 7-day grace copy. |
| O-28 | **Yes**. |
| O-29 | **Hold Embed sales** until a sandbox purchase ends with a licensed domain; the /embed page shows "Licences open soon" with the free widget available now. |
| O-30 | **Runtime price switch**; state the cut-off as a date and time in UTC plus the visitor's local time. |
| O-31 | **Yes**: logo is Kiosk-only. |
| O-32 | **Yes** where Polar supports it: INR ≈ 40 %, BRL ≈ 50 % of USD; others USD. Set up with production checkout. |
| O-33 | **Yes**: publish "If AwakeTab ever shuts down, we will ship a final update that unlocks Pro for everyone." Build the offline-unlock path before selling lifetime in production. |
| O-34 | **Yes**: a site is one location with any number of screens. |
| O-35 / O-67 | **Yes**: previews may run during a session, but price and Pro links appear only in Ready, on the Done screen or on /pro. |
| O-37 | **Yes**: store name "AwakeTab: Keep Screen Awake". |
| O-38 | **Yes**: "Pay once, no renewal"; never "forever". |
| O-39 | Reword /library now ("npm package coming soon"; no 404 links); publish when the npm scope is claimed (OWNER STEP). |
| O-40 | **Adopt** the tagline "Keeps your screen awake. Says so only when it is." and the one-liner; "honest" at most once per page. |
| O-41 | **Yes**, remove the unverified claims and add the embed telemetry disclosure. |
| O-42 / O-49 / O-55 | **Adopt the recommendations as written** in marketing-positioning.md (M-02..M-13), marketing-seo-content.md (OD-01..OD-13) and marketing-gtm-launch.md (MG-01..MG-14), except where they conflict with a decision on this page, which wins. |
| O-43 | **Telemetry stays on by default** (anonymous, no cookies, no identifiers), stated plainly on the privacy page and in Settings, with a one-tap off switch honoured everywhere (fix the hard-coded /pro and /pro/activate). Remove "opt-in" and "only when enabled" wording. |
| O-44 | **One** staging subdomain (match docs). |
| O-45 | **Yes**: launch with ~20 rewritten pages indexed; the rest live but noindex until rewritten. |
| O-46 | **Yes**: "Sources checked {date}" and "Tested on {device}" (only for passing rows). |
| O-47 | **Yes**: visible nofollow credit in the host page. |
| O-48 | **Yes** to all four pages (routes via docs/00 §7). |
| O-51 | **Yes**: Show HN Tue 17 Nov 2026 19:30 IST, Product Hunt Tue 1 Dec 2026 13:31 IST; go/no-go on 10 Nov, else 12 Jan 2027. |
| O-52 | **Launch price ends 90 days after production checkout goes live**, fixed then as a calendar date and shown on /pro (no one has been offered 8 Dec yet, so this is not a changed promise). |
| O-53 | **Yes**. |
| O-54 | **Approve** budget; **OWNER STEP**: accountant for GST/LUT before the first real sale; Workers Paid from launch week. |
| O-56 | **Yes**: new `--at-input-border` token at ≥ 3:1 (dark #5A6781, light #8C98AA). |
| O-57 | **Yes**: light ground end stop #EEF3F8. |
| O-58 | **Yes**: compact embed 320 × 104. |
| O-59 | **Yes**: remove `tool.advice.battery_saver` from all locales; add translated per-cause lines. |
| O-60 | **Yes**: render the suggestion from the suggested locale's catalog with its `lang`. |
| O-61 | **Yes**: add keys (ICU for "Keep awake · {duration}") to en.json and all locales before build. |
| O-62 | **Allow two lines** (min-height 38, radius 20, balanced wrap); update docs/07 §4. |
| O-63 | **Phones show one banner at a time** (suggestion first). |
| O-64 | **Keep shipped cadence** (45, 40 … 5 min left, then 1 min, then complete). |
| O-65 | **Yes**: markup order follows visual order. |
| O-66 | **Accept**: digits are already far above 200 % of body size. |
| O-68 | **60 s**; update FR-PRO-07. |
| O-69 | **Message needs a Kiosk licence or Pro**, with the 60 s preview; fix docs/09. |
| O-70 | **Auto-start where the browser allows it** (PRD J1, zero taps), showing "Started for you · Stop" and the receipt; Safari/iOS show the "Keep awake · 30 min" tap button. |
| O-71 | **Count completed and user-stopped sessions of 5 min or more.** |
| O-72 | **Rename to "How AwakeTab is checked"** until device results are published. |
| O-73 | **Yes**. |
| O-74 | **Yes** (two-row grid with all seven presets on every phone, including 320 px). |
| O-75 | **Change** to "You're offline. The tool still works; guides may not load." in en.json and all locales. |
| O-76 | **Yes**: show the detected cause; the list only when unknown. |
| O-77 | **Merge** into one shared primitives file during the final audit. Done 27 Sep 2026: `docs/redesign/PRIMITIVES.md`; nav items padding 0 12 + gap 8, footer links 13/18 500 with min-width 44, kiosk L pill gap 8, one kbd font stack; `tools/final/primvariance.py` checks it. |
| O-78 / O-79 / O-80 | **Fix in the build** before those pages ship; each fact dated. |
| O-81 | **Inline panel** in the right column. |
| O-83 | **PiP digits may go to 40 px** (display-s range 24–40 in PiP). |
| O-84 | **Document** wrapping list rows and /until tiles as allowed; kbd padding becomes **8** (on the scale). |
| O-85 | **Yes** to both. |
| O-86 | **Confirm framing**; author line becomes "Builds AwakeTab" until device results are published. |
| O-87 | **Align Main to ∞**. |
