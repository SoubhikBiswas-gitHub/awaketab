# Go-to-market and launch plan

Status: research input, not a spec · 27 September 2026 · Author: Head of Growth / GTM audit agent (wave 5) · Owner: Soubhik

Scope: launch readiness, a 90-day go-to-market plan, launch copy for each channel, Chrome Web Store listing and ranking (ASO), partnerships, community and support, the PR angle, budget, measurement and risks. Nothing here changes a contract by itself. Anything that touches pill copy, storage keys, routes, ad placement, budgets, tokens or zero hydration needs the docs update that `CLAUDE.md` names first.

Read with: `docs/research/market.md` (competitors, channel rules), `marketing-positioning.md` (one-liner, tagline, banned phrases), `marketing-pricing-cro.md` (/pro, Embed, launch price), `growth-conversion.md` (funnels, upgrade moments), `fact-check-2026-09-26.md`, `editorial-audit-articles.md`, `docs/17-launch-checklist.md`, `docs/LAUNCH-AUDIT.md`. Where this file and a sibling disagree, the disagreement is named in the text and listed under Owner decisions.

Evidence labels: **[Fact]** checked in the repo or at a source listed in §13 (URL and access date). **[Estimate]** a number I worked out; the inputs are shown. **[Opinion]** a judgement call. **OWNER STEP** means the step needs Soubhik's own account, login, payment or signature. An agent cannot do it.

---

## Summary for the owner

1. **Register awaketab.com, .app, .page and .dev today, before anything else.** RDAP and WHOIS return "not found" for all four [Fact, 26 Sep 2026, 17:28 UTC]. The repository is public and search-indexed, and it names awaketab.com everywhere, so anyone can see the plan and buy the name. About $47 a year in total. OWNER STEP.
2. **We cannot launch publicly today.** Readiness is **3.2 / 10** on the scorecard below. The engineering is ready (46 / 70 audit rows PASS, 0 FAIL). What blocks launch is outside the code: no domain, sandbox-only checkout, the extension not submitted, analytics not bound in production, false claims on live pages, templated articles, and the redesign not built.
3. **Launch date: Show HN on Tuesday 17 November 2026 and Product Hunt on Tuesday 1 December 2026, in separate weeks.** That leaves 7 weeks to fix the blockers. It avoids Diwali (6–10 Nov), the US election (3 Nov) and Thanksgiving week (23–29 Nov). Slip rule: if the launch gate (§2.3) is not green by 10 Nov, go on 12 January 2027. Never launch in the last two weeks of December.
4. **Launch with the truth fixed rather than with everything built.** The gate is: domain live, false claims gone, top 12 articles rewritten and the other 39 `noindex`, redesign built for the "front door" (tool, home, /pro, /extension, OG images), extension approved, npm package published, and the device matrix recorded. The remaining redesign surfaces can ship after launch.
5. **The live pages still say "battery saver can deny the lock"** (checked on awaketab.pages.dev/for/cooking today). Chromium and WebKit contain no such check. Hacker News readers are exactly the people who read browser source. Fix it before launch and use the correction as a story (§8).
6. **Show HN is the main event; Product Hunt comes second; Reddit is narrow.** market.md confirms that r/InternetIsBeautiful excludes freemium sites, r/productivity bans self-promotion and Chrome Web Store "Featured" nominations are closed. So Reddit means only r/SideProject (framed as a request for feedback), r/webdev Showoff Saturday (the MIT library, no product pitch) and r/chrome_extensions (after store approval). All copy is in §4.
7. **Nobody asks for upvotes or store reviews, anywhere.** Both HN and PH forbid asking for upvotes. The Chrome Web Store treats reviews from people affiliated with the publisher as manipulation, and the FTC says don't ask friends or family for reviews without disclosure. The friends email asks people to try the product and reply with what broke, and it contains no HN link.
8. **Only one way of asking for a store review is honest: one quiet line in the extension popup,** after the 5th normal session. Everyone sees the same ask. It is never shown during a session and never depends on how many stars someone gave in the app (§5.4). That needs a storage key in docs/08 first.
9. **We cannot tell which channel worked.** `page_view` records neither `ref` nor the referrer (`tool/params.ts` parses `ref` but nothing sends it), and Analytics Engine is not bound in production yet. Add a validated `ref` and a coarse referrer class (`hn`, `ph`, `reddit`, `search`, `other`) to `page_view` before launch. That needs docs/00 §10, docs/18 §3 and a `/privacy` update.
10. **Cash budget for 90 days: about $67 (≈ ₹5,900) with no paid acquisition,** plus the chartered accountant's GST/LUT fee (₹8k–20k per the BRD) before the first real Pro sale. The one new spend worth making: Workers Paid at $5 a month from launch week. The free plan stops Functions at 100,000 requests a day, and the licence and beacon endpoints share that limit.
11. **Sell to the right people.** Kiosk (Tomás) and lifetime Pro (Lena, Kenji) earn the money. Priya and Marco bring the volume. Partnerships: recipe sites *without* Cook Mode (the embed as a way to earn links, not revenue), teachers and lecturers, and developer newsletters for the library. Do **not** market to IT departments as a way around a lock policy (market.md §1.6).
12. **What I would do on Monday:** register the domains, set up Cloudflare and email routing, submit the extension (review takes time), publish `@awaketab/wake`, remove the battery-saver claim everywhere, and decide the eight open items under Owner decisions.

---

## 1. Launch readiness scorecard

Scores are 0–10 for **ready to launch publicly today**, not for quality of work. Average 3.2 [Estimate: unweighted mean of the 12 rows].

| # | Area | Score | Reason (one line) |
|---|---|---|---|
| 1 | Custom domain and brand handles | **0** | awaketab.com, .app, .page, .dev unregistered; GitHub org `awaketab`, npm scope, X, Bluesky and `buymeacoffee.com/awaketab` unclaimed (the /about donate link is a 404 today) [Fact] |
| 2 | Production checkout | **2** | Polar sandbox only; `CHECKOUT_LINKS_PRODUCTION` placeholders; unbuilt features still sold (F2); strike-through price; Embed licence cannot be delivered (pricing-cro §1.9); GST/LUT not confirmed |
| 3 | Chrome and Edge store listing | **4** | Reproducible zip, permissions and listing text ready; screenshots are placeholders; title/summary mismatch with the manifest; "for Chrome" name also shows on Edge; not submitted |
| 4 | Analytics and measurement | **3** | Events, SQL and alerts are designed; AE binding and secrets not set (N-01); `/pro` ignores the telemetry opt-out (growth F4); no channel attribution |
| 5 | Legal and trust pages | **5** | /privacy, /terms and /about exist and match docs/08; support@ not routed; trademark screen not done; GST/LUT before first sale (BRD R12) |
| 6 | Content quality | **2** | 51 articles are one template (84–90 % duplicate shingles); false battery-saver claim in all 33 learn/on/guides/vs articles and in the tool advice; 40 descriptions cut mid-sentence |
| 7 | Redesign | **3** | Clear Night fully on canvas (27/48 done, audits running); 0 of 26 surfaces built in the app |
| 8 | Engineering and reliability | **9** | 501 unit, 152 functions, 607 e2e tests green; budgets met; Lighthouse 100 locally; only live checks remain |
| 9 | Library and developer proof | **4** | `@awaketab/wake` built (MIT, ≤ 3.4 KB gz); not on npm; README badges point to a GitHub org that does not exist; no root `LICENSE` for the rest of the repo |
| 10 | Evidence (device matrix) | **2** | `/learn/how-we-tested` says "Results pending"; 14 real-device rows not run (N-11) |
| 11 | Launch assets | **2** | Checklist items only; no gallery, no video, OG images pre-brand (positioning §7.8). The copy is in this file |
| 12 | Community and support | **2** | No issue templates, no Discussions, no public roadmap, no changelog feed; support mailbox not routed |

### 1.1 What blocks a public launch (must be green)

| Blocker | Evidence | Fix | Who |
|---|---|---|---|
| B1 Domain | RDAP 404 for all four TLDs (26 Sep 2026) | Buy at Cloudflare Registrar, auto-renew, registrar 2FA; add to Pages (N-01 step 2); 301 the other three; Search Console + Bing (N-07) | **OWNER STEP** |
| B2 False claims | Live `/for/cooking` shows "battery saver is blocking the wake lock"; en.json `tool.advice`; support-matrix; library README (fact-check) | Replace with the real causes: hidden tab, Permissions-Policy, Safari needs a tap, Firefox at ≤ 5 % battery unplugged; remove "device on a shelf", "in our tests", "works in Brave, Arc and Opera" (positioning §9) | Agent (content PR) |
| B3 Templated articles | editorial audit | Rewrite 12 launch pages (§2.2); `noindex` the other 39 until rewritten (Owner decision MG-02) | Agent + owner read |
| B4 Checkout | LAUNCH-AUDIT N-04 | Either production Polar with a real-card test and refund, or hide every Pro link for launch (MG-03) | **OWNER STEP** |
| B5 Extension live | N-05 | Submit in week 1; review can take days to weeks | **OWNER STEP** |
| B6 Production analytics | N-01 steps 3–5 | Bind AE `EVENTS`, KV, secrets; fix the `/pro` telemetry opt-out; add `ref` and referrer class | Owner (bindings) + agent (code) |
| B7 Front-door redesign | STATUS.md | Build tool, home above the fold, /pro, /extension, OG images in Clear Night (MG-01) | Agent |
| B8 Support reachable | N-01 step 7, N-19 | Route support@ and send a test | **OWNER STEP** |
| B9 Evidence | N-11 | Run the device matrix; publish `/learn/how-we-tested` with dates | **OWNER STEP** (devices) |
| B10 Capacity on launch day | Workers free limit 100k requests/day (Cloudflare) | Workers Paid $5/month from the week before launch (MG-09) | **OWNER STEP** |

Nice to have for launch, not blocking: the remaining redesign surfaces, translations (all 70 translated pages stay `noindex` until native review, which is correct), AdSense (G1 comes later and earns little), the Embed licence sale.

---

## 2. Detailed audit

### 2.1 Channel rules that shape the plan

| Channel | Rule that matters | Consequence for us | Source |
|---|---|---|---|
| Show HN | Must be something people can try; "Please don't ask friends to upvote or comment"; no landing pages or sign-up walls; title starts with "Show HN"; no hype words | The tool is the demo and needs no sign-up (good). The library and the tested matrix are the substance. No voting ring, not even a hint | HN Show HN rules and guidelines [Fact] |
| HN precedent | nosleep.page's "Prevent your computer sleeping with just a webpage" got 252 points and 130 comments (22 Apr 2022). Top comments: does it work in the background, is it NoSleep.js, just use `caffeinate`, use Google's Keep Awake, "keep awake until 6:18pm", "12 KB of JS seems huge", video fallback CPU cost, "bypassing the lock policy is a security problem" | These are the questions we will get. §4.1 answers each one in advance | HN item 31123522 [Fact] |
| Product Hunt | 12:01 am PT; tagline ≤ 60 characters; description ≤ 260; gallery 1270×760; thumbnail 240×240; personal accounts only; self-hunting is fine; never ask for upvotes, ask people to visit and comment | Launch on a separate day. Lead with craft (pill states, floating window, cook mode, clock faces) | PH launch guide; LaunchList; market.md [Fact] |
| r/webdev | Projects only on Showoff Saturday; commercial promotion banned even then; technical focus | Post only the MIT library, link GitHub, don't mention Pro | rankhog summary [Fact, secondary] |
| r/SideProject | No formal rules; the community rewards screenshot + context + a specific feedback ask | Ask for feedback, don't announce | rankhog summary [Fact, secondary] |
| r/InternetIsBeautiful | Excludes freemium and extensions; 90/10 rule | **Don't post** | market.md, rankhog [Fact, secondary] |
| r/productivity | No self-promotion in any form | **Don't post** | market.md [Fact, secondary] |
| Chrome Web Store | Name ≤ 75 characters; keyword repeated ≤ 5 times; no incentivised or affiliated ratings; Featured nominations closed 20 Aug 2026; recent reviews count more | Plan for no Featured badge; protect ratings; ask for reviews in one honest way only | Chrome docs; CWS blog (via market.md) [Fact] |
| Edge Add-ons | Up to 7 hidden search terms, 6 screenshots; leader ≈ 40k installs | Easier ranking: submit the same week | market.md [Fact] |
| AlternativeTo | Free listing, reviewed in 2–7 days; anti-spam guidelines | List against nosleep.page, Caffeine, Amphetamine, PowerToys Awake, Keep Awake | AlternativeTo guides [Fact, secondary] |
| console.dev | Lists only pre-1.0 / beta developer tools | `@awaketab/wake` 1.0.0 is **not eligible**. Skip | console.dev criteria [Fact] |
| Reviews (US) | "Don't ask for reviews only from customers you think will leave positive ones"; friends and family must disclose | No review gating; friends are not asked for reviews | FTC guide for marketers [Fact] |

Reddit blocks automated fetching, so every subreddit rule above comes from a secondary summary. **OWNER STEP:** read each sidebar on the day of posting.

### 2.2 Content that launch traffic will read (rewrite first)

HN, PH and Reddit visitors go to the home page, then /pro, /extension, /library and whichever guide answers their objection. Rewrite these 12 to their docs/06 §2 templates, with the fixed titles and descriptions from the editorial audit, before launch [Opinion, based on which objections came up in the nosleep.page thread]:

1. `/learn/screen-wake-lock-api-guide` (Kenji, newsletters)
2. `/learn/nosleep-js-vs-wake-lock` (the library's reason to exist)
3. `/learn/does-a-wake-lock-keep-teams-green` (market.md: the page most likely to earn links)
4. `/learn/how-we-tested` (after N-11)
5. `/learn/low-power-mode-and-wake-locks` (becomes the myth-busting page, §8)
6. `/vs/nosleep-page` (must be fair; the owner reads it, N-14)
7. `/vs/caffeinate-command` (the "just use caffeinate" reply)
8. `/vs/mouse-jigglers` (the "we don't fake activity" page)
9. `/for/presentations` (Lena)
10. `/for/work-laptop` (Priya; add the "For IT admins" note, market.md action 15)
11. `/for/cooking` (Marco; embed cross-link)
12. `/for/ai-agents` (Kenji; extension cross-link, since a hidden tab pauses)

The other 39 get `noindex` until they are rewritten (Owner decision MG-02). Reason: Google's spam policies name "scaled content abuse" (many pages made mainly to rank), and a new domain's first crawl sets the tone [Opinion]. Cost: the docs/17 G1 condition "60 English pages indexed" moves out, so AdSense comes later. That is acceptable because ads are the smallest revenue line in the base case (BRD §9.2).

### 2.3 The launch gate (checked on Tuesday 10 November 2026)

All of these must be true, or Show HN moves to Tuesday 12 January 2027:

- [ ] `https://awaketab.com` serves the production build; `/api/health` shows `"polar":"production"` or Pro links are hidden (MG-03).
- [ ] No page, string or README says battery saver, Energy Saver or Low Power Mode "blocks" or "denies" the wake lock (`grep -ri "battery saver" apps packages` reviewed by a person).
- [ ] 12 launch articles rewritten; 39 others `noindex`; the sitemap matches.
- [ ] Front-door redesign built; the tool screenshots in this plan are real captures.
- [ ] Extension approved on Chrome and Edge; `EXTENSION_STORE_URLS` hold the real listing URLs.
- [ ] `npm view @awaketab/wake version` → `1.0.0`, with provenance; README links resolve.
- [ ] Device matrix recorded; `/learn/how-we-tested` shows dates, not "Results pending".
- [ ] AE receiving events in production; the weekly dashboard (§10) runs; `page_view` carries `ref` and a referrer class.
- [ ] support@ tested; GitHub Issues templates and Discussions on.
- [ ] Workers Paid on; uptime checks alert; rollback drill done (N-16, N-17).

---

## 3. 90-day plan, week by week

Week 1 starts Monday 28 September 2026. Times are IST unless marked. "Exit" is the check at the end of the week.

### Pre-launch (weeks 1–7): claim, fix the truth, build the front door

| Week | Dates | Goal | Tasks (OWNER STEP marked) | Exit |
|---|---|---|---|---|
| W1 | 28 Sep–4 Oct | Claim everything | **OWNER STEP:** register 4 TLDs; Cloudflare Pages custom domain; Email Routing for support@; GitHub org `awaketab` and transfer the repo (GitHub redirects the old URL); npm org; handles on X, Bluesky, Product Hunt (personal account), Buy Me a Coffee; trademark screen (USPTO, EUIPO, IP India, classes 9/42). **OWNER STEP:** Chrome Web Store developer account ($5) and Edge Partner Center; submit the current extension build (store review runs while we build). Agent: remove every false claim (B2) | Domain resolves; extension "in review"; `grep` clean |
| W2 | 5–11 Oct | Production plumbing | **OWNER STEP:** N-01 bindings and secrets, N-03 key secret, N-07 Search Console + Bing, N-16 uptime, N-18 KV backup. Agent: fix `/pro` telemetry opt-out and locale (growth F4); add `page_view.ref` + referrer class (docs first); remove unbuilt Pro features from all copy (growth F2); dated launch price, no strike-through | Events visible in AE on the preview; GSC verified |
| W3 | 12–18 Oct | Library out, evidence in | **OWNER STEP:** N-06 npm trusted publishing → `@awaketab/wake` 1.0.0; start N-11 device matrix (14 rows). Agent: rewrite articles 1–6 of §2.2; add `noindex` to the 39; add a root `LICENSE` (MG-06); issue templates; Discussions | npm live; 6 articles done |
| W4 | 19–25 Oct | Front door, part 1 | Agent: build redesign batch "tool + home above the fold" in Clear Night, all gates green. Articles 7–12. **OWNER STEP:** finish device matrix; real-card Polar test in production (N-04) if Pro goes live at launch | Tool redesign merged; 12 articles done |
| W5 | 26 Oct–1 Nov | Front door, part 2 | Agent: /pro (pricing-cro §2.1 copy), /extension, OG images in Clear Night. **OWNER STEP:** GST/LUT with the CA before any production sale (BRD R12); extension listing screenshots replaced by real captures (§5) and resubmitted if needed | /pro and /extension live on the preview |
| W6 | 2–8 Nov | Private beta | Send the friends email (§4.6) to 20–40 people, **with no HN link**. Fix what they report. Record the 45-second demo video and capture the PH gallery (§4.2). Draft the HN first comment against the real product. Avoid 3 Nov (US election) and 6–8 Nov (Diwali) for anything public | ≥ 10 replies triaged; top 3 issues fixed |
| W7 | 9–15 Nov | Freeze and rehearse | 10 Nov: launch gate check (§2.3). Rollback drill. Lighthouse on production. AlternativeTo listing submitted (2–7 days review). Workers Paid on. Submit sitemap; IndexNow `--all`. 14 Nov (Saturday): **no** Reddit yet | Gate green, or slip to 12 Jan 2027 |

### Launch week (week 8): Show HN

| Day | Time | Action |
|---|---|---|
| Mon 16 Nov | 10:00 | Freeze `main`. Final `pnpm test`, e2e against production. Cloudflare cache purge. Changelog entry "Public launch". |
| **Tue 17 Nov** | **19:30 IST (14:00 UTC, 09:00 ET)** | **OWNER STEP:** post Show HN from Soubhik's own HN account (§4.1). Post the first comment within 2 minutes. Reply to every comment for 3–4 hours. Don't argue; fix and say so. Share the link with nobody. |
| Tue 17 Nov | 20:00–24:00 | Watch the docs/17 §6 dashboard: uptime, 5xx, autostart success, `lock_denied` share, CLS. Rollback criteria as docs/17 §6. |
| Wed 18 Nov | morning | Reply backlog; log issues; one changelog line per fix shipped. Post the LinkedIn post and the X thread (§4.5), which link to the site, **not** to HN. |
| Thu 19 Nov | — | Frontend Focus / JavaScript Weekly submission (§6.4) with the myth-busting article (§8). |
| Sat 21 Nov | — | r/webdev Showoff Saturday post (library, §4.4 post 2). r/SideProject post (§4.4 post 1). |
| Sun 22 Nov | — | Write `docs/metrics/launch-day.md`: traffic by channel, top objections, fixes, what changes before PH. |

### Second wave and post-launch (weeks 9–13)

| Week | Dates | Goal | Tasks | Exit |
|---|---|---|---|---|
| W9 | 23–29 Nov | Fix what HN found; prepare PH | Ship the top objections as fixes or FAQ answers. PH page drafted, scheduled for 1 Dec, gallery updated with anything HN changed. r/chrome_extensions post (§4.4 post 3) once the listing has been live ≥ 7 days. No launches during US Thanksgiving | PH scheduled |
| W10 | 30 Nov–6 Dec | **Product Hunt** | **Tue 1 Dec 13:31 IST (12:01 am PST, 08:01 UTC)** OWNER STEP: launch from Soubhik's personal PH account; maker comment at once; reply within ~15 minutes all day. Tell the friends list "we're on PH today, have a look, comments welcome" (never "upvote") | PH day logged |
| W11 | 7–13 Dec | Partnerships start | 10 recipe-site emails, 10 teacher/lecturer contacts, 5 dev newsletter or blog pitches (§6). AlternativeTo live check. If the launch price ends 8 Dec, the /pro rebuild runs that day (pricing-cro §1.4) | 25 outreach sent |
| W12 | 14–20 Dec | Content from data | Pick the next 6 articles from GSC impressions without a page (docs/17 §7). Monthly report `docs/metrics/2026-12.md`. Store review ask (§5.4) live if the storage key is approved | 6 pages chosen |
| W13 | 21–27 Dec | Quiet week | Holidays: no launches. Support backlog, docs, 90-day review against §10 targets; plan Q1 (translations review, Embed licence delivery, AdSense when 60 good pages exist) | 90-day review written |

---

## 4. Channel plan with ready-to-post copy

Voice rules (positioning §5, §8): at most one "honest" per post, show the mechanism instead of adjectives, no "revolutionary", no exclamation marks, pill strings exactly as in docs/04.

### 4.1 Show HN

**Title (78 characters, within HN's 80 limit):**

> Show HN: AwakeTab – keep a screen on from a tab, and see when the lock is lost

Alternative if the library should lead (80 characters): `Show HN: @awaketab/wake – a 3.4 KB wake-lock library that reports the real state`. I recommend the tool title: HN wants something people can try, and the library goes in the first comment.

**URL:** `https://awaketab.com/` (the tool starts on load; no `?ref=`, which HN readers dislike. Measure with the referrer class instead.)

**First comment (post within 2 minutes):**

> Hi HN, I'm Soubhik. I built AwakeTab on my own, from India.
>
> It's a browser tab that keeps your screen on: for a set time, until a clock time ("until 11:30"), or until you stop. I built it because the tools I tried said "awake" the moment I clicked, whether or not the browser had actually granted anything. In the 2022 thread about nosleep.page here, the top use case was a locked-down work laptop with a 5-minute sleep policy, and the top request was "keep awake until 6:18 pm". Both are in.
>
> How it works: it uses the Screen Wake Lock API (Chrome/Edge 84+, Firefox 126+, Safari 16.4+). The status only says "Screen awake" once a real WakeLockSentinel exists. If you switch tabs, the browser releases the lock, and the status changes to "Paused — tab hidden" instead of pretending. When you come back, it asks for the lock again. A tiny video fallback runs only on browsers without the API.
>
> What it can't do, plainly:
> - It can't hold the lock while the tab is hidden. That's the platform. The floating window (Document PiP) or the Chrome extension can, because the extension uses Chrome's `power` API.
> - It can't stop sleep when you close a laptop lid.
> - It doesn't keep Teams or Slack "green". Presence follows your keyboard and mouse, and AwakeTab never simulates input.
> - When the browser says no, it tells you why. The real reasons are a hidden tab, a Permissions-Policy (an iframe without `allow`), Safari wanting a tap first, or Firefox at 5 % battery or less while unplugged. While checking this I found my own pages claiming that battery saver blocks the lock. Chromium and WebKit have no such check, so I removed it. The write-up with source links is here: [link to the rewritten /learn page].
>
> For developers: the lock layer is `@awaketab/wake` on npm (MIT, zero dependencies, ≤ 3.4 KB gzipped), with an explicit state machine, as a maintained alternative to NoSleep.js. The device results are at /learn/how-we-tested, with dates.
>
> Privacy: no account and no cookies on the tool. No third-party requests on tool pages. Anonymous first-party counts only, which you can turn off in Settings.
>
> Money: the tool is free. There's an optional Pro (lamp colours, your own message on screen, longer stats history, schedules in the extension) that never changes whether the screen stays awake. There are no ads on the tool, and there never will be.
>
> I'd love to hear where the status was wrong for you: your browser, OS, and what the pill said.

Check before posting: every sentence must be true on the day. In particular: npm published, `/learn/how-we-tested` dated, Pro list matching what is built (MG-03), and the "no ads" line consistent with Owner decision O-04 (sponsor card) in DECISIONS.md. If O-04 is not decided "remove", change the last money sentence to "There are no Google ads on the tool."

**Prepared replies** (short, factual, no arguing):

| Likely comment | Reply |
|---|---|
| "Just use `caffeinate` / PowerToys Awake / Amphetamine" | "Yes, if you can install software or open a terminal, those are great, and /vs/caffeinate-command says so. AwakeTab is for the machines where you can't: managed laptops, kiosks, a phone on a counter, a projector PC." |
| "Google's Keep Awake extension does this" | "It does, on Chrome, with an install. It was last updated in Aug 2023 (market.md). A web page works on any browser with the API, including iPhone Safari." Don't disparage it further. |
| "Is this just NoSleep.js?" | "No. NoSleep.js uses the Wake Lock API when present and a looping video otherwise. `@awaketab/wake` adds a state machine that reports `held` only while a sentinel exists or the fallback video is really playing, and it resumes after visibility changes. The comparison is at /learn/nosleep-js-vs-wake-lock." |
| "Why so much JS?" | Give the real numbers from `pnpm size` on the day (budget: critical ≤ 15 KB gz, total ≤ 40 KB gz; library ≤ 3.4 KB gz). |
| "Video fallback burns CPU" | "Agreed. It only runs on browsers without the Wake Lock API, which is rare since Firefox 126 and Safari 16.4. The status then says 'Awake via video fallback', so you know." |
| "This bypasses my company's security lock" | "It stops the idle display timeout while a session runs. That is what the API is for, and your IT can turn it off by policy. If your organisation requires the lock for security, follow it: AwakeTab doesn't simulate input or change settings, and I don't market it as a way around a lock policy. /guides/lock-screen-vs-sleep explains the difference." |
| "Can a page do this without permission?" | "In Chromium the permission defaults to allowed for visible, top-level pages. Sites can be blocked with a Permissions-Policy, and embedded frames need `allow="screen-wake-lock"`." |
| "Does it work with the tab in the background?" | "No, and the status will say 'Paused — tab hidden'. The floating window or the extension are the ways around that." |
| "Why charge anything?" | "The lock is free and always will be. Pro is cosmetic plus memory, so I can keep testing on real devices." |
| "Open source?" | Answer per MG-06 (the library is MIT; say the truth about the rest of the repo). |

Don't: edit the title after posting, repost within days if it flops (HN allows a repost after a while if it got no attention; wait at least a month), ask anyone to vote, or post from a second account.

### 4.2 Product Hunt (Tuesday 1 December 2026)

- **Name:** AwakeTab
- **Tagline (49/60):** `Keeps your screen awake. Says so only when it is.` (positioning T1; MG-05 in that file). Backup: `Keep your screen on from a tab. See when it isn't.` (50)
- **Description (239/260):**
  > AwakeTab keeps your screen on from a browser tab, for 30 minutes, until 11:30 or until you stop. It says "Screen awake" only after the browser confirms the lock and tells you why when it can't. No account or install. Free; Pro is optional.
- **Topics:** Productivity, Chrome Extensions, Developer Tools, Open Source (only if MG-06 makes it true).
- **Links:** website `https://awaketab.com`, Chrome Web Store listing, GitHub (library).
- **Thumbnail (240×240):** the Clear Night logo, the ring with a gap and the lit aqua bead (DESIGN.md §2.3). No text.
- **Pricing field:** "Free" with "Paid options" (lifetime or yearly Pro). Not "Free trial".

**Gallery shot list (1270×760, real captures, Clear Night, times in 12-hour format per D-R07, no invented stats or reviews):**

| # | Frame | Caption (≤ 60 characters) |
|---|---|---|
| 1 | Desktop tool, dark, Ring face, pill "Screen awake", "Until 11:30 AM" and the end-time line | Your screen stays on. The pill shows it's real. |
| 2 | Split frame: tab visible "Screen awake" → tab hidden "Paused — tab hidden" | When the browser lets go, it says so. |
| 3 | "Blocked — here's the fix" with the advice card (a real cause, e.g. an iframe without `allow`) | When it can't, it tells you why. |
| 4 | Until picker: "Until 11:30 AM", "tomorrow" shown past midnight | End at a clock time, not just a timer. |
| 5 | iPad in cook mode, big timer, light theme | Big numbers for a kitchen counter. |
| 6 | Floating window over a slide deck | Keep it in view while you present. |
| 7 | Extension popup + toolbar badge (Screen / System) | The extension keeps going with the tab hidden. |
| 8 | "What stays free" list from /pro | The lock is free. Pro changes the look. |

Optional video (≤ 45 s, no music needed): open the page → "Starting…" → "Screen awake" → switch tabs → "Paused — tab hidden" → switch back → "Screen awake" → set "until 11:30" → floating window. Recorded with macOS screen recording, no cuts or strobing (the PH GIF rules).

**Maker comment:**

> Hi Product Hunt, I'm Soubhik, and I made AwakeTab alone.
>
> Most keep-awake pages say "on" the moment you click. AwakeTab waits until your browser actually grants the screen wake lock, and only then shows "Screen awake". Switch tabs and the browser releases it; the pill changes to "Paused — tab hidden" instead of pretending.
>
> What you get for free: any length, an end time like "until 11:30", four clock faces, cook mode with big numbers, a floating window for presentations, install and offline use, 8 languages, and no account.
>
> What it can't do: hold the lock with the tab hidden (the Chrome extension can), stop a closed laptop lid from sleeping, or keep Teams green. It never fakes mouse movement.
>
> Pro is optional and only changes how it looks and what it remembers.
>
> I'd really like to know where it didn't do what the pill said: which browser and device?

**PH day plan:** reply within about 15 minutes all day (PH guidance). Tell the friends list and LinkedIn "we're on Product Hunt today, have a look, comments and bug reports welcome". Never say "upvote", never offer anything in return, no paid "upvote services" (PH bans rings).

### 4.3 AlternativeTo and directories (free, week 7)

**AlternativeTo** (OWNER STEP, personal account, disclose as the developer):
- Name: AwakeTab. Platforms: Online, Chrome, Edge, PWA (plus iPhone and iPad via Home Screen). Licence: Freemium (plus "Open Source" only for the library if listed separately).
- Short description: "Keep your screen on from a browser tab, for a time or until a clock time. The status shows when the browser grants or drops the lock."
- Alternative to: nosleep.page, Caffeine, Amphetamine, PowerToys Awake, Keep Awake (Google) (market.md).
- Tags: keep-awake, screen-timeout, wake-lock, prevent-sleep, presentation, kiosk.

Other free listings, in this order (check each site's rules on the day, as none were verified here): Edge Add-ons (store), npm (the package page is a listing), GitHub topics on the repo (`wake-lock`, `screen-wake-lock`, `keep-awake`, `pwa`), SaaSHub, Uneed, DevHunt (library only), Indie Hackers product page. **Skip** paid directory-submission services: they sell volume, not fit.

### 4.4 Reddit: three posts that follow each subreddit's rules

Read the sidebar on the day (OWNER STEP). Post from Soubhik's own account with the affiliation stated. One post per subreddit, and stay in the comments.

**Post 1: r/SideProject (week 8, Saturday 21 Nov). Asks for feedback, doesn't announce.**

> **Title:** I built a keep-awake tab that only says "Screen awake" once the browser confirms it. Is the first 10 seconds clear?
>
> [screenshot: tool in dark, pill "Screen awake", "Until 11:30 AM"]
>
> I'm the developer. AwakeTab keeps a screen on from a browser tab, for a set time or until a clock time, using the Screen Wake Lock API. The thing I cared about most is that the status is real: it shows "Starting…", then "Screen awake" only after the browser grants the lock, and "Paused — tab hidden" when you switch away.
>
> It's free with no account. There's an optional Pro for looks and history, which I'm not asking about here.
>
> What I'd love feedback on:
> 1. On first load, is it obvious that it has already started?
> 2. Does "Paused — tab hidden" make sense, or does it read as broken?
> 3. On a phone, can you find how to set an end time?
>
> Link: https://awaketab.com. Happy to answer anything about the Wake Lock API too.

**Post 2: r/webdev Showoff Saturday (week 8, Saturday 21 Nov). Library only; no commercial link.**

> **Title:** [Showoff Saturday] @awaketab/wake: a 3.4 KB Screen Wake Lock wrapper that models the lock as a state machine (MIT)
>
> The Screen Wake Lock API is simple until you ship it: the sentinel is released when the tab is hidden, Safari wants a user gesture, embedded frames need `allow="screen-wake-lock"`, and Firefox releases at 5 % battery or less while unplugged. Most wrappers keep a boolean, and it's often wrong.
>
> `@awaketab/wake` keeps an explicit state (`idle`, `requesting`, `held`, `lost`, `denied`, `unsupported`, `fallback`), re-requests the lock when the page becomes visible again, and reports `held` only while a live `WakeLockSentinel` exists or the fallback video is actually playing. The fallback is for browsers without the API.
>
> - Zero dependencies, ≤ 3.4 KB gzipped including the fallback video, SSR-safe, TypeScript
> - React / Preact / Vue bindings, and an IIFE for a `<script>` tag
> - Tests cover every state transition
>
> I also went through the Chromium, WebKit and Firefox source to check which conditions really reject a wake lock. Battery saver isn't one of them in Chromium or WebKit, even though many articles (mine included, until recently) say it is. Notes and links: [GitHub README section].
>
> Repo: [GitHub link]. Feedback on the API shape is welcome, especially the names of the states.

(The seven state names match docs/04 §2 and the library type `TLockState`.)

**Post 3: r/chrome_extensions (week 9, after the listing has been live ≥ 7 days).**

> **Title:** I made a keep-awake extension whose badge lights only while Chrome actually holds the request
>
> Developer here. AwakeTab for Chrome keeps your display on, or just the computer awake ("System"), using `chrome.power`. It keeps working when its tab is hidden, which a web page can't do.
>
> A few decisions I'd like opinions on:
> - The badge stays blank when idle and shows the minutes left, ON or SYS only while the request is held.
> - Permissions are `power`, `storage` and `alarms`. Notifications and per-site host access are optional and requested one site at a time.
> - No remote code; anonymous stats are off by default.
>
> What it doesn't do: it doesn't work after Chrome quits, it can't stop sleep when the lid closes, and it doesn't keep Teams green (no fake input).
>
> Core features are free. Schedules and auto-start are in an optional Pro.
>
> Store link: [real listing URL]. Is the Screen vs System distinction clear in the popup?

**Not posting:** r/InternetIsBeautiful (freemium excluded), r/productivity (no self-promotion), r/sysadmin and r/msp (no promotion; wrong message anyway), r/Cooking (off-topic promotion). r/software only for the library, and only if MG-06 is decided.

### 4.5 LinkedIn post and X thread (Wednesday 18 November)

**LinkedIn (personal profile):**

> For the last few months I've been building AwakeTab, a browser tab that keeps your screen on. It's live today at awaketab.com.
>
> The idea is small. Many people can't change their sleep settings: work laptops locked to 5 minutes, a tablet on a kitchen counter, a projector PC in a lecture hall. A tab can keep the screen on, but most tools say "on" the moment you click, whether or not the browser agreed.
>
> AwakeTab only says "Screen awake" once the browser has granted the lock. When you switch tabs and the browser lets go, it says "Paused — tab hidden". When it can't, it tells you the real reason.
>
> Two things I learned:
> 1. Battery saver doesn't block the web wake lock in Chrome or Safari. I read the source to check, and removed that claim from my own pages.
> 2. The loudest request in this category is "keep me green on Teams". I don't do that: presence follows your keyboard and mouse, and AwakeTab never fakes input.
>
> It's free, no account, 8 languages, and there's a Chrome extension for when the tab needs to stay hidden. If you present, teach, cook from recipes or run dashboards, I'd love to hear whether it held up for you.

**X / Bluesky thread (each ≤ 280 characters):**

1. I built AwakeTab: a browser tab that keeps your screen on for a set time, until a clock time, or until you stop. awaketab.com
2. Most keep-awake pages say "on" when you click. AwakeTab waits for the browser to actually grant the Screen Wake Lock, then shows "Screen awake".
3. Switch tabs and the browser releases the lock. The pill changes to "Paused — tab hidden" instead of pretending. Come back and it asks again.
4. I read the Chromium and WebKit source: battery saver doesn't block the web wake lock. What does: a hidden tab, a Permissions-Policy, Safari wanting a tap, Firefox at ≤ 5 % battery.
5. It won't keep Teams green. Presence follows your keyboard and mouse, and AwakeTab never fakes input.
6. For developers: the lock layer is @awaketab/wake on npm, MIT, ≤ 3.4 KB gzipped, with a real state machine. [GitHub link]
7. Free, no account, no cookies on the tool, 8 languages. Tell me where the pill was wrong for you.

### 4.6 Launch email for friends (week 6, private beta)

> **Subject:** Could you try something I built? (5 minutes)
>
> Hi {name},
>
> I've built AwakeTab, a browser tab that keeps your screen on: for 30 minutes, until a time like 11:30, or until you stop. It shows "Screen awake" only once the browser has really granted it.
>
> Could you open https://awaketab.com on whatever you use most (work laptop, phone, iPad) and use it once for something real: a recipe, a slide deck, a long download?
>
> Then just reply with:
> 1. your device and browser,
> 2. what the status at the top said,
> 3. anything that confused you or broke.
>
> That's all. Please don't post reviews or ratings anywhere. I'd rather hear it from you directly.
>
> Thank you,
> Soubhik

Rules: no HN or PH link in this email. On PH day (1 Dec) a one-line follow-up may say "we're on Product Hunt today, comments welcome", never "upvote". Friends are never asked for Chrome Web Store reviews (CWS affiliated-review rule; FTC disclosure rule).

---

## 5. Chrome Web Store and Edge: listing and ranking (ASO)

### 5.1 Fields

| Field | Current (`apps/extension`) | Proposed | Why |
|---|---|---|---|
| Name (manifest `ext.name`, ≤ 75) | "AwakeTab for Chrome" | **AwakeTab: Keep Screen Awake** (27) | The manifest name is the store title on Chrome **and** Edge; "for Chrome" is wrong on Edge and Google's branding rules want "for Google Chrome™" (positioning §11). The descriptor carries the main search phrase once. Change en.json `ext.name` and docs/10 §9 (MG-07) |
| Summary (manifest `ext.description`, ≤ 132) | "Keep your screen (or your whole computer) awake from a click — with an honest status you can trust." / listing.md has a different line that mentions schedules (Pro) | **Keep your screen or computer awake for a set time or until a clock time. The badge lights only while Chrome is holding it.** (122) | One text in both places; no Pro feature in the summary; states the difference (the badge) |
| Category | Productivity → Tools | Keep **Productivity → Tools** | Fits; "Workflow & Planning" is weaker for this intent [Opinion] |
| Language | English + 7 UI locales | Add translated store listings for es, pt-BR, de, fr, ja, zh-CN, hi **after** native review (N-10) | Locale listings rank in local stores; unreviewed text risks trust (BRD R6) |
| Edge search terms (7) | none | keep screen awake · keep screen on · prevent sleep · stay awake timer · screen timeout · no sleep · presentation mode | No competitor names in hidden terms [Opinion: avoids a policy fight over trademarked names such as Caffeine or Amphetamine] |

### 5.2 Detailed description (paste-ready; "keep screen awake" appears once, well under the 5-repeat limit)

> AwakeTab keeps your display on, or just your computer awake, while Chrome is running. It uses Chrome's own power API, so it keeps working when its tab is hidden or the window is minimised.
>
> • Screen or System: keep the display on, or keep only the computer awake and let the screen dim. The popup says exactly which.
> • Pick a length (15 minutes to 4 hours), a clock time ("until 11:30 AM"), or until you stop.
> • The toolbar badge is blank when idle and shows the minutes left, ON or SYS only while Chrome holds the request.
> • Alt+Shift+A starts or stops it from any tab.
> • Optional notification when time is up, with +30 min and Stop.
> • Remembers your session if Chrome restarts.
>
> What it doesn't do:
> • It stops when Chrome quits.
> • It can't prevent sleep when you close a laptop lid.
> • It doesn't keep Teams or Slack showing you as available. Presence follows your keyboard and mouse, and AwakeTab never simulates input.
> • There's no Firefox or Safari version: they have no power API for extensions. The web app at awaketab.com works there while its tab is visible.
>
> Optional AwakeTab Pro adds weekly schedules and auto-start on sites you choose. One key works on five devices across the web app and the extension. Everything above is free.
>
> Privacy: no account, no ads, no remote code. Anonymous usage statistics are off by default.

Check "Remembers your session if Chrome restarts" against docs/10 before pasting; drop the line if the extension doesn't restore sessions after a browser restart.

### 5.3 Screenshots (1280×800, real captures, Clear Night) and tiles

| Order | Content | Caption on the image |
|---|---|---|
| 1 | Popup, `held`, "Screen awake", badge showing minutes left | "Screen awake" only after Chrome says yes |
| 2 | Popup with presets and "Until 11:30 AM" | A time, a clock time, or until you stop |
| 3 | Screen vs System explained (popup in System: "System awake" + "Screen may dim or lock") | Keep the screen on, or just the computer |
| 4 | Options: weekly schedule, labelled **Pro** | Pro: awake on the hours you choose |
| 5 | What it doesn't do (lid, Teams, Chrome closed) | What it won't pretend to do |

Small promo tile 440×280: logo + "Keep screen awake". Marquee 1400×560: optional; Featured nominations are closed, so this is low priority. The StoreAssets board's current headline "Keeps your screen on, even with the tab hidden" is right for shot 1 if the pill line doesn't fit.

### 5.4 The honest review request (needs a docs/08 storage key first)

- **When:** in the popup, when it opens idle, after the 5th session that ended normally (completed, or stopped by the user after ≥ 5 minutes awake). Never while a session runs, never in a notification, never in the first week after install.
- **Copy:** "Is AwakeTab useful? A short review in the Chrome Web Store helps other people find it." Buttons: **Write a review** (opens the listing's review tab) · **Not now**.
- **Frequency:** "Not now" snoozes 30 days; a second "Not now" means never. Store as one local field, e.g. `reviewAsk: { shownAt, count }`, in docs/08 extension storage (MG-08).
- **No gating:** everyone sees the same ask, regardless of any in-app rating. The web app's own rating prompt never forwards happy users to the store and unhappy users to email (FTC: don't ask only customers likely to be positive).
- **Never:** incentives, reviews from friends or colleagues, replies that argue. Reply to every 1–3 star review within 3 days with a fix or an honest limit.

### 5.5 What moves ranking without breaking rules

Installs minus uninstalls over time, ratings and recency (Chrome discovery docs; market.md). So: link to the listing from the web app's paused moment (growth L5), from `/extension`, `/for/presentations`, `/for/ai-agents` and `/for/work-laptop`. Ship careful updates, because a broken release now hurts more with recent reviews weighted higher. Set `runtime.setUninstallURL` to a one-question page later (new route, docs first).

---

## 6. Partnership plays

Each play has a target, an offer, a first message and a measure. Send from support@ or Soubhik's own address, one person at a time, no mail merge that pretends to be personal.

### 6.1 Recipe sites via Embed (links, not revenue)

- **Target:** food blogs and recipe sites **without** Cook Mode: free WP Recipe Maker users, Create users, and sites on Squarespace, Wix, Webflow or Ghost (market.md §1.7; pricing-cro §5). Skip sites with WPRM Premium or Tasty Recipes, which already have Cook Mode.
- **Offer:** the free Cook Mode widget with a small "Keep awake by AwakeTab" credit line. **Do not sell the $29/yr licence yet:** pricing-cro §4 found the licence can't be delivered to a domain as built.
- **First message:**
  > Subject: A free "keep screen on" button for your recipes
  >
  > Hi {name}, I read your {recipe}. I make AwakeTab, a small free widget that adds a "Keep screen on" button to a recipe page, so readers' phones don't lock while they cook. It's one line of HTML, no tracking, and it tells the reader plainly if their browser won't allow it. It shows a small credit link to AwakeTab. Would you like the snippet? If it's not a fit, no reply needed. — Soubhik
- **Measure:** distinct embed hosts (`page_view blob6` on `/embed/cook`); target 10 hosts by day 90 [Estimate].

### 6.2 Teachers, lecturers and universities

- **Target:** teachers on school Chromebooks with forced 10-minute sleep (market.md: an abandoned Google extension, a real review from a teacher), and lecturers (Lena). Channels: teaching and learning centres, AV/IT help-desk knowledge bases, teacher newsletters, and personal contacts.
- **Offer:** `/for/presentations` and a printable one-pager "Keep the projector on until your lecture ends" (the `/until/HH-MM` link plus the floating window). A `/for/classroom` page (market.md action 13) needs a docs/00 §7 route change first.
- **First message (to an AV or learning-technology team):**
  > Hi, I make AwakeTab, a free web page that keeps a screen on until a set time ("until 11:30") without changing settings or installing anything. Lecturers use it to stop projector PCs sleeping mid-class. It doesn't simulate input, and your IT can disable it by browser policy if you'd prefer. If it would help your staff, would you consider linking it from your presentation-room guide? Happy to answer questions. — Soubhik
- **Measure:** referrals from `.edu` / `.ac.*` domains (referrer class); `/for/presentations` sessions.

### 6.3 IT admins and MSPs for Kiosk: dashboards only

- **Target:** people running wall dashboards and signage (Tomás), not IT teams that enforce lock policies (market.md §1.6: no paid enterprise keep-awake market; admins get tools to switch these off).
- **Offer:** `/kiosk` URL builder, Kiosk licence $19 per site / $49 for five, Polar invoice with tax handled. Add an honest "For IT admins" note: what it does, and how to block or force-install the extension by Chrome policy.
- **Channels:** direct email to people who ask about dashboards timing out in public help forums (answer the question first, disclose, link only when it's the answer), and the extension listing.
- **Measure:** `/kiosk` views → `pro_checkout_click{plan:biz_kiosk_*}` → orders.

### 6.4 Developer newsletters and communities for the library

| Outlet | Fit | How | Notes |
|---|---|---|---|
| Frontend Focus (Cooperpress) | High: covers browser APIs | Submission form, or reply to an issue | Pitch the myth-busting article (§8) + library |
| JavaScript Weekly (Cooperpress) | Medium | Same | Library with the state machine |
| Bytes, TLDR Web Dev | Medium | Their submission forms (check the rules on the day) | Short pitch |
| Hacker Newsletter | Only via HN | Nothing to do | Curates from HN |
| console.dev | Not eligible | — | Pre-1.0 tools only |
| Stack Overflow | High, slow | Answer existing Wake Lock questions with working code; disclose affiliation when linking the library | SO requires disclosure |

**Pitch (to newsletter editors):**

> Subject: What actually blocks a Screen Wake Lock? (we read the source)
>
> Hi {editor}, I checked the Chromium, WebKit and Firefox source for the conditions that reject `navigator.wakeLock.request()`. Battery saver isn't one of them in Chromium or WebKit, although it's widely claimed (I claimed it too). The real ones are a hidden tab, Permissions-Policy, Safari's user-gesture rule and Firefox's 5 % battery cut-off. Write-up with source links: {URL}. I also maintain `@awaketab/wake` (MIT, 3.4 KB), a wrapper that models the lock as a state machine. Thanks for reading. — Soubhik

Don't open promotional issues on other projects (for example NoSleep.js). Contribute only real fixes.

---

## 7. Community and support setup

| Piece | Set-up | Owner |
|---|---|---|
| Support mailbox | support@awaketab.com routed to Gmail (N-01 step 7); reply within 2 working days; saved replies for: refund, lost key, device limit, "it didn't stay awake" (ask for browser, OS, and what the pill said) | **OWNER STEP** |
| Bug reports | GitHub Issues with two templates: **Bug** (browser + version, OS, what the pill said, steps, expected) and **Browser behaviour change** (links to release notes). Labels: `engine`, `content`, `extension`, `embed`, `pro`, `a11y`, `i18n` | Agent (files) |
| Questions and ideas | GitHub Discussions: Q&A, Ideas (upvotes allowed there), Show and tell (embeds and kiosks) | **OWNER STEP** (toggle) |
| Public roadmap | GitHub Projects board with four columns: **Now · Next · Later · Not doing**. "Not doing" lists mouse jiggling, Teams presence and lock-policy bypass, each with a one-line reason. This is where the brand shows | Owner + agent |
| Changelog | `/changelog` stays the source (fragments in `changelog/`). Add a build-time `/changelog.xml` feed (zero JS; new route → docs/00 §7 first, MG-10). Monthly summary post | Agent |
| Feedback loop | Monday 30-minute review (docs/18 §8) adds: new issues, rating texts, support emails, store reviews → tag → roadmap → reply to the reporter when shipped → changelog line (credit by name only with permission) | Owner |
| In-product | Existing rating prompt (after the 5th session, never mid-session). Fix growth F5 so ∞ users are counted | Agent |
| Status | Uptime alerts (N-16). Incidents get a changelog line the same day | Owner |

---

## 8. PR angle: "the tab that tells the truth"

**Core line for press:** AwakeTab is the keep-awake tab that tells the truth. It says "Screen awake" only when the browser has granted the lock, says "Paused — tab hidden" when it lets go, and refuses to fake keyboard activity to keep you "green". (For product surfaces, use the tagline "Keeps your screen awake. Says so only when it is.", per positioning.)

**Three stories, strongest first:**

1. **Myth-busting with evidence.** "Battery saver doesn't block your browser's wake lock. We read the source." Chromium and WebKit have no battery-saver check; Firefox refuses at ≤ 5 % battery unplugged; iPhone Low Power Mode shortens Auto-Lock to 30 seconds, which is a different mechanism (fact-check, with source links). Useful to How-To Geek, Lifehacker, MakeUseOf-type sites and Frontend Focus. The article is the rewritten `/learn/low-power-mode-and-wake-locks`.
2. **The refusal.** The loudest demand in this category is "keep me green on Teams"; some tools sell a "stealth" key for it. AwakeTab won't, because presence follows input and faking it has cost people their jobs (Wells Fargo, 2024, per Banking Dive and CBS, via market.md). Pitch to remote-work and workplace writers. Keep it about the choice, not about competitors.
3. **The indie build.** A solo developer in India, 8 languages, no accounts, no cookies, tested on real devices, with the results and dates published. For Indian startup and developer media, after launch.

**Who to pitch (types, not invented names):** writers of existing "how to keep your screen on" and "best keep-awake apps" articles (ask to be considered in the next update, with the evidence page), browser-API newsletter editors, workplace/remote-work reporters. Find the actual people by hand (OWNER STEP): the byline of each ranking article for the tracked queries in docs/18 §5.

**Press kit** (a section on `/about`, no new route): one-paragraph description, the logo (SVG), 4 real screenshots, the evidence page, contact. No quotes from users unless real and permitted.

**Pitch email (story 1):**

> Subject: Battery saver doesn't block your browser's wake lock (source links inside)
>
> Hi {name}, your piece "{title}" says {claim}. I checked the Chromium and WebKit source and found no battery-saver check in the Screen Wake Lock code. The real reasons a page can't keep your screen on are a hidden tab, a site policy, Safari's tap requirement, and Firefox's 5 % battery cut-off. I've published the evidence with links and test dates: {URL}. I make AwakeTab, a free keep-awake tab, so I have an interest, but the source links stand on their own. Happy to help if you update the article. — Soubhik

Timing: after the device matrix is published (W4) and after launch (W9–W11), so there is a live product and evidence to point to.

---

## 9. Budget (90 days, free first)

Exchange rate assumed ₹88 = $1 [Estimate; check the rate on the day]. Domain prices: .com $10.44 and .dev ≈ $12 at Cloudflare [Fact, secondary]; .app and .page [Estimate].

| Item | $ | ₹ | Needed? | Free alternative |
|---|---|---|---|---|
| Domains: .com, .app, .page, .dev (1 year) | ≈ 47 | ≈ 4,100 | **Yes** (B1) | Only .com is essential; the others protect the brand |
| Chrome Web Store developer fee (one-time) | 5 | 440 | **Yes** | — |
| Edge Add-ons, Product Hunt, HN, AlternativeTo, GitHub, npm | 0 | 0 | Yes | — |
| Workers Paid, launch month plus 2 | 15 | 1,320 | **Yes** (launch-day capacity) | Stay on free and risk Error 1027 on Functions |
| Email routing, uptime (Cloudflare / UptimeRobot free) | 0 | 0 | Yes | — |
| Screen recording, gallery images | 0 | 0 | Yes | macOS recording, the canvas boards |
| **Launch cash total** | **≈ 67** | **≈ 5,900** | | |
| CA: GST registration + LUT (BRD §9.1) | ≈ 90–230 | 8,000–20,000 | **Yes before the first production sale** | None; this is a legal step |
| Trademark filing, IP India class 9 or 42 (BRD) | ≈ 51 per class | ≈ 4,500 per class | Optional in 90 days | Screen only (free) |
| Native-speaker review, 7 locales (BRD) | 300–800 | 26,000–70,000 | After launch | English-only launch; keep translations `noindex` |
| Newsletter sponsorship | ask for the rate card | — | **No** in 90 days | Editorial submission (free) |
| Paid social / search ads | 0 | 0 | **No** (BR-04: no paid acquisition) | — |

Rule for any later paid test [Opinion]: only after 4 weeks of baseline data, capped at $100, one channel at a time, with the `ref` field recording it and a stop rule of "no Pro orders from 1,000 paid visits".

---

## 10. Measurement: the weekly dashboard

Runs every Monday (docs/18 §8), written to `docs/metrics/YYYY-MM.md`. Targets marked [Estimate] are starting guesses to replace after 4 weeks.

| Area | KPI | Source (docs/18) | Day-90 target |
|---|---|---|---|
| North star | Weekly awake-hours | `session_end` SQL (§4) | Rising 4 weeks in a row [Estimate] |
| Reliability (fix first if red) | Autostart success | `lock_state` / `session_start` | ≥ 95 % |
| | Lost + denied share of session ends | `session_end.blob6` | ≤ 5 % |
| | `lock_denied` by UA class | `lock_denied.blob3` | watch after each browser release |
| Acquisition | GSC impressions, clicks, CTR for the 25 tracked queries | GSC | baseline, then growth |
| | Indexed pages | GSC coverage | ≈ 20 at launch (12 rewritten + hubs + product pages), rising as rewrites ship [Estimate] |
| | Referring domains | GSC links | ≥ 20 (BRD O4) |
| | Brand searches "awaketab" | GSC | visible |
| | **Visits by channel** (`hn`, `ph`, `reddit`, `newsletter`, `search`, `other`) | **new** `page_view.ref` + referrer class | reported for each launch |
| Activation | Session start rate on tool routes | `session_start` ÷ `page_view` | baseline |
| Retention | Returning share (`page_view.visit`, growth §5.2) | **new** field | ≥ 20 % |
| Install | PWA installs; extension weekly users, installs, uninstalls, rating | `pwa_install`; CWS and Edge dashboards (OWNER STEP) | uninstall ÷ install falling |
| Developers | npm weekly downloads; GitHub stars | npm, GitHub | stars trending to 200 by day 180 (BRD O7) |
| Money | `pro_view` → `pro_checkout_click` → `pro_activated`; orders; refund rate; lifetime vs yearly share | AE + Polar | ≥ 0.1 % of uniques; refunds ≤ 3 % |
| Business | Embed hosts; `/kiosk` → Kiosk orders | AE + Polar | 10 hosts [Estimate] |
| Trust | Rating distribution (public average only at ≥ 25); support emails per 1,000 sessions | AE + inbox | average ≥ 4.5 |
| Launch-specific | HN points and comments, PH position, Reddit comments, top 5 objections, fixes shipped | manual | written up in `launch-day.md` |

**Gaps to close before launch (B6):** production AE binding; the `/pro` telemetry opt-out bug; channel attribution (`ref` + referrer class, docs/00 §10, docs/18 §3 and `/privacy` first); the `visit` bucket (growth §5.2, Owner decision O-07). The extension keeps telemetry off by default, so its numbers come from the store dashboards.

**Decision rules:** autostart < 90 % for 3 h → fix before any marketing that day. Denied share > 5 % → check the advice mapping before the next post. Pro < 0.05 % of uniques after 60 days of production checkout → the BRD R5 levers. A channel sending < 1 % of its visits into a session start → stop working it.

---

## 11. Risks and mitigations

| # | Risk | Likelihood / impact [Opinion] | Mitigation |
|---|---|---|---|
| R1 | Someone registers awaketab.com first (the plan is public and indexed) | Medium / High | Register today (B1); NeverDim is the BRD fallback name |
| R2 | HN readers find a false claim or templated pages and the thread turns on trust | High if unfixed / High | Launch gate B2, B3; the prepared replies; admit errors fast and fix them live |
| R3 | "This bypasses security locks" dominates the thread | Medium / Medium | Prepared reply; `/guides/lock-screen-vs-sleep`; never market it as a policy bypass; the IT admin note |
| R4 | Extension review delay or rejection (broad optional host permission `https://*/*`) | Medium / Medium | Submit in W1; clear justifications (listing.md); if it's still pending at launch, say "coming to the Chrome Web Store" and keep store links as search pages |
| R5 | Launch-day load hits the Functions limit (100k requests/day free) | Low–Medium / Medium | Workers Paid from W7; the tool degrades gracefully if `/api/e` fails (beacon only) |
| R6 | Checkout goes live with features that aren't built, or an Embed licence that can't be delivered | Medium / High (refunds, trust) | MG-03; pricing-cro §4 ship order; real-card test before launch |
| R7 | Voting-ring detection flags the HN post because friends saw the link | Low / High | Friends email has no HN link; no one is told the post time |
| R8 | Redesign build slips and drags the launch | High / Medium | Front-door-only gate (MG-01); slip rule to 12 Jan 2027 |
| R9 | Solo capacity: launch day plus support plus fixes | High / Medium | HN and PH on separate weeks; saved replies; nothing else planned in W8 |
| R10 | Teams-green visitors rate the product low | High / Medium | Answer in the first 100 words of the Teams page; rating prompt only after 5 real sessions (market.md) |
| R11 | Launch price confusion (build-time price vs Polar, time zone) | Medium / Medium | pricing-cro §1.4 fixes; a scheduled rebuild on the end date; one fixed end date, never extended (MG-04) |
| R12 | A browser change breaks the lock mid-campaign | Low–Medium / High | Alerts (docs/18 §11); support matrix refreshed on each release; pause outreach while red |
| R13 | Tax non-compliance at the first sale | Low / High | GST + LUT before production checkout (BRD R12) |

---

## 12. Prioritised actions

Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week. Impact on a successful launch: H / M / L.

| # | Action | Why | Effort | Impact | Owner / where |
|---|---|---|---|---|---|
| 1 | Register awaketab.com, .app, .page, .dev; auto-renew; 2FA | Unregistered today; public plan | S | H | **OWNER STEP**, Cloudflare Registrar |
| 2 | Claim GitHub org, npm org, X, Bluesky, PH, Buy Me a Coffee; transfer the repo | README and /about links 404 today | S | H | **OWNER STEP** |
| 3 | Remove every battery-saver / Low Power "blocks" claim and the other false proof claims | fact-check; positioning §9; live today | S | H | Agent: `apps/web/src/content/**`, en.json `tool.advice`, `support-matrix.json`, `packages/wake/README.md` |
| 4 | Submit the extension to Chrome and Edge in W1 | Review time; B5 | S | H | **OWNER STEP**; `apps/extension/store/listing.md` |
| 5 | Production Cloudflare bindings, secrets, email routing, GSC, uptime | B1, B6, B8 | M | H | **OWNER STEP**; LAUNCH-AUDIT N-01, N-07, N-16 |
| 6 | Publish `@awaketab/wake` 1.0.0 with provenance | Library is the HN substance | S | H | **OWNER STEP** N-06 |
| 7 | Rewrite the 12 launch articles; `noindex` the other 39 | editorial audit; scaled-content risk | L | H | Agent; `apps/web/src/content/**`, docs/06 |
| 8 | Add `page_view.ref` + referrer class; fix `/pro` telemetry opt-out | No channel attribution; privacy bug | S | H | Agent after docs/00 §10, docs/18 §3, `/privacy` |
| 9 | Remove unbuilt Pro features from all copy; dated launch price; decide Pro at launch | growth F2, F12; B4 | S | H | Agent + owner (MG-03, MG-04) |
| 10 | Build the front-door redesign (tool, home above the fold, /pro, /extension, OG) | B7; the gallery must match the product | L | H | Agent; STATUS rows 1, 11, 14, 23, 35 |
| 11 | Run the device matrix; publish how-we-tested | B9; PR story needs evidence | M | H | **OWNER STEP** N-11 |
| 12 | Manifest name and summary change; listing rewrite (§5) | Store ranking; Edge name | S | M | Agent after docs/10 §9 (MG-07) |
| 13 | Workers Paid from W7 | Launch-day capacity | S | M | **OWNER STEP** |
| 14 | Issue templates, Discussions, roadmap board with "Not doing" | Feedback loop and trust | S | M | Agent + **OWNER STEP** (toggle) |
| 15 | Private beta email to 20–40 people (W6) | Catch the embarrassing bugs before HN | S | H | Owner |
| 16 | Show HN on 17 Nov with the first comment and prepared replies | Main launch | S | H | **OWNER STEP** |
| 17 | Reddit posts (r/SideProject, r/webdev Showoff Saturday, r/chrome_extensions) | Only the subreddits whose rules allow it | S | M | **OWNER STEP** |
| 18 | Product Hunt on 1 Dec with the gallery in §4.2 | Second wave | M | M | **OWNER STEP** |
| 19 | AlternativeTo and free directories | Evergreen referrals | S | M | **OWNER STEP** |
| 20 | Myth-busting article + newsletter pitches | Links and developer reach | M | M | Agent (article) + owner (pitches) |
| 21 | Partnership outreach: 10 recipe sites, 10 teacher/AV contacts, 5 newsletters | Links and Kiosk leads | M | M | Owner |
| 22 | Extension review ask (§5.4) | Store ranking, honestly | S | M | Agent after docs/08 (MG-08) |
| 23 | Changelog feed | Retention of developers and press | S | L | Agent after docs/00 §7 (MG-10) |
| 24 | GST/LUT with the CA before the first production sale | BRD R12 | M | H (legal) | **OWNER STEP** |

---

## Owner decisions

IDs are prefixed MG- to avoid clashing with other files. The lead copies these into DECISIONS.md.

| # | Question | Recommendation | Why |
|---|---|---|---|
| MG-01 | Which redesign surfaces must be built before the public launch? | Tool (all states), home above the fold, /pro, /extension, OG images. Everything else after launch | Launch visitors see these; waiting for all 26 surfaces risks the date |
| MG-02 | `noindex` the 39 articles not rewritten by launch? | Yes; lift each one when rewritten. Accept that AdSense (G1, "60 pages indexed") comes later | 84–90 % duplicate template on a new domain; ads are the smallest revenue line |
| MG-03 | Is production Pro checkout live at Show HN? | Yes, **only if** the unbuilt features are removed from copy, the real-card test and refund pass, and GST/LUT is done. Otherwise hide Pro links for launch week and switch them on for PH. Embed licence not sold until delivery works | HN readers are the best lifetime buyers, but a broken or dishonest checkout costs more |
| MG-04 | Launch-price end date | Set it **once, before the first real sale**: production checkout date + 90 days (e.g. 17 Nov → 15 Feb 2027), and never extend it. market.md recommends holding 8 Dec 2026 exactly; that is also fair if production checkout is live by early November | Nobody has been offered $19 for real yet (sandbox, `noindex`); a 3-week window contradicts the BRD's 90 days. Extending after launch would be fake scarcity |
| MG-05 | Show HN and Product Hunt on separate weeks (17 Nov and 1 Dec)? | Yes | Solo capacity; the chance to fix HN objections before PH; avoids Diwali, the US election and Thanksgiving |
| MG-06 | Repository licence and home | Move the repo to the `awaketab` GitHub org. Add a root `LICENSE`: MIT for the whole repo (HN goodwill; Pro stays enforced server-side by signed tokens) or state clearly that only `packages/wake` is open source | Public repo with no root licence means "all rights reserved"; HN will ask |
| MG-07 | Extension name "AwakeTab: Keep Screen Awake" and the new summary | Yes; update en.json `ext.name` / `ext.description`, all locales and docs/10 §9 | The name shows on Edge too; one summary everywhere |
| MG-08 | Add a store review ask to the extension (§5.4) | Yes, with a new docs/08 storage field and no gating | The only honest way to earn ratings, which drive ranking |
| MG-09 | Workers Paid ($5/month) from week 7 | Yes | Launch-day headroom for `/api/*` |
| MG-10 | `/changelog.xml` feed | Yes, build-time, zero JS; add the route to docs/00 §7 | A cheap way for developers and press to follow the changelog |
| MG-11 | Public roadmap on GitHub Projects with a "Not doing" column | Yes | Makes the refusals (no jiggling, no Teams green) visible |
| MG-12 | Skip r/InternetIsBeautiful, r/productivity, r/sysadmin and r/msp | Yes | Their rules exclude us, or the message is wrong for them |
| MG-13 | 90-day cash cap | ≈ $67 plus the CA fee; no paid acquisition | BR-04, BR-17 |
| MG-14 | Slip rule | If the §2.3 gate isn't green on 10 Nov, launch on 12 Jan 2027, not in December | Holiday traffic; a weak launch can't be repeated |

---

## 13. Sources (accessed 26–27 September 2026)

External:
- Hacker News, Show HN rules: https://news.ycombinator.com/showhn.html
- Hacker News guidelines: https://news.ycombinator.com/newsguidelines.html
- nosleep.page Show HN (22 Apr 2022, 252 points, 130 comments): https://news.ycombinator.com/item?id=31123522 (via the HN Algolia API)
- Product Hunt launch guide: https://www.producthunt.com/launch
- LaunchList Product Hunt checklist (tagline under 60, gallery 1270×760, thumbnail 240×240, 12:01 am PT): https://getlaunchlist.com/checklists/producthunt
- Product Hunt field limits (tagline 60, description 260), secondary: https://help.producthunt.com/en/articles/479557-how-to-post-a-product
- Chrome Web Store, Discovery: https://developer.chrome.com/docs/webstore/discovery
- Chrome Web Store, Spam and abuse policy: https://developer.chrome.com/docs/webstore/program-policies/spam-and-abuse
- Chrome Web Store, Program policies (manipulation; affiliated ratings): https://developer.chrome.com/docs/webstore/program-policies/policies
- Chrome Web Store, listing images: https://developer.chrome.com/docs/webstore/cws-dashboard-listing
- Extension name 75-character limit (Chromium extensions group PSA): https://groups.google.com/a/chromium.org/g/chromium-extensions/c/mpDvFpT0KJM/m/WWFFQZFyAAAJ
- Keyword spam ≤ 5 repeats (Spam policy FAQ): https://developer.chrome.com/docs/webstore/spam-faq/
- CWS review updates, Featured retired (via market.md): https://developer.chrome.com/blog/cws-review-updates-2026
- FTC, Soliciting and Paying for Online Reviews: A Guide for Marketers: https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers
- r/webdev, r/SideProject, r/InternetIsBeautiful rule summaries (secondary; Reddit blocks fetching): https://rankhog.com/subreddits/webdev · https://rankhog.com/subreddits/sideproject · https://rankhog.com/subreddits/internetisbeautiful
- console.dev selection criteria: https://console.dev/selection-criteria
- AlternativeTo submission (secondary): https://buttondown.com/where-to-post/archive/submitting-on-alternativetonet/
- Cooperpress publications: https://cooperpress.com/publications/
- Cloudflare Workers limits (100,000 requests/day free; Error 1027): https://developers.cloudflare.com/workers/platform/limits
- Cloudflare Pages pricing summary (Workers Paid $5/month), secondary: https://dev.to/nayankyada/cloudflare-pages-pricing-2026-free-tier-limits-workers-costs-when-to-upgrade-2ono
- Cloudflare Registrar .com $10.44, secondary: https://startupowl.com/reviews/cloudflare-registrar
- Diwali 2026 dates (6–10 Nov; Lakshmi Puja 8 Nov): https://www.bda.ai/festival/diwali/2026
- Wells Fargo firings (via market.md): https://www.bankingdive.com/news/wells-fires-employees-faking-productivity-finra/719033/
- Google spam policies, scaled content abuse: https://developers.google.com/search/docs/essentials/spam-policies

Checks run for this file (26 Sep 2026, 17:28 UTC):
- `whois -h whois.verisign-grs.com awaketab.com` → "No match".
- `https://pubapi.registry.google/rdap/domain/awaketab.{app,page,dev}` → 404 "not found".
- `dig +short awaketab.com` → empty.
- `https://api.github.com/users/awaketab` → 404. `https://registry.npmjs.org/@awaketab%2fwake` → "Not found".
- `https://buymeacoffee.com/awaketab` → 404. `https://x.com/awaketab` → 404 (unverified: X may block scripted requests). Bluesky `awaketab.bsky.social` → unresolved.
- `https://awaketab.pages.dev/api/health` → `{"ok":true,"version":"f95c07bef22b","polar":"sandbox"}`; `x-robots-tag: noindex` on the preview.
- `https://awaketab.pages.dev/for/cooking` contains "battery saver is blocking the wake lock".
- `/extension` store links → `chromewebstore.google.com/search/AwakeTab` and `microsoftedge.microsoft.com/addons/search/AwakeTab` (placeholders).

Repo (read 26–27 Sep 2026): `docs/redesign/{README,DECISIONS,STATUS}.md`, `PRODUCT.md`, `docs/01-brd.md` §2–§4, §9–§11, `docs/00-conventions.md` §7, §8.3, `docs/17-launch-checklist.md`, `docs/18-analytics-kpis.md`, `docs/LAUNCH-AUDIT.md` (§3–§5, Fails, Needs Soubhik, Owner decisions), `docs/research/{market,growth-conversion,fact-check-2026-09-26,editorial-audit-articles,canvas-copy-audit,marketing-positioning,marketing-pricing-cro}.md`, `apps/extension/store/listing.md`, `apps/extension/wxt.config.ts`, `apps/web/src/i18n/en.json` (`ext.*`, `rating.*`), `apps/web/src/tool/{params,extras}.ts`, `apps/web/src/lib/analytics.ts`, `apps/web/src/pages/about.astro`, `packages/wake/{README.md,package.json,LICENSE}`, canvas boards `StoreAssets`, `StoreShot1–5`, `GrowthShare*`.
