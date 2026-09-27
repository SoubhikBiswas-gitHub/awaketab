# Growth and conversion research

Status: research input, not a spec · 2026-09-26 · Author: growth & conversion research agent (wave 4) · Owner: Soubhik

Scope: the path from first visit to Pro for the five personas, the activation and retention levers that fit a calm, honest utility, monetisation (what to sell, where to ask, how to price), measurement, experiments, and a prioritised action list. Nothing here changes a contract by itself: every item that touches pill copy, storage keys, routes, ad placement, budgets, tokens or zero hydration needs the docs update named in `CLAUDE.md` first.

Evidence labels used throughout:

- **[Fact]** verified in the repo (file named) or in an external source (listed in §8 with URL and access date).
- **[Estimate]** a number I derived; the inputs are shown.
- **[Opinion]** a judgement call, argued but not proven.

---

## Summary for the owner

1. **Pro is currently selling two things that do not exist on the web.** `schedules` (web weekly schedules) and `sounds.custom` (custom end sounds) are in the Pro plan, but no web code checks those gates and there is no UI for them. The tool's Pro sheet says "ambient packs, schedules, 12-week stats", and the redesigned `/pro` board sells "Your own end sound". Build them or stop selling them before production checkout goes live. Anything else is a refund and trust risk.
2. **The live `/pro` page is two price cards and a refund note.** It lists no features, says nothing about what stays free, and has no FAQ or Business section. The redesign board (`Pro.dc.html`) fixes this with sections per persona, a "What stays free" list and a FAQ. Ship that structure first. It is the biggest conversion lever we can pull without asking anyone anything.
3. **We cannot tell which feature sells Pro.** Links to `/pro` from inside the tool carry no `?ref=`, and `/pro` does not read it. Also, `/pro` and `/pro/activate` send events even when the user has turned telemetry off (they hard-code `telemetry: true`). That breaks the privacy promise in docs/18 §10. Fix both before launch.
4. **The best honest cross-sell is already visible on screen.** When the pill says "Paused — tab hidden", the web app has hit its real limit. For Lena and Kenji the extension is the fix. Today nothing in the tool points to it, and the store links are search placeholders. Once the listing is live, add one quiet line after the user comes back to the tab, on Chromium desktop only.
5. **Keep the awake screen free of asks.** No Pro, install or share prompts while a session is starting, held, paused or blocked. Upgrade moments belong in four places only: when a user reaches for a gated control, on the Done screen after the lock is released (at most one line, capped), on `/pro`, and on the Business pages.
6. **The sponsor card contradicts our public promise.** `/pro` says the awake screen "stays honest and ad-free either way" and the extension page says "No ads on the awake screen, now or later". Yet docs/09 §4 puts a "Sponsored" card on the awake screen in `held`, and Pro (`ads.free`) removes it, which amounts to paying to remove an ad from the awake screen. I recommend dropping it from the awake screen. At realistic click-through rates it is worth little (§4.6).
7. **Pricing: keep $12/year and a lifetime plan, but drop the struck-through "$29".** No one has ever been charged $29, so a strike-through reads as a fake former price (US FTC 16 CFR 233.1). Say "Launch price $19 until 8 December 2026, then $29 once". The redesign board already words it this way. Lead with lifetime for this audience: the nearest paid rival, Lungo, is a $4 one-time purchase, and Amphetamine is free with "no pro version".
8. **Let people try the Pro features before they pay, without timers on the awake screen.** Today, Message mode can only be previewed through a shared link, and the `M` key skips it. Offer the 60-second preview from Message mode itself once a day, add a live "try your own message" on `/pro`, and let users preview Pro lamp colours while Settings is open. Free stats data older than 7 days is already kept on the device, so say that Pro shows it at once.
9. **Retention: make coming back effortless, not guilt-driven.** Remember the user's usual setup, include mode, face and message in shared links, offer install on the Done screen after the second completed session, and offer an email-free calendar reminder (.ics) for Lena's weekly lecture. Replace "0 days streak" with "Days used this week". Research shows a broken streak lowers later engagement.
10. **Conversion expectation [Estimate]: 0.05–0.45% of monthly uniques, central about 0.15%.** That is roughly 1.6 orders and about $24 net per 1,000 uniques, the same as the docs/09 base case. This matches the docs/09 band (0.06–0.35%). Most of the variance depends on how many search visitors come back more than once, which we do not measure yet.
11. **Measure returning visits without IDs.** Add a coarse `visit` bucket (new / returning within 1–7 / 8–30 / 30+ days) to `page_view`, derived locally from `at.v1.meta.installedAt`. It is not joinable and not a user ID. It unlocks the retention objective in the BRD (O5, ≥ 25%), which docs/18 currently says it cannot measure.
12. **Most price A/B tests are impossible at launch traffic.** Detecting a move from 0.15% to 0.20% needs roughly 96,000 visitors per arm [Estimate]. Test page structure and click-through to checkout first (higher base rates), and alternate weekly as docs/18 already does. The top ten experiments are in §5.4.

---

## 1. What the repo does today (facts that shape the funnel)

| # | Finding | Evidence (repo) | Why it matters |
|---|---|---|---|
| F1 | `/pro` renders two cards (`$12 / year`, `$19 once` with struck `$29`), "Enter licence key", a refund alert and two nav links. No feature list, no "what stays free", no FAQ, no Business plans | `apps/web/src/pages/pro.astro` | Visitors cannot see what they are buying. NN/g: make the differences between options explicit [Fact, NN/g 2024] |
| F2 | Gates `schedules` and `sounds.custom` are in `PLAN_FEATURES`, but nothing in `apps/web/src/tool` calls `hasFeature` for them. The End sound setting offers only Chime / None. Copy that sells them: `pro.card` "ambient packs, schedules, 12-week stats", `page.pro.description` "schedules", Pro board "Your own end sound" | `apps/web/src/lib/license.ts`, `apps/web/src/tool/**` (grep), `ToolPanel.astro:211`, `src/i18n/en.json` | Selling a missing feature breaks the honesty brand and invites refunds. Extension schedules exist (`apps/extension/src/schedules.ts`), web ones do not |
| F3 | In-tool links to `/pro` (Settings, stats lock line, Pro sheet, message card) have no `?ref=`. `/pro` never reads `ref`. `pro_view {from:'message'}` fires only from the message card | `ToolPanel.astro:253,295,310`, `ambient/message.ts`, `pro.astro` script | No attribution, so no way to learn which gate sells |
| F4 | `/pro` and `/pro/activate` call `track(..., { telemetry: true })` regardless of the user's Settings choice | `pro.astro`, `src/lib/activate-page.ts:98` | Breaks docs/18 §10 ("users can turn telemetry off") and the `/privacy` promise. Also, locale is hard-coded `en` |
| F5 | `meta.sessionCount` grows only for `completed` sessions of ≥ 5 min. ∞ sessions and user-stopped sessions never count | `apps/web/src/tool/end.ts` (`onEnded` returns early for `user`; `bumpSessionCount` only on `completed`) | The rating prompt (and anything keyed on `sessionCount`) never reaches the ∞ users: Priya, Tomás, Kenji. `aggregateRating` will over-represent timer users |
| F6 | Message mode free preview (60 s) works only when a link carries `msg=`, once per page view. The `M` cycle skips gated modes with a toast | `ambient/message.ts`, `ambient/shell.ts`, `ambient/logic.ts` | Most free users never see the Pro feature working |
| F7 | PWA install is a header icon shown on `beforeinstallprompt`. On iOS it shows a toast. `pwa_install` fires only on `appinstalled`; the prompt outcome (`userChoice`) is not recorded. There is no contextual install moment | `apps/web/src/tool/pwa.ts` | Install is the strongest return trigger we control (§3), and we cannot see its funnel |
| F8 | No extension mention inside the tool. Store URLs are search pages until approval. The extension's telemetry is off by default | `src/lib/extension.ts`, docs/18 §10 | The "Paused — tab hidden" moment has no path to the fix. Extension funnel data must come from the Chrome Web Store dashboard |
| F9 | Share produces the route only (`/30m`, `/until/HH-MM`, `/` for custom). Mode, message, theme and face are dropped | `ui/actions.ts` `sharePath` | Shared setups (Lena's clock face, Tomás's kiosk, Marco's cook mode) arrive as a plain timer |
| F10 | docs/18 §2 says return visits cannot be measured. BRD O5 targets a ≥ 25% return-visit rate, defined through `at.v1.meta.installedAt` | `docs/18-analytics-kpis.md`, `docs/01-brd.md` O5 | The retention objective has no metric |
| F11 | Sponsor card: allowed on the awake screen in `idle`/`held` and in the extend prompt (docs/09 §4). `ads.free` hides it (`tool/sponsor.ts`). Public copy: "The awake screen stays honest and ad-free either way" (`page.pro.lead`), "No ads on the awake screen, now or later" (`PageExtension.dc.html`) | docs/09 §4, `tool/sponsor.ts:49`, `en.json` | Contradiction between product promise and plan (§4.6) |
| F12 | Lifetime shows `$19` with `$29` struck through until `PRO_LAUNCH_END` (2026-12-08) | `src/lib/license.ts` `lifetimePrice`, `pro.astro` | $29 was never charged, so a strike-through is a former-price comparison without a bona fide former price [Fact, 16 CFR 233.1] |
| F13 | docs/09 §2.9 allows the extend prompt to carry "Pro adds schedules and custom chimes" | docs/09 §2.9 | Both features are missing on the web (F2), and the extend prompt runs a stop countdown. Do not ship that line |
| F14 | Stats show "Streak {n} days" including 0 | `stats/panel.ts`, `en.json stats.streak` | A broken or zero streak lowers later engagement [Fact, Silverman & Barasch 2023] |
| F15 | Revenue model assumes Polar at 5% + 50¢. Polar's current pricing lists Starter at 5% + 50¢, plus 1.5% on non-US cards | docs/09 §8.2, Polar pricing page | Net per sale is lower for the mostly non-US audience (8 locales) |
| F16 | Free stats already keep up to 365 days of daily minutes on the device (`pruneDays`). Free users see 7 days | `packages/core/src/stats.ts`, `stats/heatmap.ts` | An honest endowment: "your older weeks are already saved here, and Pro shows them the moment you activate" |

---

## 2. Funnels by persona

Stages: **Discovery → First session → Aha → Return → Install (PWA or extension) → Habit → Pro**.
The "aha" moment is the same for everyone: *the screen stayed on and the pill proved it*. It arrives at different times. For Priya it comes after her 5-minute group-policy lock would have fired. For Tomás it comes the next morning.

### 2.1 Priya: locked-down Windows laptop, Edge

| Stage | Today | Where and why she drops | Lever (see §3, §4) |
|---|---|---|---|
| Discovery | Search "keep laptop screen on without changing settings", `/for/work-laptop`, `/learn/does-a-wake-lock-keep-teams-green` | Teams-presence searchers leave once they read the honest limit. That is correct, and not a loss we should chase | Keep the limit plain. Link "what AwakeTab does do" right under it |
| First session | `/` or `/30m` autostarts; pill "Screen awake" | Low risk. Autostart is already the default on tool routes (`params.ts`) | Measure autostart success (docs/18) |
| Aha | Only after more than 5 min with no lock screen | She may close the tab before the proof arrives | Elapsed line already shows. In the Done state, "Kept awake for 32 min. The screen can sleep now." (board copy) is the proof. Keep it |
| Return | Bookmark or typed URL | Nothing reminds her. Her usual length is not remembered unless she sets a default | Remembered "usual" (L2). Suggest a bookmark or install on the Done screen after the 2nd completed session (L4) |
| Install | Edge PWA install may be allowed. Extensions are often blocked by policy (`ExtensionInstallBlocklist` `*` blocks all [Fact, Microsoft Learn]) | Extension cross-sell can fail on managed Edge | Offer the PWA first. Never imply the extension will work on a managed browser. Say "if your IT allows extensions" |
| Habit | Daily, workday-anchored (stable context: same desk, same time) [Fact, Wood et al.] | ∞ sessions stopped by hand never count (F5), so the rating prompt never asks her | Count user-stopped sessions ≥ 5 min (A12) |
| Pro | Weak fit today. Lamp colours, 12-week stats and ad-free guides do not solve her job | Low willingness to pay; a corporate card is unlikely | Web weekly schedules (a "weekdays 9–6" window while the tab is open) would be her one real Pro reason, if built (F2). Otherwise she stays free, and that is fine: she drives north-star hours and word of mouth |

### 2.2 Marco: iPad on the counter, Safari

| Stage | Today | Drop-off and why | Lever |
|---|---|---|---|
| Discovery | `/for/cooking`, `/on/ipad`, or a recipe blog's embedded Cook widget | Embed is the high-volume path, and it depends on bloggers adopting it | Business: sell Embed to bloggers (§4.5). Attribution "Keep awake by AwakeTab" is acquisition |
| First session | Cook mode on the article (no autostart on content pages); one tap | iOS Low Power Mode forces a 30-second auto-lock (BRD limits) → "Blocked — here's the fix" | Advice copy exists. Measure `lock_denied` by ua class |
| Aha | Hands covered in flour, screen still on, timer chime | Chime relies on the tab being visible and sound on | Fine as is |
| Return | Next recipe, days later | Needs to find the page again. Safari has no install prompt | iOS add-to-home-screen instructions at the Done state, stating the real benefit: on iOS, notifications work only for Home Screen web apps [Fact, WebKit 16.4] |
| Install | Toast with instructions from the header icon (F7) | Instructions shown out of context are easy to ignore | Show the iOS card after a completed cook session, once, dismiss remembered [Fact, web.dev patterns] |
| Habit | Anchored to cooking (a stable context cue) | Low risk once installed | "Your usual: Cook mode · 45 min" chip (L2) |
| Pro | Custom end sound (not built, F2), lamp colours | Low willingness to pay | Marco pays indirectly: the blogger buys Embed. Do not push Pro at Marco in cook mode |

### 2.3 Lena: MacBook on a projector, Chrome, `/until/11-30`

| Stage | Today | Drop-off and why | Lever |
|---|---|---|---|
| Discovery | `/for/presentations`, `/de/` | Low | — |
| First session | `/until/11-30` autostarts | Low | — |
| Aha | Projector stays on until 11:30 and chimes | **Biggest risk:** she switches to the slides window, the tab is hidden, the pill shows "Paused — tab hidden", and the projector sleeps mid-lecture. PiP keeps it visible, but only if she knows to open it | After the first `held → paused` of a session, when she comes back to the tab, show one line: "Keeps going when hidden: open the floating window, or use AwakeTab for Chrome." (L5) |
| Return | Weekly lecture, same time | Nothing reminds her | Email-free reminder: "Add to calendar" (.ics with the `/until/11-30` link) on the Done screen (L10) |
| Install | Extension is the right tool (works with the tab hidden) | Store link not live. No path from the tool (F8) | Extension cross-sell at the paused moment |
| Habit | Weekly, context-anchored | Missing any one week breaks a streak; do not show one | "Days used" framing (L7) |
| Pro | **Strong fit.** Message mode ("Back at 11:30 AM") for breaks, taller floating window (`pip.pro`), extension schedules (Tue 9:00–11:30) | She never sees Message work (F6) | 60-second preview from the mode itself; live preview on `/pro` "At the lectern" section (board). Lifetime suits a lecturer paying personally |

### 2.4 Tomás: wall dashboards and kiosks

| Stage | Today | Drop-off and why | Lever |
|---|---|---|---|
| Discovery | `/for/dashboards`, `/for/kiosk`, `/kiosk`, `/on/chromebook` | Low | — |
| First session | `/?autostart=1&mode=minimal`, ∞ | He sets it up once and leaves | Kiosk URL builder (exists) |
| Aha | The next morning, the dashboard is still on; the resume banner recovers it after a power cut | The Android battery saver can deny the lock. A reboot needs the tab restored | Persisted resume (exists). Show `resume_accepted` in the weekly review |
| Return | Not a returner. His usage is continuous | Our "return" metrics undercount him | Count awake-hours (north star), not visits |
| Install | PWA on the tablets; extension on the Chromebook (schedules) | Store link missing | Extension page with Chromebook and schedules (board) |
| Habit | Continuous | ∞ sessions never counted (F5) | A12 |
| Pro / Business | **Strongest fit.** Kiosk licence $19 (one site) or $49 (five): logo, message, no prompts. Extension schedules via Pro | He needs to see his logo in place before paying; procurement wants an invoice | Kiosk builder shows a live logo preview labelled "Preview", watermark removed with a licence (E10). State "Polar issues an invoice and handles tax" on `/kiosk` [Fact, docs/09 §2.11] |

### 2.5 Kenji: long builds and agents overnight

| Stage | Today | Drop-off and why | Lever |
|---|---|---|---|
| Discovery | Hacker News, `/for/ai-agents`, `/library`, GitHub | Distrust: he reads claims first | `/learn` guides and the library state-machine demo already exist |
| First session | ∞, extend prompt off | On Firefox there is no extension; a hidden tab pauses | Honest limits copy exists |
| Aha | Sees the pill switch to "Paused — tab hidden" when he switches away and back. It *earns trust by admitting the limit* | He might conclude "it doesn't work hidden" and go back to `caffeinate` | Same paused-moment line as Lena, plus a link to the library and to the extension "System" level |
| Return | Evenings | Low | — |
| Install | Extension on Chrome, or the npm package `@awaketab/wake` | Firefox users: no path | Say so plainly (the board does) |
| Habit | Several nights a week | — | — |
| Pro | Medium fit: 12-week history, CSV export, extension auto-start on sites (for example, the CI dashboard host). Prefers one-time payment (distrusts subscriptions [Opinion]) | Will not pay for cosmetics | Lead with lifetime. Explain in plain words what Pro does *not* do ("Does Pro keep the screen awake better? No." in the board FAQ is exactly right). GitHub Sponsors is an alternative for him |

### 2.6 Cross-persona drop-off summary

| Drop point | Personas hit | Root cause | Fix |
|---|---|---|---|
| Tab hidden → paused → screen sleeps | Lena, Kenji | Platform limit of the web Wake Lock | Honest cross-sell to PiP and the extension after they return (L5) |
| Never returns | Priya, Marco, Lena | No external prompt | Remembered usual (L2), install at the Done screen (L4), .ics reminder (L10), share with full setup (L3) |
| Never sees Pro working | Lena, Tomás | Previews are hidden (F6) or missing | P1–P3 previews |
| `/pro` doesn't explain | all | F1 | Ship the board structure (§4.7) |
| ∞ users never counted | Priya, Tomás, Kenji | F5 | A12 |

---

## 3. Activation and retention levers

Principle [Opinion, grounded in the Fogg Behavior Model]: behaviour needs motivation, ability and a prompt together [Fact, behaviormodel.org]. The motivation is already there (they came with a job). Ability is already high (one tap). What is missing is the **prompt to come back**, which for a calm utility has to be *owned by the user* (bookmark, installed icon, calendar entry, shared link) rather than pushed by us (email, push). Habits form around stable context cues [Fact, Wood et al. 2002], and automaticity takes weeks, not days (median 66 days, range 18–254, in Lally et al. 2010 [Fact]). So the levers below make the *cue* easier to create and keep.

| ID | Lever | What exactly | Evidence | Guardrail |
|---|---|---|---|---|
| L1 | One-tap start (keep) | Autostart on `/`, presets and `/until` is already the default. Never add a step before the lock | PRODUCT principle 3. docs/18 autostart success ≥ 95% | Autostart success, CLS |
| L2 | Remembered "usual" | Remember the last completed setup (preset, mode, face) locally, and show it as the first chip: "Your usual · Cook · 45 min". No new identifier | Stable context cues drive repeat behaviour [Wood] | Needs a storage field (docs/08 first). Must not autostart an unexpected mode |
| L3 | Shareable setup links | Share includes `mode=`, `theme=`, face, and `msg=` when the sharer has Pro. The existing "Start automatically" toggle stays opt-in. Custom lengths share as a real duration instead of `/` | F9. Links are cues the user owns | Links never carry `ref=` or `lic=` (already a rule). `msg` sanitised (exists) |
| L4 | PWA install at the right moment | Keep the header icon. Add a single card on the Done screen after the **2nd completed session**, only if `beforeinstallprompt` fired (or on iOS Safari), with the concrete benefit ("opens in its own window, works offline, can tell you when time is up"; board copy). "Not now" is remembered for 30 days | web.dev: promote outside the user's flow, allow dismissal, remember it, show only after `beforeinstallprompt` [Fact]. Installed users are the most engaged; Weekendesk saw 2.5× conversion for installed users [Fact, web.dev] | Never during an awake session. Record the `userChoice` outcome (new event) |
| L5 | Extension cross-sell at the real limit | On Chromium desktop, after the first `held → paused` of a session, **when the user returns** and the lock is re-held, show one line under the pill note: "Want it to keep going while hidden? The floating window or AwakeTab for Chrome can." Dismissible, then quiet for 14 days. Not on Firefox or Safari (no power API; `unsupportedBrowser` exists) | Directly solves the drop in §2.3 and §2.5. Inline install is impossible, so links must go to the store [Fact, Chrome 2018 deprecation] | Pill copy unchanged (contract). Line sits in the note area, not on the pill. Hidden in ambient Night and Minimal |
| L6 | Done-screen moment | The Done state ("Kept awake for {time}. The screen can sleep now.") gets at most **one** secondary suggestion, chosen by priority: install (L4) → calendar reminder (L10) → share this setup (L3) → Pro (only if a related gate was touched, §4.2) | End of task is the natural break (web.dev "after a critical journey" pattern) | Cap one suggestion per Done screen. Never in cook mode while kitchen timers run |
| L7 | Stats without guilt | Replace the "Streak" tile with "Days used this week" / "this month". Show a streak only when it is ≥ 3 and intact, and never write "streak lost". Lead with awake-hours ("This week: 11 h 20 min awake") | Intact streaks raise later engagement relative to broken ones, and the effect is stronger when people blame themselves for the break [Fact, Silverman & Barasch 2023] | No notifications about streaks, ever |
| L8 | Faces and lamp personalisation | Four faces stay free (the board lists Ring, Bold, Horizon, Tide under "What stays free"). Lamp: aqua and violet free, mint and sky Pro (DESIGN.md §2.2 proposal). A choice people have made is a small reason to come back [Opinion] | DESIGN.md §2.2, §7 | Faces are never gated (principle: Pro never changes how the screen is kept awake) |
| L9 | Horizon and Tide as delight | Use them where a screen is watched for a long time: suggest Horizon as the default face on `/for/night-clock` (experiment E8), and make shared links carry the face | DESIGN.md §7 | Reduced motion honoured. Budgets: CSS-only, about 1 KB of JS headroom (DESIGN.md §8) |
| L10 | Email-free reminders | "Add to calendar" on the Done screen for `until` sessions: a client-generated `.ics` file with the `/until/HH-MM` URL and a weekly repeat the user picks. No server, no email, no push subscription. Plus the existing manifest shortcuts for installed users | A cue the user owns [Fogg]. Zero data | The file is built client-side. JS only when clicked (lazy import) |
| L11 | Resume and reliability (keep) | Resume banner and second-tab banner exist. Report `resume_accepted ÷ resume_shown` weekly | docs/18 | — |
| L12 | Rating sample fix | Count user-stopped sessions of ≥ 5 min awake toward `meta.sessionCount` (same threshold) | F5 | Rating prompt still never during a session (`rating.ts` already blocks it) |

What I would **not** do [Opinion]: web push reminders (needs a subscription and server state, and nudges people back to a tool that should be there when needed); streak notifications; "you haven't used AwakeTab in a while" anything; a tutorial or onboarding carousel before the first lock.

---

## 4. Monetisation

### 4.1 What each persona would pay for

| Persona | Would pay for | Built? | Likely plan | Willingness [Opinion] |
|---|---|---|---|---|
| Priya | Web weekday schedule window; maybe ad-free guides | **No** (web `schedules`) | Yearly, if anything | Low |
| Marco | Custom end sound, lamp colours | **No** (`sounds.custom`) / Yes | None; Marco pays through the blogger's **Embed** licence | Very low |
| Lena | Message mode, taller floating window, extension schedules | Yes / Yes / Yes (extension) | **Lifetime** | Medium–high |
| Tomás | Logo, message, no prompts, several sites; extension schedules on the Chromebook | Yes (Kiosk) / Yes | **Kiosk $19 / $49**, maybe Pro for the Chromebook | High (business budget) |
| Kenji | 12-week history, CSV, extension auto-start per site | Yes | **Lifetime** | Medium |

Implication [Opinion]: Pro sells to Lena and Kenji; Business sells to Tomás and the bloggers behind Marco. Priya and Marco are the volume that makes the site rank and keeps the north star high. Priya would only convert if web schedules are built. Decide F2: **build `schedules` (web) and `sounds.custom`, or remove them from `PLAN_FEATURES`, `pro.card`, `page.pro.description` and the board before production checkout.** Hardening costs are low either way; the cheapest honest move is to remove them now and add them back when they ship.

### 4.2 Where upgrade moments appear, and where they never do

**Allowed (the user is looking at or reaching for the Pro thing):**

| Surface | Trigger | Content | `ref` |
|---|---|---|---|
| Settings → Lamp colour | Taps mint or sky | Live preview on the clock while Settings is open (board: "Tap one to preview it on the clock"). On close without Pro it reverts, and a one-line note links to the Pro sheet | `sheet-lamp` |
| Message mode | Picks Message without Pro | 60 s preview with their own text (P1), then the honest Pro card (exists) | `sheet-message` |
| Stats | Opens Stats | Locked weeks label: "{n} older weeks are saved on this device. Pro shows them." (F16) | `sheet-stats` |
| Stats → Export | Taps Export | Pro sheet | `sheet-export` |
| Floating window | Opens PiP (free) | Nothing proactive. The Pro size appears only in the Pro sheet list | — |
| Extension options | Schedules / Auto-start sections | Existing `ext.pro.locked` copy with a link | `ext-options` |
| Done screen | Only if the user touched a related gate in the last 7 days, and at most once per 7 days per device | One line: "Pro keeps your message on screen. See what's in Pro." | `done-{gate}` |
| `/pro`, `/extension`, `/kiosk`, `/embed`, footer | Always | Full page | page name |

**Never:**

- The awake screen in any of the seven lock states while a session is live (starting, held, paused, blocked, fallback). That includes toasts.
- The extend prompt ("Time's up. Keep going?"): it runs a stop countdown, so an ask there would be pressure under time limits (drop the docs/09 §2.9 line, F13).
- The first session on a device; any error or denial notice; the rating prompt, or the same Done screen as the rating prompt; PiP; the embed widget; kiosk mode; notifications.
- Any confirm-shaming ("No thanks, I like squinting"), countdowns, fake scarcity, pre-ticked options or interstitials (docs/09 §1; FTC dark-pattern categories [Fact, FTC 2022]).

A frequency cap needs a small local counter (`lastUpsellAt`). That is a storage change: add it to docs/08 and docs/00 first.

### 4.3 Yearly vs lifetime

Facts:

- Current plans: `pro_yearly` $12/year; `pro_lifetime` $29, or $19 until 2026-12-08 (`license.ts`).
- Rivals: Lungo is $4.00 one-time on the Mac App Store; Amphetamine is free with "Nothing to unlock/no 'pro' version" [Fact, App Store listings]. PowerToys Awake and `caffeinate` are free. Keeping awake itself cannot be the paid value, and the product already says so.
- Across subscription apps, yearly plans keep 44.1% of subscribers after one year, against 17.0% for monthly [Fact, RevenueCat 2025]. About 30% of annual subscriptions are cancelled in the first month [Fact, RevenueCat 2026 summary].

Estimates:

- Expected gross value of a yearly buyer, if yearly retention stays near 44%: $12 × 1 / (1 − 0.441) ≈ **$21.5** [Estimate; assumes constant renewal rate, likely optimistic].
- Net after Polar (Starter 5% + 50¢, +1.5% on non-US cards) [Fact, Polar pricing]: $19 lifetime ≈ **$17.3**; $29 lifetime ≈ **$26.6**; $12 yearly ≈ **$10.7** per year [Estimate, non-US card].
- So $29 lifetime ≈ 1.35× the expected yearly value, and $19 launch lifetime ≈ 0.88×. The launch price trades revenue per buyer for conversion. That is a fair, time-limited offer as long as it really ends.

Presentation [Opinion, with NN/g "explicit differences" and "comparison tables" as the basis]:

1. Two cards, **lifetime first** (left on desktop, top on phone). One line under each states the real difference: "Pay once, keep it" vs "Billed once a year through Polar. Cancel any time in the Polar portal."
2. The board's "Costs less than two years of the yearly plan" is true at $19 ($19 < $24). At $29 it becomes "about two and a half years of the yearly plan", so the line must change with the price. Keep it computed from `PLAN_PRICES`.
3. **Drop the strike-through.** Write "Launch price $19 until 8 December 2026, then $29 once". The $29 has never been the price at which Pro was sold, and US rules call a former-price comparison without a bona fide former price "fictitious" [Fact, 16 CFR 233.1]. The EU Omnibus rule for announced price reductions uses the lowest price of the prior 30 days as the reference [Fact, EC guidance 2021]. Whether it strictly applies to a digital licence is for a lawyer; the plain-date wording avoids the question.
4. No monthly plan (as now). No "most popular" badge unless it is true and measured.
5. The decoy effect is real (Ariely's Economist example [Fact, secondary source]). We should **not** add a dominated third plan to steer people. Two honest options are enough.

### 4.4 Trial and preview mechanics (no timers on the awake screen, no auto-charging)

| ID | Mechanic | Detail | Honesty check |
|---|---|---|---|
| P1 | Message preview from the mode | Choosing Message without Pro shows the user's own text for 60 s (`MESSAGE_PREVIEW_MS` exists), once per day per device, then the existing Pro card. It no longer requires a shared `msg=` link. The session keeps running; only the mode changes back to Clock (as now) | The preview end is a mode change, not a lock change. The pill stays true |
| P2 | Message on `/pro` | "Try your own message" input on the `/pro` board section renders a static preview of the awake screen. Unlimited, because `/pro` is not the awake screen | No timer needed |
| P3 | Lamp preview | Pro colours preview on the ring while Settings is open. They revert on close. No timer | Clear "Pro" label on the swatch (exists: `data-pack-gate`) |
| P4 | Stats endowment | "{n} older weeks saved on this device" (F16). On activation, 12 weeks appear at once | True only because the data is really kept locally. If pruning changes, the copy must change |
| P5 | Opt-in 7-day Pro trial (later, experiment) | A reverse trial ("full access, then back to free") is reported to convert above plain freemium [Fact, Verna via Amplitude; practitioner data, not peer-reviewed]. For AwakeTab it would be an explicit "Try Pro for 7 days" button, no card, nothing charged, and at the end one toast: "Your Pro trial ended. Free features are unchanged." Not at launch: first get the structure right | No auto-renewal, no card, and the free tier never degrades (docs/09 §1) |

Refunds and guarantees as trust:

- Keep "14-day refund, no questions asked", but **put it next to the Get Pro buttons**, not in a separate alert below. Add: "Refunds end Pro on your devices. Free features never change."
- A meta-analysis of 22 studies found that return-policy leniency raises purchases more than it raises returns [Fact, Janakiraman et al. 2016]. Evidence that a 30-day window beats 14 days for software is anecdotal. Worth testing (E6) with refund rate as the guardrail (docs/09: < 5%; docs/18: ≤ 3% for the price test).
- Checkout friction: across e-commerce, 40% of abandoners cite extra costs, 18% forced account creation and 19% distrust of card handling [Fact, Baymard]. So say "taxes added at checkout" beside the price (exists), "No account" beside the button, and "Polar handles payment; AwakeTab never sees your card".

### 4.5 Business upsells (Embed, Kiosk)

- **Embed ($29/year per site)** is sold to the blogger, not to Marco. The free widget's credit line is our best acquisition channel [Opinion]. The `/embed` page should show the widget on a sample recipe, the one-line snippet, and a "your site, no credit line" preview toggle. Upsell trigger: `embed:{domain}` shows a steady host in `page_view blob6` → nothing automatic (we have no contact). Instead, the widget's credit link lands on `/embed?ref=widget` (link param only).
- **Kiosk ($19 one site, $49 five)**: add a logo preview to the kiosk URL builder with a visible "Preview" label that the licence removes (E10). State invoices, tax, per-site definition and "one key, activate each screen" plainly. Above five sites: "Email us" (no fake tiers).
- On `/pro`, keep Business as a short section after the plans (board does this), linking to `/embed` and `/kiosk`.

### 4.6 Sponsor card vs ad-free

- Contract today: sponsor card allowed in `idle`/`held` and in the extend prompt at G5 (≥ 100k visits/month), rate card $300–$1,000 a month (docs/09 §4).
- Value [Estimate]: 100k `sponsor_view` × 0.12% average developer-ad CTR (EthicalAds network average [Fact]) ≈ 120 clicks a month. At $300 that is $2.50 a click, which is hard to renew for most stand or monitor sponsors.
- Cost: it contradicts "ad-free either way" (`page.pro.lead`) and "No ads on the awake screen, now or later" (extension page board), and it makes `ads.free` a "pay to remove the sponsor from the awake screen" feature.
- Recommendation [Opinion]: **remove the sponsor card from the awake screen and the extend prompt.** If a sponsor is ever wanted, place it on `/about` ("Supported by") and on content pages as a house card, never in the tool. Then `ads.free` means one clear thing: no ads on the guides. This is a contract change (docs/00 §8.3, docs/09 §4, DESIGN.md §6): owner decision.

### 4.7 Pricing page structure (order)

Based on the `Pro.dc.html` board, with NN/g and Baymard guidance:

1. H1 and one-line lead (exists): "Pro is optional. The awake screen stays honest and ad-free either way."
2. **"Pro changes how AwakeTab looks and what it remembers. It does not change how the screen is kept awake."** (board). This is the single most important trust line for Kenji.
3. Persona sections, each with a live or sample preview: At the lectern (Message, floating window), On the wall (logo, schedules in the extension), Overnight builds (12 weeks, CSV, auto-start), In the kitchen (**only if end sounds are built**), On a work laptop (no ads on guides).
4. Plans: lifetime first, yearly second. Plain differences, "5 devices", "No account", refund line next to the buttons, "taxes added at checkout".
5. "What happens after you pay": key by email and on the receipt page; this device activates automatically; the extension uses one of five activations.
6. What stays free (board list: every length, four faces, six ambient modes, aqua and violet, 7-day stats, install and offline, all languages).
7. FAQ (board: does Pro keep it awake better? account? device? key?).
8. Business: Embed, Kiosk.
9. "Already bought Pro? Enter licence key · Manage devices".

On phones, stack the plan cards; do not use a side-by-side comparison table [Fact, NN/g mobile tables].

### 4.8 Conversion estimates (all labelled estimates)

Benchmarks [Fact]:
- Freemium SaaS: "good" 3–5% of free users, a quarter of products below 2.5% (ChartMogul).
- Freemium apps: median download-to-paid 2.18% by day 35, versus 12.11% for hard paywalls (RevenueCat 2025).
- Chrome extensions: practitioner reports range from 0.8% (one developer across five extensions, after correcting his dashboard) to 2–4% (the same author's earlier post). These are weak, anecdotal sources.

Those denominators are *active users*. Ours is *monthly uniques*, mostly one-visit searchers. So:

| Input | Low | Central | High | Basis |
|---|---|---|---|---|
| Share of uniques who become engaged (≥ 2 sessions or installed) | 5% | 8% | 15% | [Estimate]; no data yet. Measure with the `visit` bucket (§5.2) |
| Engaged → paid (any Pro) | 1.0% | 2.0% | 3.0% | Between the Chrome anecdote (0.8%) and the freemium app median (2.18%), up to good SaaS (3%) |
| **Pro orders ÷ monthly uniques** | **0.05%** | **0.16%** | **0.45%** | product of the two |
| Plan mix (lifetime share) | 60% | 70% | 80% | [Opinion]: one-time-value utility, Lungo anchor |
| Net per order (mix, non-US cards) | ≈ $15 | ≈ $15.3 | ≈ $16 | §4.3 |
| **Net Pro revenue per 1,000 uniques / month** | ≈ $7.5 | ≈ $24 | ≈ $72 | orders per 1,000 (0.5 / 1.6 / 4.5) × net per order |

This sits inside docs/09 §8.2 (0.06–0.35% × $16 net). Per persona [Opinion on the relative ordering, not on absolute numbers]: Tomás (Business) > Lena > Kenji > Priya > Marco.

Funnel step estimates to set alert bands. Replace them with real baselines after 4 weeks.
- `pro_view` → `pro_checkout_click`: 5–15% [Estimate, no cited benchmark].
- `pro_checkout_click` → paid: 30–60% [Estimate; Baymard's 70% cart abandonment is e-commerce and includes browsers, so a hosted one-page checkout with no account should do better].
- Paid → `pro_activated` on the same day: ≥ 90% (auto-fill plus paste fallback, F-08).

---

## 5. Measurement

### 5.1 Funnel KPIs mapped to docs/18 events

| Stage | KPI | Events (docs/00 §10, §13.4) | Status |
|---|---|---|---|
| Discovery | Impressions, CTR by cluster | GSC | exists |
| First session | Session start rate | `session_start` ÷ `page_view` (tool routes) | exists |
| First session | Autostart success | `lock_state` → `held` ≤ 300 ms ÷ `session_start{autostart}` | exists |
| Aha | Share of sessions that reach `held` for ≥ 5 min | `session_end.durationMin ≥ 5` ÷ `session_start` | exists (query only) |
| Aha (risk) | Hidden-pause rate per session | `lock_state {from:'held', to:'paused'}` ÷ `session_start` | exists (query only) |
| Return | Returning visit share, by age bucket | `page_view.visit` | **new field** |
| Install | PWA prompt shown → accepted | `pwa_prompt` + `pwa_install` | **new event** |
| Install | Extension clicks by surface | `extension_click {store, from}` | **new field** |
| Install | Extension weekly users, uninstalls | Chrome Web Store dashboard | external |
| Habit | Weekly awake-hours (north star); median session | `session_end` | exists |
| Habit | Sessions per device bucket | `session_start.nth` | **new field** |
| Pro | Surface → sheet → `/pro` → checkout → activated | `pro_view {from, ref}` → `pro_checkout_click {plan, ref}` → `pro_activated {plan}` | `ref` **new field**; `from` exists but is used once |
| Pro | Preview use and outcome | `preview {gate, action}` | **new event** |
| Business | Embed hosts; kiosk orders | `page_view blob6` on `/embed/cook`; Polar | exists |
| Trust | Rating distribution; refund rate | `rating_submitted`; Polar | exists |

### 5.2 Proposed events and fields (PROPOSED — add to docs/00 §10/§13.4, docs/18 §3 and `/privacy` before code)

| Identifier | Payload | Privacy note |
|---|---|---|
| `page_view.visit` | `new` \| `d1_7` \| `d8_30` \| `d30p` (days since `at.v1.meta.installedAt`) | Coarse bucket computed on the device; no ID, not joinable across events. Gives the BRD O5 return rate |
| `session_start.nth` | `1` \| `2_4` \| `5_19` \| `20p` (from `meta.sessionCount`) | Bucket only |
| `pwa_prompt` | `{ action: 'shown' \| 'accepted' \| 'dismissed', surface: 'header' \| 'done' \| 'ios' }` | from `beforeinstallprompt.userChoice` |
| `extension_click.from` | `page` \| `paused` \| `done` \| `pro` | — |
| `pro_view.ref`, `pro_checkout_click.ref` | the validated `ref` (`sheet-lamp`, `sheet-message`, `sheet-stats`, `sheet-export`, `done-*`, `ext-options`, `footer`, `widget`) | Already the docs/09 rule: read once, never forwarded or stored |
| `preview` | `{ gate: 'ambient.message' \| 'ambient.packs', action: 'start' \| 'end' \| 'pro_click' }` | — |
| `done_action` | `{ action: 'install' \| 'calendar' \| 'share' \| 'extension' \| 'pro' \| 'none' }` | — |
| `share_click` fields | `{ mode: bool, autostart: bool }` | — |
| Bug fix | `/pro`, `/pro/activate`: read the stored telemetry setting instead of `telemetry: true`, and use the page locale | Restores docs/18 §10 |

Extension: keep telemetry off by default. Use the Chrome Web Store dashboard for installs, weekly users and uninstalls, and optionally `runtime.setUninstallURL` to a one-question page on awaketab.com with no identifier (Chrome documents this use for "analytics, and implement surveys" [Fact]).

### 5.3 Targets to start with [Estimate; revise after 4 weeks of data]

| KPI | Day 90 | Day 180 |
|---|---|---|
| Autostart success | ≥ 95% (docs/18) | ≥ 97% |
| Returning share of tool `page_view` | ≥ 20% | ≥ 25% (BRD O5) |
| PWA accept ÷ shown (Done card) | ≥ 15% | ≥ 20% |
| Hidden-pause sessions that later use PiP or the extension link | baseline | +50% on baseline |
| Pro orders ÷ monthly uniques | ≥ 0.1% (docs/18) | ≥ 0.2% |
| Refund rate | ≤ 3% | ≤ 3% |
| Rating average (shown at ≥ 25 ratings) | ≥ 4.5 | ≥ 4.5 |

### 5.4 Ten experiments (weekly alternation, no user bucketing, ≥ 2 full weeks per arm)

Sample size [Estimate, Lehr's rule n ≈ 16·p(1−p)/δ²]: detecting 0.15% → 0.20% orders per unique needs ≈ 96,000 uniques per arm. Detecting 10% → 13% on `/pro` click-through needs ≈ 1,600–1,800 `pro_view` per arm. So pick primary metrics with high base rates, and use revenue only as a secondary readout.

Standing guardrails for every test: autostart success, lost/denied share, CLS = 0 on tool routes, rating average and the "never" rate, refund rate, and no change to the pill.

| # | Hypothesis | Variant vs control | Primary metric | Extra guardrail |
|---|---|---|---|---|
| E1 | A structured `/pro` (board: persona sections, what stays free, FAQ) raises checkout clicks | Board structure vs current two cards | `pro_checkout_click ÷ pro_view` | Refund rate; `/pro` LCP |
| E2 | Lifetime-first order raises revenue per view without lowering orders | Lifetime left/top vs yearly left/top | Orders ÷ `pro_view` (weekly Polar) | Yearly share not below 15% (so we still learn about renewals) |
| E3 | A Done-screen install card after the 2nd completed session increases installs | Card vs header icon only | `pwa_install ÷ session_end{completed}` | `pwa_prompt` dismiss rate; rating "never" |
| E4 | The paused-moment line increases PiP and extension use among hidden-pause sessions | Line vs none (Chromium desktop) | (`pip_open` + `extension_click{from:paused}`) ÷ sessions with a hidden pause | Session start rate; no pill change |
| E5 | A Message preview from the mode itself raises Message-driven Pro views | P1 on vs link-only | `pro_view{ref:sheet-message}` per 1k tool sessions | Complaints; mode switch errors (`client_error`) |
| E6 | A 30-day guarantee beside the button raises conversion more than refunds | "30-day refund" next to button vs "14-day" in alert | `pro_checkout_click ÷ pro_view` | Refund rate ≤ 3% (hard stop at 5%) |
| E7 | The "older weeks saved on this device" line raises stats-driven Pro views | Endowment copy vs "Pro keeps 12 weeks" | `pro_view{ref:sheet-stats}` ÷ stats opens | — |
| E8 | Horizon as the default face on `/for/night-clock` lengthens sessions | Horizon vs Ring default | Median `session_end.durationMin` on that route | Battery-stop share; CLS |
| E9 | A remembered "usual" chip raises returning session starts | Usual chip first vs static order | `session_start ÷ page_view` where `visit ≠ new` | Wrong-preset stops within 60 s |
| E10 | A watermarked logo preview in the kiosk builder raises Kiosk orders | Preview vs text-only extras | `pro_checkout_click{plan:biz_kiosk_*}` ÷ `/kiosk` views | Support emails about the watermark |

Not tested on purpose: anything that shows an ask during a live session, countdown offers, fake "most popular" labels, and struck-through reference prices.

---

## 6. Prioritised actions

Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week. Impact on conversion and retention: H / M / L.

| # | Action | Why (evidence) | Effort | Impact | Where in repo / design |
|---|---|---|---|---|---|
| 1 | Decide F2: remove `schedules` (web) and `sounds.custom` from what `/pro` and the Pro sheet sell, or build them. Remove "schedules" from `pro.card` and `page.pro.description`, and "Your own end sound" from the board, until built | Selling missing features breaks the honesty brand. Repo grep finds no gate check (F2) | S (remove) / L (build) | H | `src/lib/license.ts`, `functions/_lib/license.ts`, `packages/core` gate list, `src/i18n/*.json` (`pro.card`, `page.pro.description`), `Pro.dc.html`, docs/00 §8.2, docs/09 §2.9 |
| 2 | Honour the telemetry opt-out on `/pro` and `/pro/activate`, and pass the real locale | Privacy contract docs/18 §10 (F4) | S | M (trust) | `pages/pro.astro`, `lib/activate-page.ts` |
| 3 | Add `?ref=` to every in-tool Pro link and read it on `/pro` (`pro_view{ref}`, `pro_checkout_click{ref}`) | docs/09 §2.1 rule, not implemented (F3). Without it no experiment can be read | S | H (learning) | `ToolPanel.astro`, `ambient/message.ts`, `pro.astro`, docs/18 §3 |
| 4 | Ship the `/pro` board structure (§4.7): persona sections, what stays free, FAQ, refund beside the buttons, Business section | F1. NN/g explicit differences; Baymard: extra costs 40%, account 18%, card trust 19% | M | H | `pages/pro.astro`, `Pro.dc.html`, i18n `page.pro.*` |
| 5 | Replace the strike-through with a dated launch price line | 16 CFR 233.1 fictitious former price (F12). EU 6a principle | S | M (trust, legal) | `pro.astro`, `lifetimePrice()` stays for the date logic |
| 6 | Owner decision: remove the sponsor card from the awake screen and the extend prompt; redefine `ads.free` as "no ads on the guides" | Public promise (F11). ~120 clicks/month at 100k views [Estimate from EthicalAds 0.12%] | S (docs) | M (trust) | docs/00 §8.3, docs/09 §4, DESIGN.md §6, `tool/sponsor.ts`, `SponsorCard.astro` |
| 7 | Drop the planned extend-prompt upsell line (docs/09 §2.9) and move the single allowed upsell to the Done screen with a 7-day cap | F13. The countdown makes it pressure | S | M | docs/09 §2.9, `end.ts`, docs/08 (cap field) |
| 8 | Extension cross-sell at the paused moment (L5), once the store listing is live | Solves the biggest drop for Lena and Kenji. Inline install is gone, so link to the store | M | H | `tool/ui/notices.ts` or pill note area, `lib/extension.ts` (real URLs), docs/05, i18n |
| 9 | Message preview from the mode itself, once a day (P1) + live preview on `/pro` (P2) | F6. Contextual preview at the moment of need (practitioner data: paywall at the limit ≈ 3× [weak source]) | M | H | `ambient/message.ts`, `ambient/shell.ts`, `Pro.dc.html` "Try your own message" |
| 10 | Count user-stopped sessions ≥ 5 min toward `meta.sessionCount` | F5: ∞ users are never asked to rate and are invisible in the rating signal | S | M | `tool/end.ts`, docs/08 §2.5, docs/05 §3.22 |
| 11 | Add `page_view.visit` and `session_start.nth` buckets | Unlocks BRD O5, which docs/18 says cannot be measured (F10) | S | H (learning) | `lib/analytics.ts`, `tool/extras.ts`, docs/00 §10, docs/18 §2–3, `/privacy` |
| 12 | Done-screen install card after the 2nd completed session; record `pwa_prompt` outcomes | web.dev install patterns; installed users more engaged (2.5× at Weekendesk) | M | H | `tool/pwa.ts`, Done state (`DoneDark/Light.dc.html`, `ExtrasInstall.dc.html`), i18n |
| 13 | Share the full setup (mode, face, theme, msg with Pro, real custom duration) | F9. Links are user-owned cues | S | M | `ui/actions.ts sharePath`, `params.ts` |
| 14 | Stats: "Days used this week" instead of the streak tile; show a streak only if ≥ 3 and intact; add the "{n} older weeks saved" line | Silverman & Barasch 2023; F16 endowment | S | M | `stats/panel.ts`, `ToolStats.dc.html`, i18n `stats.*` |
| 15 | Remembered "usual" chip (L2) | Stable context cues [Wood] | M | M | `tool/ui/chips.ts`, docs/08 (new field) |
| 16 | "Add to calendar" (.ics) for `until` sessions on the Done screen | Email-free, user-owned reminder [Fogg: prompts] | S | M (Lena) | new lazy module in `tool/`, Done state |
| 17 | Lamp live preview in Settings for mint and sky | Board already specifies it; try before paying | S | M | `ui/settings.ts`, `accent.ts`, DESIGN.md §2.2 gate decision |
| 18 | Kiosk builder logo preview with a "Preview" label; invoice/tax line on `/kiosk` | Tomás needs to see his logo and get an invoice | M | M (Business) | `pages/kiosk.astro`, `tool/embed/kiosk.ts`, `PageKiosk.dc.html` |
| 19 | Update docs/09 §8.2 net revenue for Polar's current fees (+1.5% non-US cards) | F15 | S | L | docs/09 §2.1, §8.2 |
| 20 | Run E1 → E3 → E4 first; E2 and E6 only once `pro_view` volume allows (~1,600 per arm) | §5.4 sample sizes | ongoing | H | docs/18 §9 (replace the table with §5.4) |
| 21 | Opt-in 7-day Pro trial (P5), after 1–12 have shipped and baselines exist | Reverse-trial practitioner evidence; honest if no card and no degradation | M | M | `packages/core` licence (local trial token needs a design), docs/09 |

---

## 7. Open questions for the owner

1. F2: remove `schedules` (web) and `sounds.custom` from the paid list now, or commit to building them before production checkout?
2. Sponsor card: accept removing it from the awake screen (contract change), or keep it with a public copy change? Keeping both the card and the current "ad-free" copy is not an option.
3. Lamp gate split (DESIGN.md §2.2 proposal): confirm aqua and violet free, mint and sky Pro.
4. Refund window: stay at 14 days, or test 30 (E6)?
5. May we add the coarse `visit` and `nth` buckets to analytics (a privacy-page change)?

---

## 8. Sources (all accessed 2026-09-26)

External:

- ChartMogul, *The SaaS Conversion Report*: https://chartmogul.com/reports/saas-conversion-report/
- RevenueCat, *State of Subscription Apps 2025*: https://www.revenuecat.com/state-of-subscription-apps-2025 (freemium 2.18% vs hard paywall 12.11% download-to-paid by day 35; yearly 44.1% vs monthly 17.0% one-year retention; 82% of trials start on install day; refunds hard paywall 5.8% vs freemium 3.4%)
- RevenueCat, *State of Subscription Apps 2026* summary: https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026 (via search summary: ~30% of annual subscriptions cancelled in month one. Not fetched directly; treat as secondary)
- dev.to (ktg0215), *Real Numbers: Freemium Chrome Extension Monetization After 6 Months*: https://dev.to/ktg0215/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga (0.8% across five extensions; anecdotal)
- dev.to (ktg0215), *Monetizing Chrome Extensions with Freemium — Real Numbers from 7 Paid Extensions*: https://dev.to/ktg0215/monetizing-chrome-extensions-with-freemium-real-numbers-from-7-paid-extensions-5cj (2–4%; paywall at the limit ≈ 3×; anecdotal, and inconsistent with the author's later post)
- Amplitude (Elena Verna), *Trial or Freemium? Get the Best of Both with a Reverse Trial*: https://amplitude.com/blog/reverse-trial
- NN/g, *Explicitly State the Difference Between Options* (T. Dykes, 2024-08-23): https://www.nngroup.com/articles/explicit-differences/
- NN/g, *Comparison Tables for Products, Services, and Features*: https://www.nngroup.com/articles/comparison-tables/ ; *Mobile Tables*: https://www.nngroup.com/articles/mobile-tables/
- Baymard Institute, *Cart Abandonment Rate Statistics* (updated 2025-09-22): https://baymard.com/lists/cart-abandonment-rate
- Janakiraman, Syrdal & Freling (2016), *The Effect of Return Policy Leniency on Consumer Purchase and Return Decisions: A Meta-analytic Review*, Journal of Retailing 92(2): https://www.sciencedirect.com/science/article/abs/pii/S0022435915000822
- US eCFR, 16 CFR §233.1 *Former price comparisons*: https://www.law.cornell.edu/cfr/text/16/233.1
- European Commission, *Guidance on Article 6a of Directive 98/6/EC* (2021): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021XC1229(06)
- US FTC, *Bringing Dark Patterns to Light* (2022): https://www.ftc.gov/reports/bringing-dark-patterns-light
- Decoy effect (Ariely / The Economist example), secondary: https://en.wikipedia.org/wiki/Decoy_effect
- Silverman & Barasch (2023), *On or Off Track: How (Broken) Streaks Affect Consumer Decisions*, Journal of Consumer Research 49(6): https://academic.oup.com/jcr/article-abstract/49/6/1095/6623414
- Lally et al. (2010), *How are habits formed*, European Journal of Social Psychology: https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674
- Wood, Quinn & Kashy (2002), *Habits in Everyday Life*: https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Quinn_.Kashy_.2002_Habits_in_everyday_life.pdf
- Fogg Behavior Model: https://behaviormodel.org/
- web.dev, *Patterns for promoting PWA installation* (last updated 2019-06-04): https://web.dev/en/promote-install/
- web.dev, *How Progressive Web Apps can drive business success*: https://web.dev/articles/drive-business-success
- Chrome for Developers, *Revisiting Chrome's installability criteria*: https://developer.chrome.com/blog/update-install-criteria
- WebKit, *Web Push for Web Apps on iOS and iPadOS*: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- Chrome for Developers, `chrome.runtime` API (`setUninstallURL`): https://developer.chrome.com/docs/extensions/reference/api/runtime
- Chrome for Developers, *Inline-installation deprecation FAQ*: https://developer.chrome.com/docs/extensions/mv2/inline-faq
- Microsoft Learn, *ExtensionInstallBlocklist*: https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/extensioninstallblocklist
- Polar, *Pricing*: https://polar.sh/resources/pricing
- EthicalAds, *Developer Advertising Guide* (average CTR ~0.12%): https://www.ethicalads.io/advertiser-guide/
- Apple App Store, *Lungo* ($4.00): https://apps.apple.com/us/app/lungo/id1263070803?mt=12 ; *Amphetamine* (free, "no 'pro' version"): https://apps.apple.com/us/app/amphetamine/id937984704

Repo (read 2026-09-26): `PRODUCT.md`, `DESIGN.md`, `docs/00-conventions.md` §8, §10, §13.4, §13.8; `docs/01-brd.md` O5, O10, BR-06; `docs/02-prd.md` §2; `docs/09-monetization-impl.md` §1, §2.1, §2.9–2.11, §4, §7, §8; `docs/18-analytics-kpis.md`; `apps/web/src/lib/{license,analytics,extension,activate-page}.ts`; `apps/web/src/pages/pro.astro`; `apps/web/src/tool/{end,pwa,extras,sponsor,params,ctx}.ts`, `tool/ui/{actions,settings,rating}.ts`, `tool/ambient/{message,logic,shell}.ts`, `tool/stats/panel.ts`; `packages/core/src/stats.ts`; `apps/extension/src/controller.ts`; `apps/web/src/i18n/en.json`. Design boards: `Pro.dc.html`, `Main.dc.html`, `Extras.dc.html`, `ExtPopup.dc.html`, `PageExtension.dc.html`, and the scratchpad `INVENTORY.md`.
