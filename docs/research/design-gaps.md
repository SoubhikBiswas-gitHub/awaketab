# Design gaps: what stops people trusting, finishing, returning, installing, buying and recommending

Status: research input with canvas boards, not a spec · 27 September 2026 · Author: design-gap agent (wave 4) · Owner: Soubhik

Scope: every board on the redesign canvas was reviewed against the journey of the five personas in `PRODUCT.md` (Priya, Marco, Lena, Tomás, Kenji), at six moments: (a) trust within 5 seconds, (b) finish a first session, (c) come back, (d) install the PWA or the extension, (e) understand and buy Pro, (f) recommend it. The top gaps are drawn as 8 new canvas boards (prefix `Growth`, 38 wrapper boards). Nothing here changes a contract by itself; items that touch pill copy, storage keys, routes, ad rules, budgets, tokens or zero hydration need the docs update named in `CLAUDE.md` first.

Evidence labels: **[Fact]** verified in the repo (file named) or an external source (section 9, with URL and access date) · **[Estimate]** derived, inputs shown · **[Opinion]** a judgement call.

This report complements `docs/research/growth-conversion.md` (funnels, pricing, measurement). Where both touch the same moment, the boards here are the drawn version of its recommendations; the numbers there are not repeated.

---

## Summary for the owner

1. **The tool never says what it promises before you use it.** On `/` the explanation of honesty lives in the long section below the fold (`HomeBelow`). New board `GrowthFirstVisit` puts one sentence above the pill ("Keeps this screen on while this tab is visible.") and shows the proof as it happens: asked at 3:01:04 AM, confirmed 0.4 s later.
2. **"How do we know?" has no answer on the tool screen.** Kenji and Priya need to see why the pill is believable. `GrowthTrust` is a sheet opened from a link beside the pill: what the browser reported right now, what we store (nothing leaves the browser without the usage toggle), and where to check our work. It carries no testing claims we cannot back (copy correction 26 Sep).
3. **Hidden tabs are the biggest silent failure and nothing helps after it happens.** A hidden page loses its wake lock (MDN [Fact]). Today the user gets "Screen awake again" and nothing else, however often it happens. `GrowthPaused` adds one honest card after the third pause in a session: floating window (Chrome, Edge, Firefox 151+), the Chrome extension, or on phones the system timeout guide.
4. **The end of a session is the best moment we waste.** The Done state says "Session complete" and "Again". `GrowthDone` adds an honest receipt (held 28 of 30 min, paused 2 min, tab hidden once) and at most one gentle next step: install after the second session, iPhone Home Screen steps, the extension after repeated pauses, or one Pro line. "Not now" is remembered.
5. **iPhone users have no install path.** Safari has no install prompt (web.dev, Apple forum [Fact]); FR-PWA-03 asks for steps with the iOS 18.4 note, but no board drew them. `GrowthDone` (next = ios) does, using the existing en.json hint wording.
6. **Pro moments look different in each place and never state the price.** Lamp preview, the Message preview end and the stats lock each had their own treatment. `GrowthProMoment` makes one pattern: what you tried, what Pro adds, the price and refund in one line, and a free choice with equal weight. None of them appears on the awake screen during a session (D-R15).
7. **/pro has no "which plan fits me" help, and never tells anyone they do not need Pro.** `GrowthPlanHelper` asks three questions and can answer "Free is enough". It also routes recipe sites to Embed and screen owners to Kiosk.
8. **Business buyers only find Embed and Kiosk at the bottom of /pro and in the footer.** The highest-intent pages are `/for/cooking` and `/for/dashboards`. `GrowthB2B` puts a clearly separate entry card inside those articles, never near an ad slot and never on the tool card.
9. **Recommending AwakeTab has no path.** The rating prompt ends at "Thanks — that helps." `GrowthShare` offers an editable message after a 4 or 5 star rating (no referral codes, no tracking on the link), asks what to fix after a low rating, and shows what a shared setup link looks like to the person who opens it.
10. **Four doc conflicts block building some of this.** FR-PRO-08 vs D-R15 on previews during a session; Message preview 30 s (PRD) vs 60 s (code); kiosk `msg=` free (docs/09) vs `ambient.message` gated; install timing keyed on `meta.sessionCount`, which never counts ∞ or user-stopped sessions (growth-conversion F5). Decisions listed in section 8.
11. **All 8 boards follow DESIGN.md §11** (spacing scale, 1 px borders, radii, 44/52/60 controls, type scale, card and sheet elevation, one primary action) and the 26 Sep accuracy and copy corrections: all seven presets on phones, dated launch price with no "was", no battery-saver blame, "wake lock" lowercase, en.json wording reused.
12. **Verification:** node smoke test, 8 base boards × 333 prop combinations, 3,750 handler calls, **0 missing holes, 0 errors**; all 38 wrappers rendered in Chromium at canvas size with no overflow, no text contrast below AA and no target under 44 px.

---

## 1. What the canvas already covers

| Journey moment | Existing boards | What they do well | What is missing |
|---|---|---|---|
| (a) Trust in 5 s | `Main` + face and state wrappers, `HomeBelow` | Pill is exact and unmistakable; seven states drawn; Honest limits and support matrix below the fold | No promise above the fold; no visible link between pill and proof; privacy and "no account" only in long prose |
| (b) First session | `Main`, `Extras` (resume, second tab, denied, toasts), `Ambient`, `Pip*` | Every lock state, resume and fallback flows; floating window over a spreadsheet | Nothing helps after repeated hidden-tab pauses; the extension is not mentioned at the moment of the limit |
| (c) Come back | `DoneDark/Light` (ended), `ToolStats`, `ExtrasResume` | Clean Ready state with "Again" | No record of what the session really did; no next step; no reason to return beyond the job |
| (d) Install | `ExtrasInstall`, `PageExtension`, `ExtPopup*` | Chromium install banner with an honest limit line; full extension landing | No trigger or timing; no iPhone path; extension never offered in context |
| (e) Pro | `Pro`, `ProActivate`, `ProManage`, lamp swatches in Settings, Message card in `Ambient`, lock hatch in `ToolStats` | Strong /pro structure, persona sections, "What stays free" | Three unlike Pro moments with no price; no plan helper; business plans at the bottom |
| (f) Recommend | `ExtrasRating`, `ExtrasShareDesk` | Rating with optional note; share link with autostart | No path from a happy rating to telling someone; no preview of what the link opens |
| Business | `EmbedWidget`, `EmbedShowcase`, `PageKiosk`, `PageLibrary` | Full product pages | No entry from the use-case articles that bring the buyers |

## 2. Journey walk per persona

- **Priya (Edge, locked-down Windows laptop).** Opens `/30m` from a bookmark; needs to know within seconds that it will not claim more than it does, and that it is not a Teams-status trick. Breaks at: no promise line; switching to Outlook pauses the lock with no guidance. Fixed by `GrowthFirstVisit`, `GrowthTrust`, `GrowthPaused` (Chrome/Edge: floating window or extension).
- **Marco (iPad, Safari, floury hands).** Arrives on `/for/cooking`, uses the embedded tool, returns next dinner. Breaks at: no reason or path to return in one tap (no iOS install steps). His blogger never learns the embed exists. Fixed by `GrowthDone` (ios), `GrowthB2B` (recipe).
- **Lena (MacBook, projector, until 11:30).** Presents from another window, so the tab hides. Breaks at: repeated "Paused — tab hidden" with no answer; she would pay for Message mode but meets it only as a 60 s preview with a Pro card on the projector. Fixed by `GrowthPaused`, `GrowthProMoment` (message: no upgrade ask on the awake screen), `GrowthDone` (pro line afterwards).
- **Tomás (wall dashboards, kiosks).** Needs all-day screens with his logo. Breaks at: finds Kiosk only at the end of /pro; unclear what is free. Fixed by `GrowthB2B` (kiosk), `GrowthPlanHelper` (screens → free link or Kiosk licence).
- **Kenji (developer, distrusts claims).** Checks whether the tool is honest before trusting it overnight. Breaks at: no visible evidence trail from the pill. Firefox user: no extension exists. Fixed by `GrowthTrust` (open-source engine, how support is checked), `GrowthPaused` (Firefox: floating window 151+ or its own window, and the plain reason there is no extension).

---

## 3. Gap table

| # | Journey stage | Persona | Gap | Evidence | Proposed design | Board | Priority |
|---|---|---|---|---|---|---|---|
| G1 | (a) Trust | All, first visit | No promise sentence above the pill; the honesty story is below the fold | [Fact] `HomeBelow.dc.html` holds "What AwakeTab does"; `Main` has no heading. [Fact] NN/g: users decide in 10–20 s and need the value proposition up front | One-sentence promise + "The pill says Screen awake only after your browser confirms it" + live proof line / 3-step timeline with real timestamps and latency | `GrowthFirstVisit` | P1 |
| G2 | (a) Trust | Kenji, Priya | No inline answer to "is this real?" beside the pill | [Fact] NN/g credibility factor "upfront disclosure"; NN/g contextual help beats up-front tutorials | "How do we know?" link opens a sheet: Right now (what the browser reported, per state), Your data, Check our work | `GrowthTrust` | P1 |
| G3 | (a) Trust | Kenji | No path from the tool to external proof | [Fact] NN/g factor "connected to the rest of the web"; `PageLibrary` exists but is not linked from the tool | "The engine is open source" and "How we check support" rows (no unbacked testing claims) | `GrowthTrust` | P2 |
| G4 | (b) First session | Priya, Lena | Repeated hidden-tab pauses get the same toast every time | [Fact] MDN: a hidden document's lock is released automatically. [Fact] en.json `tool.toast.reacquired` only. growth-conversion L5 | After the 3rd pause in a session: card with the real options for this browser; quiet toast before that; X closes it for the session | `GrowthPaused` | P1 |
| G5 | (b) First session | Kenji (Firefox) | Firefox users are told nothing about their options | [Fact] BRIEF accuracy corrections: floating window in Firefox 151+; `PageExtension` states Firefox has no power API for extensions | Firefox variant: floating window, or its own window, plus the plain reason there is no extension | `GrowthPaused` (firefox) | P2 |
| G6 | (c) Come back | All | The end state records nothing about what really happened | [Fact] `Main` ended: "Session complete · ended at" only. [Opinion] a receipt is the strongest proof that the pill tells the truth | Receipt: minutes held of the session, paused segments on a timeline, start and end times | `GrowthDone` | P1 |
| G7 | (d) Install | Marco, Tomás, Priya | Install has no trigger or timing | [Fact] web.dev: promote after a completed user journey, allow dismissal, remember it | After the 2nd completed session, once per device, on the Done screen; "Install AwakeTab" or "Not now" (remembered) | `GrowthDone` (install) | P1 |
| G8 | (d) Install | Marco (iPad/iPhone) | No iOS install path drawn, although FR-PWA-03 requires it | [Fact] FR-PWA-03; Safari has no `beforeinstallprompt` (Apple forum); en.json `pwa.ios.hint` | Steps in one sentence with the 18.4 / 16.4 note, "Got it" | `GrowthDone` (ios) | P1 |
| G9 | (d) Extension | Lena, Priya | Extension offered only on `/extension`, HomeBelow limits and the footer | [Fact] `chrome.power.requestKeepAwake` works without a visible tab (Chrome docs) | Offered only where the limit bit: after 3 pauses (card) or on Done ("This tab was hidden 3 times") | `GrowthPaused`, `GrowthDone` (extension) | P1 |
| G10 | (e) Pro | Lena, Priya | Pro moments have three different treatments and no price | [Fact] `Ambient` Message card, Settings "Pro preview" label, stats hatch. [Fact] NN/g upfront disclosure | One pattern: what you tried, what Pro adds, price + refund line, free choice first and equal weight | `GrowthProMoment` | P2 |
| G11 | (e) Pro | Lena | Message preview ends with a Pro card on the awake screen | [Fact] D-R15: no upgrade prompts on the awake screen during a session | Preview end shows only facts and "Back to Clock"; the Pro line waits for the Done screen | `GrowthProMoment` (message), `GrowthDone` (pro) | P1 |
| G12 | (e) Pro | All | No help choosing a plan; nobody is told Free is enough | [Fact] pricing-plan guidance: explain who each plan is for and how price is calculated (Smashing) | 3 questions; answers include Free, Pro yearly, Pro lifetime, free embed, Embed licence, free kiosk link, Kiosk licence | `GrowthPlanHelper` | P2 |
| G13 | (e) Pro | All | Stats lock does not say older days are kept | [Fact] FR-STATS-01 keeps 365 days; growth-conversion P-list says older days are on the device | "Your first week is in" + locked cell legend "Locked — Pro keeps 12 weeks" | `GrowthProMoment` (stats) | P2 |
| G14 | (f) Recommend | Happy users | No path from a good rating to a recommendation | [Fact] `ExtrasRating` ends at "Thanks — that helps." | After 4–5 stars: editable message, Share… / Copy link / Not now, "no referral codes, nothing tracks" | `GrowthShare` (tell) | P3 |
| G15 | (f) Recommend | Unhappy users | Low ratings get the same flow as high ones | [Opinion] asking unhappy users to share is tone-deaf; [Fact] FR-UI-11 all ratings feed `aggregateRating` | 1–3 stars: "Anything we should fix? (optional)" and a line that all stars count equally | `GrowthShare` (low) | P3 |
| G16 | (f) Recommend | Lena, Priya | Shared links give no preview of what opens | [Fact] `ExtrasShareDesk` shows URL + autostart only | "What they will see" link card + exact behaviour sentence; "Nothing about you is in the link" | `GrowthShare` (preset) | P3 |
| G17 | Business | Marco's blogger | No Embed entry on recipe articles | [Fact] `ContentArticle` (/for/cooking) has no Embed mention; J9 in PRD | Separate aside after "Practical setup": live widget mock, free with credit, $29 / year licence | `GrowthB2B` (recipe) | P2 |
| G18 | Business | Tomás | No Kiosk entry on dashboard articles | [Fact] Kiosk only in /pro Business and `PageKiosk` | Aside with mode chips, the real URL and a wall preview; logo and message need the licence | `GrowthB2B` (kiosk) | P2 |
| G19 | All | Owner | No way to know if a suggestion helps or annoys | [Fact] docs/00 §10 has no suggestion event | PROPOSED `suggestion {id, action}` (see section 7) | none | P2 |

---

## 4. The new boards

All boards copy Main's tokens, helmet CSS (motion classes and reduced-motion block), logo header and theme switch, and follow DESIGN.md §11. Every base supports `theme` (auto | light | dark, auto follows the system live) and `layout` (phone | tablet | desktop). Generated by `scratchpad/growth/build.mjs` from shared fragments, so a change to a token or the header lands everywhere.

### 4.1 `GrowthFirstVisit` (G1)
- Props: `start` tap | auto (PRD J1 auto-starts on `/`; the owner decides, see section 8), `status` ready | awake.
- Promise (h1 at h2 scale so the tool keeps the fold), pill + "How do we know?", proof line on phones ("Asked at 3:01:04 AM · browser confirmed 0.4 s later"), a 3-step "What just happened" list on tablet and desktop that fills only as real events arrive, the ring, three facts (No account · No ads on this screen · Works offline after this visit), all seven presets and the lamp CTA.
- Honesty rule: every timestamp is a real engine event; nothing animates to suggest progress that did not happen.

### 4.2 `GrowthTrust` (G2, G3)
- Props: `state` awake | paused | blocked | fallback. Bottom sheet on phones (74 % so the pill stays visible), side sheet on tablet and desktop.
- Right now rows per state, with the corrected facts: no battery-saver blame; Power settings row says browsers do not report them and that iPhone Low Power Mode forces a 30-second Auto-Lock; blocked lists the real causes (tab not in front, frame without permission, Safari needs a tap); fallback says it needs this tab visible and uses a little more battery.
- Your data: No account, Kept in this browser, "Share anonymous usage data" switch (en.json label).
- Check our work: Honest limits, open-source engine, "How we check support" (browser documentation and automated tests; real-device results appear in the matrix once recorded).

### 4.3 `GrowthDone` (G6, G7, G8, G9, G11)
- Props: `next` install | ios | extension | pro | none, `paused` none | once.
- Receipt: big minutes held, "kept awake, of a 30 min session", timeline bar with lamp segments for held and amber hatched segments for paused, times at both ends, legend.
- One next step at most. Rules: install after the 2nd completed session, once per device (`meta.pwa.promptShownAt`); ios when Safari on iOS and not installed; extension when this session was hidden ≥ 3 times on Chromium desktop; pro line otherwise, capped (growth-conversion suggests 7 days); none when nothing applies. Dismissals persist.
- Phones hide the icon and the reassurance line when a card shows so the actions stay 20 px from the bottom.

### 4.4 `GrowthPaused` (G4, G5)
- Props: `browser` chrome | firefox | mobile (phones always get the mobile set), `count` first | third.
- First return: the existing toast plus a pull link "Why did it pause?". Third return: card "Screen awake again · Paused 3 times this session, 7 min in all", lead from en.json `tool.advice.hidden_document`, then per browser: Chrome/Edge floating window + extension; Firefox floating window (151+) + own window + why there is no extension; phones: resumes by itself + system timeout guide.
- Never shown while paused (the user is not looking); shown on return, once per session.

### 4.5 `GrowthProMoment` (G10, G11, G13)
- Props: `moment` lamp | message | stats.
- lamp (Settings, Ready): live preview on the ring in Mint; card "You are previewing Mint", price line, "Keep Aqua" and "See what's in Pro" at equal weight. Depends on O-01.
- message (awake screen): preview end with facts only and "Back to Clock". No price, no Pro link (D-R15).
- stats (Ready): figures (Today, This week, Days used this week, All time), 12-week map with the 8th day locked and labelled, card "Your first week is in" with price line.
- Price line everywhere: "Pro is $12 a year, or $19 once. Launch price until 8 December 2026, then $29. 5 devices, 14-day refund."

### 4.6 `GrowthPlanHelper` (G12)
- Props: `answer` free | once | year | site | screens (seed answers). Radio and checkbox rows (24 px marks in 56 px rows), result card with `aria-live`.
- Sells only what exists: custom end sounds and web schedules were removed (O-05); schedules appear only as "In AwakeTab for Chrome". Buttons "Get yearly Pro" / "Get lifetime Pro"; value line "At the launch price, less than two years of the yearly plan."; yearly note "If the plan ends, Pro features lock. Your settings and stats stay." (FR-PRO-04/05).

### 4.7 `GrowthShare` (G14, G15, G16)
- Props: `variant` tell | low | preset. Stars are a radio group in the lamp colour, as in `Extras` (amber stays reserved for Paused; O-12).
- tell: "Thanks — that helps." (en.json), editable message, Share… / Copy link / Not now, "No referral codes and no rewards. The link is plain awaketab.com, with nothing that tracks you or them."
- low: "Anything we should fix? (optional)", 280-character counter, Send / Maybe later, "Your stars count toward the public rating exactly like anyone else's."
- preset: length chips, "Start automatically" switch, link field, preview card of the link and the exact opening behaviour.

### 4.8 `GrowthB2B` (G17, G18)
- Props: `variant` recipe | kiosk. Article excerpt (placeholder dashboard H1 flagged in its caption), aside after "Practical setup", footer.
- recipe: widget mock (compact 320 × 96, "Keep awake by AwakeTab"), "while the page is visible", "Get the embed code" and "Buy an Embed licence · $29 / year per site".
- kiosk: Minimal / Clock / Message chips build the real URL; Message shows the note that it needs a Kiosk licence or Pro; wall preview.
- Placement rule: never inside or touching the tool card, at least one section away from any ad slot, never labelled or styled like an ad.

---

## 5. Principles for honest persuasion in AwakeTab

1. **Earn, then offer.** Suggest something only after the user got value (a completed session) or hit a real limit (the third pause). Never on arrival, never while awake (D-R15).
2. **Pull before push.** Explanations sit behind links the user chooses ("How do we know?", "Why did it pause?"). Contextual help at the moment of need beats up-front tutorials (NN/g).
3. **One suggestion per session, none on the awake screen, never a modal.** The Done screen holds at most one next step; the awake screen holds none.
4. **Symmetric choices.** The free option ("Keep Aqua", "Not now", "Back to Clock") has the same size and weight as the paid one and comes first. No confirmshaming (deceptive.design).
5. **Say the price, the limits and the refund at the moment of choice.** One line, same wording everywhere (NN/g upfront disclosure).
6. **The answer can be free, or not us.** The plan helper can say "Free is enough"; the paused card can send people to their own Auto-Lock setting.
7. **Remember "no".** A dismissal is stored on the device and respected; re-ask only when the relationship changes (web.dev).
8. **Evidence, not adjectives.** Show timestamps, latency, held vs paused minutes. No counts, testimonials or ratings until they are real (`aggregateRating` only at ≥ 10 real ratings, FR-SEO-02).
9. **Real dates, no timers, no former prices.** The launch price has a real end date and no strike-through (D-R13, FTC 16 CFR 233.1). No countdowns on offers (FTC 2022 report on fake urgency).
10. **No referral mechanics, no tracking on shared links.** People recommend tools that respect them; rewards and tracked links would undercut the brand.
11. **Ask unhappy users what to fix, not to share.** Every star counts in the public rating, so this is not review gating.

---

## 6. Contract and decision checks

| Item | Status in the boards |
|---|---|
| Pill copy (7 strings) | Exact, alone in the pill; text around it only (DESIGN.md §2.3, copy correction) |
| D-R12 battery saver | No "blocks" wording anywhere; Low Power Mode described as the 30-second Auto-Lock |
| D-R13 former price | No "was $29", no strike-through |
| D-R14 presets on phones | All seven on phones as a 4-column chip grid; tablet and desktop keep the segmented bar |
| D-R15 upgrade prompts | None on the awake screen or the Time's up countdown; lamp and stats moments drawn in Ready |
| O-01 lamp gating | Lamp moment assumes Mint and Sky are Pro; if O-01 changes, the moment disappears |
| O-05 unbuilt Pro features | Removed custom end sounds and web schedules from every Growth board |
| Ads | No ad slots on any Growth board; B2B asides are not ads and sit away from slots |
| Storage keys (docs/08) | No new keys. Uses `meta.sessionCount`, `meta.pwa.promptShownAt`, `onboarding.dismissedTips` (new tip ids: `done-install`, `done-ios`, `done-ext`, `done-pro`, `paused-help`; ids are values, list them in docs/08 §2.6) |
| Engine data | The receipt needs paused intervals per session. Today these exist only as `lock_state` transitions in memory; after a reload the receipt can say "since reload" (implementation note) |
| Tokens and §11 | Only DESIGN.md colours; spacing, radii, controls, type and elevation per §11; header 60 / 68 |

---

## 7. Prioritised actions

| # | Action | Why (evidence) | Effort | Impact | Where in repo / design |
|---|---|---|---|---|---|
| 1 | Decide the four conflicts in section 8 (previews during a session, Message preview length, kiosk message gate, install trigger count) | Blocks 1, 4, 6, 9 below; D-R15 vs FR-PRO-08 | S | H | `docs/02-prd.md` FR-PRO-07/08, FR-PWA-03; `docs/09` §2.9, §7; `docs/redesign/DECISIONS.md` |
| 2 | First-visit promise and proof line above the pill | G1; NN/g 10–20 s value window | M | H | `apps/web/src/components/ToolPanel.astro`, `tool/ui/pill.ts`, `src/i18n/en.json` (+7 locales); board `GrowthFirstVisit` |
| 3 | "How do we know?" sheet | G2, G3; NN/g upfront disclosure and contextual help | M | H | new lazy module in `tool/ui/dialogs.ts`, `tool/ui/pill.ts`; board `GrowthTrust` |
| 4 | Done receipt and the one-next-step rule (install after 2nd session, iOS steps, extension after ≥ 3 pauses, one capped Pro line) | G6–G9, G11; web.dev install timing; growth-conversion #7, #12 | M | H | `tool/end.ts`, `tool/pwa.ts`, `tool/ui/banners.ts`, `tool/store.ts`; docs/08 §2.6 tip ids; board `GrowthDone` |
| 5 | Back-from-hidden card after the 3rd pause (per browser) | G4, G5; MDN lock release on hide | S | H | `tool/main.ts` (reacquired toast), `tool/ui/toast.ts`, en.json; board `GrowthPaused` |
| 6 | One Pro-moment pattern with a price line; move the Message preview ask off the awake screen | G10, G11, G13; D-R15 | S | M | `tool/ui/settings.ts`, `tool/ambient/*`, `tool/stats/*`; board `GrowthProMoment` |
| 7 | Plan helper section on /pro (above the price cards on phones, beside them on desktop) | G12; Smashing pricing guidance | M | M | `apps/web/src/pages/pro.astro`; board `GrowthPlanHelper` |
| 8 | Business entry asides on `/for/cooking`, `/for/dashboards`, `/for/kiosk` | G17, G18 | S | M | `components/ArticlePage.astro` (slot after "Practical setup"), content frontmatter flag; board `GrowthB2B` |
| 9 | Tell-a-friend after 4–5 stars; "what to fix" after 1–3; link preview in Share | G14–G16 | S | M | `tool/ui/rating.ts`, `tool/ui/actions.ts` (`sharePath`); board `GrowthShare` |
| 10 | PROPOSED event `suggestion {id, action}` (id ∈ done-install, done-ios, done-ext, done-pro, paused-help, pro-lamp, pro-stats, share-tell, b2b-embed, b2b-kiosk; action ∈ shown, accepted, dismissed) | G19; know whether a suggestion helps or annoys. Needs docs/00 §10, docs/18 §3 and /privacy first | S | M | `apps/web/src/lib/analytics*`, docs/00 §10 |
| 11 | Count user-stopped sessions ≥ 5 min in `meta.sessionCount` before keying install on it | growth-conversion F5: ∞ users never qualify | S | M | `tool/end.ts` |

---

## 8. Open questions (added to `docs/redesign/DECISIONS.md` as O-67 to O-71; O-35 already covers the Message preview ask)

1. **Previews during a session.** FR-PRO-08 allows "locked-feature previews" but says "never during held"; D-R15 bans upgrade prompts on the awake screen. Proposal: a user may preview a Pro lamp or Message mode during a session, but the price and Pro link appear only when the tool is in Ready or on the Done screen.
2. **Message preview length.** Code and inventory say 60 s; FR-PRO-07 says 30 s. Boards use 60 s.
3. **Kiosk message.** docs/09 says free kiosk links have `msg=`; the Kiosk licence unlocks `ambient.message`. Boards treat Message as licensed (with the 60 s preview).
4. **`/` auto-start on first visit.** PRD J1 auto-starts; the redesign shows "Keep awake · 30 min". `GrowthFirstVisit` supports both; the proof list works either way.
5. **Install trigger.** Use completed sessions including user-stopped ≥ 5 min (growth-conversion #10) or keep `meta.sessionCount` as is?

## 9. Sources (all accessed 26 September 2026)

- MDN, Screen Wake Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- Chrome for Developers, chrome.power: https://developer.chrome.com/docs/extensions/reference/api/power
- web.dev, Patterns for promoting PWA installation: https://web.dev/articles/promote-install
- web.dev, Installation prompt: https://web.dev/learn/pwa/installation-prompt
- Apple Developer Forums, request for `beforeinstallprompt` in Safari: https://developer.apple.com/forums/thread/807603
- MDN, Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- NN/g, Trustworthiness in Web Design: 4 Credibility Factors (2016): https://www.nngroup.com/articles/trustworthy-design/
- NN/g, Onboarding Tutorials vs. Contextual Help (2023): https://www.nngroup.com/articles/onboarding-tutorials/
- NN/g, 5-Second Usability Test: https://www.nngroup.com/videos/5-second-usability-test/
- Smashing Magazine, Designing Better Pricing Plans UX (2022): https://www.smashingmagazine.com/2022/07/designing-better-pricing-page/
- Deceptive Patterns, types: https://www.deceptive.design/types
- FTC, Bringing Dark Patterns to Light, press release (15 Sep 2022): https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers
- Repo facts: `PRODUCT.md`, `DESIGN.md` §2, §11, `docs/02-prd.md` (J1–J10, FR-PRO-07/08, FR-PWA-03, FR-UI-10/11, FR-STATS-01/02, FR-SEO-02), `docs/08-data-storage.md` §2.5–2.6, `docs/09-monetization-impl.md` §7 and line on one upsell surface, `docs/00-conventions.md` §10, `docs/redesign/DECISIONS.md`, `docs/research/growth-conversion.md`, `apps/web/src/i18n/en.json`, canvas boards listed in section 1.

---

## 10. Canvas boards and verification

Files (in the scratchpad canvas project `directions/project/`): 8 bases (`GrowthFirstVisit`, `GrowthTrust`, `GrowthDone`, `GrowthPaused`, `GrowthProMoment`, `GrowthPlanHelper`, `GrowthShare`, `GrowthB2B`) and 38 wrappers named `Growth<Name><Phone|Tablet|Desk><Dark|Light>`. Board sizes: app screens 390 × 844, 820 × 1180, 1280 × 800; page boards `GrowthPlanHelper` 390 × 2080 / 820 × 1600 / 1280 × 1100 and `GrowthB2B` 390 × 1680 / 820 × 1640 / 1280 × 1280.

Verification (27 September 2026):
- Smoke test (`scratchpad/growth/smoke.mjs`, Node 22): every enum prop combination of every base (333 in total) renders with **0 missing `{{holes}}`**; 3,750 handler calls without errors; `sc-if`, `sc-for` and element tags balance; every wrapper points at a real base with declared prop values.
- Render sweep (`scratchpad/growth/allshots.mjs`, Chromium): all 38 wrappers at canvas size, no element outside the board, no clipped text, no interactive target under 44 × 44 px, no text below WCAG AA contrast. Sheets that scroll internally (`GrowthTrust`, stats) are real scrolling sheets. Screenshots in `scratchpad/growth/shots/`.
