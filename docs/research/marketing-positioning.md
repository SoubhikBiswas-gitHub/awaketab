# Marketing: positioning and messaging audit

Status: research input, not a spec · 26 September 2026 · Author: VP Product Marketing agent (wave 5) · Owner: Soubhik

Scope: category and positioning, ICP ranking, the core promise and how to prove it, the messaging hierarchy, brand voice, naming, banned phrases, and page-by-page audits with copy you can use for home, /pro, /extension, /embed, /kiosk, /library, the Chrome Web Store listing, OG and share text, 404, the Done screen and the in-tool Pro moments.

This builds on:
- `market.md`: competitors, demand, willingness to pay. Its positioning statement (§4) and mine agree; this file turns it into copy.
- `growth-conversion.md`: funnels, pricing, where upgrade asks may appear.
- `fact-check-2026-09-26.md`: what browsers really do.
- `canvas-copy-audit.md` and `editorial-audit-articles.md`.

Where those files already settled something, I cite them and don't repeat the work. `design-gaps.md` did not exist when I wrote this.

Evidence labels: **[Fact]** means verified in the repo (file named), on the live sandbox, or in an external source listed in §9 (accessed 26 Sep 2026). **[Estimate]** is a number I derived, with the inputs shown. **[Opinion]** is a judgement call.

Contracts respected: the seven pill strings are quoted exactly and never extended. No ad placement changes. No storage key, route or token changes. Where a rewrite needs a new i18n key, it says so. New copy uses no em dashes. The two exceptions are the fixed pill strings and the docs/06 §4 title suffix ` — AwakeTab`, which is a spec formula.

---

## Summary for the owner

1. **Your domain is not registered.** `whois awaketab.com` returns "No match" and the name does not resolve [Fact, 26 Sep 2026]. Every canonical URL, every `og:image`, the support address `support@awaketab.com` (which the refund policy tells buyers to email) and the extension homepage all point to it. So today every share card is broken and refund emails go nowhere. Anyone can register it. Buy it and the other three TLDs before anything else on this list (BR-15, O-16).
2. **Positioning: compete head-on in the existing "keep screen awake" category. Don't invent a new one.** Lead with a mechanism, not an adjective.
   - The honest-limits disclaimer is now table stakes: nosleep.page, keep-screen-on.com, screenawake.com and keep-awake.com all say the tab must stay visible [Fact, §9].
   - The unmet need is **silent failure**. "Doesn't work, and doesn't say why" is the most common complaint across about 40 keep-awake extensions (market.md §1.2), for example "doesn't work nor a way to tell if its enabled".
   - What only AwakeTab has: a status that follows the real lock, an end time you choose (including a clock time), recovery after a reload, and a fix when the browser says no.
3. **Recommended one-liner:** "AwakeTab keeps your screen on from a browser tab, and only says *Screen awake* once your browser has confirmed it." **Recommended tagline:** "Keeps your screen awake. Says so only when it is." It replaces "The tab that keeps your screen awake.", which describes every competitor.
4. **ICP by revenue potential:**
   1. Tomás (Kiosk + Pro).
   2. Lena (lifetime Pro). Widen her to **teachers**: classroom laptops that sleep every 10 minutes, and no page targets them (market.md §4).
   3. Kenji (lifetime Pro, plus library authority).
   4. Priya (volume and content-ad revenue; Pro only if web schedules ship).
   5. Marco (pays nothing directly). The recipe blogger behind him is a sixth buyer, but a small one: most recipe plugins already bundle Cook Mode.

   Lead paid messaging with Lena and Tomás, and search and volume messaging with Priya.
5. **The 5-second proof already exists; the marketing never points at it.** The pill goes "Starting…" then "Screen awake" while you watch, and hiding the tab flips it to "Paused — tab hidden" and changes the tab title. Make "watch the pill" the proof on the home hero, the OG image, the store screenshots and the Done screen, which becomes a receipt ("Held the whole 30 min" or "Paused once, 2 min").
6. **Several written proof claims are false today and must go before launch:**
   - "Every support claim comes from a device on a shelf here", "in our tests". The About page says device results are pending.
   - "Battery saver wins", plus a library demo scenario labelled "battery saver denies the lock". Chromium and WebKit have no such check.
   - "the exact file on npm" and `npm install @awaketab/wake`. The package is not on npm (registry returns "Not found"), and github.com/awaketab/awaketab returns 404.
   - "Works in … Brave, Arc and Opera" on /extension. `chrome.power` in Opera and Arc is unverified.
   - The embed FAQ says "amp-iframe cannot delegate the permission", which is false.
7. **The word "honest" is overused to the point of sounding defensive:** 193 times in content, 40 on the canvas, 18 in UI and pages [Fact, grep]. Budget: at most once per page, never in an H1. Show the mechanism instead ("says Screen awake only after your browser confirms it").
8. **/pro sells features that don't exist on the web** (schedules, custom end sounds; growth F2). The GrowthDone board repeats it ("Pro adds schedules and custom end sounds."). The honest Pro pitch today is "your own message, more colours, 12 weeks of history, and schedules and auto-start in the extension." The Pro line to repeat everywhere: "Pro changes how AwakeTab looks and what it remembers. It never changes whether your screen stays awake."
9. **The "lifetime" wording needs a promise you can keep.** Lifetime tokens re-validate every 90 days with a 30-day offline allowance (PRD FR-PRO-04). If awaketab.com ever went away, "lifetime" Pro would lapse within about 4 months. Either publish a shutdown pledge or say "one payment, no renewal" and never "forever" (Owner decision M-05).
10. **The OG images are generic and pre-brand:** a blue "A" in a ring, beige ground, "awaketab.com · en". They don't show the product or the promise. Redraw them in Clear Night with the real pill and ring (copy in §7.8), and add `og:site_name`.
11. **Chrome Web Store:**
    - Drop "for Chrome" from the store title. Google's branding rules want "for Google Chrome™" with the ™ [Fact], and the same manifest name also shows on Edge Add-ons.
    - Rewrite the short description around the one thing a tab can't do (hidden tab) and the one thing others don't do (a badge that lights only while the request is held).
    - Raise the stated minimum to Chrome 120, or qualify the 30-second keep-alive.
12. **What I'd do on Monday:**
    - Register the domain.
    - Delete the six false proof claims.
    - Put the new one-liner under the home H1.
    - Ship the /pro board structure without the unbuilt features.
    - Fix the library links.
    - Regenerate the OG cards.

    All are S effort except the OG redraw (M).

---

## Scorecard (0–10)

| Area | Score | One-line reason |
|---|---|---|
| Category choice | 7 | Correctly competes where the demand is ("keep screen awake"). It just never says so as a category phrase outside titles |
| Positioning clarity | 5 | The right idea ("honest status") is stated as an adjective, not a mechanism. The H1 is word for word what every clone says |
| Differentiation vs alternatives | 6 | Real and defensible (verified status, until-time, resume, fix-on-failure, one engine across five surfaces), but half the marketed differences (no install, visible-tab limit) are now table stakes |
| Messaging hierarchy | 4 | No agreed one-liner, a generic tagline, no named pillars. Each page invents its own lead |
| Proof | 4 | The best proof (the live pill) is in the product. The written proof includes claims that are false today (§3.8) |
| Voice consistency | 6 | Mostly calm and plain. Drift: "honest" overuse, 58 en.json lines with em dashes, quips ("A green dot is a conversation with your employer"), jargon in articles |
| Home (live) | 6 | A strong tool-first layout. The below-fold copy repeats battery-saver and device-testing claims that are wrong |
| /pro (live) | 2 | Two price cards, a strike-through on a price nobody paid, no feature list (growth F1) |
| /pro (canvas board) | 7 | The right structure and FAQ. It sells two unbuilt features and still shows "was $29" |
| /extension | 6 | Clear limits and permissions. Store links are placeholders; Brave/Arc/Opera support and the Chrome 116 floor are unverified |
| /embed | 6 | Speaks to the right buyer (the blogger). The AMP claim is false, it doesn't disclose that the widget reports the host domain, and it undersells the credit link |
| /kiosk | 6 | Good builder and price cards. It misses the Safari one-tap caveat and the invoice/tax line |
| /library | 4 | A strong developer pitch undercut by dead npm and GitHub links and a false "battery saver" demo scenario |
| Chrome Web Store listing | 6 | Plain and bounded. Title trademark form, a weak short description, unverified browsers |
| OG / share | 2 | Every `og:image` points at an unregistered domain. The image is a placeholder "A" |
| 404 | 5 | Nice idea (the tool still works). The headline uses an em dash, and the meta description duplicates home |
| Done screen (canvas) | 7 | Calm and true ("Kept awake for 32 min. The screen can sleep now."). It misses the receipt and has one false Pro line |
| In-tool Pro moments | 5 | They sit in the right places. The wording sells unbuilt items ("schedules"), uses "Locked" and gives no preview path |
| Naming | 7 | The name is clear and searchable. Face and lamp names are fine. "Bold" is the odd one out |
| Brand protection | 1 | The .com is unregistered. The fallback NeverDim .com has been registered since 2000. No trademark screen is on file |

---

## 1. Competitive alternatives (what people do instead)

Dunford starts with the alternatives because positioning built on anything else "sounded good in the office, but it didn't work with customers" [Fact, April Dunford].

| Alternative | Who uses it instead | What they say | Where AwakeTab wins | Where it loses (say so) |
|---|---|---|---|---|
| **Change the system setting** (screen timeout, Auto-Lock) | Everyone who can. The true #1 alternative | n/a | Priya can't (group policy), Lena won't change a shared podium Mac, Marco doesn't want to undo it after dinner, Low Power Mode greys it out on iPhone | Permanent and free when allowed. Our guides should say "if you can change it, do" (docs/06 §2.6 already does) |
| **Keep-awake web pages**: nosleep.page and about 10 clones (keep-screen-on.com, screenawake.com, keep-awake.com, stayawake.pages.dev…) | Searchers for "keep screen awake" | nosleep.page: "Click the central ring to start or stop keeping your screen awake"; presets 30 min / 1 hr / 2 hr / Custom. keep-screen-on.com: "prevents your screen from dimming or sleeping. No download or setup required". keep-awake.com: "😴 This web app keeps your screen awake ⏰". **All four now state the visible-tab limit** [Fact, §9] | A verified status (nosleep.page sets "active" before the lock promise resolves: BRD §2.1 teardown, 7 Sep 2026, not re-verified today), until a clock time, resume after reload, a fix when blocked, a chime at the end, faces readable across a room, 8 languages | They are one click too, and some are older and rank. "No install, no account" is no longer a difference |
| **Native utilities**: Amphetamine (Mac, free), Caffeine, Lungo ($4 Mac), PowerToys Awake (Windows), `caffeinate` | People who can install software | Amphetamine: "the most awesome keep-awake app ever created for macOS"; Lungo: "Keeps your computer awake" [Fact] | No install or admin rights, works on phones and tablets, shows state visibly across a room | They work with the window hidden and, in some cases, with the lid closed. Say so on /vs (docs/06 §2.5 "when the alternative is better") |
| **Keep-awake extensions**: Google's Keep Awake (1M users, updated Aug 2023), Keep Awake (Display \| System) (100k), Caffeine - Keep Awake (80k) | Chromebook and desktop users | "Override system power-saving settings." / "Keep your system or display from going to sleep with just one click!" [Fact] | AwakeTab for Chrome adds timers, until a time, schedules, a badge that lights only while the request is held, a message when Chrome refuses, and the same status language as the web app. Their reviews ask for exactly this: "I wish it would remember the settings", "no way to tell if its enabled" (market.md §1.2) | They exist, have installs and ratings, and Google's is the default answer on ChromeOS. Google's isn't on Edge (market.md) |
| **Mouse jigglers** (USB, software, "online" jigglers) | People who want to *look* active | "Keeps Teams green", "Stay Available on Teams", "Undetectable" [Fact] | We refuse this job. That refusal is part of the trust story for Priya's employer and for Kenji. Refusing is safe to say out loud: Wells Fargo fired more than a dozen staff in 2024 over "simulation of keyboard activity" (market.md §1.4) | The largest demand pool in the space (MS Q&A threads with 1,700+ "same question"). Those searchers will leave, and that is fine (growth §2.1) |
| **Keep-awake pages that over-claim**: screenawake.online, keepawake.app | Teams-presence seekers | "Stealth F15 key simulation… prevents Away status in Teams, Slack & Zoom"; "Used by 47,291 remote workers" (market.md §1.1) | We never make those claims, and never print a user count we can't show | They win the clicks for the promise we won't make |
| **Play a video / tap the screen** | Marco, anyone in a hurry | n/a | Hands-free, with a timer that ends | Free and familiar |
| **Recipe-plugin Cook Mode** (for the blogger) | Recipe sites | BRD §2.1: plugins gate Cook Mode behind $49–149/yr (repo claim, not re-verified today) | A standalone widget, one tag, free with credit, $29/yr without | Plugins are already installed and integrated |
| **Kiosk software / MDM** (for Tomás) | Ops teams | n/a | One URL, no install, $19 once per site | Real kiosk shells lock the device down; we don't (docs/06 for/kiosk limit) |

**What this means [Opinion]:** the fight is not "web page vs native app". It is "a keep-awake page you have to keep checking vs one you can believe from across the room". That is the lane.

---

## 2. Positioning (Dunford's five components)

### 2.1 Unique attributes (only what the repo proves)

| # | Attribute | Proof in the product | Alternatives that have it |
|---|---|---|---|
| A1 | The status follows the real lock: seven states; "Screen awake" only while a wake lock is held or the video fallback is confirmed playing. The tab title and favicon mirror it | BR-01, FR-ENGINE, `tool.pill.*`, DESIGN.md §2.3 | None verified. Clones show a toggle state |
| A2 | Ends when you say: presets, custom up to 7 days, **until a clock time** (`/until/11-30`), a chime, an extend prompt. Duration timers count only awake time; until-time keeps the wall clock | `packages/core/src/session.ts` `remainingMs`, J2, J4 | Clones: presets only. nosleep.page has no until-time |
| A3 | Picks up after a reload or a power cut (resume banner, auto-accept for kiosks) | J5 | None of the web clones (BRD §2.1) |
| A4 | Tells you the fix when the browser says no ("Blocked — here's the fix" + cause + fallback). After a hidden tab, it points to the floating window or the extension | `tool.advice.*`, GrowthPaused board | None |
| A5 | Built to be read from 3 m: four faces, big numerals, ambient modes (Cook, Clock, Night) | DESIGN.md §7, PRODUCT.md principle 2 | Partial (clocks exist on screenawake.com) |
| A6 | Nothing on the awake screen but the job: no ads, no third-party scripts, no account, no cookies on tool pages, works offline, 8 languages | BR-08, BR-13, CI assertion | Some clones run ads on the awake screen (BRD §2.1) |
| A7 | One engine and one status language across tab, floating window, Chrome extension, embed widget, kiosk URL and an MIT library | FR-LIB-02 | None |

### 2.2 Value (attribute → what it means for the person)

- A1 + A4 → **"I can see it's handled, and if it isn't, I know why."** Relief, not vigilance. PRODUCT.md's emotional goal, word for word.
- A2 → **"Set it and walk away; it ends at 11:30 without me."**
- A3 → **"The dashboard is still on tomorrow morning."**
- A5 → **"I can check it from the stove, the lectern or across the office."**
- A6 → **"I can use it on a work laptop without installing anything or explaining it to IT."** (Never claim IT approves it.)
- A7 → **"When the tab isn't enough, the next step speaks the same language."**

### 2.3 Best-fit customers

People for whom **a silent failure is expensive or embarrassing** and who **can't or won't install software**:
1. A presenter in front of a room (Lena). A black projector is public.
2. An operator of screens nobody touches (Tomás). He finds out the next morning.
3. A developer watching long jobs (Kenji). A lie from the tool costs a night.

Priya and Marco are the volume segment. Their pain is real but low-stakes per incident, so they value "one tap, works" more than proof.

### 2.4 Market category

**Recommendation [Opinion]: "keep screen awake" tool, head to head. Don't create a category.**
- The demand is literally that query cluster (BRD §2.1, O6), and nobody searches for "screen status", "wake lock manager" or "presence-free keep-awake".
- Win inside the category on one sub-position: **the keep-awake tool you can believe.** In copy, the category phrase is "keep your screen awake" (H1, titles). The sub-position lives in the line under it.
- Each Business SKU sits in its buyer's category, not ours:
  - Embed → "Cook Mode button for recipe sites".
  - Kiosk → "keep kiosk and signage screens on".
  - Library → "Screen Wake Lock library, an alternative to NoSleep.js".

### 2.5 Positioning statement (internal, not for publishing verbatim)

> For people who need a screen to stay on and can't or won't change system settings, especially screens watched from across a room, AwakeTab is a keep-awake tool that runs in a browser tab. Unlike keep-awake pages that show a toggle, and native utilities that need an install, AwakeTab shows the lock's real state, ends at a length or a clock time you choose, picks up after a reload, and tells you the fix when the browser refuses. When a tab isn't enough, the same status continues in a floating window and a Chrome extension.

It supersedes BRD §3's statement. That one leads with features ("ends sessions at a clock time, survives reloads…") before the reason anyone should care.

---

## 3. Core promise, proof, and the messaging hierarchy

### 3.1 The promise

**"When AwakeTab says Screen awake, your browser has confirmed it. When it can't keep the screen on, it says so, and says why."**

Why honest status matters (the argument to make everywhere, in plain words):
- It answers the category's #1 complaint. Across about 40 keep-awake extensions the most common review is "it doesn't work", with no reason given, for example "doesn't work nor a way to tell if its enabled" and "IT DIDN'T WORK. So, I'm removing it now." (market.md §1.2, verbatim).
- Keep-awake tools fail silently. You find out when the lock screen appears, the projector goes black or the dashboard is dark in the morning.
- A tool that says "awake" when it isn't is worse than no tool, because it teaches you to stop checking.
- Browsers really do take the lock back: on a hidden tab, under a Permissions-Policy, on Safari without a tap, or on Firefox at ≤ 5% battery [Fact, fact-check]. So a status that reflects the real answer is the whole product, not a nicety.

### 3.2 Proof in 5 seconds

Order of proof, strongest first. None of it needs a testimonial or a number we don't have.

| # | Proof | Where it lives | Status |
|---|---|---|---|
| P1 | **Watch it happen.** On `/` the lock autostarts: pill "Starting…" → "Screen awake" (target ≤ 300 ms). The GrowthFirstVisit board's "What just happened" log ("Asked your browser for a wake lock · Browser confirmed the lock · Pill switched to Screen awake") makes it legible | Tool, first visit | Exists (log is a board) |
| P2 | **Break it on purpose.** Switch tabs and come back: the tab title changes, the pill says "Paused — tab hidden", and on return "Screen awake again. Paused for 2 min while this tab was hidden." A tool that admits its limit live is more convincing than any claim | Tool, GrowthPaused board | Exists |
| P3 | **The receipt.** The Done screen states what was held: "Kept awake for 30 min. Held the whole time." or "Paused once, 2 min." | Done screen (§7.10) | New line needed |
| P4 | **Check our work.** No third-party requests on the tool page (visible in devtools), source on GitHub, a support matrix with dates and sources, "How AwakeTab knows" panel | GrowthTrust board, /about, /learn | Links must work (§3.8) |
| P5 | **Say no in public.** "Does it keep Teams green? No." on the home page, the extension listing and the store | FAQ, store | Exists |

Use P1 and P2 as the hero of the OG card, the store screenshots and any launch post (Show HN: "switch tabs and watch the title").

### 3.3 One-liner

> **AwakeTab keeps your screen on from a browser tab, and only says "Screen awake" once your browser has confirmed it.**

Short form (≤ 80 chars, for bios and directories): "A browser tab that keeps your screen on and tells you the truth about it."

### 3.4 Tagline options

| # | Tagline | Notes |
|---|---|---|
| **T1 (recommended)** | **Keeps your screen awake. Says so only when it is.** | Category + promise in 9 words. Works as `app.tagline`, footer, OG subtitle |
| T2 | The screen stays on. The pill shows it. | Strong once people know the pill; weak cold |
| T3 | Keep your screen awake, and see that it is. | Softer, benefit-led, good for non-English adaptation |
| T4 | A keep-awake tab you can check from across the room. | Good for Lena and Tomás pages, too long for global use |
| T5 | Screen on. Status true. | Terse, developer-flavoured. Use on /library only |

Retire: "The tab that keeps your screen awake." (true of every competitor).

### 3.5 Three pillars with proof points

**Pillar 1: It says so only when it's true.**
- "Screen awake" only while the browser holds the lock or the video fallback is confirmed playing (BR-01, e2e-tested).
- Hidden tab → "Paused — tab hidden" and the tab title changes. Refused → "Blocked — here's the fix", with the cause.
- No synthetic input, ever. No claims about Teams or Slack presence.
- The engine is MIT source you can read (link to the real repository, §3.8).

**Pillar 2: It stops when you say.**
- 15 min to 4 h, a custom length up to 7 days, until a clock time, or until you stop.
- A 30-minute session gives you 30 awake minutes: time while the tab was hidden doesn't count. Until-time sessions still end at that time.
- A chime and an optional notification at the end; "Time's up. Keep going?" with +15 / +30 / +1 h.
- A reload or a restart picks up where it left off.

**Pillar 3: Nothing between you and the screen.**
- No install, no account, no ads on the awake screen, no third-party scripts on the tool.
- Readable from across a room: four clock faces, Cook, Clock and Night modes.
- Works offline once opened, installs as an app, 8 languages.
- When a tab isn't enough: the floating window (desktop Chrome, Edge, Firefox 151+) or AwakeTab for Chrome.

### 3.6 Objection handling

| Objection | Answer (use as written) | Where |
|---|---|---|
| "My screen still went to sleep." | "Check the pill. If it said Paused — tab hidden, the browser took the lock back when you switched away. Keep the tab in view, open the floating window, or use AwakeTab for Chrome. A closed lid sleeps no matter what." | Home FAQ, paused state |
| "Will it keep me green on Teams or Slack?" | "No. Teams and Slack set Away from typing and mouse inactivity, not from a lit screen. A wake lock can stop your computer sleeping (which shows you Offline), but not the Away timer. AwakeTab never fakes input." (Precise per Microsoft's presence docs, market.md §1.4) | Home FAQ, /learn Teams page, /extension, store |
| "Could this get me in trouble at work?" | "AwakeTab doesn't fake activity, doesn't change your status and doesn't bypass sign-in or lock policies. It keeps the display on, the same way a video player does. If your employer has rules about screen locking, follow them." | /for/work-laptop, /vs/mouse-jigglers. Never mention firings in product copy; that's for /vs evidence only |
| "I'm the IT admin. How do I allow or block this?" | "AwakeTab uses the browser's Screen Wake Lock. Chrome has admin policies that turn it off (`AllowScreenWakeLocks`; market.md marks this [S], so confirm the policy page and the Edge equivalent before publishing); when they do, the pill says Blocked — here's the fix. The extension needs only the power, storage and alarms permissions." (Link a short "For IT admins" section; market.md §3.5) | /about or /privacy section **[new]** |
| "Why not just change the setting?" | "If you can, do: it's free and permanent. AwakeTab is for when you can't (a work laptop), don't want to (a shared projector), or want it to end on its own." | Home, /guides |
| "Is this allowed on my work laptop?" | "It uses a standard browser feature and installs nothing. It doesn't bypass sign-in or lock policies. If your company has rules about screen locking, follow them." | /for/work-laptop. Never imply IT approval |
| "Does it drain the battery?" | "The lit screen uses the battery; the wake lock itself costs almost nothing. Plug in for long sessions. On Chromium, AwakeTab can stop by itself at a battery level you pick." | Home FAQ |
| "Is it tracking me?" | "No account, no cookies, no fingerprinting. Settings and stats stay in this browser. Anonymous usage counts are optional; turn them off in Settings." | Home FAQ, /privacy |
| "Why pay for Pro if free does the job?" | "You shouldn't, to keep a screen awake. Pro is for screens you leave on: your own message, more colours, 12 weeks of history, schedules in the extension." | /pro |
| "I hate subscriptions." | "Then pay once: $19 until 8 December 2026, then $29. No renewal." (No "forever" until M-05.) | /pro |
| "What if AwakeTab shuts down?" | Needs an owner answer (M-05). Draft if a pledge is adopted: "If AwakeTab ever shuts down, we'll release a final update that unlocks Pro features on the devices you activated." | /pro FAQ |
| "Why no Firefox or Safari extension?" | "Those browsers don't give extensions a power API. The web app works there while its tab is visible." | /extension |
| "Is the widget going to slow my site or track my readers?" | "The loader is under 3 KB and lazy. It sets no cookies and loads nothing from anyone but awaketab.com. It sends anonymous start and end counts that include your site's domain, never the page path." | /embed (new disclosure, FR-EMBED-06) |

---

## 4. ICP ranking by revenue potential

Revenue figures are **[Estimate]**, built on growth-conversion §4.1 and §4.8 and docs/00 §8 prices. The ordering is **[Opinion]**. None of this is measured yet.

| Rank | Persona | Buyer? | What they'd buy | Price point | Willingness | Reach (search volume share) | Revenue potential | Strategic value | Lead message |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Tomás**, ops/kiosk | Yes, business budget | Kiosk $19 (1 site) / $49 (5), maybe Pro for Chromebook schedules | $19–$49 + $12–29 | High | Low | **Highest per buyer**; invoices via Polar remove friction | Case-study potential (logo on a real wall) | "One URL keeps every screen on, and puts your logo on it." |
| 2 | **Lena**, lecturer (and school **teachers**) | Yes, personal | Lifetime Pro (Message mode, taller floating window, extension schedules) | $19 → $29 | Medium–high (teachers pay about $36/yr for Classroomscreen, market.md §3) | Medium (presentations, `/until`, managed school laptops) | **High**: the clearest personal Pro fit | Teachers share tools with colleagues; no competitor page targets them | "Stays on until 11:30, even while you're in your slides." |
| 3 | **Kenji**, developer | Sometimes | Lifetime Pro (12-week history, CSV, extension auto-start); GitHub Sponsors | $19–29 | Medium, anti-subscription | Low–medium (HN, `/for/ai-agents`) | Medium | **Highest non-revenue value**: library links, HN launch, trust signal for the rest | "It tells you exactly what the browser did. Read the source." |
| 4 | **Priya**, locked-down laptop | Rarely | Pro only if web weekday schedules ship (F2) | $12 | Low | **Highest** ("keep laptop screen on", work-laptop cluster) | Low direct; highest *indirect* (content-page ads, north-star hours, word of mouth) | Volume that makes the site rank | "No install, no admin rights. Your screen stays on while the tab is open." |
| 5 | **Marco**, home cook | No | Nothing directly | n/a | Very low | High (cooking, iPad; peaks in November, market.md §2.3) | Near zero direct. His **recipe blogger** is a separate buyer (Embed, $29/yr per site, recurring), but most recipe plugins already include Cook Mode in paid tiers, so expect few licences (market.md §1.7) | The widget's credit link is an acquisition channel for sites without Cook Mode | "Keeps the recipe on screen while you cook. No touching." |

**Implication [Opinion]:**
- Paid messaging (the /pro sections, Pro OG card, store Pro screenshot) leads with Lena and Tomás.
- Top-of-funnel content leads with Priya and Marco.
- Kenji gets the technical pages (/library, /learn, Show HN).
- Add the **recipe blogger** as a named sixth persona in docs/02 §2 (Owner decision M-11). They are a real buyer the persona table doesn't cover, and worth more as links than as licences.
- Treat **teachers** as a Lena variant with Priya's constraint (a managed laptop). Market.md ranks locked-down work and school laptops as the largest persona group. A `/for/classroom` page is market.md action 13 and needs a docs/00 §7 route change first (M-14). Lead line for it: "Keep the classroom screen on through the lesson. No install, no admin rights." (Not "stops it locking": a school's lock policy can still lock, fact-check.)

---

## 5. Brand voice guide

**Calm, honest, precise** (PRODUCT.md). In practice:

| Rule | Do (real copy to keep) | Don't (real copy to fix) | Rewrite |
|---|---|---|---|
| Say what happens, not how you feel about it | "Kept awake for 32 min. The screen can sleep now." (Done board) | "Nothing here is a guess dressed up as a fact." (GrowthTrust) | "Everything under Right now is read from your browser this second." (keep the first sentence, drop the second) |
| Show the mechanism instead of the adjective | "The pill says Screen awake only after your browser confirms it." (GrowthFirstVisit) | "@awaketab/wake: the honest wake lock library" (library H1) | "@awaketab/wake: a wake lock library that reports what the browser did" |
| Name the limit and the next step together | "Chrome takes the lock back whenever this tab is hidden. Two ways to keep the screen on while you work in another window:" (GrowthPaused) | FAQ "Does it still work if I switch tabs?" answered "No" 51 times with no next step (editorial audit) | "No. The browser takes the lock back when the tab is hidden. Keep it in view, open the floating window, or use AwakeTab for Chrome." |
| No quips about the user's situation | "Presence follows keyboard and mouse idle time, not a lit display." | "A green dot is a conversation with your employer, not a browser tab." (home FAQ) | Cut the second sentence |
| No false punch | "iPhone Low Power Mode forces a 30-second Auto-Lock." | "Battery saver wins." (home limits) | "Low Power Mode on iPhone shortens Auto-Lock to 30 seconds. Turn it off in Settings → Battery." |
| No em dashes in new copy | "Paused for 2 min while this tab was hidden." | "That page isn't here — but the tool is." (404), 58 en.json lines | "This page isn't here. The tool is." |
| Specific over general | "Safari needs iOS 16.4; a Home Screen app needs iOS 18.4." | "Works everywhere" (video fallback, Main board) | "It needs this tab visible and uses a little more battery." |
| Buttons name the outcome | "Keep awake · 30 min", "Buy for one site" | "Get Pro" on both plan cards | "Get lifetime Pro · $19", "Get yearly Pro · $12 a year" |
| Never claim testing you haven't done | "Real-device results appear in the matrix once recorded." | "Every support claim comes from a device on a shelf here" (home author box) | See §7.1 |
| Pro is "adds", never "unlock" | "Pro adds colours, modes, history and schedules on top." (Pro FAQ) | "Unlock ambient packs, schedules and twelve-week stats" (`page.pro.description`) | See §7.2 |
| "Honest" at most once per page, never in an H1 or a button | Footer: "No ads on the awake screen, now or later." (a promise, no adjective) | "Honest limits" as a heading on every page; "honest" 193× in content | Heading: "What it can't do" |

Mechanics:
- British spelling ("licence", "behaviour", "colour"); straight apostrophes in code and data, typographic ones allowed in prose.
- 12-hour times with AM/PM in en.
- Sentence case for headings and titles. The home `<title>` is Title Case today and should match the rest.
- Quote pill strings exactly and never build a sentence inside a pill.
- Numbers as digits for durations ("30 min", "5 devices").
- Second person, grade 8 reading level (docs/06 §11).

---

## 6. Naming checks

| Name | Verdict | Notes |
|---|---|---|
| **AwakeTab** | Keep | Descriptive-suggestive, matches the query, easy to spell. Web search for "AwakeTab" finds only this project [Fact]. That is not a trademark clearance: BR-15's screen report is not in the repo. **Risk:** awaketab.com is unregistered [Fact, whois], and the fallback brand NeverDim can't have its .com (registered 2000-10-12) [Fact]. "Awake" is crowded (PowerToys Awake, Google Keep Awake, keepawake.app). Always write it as one word with capital T, never "Awake Tab" or "Awaketab" |
| **AwakeTab for Chrome** | Keep on the website; change the store title | Chrome Web Store branding: reference Google products with "for", "for use with" or "compatible with" and include ™, e.g. "for Google Chrome™" [Fact]. The same name also appears on Edge Add-ons. See §7.7 and M-04 |
| **AwakeTab Pro** | Keep | Clear. Name each plan in buttons ("lifetime Pro", "yearly Pro") |
| **Embed licence / Kiosk licence** | Keep | Name by where it runs, which is how buyers think. Say "Business" only as a section label |
| **@awaketab/wake** | Keep | Only works once it exists on npm (§3.8) |
| **"Lamp" / "Lamp colour"** | Keep in Settings, avoid in marketing | Evocative and ties to the logo bead. Unexplained on /pro or the OG card ("more lamp colours") it reads as jargon. Marketing: "colours" or "Mint and Sky colours". Settings label "Lamp colour" with named swatches is fine. Replaces `settings.accent` "Accent" (needs O-01) |
| **Face names: Ring, Bold, Horizon, Tide** | Keep three; Bold is the weak one | Ring, Horizon and Tide are nouns you can picture. "Bold" is an adjective and collides with text formatting. Option: "Digits". Low priority (M-09) |
| **Ambient mode names** (Standard, Clock, Focus, Minimal, Night, Message, Cook) | Keep | Clear, one word, translatable |
| **"Floating window"** | Keep, exclusively | Never "PiP pill", "floating pill" or "floating timer" (editorial audit; `page.pip.title` still says "AwakeTab floating timer") |
| **"Pilot Light"** (mark name on the Brand board) | Internal only | Fine as a design name. Never surface it: it has a gas-appliance meaning |
| **"Video fallback"** | Keep in UI (pill contract), explain once | First use on a page: "the video fallback (a silent video that keeps the screen on)" |
| **"No limit" / ∞ / "Until I stop"** | Follow editorial audit | ∞ visible, "Until I stop" as the accessible name, "until you stop" in prose. Never "indefinitely" in UI |

---

## 7. Page-by-page audits and rewrites

New strings that need i18n keys are marked **[new key]**. Everything else replaces an existing key or board string.

### 7.1 Home (`/`): hero

**Audit:**
- The H1 "Keep your screen awake" is right for SEO; keep it.
- Nothing in the first screen says why this one is different. `page.home.intro` holds the promise, but it sits below the tool.
- `<title>` "Keep Your Screen Awake — AwakeTab" is Title Case, unlike every other title.
- The meta description sells features ("Honest status, presets, until-time") instead of the promise.

**Rewrite:**

| Element | Copy |
|---|---|
| `<title>` | Keep your screen awake in a browser tab — AwakeTab (50) |
| Meta description | Keeps your screen on from this tab. It says Screen awake only once your browser confirms it, and ends when you choose. No install, no account. (142) |
| Search phrases to work into the first 100 words (market.md §5.1) | "without installing anything", "without changing settings", "no admin rights" (the "keep computer awake without software / changing settings" and "keep laptop awake online" completions) |
| H1 (unchanged) | Keep your screen awake |
| Line under H1 **[new key `page.home.sub`]** | It says Screen awake only after your browser confirms it. |
| Pill note, held (canvas, keep) | Keeps this screen on while this tab stays visible. |
| Primary button (canvas, keep; needs key) | Keep awake · 30 min |
| Proof link beside the pill (GrowthTrust, keep) | How do we know? |
| First-visit log (GrowthFirstVisit, keep) | Asked your browser for a wake lock · Browser confirmed the lock · Pill switched to Screen awake |
| Optional first-visit hint, note area, once per device **[new key; experiment, not default]** | Try it: switch tabs and come back. The pill will say what happened. |

On phones the sub-line must not push the length block or the actions (DESIGN.md §5 dock). If it can't fit at 360×640, drop it on phones and keep the proof link.

### 7.2 Home: below the fold

**Audit:** the structure follows docs/06 §2.1 and is good. The problems are claims:
- "stops dimming, sleeping and showing the lock screen" (idle-lock policies can still lock).
- "seven days of stats stay in this browser" (up to 365 days are kept; 7 are shown).
- "Battery saver wins … battery saver can refuse the request" (false).
- "In our tests Chromium on Windows also deferred idle sleep; macOS did not" (Apple docs say the opposite).
- "Every support claim comes from a device on a shelf here … retested after each browser and OS release" (not true yet).
- The quip in the Teams FAQ.
- "Keep the computer awake while downloading" (a tab holds the display).
- The Pro strip and product cards required by docs/06 §2.1 are missing.

**Rewritten sections:**

**What AwakeTab does** (replaces the two paragraphs)
> AwakeTab asks your browser to keep the screen on while this tab is visible, and the pill only says Screen awake once the browser has said yes. Pick a length (15 min to 4 h, a custom length up to seven days, or until a clock time) and the display stops dimming and going to sleep. Switch to another tab and the browser takes the lock back: the pill changes to Paused — tab hidden, and a timed session waits for you instead of running down.
>
> It works without installing anything, changing settings or needing admin rights, and there is no account. Settings, the current session and your stats stay in this browser. There are no ads on this screen and no third-party scripts, so it loads fast and works offline after the first visit. Use Install AwakeTab in the header to give it its own window.

**How it works** (keep the three steps; fix step 3)
> 1. **You pick how long.** A preset, a custom length or a clock time. Each is one key: 1 to 6 for presets, 0 for no end time, U for a clock time, Space to start or stop.
> 2. **AwakeTab asks the browser.** It uses the Screen Wake Lock API, the same feature video players use. The browser can say yes, say no, or take the lock back later, and the pill shows each answer as it happens.
> 3. **You get the time you asked for.** A 30-minute session counts only the minutes the screen was really held, so hiding the tab doesn't eat into it. An until-time session ends at that time. At the end you hear a chime and can add more time or stop.

**What it can't do** (replaces "Honest limits"; facts per fact-check)
> - **A hidden tab can't hold the screen on.** Switching tabs or apps, or minimising, pauses it. For a screen that stays on behind other windows, use the floating window or [AwakeTab for Chrome](/extension).
> - **A closed lid still sleeps.** No web page or extension can change that. Use your lid setting, an external display or a native app.
> - **Some devices shorten the timeout anyway.** iPhone Low Power Mode sets Auto-Lock to 30 seconds. Firefox stops at 5% battery or less when not charging. Safari needs one tap to start.
> - **It doesn't touch your chat status.** Teams, Slack and Zoom set Away from keyboard and mouse activity. AwakeTab never fakes input.
> - **It holds the screen, and while it does, Windows and macOS don't idle-sleep.** For a computer that stays awake with the screen off, use AwakeTab for Chrome at System level or a native app.
> - **Other rules still apply.** A work sign-in policy, a bank's auto-logout, exam software or a monitor that sleeps on lost signal are outside its reach.

(Item 5 depends on the fact-check's Windows/macOS finding. Re-check before shipping, and hedge to "on current Chrome and Edge" if Linux or Firefox behave differently.)

**Scenario list fix:** "Keep the computer awake while downloading" → "Keep the screen on while a download finishes".

**Author box** (replaces the "device on a shelf" paragraph)
> **Who builds this.** AwakeTab is built and maintained by Soubhik Biswas. Browser support comes from vendor documentation and browser source, checked on the date shown, and from automated tests of every lock state. Results from real devices are added to the matrix as they are recorded. [How it's tested](/learn/how-we-tested) · [Source code](link to the real repo) · [Changelog](/changelog)

**FAQ rewrites** (8, per docs/06 §2.1)

| Q | A |
|---|---|
| Does it still work if I switch tabs or minimise the window? | No. The browser takes the lock back when the tab is hidden, and the pill says Paused — tab hidden. Come back and it resumes by itself. To keep it on behind other windows, open the floating window or use AwakeTab for Chrome. |
| Will it keep my laptop awake with the lid closed? | No, and no web page can. Closing the lid follows your system's lid setting. Change that setting, use an external display, or use a native app. |
| Does it keep Teams or Slack showing me as available? | No. Presence follows your typing and mouse, not a lit screen. AwakeTab never fakes input. |
| Does it stop the whole computer sleeping, or only the screen? | It holds the screen. While the screen is held, Windows and macOS don't idle-sleep either. For a computer that stays awake with the screen off, use AwakeTab for Chrome at System level. |
| Why does my iPhone lock anyway? | Low Power Mode sets Auto-Lock to 30 seconds. Turn it off in Settings → Battery. Safari needs iOS 16.4 or later; a Home Screen app needs iOS 18.4. |
| What is the video fallback? | A silent one-frame video that keeps the screen on in browsers without the wake lock feature. It starts only after you tap, and the pill says Awake via video fallback. It uses a little more battery. |
| How much battery does it use? | The lit screen uses the battery; the lock itself costs almost nothing. Plug in for long sessions. In Chrome and Edge, AwakeTab can stop by itself at a battery level you choose. |
| Is it free? What happens to my data? | Free, with no sign-up. Settings, the session and your stats stay in this browser: no cookies, no fingerprinting. Anonymous usage counts are optional in Settings. No ads on this screen, now or later. |

**Product strip** (docs/06 §2.1; at the end of content, never inside the tool viewport) **[new keys]**
> **More from AwakeTab**
> - **AwakeTab for Chrome.** Keeps the screen on even with the tab hidden. Free. → /extension
> - **AwakeTab Pro.** Your own message, more colours and 12 weeks of history, for screens you leave on. From $12 a year. → /pro
> - **For your website.** A Cook Mode button for recipe pages. → /embed
> - **For kiosks and signage.** One URL, your logo. → /kiosk
> - **For developers.** The wake lock library behind AwakeTab. → /library

### 7.3 `/pro`

**Audit:** see the scorecard and growth F1/F2/F12. The board is the right base. My changes:
- Remove "Your own end sound" and every web "schedules" claim until built. "Schedules" appears only as an extension feature.
- Lifetime first.
- Name the plan in each button.
- Replace the strike-through with the dated line.
- Make "costs less than two years" computed or remove it.
- Add the shutdown FAQ (M-05).
- Put the refund line beside the buttons.

**Rewrite:**

| Element | Copy |
|---|---|
| `<title>` | AwakeTab Pro: plans, prices and what stays free (47; starts with the brand, suffix waived per docs/06 §4) |
| Meta description | Pro adds your own message, more colours, 12 weeks of stats and extension schedules. From $12 a year or $19 once. Keeping the screen awake stays free. (149) |
| H1 | AwakeTab Pro |
| Lead | For screens you leave on. Pro changes how AwakeTab looks and what it remembers. It never changes whether your screen stays awake: that part is free for everyone. |
| Chips | 5 devices · No account · 14-day refund |
| Section: At the lectern | **Put your own line on the screen.** Message mode shows your text in big type while the screen stays on, so the back row can read "Back at 11:30 AM" during a break. Up to 80 characters. Try it free for 60 seconds from Message mode. Presenting from another window? With Pro, the floating window grows taller so +15 and Stop are easier to hit from the lectern. |
| Section: On the wall | **Your logo, on the hours you choose.** Show your logo on ambient and kiosk screens. In AwakeTab for Chrome, pick the days and hours a dashboard stays on, at Screen or System level, and nobody has to touch it. |
| Section: Overnight builds | **Twelve weeks of history, and a file to check it.** Free stats show the last 7 days. Older days are already saved in this browser, and Pro shows 12 weeks of them and exports them as a CSV file. In AwakeTab for Chrome, Pro can also start by itself when Chrome opens or when a site you choose is open. |
| Section: Colours | **Mint and Sky.** Two more colours for the ring, the bead and the button. Aqua and Violet stay free. (Only after O-01) |
| Section: On a work laptop | **No ads on the guides.** Read the device and troubleshooting guides without ads. (Only if ads are live on content pages, G1) |
| Plans heading | Two ways to pay |
| Plans lead | Both plans add everything above on up to 5 devices. No monthly plan, no account. |
| Lifetime card | **Lifetime** · $19 once · Launch price until 8 December 2026, then $29. · Pay once, no renewal. · Button: **Get lifetime Pro · $19** |
| Yearly card | **Yearly** · $12 a year · Renews once a year through Polar. Cancel any time in the Polar portal. · Button: **Get yearly Pro · $12** |
| Under both buttons | 14-day refund, no questions asked. Taxes added at checkout where they apply. Polar handles payment; AwakeTab never sees your card. |
| After you pay | Your licence key arrives by email and on the receipt page. This device activates by itself; on another device, paste the key on the Enter licence key page. AwakeTab for Chrome uses one of your five devices. |
| What stays free (heading + lead) | **What stays free.** Keeping a screen awake never needs Pro. All of this works without a key: every length, until a time and custom lengths up to 7 days; all seven states of the pill; four clock faces; Standard, Clock, Minimal (and any other modes per O-02); Aqua and Violet; 7 days of stats; install and offline; AwakeTab for Chrome at Screen or System level; all 8 languages. |
| FAQ: better lock? | **Does Pro keep the screen awake better?** No. Free and Pro use the same wake lock and the same pill. Pro adds a message, colours, history and extension schedules. |
| FAQ: account? | **Do I need an account?** No. Polar handles checkout and emails you a licence key. There is no password. |
| FAQ: device? | **What counts as a device?** Each browser where you enter the key. AwakeTab for Chrome counts as one. A device unused for 90 days is freed when you activate a new one. |
| FAQ: shutdown **[new; needs M-05]** | **What happens to lifetime Pro if AwakeTab shuts down?** (Answer per the owner's decision; draft in §3.6.) |
| FAQ: refund | **Can I get a refund?** Yes, within 14 days, no questions asked. Email support with your receipt or use the Polar portal. A refund turns Pro off on your devices; free features don't change. |
| Business | **For your website or your screens.** Embed licence, $29 a year per site: removes the "Keep awake by AwakeTab" credit from the Cook Mode button on your recipes. Kiosk licence, $19 once for one site or $49 for five: your logo and message on kiosk and signage screens. |
| Footer link | Already bought Pro? Enter licence key · Manage devices |

Remove the board line "Costs less than two years of the yearly plan." or compute it from `PLAN_PRICES` (growth §4.3).

### 7.4 `/extension`

**Audit:**
- The lead is good but long.
- CTAs are search placeholders ("Store links go live once the listing is approved."), fine until approval.
- "Works in Chrome, Edge, Brave, Arc and Opera (version 116 or later)" is unverified for Arc and Opera and ignores the Chrome 120 alarm floor (fact-check).
- The description promises "schedules" without saying they're Pro.
- The comparison table on the board is the best asset on the page; lead with it.

| Element | Copy |
|---|---|
| `<title>` | Keep your screen awake with the tab hidden — AwakeTab (53) |
| Meta description | A Chrome and Edge extension that keeps your screen, or just your computer, awake with the tab hidden or minimised. Free, no tracking, no fake input. (148) |
| H1 | AwakeTab for Chrome |
| Lead | Keeps your screen on when the AwakeTab tab is hidden or Chrome is minimised. Chrome itself holds the request, so switching windows no longer pauses it. It has timers, remembers your settings, and tells you when Chrome says no. |
| Chromebook line **[new key]** | On a Chromebook, including school and work ones: if your admin allows extensions, it keeps the screen on through a lesson or a long read. If they don't, the web app works in a tab. |
| CTAs | Add to Chrome · Get it for Edge |
| Note | Free. Chrome and Edge 120 or later. Other Chromium browsers may work; we haven't tested them yet. |
| Table heading | What changes when Chrome holds it |
| Table rows (board, keep) | With the tab hidden or the window minimised: *Pauses until you come back* vs *Keeps going while Chrome is running*. What stays awake: *The screen* vs *The screen, or only the computer*. Status: *The pill in the tab* vs *The popup pill and a toolbar badge: ON, SYS or minutes left*. Shortcut: *Space, while the tab is in front* vs *Alt+Shift+A from any tab*. Schedules and auto-start: *No* vs *With Pro* |
| Pro line | With Pro: weekly schedules, and auto-start when Chrome opens or when a site you choose is open. One Pro key covers up to five devices across the web app and the extension. |
| Limits heading | What it can't do (items unchanged, they're good) |
| Firefox card (keep) | Using Firefox or Safari? … |

### 7.5 `/embed`

**Audit:**
- The H1 "Keep your readers' screens awake" is the best headline on the site; keep it.
- The lead mixes three audiences (recipes, dashboards, docs); lead with recipes (the buyer with money and the Cook Mode feature).
- "AMP pages are not supported (amp-iframe cannot delegate the permission)" is false (fact-check).
- "makes no request to anyone but awaketab.com" is true, but the page never mentions that the widget sends start/end counts with the host domain (FR-EMBED-06).
- "Priority support" in the licence table is undefined (M-06).
- The canvas board has no buy button (copy audit).

| Element | Copy |
|---|---|
| `<title>` | Cook Mode button for recipe sites — AwakeTab (44) |
| Meta description | A keep-screen-on button for your recipes: readers tap once and the screen stays on while they cook. Free with a small credit link, or $29 a year per site. (154) |
| Kicker | AwakeTab Embed |
| H1 (keep) | Keep your readers' screens awake |
| Lead | No Cook Mode in your recipe plugin? Add one with one line of code. Readers tap it once and their screen stays on while they cook, with a big timer they can pause with a knuckle. The same status pill as AwakeTab, in eight languages. Works for docs and dashboards too. |
| Evidence line (optional, with its caveat) | When Betty Crocker added a keep-awake option, people who turned it on had 3.1× longer sessions than everyone else. That compares people who chose it, not an A/B test ([web.dev case study](https://web.dev/case-studies/betty-crocker), via market.md §1.7). |
| Demo caption | This is the real widget on a sample recipe. Tap Start. |
| Install heading (keep) | Install: one line |
| Privacy line (replaces the current sentence) | The loader reserves its space (no layout shift), loads lazily and sets no cookies. It loads nothing from anyone but awaketab.com. It sends anonymous start and end counts that include your site's domain, never the page or the reader. |
| AMP line | AMP: amp-iframe passes allow="screen-wake-lock" through. We haven't tested it yet. |
| Licence heading | Free with a credit link, or $29 a year without |
| Licence lead | The free button carries a small "Keep awake by AwakeTab" link. The Embed licence removes it and uses your brand colour. The wake lock and every mode work the same either way, so readers never get a worse button because a site didn't pay. |
| Buy button | Buy an Embed licence · $29 a year |
| Under the button | Covers one site, including www and staging. Taxes added at checkout; Polar sends the invoice. If the licence lapses, the credit link comes back quietly. 14-day refund. |
| Secondary link | Already bought one? Activate an Embed key |
| FAQ add | **Does it track my readers?** No cookies, no fingerprinting, no third parties. AwakeTab counts starts and ends per site, without the page address. |

### 7.6 `/kiosk`

**Audit:**
- Clear builder and pricing.
- Missing: "Safari and iPad need one tap first" (fact-check, High), the invoice/tax line (growth §2.4), a per-site definition, and the refund line on the page (the board has it; live doesn't).
- The lead's em dash.

| Element | Copy |
|---|---|
| `<title>` | Keep kiosk and signage screens on — AwakeTab (44) |
| Meta description | One URL keeps a kiosk, lobby or dashboard screen on, starts by itself and shows your message. Free. A Kiosk licence adds your logo: $19 once per site. (150) |
| H1 (keep) | AwakeTab for kiosks and signage |
| Lead | Point a kiosk browser, a lobby screen or a wall dashboard at one AwakeTab URL. It starts by itself, shows your message or a clock, and keeps the display on while the page is in front. No install, no account. Safari and iPad need one tap the first time. |
| Free section heading | Free for every screen |
| Licensed heading | With a Kiosk licence: your logo, no AwakeTab branding |
| Licence list (keep) | Your logo above the timer and on the ambient screen · No AwakeTab wordmark and no rating or upgrade prompts, ever · Your message stays on permanently · The licence is checked on the device, so it works offline |
| Price cards (keep) | $19 once · 1 site → Buy for one site · $49 once · 5 sites → Buy for five sites |
| Under the cards | One payment, no renewal. A site is one physical installation. Taxes added at checkout, and Polar sends the invoice. 14-day refund, no questions asked. More than five sites? Email us. |
| Limit (keep, drop em dash) | A web page can keep the display on only while it is the visible tab. Set the kiosk browser to open this URL full screen, keep the device plugged in, and leave lid and sleep settings to the device's power plan. No web page can override those. |

### 7.7 `/library`

**Audit:**
- The pitch is strong for Kenji. But:
  - `npm install @awaketab/wake` fails today (npm "Not found").
  - "Running awaketab-wake.iife.js v1.0.0, the exact file on npm" is false.
  - The GitHub link github.com/awaketab/awaketab is a 404. The public source is github.com/SoubhikBiswas-gitHub/awaketab.
  - "Simulated: battery saver denies the lock" teaches the false claim.
- "The maintained replacement for NoSleep.js" implies a drop-in API; it isn't one.

| Element | Copy |
|---|---|
| `<title>` | @awaketab/wake: Screen Wake Lock library — AwakeTab (51) |
| Meta description | A small MIT library for the Screen Wake Lock API. It reports seven states and why each changed, with a video fallback. An alternative to NoSleep.js. (148) |
| Kicker | Open source · MIT · v1.0.0 |
| H1 | @awaketab/wake: a wake lock library that tells you what the browser did |
| Lead | Keeps a web page's screen from dimming and reports the result: seven states, a reason and an advice code on every change, and `held` only while the browser really holds the lock. Zero dependencies, 3.4 KB gzipped with the fallback video inlined. An actively maintained alternative to NoSleep.js, whose last release was December 2020. |
| Demo scenario label (replaces "battery saver denies") | Simulated: the browser refuses the lock (NotAllowedError) |
| Demo scenario help | An injected lock that rejects the way a hidden page, a Permissions-Policy or Safari without a tap does. |
| Demo source line | Running `awaketab-wake.iife.js` v1.0.0, the same file the package ships. (Say "on npm" only after publishing) |
| Comparison lead (keep) | Both use the native Wake Lock when it exists. The difference is what you are told when it does not work. |
| Limits heading | What a wake lock can't do (keep the body, drop the em dash) |

Until the package is published, replace the install block with "Coming to npm. Until then, copy `packages/wake` from the repository." and link the real repo.

### 7.8 Chrome Web Store listing (`apps/extension/store/listing.md`)

**Audit:**
- Title "AwakeTab for Chrome — Keep Screen Awake": em dash, Google trademark without ™, and the same string shows on Edge.
- The short description is plain but spends words on "one click" (every rival says that) instead of the hidden-tab difference.
- The detailed description is accurate and bounded; the order should lead with the difference.
- The minimum-version line conflicts with the fact-check (alarms need Chrome 120 for 30 s).
- Screenshots are placeholders; the StoreAssets board is good. Keep "The badge tells the truth" and "System never says Screen awake."

**Rewrite:**

| Field | Copy | Chars |
|---|---|---|
| Name (manifest `name`, ≤ 75) | AwakeTab: Keep Screen Awake | 27 |
| Edge display name | AwakeTab: Keep Screen Awake | 27 |
| Short description (≤ 132) | Keep your screen, or just your computer, awake with the tab hidden. Timers and end times. A badge that only lights when it's true. | 130 |

(If the owner keeps "for Chrome" in the name, write "AwakeTab for Google Chrome™: Keep Screen Awake" and accept the Edge oddity; M-04.)

**Detailed description:**

> AwakeTab keeps your screen on, or just your computer awake, while Chrome is running. It uses Chrome's own power feature, so it keeps working when the tab is hidden or the window is minimised. A web page can't do that.
>
> WHAT IT DOES
> • Screen or System. Screen keeps the display on. System keeps the computer awake and lets the screen dim, and the popup says exactly that.
> • Stops when you say: 15 minutes to 4 hours, until a time like 6:00 PM, or until you stop.
> • A badge you can trust. It shows the minutes left, ON or SYS, and only while Chrome is holding the request. The popup says "Screen awake" only after Chrome accepts it.
> • If Chrome or your organisation blocks it, the popup says so instead of pretending.
> • Remembers your level, default length and settings.
> • Alt+Shift+A starts or stops it from any tab.
> • An optional notification when time is up, with +30 min and Stop.
>
> WITH AWAKETAB PRO
> • Weekly schedules: pick the days and hours to stay awake.
> • Auto-start when Chrome opens, or when a site you choose is open.
> • One Pro key works on up to five devices, across the web app and the extension.
>
> WHAT IT CAN'T DO
> • It works only while Chrome is running.
> • It can't stop sleep when you close a laptop lid.
> • It doesn't keep Teams or Slack showing you as available. Those follow your keyboard and mouse, and AwakeTab never fakes input.
> • Firefox and Safari have no power feature for extensions, so there's no version for them. The AwakeTab web app works there while its tab is visible.
>
> PRIVACY
> No account, no ads, no remote code. Anonymous usage counts are off unless you turn them on, and never include web addresses, tab titles or site names. Site access is asked for one site at a time, only for auto-start sites you add, and page content is never read.
>
> Made by Soubhik Biswas. Source code and changelog: awaketab.com/extension

Rules for the listing (policy):
- No unattributed testimonials and no keyword stuffing [Fact, CWS program policies]. So no "keep awake, stay awake, no sleep, caffeine, jiggler" keyword lists.
- No keyword repeated more than 5 times (market.md §5.2).
- Don't name Google's extension.
- Edge Add-ons allows up to 7 hidden search terms: "keep screen awake", "prevent sleep", "screen timeout", "keep display on", "stay awake", "caffeine alternative", "presentation" (market.md §5.2).

Screenshot captions (from the StoreAssets board, tightened):
1. "Keeps your screen on, even with the tab hidden." Sub: "Screen awake only after Chrome accepts the request."
2. "Stops when you say." Sub: "15 min to 4 h, until a time, or until you stop."
3. "The badge tells the truth." Sub: "Minutes left, ON or SYS, and only while it's held."
4. "Screen or System." Sub: "System never says Screen awake."
5. "Pro: awake on the hours you choose." Sub: "Weekly schedules and auto-start. Schedules run while Chrome is running."

### 7.9 OG and share text

**Audit:**
- `og:image` URLs are absolute to `https://awaketab.com/…`, which is unregistered, so every share card renders without an image today [Fact: curl to the .pages.dev copy returns 200, the .com doesn't resolve].
- The image is a placeholder: beige ground, blue ring, a letter "A", the page title, and "awaketab.com · en". It doesn't match Clear Night and doesn't show the product.
- `og:title` repeats the full `<title>` including " — AwakeTab".
- There is no `og:site_name` (grep of live HTML).

**Rules:**
- `og:site_name` = AwakeTab.
- `og:title` = the share headline without the suffix.
- `og:description` = the promise plus one concrete detail.
- The image shows the pill exactly ("● Screen awake"), a ring or face, the end time *outside* the pill, and the headline.
- Drop "· en" (docs/06 §9 says show the locale name only for translations).

| Page | og:title | og:description | Image concept |
|---|---|---|---|
| Home | Keep your screen awake | Keeps your screen on from a browser tab, and says Screen awake only when your browser has confirmed it. (103) | Ring face, pill "Screen awake", "until 5:30 PM" below; subtitle T1 |
| Preset `/30m` | Keep your screen awake for 30 minutes | One tap. It stops by itself after 30 minutes, and the pill shows it's really on. | Ring at 30:00, pill |
| `/until/*` (shared) | Keep your screen awake until 11:30 AM | Opens AwakeTab set to end at 11:30 AM. The pill says Screen awake once your browser confirms it. | Horizon face, sun near the horizon |
| `/for/cooking` | Keep your screen on while cooking | Big timers, tap anywhere to pause, and a screen that stays on while this tab is in front. | Cook mode (OgCards board) |
| `/pro` | AwakeTab Pro | For screens you leave on: your own message, more colours and 12 weeks of history. From $12 a year. Keeping the screen awake stays free. | Message mode "Back at 11:30 AM" |
| `/extension` | AwakeTab for Chrome | Keeps your screen on with the tab hidden or Chrome minimised. A badge that only lights when it's true. Free. | Toolbar with badge "25" + popup pill |
| `/embed` | A Cook Mode button for your recipes | Readers tap once and the screen stays on while they cook. Free with a credit link, or $29 a year per site. | Widget on a sample recipe card |
| `/kiosk` | Keep kiosk and signage screens on | One URL starts by itself, shows your message, and keeps the display on. Your logo with a $19 licence. | TV frame, message mode, placeholder logo labelled "Your logo" |
| `/library` | @awaketab/wake | A Screen Wake Lock library that reports seven states and why each changed. MIT, zero dependencies. | State diagram with the seven states |
| `/vs/mouse-jigglers` (OgCards) | Mouse jigglers vs a wake-lock tab | AwakeTab never fakes input. It asks the browser, and shows what the browser answered. | Keep the board |

Social post template (for launches and changelog posts; no numbers we don't have):
> AwakeTab keeps your screen on from a browser tab, and it only says "Screen awake" once your browser has confirmed it. Switch tabs and watch it say "Paused — tab hidden". No install, no account, no ads on the awake screen. [link]

### 7.10 404

**Audit:**
- A good concept: the tool still works, and autostart is off.
- The headline has an em dash.
- The meta description duplicates home.
- The popular-guides list on the board is right.

| Element | Copy |
|---|---|
| `<title>` (keep) | Page not found — AwakeTab |
| Meta description **[new key]** | This page doesn't exist. The AwakeTab tool below still works: tap Keep awake and it keeps this screen on while the tab is visible. (130) |
| Kicker | Error 404 |
| H1 | This page isn't here. The tool is. |
| Sub **[new key]** | Tap Keep awake to keep this screen on, or pick a guide below. |
| Link (board, keep) | More lengths and clock faces on the full tool |
| List heading | Popular guides |

### 7.11 Done screen

**Audit:**
- The canvas Done state is close to right: kicker "Session complete", "Kept awake for {time}. The screen can sleep now.", primary "Again · {length}". GrowthDone adds exactly one next step (install, iOS Home Screen, extension after hidden tabs, or Pro).
- Two problems:
  - It doesn't show the proof (was it held the whole time?).
  - The Pro variant says "Pro adds schedules and custom end sounds.", which is false on the web (F2).
- The title flash "Done — AwakeTab" uses an em dash (not a pill string; can change).

**Rewrite:**

| Element | Copy |
|---|---|
| Kicker (keep) | Session complete |
| Headline | Kept awake for 30 min. |
| Receipt line **[new key; the core proof]** | Held the whole time. / Paused once, 2 min, while this tab was hidden. / Paused 3 times, 7 min in all, while this tab was hidden. |
| Until variant | Kept awake until 11:30 AM. |
| Closing line (keep) | The screen can sleep now. |
| Primary (keep) | Again · 30 min / Again · until 11:30 AM |
| Title flash | Done · AwakeTab |
| Next step: install (GrowthDone, keep) | **Open it in one tap next time.** Install AwakeTab and it gets its own window and works offline. It still keeps the screen on only while it's visible. · Install · Not now |
| Next step: iOS (keep) | **Add AwakeTab to your Home Screen.** Then it opens in one tap, full screen. From the Home Screen this needs iOS 18.4 or later. · Got it |
| Next step: hidden tab (rewrite) | **This tab was hidden 3 times.** During those minutes the screen could sleep. AwakeTab for Chrome keeps it on with the tab hidden or the window minimised. · Get the extension · Free for Chrome and Edge. |
| Next step: Pro (only if a related gate was touched; growth §4.2) | Message mode: **Pro keeps your message on screen for the whole session.** · See what's in Pro. Stats: **Pro shows the 5 older weeks already saved in this browser.** · See what's in Pro. |

"The screen could sleep" replaces "the browser let the screen sleep". We don't know it slept, only that it wasn't held.

### 7.12 In-tool Pro moments

Where they may appear is settled in growth §4.2 and D-R15: never during a live session, never in "Time's up", never on first use. This audits the words.

| Surface | Current | Problem | Rewrite |
|---|---|---|---|
| Idle tool card `pro.card` | "AwakeTab Pro — ambient packs, schedules, 12-week stats. $12/year." | Sells unbuilt web schedules; "ambient packs" is jargon; em dash; an idle card on the tool is close to the awake screen | Remove from the tool. Use in Settings only: "AwakeTab Pro: your own message, more colours and 12 weeks of history. From $12 a year." |
| Settings → Lamp colour | "Mint and Sky come with Pro. Tap one to preview it on the clock." | Good | Keep. After preview: "Mint and Sky are Pro colours. Close Settings and the ring goes back to Aqua." |
| Stats heatmap | "Locked — Pro keeps 12 weeks" / "Locked · Pro keeps 12 weeks" | "Locked" sounds like a paywall on your own data | "5 older weeks are saved in this browser. Pro shows them." (count from real data; hide when 0) |
| Stats export | Pro sheet | Fine | Button hint: "Export CSV · Pro" |
| Message mode chosen without Pro | Toast "Message mode is a Pro feature"; "Custom messages are a Pro feature" | Two strings for one moment; no path to try | "Message is part of Pro. Try it free for 60 seconds." · Try it · See what's in Pro |
| Message preview ended (GrowthProMoment) | "That was the free 60-second preview. Your message stayed up for 60 seconds. The screen is still awake and the session carries on. With Pro, your line (up to 80 characters) stays on screen for the whole session." | Good; slightly long | "Preview over. The screen is still awake and your session carries on. With Pro, your message stays up for the whole session." · Back to Clock · See what's in Pro |
| Price line in the preview card | "Pro is $12 a year, or $19 once until 8 December 2026 (then $29). 5 devices, 14-day refund." | OK: the user reached for the gate | Keep. Render the date and price from `PLAN_PRICES` / `PRO_LAUNCH_END` |
| `ambient.message.pro` | "Show your own message on the awake screen with AwakeTab Pro." | Fine | Keep |
| Extension options | "Schedules and auto-start are part of AwakeTab Pro." | No link | "Schedules and auto-start come with AwakeTab Pro. See what's in Pro" |
| Done screen Pro line (GrowthDone) | "Pro adds schedules and custom end sounds." | False on the web (F2) | See §7.11 |
| Extend prompt | docs/09 §2.9 "Pro adds schedules and custom chimes" | Countdown pressure and false (F13) | Delete; no Pro copy in "Time's up" |

Every in-tool Pro link carries `?ref=` (growth action 3) so we learn which words sell.

---

## 8. Phrases to ban

Add this list to docs/06 §11 and to `agent-brief.md` copy corrections. A CI grep on `src/i18n/en.json`, `src/content/**` and store listings can enforce the first block.

**Never (false or against the brand):**
- "works in the background", "keeps working when you switch tabs" (web app), "runs in the background"
- "keeps you green", "keeps you active", "stay online", "stay available", "appear active" (about presence)
- "undetectable", "stealth", "jiggle", "simulates activity", "fake input" except in "never fakes input"
- "battery saver blocks / denies / wins / refuses the wake lock", "Energy saver blocks"
- "keeps your computer awake" for the web app (the extension's System level is the exception)
- "bypass", "get around", "beat" or "defeat" a group policy, IT, the lock screen or a sign-in policy (market.md risk: never market as a policy bypass)
- "keeps your screen on even with the lid closed", "never sleeps"
- "guaranteed", "100%", "always on" (unqualified), "works everywhere", "any device"
- "tested on real devices", "in our tests", "a device on a shelf here", "retested after every release": until the device matrix has recorded results
- "the exact file on npm", "npm install" before the package is published
- "was $29", strike-through prices, "most popular", "best value", "limited time", "hurry", "only N left", "offer ends soon" (use the date)
- "forever", "lifetime access" as a promise, "yours forever" (until M-05 is decided)
- "trusted by", "loved by", "join thousands", "#1", "the best", any user or install count before it is measured and shown with a date
- Confirm-shaming: "No thanks, I like my screen going dark", "Maybe later" on a purchase
- "unlock" in Pro copy (use "adds" or "comes with")

**Avoid (jargon, drift or tone):**
- Engine words in user copy: "sentinel", "held/lost/denied/idle" as states (quote the pill instead), "native floors", "idle-inhibit", "Date.now()"
- "PiP pill", "floating pill", "floating timer" (say "floating window")
- "indefinite", "indefinitely" (say "until you stop")
- "ambient packs" in marketing (name the thing: "Mint and Sky colours")
- "lamp" in marketing without a swatch next to it
- "seamless", "effortless", "powerful", "supercharge", "blazing", "simply", "just" as a minimiser
- "honest" more than once per page, in any H1 or button, or as "the honest X" in a name
- "The pill never lies" in public copy. It is the internal principle; publicly, "never" is a liability if a bug ever ships. Use "It says Screen awake only after your browser confirms it."
- "maintained replacement for NoSleep.js" (say "an actively maintained alternative")
- Em dashes in new copy (the pill strings and the docs/06 title suffix excepted)

---

## 9. Claims that fail today (fix before launch)

| # | Where | Claim | Reality | Fix |
|---|---|---|---|---|
| C1 | Canonicals, `og:image`, `support@`, store homepage, privacy URL | awaketab.com | Unregistered; doesn't resolve [whois, dig] | Register (M-01). Until then, point OG and canonicals at the domain actually served |
| C2 | Home author box, HomeBelow board, ContentArticle | "Every support claim comes from a device on a shelf here…" | About: tested with automated journeys; device results pending | §7.2 author box |
| C3 | Home limits and FAQ, `tool.advice.battery_saver`, GrowthTrust, library demo, support-matrix.json | Battery saver denies or refuses | No such check in Chromium or WebKit | §7.2, §7.7; fact-check table |
| C4 | Home limits/FAQ | "macOS did not" defer idle sleep | Apple: no idle sleep while the display is held | §7.2 |
| C5 | /library | "the exact file on npm", `npm install @awaketab/wake`, GitHub link | npm "Not found"; github.com/awaketab/awaketab 404 | Publish, or reword and link the real repo (M-07) |
| C6 | /extension, PageExtension board | Brave, Arc, Opera; Chrome 116 | Arc/Opera `chrome.power` unverified; 30 s alarms need 120 | §7.4 |
| C7 | /embed | "amp-iframe cannot delegate the permission" | False | §7.5 |
| C8 | /pro description, `pro.card`, Pro board, GrowthDone | Web schedules, custom end sounds | Not built (growth F2) | §7.3, §7.12 |
| C9 | /pro | "$19 ~~$29~~" | $29 never charged (16 CFR 233.1) | §7.3 |
| C10 | /embed | "makes no request to anyone but awaketab.com" | True, but the analytics to awaketab.com include the host domain, undisclosed | §7.5 disclosure |
| C11 | Support matrix | "Last verified: 9 September 2026" | "Verified" implies device tests | "Checked against browser documentation on 9 September 2026" until device runs are recorded |

---

## 10. Prioritised actions

Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week. Impact: H / M / L.

| # | Action | Why | Effort | Impact | Owner / where |
|---|---|---|---|---|---|
| 1 | Register awaketab.com (+ .app, .dev, .page); set up MX so support@ receives mail; confirm the Pages custom domain | Every share card, canonical and refund email depends on it; anyone can take it (C1) | S | H | Owner; registrar, Cloudflare, docs/14 |
| 2 | Remove false proof claims C2–C4, C6, C7, C11 from en.json, index.astro, support-matrix.json, embed.astro, extension copy, canvas boards | Honesty is the brand; these are verifiably wrong | S | H | apps/web/src, `data/support-matrix.json`, boards |
| 3 | Fix /library: publish `@awaketab/wake` to npm and create the `awaketab` GitHub org, or reword per §7.7 and link the real repo | Dead links on the page aimed at the most sceptical persona (C5) | S (reword) / M (publish) | H | `pages/library.astro`, `packages/wake`, M-07 |
| 4 | Adopt the one-liner, tagline T1 and three pillars; update `app.tagline`, `page.home.description`, BRD §3 | One message across every surface | S | H | en.json, docs/01 §3, M-02 |
| 5 | Home hero: add the sub-line (`page.home.sub`), sentence-case title, new meta description | Differentiation above the fold | S | H | `index.astro`, en.json, docs/06 §2.1 |
| 6 | Home below-fold rewrite (§7.2), including the product strip | Wrong claims out; docs/06 product cards in | S | M | `index.astro`, HomeBelow board |
| 7 | /pro: ship the board structure with §7.3 copy (no unbuilt features, lifetime first, named buttons, dated launch price, refund beside buttons) | Biggest conversion lever (growth E1); legal hygiene | M | H | `pages/pro.astro`, `Pro.dc.html`, en.json `page.pro.*` |
| 8 | Done-screen receipt line (§7.11) | Turns the core promise into visible proof at the natural end | S | M | Done state, en.json, docs/05 |
| 9 | Regenerate OG images in Clear Night with the pill; add `og:site_name`; per-page share titles (§7.9) | Shares are the cheapest acquisition we have | M | M | `src/lib/og.ts`, BaseLayout, docs/06 §9 |
| 10 | Chrome Web Store listing rewrite (§7.8), min version 120 or qualified | Store search and conversion; policy-safe | S | M | `apps/extension/store/listing.md`, manifest, M-04 |
| 11 | In-tool Pro wording (§7.12) and `?ref=` on every Pro link | Stops selling missing features; measures which words sell | S | M | en.json, `ToolPanel.astro`, ambient/message.ts |
| 12 | /embed, /kiosk copy updates (§7.5, §7.6), including the analytics disclosure and the Safari tap caveat | Business buyers read the fine print | S | M | `embed.astro`, `kiosk.astro` |
| 13 | Voice rules + banned list into docs/06 §11 and agent-brief; CI grep for the "Never" list | Keeps 51 rewritten articles and future agents on message | S | M | docs/06, `docs/redesign/agent-brief.md`, `test/seo` |
| 14 | "Honest" budget pass on content and UI (≤ 1 per page; "What it can't do" headings) | Reads confident, not defensive | M | M | `src/content/**` (with the article rewrite, O-15), en.json |
| 15 | Add the recipe blogger as a sixth persona; write /embed outreach copy from it | A real buyer the persona table misses | S | M | docs/02 §2, M-11 |
| 16 | Trademark screen (USPTO, EUIPO, IP India, classes 9/42) and file the report | BR-15 requires it before public launch; the fallback .com is gone | S | M | Owner; `docs/` |
| 17 | Launch post and Show HN draft built on P1/P2 ("switch tabs and watch the title") | Kenji's channel; proof, not claims | S | M | Owner |
| 18 | Teachers: `/for/classroom` messaging (§4) once the route is approved; a teacher line on /for/presentations and /extension meanwhile | Largest persona group per market.md, and untargeted by competitors | M | M | docs/00 §7 → docs/06 §12.1 → content, M-14 |
| 19 | "For IT admins" section (what it does, how to block or allow it) | Trust with Priya's employer; answers a real admin question (market.md §3.5) | S | M | /about or /privacy |

---

## Owner decisions

| # | Question | Options / recommendation |
|---|---|---|
| M-01 | Register awaketab.com and the three other TLDs now? | **Yes, today.** If it's unavailable to you, decide the brand before launch; NeverDim.com is taken |
| M-02 | Adopt the one-liner, tagline and pillars (§3.3–3.5), replacing BRD §3's tagline? | Recommended: T1 "Keeps your screen awake. Says so only when it is." |
| M-03 | Adopt the voice rules and banned list (§5, §8) as a contract in docs/06 §11? | Recommended: yes, with a CI grep for the "Never" block |
| M-04 | Store name: drop "for Chrome" ("AwakeTab: Keep Screen Awake") or keep it with ™ ("AwakeTab for Google Chrome™: …")? Touches FR-EXT-05, docs/10 and `ext.name` | Recommended: drop it from the store title, keep "AwakeTab for Chrome" as the product name on the website |
| M-05 | What does "lifetime" promise if the service ends? Tokens need re-validation every 90 days (+30 days offline) | Recommended: publish a shutdown pledge (final update that unlocks Pro locally) and word plans as "pay once, no renewal". Until decided, never say "forever" |
| M-06 | "Priority support" in the Embed and Kiosk tables: define it (for example "reply within 2 working days") or remove it? | Recommended: remove until you can staff it |
| M-07 | Publish `@awaketab/wake` to npm and create the `awaketab` GitHub org before launch, or reword /library to the personal repo? | Recommended: publish (it's O2 and BR-10); reword in the meantime |
| M-08 | The one-line Pro pitch depends on O-01 (colours), O-02 (which modes are free) and O-05 (web schedules, sounds). Confirm the pitch: "your own message, more colours, 12 weeks of history, schedules in the extension" | Recommended: yes, once O-01 is decided |
| M-09 | Rename the "Bold" face to "Digits"? | Optional, low priority |
| M-10 | Primary button label "Keep awake · {length}" (canvas) instead of en.json "Tap to start" / "Start" on the tool | Recommended: yes (it names the outcome); new i18n keys |
| M-11 | Add the recipe blogger as a sixth persona in docs/02 §2 | Recommended: yes |
| M-12 | Remove the Pro card (`pro.card`) from the idle tool entirely and keep Pro only in Settings, gated controls, Done (capped) and /pro? | Recommended: yes (FR-PRO-08 lists the idle card; this narrows it) |
| M-13 | Support-matrix label "Last verified" → "Checked against browser documentation on {date}" until device results exist? | Recommended: yes |
| M-14 | Add teachers as a named segment (a Lena variant on a managed laptop) and approve a `/for/classroom` route? | Recommended: yes for the segment now; the route when Search Console shows classroom queries (market.md action 13) |

---

## Sources (all accessed 26 September 2026)

Sibling research: `docs/research/market.md` (26 Sep 2026). Review quotes, Microsoft presence docs, the Wells Fargo report, recipe-plugin and kiosk pricing, the Betty Crocker case study and store rules are cited there with URLs and [V]/[S] labels.

External:
- web.dev, *Betty Crocker* case study (wake lock, self-selected comparison): https://web.dev/case-studies/betty-crocker
- April Dunford, *A quickstart guide to positioning*: https://www.aprildunford.com/post/a-quickstart-guide-to-positioning
- nosleep.page (title, presets, foreground disclaimer): https://nosleep.page/
- keep-screen-on.com (headline, "Keep this tab visible while the screen stays awake"): https://keep-screen-on.com/
- ScreenAwake ("switching tabs or hiding it will disable the function"): https://screenawake.com/
- Keep Screen Awake (keep-awake.com, "Only works while this tab stays open and visible"): https://www.keep-awake.com/
- Chrome Web Store, *Keep Awake* (Google; 1,000,000 users, 4.0 from 500 ratings, updated 4 Aug 2023): https://chromewebstore.google.com/detail/keep-awake/bijihlabcfdnabacffofojgmehjdielb
- Chrome Web Store, *Keep Awake (Display | System)* (100,000 users, 4.3 from 47, updated 27 Dec 2025): https://chromewebstore.google.com/detail/keep-awake-display-system/apmicgkbejflkgeljipcebaoeigmangd
- Chrome Web Store, *Caffeine - Keep Awake* (80,000 users, 4.2 from 25, updated 21 Aug 2026): https://chromewebstore.google.com/detail/caffeine-keep-awake/fcblbbbkcneogddmpmfdchnocbpfpmag
- Mac App Store, *Amphetamine* ("Powerful keep-awake utility", free): https://apps.apple.com/us/app/amphetamine/id937984704
- Mac App Store, *Lungo* ("Keeps your computer awake", $4.00): https://apps.apple.com/us/app/lungo/id1263070803
- Online Mouse Jiggler ("Stay Available on Teams", "Keeps Teams green"): https://onlinemousejiggler.com/
- Amazon listing, TECH8 "Undetectable USB Mouse Jiggler … Keeps Teams … Active" (search result title): https://www.amazon.com/USA-Undetectable-Jiggler-Background-Software/dp/B09612TQCD
- Chrome Web Store branding guidelines ("for Google Chrome™"): https://developer.chrome.com/docs/webstore/branding
- Chrome manifest `name` (max 75 characters): https://developer.chrome.com/docs/extensions/reference/manifest/name
- Chrome Web Store program policies (keyword spam; no unattributed testimonials): https://developer.chrome.com/docs/webstore/program-policies/policies
- npm registry lookup for `@awaketab/wake` ("Not found"): https://registry.npmjs.org/@awaketab%2fwake
- GitHub: https://github.com/awaketab/awaketab (404) and https://github.com/SoubhikBiswas-gitHub/awaketab (200, public)
- WHOIS for awaketab.com ("No match") and neverdim.com (created 2000-10-12), via the `whois` CLI

Repo and live site (read 26 Sep 2026): `PRODUCT.md`, `DESIGN.md`, `docs/redesign/README.md`, `DECISIONS.md`, `docs/01-brd.md` §1–3, §7, §8; `docs/02-prd.md` §1–3, §4.11–4.15; `docs/00-conventions.md` §8; `docs/06-content-seo-spec.md` §2, §4, §8–11; `docs/09-monetization-impl.md` §1, §7; `docs/18-analytics-kpis.md` §1–3; `docs/research/{growth-conversion,fact-check-2026-09-26,canvas-copy-audit,editorial-audit-articles}.md`; `apps/web/src/i18n/en.json`; `apps/web/src/pages/{index,pro,extension,embed,kiosk,library,about,404}.astro`; `apps/web/src/lib/license.ts`; `packages/core/src/session.ts`; `packages/wake/package.json`; `apps/extension/store/listing.md`. Live: https://awaketab.pages.dev (/, /pro, /extension, /embed, /kiosk, /library, a 404 URL; titles, meta, OG tags; `/og/home-en.png`, `/og/pro-en.png`). Canvas boards (visible copy extracted): Main, HomeBelow, Pro, PageExtension, EmbedShowcase, PageKiosk, PageLibrary, Page404, Brand, GrowthDone, GrowthProMoment, GrowthFirstVisit, GrowthPaused, GrowthTrust, OgCards, StoreAssets, Welcome, ExtPopup, Ambient.
