# Content audit: all user-facing copy (26–27 September 2026)

Status: v1.0 · 27 Sep 2026 · Owner: Soubhik · Research only, no product file was edited.

**What this covers.** Every user-facing string in English:
- `apps/web/src/i18n/en.json` (all 524 lines)
- the Astro pages and components
- the 51 English articles and 5 hubs
- the extension (manifest `_locales` are generated from `en.json` `ext.*`; popup and options read the same catalogue)
- `apps/extension/store/listing.md`, `packages/wake/README.md` and the changelog fragments
- the embed, kiosk and library pages
- the redesign canvas

**What was checked.** Facts, honesty, consistency, tone and conversion copy.

**Companion reports.** This file combines three sub-reports. Read them for full detail:
- [`fact-check-2026-09-26.md`](fact-check-2026-09-26.md): browser and OS claims checked against Chromium, WebKit and Firefox source, MDN and vendor docs, with citations.
- [`editorial-audit-articles.md`](editorial-audit-articles.md): the 51 articles and 5 hubs (templating, duplicate content, descriptions, FAQs, word counts, links).
- [`canvas-copy-audit.md`](canvas-copy-audit.md): the redesign canvas boards.

Everything below that is not in those three files was checked directly in the repo for this report.

**Evidence labels.**
- **Verified fact**: checked in code, in the repo, or in a cited external source.
- **Estimate**: a judgement about likely impact.
- **Opinion**: a copy or tone recommendation.

Severity:
- **High**: wrong, an overclaim, or a user could rely on it and be misled, or it breaks a contract or policy.
- **Medium**: inconsistent, outdated or unclear.
- **Low**: wording or style.

---

## Summary for the owner

1. **The most repeated technical claim is wrong.** "Battery saver / Low Power Mode denies the wake lock" is not true. Chromium has no battery-saver check. WebKit has no Low Power Mode check. Firefox refuses only at 5% battery or less while not charging. The real causes are:
   - a hidden tab;
   - a Permissions-Policy block;
   - Safari needs a tap first.

   The claim appears in all 33 learn, on, guides and vs articles, in `tool.advice.battery_saver`, on the home page, in the support matrix and in the library README. (Verified fact: fact-check report.)
2. **The site says it tested things that have not been tested yet.** The home page says "Every support claim comes from a device on a shelf here… retested after each browser and OS release" and "In our tests Chromium on Windows also deferred idle sleep; macOS did not". But all 14 rows of `docs/metrics/device-matrix.json` are `pending`, and the launch changelog itself says so. Apple's docs also contradict the macOS half of that sentence. (Verified fact.)
3. **The privacy copy hides that telemetry is on by default on the web.** `ISettings.telemetry` defaults to `true`. Yet the privacy meta description says telemetry is sent "only when enabled", and a changelog entry calls it "opt-in". The privacy page never states the default. This is the most serious honesty issue outside the articles. (Verified fact.)
4. **The home FAQ promises "No ads on this screen, now or later".** But the code already has a sponsor card for the idle state and the time's-up prompt on that same screen (gate G5). Either narrow the promise or drop the card. (Verified fact.)
5. **/pro, where people decide, does not say what Pro is.** It shows two prices, two identical "Get Pro" buttons and a "5 devices" badge. There is no feature list, no "what stays free", no plan names and no end date for the $19 launch price. All of these are required by FR-PRO-01. (Verified fact.)
6. **Pro copy promises things the web app does not have.** "Schedules" exist only in the extension. "Custom sounds" are not built. "Ambient packs" is one colour pack (Teal and Rose). "Ad-free" is sold while no page shows ads. Describe what ships. (Verified fact, in `lib/license.ts` and `tool/`.)
7. **Prices and terms are consistent everywhere they appear:** $12/yr, $19 once then $29, 5 devices, 14-day refund, Embed $29/yr, Kiosk $19/$49. Two gaps remain:
   - the $19 is computed at build time, so a page not rebuilt after 8 December keeps showing it;
   - Embed says "staging subdomains" (plural) where the canon is one staging subdomain.
8. **The extension shows the web-only pill "Tap to use the fallback" when `chrome.power` is missing.** The extension has no fallback. The store listing also says the pill appears "only after Chrome has accepted the request", but `chrome.power` gives no acceptance signal.
9. **The pill strings are exact everywhere in shipped code.** All seven strings, plus "System awake" and "Screen may dim or lock", match in all 211+ occurrences. Terms drift around them:
   - "∞ / Until I stop / until you stop / no end time / indefinite";
   - "Floating window / floating timer / PiP pill";
   - "behavior" next to "licence";
   - two date formats;
   - curly and straight apostrophes.
10. **The 51 articles are one generated template.** 84–90% of their text is shared, 40 descriptions are cut mid-sentence, and the FAQ grammar is broken ("Does does…"). None mentions the extension, Pro, Embed or Kiosk, even where the reader's real answer is the extension. Fix the generator before any rewrite. (Editorial report.)
11. **Tone is mostly right:** calm, no hype adjectives, no fake reviews or scarcity. The problems are:
   - engine jargon ("sentinel", `Date.now()`, "Chromium", "re-acquiring");
   - a few quips ("A green dot is a conversation with your employer");
   - one self-praise line ("an honest status you can trust").
12. **Em dashes.** There are 60 in `en.json` (7 are contractual: the pill strings and the " — AwakeTab" title suffix) and 63 in article bodies. Replace them with colons or full stops in new copy.

---

## 1. Fact and honesty findings outside the articles

Article-level fact findings live in the fact-check report, with sources. This table covers the product UI, the pages and the extension.

| # | file:line | Current text | Problem | Proposed text | Sev |
|---|---|---|---|---|---|
| F1 | `apps/web/src/i18n/en.json:150` `tool.advice.battery_saver` | "Your device's battery saver is blocking the wake lock. Turn it off or plug in, then tap Start." | Chromium never refuses for battery saver. The advice names a cause that does not happen. (Fact-check, Chromium `wake_lock.cc`.) | "The browser refused the wake lock. If the battery is very low, plug in, then tap Start." Also rename the advice code in `@awaketab/wake` or map it to `denied_generic` (a docs/04 change). | High |
| F2 | `en.json:151` `tool.advice.low_power_ios` | "iPhone Low Power Mode forces a 30-second Auto-Lock. Turn it off in Settings → Battery, then reload." | The Auto-Lock fact is right (Apple support 101604). But WebKit has no Low Power Mode rejection, so this advice can only show as a guess. | Keep the sentence as a *limit* on the iPhone pages and the home page, not as a denial reason. The denial copy for Safari should be: "Safari needs a tap to keep the screen awake. Tap Start." | Medium |
| F3 | `apps/web/src/pages/index.astro:209-211` | "Battery saver wins. iPhone Low Power Mode forces a 30-second Auto-Lock; Android and Windows battery saver can refuse the request." | Android and Windows battery savers do not refuse the request (fact-check). | "**Power saving can still dim or lock the screen.** iPhone Low Power Mode sets Auto-Lock to 30 seconds, and Firefox gives up the lock at 5% battery. When a browser refuses, the pill says "Blocked — here's the fix" and names the cause." | High |
| F4 | `index.astro:219-221`, `:339-341` | "In our tests Chromium on Windows also deferred idle sleep; macOS did not." | Nothing has been recorded (device matrix `status: pending`). Apple's `kIOPMAssertionTypeNoDisplaySleep` docs say the system does not idle-sleep while the display is held. | "A wake lock holds the display. On Windows and macOS, Chrome's display hold also keeps the computer from idle sleep while the tab is visible. A closed lid still sleeps. For a computer awake with the screen off, use a native tool or the extension's System level." Mark it "not yet device-tested" until the matrix is filled. | High |
| F5 | `index.astro:394-396` | "Every support claim comes from a device on a shelf here — iPhone, Android, iPad, Chromebook, Windows and Mac — retested after each browser and OS release." | Not true yet. Contradicts `about.astro:53-56` (automated tests) and `changelog/2026-09-1.0-launch.md:19` ("real-device results… are pending"). | "Support claims come from browser documentation, browser source code and automated tests. Real-device results are added to the matrix on How we tested as each run is recorded." | High |
| F6 | `index.astro:239` (matrix caption) | "Screen Wake Lock support as tested by AwakeTab" | Same overclaim | "Screen Wake Lock support by browser (from browser documentation; device results pending)" | High |
| F7 | `en.json:28` `page.hub.guides.description`; `en.json:34` `page.about.description`; `components/HubPage.astro:43,47` | "tested AwakeTab guides", "tested across devices", "menu paths only where they have been verified", "how the project tests claims before publishing them" | Same overclaim | Guides: "Fix battery, Auto-Lock and display timeout problems with step-by-step guides that say plainly what a browser tab cannot do." About: "Who makes AwakeTab, how it is tested, and what a web page can and cannot keep awake." Hub: drop "verified" until the matrix is filled. | High |
| F8 | `index.astro:88` (pill meaning for `lost`) | "The tab lost focus, so the lock was taken back." | Wrong mechanism. The lock is released when the page is *hidden*, not when it loses focus. A visible but unfocused window keeps the lock. | "The tab was hidden, so the browser took the lock back. AwakeTab asks again when you return." | High |
| F9 | `index.astro:146` | "the display stops dimming, sleeping and showing the lock screen" | Idle-lock policies (Priya's 5-minute group policy) can still lock the screen. The same page says so at `:224-225`. | "the display stops dimming and sleeping (a work lock-screen policy can still lock it)" | Medium |
| F10 | `index.astro:97` | "Keep the computer awake while downloading" | The web tool holds the display, not the download. This is a scenario link, so readers take it literally. | "Keep the screen on during a long download" | High |
| F11 | `index.astro:339` | "The screen is the guarantee." | "Guarantee" overclaims. The browser can refuse or release the lock at any time. | "The screen is what a wake lock holds." | Medium |
| F12 | `index.astro:369` | "No ads on this screen, now or later." | `SponsorCard` renders on this screen in `idle` and in the time's-up prompt when `PUBLIC_SPONSOR_ENABLED=1` (docs/00 §8.3 G5; `tool/sponsor.ts:40-42`). | Owner decision. Either (a) remove the sponsor slots, or (b) write: "No ad-network ads on this screen, ever, and nothing while the screen is awake. A single labelled sponsor card may appear before you start or when time is up." Update `about.astro:68` and `privacy.astro:189` to match. | High |
| F13 | `apps/web/src/pages/privacy.astro:79-89`; `en.json:37` `page.privacy.description` | "Optional first-party telemetry… When telemetry is enabled"; "sends optional first-party telemetry only when enabled" | The web default is **on** (`packages/core/src/types.ts:153`, docs/08 §2). The page never says so. The extension default is off, and the page does say that. | Heading: "Anonymous usage data (on by default on the website, off in the extension)". First sentence: "On awaketab.com, anonymous usage events are on by default. Turn them off in Settings → Share anonymous usage data." Meta: "AwakeTab keeps settings and stats in your browser, sets no cookies, and sends anonymous usage events you can turn off in Settings." Or change the default to off. Either way the page must state it. | High |
| F14 | `changelog/2026-09-analytics-pro.md:6` | "First-party `/api/e` beacon (opt-in telemetry)… Ads remain disabled (`PUBLIC_ADS_ENABLED=0`)." | "Opt-in" is false on the web. Build flags are jargon in a public changelog. | "Anonymous usage events (on by default, off in Settings), a donation link in the footer, Pro pricing and activation pages. No ads are shown." | High |
| F15 | `apps/extension/store/listing.md:27`; `changelog/2026-09-m7-extension.md:8` | "the popup says "Screen awake" only after Chrome has accepted the request" | `chrome.power.requestKeepAwake` returns nothing. `src/power.ts:42-43` sets `held` right after the call, so there is no acceptance to wait for. | "the popup says "Screen awake" while Chrome holds the display keep-awake, and "System awake" when only the computer is kept awake. If the power API is missing or blocked, the popup says so." | Medium |
| F16 | Extension popup (`src/status.ts:25-26`, `src/power.ts:25,71`) | Pill `tool.pill.unsupported` = "Tap to use the fallback" | The extension has no video fallback, so this pill tells the user to do something that does not exist. The pill copy is a contract, so the fix needs an extension-only key, following the D-02 pattern. | Add `ext.pill.unsupported` = "Not available in this browser" (secondary line: `ext.advice.unsupported`). Record it in docs/00 §5.1 next to "System awake". | High |
| F17 | `en.json:446` `ext.advice.denied` (under pill "Blocked — here's the fix") | "Your browser or organisation blocked keeping this device awake." | The pill promises a fix and the line gives none | "Your browser or your organisation's policy blocked this. Ask your IT admin, or open AwakeTab in a tab instead." | Medium |
| F18 | `en.json:276` `pip.unsupported` | "Floating window needs Chrome or Edge — opening a small window instead" | Firefox 151+ desktop supports Document PiP (fact-check). Also Android Chrome does not. | "The floating window needs desktop Chrome, Edge or Firefox 151 or later. Opening a small window instead." | Medium |
| F19 | `en.json:152` `tool.advice.hidden_document` | "Keep it in front, or use the floating window." | Holding a wake lock from the PiP document while the opener is hidden is FR-PIP-02, but it is unverified on devices (fact-check "could not verify"). | Keep the copy, but add a device-matrix row for "PiP open, opener hidden, 10 min" before launch. If it fails, change to "Keep this tab in front." | Medium |
| F20 | `apps/web/src/pages/kiosk.astro:114` | "`autostart=1` — the lock is requested as soon as the page is visible." | Safari/WebKit needs a user gesture. On iPad kiosks the first start needs a tap (fact-check). | "`autostart=1`: the lock is requested as soon as the page is visible. Safari and iPad need one tap the first time." | High |
| F21 | `apps/web/src/pages/embed.astro:155-156` | "AMP pages are not supported (amp-iframe cannot delegate the permission)." | False: amp-iframe passes `allow` through (fact-check, amphtml source). | "AMP pages are untested. amp-iframe passes `allow="screen-wake-lock"` through, so it may work." | Medium |
| F22 | `embed.astro:202` | "One registrable domain, including `www.` and staging subdomains." | Canon (docs/00 §8.1, FR-PRO-09): one domain plus **one** staging subdomain | "One domain, including `www.` and one staging subdomain." (Or change the canon, if more are intended.) | Medium |
| F23 | `embed.astro:233-234` | "the plugin will output the same tag when it ships" | Promises an unscheduled product | "A WordPress plugin is planned; there is no date yet." | Low |
| F24 | `packages/wake/README.md:102,114`; `pages/library.astro:77` | "Battery savers (… Chrome Energy Saver) can deny or release any lock"; "The live, tested matrix"; "The maintained replacement for NoSleep.js" | The first is false. The matrix is untested. "The maintained replacement" implies it is the only one. | See fact-check for the battery line. "The browser support matrix"; "A maintained alternative to NoSleep.js (last release December 2020)." | High (battery) / Low |
| F25 | `library.astro:143` | Row "Last release": "maintained; semver" | The cell is not a release | Use the version and date from `package.json` at build time: "1.0.0 · {date}" | Low |
| F26 | `apps/extension/store/listing.md:49`; `data/support-matrix.json:57` | Chrome 116 minimum with a 30-second keep-alive alarm | Alarms under 60 s need Chrome 120 (fact-check) | Raise `minimumChromeVersion` to 120, or write "every 30 s (60 s on Chrome 116–119)". | Medium |
| F27 | `en.json:510`; `listing.md:26` | "Alt+Shift+A toggles it from any tab." | On a Mac the key is Option | "Alt+Shift+A (Option+Shift+A on Mac)" | Low |
| F28 | `apps/web/src/pages/[preset].astro:15,18` | "unattended download", "long download" | The screen stays on, but the download is not what's being guarded | Keep the wording, but add "(the screen stays on; the download itself is up to your browser and OS)" on `/30m` and `/2h`, or drop "unattended". | Low |
| F29 | `privacy.astro:144` vs `tool/ui/rating.ts:8` | "any text you choose to write (up to 500 characters)" | The client caps at 280; the server truncates at 500. The statement is true as a maximum. | "up to 280 characters" (matches what users can type) | Low |

---

## 2. Consistency findings (UI, pages, extension)

| # | file:line | Current | Problem | Proposed | Sev |
|---|---|---|---|---|---|
| C1 | `en.json:112-113, 198`; `index.astro:165`; `en.json:90`, `:509` | "∞", "Until I stop", "until you stop", "no end time"; canvas "No limit" | Five names for one preset | See glossary: chip "∞", accessible name "Until I stop"; prose "until you stop"; never "no end time", "No limit" or "indefinite" in UI | Medium |
| C2 | `en.json:14` `page.pip.title`, `:182` `tool.toast.pipBlocked`; changelog | "floating timer", "Floating window", "Picture-in-Picture", "PiP pill" | Four names | "floating window" everywhere in UI. "Picture-in-Picture" only in developer or legal text. | Medium |
| C3 | `en.json:184` vs `:319` | "Message mode is a Pro feature" / "Custom messages are a Pro feature" | Two keys for one gate | Keep one: "Message mode is part of AwakeTab Pro." | Low |
| C4 | `en.json:222` vs `:325` | "Cycle {n} of {total}" / "{cycles} rounds" | Cycle vs round | Use "round" in both: "Round {n} of {total}" | Low |
| C5 | `en.json:219` vs `:462` | "Back at 3 pm" / "weekdays 09:00–18:00" | 12 h and 24 h examples side by side; the canvas uses 12 h | Format times by locale. Make the English examples match the default ("Back at 15:00" or "09:00–18:00" → "9 am–6 pm"; pick one). | Low |
| C6 | `privacy.astro:56`, `terms.astro:52` vs `index.astro:76-79` | "September 9, 2026" vs "9 September 2026" (en-GB) | Two date formats | en-GB "9 September 2026" everywhere, to match the British spelling | Low |
| C7 | `en.json:22, 34`; `about.astro:55`; `HubPage.astro:34`; `privacy.astro:64` | "behavior" | The rest of the UI is British ("licence", "minimised", "organisation", "colour", "behaviour" in keys) | "behaviour" | Low |
| C8 | `en.json` `ext.*` (10 strings) vs web keys (20 strings) | Curly ’ vs straight ' | Mixed within one catalogue | Straight ASCII apostrophes everywhere (simplest for translators and tests), or curly everywhere; not both | Low |
| C9 | `en.json:48` vs `:55, 60, 63, 485` | "5 devices" vs "five activations / five-device limit / five devices" | Mixed digits and words | Digits for counts in UI: "5 devices" (also "5 sites" on Kiosk) | Low |
| C10 | `en.json:46` vs `:284, 346-347` | "twelve-week stats" vs "12-week stats" / "12 weeks" | Mixed | "12 weeks of stats history" | Low |
| C11 | `en.json:223` vs `:376` | "Tap anywhere to pause" (app) vs "Tap the timer to pause" (widget) | Fine if the behaviours really differ; confirm | If both pause on any tap, use the first string for both | Low |
| C12 | `en.json:402` `builder.logo` vs `lib/license.ts` `PLAN_FEATURES` | "Logo URL (https, needs a Kiosk licence)" | Pro yearly and lifetime also include `ambient.logo`, so Pro unlocks the logo too | "Logo URL (https, needs Pro or a Kiosk licence)", or remove `ambient.logo` from Pro | Medium |
| C13 | `pages/until/[time].astro:28` | `heading={t('page.until.title', …)}` → H1 "Keep the screen awake until 11:30 — AwakeTab" | The brand suffix leaks into the H1 (`[preset].astro` strips it; `until` does not) | Add key `page.until.h1` = "Keep the screen awake until {time}" | Medium |
| C14 | `en.json:11-12` `page.preset.*`; docs/06 §2.2 | Title "Keep the screen awake for 15 min — AwakeTab"; H1 the same; description "Start a 1 h AwakeTab session…" | docs/06 wants "Keep your screen awake for 30 minutes", which matches the query. "1 h" reads badly in prose. The 7 bodies are near-identical. | Use a long-form label in titles, H1s and descriptions: "Keep your screen awake for 1 hour — AwakeTab". Write one unique sentence per duration. | Medium |
| C15 | `en.json:45, 33, 24` | "AwakeTab Pro plans and pricing — AwakeTab", "About AwakeTab and its testing — AwakeTab", "AwakeTab alternatives compared — AwakeTab" | The brand appears twice (docs/06 §4 anti-pattern) | "AwakeTab Pro: plans and pricing"; "About AwakeTab and how it is tested"; "Compare screen-awake tools — AwakeTab" | Low |
| C16 | `en.json:5` | "Keep Your Screen Awake — AwakeTab" | Title Case. Every other title is sentence case. | "Keep your screen awake — AwakeTab" | Low |
| C17 | `components/PipPage.astro:38` + `en.json:369` | "Start a session in" + link "AwakeTab" | Concatenated sentence; breaks in ja, zh and hi word order | One key with a placeholder: `pip.empty` = "Open {app} to start a session", rendered with the link in place of `{app}` | Medium |
| C18 | `en.json:382` `embed.attribution` | "Keep awake by AwakeTab" | Ungrammatical, and it is on every free widget | "Screen kept awake by AwakeTab" (or "Cook Mode by AwakeTab") | Medium |
| C19 | Seven locale files | 22–28 keys per locale are identical to English (`page.pro.*`, activate, manage) | English leaks on locale pages. This is acceptable only if those routes are English-only; confirm. | Mark them as intentionally English in docs/07, or translate them | Low |

---

## 3. Tone and plain-language findings

| # | file:line | Current | Problem | Proposed | Sev |
|---|---|---|---|---|---|
| T1 | `en.json:431` `ext.description` (manifest, stores) | "Keep your screen (or your whole computer) awake from a click — with an honest status you can trust." | Self-praise ("you can trust"); "from a click" is awkward | "Keep your screen, or only your computer, awake with one click. The status shows what Chrome is actually holding." (≤ 132) | Medium |
| T2 | `en.json:177` | "Re-acquiring the wake lock" | Jargon | "Asking the browser to keep the screen awake again…" | Low |
| T3 | `en.json:254`; `index.astro:361` | "available in Chromium browsers"; "On Chromium, …" | Priya and Marco do not know "Chromium" | "Available in Chrome, Edge and other Chromium-based browsers." In prose: "In Chrome and Edge, …" | Low |
| T4 | `[preset].astro:57-58` | "The timer uses wall-clock time from `Date.now()`" | Developer detail on a consumer page | "The timer follows the real clock, so a busy browser cannot quietly stretch your session." | Low |
| T5 | `en.json:250` | "Just stop" | Filler word | "Stop" (setting label: "When time is up: Stop / Ask to extend") | Low |
| T6 | `en.json:266` | "Reset? Yes, reset" | Reads as two strings run together | Button changes to "Confirm reset" on the second press | Low |
| T7 | `index.astro:333` | "A green dot is a conversation with your employer, not a browser tab." | A quip; could read as moralising (canvas report agrees) | Cut the sentence; the previous two carry the point | Low |
| T8 | `index.astro:285` | "AwakeTab is instant and installation-free — and a native utility beats it…" | "instant" is a marketing adjective; em dash | "AwakeTab needs nothing installed. A native utility is better when the screen must stay on with the browser out of sight." | Low |
| T9 | `index.astro:169` | "the same mechanism a video player uses" | Imprecise | "the same browser feature video and presentation sites use to stop the screen dimming" | Low |
| T10 | `en.json` (60 em dashes in 58 strings), articles (63) | e.g. `tool.custom.summary`, `tool.until.error.past`, `stats.empty`, `ambient.cook.start`, `page.extension.permissions.*` | The owner wants no em dashes in new copy | Keep only the pill strings, `content.stale` and the " — AwakeTab" title suffix. Replace the rest with a colon, full stop or comma. Example: "That time has passed. Pick a later one." | Low |
| T11 | `changelog/2026-09-m6-engagement.md:6` | "25/5-minute Pomodoro cycles" | "Pomodoro Technique" is a registered trademark | "25-minute focus blocks with 5-minute breaks" | Low |

Reading level (opinion): UI strings are short and plain (most are under 15 words). The home page sentences average about 18 words, which is fine. Only the article bodies and `[preset]` pages carry engine vocabulary: sentinel, held, lost, `Date.now()`, "native floors". The editorial report lists the fixes.

---

## 4. Conversion copy (where people decide)

Verified facts (from code):
- `/pro` (`apps/web/src/pages/pro.astro:53-88`) renders two price cards, each with a "5 devices" badge and the same "Get Pro" button. It does not show:
  - plan names;
  - features;
  - what stays free;
  - the launch-price end date.

  FR-PRO-01 requires the feature list, what stays free, and "$19 with $29 struck through **and the end date**".
- The in-tool Pro sheet (`ToolPanel.astro:293-295`) shows only `pro.card`: "AwakeTab Pro — ambient packs, schedules, 12-week stats. $12/year." The price is hard-coded in the string and the one-time option is missing.
- Gates sold versus what the web app actually has (`lib/license.ts` `PLAN_FEATURES`, `tool/`):

| Gate | What the user gets today |
|---|---|
| `ambient.message` | Yes: Message mode |
| `ambient.packs` | Teal and Rose accents only; no mode is gated by it (`tool/ambient/logic.ts:6`) |
| `stats.history` | 12 weeks of stats history |
| `stats.export` | CSV export |
| `pip.pro` | The floating window shows your ambient mode |
| `ambient.logo` | Your logo on kiosk links |
| `ext.schedules`, `ext.autostart` | Extension only |
| `schedules` (web) | Not built |
| `sounds.custom` | Not built |
| `ads.free` | No page shows ads today (`privacy.astro:180`) |

- Articles: zero Pro, extension, Embed or Kiosk mentions (editorial report).

Opinion: people decide at three points (/pro, the tool's locked-feature moments, and articles where a web tab cannot do the job). Only the locked-feature moments work today: `ambient.message.pro`, `stats.heatmap.pro` and `tool.toast.proMode` are specific and calm.

Proposed /pro copy. It is honest to what ships, uses no em dashes, and has no urgency tricks:
- **H1:** "AwakeTab Pro"
- **Lead:** "The screen-awake tool stays free. Pro adds a few things for people who use it every day, and pays for its upkeep."
- **Pro adds:**
  - "Message mode: show your own line on the awake screen."
  - "12 weeks of stats history, and CSV export."
  - "Floating window with your clock or focus timer."
  - "Teal and Rose accents."
  - "Your logo on kiosk links."
  - "In AwakeTab for Chrome: weekly schedules and auto-start."

  Add "No ads on any page" only once ads exist (gate G1). Add schedules and custom sounds only when built.
- **Always free:** "Every duration, until-a-time, session restore, standard, clock, minimal, focus, night and cook modes, one chime, notifications, 7 days of stats, the floating window, shortcuts, install, all 8 languages." Confirm against O-02: the canon says focus, night and cook are free today.
- **Cards:**
  - "Pro yearly · $12 / year · 5 devices" with button "Get Pro yearly".
  - "Pro lifetime · $19 once · launch price until 8 December 2026, then $29 · 5 devices" with button "Get Pro lifetime".

  Do not write "was $29" (canvas report: nobody ever paid $29).
- **Under the cards:** "14-day refund, no questions asked. Charged in USD; taxes added at checkout where applicable. Checkout by Polar; no AwakeTab account."
- **`pro.card`:** "Pro adds Message mode, 12 weeks of stats and extension schedules. {yearly} a year or {lifetime} once." Take the prices from `PLAN_PRICES` as placeholders.
- **Build note:** the launch price is computed at build time (`lifetimePrice()` in the frontmatter). Schedule a rebuild on 8 December 2026, or switch the label client-side, so the page never shows $19 after checkout stops honouring it (docs/09 §2.1: the discount ends server-side).

Kiosk and Embed CTAs are specific ("Buy for one site", "Get the Embed licence"). One gap on Kiosk: "site" is never defined. Add: "A site is one physical location or one kiosk URL domain; 5 sites covers five." The owner must decide which definition applies.

---

## 5. Glossary of canonical terms (adopt everywhere; add to docs/00 §1 or §5)

| Concept | Use | Do not use | Notes |
|---|---|---|---|
| Product | AwakeTab | Awake Tab, awaketab (in prose) | docs/00 §1 |
| The status element | the pill; "status pill" at first mention | badge (web), indicator | "badge" is the extension toolbar badge only |
| The seven pill strings | "Ready", "Starting…", "Screen awake", "Paused — tab hidden", "Blocked — here's the fix", "Tap to use the fallback", "Awake via video fallback" | any paraphrase inside quotes | Contract; keep the em dashes and the ellipsis character |
| Extension, system level | "System awake" + "Screen may dim or lock" | "Screen awake" at system level | D-02 |
| Extension, power API missing | proposed `ext.pill.unsupported` "Not available in this browser" | "Tap to use the fallback" | Needs a docs/00 §5.1 entry (F16) |
| The API | Screen Wake Lock API (first mention), then Wake Lock API | wakelock, Wake-Lock | API name capitalised |
| The thing it holds | wake lock (lowercase noun); wake-lock only as an adjective ("wake-lock permission") | Wake Lock (as a noun), sentinel (user-facing) | — |
| Browser takes the lock back | "the browser released the lock" / "paused" | re-acquire, lost focus | Hidden, not unfocused (F8) |
| Fallback | video fallback | NoSleep trick, hidden video hack | "Awake via video fallback" |
| Indefinite preset | chip "∞", accessible name "Until I stop"; prose "until you stop" | No limit, indefinite, no end time, forever | C1 |
| Timed presets (UI) | 15 min, 30 min, 45 min, 1 h, 2 h, 4 h, 8 h | 15m, 1hr, 60 min | Unit after a space |
| Durations in prose, titles, SEO | 15 minutes, 1 hour, 2 hours | "1 h" in sentences | C14 |
| Until a time | chip "Until…"; dialog "Stay awake until"; prose "until a time" | "Keep awake until" (canvas) | — |
| Ending a session | Stop | End, Cancel (Cancel = close a dialog) | Button, extend prompt, notification |
| Adding time | "+15 min" (button), "Add 15 minutes" (accessible name) | "Keep going 15 more minutes" | — |
| Always-on-top timer | floating window | floating timer, floating pill, PiP pill, mini player | "Picture-in-Picture" only in developer or legal text |
| Install | "Install AwakeTab"; iOS: "Add to Home Screen" | download, get the app | — |
| iPhone setting names | Low Power Mode, Auto-Lock, Home Screen | low power mode, auto lock, homescreen | Apple capitalisation |
| Power-saving modes | Android "Battery Saver"; Windows 11 "Energy saver" (formerly Battery saver); Chrome "Energy Saver"; generic "battery saver" | treating them as causes of refusal | Fact-check |
| Browser family | Chrome, Edge, and "Chromium-based browsers" (once, when needed) | Chromium (alone, in consumer copy) | T3 |
| Paid tier | AwakeTab Pro; plans "Pro yearly" and "Pro lifetime" | Premium, Plus, "twelve-week" | — |
| Price formats | "$12 / year", "$19 once", "launch price until 8 December 2026, then $29" | "$12/yr" in prose, "was $29", "one-time" and "once" mixed within one page | — |
| Licence | licence (noun), licensed (adjective, verb), licence key | license (noun, in prose) | British noun; the verb "license" is correct |
| Devices | 5 devices; "activation" only in errors | five devices (in UI) | C9 |
| Business products | AwakeTab Embed licence; AwakeTab Kiosk licence; "per site" | Business licence (alone) | Define "site" for Kiosk |
| Extension | AwakeTab for Chrome (Edge store: AwakeTab); "the extension" after first mention | the add-on, the plugin | — |
| Levels (extension) | Screen, System | Display (in UI), Full | — |
| Ambient modes | Standard, Clock, Focus, Minimal, Night, Message, Cook | faces, skins (until O-03 decides) | — |
| Accents | Amber, Indigo, Teal, Rose | lamp colours (until O-01 decides) | — |
| Telemetry | "anonymous usage data" (web: on by default; extension: off by default) | beacon, opt-in (on the web) | F13 |
| Time format | locale default; English examples in one format | a mix of "3 pm" and "09:00" | C5 |
| Dates | 9 September 2026 | September 9, 2026 | C6 |
| Spelling | British: behaviour, colour, minimise, organisation, licence | behavior, color | C7 |
| Punctuation | straight apostrophes; colon or full stop instead of an em dash | em dashes in new copy | Pill strings and the title suffix are exempt |

---

## 6. Prioritised fix list

Effort: S < ½ day, M 1–3 days, L > 3 days. Impact is an estimate.

| # | Action | Why (evidence) | Effort | Impact | Where in repo / design |
|---|---|---|---|---|---|
| 1 | State the web telemetry default on /privacy and in its meta description; fix "opt-in" in the changelog. Or switch the default to off. | Default `true` (`packages/core/src/types.ts:153`); copy implies opt-in (F13, F14). A privacy claim that misleads is a trust and legal risk. | S | H | `pages/privacy.astro:79-89`, `en.json:37`, `changelog/2026-09-analytics-pro.md:6` |
| 2 | Remove every "tested on devices" and "in our tests" claim until `device-matrix.json` has results. | All 14 rows `pending`; contradicts about and changelog (F4–F7) | S | H | `index.astro:219-221, 239, 339-341, 394-396`; `en.json:28, 34`; `HubPage.astro:43, 47`; README:114; canvas HomeBelow and ContentArticle |
| 3 | Replace the battery-saver denial claim everywhere, and rename or remap advice `battery_saver`. | Chromium, WebKit and Firefox source (fact-check) | M | H | `en.json:150`; `index.astro:209-211`; `data/support-matrix.json`; `packages/wake/README.md:102`; all 33 articles line 37/45 (via the generator); docs/04 advice codes |
| 4 | Decide the sponsor card versus "No ads on this screen, now or later", then align home, about and privacy. | `SponsorCard` in the idle and extend slots (F12) | S | H | `index.astro:369`, `about.astro:68`, `privacy.astro:189`, docs/00 §8.3 G5 |
| 5 | Rebuild /pro: plan names, a list of what Pro adds (only shipped features), "always free", the launch end date, plan-specific CTAs; fix `pro.card` and `page.pro.description` (drop "schedules" for the web, "ambient packs" → "Teal and Rose accents"). | FR-PRO-01 not met; gates `schedules` and `sounds.custom` not built; `ads.free` has no ads to remove (§4) | M | H | `pages/pro.astro`, `en.json:46, 284`, `lib/license.ts` (use `PLAN_FEATURES` for the list), canvas Pro boards |
| 6 | Make the launch price switch on 8 Dec 2026 without a manual deploy: scheduled rebuild, or a client-side label check. | `lifetimePrice()` runs at build; the discount ends server-side (docs/09 §2.1) | S | H | `pages/pro.astro:18`, `.github/workflows` (cron), `lib/license.ts:13` |
| 7 | Fix the article generator, then rewrite the 51 pages to their §2 templates. Includes: complete descriptions, real FAQs, no slug leaks, the extension/Pro/Kiosk next steps where the §12 limit calls for them. | 84–90% shared text; 40 truncated descriptions; broken FAQ grammar (editorial report) | L | H | `apps/web/scripts/write-content.mjs`, `apps/web/src/content/*/en/*.md`, add a `content:lint` shingle check |
| 8 | Extension: add `ext.pill.unsupported`, give `ext.advice.denied` a real next step, and correct "accepted the request". | No fallback exists; `chrome.power` has no acceptance signal (F15–F17) | S | M | `apps/extension/src/status.ts`, `en.json:445-446`, `store/listing.md:27`, docs/00 §5.1, docs/10 §3, canvas ExtEdge |
| 9 | Fix the `lost` pill meaning ("hidden", not "lost focus") and the downloads link label. | Wrong mechanism (F8); overclaim (F10) | S | M | `index.astro:88, 97`; canvas HomeBelow |
| 10 | Kiosk: note the one tap for Safari and iPad; define "site"; fix the logo gate wording. | WebKit gesture rule (fact-check); `ambient.logo` is in Pro too (C12) | S | M | `pages/kiosk.astro:114-126`, `en.json:402` |
| 11 | Embed: one staging subdomain (or change the canon), the AMP line, the plugin promise, the attribution wording. | F21–F23, C18 | S | M | `pages/embed.astro:155, 174, 202, 233`; `en.json:382` |
| 12 | `/until/*` H1 without the brand suffix; long-form durations in preset titles and H1s; one unique sentence per preset page. | C13, C14, docs/06 §2.2 | S | M | `pages/until/[time].astro:28`, `pages/[preset].astro`, `en.json:11-13` |
| 13 | Unify the terms in the glossary (∞/Until I stop, floating window, Stop, units, dates, British spelling, apostrophes). Add the glossary to docs/00. | C1–C10 | M | M | `en.json`, the pages listed in §2, docs/00 §5, canvas (see the canvas report) |
| 14 | Floating-window copy: add Firefox 151+; add a device-matrix row for "PiP open, opener hidden". | Fact-check; F18, F19 | S | M | `en.json:276, 152`, `docs/metrics/device-matrix.json` |
| 15 | Extension minimum version: 120 for 30 s alarms, or adjust the listing. | Chrome 120 release notes (fact-check) | S | L | `data/support-matrix.json:57`, `store/listing.md:49` |
| 16 | Tone pass: cut the "green dot" quip, "guarantee", "instant", "you can trust", jargon (Chromium, `Date.now()`, re-acquiring), "Just stop", "Reset? Yes, reset", the Pomodoro trademark. | T1–T9, T11, F11 | S | L | `en.json`, `index.astro`, `[preset].astro`, `changelog/` |
| 17 | Em-dash sweep of new copy (keep pills, `content.stale` and the title suffix). | 60 in `en.json`, 63 in articles | S | L | `en.json`, articles (via the generator), canvas |
| 18 | `pip.empty` as one placeholder string; titles with a doubled brand; sentence-case home title; untranslated `page.pro.*` in locales (confirm intent). | C15–C17, C19 | S | L | `en.json:5, 24, 33, 45, 369`; `PipPage.astro:38`; locale files; docs/07 |
| 19 | Canvas-only fixes (Pro "was $29", "less than two years", "No limit", "15m", "Try again", hidden 45m/4h on phone, the designer note in Stats, extension sync wording). | Canvas report | M | M | `canvas-copy-audit.md`; `docs/redesign/agent-brief.md` "Copy corrections" |

**Owner decisions this list depends on:**
- #1: telemetry default.
- #4: sponsor card.
- #10: what a Kiosk "site" is.
- #11: one or more staging subdomains.
- O-01 to O-03 from the canvas report: accent names, which modes are free, clock faces.

Per CLAUDE.md, any change to pill copy (#8 adds an extension-only key), storage keys, or plan terms goes into docs/00 first.
