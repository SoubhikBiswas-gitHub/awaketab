# 02 · Product Requirements Document (PRD)

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** This document specifies *what* AwakeTab does: personas, journeys, functional requirements with acceptance criteria, non-functional requirements, content and analytics requirements, release criteria, edge cases and open decisions. It is the source for every downstream spec. Every identifier (state, key, route, plan, gate, event, budget) is used exactly as defined in `00-conventions.md`; anything not defined there is marked **PROPOSED — add to 00-conventions.md**. Business rationale lives in `01-brd.md`; the *how* lives in `03-architecture.md` through `15-implementation-plan.md`.

**Related docs:** `00-conventions.md` · `01-brd.md` · `03-architecture.md` · `04-engine-spec.md` · `05-frontend-spec.md` · `06-content-seo-spec.md` · `07-i18n.md` · `08-data-storage.md` · `09-monetization-impl.md` · `10-extension-spec.md` · `11-embed-spec.md` · `12-library-spec.md` · `13-testing-strategy.md` · `14-devops.md` · `15-implementation-plan.md`.

**Reading the tables.** "Pri" is the requirement priority (`P0` launch blocker · `P1` launch · `P2` phase P3 · `P3` later). "Phase" is the roadmap phase from `00-conventions.md` §12 (`P1` weeks 1–2 · `P2` weeks 3–5 · `P3` weeks 6–9 · `P4` ongoing). The two schemes share letters but are independent columns.

---

## 1 Overview, goals and non-goals

AwakeTab keeps a device's screen awake from a browser tab. It requests the native Screen Wake Lock, reports the real lock state in a status pill, ends a session at a duration or a clock time, survives reloads, alerts when time is up, installs as a PWA, runs in 8 languages, and extends into a floating PiP pill, a Chromium extension, an embeddable Cook Mode widget and an open-source library. It has no accounts, no cookies on tool pages and no third-party scripts on tool pages.

**Goals (product).**

1. The status pill is never wrong: the UI shows "Screen awake" only while a `WakeLockSentinel` is held or the video fallback is verified playing.
2. Every scenario in `00-conventions.md` §7 (`/for/{slug}`) works on first visit without reading anything: the right preset and ambient mode are pre-selected and the lock starts automatically where the browser allows.
3. Time-to-lock ≤ 300 ms after `DOMContentLoaded`; tool pages ≤ 40 KB JS (gz); Lighthouse mobile Performance ≥ 95, Accessibility 100.
4. Free covers the complete "keep my screen awake" job; Pro sells comfort and customisation, never the lock.

**Non-goals.** Synthetic input events or any "stealth" technique; keeping Teams/Slack presence green; preventing lid-close sleep or overriding OS power policy; user accounts; server-side storage of user data; Firefox extension in v1; native apps; Google ads on the awake screen, `/pip`, `/embed/*` or the extension.

---

## 2 Personas

| Persona | Context | Jobs to be done | Success looks like | Primary routes |
|---|---|---|---|---|
| **Priya** — locked-down office worker (Bengaluru, 31, analyst) | Corporate Windows 11 laptop, Edge, group policy locks the screen after 5 min, no admin rights, cannot install software. Reads long reports, monitors a dashboard, joins calls. | *When I step away or read for a while, keep my screen from locking so I don't type my password 20 times a day — without breaking IT rules.* Also: *don't make me claim I'm "online" in Teams; just stop the lock screen.* | Opens `/30m` from a bookmark, it starts by itself, pill says "Screen awake", she forgets about it. Sees the honest note that Teams presence is a different thing. | `/`, `/30m`, `/for/work-laptop`, `/learn/does-a-wake-lock-keep-teams-green`, extension |
| **Marco** — home cook (Bologna, 44) | iPad on the counter, Safari 17, floury hands, recipe on a blog or in Notes. iPhone as backup. | *Keep the recipe on screen while I cook, with big timers, without touching the tablet.* | Blog's embedded Cook Mode widget keeps the screen on; or `/for/cooking` in `cook` mode with a 45-min preset; chime when the oven timer ends. | `/for/cooking`, `/embed/cook`, `/on/ipad`, `/on/iphone-safari` |
| **Dr. Lena Hoffmann** — presenter / teacher (Munich, 52) | MacBook + projector, Chrome, lectures until a fixed clock time (11:30), switches between slides and a browser. | *Stop the projector going black mid-lecture, until class ends, even while I'm in another window.* | `/until/11-30` from a shortcut; PiP pill floats over slides; lock stays `held` because the PiP window remains visible; ends with a quiet chime at 11:30. | `/until/HH-MM`, `/for/presentations`, `/pip`, `/de/` |
| **Tomás** — dashboard / kiosk operator (São Paulo, 38, ops lead) | Wall-mounted Android tablets and a Chromebook showing Grafana; occasionally a lobby kiosk. No one touches the devices. | *Make the dashboards stay on all day, restart themselves after a power cut, and show our logo, not a stranger's branding.* | Installs the PWA, opens `/?autostart=1&mode=minimal`, session is `indefinite`; after reboot the browser restores the tab and the resume banner auto-accepts within 5 s; buys `biz_kiosk_site`. | `/for/dashboards`, `/for/kiosk`, `/kiosk`, `/on/chromebook`, `/on/android-chrome` |
| **Kenji** — developer running long jobs / AI agents (Tokyo, 29) | macOS + Firefox and Chrome, runs builds, model fine-tunes and coding agents overnight in a browser tab; distrusts tools that lie. | *Keep the screen on indefinitely while a job runs, tell me exactly what the tool can and cannot do, and let me use the same engine in my own tools.* | `pinf` with the extend prompt off (`endBehaviour: stop`), reads `/learn/screen-wake-lock-api-guide`, stars the repo, installs `@awaketab/wake`. | `/for/ai-agents`, `/for/downloads`, `/learn/*`, `/library`, `/on/macos`, `/on/firefox` |

---

## 3 User journeys

Each flow lists the visible steps and the state or event changes that must occur. Copy referenced by name is in §4.3.

**J1 — First visit, auto-start (Priya).**
1. User opens `/` in Edge 128 on Windows 11. Page paints the ring and the pill in state `idle` ("Ready") as part of the static HTML.
2. The tool island boots, runs the capability probe (§4.1 FR-ENGINE-04): API present, browser in matrix, document visible, top-level, no prior opt-out.
3. Engine requests the lock ≤ 300 ms after `DOMContentLoaded`; pill shows `requesting` ("Starting…"), then `held` ("Screen awake"). Default preset `p30` from `at.v1.settings.defaultPreset` starts a `duration` plan.
4. `session_start {planType: 'duration', presetId: 'p30', mode: 'standard', source: 'direct'}` and `lock_state {from: 'requesting', to: 'held'}` are queued.
5. A one-time onboarding tip ("Space toggles, 1–6 pick a preset") appears; dismissing writes `at.v1.onboarding.dismissedTips`.

**J2 — Preset to until-time (Lena).**
1. User presses `U` (or taps "Until…"). A time picker opens with the locale's 12/24-hour format, defaulting to the next whole hour.
2. She enters 11:30. Engine creates plan `until` with `endsAt` = today 11:30 local; if that time has passed, tomorrow 11:30, and the UI says so.
3. Countdown shows remaining time and the absolute end time ("until 11:30"). URL updates to `/until/11-30` via `history.replaceState` (noindex page).
4. On every tick and every `visibilitychange`, remaining time is recomputed from `Date.now()` against `endsAt`.

**J3 — Tab hidden, lock lost, re-acquired.**
1. User switches to another tab. Browser releases the sentinel; `release` event fires; state → `lost`; pill "Paused — tab hidden"; countdown continues (wall clock), ring dims.
2. Title changes to "Paused — AwakeTab" so the tab strip shows the state. No `alert()`, no sound.
3. User returns. `visibilitychange` → visible; engine re-requests; state → `requesting` → `held`.
4. Toast "Screen awake again" with the paused duration; event `lock_state {from: 'lost', to: 'held'}`.
5. If the plan's `endsAt` passed while hidden, the session ends with reason `completed` on return and the end flow (J4) runs.

**J4 — Timer end, extend.**
1. `endsAt` reached while `held`. Engine ends the session (`status: completed`, `reason: completed`), releases the lock, plays the chime once (if `sound` on), fires a notification (if permitted), and flashes the title between "Time's up" and the page title.
2. With `endBehaviour: prompt_extend` (default), the extend prompt shows: +15 min, +30 min, +1 h, keep awake indefinitely, stop. It stays until acted on; after 5 min unattended it collapses to a toast and the screen remains released.
3. Choosing +30 min starts a new `duration` plan of 30 min, re-requests the lock, logs a new `session_start {source: 'extend'}`.
4. Minutes are credited to `at.v1.stats` for the local day (§4.5).

**J5 — Reload, resume.**
1. User reloads (or the browser restores the tab). `at.v1.session` holds `status: active`, `endsAt` in the future (or plan `indefinite`).
2. UI shows the resume banner ("Your session was still running — 42 min left") with Resume / Discard. `resume_shown` fires.
3. Resume re-requests the lock and continues the same session id; `resume_accepted` fires. Discard marks the stored session `aborted` with reason `user`.
4. If `?autostart=1` is present (kiosk case), the banner auto-accepts after a 5-second visible countdown.

**J6 — iOS Low Power Mode (Marco's iPhone).**
1. On iOS Safari 17 with Low Power Mode on, the lock may be granted yet the device still locks at 30 s.
2. The tool detects the Low Power heuristic (§4.1 FR-ENGINE-11) and shows an info toast with the exact setting path; the pill stays truthful (`held`) because the sentinel is held.
3. `/on/iphone-safari` and `/learn/low-power-mode-and-wake-locks` explain the behaviour; the toast links to the latter.

**J7 — Unsupported browser, fallback.**
1. Firefox 120 (no `navigator.wakeLock`). Probe returns `unsupported`; pill "Tap to use the fallback"; a Start button is focused; auto-start does not happen (fallback needs a gesture).
2. User taps Start. Engine inserts its own hidden 1-frame looping video (own asset, muted, `playsinline`), awaits `play()` to resolve, then sets `fallback`; pill "Awake via video fallback"; CPU notice toast shows once per device.
3. If `play()` rejects (autoplay blocked), state stays `unsupported` and the toast explains the second tap. `fallback_used` fires on success.

**J8 — Pro purchase and activation.**
1. From the idle tool page card or `/pro`, user clicks "Get Pro" → `pro_view`, then `pro_checkout_click {plan: 'pro_lifetime'}` → Polar checkout in a new tab.
2. Polar emails a licence key; `POST /api/webhooks/polar` stores the order in KV.
3. User opens `/pro/activate`, pastes the key (auto-filled if returning from Polar with `?key=`), device label defaults to browser + OS.
4. `POST /api/license/activate {key, deviceId, deviceLabel}` → `{token, plan, features, exp, activations}`; token saved to `at.v1.license`; gates unlock immediately without reload; `pro_activated {plan}` fires.
5. `/pro/manage` lists the 5 device slots with labels and last-seen dates and offers Deactivate.

**J9 — Embed on a recipe blog.**
1. Blogger pastes the snippet from `/embed`: `<iframe src="https://awaketab.com/embed/cook?preset=p45&theme=auto" allow="screen-wake-lock" …>`.
2. Widget loads (≤ 20 KB JS), calls `GET /api/embed/config?domain=blog.example` → `{licensed: false, attribution: true, …}`, renders Cook Mode with "Powered by AwakeTab" link.
3. Reader taps Start (gesture inside the iframe); lock `held`; big countdown; `session_start {source: 'embed'}`.
4. If the host forgot `allow="screen-wake-lock"`, the request fails with `NotAllowedError`; widget shows the fix copy for the site owner and an "Open in AwakeTab" link — never a fake awake state.

**J10 — Extension for background use (Priya).**
1. From `/extension` (`extension_click`), user installs **AwakeTab for Chrome**.
2. Popup shows the same ring and presets; toggling calls `chrome.power.requestKeepAwake('display')`; badge shows the remaining time or "ON".
3. She minimises Chrome; display stays on because the extension does not depend on tab visibility. Popup copy states the one limit: Chrome must be running; closing the lid still sleeps the laptop.
4. Entering a Pro key in Options unlocks `ext.autostart` (keep awake whenever Chrome starts) and, later, `ext.schedules`.

---

## 4 Functional requirements

### 4.1 ENGINE — lock acquisition and truthfulness

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-ENGINE-01 | The engine must model exactly the seven lock states `idle`, `requesting`, `held`, `lost`, `denied`, `unsupported`, `fallback` and expose them through `@awaketab/wake`; no other state may exist in code or UI. | P0 | P1 | Given the type `TLockState`, when compiled, then it is a union of exactly those seven literals.<br>Given any transition, when it occurs, then `lock_state {from, to}` is emitted with both values from the set. |
| FR-ENGINE-02 | State `held` must be entered only after `navigator.wakeLock.request('screen')` resolves, and must be left the moment the sentinel's `release` event fires. | P0 | P1 | Given a request in flight, when the promise is pending, then state is `requesting` and the pill shows "Starting…".<br>Given `held`, when the browser fires `release`, then state is `lost` within one event-loop turn. |
| FR-ENGINE-03 | When state is `lost` and `document.visibilityState` becomes `visible`, the engine must re-request the lock automatically. | P0 | P1 | Given `lost`, when the tab becomes visible, then a new request is issued within 100 ms and state reaches `held` or `denied`. |
| FR-ENGINE-04 | The engine must run a capability probe before any request: API presence, browser family and major version against the matrix (Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4, iOS Home-Screen app ≥ 18.4), secure context, top-level or `allow`-delegated frame, document visible. | P0 | P1 | Given Firefox 125, when probed, then result is `unsupported` with reason `browser_version`.<br>Given an iframe without `allow="screen-wake-lock"`, when probed, then result predicts `denied` with reason `policy` and the UI shows the policy fix before requesting. |
| FR-ENGINE-05 | On `unsupported`, the engine must offer its own video fallback: a self-hosted, muted, 1-frame looping video (no NoSleep.js), started only from a user gesture, entering `fallback` only after `play()` resolves and the element reports `!paused`. | P0 | P1 | Given `unsupported`, when the user taps Start and `play()` resolves, then state is `fallback` and `fallback_used` fires.<br>Given `play()` rejects, when handled, then state remains `unsupported` and the autoplay toast shows. |
| FR-ENGINE-06 | On `NotAllowedError` the engine must enter `denied` and classify the probable cause (`battery_saver`, `policy`, `hidden`, `unknown`) using visibility, frame context and platform hints, so the UI can show the matching fix. | P0 | P1 | Given a hidden document at request time, when rejected, then cause is `hidden` and a retry is scheduled on visibility.<br>Given a visible top-level page on Android Chrome with rejection, when classified, then cause is `battery_saver` and the fix panel opens. |
| FR-ENGINE-07 | Auto-start must fire when: probe passes, document is visible, and either the route/query implies intent (`/`, `/15m`…`/8h`, `/until/HH-MM`, `/for/*`, `autostart=1`) or `at.v1.settings.defaultPreset` is set; time-to-request ≤ 300 ms after `DOMContentLoaded`. Auto-start must not fire in `/embed/*` (gesture required by design) or when a second tab already holds the lock. | P0 | P1 | Given a supported browser on `/30m`, when the page loads, then a request is issued ≤ 300 ms after `DOMContentLoaded` (Playwright timing).<br>Given another tab reporting `held` over `BroadcastChannel('awaketab')`, when this tab loads, then no request is issued and the second-tab notice shows. |
| FR-ENGINE-08 | The engine must persist the session to `at.v1.session` on every state change and every minute tick, and must offer resume when a stored session is `active` with `endsAt` in the future or plan `indefinite`. | P0 | P1 | Given a running 60-min session reloaded at minute 18, when the page loads, then the banner offers 42 min remaining and `resume_shown` fires.<br>Given Resume, when accepted, then the same session `id` continues and `resume_accepted` fires. |
| FR-ENGINE-09 | Battery-aware auto-stop: where `navigator.getBattery` exists (Chromium), when `at.v1.settings.battery.autoStop` is on and the device is discharging below the threshold (default 10 %), the engine must end the session with reason `battery` and release the lock. Absent the API, the setting is hidden. | P2 | P3 | Given Chrome on a laptop at 9 % discharging, when the tick runs, then session ends with `session_end {reason: 'battery'}` and the battery toast shows.<br>Given Safari, when settings render, then the battery option is absent. |
| FR-ENGINE-10 | Multiple tabs must coordinate over `BroadcastChannel('awaketab')`: only one tab holds the lock; a second tab shows the notice with "Go to that tab" / "Take over"; take-over releases the first tab's lock and transfers the session. | P2 | P3 | Given tab A `held`, when tab B opens `/`, then B shows the second-tab notice within 500 ms and does not request.<br>Given "Take over" in B, when clicked, then A releases and shows "Moved to another tab", and B is `held`. |
| FR-ENGINE-11 | The engine should detect iOS Low Power Mode heuristically (iOS Safari with `requestAnimationFrame` cadence ≈ 30 Hz over a 1-second sample) and surface an informational toast once per session without changing the lock state. | P1 | P1 | Given iOS Safari with Low Power Mode on, when the sample completes, then the Low Power toast appears once and the pill is unchanged. |
| FR-ENGINE-12 | If the lock stays `lost` continuously for longer than the lost-timeout (`LOST_TIMEOUT_MS` = 6 h, `00-conventions.md` §13.1), the engine must end the session with reason `lost_timeout` so stale sessions do not resume days later. | P1 | P1 | Given `lost` for 6 h, when the next visibility event arrives, then the session is `aborted` with `lost_timeout` and no resume banner is shown. |

### 4.2 TIMER — plans, presets, deep links

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-TIMER-01 | Presets `p15`, `p30`, `p45`, `p60`, `p120`, `p240` must create `duration` plans of the matching minutes; `pinf` creates an `indefinite` plan. All presets must be visible on a 360-px-wide viewport without horizontal scroll. | P0 | P1 | Given a 360×640 viewport, when the tool renders, then seven preset controls are visible and tappable (≥ 24×24 CSS px).<br>Given `p120`, when started, then `endsAt − startedAt` = 7,200,000 ms ± 1,000. |
| FR-TIMER-02 | `custom` must accept days, hours and minutes up to 7 days (`CUSTOM_MAX_MS`, `00-conventions.md` §13.1) and reject zero or negative input inline. | P1 | P1 | Given input 1 d 2 h 30 m, when confirmed, then plan is `duration` with `ms` = 95,400,000.<br>Given 0 m, when confirmed, then the field shows "Enter at least 1 minute" and no session starts. |
| FR-TIMER-03 | `until` must take a local clock time, set `endsAt` to the next occurrence of that time (today, else tomorrow), and recompute remaining time on every tick and `visibilitychange`; the UI must display the absolute end time and the date when it is tomorrow. | P0 | P1 | Given local time 14:00 and input 11:30, when confirmed, then `endsAt` is tomorrow 11:30 and the UI says "until tomorrow, 11:30".<br>Given a DST change during the plan, when ticks run, then the countdown targets the wall-clock 11:30, not a fixed millisecond offset. |
| FR-TIMER-04 | Ticks must run every 1,000 ms aligned to the wall clock; all remaining-time arithmetic must use `Date.now()` and never accumulated deltas. | P0 | P1 | Given the page is throttled in a background tab for 10 min, when it becomes visible, then the countdown shows the correct wall-clock remaining time within 1 s. |
| FR-TIMER-05 | Deep links must map to plans: `/15m` `/30m` `/45m` `/1h` `/2h` `/4h` `/8h` → the corresponding `duration`; `/until/HH-MM` → `until`; query `preset=`, `until=HH-MM`, `mode=`, `theme=`, `msg=`, `autostart=1`, `ref=` are optional and validated. Invalid values fall back to defaults silently. | P1 | P1 | Given `/until/25-99`, when loaded, then the tool opens with the default preset and the URL is left unchanged (no crash).<br>Given `/8h`, when loaded, then plan `duration` of 480 min starts (8 h is a route, not a preset ID; it maps to `custom` with 480 min). |
| FR-TIMER-06 | End behaviour must follow `at.v1.settings.endBehaviour`: `prompt_extend` (default) shows the extend prompt (+15 min, +30 min, +1 h, indefinite, stop); `stop` ends silently except the chime/notification. In both cases the lock is released at `endsAt`. | P1 | P1 | Given `prompt_extend`, when the timer ends, then the lock is released and the prompt shows within 1 s.<br>Given `stop`, when the timer ends, then no prompt appears and the pill returns to "Ready". |
| FR-TIMER-07 | The user must be able to pause (`Space` while active) and resume; pausing releases the lock, sets `status: paused` and `pausedAt`; for `duration` plans the remaining time is frozen, for `until` plans `endsAt` is unchanged. Extending a running session (+15/+30/+60 min) must add to `endsAt` without a new session. | P1 | P1 | Given a `duration` session with 20 min left, when paused for 5 min and resumed, then 20 min remain.<br>Given an `until` 11:30 session, when paused and resumed, then it still ends at 11:30. |
| FR-TIMER-08 | End alerts at `completed`: one chime (single built-in sound, volume from settings), a Notification when permission is `granted`, and a title flash alternating "Time's up" with the page title until focus. Chime and title flash must work without notification permission. | P1 | P1 | Given `sound: true` and notifications denied, when the timer ends, then the chime plays once and the title flashes; no permission prompt appears.<br>Given an installed iOS web app with permission granted, when the timer ends, then a notification is delivered. |
| FR-TIMER-09 | Recurring schedules (Pro gate `schedules`): start a preset automatically at set weekday/time while the tab is open. | P3 | P4 | Given gate `schedules` present and a Mon–Fri 09:00 `until` 17:30 schedule, when the tab is open at 09:00, then a session starts and the pill reflects the real state. |

### 4.3 UI — pill, toasts, controls, shortcuts, themes

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-UI-01 | The status pill must render the exact copy in Table 4.3.1 for each state, expose state through text and icon (never colour alone), use the pill colour tokens from `00-conventions.md` §5.1, and announce changes via `aria-live="polite"`. Only `held` and `fallback` may display a running countdown. | P0 | P1 | Given each of the seven states, when rendered, then the visible text equals the table row and the `data-state` attribute equals the state name.<br>Given `lost`, when rendered, then the countdown is visible but marked paused (no running ring animation). |
| FR-UI-02 | The ring (progress ring with glowing dot) must be inline SVG in the static HTML so it is the LCP element, must show progress for `duration`/`until` plans and a slow idle pulse for `indefinite`, and must respect `prefers-reduced-motion`. | P0 | P1 | Given a Lighthouse mobile run, when LCP is measured, then the LCP element is the ring SVG and LCP ≤ 1.2 s.<br>Given reduced motion, when `held`, then the dot does not animate and progress updates once per minute. |
| FR-UI-03 | All feedback must use non-blocking toasts (bottom on mobile, bottom-right on desktop), never `alert()`/`confirm()`; informational toasts auto-dismiss after 5 s (warnings 8 s) plus 60 ms per character, paused while hovered, focused or the tab is hidden; error toasts and toasts with an action persist until dismissed; at most 3 stacked (docs/05 §3.7). | P0 | P1 | Given a code search for `alert(`, when CI runs, then zero matches in `apps/web`.<br>Given 4 toasts fired, when displayed, then the oldest informational toast is removed. |
| FR-UI-04 | Keyboard shortcuts must be exactly: `Space` toggle · `1`–`6` presets `p15`…`p240` · `0` indefinite · `U` until… · `F` fullscreen · `D` cycle theme · `M` cycle ambient mode · `P` PiP · `S` Sounds sheet · `Esc` stop/close · `?` shortcuts overlay. Shortcuts must be inert while focus is in an input, and the overlay must list them with translated labels. | P1 | P1 | Given focus on the body, when `3` is pressed, then preset `p45` starts.<br>Given focus in the custom-duration input, when `1` is pressed, then the digit is typed and no preset changes. |
| FR-UI-05 | Themes `auto`, `light`, `dark`, `oled` must be selectable via settings, `D`, and `theme=`; `auto` follows `prefers-color-scheme`; `oled` uses `#000000` backgrounds; the choice persists in `at.v1.settings.theme`; the first paint must use the stored theme (no flash). | P1 | P1 | Given `theme: oled` stored, when the page loads, then the first painted background is `#000000` (inline script before CSS).<br>Given `auto` and OS dark, when loaded, then dark tokens apply. |
| FR-UI-06 | Fullscreen (`F` or button) must use the Fullscreen API on the tool container; `Esc` exits; the pill and countdown remain visible in fullscreen; on iOS Safari (no Fullscreen API for non-video) the button is hidden and the PWA install tip shown instead. | P1 | P1 | Given desktop Chrome, when `F` is pressed, then `document.fullscreenElement` is the tool container and the pill is visible. |
| FR-UI-07 | The resume banner must appear above the ring when FR-ENGINE-08 conditions hold, showing remaining time (or "indefinite") and Resume / Discard; with `autostart=1` it auto-accepts after a visible 5-second countdown that any key or tap cancels. | P0 | P1 | Given `at.v1.session.status: 'active'` and `autostart=1`, when loaded, then Resume fires automatically after 5 s unless the user interacts. |
| FR-UI-08 | The countdown must be announced to assistive tech at most once per minute (and at 10 s remaining), not every second; the visual countdown updates every second. | P1 | P1 | Given a screen reader, when a 2-min session runs, then the live region updates at 2:00, 1:00, 0:10 and at end only. |
| FR-UI-09 | A fix panel must accompany `denied` and `unsupported`: cause-specific steps (battery saver on Android/Windows/macOS, iframe policy, hidden document, browser too old with the matrix), a Retry button, and a link to the matching `/on/` or `/guides/` page. | P0 | P1 | Given `denied` with cause `battery_saver` on Android, when the panel opens, then it shows the Android Battery Saver steps and Retry re-requests on click. |
| FR-UI-10 | Onboarding tips (shortcuts, install, until-time) may show once each, one at a time, dismissible, tracked in `at.v1.onboarding.dismissedTips`; never during an active `held` session's first 10 s. | P1 | P1 | Given a tip dismissed, when the page reloads, then the same tip does not reappear. |
| FR-UI-11 | The rating prompt must appear once, after the 5th `completed` session (`at.v1.meta.sessionCount`), with 1–5 stars, "Not now" (re-ask after 20 more sessions) and "Don't ask again"; results are the sole source of `aggregateRating` and are sent as `rating_prompt {action}` where action ∈ `rated_1`…`rated_5`, `later`, `never`. | P2 | P3 | Given `sessionCount` reaching 5 with `ratingPrompt.shownAt` unset, when the session completes, then the prompt shows and `ratingPrompt.shownAt` is written.<br>Given "Don't ask again", when chosen, then `ratingPrompt.action` = `never` and it never shows again. |
| FR-UI-12 | A share control must copy the current preset deep link (e.g. `https://awaketab.com/30m`, or `/until/11-30`) to the clipboard and fire `share_click`; on mobile it uses the Web Share API when available. | P2 | P3 | Given `p30` selected, when Share is tapped on desktop, then the clipboard contains `https://awaketab.com/30m` and the copied toast shows. |
| FR-UI-13 | A settings panel must expose every field of `at.v1.settings` (theme, accent, defaultPreset, sound, notifications, endBehaviour, battery, ambient, locale, telemetry, keyboardHints) with plain-language labels; changes apply immediately and persist. | P1 | P1 | Given `sound` toggled off, when the timer ends, then no chime plays and `at.v1.settings.sound` is `false` after reload. |
| FR-UI-14 | The idle tool page (state `idle`, no session) may show one Pro card (after G2) or, after G5, the sponsor card; the awake screen (`held`/`fallback`) may show only the sponsor card; no other promotional element appears on tool pages. | P2 | P3 | Given `held`, when rendered before G5, then no promotional element is in the DOM. |
| FR-UI-15 | The `/404` page must render the tool in `idle` with a short "Page not found" line and links to `/` and the four hubs. | P1 | P1 | Given an unknown URL, when loaded, then HTTP 404 is returned and the tool is functional. |

**Table 4.3.1 — Status pill microcopy (en; i18n keys `tool.pill.<state>` and `tool.pill.<state>.sub`).**

| State | Pill text | Secondary line (below pill) | Colour token | Countdown |
|---|---|---|---|---|
| `idle` | Ready | Pick a duration or press Space. | neutral | hidden |
| `requesting` | Starting… | Asking the browser for a wake lock. | neutral | hidden |
| `held` | Screen awake | Your screen stays on while this tab is visible. | accent (amber) | running |
| `lost` | Paused — tab hidden | Come back to this tab and it resumes by itself. | warn | shown, paused |
| `denied` | Blocked — here's the fix | Your browser refused the wake lock. Usually battery saver. | bad | hidden |
| `unsupported` | Tap to use the fallback | This browser has no Wake Lock API. Start uses a tiny looping video instead. | neutral | hidden |
| `fallback` | Awake via video fallback | Works, but uses a little more CPU than the native lock. | accent (muted) | running |

**Table 4.3.2 — Key toasts, banners and errors (en).** Placeholders in braces are formatted per locale.

| Key | Trigger | Copy | Actions |
|---|---|---|---|
| `toast.reacquired` | `lost` → `held` | Screen awake again. The lock paused for {duration} while this tab was hidden. | — |
| `banner.resume` | FR-UI-07 | Your session was still running — {remaining} left. | Resume · Discard |
| `banner.resume.auto` | `autostart=1` | Resuming in {seconds}s. Press any key to cancel. | Resume now · Discard |
| `toast.denied.battery` | `denied`, cause `battery_saver` | Your browser blocked the wake lock. Battery saver is the usual cause — turn it off, then retry. | Retry · Show fix |
| `toast.denied.policy` | `denied`, cause `policy` | This page can't hold a wake lock inside another site. Open AwakeTab in its own tab. | Open AwakeTab |
| `toast.denied.hidden` | `denied`, cause `hidden` | The tab was in the background when it asked. Keep it visible and retry. | Retry |
| `toast.unsupported.autoplay` | fallback `play()` rejected | The browser blocked the video fallback. Tap Start once more. | Start |
| `toast.fallback.cpu` | first `fallback` per device | Video fallback running. Expect 1–3 % extra CPU; Firefox before 126 can use more. Update your browser for the native lock. | Got it |
| `prompt.extend` | `completed`, `prompt_extend` | Time's up. Keep the screen awake longer? | +15 min · +30 min · +1 h · Indefinitely · Stop |
| `toast.completed.stop` | `completed`, `stop` | Session complete — {minutes} min. Your screen can sleep now. | — |
| `toast.battery.stop` | `session_end {reason: 'battery'}` | Stopped at {level} % battery to protect your device. Plug in and press Space to continue. | Start again |
| `notice.second_tab` | FR-ENGINE-10 | AwakeTab is already running in another tab. One tab is enough. | Go to that tab · Take over here |
| `toast.moved` | take-over in another tab | Moved to your other tab. This tab is idle. | — |
| `toast.storage.unavailable` | `localStorage` throws | Private mode: settings and stats won't be saved after this tab closes. Everything else works. | — |
| `toast.notifications.denied` | permission `denied` | Notifications are off for this site. You'll still get the chime and the title flash. | — |
| `toast.lowpower` | FR-ENGINE-11 | iPhone Low Power Mode caps Auto-Lock at 30 s and can override the wake lock. Turn it off in Settings › Battery while you need the screen on. | Learn more |
| `toast.clock_jump` | tick gap > 2 min while `held` | Your device slept for {duration}. The countdown kept real time. | — |
| `toast.long_session` | 24 h in `held`/`fallback` | Running for {duration}. To reduce burn-in, try Night or Minimal mode — they shift pixels for you. | Switch mode |
| `toast.update_ready` | new service worker waiting | A new version of AwakeTab is ready. (during a session: … Reload when you're done.) | Reload (only when no session runs) |
| `toast.share.copied` | FR-UI-12 | Link copied: {url} | — |
| `prompt.rating` | FR-UI-11 | Five sessions in. How is AwakeTab working for you? | ★ 1–5 · Not now · Don't ask again |
| `toast.pip.unsupported` | `P` without Document PiP | The floating window needs Chrome or Edge 116 or newer. Press F for fullscreen instead. | — |
| `license.error.invalid` | activate → invalid key | That key isn't valid. Copy it exactly from your Polar receipt email. | — |
| `license.error.device_limit` | activate → 6th device | This key is already active on 5 devices. Deactivate one from Manage devices, then retry. | Manage devices |
| `license.error.revoked` | validate → `{revoked: true}` | This licence was refunded or cancelled, so Pro features are off. Your settings and stats are untouched. | — |
| `license.warn.grace` | `exp` passed, within 7-day grace | Pro expired on {date}. Renew by {graceDate} to keep Pro features on. | Renew |
| `license.warn.offline` | validate unreachable | Couldn't reach awaketab.com to re-check your licence. Pro stays on until {date}. | — |
| `embed.error.allow` | `/embed/cook` denied by policy | The wake lock is blocked on this page. Site owner: add allow="screen-wake-lock" to the iframe. | Open in AwakeTab |
| `embed.error.insecure` | parent page not https | This page isn't served over https, so the browser won't allow a wake lock here. | Open in AwakeTab |

### 4.4 AMBIENT — modes and burn-in guard

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-AMBIENT-01 | Ambient modes must be exactly `standard`, `clock`, `focus`, `breathe`, `minimal`, `night`, `message`, `cook`; `M` cycles through available modes in that order; `mode=` selects one; the choice persists in `at.v1.settings.ambient`. Free: `standard`, `clock`, `minimal`, `breathe` and `cook` (**PROPOSED — add `cook` to the free list in 00-conventions.md §8.2**). `night` and `focus` require `ambient.packs`; `message` requires `ambient.message`. Locked Pro items (modes, faces, themes, lamps, patterns, presets, sounds) preview for 5 minutes with a visible countdown and a warning at 1 minute, then revert to the last free choice; a preview is never written to storage. | P2 | P3 | Given no licence, when a shared `mode=message&msg=` link opens Message mode, then it renders with a visible 5-minute countdown, warns at 1 minute and returns to Clock while the lock stays `held`, and nothing is written to `at.v1.settings` or the session.<br>Given no licence, when the user picks a Pro colour theme in Settings, then it applies at once, previews for 5 minutes, then reverts to the stored free theme.<br>Given `mode=cook` on `/for/cooking`, when loaded, then Cook Mode renders without a licence. |
| FR-AMBIENT-02 | `clock` must show the local time in large digits (12/24-hour from locale, optional seconds), the date, and the countdown when a plan exists, with the pill still visible. | P2 | P3 | Given `ja` locale, when `clock` renders, then the time is 24-hour and the date uses the Japanese format. |
| FR-AMBIENT-03 | `night` must use `#000000` background, dim red/amber digits at ≤ 30 % brightness, hide all chrome except the pill on hover/tap, and offer a brightness slider stored in settings. | P2 | P3 | Given `night`, when idle for 10 s, then only the digits and (on interaction) the pill are visible; contrast still meets 4.5:1. |
| FR-AMBIENT-04 | `focus` must run Pomodoro cycles (default 25/5, configurable in Settings, long break `settings.pomodoro.longBreakMin`) inside the session, cue each boundary (the chosen end sound, else the focus chime), show the phase (Focus · Break · Long break) and cycle dots, and offer Pause (the timer only) and Skip; the wake lock is held across breaks and pauses. With `settings.pomodoro.autoCycle` (`ambient.packs`, previewable for 5 minutes) blocks repeat until the user stops. | P2 | P3 | Given `focus` with a 60-min plan, when 25 min pass, then the break chime plays and the lock remains `held`.<br>Given Pro and auto-cycle on, when the long break ends, then the next block starts at Focus 1 and the day's focus-block count grows by one.<br>Given a running block, when Pause is pressed, then the countdown stops and the pill still reads Screen awake. |
| FR-AMBIENT-09 | `breathe` must guide 4-7-8 (default) or box 4-4-4-4 breathing (`settings.breathe`) with the ring: a disc that grows on Inhale, holds, and settles on Exhale, with the step word and seconds left, in the lamp colour; under reduced motion nothing scales and a stepped bar shows the step instead. Free. | P2 | P3 | Given `breathe` with 4-7-8, when 4 s pass, then the word changes from Inhale to Hold.<br>Given `prefers-reduced-motion: reduce`, when `breathe` renders, then the disc does not scale and the bar is visible. |
| FR-FOCUS-01 | The tool must offer a session intention (`settings.intention`, ≤ 80 characters, plain text): "What are you working on?" from the tool (dock button from 1024 px, `I`) and Settings, shown under the clock and in the pill's tooltip, with Clear. Free. | P2 | P3 | Given an intention typed in Settings, when the sheet closes, then it shows under the clock and as the pill's `title`.<br>Given Clear, when pressed, then the line disappears and `intention` is `''`. |
| FR-FOCUS-02 | The tool must offer a second time zone (`settings.worldClock`, an IANA zone or `null`) picked from a searchable list built from `Intl.supportedValuesOf('timeZone')`, shown under the clock as "London 3:15 PM · −4:30" (the difference from this device, "tomorrow" when its day is ahead). Free. | P2 | P3 | Given `Asia/Tokyo` chosen, when the minute changes, then the line updates without a reload. |
| FR-AMBIENT-05 | `message` must display custom text (`msg=` ≤ 80 chars or a settings field) rendered as a text node (never HTML), and, with `ambient.logo`, a locally stored logo (PNG/SVG/JPEG ≤ 200 KB as a data URL in settings). | P2 | P3 | Given `msg=<img src=x onerror=alert(1)>`, when rendered, then the literal string appears and no script executes.<br>Given an 800 KB logo, when uploaded, then it is rejected with an inline size message. |
| FR-AMBIENT-06 | `cook` must show a large countdown (≥ 96 px digits), a big Pause/Resume target (≥ 64 px), high-contrast palette, and an optional secondary kitchen timer independent of the session. | P2 | P3 | Given `cook`, when rendered at 768 px wide, then the digit height ≥ 96 CSS px and the pause target ≥ 64×64 px. |
| FR-AMBIENT-07 | Burn-in guard: in every ambient mode the engine must shift the content block by up to 8 px on a 60-second cycle and, in `night` and `clock`, dim by 10 % after 10 min of no interaction; the guard respects `prefers-reduced-motion` by using instant repositioning instead of animation. | P2 | P3 | Given `clock` for 3 min, when positions are sampled, then the content offset has changed at least twice by ≤ 8 px. |
| FR-AMBIENT-08 | Theme packs (`ambient.packs`) are named palettes applied over any mode; the free tier sees pack thumbnails and a live 30-second preview. | P2 | P3 | Given no licence, when a pack is tapped, then the preview applies and reverts after 30 s with the Pro card. |

### 4.5 STATS — usage statistics

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-STATS-01 | Minutes in `held` or `fallback` must be credited to `at.v1.stats.days` under the local day key produced by `Intl.DateTimeFormat('en-CA')`, written on every minute tick (so a crash loses ≤ 1 minute), split correctly across local midnight, and retained 365 days. | P1 | P1 | Given a session from 23:58 to 00:03 local, when stored, then day N has 2 minutes and day N+1 has 3.<br>Given IST, when a session runs at 04:00 IST, then it is credited to the IST date, not the UTC date. |
| FR-STATS-02 | The free tier must show Today and This week; the History view (30/90/365 days) is gated by `stats.history`. | P1 | P1 | Given no licence, when Stats opens, then Today and This week render and the History tab shows a Pro card. |
| FR-STATS-03 | `longestStreak` and the current streak count consecutive local days with ≥ 1 credited minute; `sessions` counts `completed` sessions only. | P2 | P3 | Given minutes on Mon, Tue, Thu, when computed, then current streak is 1 (Thu) and longest is 2. |
| FR-STATS-04 | A 52-week heatmap (7×52 grid, 5 intensity levels, accessible table alternative) is available with `stats.history`. | P2 | P3 | Given a licensed user with 90 days of data, when the heatmap renders, then each cell has an `aria-label` with date and minutes. |
| FR-STATS-05 | CSV export (`stats.export`) must download `awaketab-stats-YYYY-MM-DD.csv` with columns `date,minutes` for all retained days. | P2 | P3 | Given `stats.export`, when Export is clicked, then a CSV with one row per day and a header row is produced. |

### 4.6 PWA — install, offline, shortcuts

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-PWA-01 | The web app manifest must declare name, short name "AwakeTab", `display: standalone`, theme colours per scheme, maskable and any-purpose icons (192/512), an `apple-touch-icon`, and shortcuts "15 minutes" → `/15m`, "30 minutes" → `/30m`, "1 hour" → `/1h`, "Until a time" → `/?until=`. | P1 | P1 | Given Lighthouse PWA audit, when run, then installability passes and the four shortcuts are listed. |
| FR-PWA-02 | The service worker must precache the app shell, `/`, preset routes and the fallback video; content pages use a stale-while-revalidate runtime cache; the tool must work offline for all presets. | P1 | P1 | Given the site visited once, when offline and `/30m` is opened, then the tool loads and can hold the lock. |
| FR-PWA-03 | An in-page Install control must appear when `beforeinstallprompt` fires (Chromium) and, on iOS Safari, show the Add-to-Home-Screen steps with the note that wake lock in Home-Screen apps needs iOS 18.4+; `pwa_install` fires on `appinstalled`. | P1 | P1 | Given iOS 17 Safari, when Install is tapped, then the steps show and include the 18.4 note. |
| FR-PWA-04 | A waiting service worker must never reload a page with an `active` session; it shows `toast.update_ready` and activates on the next navigation or when the user chooses Reload. | P1 | P1 | Given `held` and a new SW, when the update is detected, then the page is not reloaded and the toast shows. |

### 4.7 PIP — Document Picture-in-Picture pill

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-PIP-01 | `P` or the PiP button must open a Document Picture-in-Picture window loading `/pip` (noindex) with the pill, countdown, ring, Pause/Stop and +30; where `documentPictureInPicture` is absent, `toast.pip.unsupported` shows; `pip_open` fires on success. | P2 | P3 | Given Chrome 120, when `P` is pressed, then a PiP window opens showing the same state as the opener within 1 s. |
| FR-PIP-02 | While the PiP window is open, the engine must keep the lock `held` even if the opener tab is hidden, by requesting the lock from the PiP document (which stays visible); the pill in both windows must report the real state. | P2 | P3 | Given PiP open and the opener tab switched away, when checked after 60 s, then the PiP pill shows "Screen awake" only if a sentinel is held in the PiP document. |
| FR-PIP-03 | `pip.pro` enables ambient modes inside the PiP window; free PiP shows `standard` only. Closing the PiP window returns control to the opener without ending the session. | P2 | P3 | Given no licence, when `M` is pressed in PiP, then the mode does not change and the Pro card link shows. |

### 4.8 I18N — locales and formatting

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-I18N-01 | The site must serve `en` at the root and `es`, `pt-br`, `de`, `fr`, `ja`, `zh`, `hi` under `/{lang}/`, with reciprocal hreflang on every page pair and `x-default` → root; home in all 8 locales at P1 exit, content pages progressively. | P1 | P1 | Given `/de/`, when crawled, then it carries hreflang links to the 7 other locales and `x-default`, and each of those links back. |
| FR-I18N-02 | UI strings must live in `src/i18n/{locale}.json` with `dot.case` keys grouped by screen (e.g. `tool.pill.held`); no string concatenation; ICU plurals and ordered placeholders; a missing key falls back to `en` and logs a `client_error {code: 'i18n_missing'}` in dev. | P1 | P1 | Given the build, when a key exists in `en.json` but not in `hi.json`, then CI fails the i18n completeness check. |
| FR-I18N-03 | Locale selection: URL locale wins; else `at.v1.settings.locale`; else a non-blocking suggestion banner based on `navigator.languages` (no automatic redirect); the picker is in the footer and settings. | P1 | P1 | Given a `pt-BR` browser on `/`, when loaded, then the English page renders and a banner offers `/pt-br/`. |
| FR-I18N-04 | Times, dates, durations and numbers must use `Intl` for the active locale (12/24-hour, digit grouping); the until-time picker follows the locale's hour cycle. | P1 | P1 | Given `en` (US), when `until` renders 17:30, then "5:30 PM" is shown; given `de`, "17:30". |
| FR-I18N-05 | Every locale must be reviewed by a native speaker before it is made indexable; a glossary fixes translations for wake lock, screen, sleep, battery saver, Low Power Mode; keywords are localised per market, not translated literally. | P1 | P1 | Given a locale without reviewer sign-off in `07-i18n.md`, when built, then its pages carry `noindex`. |

### 4.9 SEO — technical and on-page

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-SEO-01 | Every indexable page must have a title "{Intent} — AwakeTab" ≤ 60 characters, one meta description, exactly one `<h1>` matching the intent, the answer in the first 100 words, breadcrumbs, and a "Last verified {date}" line. | P1 | P1 | Given the build, when the SEO lint runs, then zero pages have missing/duplicate titles, descriptions or multiple `<h1>`. |
| FR-SEO-02 | JSON-LD must include `WebApplication` (`applicationCategory: UtilitiesApplication`, price 0, `aggregateRating` only when ≥ 10 real in-app ratings exist), `Organization`, `WebSite`, `BreadcrumbList`, and `Article` with `dateModified` on content pages; `FAQPage`/`HowTo` are optional and receive no investment. | P1 | P1 | Given fewer than 10 ratings, when `/` is built, then no `aggregateRating` is present.<br>Given Rich Results Test, when run on `/for/cooking`, then `Article` and `BreadcrumbList` validate. |
| FR-SEO-03 | A sitemap index with per-locale sitemaps and `lastmod` must be generated at build; `robots.txt` must include the `Sitemap:` line; IndexNow must be pinged on deploy for changed URLs. | P1 | P1 | Given a deploy that changes `/on/macos`, when complete, then IndexNow receives that URL and the sitemap `lastmod` equals the build date. |
| FR-SEO-04 | Canonicals and indexability: preset pages canonical to self; `/until/*` `noindex`, canonical `/`; `/embed/cook`, `/pip` `noindex`; locale pages canonical to self; no query parameters in canonicals. | P1 | P1 | Given `/until/17-30`, when fetched, then `<meta name="robots" content="noindex">` and canonical `https://awaketab.com/` are present. |
| FR-SEO-05 | Per-page, per-locale OG images (1200×630) must be generated at build with satori + resvg and referenced in `og:image` and `twitter:image`. | P1 | P1 | Given `/es/for/cocinar` (or the localised slug), when fetched, then `og:image` resolves to a locale-specific PNG. |
| FR-SEO-06 | Internal linking must follow hub-and-spoke: each `/for`, `/on`, `/vs`, `/guides`, `/learn` page links to its hub and ≥ 3 siblings; the home page links to all hubs and the support matrix; the tool on content pages links back to `/`. | P1 | P2 | Given the link graph at build, when analysed, then no indexable page has fewer than 4 internal in-links. |
| FR-SEO-07 | Search Console (all 8 locale properties or one domain property), Bing Webmaster Tools and CrUX monitoring must be configured; a rank tracker covers 25 queries × 8 locales weekly. | P1 | P2 | Given week 3, when the tracker runs, then a report exists for all 200 query/locale pairs. |

### 4.10 CONTENT — pages the product ships with

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-CONTENT-01 | The home page must carry the tool above the fold, then sell in few words: six use-case cards that start the tool, the extension, the levels and a closing band, with one link to the docs (`/learn`), which carry how it works, the support matrix, the limits and the FAQ. | P1 | P1 | Given the build, when the text below the tool is counted, then it is 120–1,200 words and the six use cases, `/for`, `/extension` and `/learn` are linked. |
| FR-CONTENT-02 | The 18 `/for/{slug}` pages must each embed the tool with the scenario preset and mode from frontmatter, contain 600–1,000 words, a "What it can't do" section, and a "Last verified" line. | P1 | P2 | Given `/for/night-clock`, when loaded, then the tool starts with `mode=night`… (locked modes preview per FR-AMBIENT-01) and the page states the burn-in and battery limits. |
| FR-CONTENT-03 | The 12 `/on/`, 7 `/vs/`, 8 `/guides/` and 6 `/learn/` pages must exist with the slugs in `00-conventions.md` §7, each 600–1,000 words (`/learn/` may exceed), with tested statements marked by the test date and device. | P1 | P2–P3 | Given `/vs/nosleep-page`, when reviewed, then every claim about nosleep.page cites the observed source line or behaviour and date. |
| FR-CONTENT-04 | `/learn/does-a-wake-lock-keep-teams-green` must state that presence follows input idle, that no source shows a wake lock resets it, and that AwakeTab ships no jiggler; the home FAQ links to it. | P1 | P2 | Given the page, when read, then it contains the test method, date and result, and no workaround suggestion. |
| FR-CONTENT-05 | Trust pages `/about` (real name, testing setup, contact), `/privacy` (every `at.v1.*` key and every event listed; "no ads on the awake screen" statement), `/terms`, `/changelog` (monthly entries), `/support-matrix` (refreshed per major browser release), `/how-we-tested` (≥ 14 browser/OS combos) must ship. | P1 | P1–P3 | Given `/privacy`, when diffed against `00-conventions.md` §6 and §10, then every key and event is described. |
| FR-CONTENT-06 | Content lives in Astro content collections (MDX) per locale with frontmatter `title`, `description`, `preset`, `mode`, `lastVerified`, `hub`, `translationOf`; the build fails on missing required fields. | P1 | P2 | Given a `/for/` MDX file without `lastVerified`, when built, then the build errors with the file path. |

### 4.11 PRO — plans, licences, gates

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-PRO-01 | `/pro` must present `pro_yearly` ($12/year, 12 months + 7-day grace, 5 devices) and `pro_lifetime` ($29 one-time; $19 for the first 90 days after Pro launch), list exactly the gated features, restate what stays free, and link to Polar checkout; `pro_view` and `pro_checkout_click {plan}` fire. Pro is not sold before gate G2. | P2 | P3 | Given a build flag `PRO_ENABLED=false`, when `/pro` is requested, then it shows "coming soon" with no checkout link.<br>Given launch day + 45, when `/pro` renders, then lifetime shows $19 with the original $29 struck through and the end date. |
| FR-PRO-02 | `/pro/activate` must accept a key (pre-filled from `?key=` when present), generate a per-browser `deviceId` (UUID v4 stored in `at.v1.license`), call `POST /api/license/activate` and store the returned token; features unlock without reload; `pro_activated {plan}` fires once per activation. | P2 | P3 | Given a valid key on a 3rd device, when activated, then the response shows `activations: 3/5` and `ambient.packs` is usable immediately. |
| FR-PRO-03 | The token (ES256 JWT, claims `sub, plan, features, dev, iat, exp, ver`) must be verified offline with the public key shipped in `@awaketab/core` on every load; a token failing signature or `dev` mismatch is treated as absent. | P2 | P3 | Given a token edited to add `ads.free`, when verified, then signature fails and no gates unlock. |
| FR-PRO-04 | Re-validation: `pro_yearly` tokens call `POST /api/license/validate` when within 14 days of `exp` and at most daily; `pro_lifetime` tokens re-validate every 90 days. If unreachable, features stay on until `exp` (+ 7-day grace for yearly) and `license.warn.offline` shows once. Lifetime tokens carry `exp` = last validation + 90 days + 30-day offline allowance (**PROPOSED — add to 00-conventions.md**). | P2 | P3 | Given a yearly token 3 days past `exp` and no network, when loaded, then Pro features work and `license.warn.grace` shows.<br>Given 8 days past `exp`, when loaded, then gates lock and settings/stats are intact. |
| FR-PRO-05 | On `{revoked: true}` the client must clear `features`, keep the token record for display, show `license.error.revoked`, and leave all user data intact. | P2 | P3 | Given a refunded order, when the next validate runs, then `at.v1.license.features` is `[]` and `at.v1.settings` is unchanged. |
| FR-PRO-06 | `/pro/manage` must list activations (label, activated date, last validated) and allow deactivating a device via `POST /api/license/deactivate`; a 6th activation returns `device_limit` and `license.error.device_limit`. | P2 | P3 | Given 5 activations, when a 6th key entry is attempted, then the error shows with a Manage devices link, and after deactivating one the retry succeeds. |
| FR-PRO-07 | Gates must be enforced at the feature boundary (not only in UI) for `ambient.packs`, `ambient.message`, `ambient.logo`, `schedules`, `sounds.custom`, `stats.history`, `stats.export`, `pip.pro`, `ext.autostart`, `ext.schedules`, `ads.free`; free features listed in `00-conventions.md` §8.2 must never depend on a token. | P2 | P3 | Given `at.v1.license` deleted, when the tool loads, then every free feature works and every gated feature shows its Pro card.<br>Given a URL `mode=message&msg=hi` without licence, when loaded, then Message mode renders the shared message as a 5-minute preview (FR-AMBIENT-01). |
| FR-PRO-08 | Pro upsell placements are limited to: the idle tool page card, the end-of-session prompt (one line), locked-feature previews, `/pro`, and the ad-free note on content pages; never a modal, never during `held`, never blocking any free action. | P2 | P3 | Given `held`, when observed for a full session, then no Pro element appears until `completed`. |
| FR-PRO-09 | Business licences `biz_embed_site_yearly` ($29/year per domain plus one staging subdomain), `biz_kiosk_site` ($19 one-time per site) and `biz_kiosk_5` ($49 for five) are sold via Polar and stored in KV; they unlock `embed.noattrib` and `kiosk.branding` through `GET /api/embed/config` (embed) and a kiosk key entered in settings (kiosk). | P2 | P3 | Given a licensed domain, when the widget calls config, then `licensed: true, attribution: false`.<br>Given `kiosk.branding`, when `minimal` renders, then the uploaded logo replaces the AwakeTab wordmark. |

### 4.12 ADS — content-page advertising, affiliates, sponsor card

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-ADS-01 | Ad slots may exist only in the content layout used by `/for`, `/on`, `/vs`, `/guides`, `/learn`; the ad loader module must not be imported by tool pages (`/`, preset routes, `/until/*`, `/pro*`, `/pip`, `/embed/*`, `/404`) or the extension. | P2 | P2 | Given the production bundle graph, when analysed in CI, then `lib/ads.ts` is reachable only from the content layout chunk. |
| FR-ADS-02 | Ads activate only after gate G1 via a build-time flag; scripts load after LCP through `requestIdleCallback` (fallback `setTimeout` 2 s); at most 3 units in view, 2–3 fixed-size units plus an optional mobile anchor; ads-to-content ratio ≤ 20 %; every slot has fixed CSS dimensions (CLS 0). | P2 | P2 | Given a content page with ads, when Lighthouse runs, then CLS = 0 and no ad request precedes the LCP timestamp. |
| FR-ADS-03 | No ad refresh under AdSense; from G3, refresh only when network-managed, declared, ≥ 30 s, and in-view. No vignettes, interstitials or auto-play video. | P2 | P2 | Given AdSense active, when a page is open 5 min, then exactly one request per slot is observed. |
| FR-ADS-04 | `ads.free` must remove all slots and the loader before any ad request is made, verified offline from the token. | P2 | P3 | Given `ads.free`, when a content page loads, then zero requests go to ad domains and the "Ad-free with Pro" note is hidden. |
| FR-ADS-05 | Content pages with ads must load a Google-certified consent management platform for EEA/UK/CH visitors and disclose Google cookies on `/privacy`; tool pages stay cookie-free with no CMP (**PROPOSED — record the CMP choice in 00-conventions.md §3**). | P2 | P2 | Given a visitor with an EU IP on `/for/cooking`, when loaded, then the CMP prompt precedes any ad request; given `/`, no CMP or cookie is set. |
| FR-ADS-06 | Kill switch: if CrUX field INP > 200 ms or CLS > 0.1 on content pages for 7 days, the build flag drops to one unit until fixed; the check runs weekly in CI. | P2 | P2 | Given a CrUX export breaching the threshold, when the weekly job runs, then a PR is opened setting `ADS_MAX_UNITS=1`. |
| FR-ADS-07 | Affiliate cards (tablet stands, kitchen holders, phone mounts) may appear on relevant content pages with an "Affiliate link" disclosure, using Amazon Associates India or Geniuslink; never on tool pages. | P2 | P2 | Given `/for/cooking`, when rendered, then the card carries the disclosure text and `rel="sponsored nofollow"`. |
| FR-ADS-08 | Sponsor card (after G5): one first-party, static, disclosed "Sponsored" card on the tool page in `idle`, `held` and `fallback`; one sponsor at a time; product-consistent categories only; never mouse-jiggler or "stay online" vendors; no third-party script; `sponsor_view` (once per session) and `sponsor_click`. | P3 | P4 | Given the sponsor card enabled, when the tool page loads, then no third-party request is made and the card includes the word "Sponsored". |

### 4.13 EXT — AwakeTab for Chrome

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-EXT-01 | The extension (WXT, Manifest V3) must keep the display awake with `chrome.power.requestKeepAwake('display')` and release with `releaseKeepAwake()`; the popup shows the ring, the seven-state pill equivalent (`held` = "Screen awake") and presets `p15`…`pinf`; the toolbar badge shows remaining minutes or "ON". | P1 | P2 | Given the popup toggle on, when the browser is minimised for 10 min, then the display stays on and the badge reads "ON" or the minutes left. |
| FR-EXT-02 | The extension must offer a level choice: Display (default) and System (`'system'` — prevents system sleep, lets the screen dim), each with one-line honest descriptions; timers use `@awaketab/core` plans and end with a notification. | P1 | P2 | Given System level, when selected, then the description states the screen may turn off while the computer stays awake. |
| FR-EXT-03 | Permissions must be limited to `power`, `storage`, `alarms` and `notifications`; no host permissions, no remote code, no analytics in v1; the listing and `/extension` state exactly: works while Chrome is running, including hidden tabs and minimised windows; does not prevent lid-close sleep. | P1 | P2 | Given the manifest, when reviewed, then only those four permissions are declared. |
| FR-EXT-04 | Pro in the extension: a key entered in Options activates as a device (counts toward 5), token verified offline; `ext.autostart` keeps the display awake whenever Chrome starts; `ext.schedules` (later) runs weekday schedules. | P2 | P3 | Given `ext.autostart` and Chrome relaunched, when the background worker starts, then keep-awake is requested within 2 s and the badge shows "ON". |
| FR-EXT-05 | Publish to the Chrome Web Store and Edge Add-ons under the manifest name "AwakeTab: Keep Screen Awake" (short name "AwakeTab"; Edge shows the same manifest name), while the website and running text call the product "AwakeTab for Chrome"; `/extension` detects Firefox and explains the missing `power` API rather than offering an install. | P1 | P2 | Given Firefox on `/extension`, when loaded, then the install button is replaced by the explanation and a link to `/on/firefox`. |

### 4.14 EMBED — Cook Mode widget

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-EMBED-01 | `/embed/cook` (noindex) must render Cook Mode in an iframe-friendly layout with a Start gesture, big countdown, Pause/+5 min, the pill, and an attribution link "Powered by AwakeTab" unless `embed.noattrib`; total JS ≤ 20 KB gz; no ads ever. | P2 | P3 | Given a fresh load, when measured, then transferred JS ≤ 20 KB and the attribution link is visible and keyboard-focusable. |
| FR-EMBED-02 | The widget must call `GET /api/embed/config?domain={parentHost}` (cached 5 min) and apply `{licensed, attribution, theme, expiresAt}`; the parent host is read from `document.referrer` origin or `ancestorOrigins`; a licensed domain matches itself and one declared staging subdomain. | P2 | P3 | Given `staging.blog.example` declared for `blog.example`, when loaded there, then `licensed: true`. |
| FR-EMBED-03 | Wake lock inside the iframe requires the host's `allow="screen-wake-lock"`; on `NotAllowedError` with cause `policy` the widget must show `embed.error.allow` and the "Open in AwakeTab" link (`/for/cooking?ref=embed`) and never a fake awake state. | P2 | P3 | Given an iframe without `allow`, when Start is tapped, then the fix copy appears and the pill shows "Blocked — here's the fix". |
| FR-EMBED-04 | Supported params: `preset`, `theme`, `msg` (≤ 80 chars, text node), `lang`; the snippet on `/embed` includes `loading="lazy"`, fixed `width`/`height` or `aspect-ratio`, `title`, and `allow="screen-wake-lock"`; a WordPress-friendly copy button is provided. | P2 | P3 | Given the snippet pasted into a static HTML page, when loaded, then no layout shift occurs and the widget starts on tap. |
| FR-EMBED-05 | On an `http:` parent page the widget must detect the insecure context (`window.isSecureContext` false) and show `embed.error.insecure` instead of attempting a lock. | P2 | P3 | Given `http://blog.example` embedding the widget, when loaded, then the insecure message shows and no request is issued. |
| FR-EMBED-06 | The widget must emit `session_start {source: 'embed'}` and `session_end` through `POST /api/e` with the parent origin only (no path), and honour the parent's `prefers-color-scheme` when `theme=auto`. | P2 | P3 | Given an embed session, when events are inspected, then `path` is `/embed/cook` and no parent path is present. |

### 4.15 LIB — @awaketab/wake and @awaketab/core

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-LIB-01 | `@awaketab/wake` must export `createWakeLock({ fallback?: boolean, video?: string })` returning `{ request(), release(), state, on(event, cb) }` with the seven states, `change` events `{from, to, reason}`, automatic re-request on visibility, zero dependencies, ESM + CJS + `.d.ts`, ≤ 3 KB gz, MIT, SSR-safe (no `window` access at import). | P2 | P3 | Given `import` in a Node test, when evaluated, then no `ReferenceError` occurs.<br>Given the published tarball, when measured, then the ESM entry is ≤ 3 KB gz. |
| FR-LIB-02 | `@awaketab/core` must contain the session engine (plans, ticks, end reasons), presets, stats logic (local day keys, streaks), storage schema with `migrate(fromVersion)`, licence token verification, and the `BroadcastChannel('awaketab')` protocol, and be the single engine used by the web island, `/pip`, `/embed/cook` and the extension. | P2 | P3 | Given the four consumers, when the dependency graph is checked, then none implements its own tick or state machine. |
| FR-LIB-03 | `/library` must host a live demo, the README support matrix, install snippets, a comparison with NoSleep.js (`/learn/nosleep-js-vs-wake-lock`), and GitHub Sponsors link; releases use changesets and semantic versioning with a CHANGELOG. | P2 | P3 | Given a version bump, when released, then npm, GitHub release and `/changelog` all show the same version. |
| FR-LIB-04 | Both packages must ship unit tests (Vitest) and browser tests (Playwright chromium/firefox/webkit) covering all transitions, with ≥ 90 % line coverage on the state machine. | P2 | P3 | Given CI, when tests run, then the transition matrix in `04-engine-spec.md` is fully exercised. |

### 4.16 API — Pages Functions

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-API-01 | `POST /api/e` must accept ≤ 20 events and ≤ 8 KB per request, validate event names against the §10 list, write to Workers Analytics Engine, return 204, and rate-limit by a salted IP hash that is never stored beyond the limiter window. | P1 | P1 | Given 21 events, when posted, then 413 is returned and nothing is written.<br>Given an unknown event name, when posted, then it is dropped and the rest accepted. |
| FR-API-02 | `POST /api/license/activate`, `/validate`, `/deactivate` must behave as in `00-conventions.md` §9, returning JSON error codes `invalid_key`, `device_limit`, `revoked`, `expired`, `rate_limited`, and sign tokens with ES256 using a key held only in Cloudflare secrets. | P2 | P3 | Given a key with 5 activations, when activating a 6th `deviceId`, then 409 `{error: 'device_limit'}`.<br>Given an existing `deviceId`, when re-activated, then the same slot is reused. |
| FR-API-03 | `POST /api/webhooks/polar` must verify the HMAC signature, be idempotent by event id, store licences in KV keyed by licence key, and handle `order.created`, `subscription.*`, `benefit_grant.*`; unverified requests return 401 and are not logged with bodies. | P2 | P3 | Given the same event delivered twice, when processed, then KV holds one record. |
| FR-API-04 | `GET /api/embed/config?domain=` must be public, `Cache-Control: public, max-age=300`, CORS `*` for GET, and return `{licensed:false, attribution:true, theme:'auto', expiresAt:null}` for unknown domains without error. | P2 | P3 | Given an unknown domain, when requested, then 200 with the default body. |
| FR-API-05 | `GET /api/health` returns `{ok, version}`; all `/api/*` responses are JSON with `Cache-Control: no-store` except embed config; CORS for licence endpoints is restricted to `https://awaketab.com` and the extension origin; no PII is logged. | P1 | P1 | Given a request from `https://evil.example`, when sent to `/api/license/validate`, then the CORS preflight is rejected. |

### 4.17 ANALYTICS — first-party events

| ID | Requirement | Pri | Phase | Acceptance criteria |
|---|---|---|---|---|
| FR-ANALYTICS-01 | The client must emit only the events in `00-conventions.md` §10 with the common fields `ts`, `path` (no query), `locale`, `ua` class, `viewport` class, `sid` (per-tab, not persisted), `ver`; never IP, user id, exact UA or full referrer. | P1 | P1 | Given any payload in CI fixtures, when validated against the schema, then no disallowed field is present. |
| FR-ANALYTICS-02 | Events must batch (flush every 10 s or at 20 events) and use `navigator.sendBeacon` on `pagehide`; failures are dropped, never retried beyond one attempt. | P1 | P1 | Given a tab closed with 3 queued events, when observed at the server, then those events arrive in one beacon. |
| FR-ANALYTICS-03 | `at.v1.settings.telemetry` (default on, because no PII is collected) must disable every event including `page_view` when off; the toggle is in settings and `/privacy`. | P1 | P1 | Given telemetry off, when the tool is used for a session, then zero requests to `/api/e` occur. |
| FR-ANALYTICS-04 | `client_error {code}` is sampled at 10 % and carries only a short code, never stack traces or URLs with parameters; `ref=` is used only for `session_start.source` and never stored. | P1 | P1 | Given 100 identical errors, when observed, then ≈ 10 events arrive with `code` only. |

---

## 5 Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-PERF-01 | Tool pages: JS ≤ 40 KB gz total, ≤ 15 KB in the critical path; CSS ≤ 20 KB gz with critical CSS inlined; 0 third-party requests; fonts self-hosted only (Geist, Geist Mono, Space Grotesk digits; redesign decision D-R26), swap over metric-matched fallbacks, CLS 0. | Bundle size check and request count in CI (Playwright) |
| NFR-PERF-02 | LCP ≤ 1.2 s lab (mobile emulation) and field p75 ≤ 2.0 s; INP field p75 ≤ 100 ms; CLS 0; Lighthouse mobile Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100. | Lighthouse CI on every PR; CrUX monthly |
| NFR-PERF-03 | Wake lock time-to-request ≤ 300 ms after `DOMContentLoaded` when auto-start conditions hold. | Playwright performance mark |
| NFR-PERF-04 | Content pages: total JS ≤ 60 KB before ads; ad scripts after LCP. | Lighthouse CI on `/for/cooking` |
| NFR-PERF-05 | Availability 99.9 % for static pages, 99.5 % for `/api/*`; the tool and offline verification of licences work when `/api/*` is down. | Cloudflare analytics; chaos test with API blocked |
| NFR-A11Y-01 | WCAG 2.2 AA across all pages: contrast ≥ 4.5:1 (3:1 large text, including `night` mode digits), target size ≥ 24×24 CSS px, focus visible, no keyboard traps (fullscreen, PiP, modals), state never conveyed by colour alone. | axe-core zero violations; manual audit per `13-testing-strategy.md` |
| NFR-A11Y-02 | Screen-reader behaviour: pill changes announced politely; countdown per FR-UI-08; toasts in one `aria-live="polite"` region that turns `assertive` while an error shows; all controls labelled in every locale. | NVDA + VoiceOver pass recorded per release |
| NFR-A11Y-03 | `prefers-reduced-motion` disables ring animation, title flash becomes a single change, and pixel shift repositions instantly. | Playwright with emulated media |
| NFR-SEC-01 | Response headers on every page: `Content-Security-Policy` (default-src 'self'; content pages add the ad and CMP origins only), `Strict-Transport-Security` with preload, `Permissions-Policy: screen-wake-lock=(self)` (plus `picture-in-picture=(self)` and `microphone=(self)` for notes dictation; camera, geolocation and payment off), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'` except `/embed/*` which allows any origin. | Header check in CI against `_headers` |
| NFR-SEC-02 | `msg=` and every URL parameter are rendered as text nodes; no `innerHTML` with user data; licence signing key only in Cloudflare secrets; webhook bodies never logged. | Code review checklist; CodeQL |
| NFR-SEC-03 | Rate limiting on all `POST /api/*`; activation attempts ≤ 10/min per IP hash; validate ≤ 60/day per token. | Unit tests on limiter |
| NFR-PRIVACY-01 | No cookies and no CMP on tool pages; no PII anywhere; all user state in `localStorage` under `at.v1.*`; analytics first-party with telemetry toggle; IP hashed with a rotating salt for rate limiting only and never stored; `/privacy` lists every key and event. | Cookie audit in Playwright; `/privacy` diffed against conventions |
| NFR-PRIVACY-02 | Content pages with ads set cookies only after CMP consent where required; `/privacy` discloses Google's role; Pro (`ads.free`) removes them. | Manual audit with EU VPN |
| NFR-COMPAT-01 | Native lock on Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4, iOS Home-Screen app ≥ 18.4; fallback on older versions; UI tested on the last 2 versions of each; Android Chrome, Samsung Internet, iPadOS Safari included in the matrix. | Playwright (chromium/firefox/webkit) + real-device matrix in `/how-we-tested` |
| NFR-COMPAT-02 | Document PiP: Chrome/Edge ≥ 116; Battery API: Chromium only; Notification API: not in iOS Safari tabs (installed web apps only); each feature is detected, never sniffed by UA for behaviour (UA class is used for copy only). | Feature-detection review |
| NFR-I18N-01 | Every string externalised; 100 % key parity across 8 locales enforced in CI; native review sign-off before indexability; no text in images; layouts survive 200 % text length (de, hi) and CJK line breaking. | i18n lint; visual regression at 200 % |
| NFR-SEO-01 | Static HTML for all indexable pages; canonical, hreflang and `x-default` reciprocal; sitemap index with `lastmod`; per-page OG image; no indexable URL with query parameters; 301 from all alternate domains and `www`. | SEO lint in CI; Screaming Frog crawl monthly |
| NFR-OPS-01 | Preview deploy per PR; production via Cloudflare Pages Git integration; rollback within 5 minutes by redeploying the previous build; release notes in `/changelog`. | `14-devops.md` runbook |

---

## 6 Content requirements summary

Details, outlines and keyword maps live in `06-content-seo-spec.md`. Every content page embeds the tool with a preset and mode set in frontmatter, has a "Last verified" line, and follows FR-SEO-01.

| Page type | Count (EN) | Words | Must contain |
|---|---|---|---|
| Home `/` | 1 | 120–1,200 below the tool | Tool above the fold; six use cases; extension showcase; choose your level; closing band with the docs link (the story moved to `/learn`) |
| Preset pages `/15m`…`/8h` | 7 | 150–300 | Tool auto-started with the duration; one paragraph on typical uses; links to `/for/` scenarios; canonical self |
| `/for/{slug}` | 18 | 600–1,000 | Scenario problem in the first 100 words; recommended preset and mode; step list; "What it can't do"; device notes; 2–3 related scenarios |
| `/on/{slug}` | 12 | 600–1,000 | Support status for that device/browser with version; native vs fallback; OS-specific sleep settings; installed-app notes (iOS 18.4) |
| `/vs/{slug}` | 7 | 600–1,000 | Feature comparison table; honest cases where the alternative is better; verified claims with dates; no fabricated shortcomings |
| `/guides/{slug}` | 8 | 600–1,000 | OS how-to with screenshots (alt text), version tested, and where AwakeTab helps or does not |
| `/learn/{slug}` | 6 | 800–2,000 | Original research or developer guidance; method, devices, dates, results; code samples for the API guide |
| Trust pages | 6 | varies | `/about` real author; `/privacy` complete key/event list; `/terms`; `/changelog` monthly; `/support-matrix`; `/how-we-tested` ≥ 14 combos |
| Product pages | 4 | 400–800 | `/extension`, `/embed`, `/kiosk`, `/library` with install/snippet, limits, pricing where relevant |

Locales: home and UI in all 8 at P1; `/for` top 10 with hreflang at P2; remaining pages at P3; phase-2 locales in P4.

---

## 7 Analytics and success metrics

| KPI | Definition | Events used | Target |
|---|---|---|---|
| Lock success rate | `held` or `fallback` reached ÷ sessions started | `lock_state`, `session_start`, `lock_denied {reason}`, `fallback_used` | ≥ 97 % on supported browsers |
| Denied rate by cause | `lock_denied` ÷ `session_start` grouped by reason | `lock_denied` | Trend; investigate any cause > 2 % |
| Fallback share | `fallback_used` ÷ `session_start` | `fallback_used` | Declining as browsers update |
| Completion rate | `session_end {reason: 'completed'}` ÷ `session_end` | `session_end` | ≥ 60 % |
| Median session length | median `durationMin` | `session_end` | Report only |
| Resume acceptance | `resume_accepted` ÷ `resume_shown` | `resume_shown`, `resume_accepted` | ≥ 70 % |
| Return rate (O5) | visitors with `at.v1.meta.installedAt` older than 1 day ÷ visitors | `page_view` (client sets a `returning` flag class) | ≥ 25 % by Day 90 |
| PWA installs | `pwa_install` ÷ unique visitors | `pwa_install` | ≥ 1 % |
| PiP usage | `pip_open` ÷ `session_start` on desktop | `pip_open` | Report only |
| Pro funnel | `pro_view` → `pro_checkout_click {plan}` → `pro_activated {plan}` | those three | Activations ÷ uniques 0.06–0.35 % |
| Rating quality | distribution of `rating_prompt {action}` | `rating_prompt` | ≥ 4.5 average; feeds `aggregateRating` |
| Extension interest | `extension_click` ÷ `page_view` on `/extension` and `/` | `extension_click` | Report only |
| Ad health | `ad_slot_loaded {page}` vs CrUX INP/CLS on content pages | `ad_slot_loaded` | CLS 0, INP ≤ 100 ms |
| Sponsor CTR | `sponsor_click` ÷ `sponsor_view` | both | ≥ 0.5 % (after G5) |
| Error rate | `client_error {code}` × 10 ÷ `page_view` | `client_error` | < 0.5 % |
| Share rate | `share_click` ÷ `session_start` | `share_click` | Report only |

Dashboards are SQL over Workers Analytics Engine, reviewed weekly; Search Console and rank tracking supply O1, O3, O6; GitHub supplies O7.

---

## 8 Release criteria per phase

**P0 exit (days 1–3).** All four domains 301 to `https://awaketab.com`; holding page with correct title, description, OG image, `Organization` + `WebSite` schema; Search Console verified; repo with `00-conventions.md`.

**P1 exit — launch (weeks 1–2). Every item blocks.**

1. FR-ENGINE-01…08, FR-ENGINE-11, FR-ENGINE-12 pass e2e on chromium, firefox, webkit and on real Windows 11 Edge, macOS Safari, Android Chrome, iOS Safari (tab and installed).
2. The pill never lies: a 24-hour soak test on each engine shows zero instances of "Screen awake" without a sentinel or playing fallback.
3. FR-TIMER-01…08, FR-UI-01…10, FR-UI-13, FR-UI-15, FR-STATS-01, FR-STATS-02, FR-PWA-01…04, FR-I18N-01…05 (home + UI), FR-SEO-01…05, FR-CONTENT-01, FR-CONTENT-05 (`/about`, `/privacy`, `/terms`, `/support-matrix`), FR-API-01, FR-API-05, FR-ANALYTICS-01…04 complete.
4. NFR-PERF-01…03, NFR-A11Y-01…03, NFR-SEC-01…02, NFR-PRIVACY-01, NFR-I18N-01 verified in CI; Lighthouse mobile ≥ 95 / 100 / 100 / 100.
5. Zero third-party requests on tool pages; zero `alert(` in source; zero axe violations.
6. All 8 locales of the home page signed off by native reviewers; unsigned locales carry `noindex`.
7. Donate links live (G0); no ads, no Pro elements in the bundle.
8. `/privacy` matches `00-conventions.md` §6 and §10 exactly.

**P2 exit (weeks 3–5).** 60 English URLs indexed in GSC; `/for`, `/on`, `/guides` live with tool + preset; hreflang on the top 10 pages; FR-EXT-01…03, FR-EXT-05 approved on the Chrome Web Store (Edge submitted); FR-SEO-06…07; `/vs/nosleep-page` live; AdSense approved and FR-ADS-01…03, FR-ADS-05…07 in place (G1); ≥ 10 referring domains; Show HN and Product Hunt posted.

**P3 exit (weeks 6–9).** FR-AMBIENT-01…08, FR-TIMER-06 prompt polish, FR-ENGINE-09…10, FR-STATS-03…05, FR-PIP-01…03, FR-UI-11…12, FR-UI-14 live; `@awaketab/wake` and `@awaketab/core` published (FR-LIB-01…04); `/learn/*` and `/how-we-tested` live; FR-EMBED-01…06 live with `/embed`; FR-PRO-01…09, FR-API-02…04, FR-ADS-04 live and CA confirmation on file (G2); FR-EXT-04; remaining locale content in progress; return rate measured.

**P4 (ongoing).** Gate checks G3–G5 monthly; support-matrix refresh per major browser release; monthly `/changelog`; FR-TIMER-09, FR-ADS-08, phase-2 locales as gates and capacity allow.

---

## 9 Edge cases and error handling

| # | Situation | Detection | Required behaviour | Copy / event |
|---|---|---|---|---|
| 1 | Tab hidden or window minimised | sentinel `release` event; `visibilitychange` | State `lost`; countdown continues on wall clock; re-request on visible; title "Paused — AwakeTab" | Pill `lost`; `lock_state` |
| 2 | Device locked or OS sleep while `held` | `release` plus tick gap > 2 min | Treat as `lost`; on wake recompute remaining from `Date.now()`; if `endsAt` passed, end `completed` | `toast.clock_jump` if session continues |
| 3 | Battery saver (Android/Windows/macOS Low Power) rejects request | `NotAllowedError` on visible top-level page | `denied` with cause `battery_saver`; fix panel with OS steps; Retry re-requests | `toast.denied.battery`; `lock_denied {reason: 'battery_saver'}` |
| 4 | iOS Low Power Mode with lock granted | rAF heuristic (FR-ENGINE-11) | Stay `held`; one informational toast; link to `/learn/low-power-mode-and-wake-locks` | `toast.lowpower` |
| 5 | Iframe without `allow="screen-wake-lock"` | probe: cross-origin frame + `document.featurePolicy`/`permissions` check, or `NotAllowedError` | Predict/enter `denied` cause `policy`; show fix for site owner; never fake | `embed.error.allow` / `toast.denied.policy` |
| 6 | DST change during an `until` plan | `until` recomputed each tick against local wall clock | Countdown targets the clock time, so remaining time jumps by ± 1 h; UI shows the absolute end time to make this legible | — |
| 7 | Timezone change (travel) during `until` | `Intl.DateTimeFormat().resolvedOptions().timeZone` differs from stored on tick | Keep `endsAt` as the local wall-clock time in the new zone (recompute); show the end time with zone abbreviation once | `toast.clock_jump` variant |
| 8 | Multiple tabs open | `BroadcastChannel('awaketab')` heartbeat every 5 s | Only the first holds the lock; others show the notice; take-over transfers; a tab whose heartbeat stops for 15 s releases its claim | `notice.second_tab`, `toast.moved` |
| 9 | `localStorage` disabled or full (private mode, quota) | `try/catch` on every read/write | In-memory fallback for the session; stats not persisted; one toast; never a crash | `toast.storage.unavailable`; `client_error {code: 'storage'}` |
| 10 | `localStorage` cleared mid-session | read returns null on tick | Continue in memory; re-write settings from defaults; licence gates lock (features recheck) | Silent; `client_error {code: 'storage_reset'}` |
| 11 | Service worker update during an active session | `updatefound` / waiting worker | Do not reload; `toast.update_ready`; apply on next navigation or user Reload | `toast.update_ready` |
| 12 | Notification permission denied or unavailable (iOS tab) | `Notification.permission`, API absent | Chime + title flash still fire; settings shows why notifications are unavailable; never re-prompt | `toast.notifications.denied` |
| 13 | Autoplay blocked for the video fallback | `play()` rejects | Stay `unsupported`; ask for one more tap; never claim `fallback` | `toast.unsupported.autoplay` |
| 14 | PiP unsupported (Firefox, Safari, Chrome < 116) | `'documentPictureInPicture' in window` false | Hide or disable PiP button; `P` shows toast pointing to fullscreen | `toast.pip.unsupported` |
| 15 | Licence offline > 90 days (lifetime) | `lastValidatedAt` + 90 d + 30 d < now with validate unreachable | Features stay on until the computed `exp`, then lock gracefully; data intact; re-activate when online | `license.warn.offline`, then Pro card |
| 16 | Licence revoked (refund/cancel) | validate → `{revoked: true}` | Clear `features`, keep record; toast; no data loss | `license.error.revoked` |
| 17 | Sixth device activation | `POST /api/license/activate` → 409 `device_limit` | Show error with Manage devices link; after deactivation retry succeeds | `license.error.device_limit` |
| 18 | Polar webhook delayed (key not yet in KV) | activate → `invalid_key` within 10 min of purchase (Polar `?key=` present) | Show "Your purchase is still syncing. Retry in a minute."; client retries every 30 s for 10 min | `license.error.invalid` variant (PROPOSED key `license.info.syncing`) |
| 19 | Ad blocker present on content pages | ad script load error or empty slot after 3 s | Collapse slot to zero height without layout shift (reserved space becomes content spacer); never show "disable your ad blocker"; no effect on tool | `ad_slot_loaded` absent |
| 20 | Embed on an `http:` page | `window.isSecureContext === false` | Show insecure message; offer "Open in AwakeTab"; no request | `embed.error.insecure` |
| 21 | `msg=` with HTML/script or > 80 chars | length and rendering path | Truncate to 80 chars; render as text node; never `innerHTML` | — |
| 22 | Session > 24 h (`indefinite` or multi-day `custom`) | tick at 24 h and daily | Display days in the countdown; burn-in toast once per 24 h; stats split per local day | `toast.long_session` |
| 23 | System clock skew or clock set backwards during a session | tick sees `Date.now()` < last tick − 2 s | For `duration` plans, recompute `endsAt = now + remaining` at the moment of detection; for `until`, follow the wall clock; log | `client_error {code: 'clock_skew'}` |
| 24 | `prefers-reduced-motion` | media query | No ring animation; single title change; instant pixel shift; chime unaffected | — |
| 25 | Screen reader user | assistive tech | Pill and countdown per FR-UI-01/08; extend prompt focus moves to first action; PiP and fullscreen announced; shortcuts overlay reachable via `?` and a visible button | — |
| 26 | Rapid toggling (Space pressed repeatedly) | request in flight | Debounce: ignore toggles while `requesting`; the final state after settle is what the pill shows | — |
| 27 | Sentinel released during `requesting` (rare race) | `release` before promise settles | Treat as `lost`; schedule re-request; never `held` | `lock_state {from: 'requesting', to: 'lost'}` |
| 28 | `autostart=1` in a hidden tab (opened in background) | `document.visibilityState === 'hidden'` at load | Defer the request until visible; pill `idle` with "Starts when you open this tab" secondary line (PROPOSED key `tool.pill.idle.deferred`) | — |

---

## 10 Open questions and decisions log

### 10.1 Decisions taken (with source)

| Date | Decision | Source |
|---|---|---|
| 2026-09-06 | Monetization: Pro primary; ads content pages only; no Google ads on the awake screen; sponsor card only at G5 | `awaketab-blueprint.md` §11 |
| 2026-09-07 | Seven lock states and their pill copy; only `held`/`fallback` show a running timer | `00-conventions.md` §5.1 |
| 2026-09-07 | Stats keyed by local date via `Intl.DateTimeFormat('en-CA')`; 365-day retention | `00-conventions.md` §6 |
| 2026-09-07 | Toasts, never `alert()`; own fallback video, no NoSleep.js | This PRD FR-UI-03, FR-ENGINE-05 |
| 2026-09-07 | Telemetry default on with one-click off, justified by zero PII | This PRD FR-ANALYTICS-03 |
| 2026-09-07 | `8h` route maps to a 480-min `custom` plan (no `p480` preset) | This PRD FR-TIMER-05 |

### 10.2 Open questions

| # | Question | Options | Owner | Needed by |
|---|---|---|---|---|
| Q1 | Confirm product name AwakeTab (vs NeverDim) and register domains | AwakeTab / NeverDim | Soubhik | P0 day 1 |
| Q2 | Open-source scope: engine + library MIT only, or whole repo | Packages only / whole repo | Soubhik | P1 |
| Q3 | Stack confirmation: Astro 5 + Cloudflare (canonical) vs Next.js + Vercel | Keep canonical | Soubhik | P0 |
| Q4 | Analytics: first-party beacon (canonical) vs Cloudflare Web Analytics vs Plausible | Keep canonical; revisit at G3 | Soubhik | P1 |
| Q5 | `lost_timeout` threshold (PRD proposes 6 h) | 2 h / 6 h / 24 h | Soubhik | P1 |
| Q6 | `custom` maximum (PRD proposes 7 days) | 24 h / 7 d / 30 d | Soubhik | P1 |
| Q7 | Add `cook` to the free ambient list in `00-conventions.md` §8.2 | Yes (recommended: it powers the free embed) / no | Soubhik | P3 |
| Q8 | Lifetime token offline allowance (PRD proposes 90 + 30 days) | 30 / 60 / unlimited | Soubhik | P3 |
| Q9 | CMP vendor for content pages in EEA/UK (Google Privacy & messaging vs third party) | Google's / other | Soubhik | G1 |
| Q10 | Extension System level (`'system'`) in v1 or Display only | Both / Display only | Soubhik | P2 |
| Q11 | Battery auto-stop default threshold and default state | 10 % on / 15 % on / off by default | Soubhik | P3 |
| Q12 | Should `/for/*` pages auto-start on first visit or require one tap (to avoid surprising users arriving from search) | Auto-start (consistent with `/`) / tap on content pages | Soubhik | P2 |
| Q13 | Rating prompt "Not now" cadence (PRD proposes re-ask after 20 sessions) | 20 / 50 / never | Soubhik | P3 |
| Q14 | Legal name for `/terms` and Polar seller profile | Pending CA | Soubhik / CA | G2 |
| Q15 | Second-tab heartbeat and claim timeout (PRD proposes 5 s / 15 s) | Confirm | Soubhik | P3 |

### 10.3 Proposed additions to `00-conventions.md` (from this PRD)

- `lost_timeout` threshold value (default 6 h) — FR-ENGINE-12.
- `custom` maximum duration (7 days) — FR-TIMER-02.
- `cook` in the free ambient list — FR-AMBIENT-01.
- Lifetime token offline allowance (90 + 30 days) — FR-PRO-04.
- CMP vendor for content pages — FR-ADS-05.
- i18n keys `license.info.syncing` and `tool.pill.idle.deferred` — §9 rows 18 and 28.
- Extension permission list (`power`, `storage`, `alarms`, `notifications`) — FR-EXT-03.

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-09-07 | Initial PRD derived from `awaketab-blueprint.md`, `00-conventions.md` and `01-brd.md` |
