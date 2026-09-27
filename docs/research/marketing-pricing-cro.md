# Pricing, packaging and conversion copy audit

Status: research input, not a spec · 26 September 2026, updated 27 September 2026 to build on market.md · Author: Director of Pricing & Monetisation / senior conversion copywriter (marketing wave 5) · Owner: Soubhik

Scope: what is sold (Free, Pro, Embed, Kiosk), at what price and how it is presented, the `/pro` page as a sales page, checkout and post-purchase, in-product upgrade moments, B2B landing copy for Embed and Kiosk, and revenue scenarios. This builds on [growth-conversion.md](growth-conversion.md) (funnels, levers, experiments, measurement) and [market.md](market.md) (competitors, benchmarks, willingness to pay). Where those files already settled something, I cite them as "growth §x" or "market §x" and do not repeat the argument. I agree with market.md's core pricing call: keep $12/yr and $29 lifetime, and expect lifetime to carry Pro revenue (market §3.4).

Evidence labels: **[Fact]** verified in the repo (file named) or an external source (§6, URL and access date) · **[Estimate]** my number, inputs shown · **[Opinion]** judgement, argued.

Copy rules applied to every string I propose: no em dashes in new copy (agent-brief), web pages keep the *screen* on (never "the computer"), no testing claims we cannot back, pill strings untouched, plan buttons "Get yearly Pro" / "Get lifetime Pro" (copy audit), UK spelling as in the repo.

---

## Summary for the owner

1. **Pro is a grab-bag today; sell it as three jobs.** *Show* (your message, extra lamp colours), *Automate* (schedules and auto-start in AwakeTab for Chrome), *Remember* (12 weeks of history, CSV). Everything else either moves, gets built, or stops being sold (§1.3).
2. **Three things in Pro are not worth money as sold.** Web `schedules` and `sounds.custom` are not built (growth F2). `pip.pro` only opens the floating window taller, which the user can already do by dragging it. `ads.free` removes ads that do not exist yet (ads are "not yet active" per `/privacy`). Stop headlining all four.
3. **Pro cannibalises Kiosk.** Pro includes `ambient.logo` and `ambient.message`. That means $19 lifetime Pro gives Tomás a logo and a message on 5 screens, while the Kiosk licence costs $49 for 5 sites. Move the logo to Kiosk only (§1.2 K1).
4. **The Embed licence cannot be delivered as built.** Nothing in `/pro/activate` collects a domain. The only code that writes `embed:{domain}` reads `data.metadata.domain` in a webhook branch that needs a key-bearing payload, and docs/09 §2.7.1 says production never sends one. Brand colour cannot be set anywhere. Do not take Embed money until a sandbox purchase ends with a licensed domain (§1.9 C6).
5. **Recipe bloggers on WordPress already have Cook Mode.** WP Recipe Maker Premium ($49/yr) and Tasty Recipes include it [Fact]. Sell Embed to sites *without* those plugins (Squarespace, Wix, Webflow, Ghost, free-tier WPRM, docs sites), and give the licence one real benefit beyond removing the credit: a monthly count of how many readers used it (§1.8).
6. **Keep $12/year and lifetime, lifetime first. Fix three launch-price details.** (a) `/pro` works out the $19-or-$29 price at build time (`lifetimePrice()` in the page frontmatter), so after 8 December the page keeps saying $19 until someone redeploys, while Polar charges $29. Schedule a rebuild. (b) `PRO_LAUNCH_END` is midnight UTC, so in the Americas "until 8 December" really ends on the evening of 7 December. Move the cut-off to the end of 8 December everywhere, so the stated date is true in every time zone. (c) Keep the 8 December date fixed (market §3.4) and drop the BRD's "first 90 days" wording, even if production checkout opens late (§1.4). With about 72% of annual subscribers cancelling in year one (RevenueCat 2026, via market §3.2), the yearly plan is an entry point, not an income stream.
7. **Regional pricing is now native in Polar, with no third-party script.** Polar shipped multi-currency product prices (Feb 2026), per-currency fixed discounts (Mar 2026) and 80+ more presentment currencies (Apr 2026) [Fact]. Seven of our eight locales are outside the US, and the nearest web rival's traffic is estimated at 45% India (screenawake.com, HypeStat, low reliability, via market §1.1). Set INR and BRL prices at about 40–50% of USD and keep parity elsewhere (§1.5). Reject the PPP banner services: they need a third-party script on `/pro`.
8. **No student discount; no team pack at launch.** Teachers are a real and under-served segment (market summary 5), and they already pay about $36/yr for Classroomscreen, so $12 needs no discount. Verifying students means sharing data with a vendor. The free tier already covers a lecturer's core job, and regional prices handle affordability. Polar's seat-based pricing now works for one-time purchases [Fact], so a "Pro for teams" pack is buildable later. Wait for three real requests first. Priya's IT deliberately enforces the 5-minute lock, and we should not market around a security control (§1.6, §1.7).
9. **Post-purchase is the weakest step.** After a successful activation, `/pro/activate` jumps straight to `/`: no "Pro is on" message, no list of what unlocked, no key shown, no step for the extension. The device label is the first 40 characters of the user-agent string, which is unreadable in Manage devices. There is also no "lifetime means…" promise, even though lifetime tokens expire offline after 90 days without our server (§1.9).
10. **Upgrade moments: I agree with growth §4.2 with one correction.** The Pro card that appears when the 60-second Message preview *ends* would sit on the awake screen during a live session, and D-R15 forbids that. Make the offer when the user *picks* Message, and end the preview with a neutral line (§1.10). Exact microcopy for every allowed surface is in §2.2.
11. **Revenue [Estimate]: at month 12, Pro + Business ≈ $470 / $2,620 / $10,550 net per month** (conservative / base / optimistic), using docs/09 traffic, 0.05 / 0.15 / 0.30% order conversion and Polar's current fees. The base case is about $32 net per 1,000 monthly uniques. Traffic dominates everything; the price choices here move revenue by ±20% at most (§3).
12. **Ship order:** fix the Embed delivery and the build-time price → strip unbuilt features from all copy → ship the `/pro` copy in §2.1 → post-purchase success state → regional prices → Embed "readers helped" report (§4).

---

## Scorecard (0–10)

| Area | Score | One-line reason |
|---|---|---|
| Free tier (generosity, clarity) | 8 | Everything a user needs to keep the screen on is free, and the board's "What stays free" list says so plainly. It loses points only because docs/00 §8.2 and the board disagree on which modes are free (O-02) |
| Pro packaging coherence | 4 | Two unbuilt features, one near-worthless (`pip.pro`), one that removes ads that don't exist yet, and a logo gate that undercuts Kiosk |
| Price points | 7 | $12/yr and $29 lifetime sit sensibly between free rivals and web-app peers. USD-only undercuts 7 of 8 locales |
| Price presentation (live `/pro`) | 2 | Two price cards with a fake strike-through, no features, no "what stays free", and the launch price is frozen at build time |
| Price presentation (redesign board) | 6 | Right structure, but it still renders `<s>$29</s>` and "was $29", sells an end sound we don't have, and has an ambiguous end date |
| Checkout (Polar) | 6 | Hosted MoR checkout: tax handled, no account, local currency possible. No domain field for Embed; auto-renew terms are not stated beside the yearly button |
| Post-purchase and activation | 3 | Auto-activation works, then silently redirects. Unreadable device labels. Extension hand-off is copy-paste with no guidance at the moment of purchase |
| In-product upgrade moments | 5 | Restrained, with no nagging. But the sheet sells "schedules" and quotes only the yearly price, links carry no `ref`, and the preview-end card conflicts with D-R15 |
| Embed offer | 3 | Good page and widget. Thin paid value, delivery path unverified, competing with Cook Mode already bundled in recipe plugins |
| Kiosk offer | 6 | Clear builder and honest limits. "Site" is undefined, the logo is also in Pro, and there is no invoice line |
| Regional, education, team | 2 | USD only, no education policy, no route for anyone buying for a team |
| Monetisation measurement | 4 | Growth §5 covers it. `ref` is not wired and `/pro` ignores the telemetry opt-out (growth F3, F4) |

---

## 1. Detailed audit

### 1.1 What is on sale today, gate by gate

| Gate | Sold where (copy) | Built? | Who actually wants it | Verdict |
|---|---|---|---|---|
| `ambient.message` | Board "At the lectern"; `ambient.message.pro` | Yes (web), `MODE_GATES` in `ambient/logic.ts` | Lena (breaks), Tomás | **Keep in Pro.** Pro's hero feature |
| `ambient.packs` | `pro.card` "ambient packs"; Settings "Teal and Rose are part of the Pro palette pack" | Yes, but it gates only lamp colours; no mode is gated by it | Everyone a little | **Keep, rename.** "Ambient packs" suggests modes. Call it "Extra lamp colours" (mint and sky, O-01) |
| `stats.history`, `stats.export` | Board "Overnight builds"; `stats.heatmap.pro` | Yes (`stats/panel.ts`) | Kenji, Lena | **Keep in Pro** (*Remember*) |
| `ext.schedules`, `ext.autostart` | `page.extension.features.pro`, board | Yes (`apps/extension/src/controller.ts`) | Tomás, Lena, Kenji | **Keep in Pro** (*Automate*). This is Pro's most valuable job. Caveat: the extension is not in the stores yet (store links are search placeholders, growth F8) |
| `schedules` (web) | `pro.card`, `page.pro.description` "schedules" | **No** (no `hasFeature` call) | Priya, in theory | **Remove from Pro for good** [Opinion]. A web schedule only runs while a visible tab is open, so it is just a delayed start. The real schedule lives in the extension. Retire the gate ID in docs/00 §8.2 |
| `sounds.custom` | Board "In the kitchen: Your own end sound"; docs/09 §2.9 extend line | **No** (Settings offers Chime / None) | Marco, Lena | **Build small or remove.** A set of 3–4 bundled end sounds plus volume is a day or two of work and cheap in bytes if lazy-loaded. Uploading your own file needs IndexedDB and a storage-contract change: not now. Until built, remove it from all copy |
| `pip.pro` | Board "floating window … gets taller with Pro" | Yes: `PIP_PRO_SIZE` vs `PIP_SIZE` in `tool/pip.ts`, initial size only | Nobody would pay for this | **Stop selling it.** Users can drag-resize the window (verify on Chrome). Either give everyone the taller size, or redefine the gate as "Message mode in the floating window" (docs/00 §8.2 already says "PiP with ambient modes") |
| `ambient.logo` | Board "On the wall: Your logo" | Yes (`embed/kiosk.ts`, `logo=`) | Tomás (business) | **Move to Kiosk only** (K1 below) |
| `ads.free` | Board "On a work laptop: No ads on the guides" | Yes (content layout skips ads) | Nobody yet: ads are not live (`/privacy#ads` "not yet active", G1 not reached) | **Keep the gate; do not headline it.** One line in the plan list: "No ads on the guides, if we ever show them." Drop the Priya section. After growth §4.6 (sponsor card removed from the awake screen) this is the only meaning of `ads.free` |
| `embed.noattrib` | `/embed` | Server side partly; see §1.9 C6 | Bloggers | **Keep, add a real benefit** (§1.8) |
| `kiosk.branding` | `/kiosk` | Yes | Tomás | **Keep** |

Code nit [Fact]: `apps/web/src/lib/license.ts` gives `biz_embed_site_yearly` `['embed.noattrib', 'ads.free']`, while docs/09 §2.9 lists only `embed.noattrib`. A blogger's licence silently removes ads on awaketab.com guides for whoever activated it. That is harmless, but make the code and the doc agree.

### 1.2 Packaging problems, in order of harm

| # | Problem | Evidence | Fix |
|---|---|---|---|
| K1 | **Pro undercuts Kiosk.** Pro includes `ambient.logo` and `ambient.message` on 5 activations. The Kiosk licence sells logo, message, no wordmark and no prompts at $19 per site / $49 for 5 | `PLAN_FEATURES` in `license.ts`; `/kiosk` "With a Kiosk licence" list | Take `ambient.logo` out of `pro_yearly`/`pro_lifetime`. Pro keeps Message (a personal use: "Back at 11:30"). Logo, no wordmark and no prompts stay business-only. Say it on `/pro`: "Running screens for a business? The Kiosk licence adds your logo and removes AwakeTab's branding." Needs docs/00 §8.2 and docs/09 §2.9 updates |
| K2 | **Selling unbuilt features** (`schedules`, `sounds.custom`) | growth F2 | Remove from `pro.card`, `page.pro.description`, the board and docs/09 §2.9 now (O-05) |
| K3 | **Selling a non-feature** (`pip.pro` taller window) | `tool/pip.ts` | Stop selling it (above) |
| K4 | **The extension, Pro's strongest reason to buy, may not be live** when production checkout opens | `lib/extension.ts` store URLs are search placeholders | If the listing is not approved by Pro launch, say "Schedules and auto-start in AwakeTab for Chrome (in store review; your key works the day it's listed)". Never sell it as available before it is |
| K5 | **Free-mode canon disagrees.** docs/00 §8.2: "standard + clock + minimal ambient" free; board: six modes free; code: only Message gated | docs/00 §8.2, `MODE_GATES`, board | Make docs/00 match the code: all modes free except Message (O-02). Cook must stay free (Marco, Embed parity); Night drives `/for/night-clock` |
| K6 | **The Pro sheet quotes only the yearly price** ("$12/year") and names a feature we don't have | `pro.card` | New sheet copy, §2.2 |

### 1.3 Proposed packaging

| | **Free** | **Pro** ($12/yr or $29 once; $19 launch) | **Kiosk** ($19 one site · $49 five sites, once) | **Embed** ($29/yr per site) |
|---|---|---|---|---|
| Keeping the screen on | Every length, until a time, custom up to 7 days, restore, honest pill, video fallback, PWA, offline, 8 languages | Same (never gated) | Same | Same widget for readers |
| Faces and modes | Four faces; Standard, Clock, Focus, Minimal, Night, Cook | + **Message** mode | + Message, permanently, from the URL | Cook mode + kitchen timers (free for everyone) |
| Colour | Aqua, violet | + mint, sky | Theme from URL | + your brand colour |
| History | 7 days on screen (365 days kept on device) | 12 weeks + CSV | — | Monthly "readers helped" count (to build, §1.8) |
| Extension | Screen/System level, timers, badge, shortcut | + weekly schedules, auto-start on Chrome launch or per site | — | — |
| Branding | AwakeTab wordmark | Same | **Your logo, no wordmark, no rating or upgrade prompts** | Credit link removed |
| Terms | — | 5 activations, personal or work use | 1 or 5 sites (§1.8 definition), commercial display, 365-day offline token | 1 registrable domain + subdomains |

**The Pro story in one line** [Opinion]: "Pro is for a screen you set up again and again: show your own words, let Chrome start it for you, and see what really ran." Three pillars, each owned by a persona: *Show* (Lena), *Automate* (Tomás personally, Kenji), *Remember* (Kenji). Nothing in Pro changes whether the screen stays awake, and the page says that before any price.

### 1.4 Price points and presentation

**Benchmarks.** market §3.1 has the full table: free desktop rivals; Lungo, Theine and Magnet at $4–9 one-time; BetterTouchTool $25 lifetime; Classroomscreen $36/yr; RevenueCat's utilities median of $34.99/yr. The rows below are the ones this audit adds or leans on:

| Product | Model | Price | Relevance | Source |
|---|---|---|---|---|
| Pomofocus Premium (web timer) | monthly / yearly / lifetime | $3 / $18 / $54 | Closest "web utility with Pro": lifetime = 3× yearly | secondary (§6) |
| WP Recipe Maker | yearly, per site | Premium $49, Pro $99, Elite $149; Cook Mode in all | Anchor for Embed | bootstrapped.ventures |
| Tasty Recipes | yearly, per site | $49 first year, renews at $99; Cook Mode in all plans | Anchor for Embed | wptasty.com |
| Fully Kiosk Browser PLUS (Android) | one-time, per device | €8.90 / $10.99 + tax; volume licences from 10 devices | Anchor for Kiosk | fully-kiosk.com |
| Kiosk Pro (iPad) | one-time, per device | Basic $24.99, Plus $49.99, Enterprise $99.99; Lite $5/mo | Anchor for Kiosk | kioskgroup.com |
| Yodeck (signage) | monthly, per screen | Free for 1 screen; $8 / $12 / $16 per screen per month (from 1 Apr 2026) | What "real" signage costs | risevision.com summary of Yodeck's update |

Reading [Opinion]:

- **Pro yearly $12**: keep. It is a third of the utilities median and below Pomofocus ($18/yr) and Classroomscreen ($36/yr) (market §3.4), and a yearly plan lets people expense it. It will be the minority choice (growth estimates 20–40%). Treat it as the cheap way in, not a revenue line: about 72% of annual subscribers cancelled in year one in 2026, and 35% of those cancellations happen in the first month (RevenueCat 2026, via market §3.2). We also have no account or email of our own to remind people about renewals.
- **Pro lifetime $29 after launch**: keep. That is 2.4× yearly, a normal ratio for lifetime plans (Pomofocus is 3×). The docs/09 §8.4 repricing rules stand (below 0.05% after 60 days → $19 permanently; above 0.4% → $39). Lowering a price later is always honest; raising it needs a date announced in advance.
- **No monthly plan, no third "decoy" plan** (growth §4.3 agrees).

**Launch-price mechanics: three defects in the current build**

| # | Defect | Evidence | Fix |
|---|---|---|---|
| L1 | The lifetime price on `/pro` is fixed at **build time**. After 8 December the static page keeps showing $19 until the next deploy, while the Polar discount has expired and checkout charges $29. The buyer sees a different price at checkout | `pro.astro` frontmatter: `const life = lifetimePrice();` | Add a scheduled GitHub Action that redeploys production at `PRO_LAUNCH_END + 5 min`. Also add a build assertion: when building after `PRO_LAUNCH_END`, fail if any "Launch price" string is rendered |
| L2 | `PRO_LAUNCH_END = 2026-12-08T00:00Z`, so "until 8 December" ends at 4 PM on 7 December in California | `license.ts` | Move the end (and the Polar discount `ends_at`) to `2026-12-09T12:00:00Z` (end of 8 December everywhere on Earth), so the plain-language date is true in every time zone |
| L3 | The BRD promised "$19 for the first 90 days after Pro launch", but production checkout is not live yet (placeholder links, LAUNCH-AUDIT N-04). Every week of delay shortens the window | BRD BR-07, `checkout.ts` | **Keep 8 December fixed** (market §3.4: never extend a published end date; no countdown, no "only N left"). Change BR-07 to "until 8 December 2026". A short window is honest; a moving one is not. The L2 fix only makes the stated date true everywhere; it does not extend it |

**How the launch price is shown**: a dated sentence, never a strike-through (D-R13). Exact card copy is in §2.1. "At the launch price, less than two years of the yearly plan" must be computed from `PLAN_PRICES` and disappear after the launch window. After launch it becomes "Costs about as much as two and a half years of the yearly plan."

**Auto-renewal disclosure** [Fact]: US ROSCA (15 U.S.C. §8403) requires clear disclosure of material terms *before* billing information is collected, express consent, and a simple way to stop the charges. Polar's checkout collects the card, but our yearly card is where the buyer decides. Put "Renews each year at $12 until you cancel" on the card itself.

### 1.5 Regional pricing (PPP) through Polar

Facts: Polar lets a product carry prices in several currencies, and "customers automatically see appropriate currency at checkout based on location" (changelog 2026-02-28). Fixed-amount discounts can hold a separate amount per currency (2026-03-31). Presentment currencies include AUD, BRL, CAD, CHF, EUR, INR, GBP, JPY, SEK, USD plus 80+ more (2026-04-22). Third-party PPP tools (ParityDeals, Evendeals, Parity Kit) integrate with Polar by issuing country coupons, which are usually shown through a banner script on the pricing page.

Recommendation [Opinion]:

1. **Use Polar's native per-currency prices, not a PPP coupon service.** The coupon services need a third-party script and a location lookup on `/pro`. That contradicts the privacy stance and adds a dependency. Native prices need nothing on our side except the checkout link.
2. Proposed price table [Estimate: ratios to set by the owner, not FX quotes; check against the exchange rate on the day]:

| Currency | Who | Yearly | Lifetime (launch) | Lifetime | Rule |
|---|---|---|---|---|---|
| USD | US + default | $12 | $19 | $29 | base |
| EUR / GBP / CHF / SEK / CAD / AUD | de, fr, es (Spain), UK, etc. | €12 / £10 / … | €19 / £16 | €29 / £24 | round parity; tax is added on top at checkout, as for USD |
| JPY | ja | ¥1,800 | ¥2,900 | ¥4,400 | parity, rounded |
| BRL | pt-br | R$29 | R$49 | R$79 | ≈ 50% of USD at market |
| INR | hi, India English | ₹499 | ₹699 | ₹999 | ≈ 40% of USD at market; stays well above Polar's 50¢ fixed fee |
| Others (MXN, etc.) | es Latin America | owner's choice | | | add only when `pro_view` from that country is visible (Cloudflare country analytics) |

3. **What `/pro` says.** The page is static and shows USD. Replace "Charged in USD; taxes added at checkout where applicable." with: "Prices in US dollars. In some countries, including India, Brazil and Japan, checkout shows a lower local price. Taxes are added at checkout where they apply." Later (M effort): a Pages Function on `/pro` could swap the price text server-side using `request.cf.country` (first-party, no client JS). Only do this if the checkout currency logic is confirmed to match country, otherwise the page and checkout will disagree.
4. **Abuse**: someone on a VPN saves a few dollars. Accept it; this is a $29 product.
5. **Verify in sandbox before relying on it**: how Polar picks the currency (IP address or billing country), whether Indian cards (RuPay, and Visa/Mastercard with international usage switched off) pass, and whether INR can be the settlement currency or is converted. UPI is not a Polar method as far as I can find; the BRD's Dodo Payments rail is the path for UPI.

### 1.6 Students and teachers

- Teachers are a real segment. market.md (summary 5) quotes a rival extension's review, "LIFESAVER in the classroom where our teacher laptops are set to 'sleep' every 10 minutes", and teachers already pay $36/yr for Classroomscreen Pro [Fact, via market §3.1]. At $12/yr or $29 once we are already the cheap option. Reach teachers with a `/for/classroom` page (market action 13), not with a discount.
- Lena's core job (the projector stays on until 11:30, the floating window) is free. Pro adds Message and extension schedules. So a teacher without a budget is not blocked [Fact from the gate table].
- Verification (SheerID-style) means sending a person's data to a vendor. That is off-brand and costly [Opinion].
- Recommendation: **no education discount at launch.** Regional pricing handles most affordability. Optional owner decision (OD-7): a quiet line in the FAQ, "If the price is a real barrier (students, teachers, anyone between jobs), email us and we'll send a free key. No proof needed." It is generous and on-brand. The cost is the owner's time answering, and 100%-off single-use Polar codes are easy to issue (Polar discounts support max redemptions [Fact]).
- Schools buying for staff: Polar issues invoices (docs/09 §2.1). Say so in the FAQ.

### 1.7 Team or IT packs (Priya's company)

- Reality check [Opinion]: Priya's 5-minute lock is an IT security control. An IT department that set it will not buy a tool to defeat it, and Chrome Enterprise exposes `AllowWakeLocks` / `AllowScreenWakeLocks` policies that can switch wake locks off [Fact, Chrome Enterprise policy pages; check platform scope]. Marketing a team pack "for locked-down laptops" would read as circumventing security. That is off-brand and risky.
- Where teams *do* buy: operations rooms, trading and support desks, labs, clinic dashboards, classrooms. There IT *wants* screens on. That is Tomás's world, and Kiosk (sites, not seats) fits better than seats.
- Polar now supports seat-based pricing for one-time purchases too, and each seat can receive its own licence key [Fact, Polar docs and changelog 2025-10-24]. So a "Pro for teams" product is feasible without our own seat UI. It needs a new plan ID (docs/00 §8.1 contract), a benefit mapping and a claim flow.
- Precedent for a school or team price: Classroomscreen's Organization plan is $525/yr for 25 licences, about $21 per seat per year [Fact, via market §3]. market.md found no paid "enterprise keep-awake" market and advises against selling to IT (market §1, summary 10). I agree.
- Recommendation: **not at launch.** Add one FAQ line: "Buying for a team? Each person needs their own key. For 10 or more, email us and we'll set up one invoice." Build the seat product after three real requests. Proposed price if built [Estimate]: $15 per seat lifetime, minimum 5 (so $75), with yearly at $10 per seat. The discount against individual Pro is the price of one invoice and one admin.

### 1.8 B2B price sanity

**Embed, $29/yr per site.**

- Price is fine: below the cheapest recipe-plugin tier that includes Cook Mode ($49/yr), and hosting a 14 KB iframe costs us almost nothing [Fact: `embedJs` 14,063 B gz, LAUNCH-AUDIT].
- The problem is **value and market**, not price. WordPress blogs on WPRM Premium or Tasty Recipes already have Cook Mode [Fact]. The addressable buyers are: sites on Squarespace, Wix, Webflow, Ghost or Blogger; WordPress sites on free recipe plugins; recipe apps and docs sites; and publishers who want kitchen timers and an honest status (the plugins' toggles give no "Paused / Blocked" feedback [Opinion based on their docs: the toggle simply hides when unsupported]).
- What the licence buys today: no credit link, brand colour, "Priority support". Two issues: brand colour has no UI (§1.9 C6), and "Priority support" from a one-person business needs a definition. Use "Replies within 2 working days" or drop it.
- **Add one real benefit** [Opinion]: a monthly email or a `/pro/manage` panel showing "Readers who used Cook Mode on example.com this month: 1,240". The widget's `page_view` already carries the host in `blob6` (docs/11 §8). An aggregate count per licensed domain is privacy-safe and gives the blogger proof to keep paying. Needs docs/18 and `/privacy` lines.
- Multi-site: "3 sites $69/yr" only on request. No public tiers until someone asks.
- **Expectations** (agreeing with market §3): Embed is mainly *distribution*, meaning attributed backlinks from sites without Cook Mode, not a revenue line. Create by Mediavine has no wake lock (market §1.7), so Create sites are in the addressable set. That is why the scenarios in §3 carry very few Embed licences.
- **WordPress plugin caveat** [Fact, WordPress.org guideline 10, via market §3]: a plugin listed on WordPress.org must make credit links optional and hidden by default, and cannot lock features ("trialware"). If we ever ship the plugin wrapper, "remove the credit" stops being something we can sell there. The licence would then have to stand on the brand colour and the readers-helped report. One more reason to build that report.

**Kiosk, $19 one site / $49 five sites, one-time.**

- Price is sane against Fully Kiosk PLUS ($10.99 per *device*) and Kiosk Pro ($24.99–$99.99 per *device*), and far below signage SaaS ($8–16 per screen per *month*) [Fact]. AwakeTab does much less than signage (no remote content, no scheduling of content), so a low one-time price is right.
- **Define "site"** [Opinion]: "one location, such as a lobby, a shop, a classroom or an office floor, with any number of screens there." The token travels in the URL and cannot count screens anyway (docs/09 §7.2), so a per-location definition is the only honest rule we can enforce by trust. It is also generous, which suits the brand. Put the definition on `/kiosk` and in `/terms`.
- Add "Polar sends an invoice and handles sales tax and VAT" (growth §2.4) and "More than 5 sites? Email us."

### 1.9 Checkout and post-purchase, step by step

| # | Step | Today [Fact] | Problem | Fix |
|---|---|---|---|---|
| C1 | `/pro` → checkout | Plain links to Polar checkout links, same tab (docs/09 §2.2 describes a popup the code does not implement) | Fine. The popup spec is dead weight | Keep same-tab. Delete the popup from docs/09 §2.2 |
| C2 | Polar checkout | Hosted; email + card; tax added | Yearly auto-renewal isn't stated on our side; no domain field for Embed | Renewal line on the card (§2.1). Add a Polar **checkout custom field** "Website domain (e.g. example.com)" to the Embed product only |
| C3 | Success redirect | `/pro/activate?checkout_id=…` auto-activates this browser (retries 3/6/12 s while syncing) | Works | Keep |
| C4 | After activation | `location.assign('/')` with no confirmation | The buyer lands on the tool with no sign that anything happened, no list of what unlocked, no key, no extension step | Show a **success state on `/pro/activate`** instead (copy §2.3). Keep a "Open AwakeTab" button |
| C5 | Device label | `navigator.userAgent.slice(0, 40)` (`activate-page.ts`) | Manage devices shows "Mozilla/5.0 (Macintosh; Intel Mac OS X 1" | Use the UA class "Chrome · macOS", as docs/09 §2.6 specifies, and make it editable |
| C6 | **Embed domain** | No domain field on `/pro/activate`. `embed:{domain}` is written only in `webhooks/polar.ts` when `data.metadata?.domain` is set on a key-bearing payload | Production payloads carry no key (docs/09 §2.7.1), so a paying blogger's credit may never disappear. No brand-colour UI anywhere | **Block Embed sales until fixed.** Implement docs/09 §7.1 as written: `plan=embed` on the success URL → a domain + colour form → activate with `deviceId = 'domain:' + eTLD+1`. Prove it with a sandbox purchase (LAUNCH-AUDIT N-04 style) |
| C7 | Extension hand-off | `?ext=1` copy panel: "Copy this key and paste it in the AwakeTab for Chrome options page. There is no automatic hand-off." | Accurate, but it only appears if the buyer finds `?ext=1`. The success state doesn't mention the extension | On the success state, show the key (the lookup already returns it) with Copy, and one line for the extension (§2.3). Keep the manual paste; the v1.1 postMessage relay (docs/09 §2.12) is the later upgrade |
| C8 | Receipt and key email | Polar's email with the key | Polar's template can't be fully ours; product and benefit descriptions can | Set product descriptions and licence-key benefit instructions in Polar (copy §2.3) |
| C9 | Refund | 14 days, no questions; email or Polar portal; refund deactivates the key | Fine. The copy sits far from the buttons (growth §4.4) | Put it next to the buttons. Also say what a refund does to the extension |
| C10 | Yearly cancellation and renewal | Polar customer portal | We don't say that Pro keeps working until the paid year ends | FAQ line (§2.1). Check whether Polar sends a pre-renewal reminder email. Promise it only if it does |
| C11 | **"Lifetime" meaning** | Lifetime tokens expire 90 days after the last online validation (docs/09 §2.4) | If AwakeTab ever shuts down, lifetime Pro stops working within 90 days. Kenji will ask | Owner decision OD-4: publish "If AwakeTab ever shuts down, we'll ship a final update that unlocks Pro for everyone, offline." The engine is MIT and the keys are ours, so it is feasible |
| C12 | Telemetry on `/pro*` | Hard-coded `telemetry: true`, locale `en` | Privacy promise broken (growth F4) | Growth action #2 |

### 1.10 Upgrade moments: allowed, never, and one correction

Growth §4.2 is the placement rule. I agree with all of it except one row:

- **Correction (Message preview).** Growth says "60 s preview with their own text (P1), then the honest Pro card (exists)". That card appears on the awake screen during a live session, 60 seconds after the user's last action. D-R15 (Decided) forbids upgrade prompts on the awake screen during a session. Fix: put the offer **at the moment of choosing** (the mode control or Settings, where the user is reaching for a gated thing), and end the preview with a neutral, link-free line in the note area: "Message preview ended. Showing Clock." The pill is untouched, and the Pro link is one tap away in the mode control.
- **Additions to the "never" list:** `/pro/manage` and every activation error (no cross-sell from yearly to lifetime while someone fixes a problem); the refund confirmation; the extension **popup** (it is the awake control; only the options page may mention Pro); screens running a Kiosk licence and the embed widget (already in growth); guide article bodies (a Pro pitch inside a "how to keep an iPad awake" article reads as an ad, so keep Pro to the footer and to the one page where it is the answer, `/for/presentations` → Message); and any localized page that states a USD price as the price the reader will pay.
- **Frequency**: one Pro mention per Done screen, at most once per 7 days per device (growth §4.2; needs `lastUpsellAt` in docs/08).

Exact microcopy for every allowed surface: §2.2.

---

## 2. Rewrites and assets (copy to ship)

All strings are EN source for `en.json`. Keys marked **PROPOSED** need adding to docs/00 first. `{…}` are ICU placeholders. The launch-price lines show only while `now < PRO_LAUNCH_END`.

### 2.1 `/pro`: the full sales page

**Meta**

- `page.pro.title`: `AwakeTab Pro: plans and pricing`
- `page.pro.description`: `Pro adds Message mode, extra lamp colours, 12 weeks of history and schedules in AwakeTab for Chrome. Pay yearly or once. Five devices, no account, 14-day refund.`

**§0 Hero**

> **AwakeTab Pro**
> Pro is optional. Keeping your screen awake is free, and the status pill works the same for everyone.
>
> Five devices · No account · 14-day refund
>
> [See the two plans] · [Enter licence key]

**§1 The trust line** (directly under the hero, own paragraph, larger type)

> Pro changes how AwakeTab looks and what it remembers. It does not change how the screen is kept awake: that part is the same with or without Pro.

**§2 What Pro adds** (three sections, each with its live preview from the board)

> **Show your own words**
> *At the lectern*
> Message mode puts one line in big type on the awake screen, so the back row can read "Back at 11:30 AM" during a break. Up to 80 characters. Pick Message in AwakeTab to try it free for 60 seconds.
> [Live preview: "Try your own message" input + awake-screen mock]
>
> Mint and sky join the free aqua and violet lamp colours. Tap one below to see it on the clock.
> [Lamp swatches, preview only]

> **Let Chrome start it for you**
> *On the wall, and at your desk*
> In AwakeTab for Chrome, pick the days and hours a screen should stay on, such as weekdays 8:00 AM to 6:00 PM, at Screen or System level. Or start keeping awake whenever Chrome opens, or whenever a site you choose is open. Nobody has to touch it.
> [Schedule mock]
> *AwakeTab for Chrome works in Chrome, Edge, Brave, Arc and Opera. It is not available for Firefox or Safari, because they give extensions no power API.*
> (While the listing is in review: *AwakeTab for Chrome is in store review. Your key will work in it the day it is listed.*)

> **See what really ran**
> *Overnight builds*
> Free stats show the last 7 days. Pro shows 12 weeks and exports every session as a CSV file, so you can check what ran and for how long. Your older days are already saved on this device, so they appear the moment you activate.
> [Heatmap free/Pro toggle, "sample data"]

(Removed from the board: "In the kitchen: Your own end sound" until `sounds.custom` ships; "On a work laptop: No ads on the guides"; "taller floating window"; "Your logo", which moves to Kiosk.)

**§3 Two ways to pay** (lifetime first: left on desktop, top on phones)

> **Two ways to pay**
> Both plans unlock everything above on five devices. There is no monthly plan and no account.

Lifetime card:

> **Lifetime** · Pay once
> **$19** once
> Launch price until 8 December 2026, then $29 once.
> At the launch price, less than two years of the yearly plan.
> [Get lifetime Pro]

(after the launch window: "**$29** once" / "Pay once, keep it. About two and a half years of the yearly plan." / [Get lifetime Pro])

Yearly card:

> **Yearly**
> **$12** / year
> Renews each year at $12 until you cancel. Cancel any time in the Polar customer portal; Pro stays on until the year you paid for ends.
> [Get yearly Pro]

Under both cards (not in an alert box):

> 14-day refund, no questions asked. · Polar handles payment, tax and your receipt; AwakeTab never sees your card. · Prices in US dollars. In some countries, including India, Brazil and Japan, checkout shows a lower local price. Taxes are added at checkout where they apply.

**§4 What happens after you pay**

> 1. Polar emails your receipt and your licence key. The key starts with AWAKETAB-.
> 2. You come back here and this browser turns on Pro by itself. If it doesn't, paste the key.
> 3. Each browser or device where you enter the key uses one of five activations. AwakeTab for Chrome counts as one.

**§5 What stays free** (board list, updated)

> **What stays free**
> Keeping a screen awake never needs Pro. All of this works without a key or an account.
> - Every length: 15 min to 4 h, until I stop, until a time, or a custom length up to 7 days.
> - All seven honest states. The status pill only says what the browser really did.
> - Four clock faces: Ring, Bold, Horizon and Tide.
> - Six modes: Standard, Clock, Focus, Minimal, Night and Cook.
> - Aqua and violet lamp colours.
> - Stats for the last 7 days.
> - The floating window with +15 and Stop.
> - AwakeTab for Chrome at Screen or System level, even with the tab hidden.
> - Install it, use it offline, in 8 languages.
> - No ads on the awake screen, ever.

**§6 Questions** (FAQ; also emitted as `FAQPage` only if docs/06 allows it on `/pro`)

> **Does Pro keep the screen awake better?**
> No. Free and Pro use the same wake lock and the same status pill. Pro adds Message mode, colours, history and schedules on top.
>
> **Do I need an account?**
> No. Polar handles checkout and emails you a licence key. AwakeTab never asks for a password.
>
> **What counts as a device?**
> Each browser where you enter the key uses one of five activations, and AwakeTab for Chrome uses one too. You can remove a device in Manage devices. Devices unused for 90 days are removed automatically when you activate a new one.
>
> **Where is my licence key?**
> In the email from Polar and on the receipt page. It starts with AWAKETAB-.
>
> **Does Pro work offline?**
> Yes. Your key is checked on the device. AwakeTab re-checks it quietly when you're online: every 30 days for lifetime, every 7 days for yearly.
>
> **What does "lifetime" mean?**
> You pay once and keep Pro for as long as AwakeTab exists, with every Pro feature we add. If AwakeTab ever shuts down, we will ship a final update that unlocks Pro for everyone. *(Only if OD-4 is accepted.)*
>
> **What if I cancel the yearly plan?**
> Pro stays on until the end of the year you paid for, then only the Pro features turn off. Your settings and free features don't change.
>
> **Can I get a refund?**
> Yes, within 14 days, no questions asked. Email support@awaketab.com with your receipt or use the Polar customer portal. A refund turns off Pro on every device that uses the key, including AwakeTab for Chrome.
>
> **Can my school or company pay?**
> Yes. Polar sends a proper invoice and handles sales tax and VAT. Each person needs their own key. For 10 or more people, email us and we'll set up one invoice.
>
> **Does Pro keep me "available" in Teams or Slack?**
> No. Presence follows your keyboard and mouse, and AwakeTab never fakes input. Neither Free nor Pro changes that.

(Optional, OD-7: **Is there a discount for students or teachers?** "If the price is a real barrier, email us and we'll send a free key. No proof needed.")

**§7 For your website or your screens**

> **Embed licence** · $29 / year per site
> A Cook Mode button for your recipes or docs, without the "Keep awake by AwakeTab" credit, in your brand colour. [About Embed]
>
> **Kiosk licence** · $19 one site · $49 five sites, once
> Lobby, shop and classroom screens that stay on from one URL, with your logo and no AwakeTab branding. [About Kiosk]

**§8 Footer strip**

> Already bought Pro? [Enter licence key] · [Manage devices]

### 2.2 In-product microcopy (allowed surfaces only)

| Surface · trigger | String (key) | Copy | Link / `ref` | Cap |
|---|---|---|---|---|
| Pro sheet (any gated control) | `pro.card` (replace) | "AwakeTab Pro adds Message mode, mint and sky lamp colours, 12 weeks of stats with CSV, and schedules in AwakeTab for Chrome. $29 once or $12 a year." (launch: "$19 once until 8 December 2026, or $12 a year.") | [See what's in Pro] `/pro?ref=sheet-{gate}` · [Enter licence key] | on demand |
| Pro sheet footer | `pro.sheet.free` **PROPOSED** | "Keeping the screen awake stays free." | — | — |
| Mode control, Message chosen without Pro | `ambient.message.pro` (replace) | "Message is a Pro mode. Show your own line for 60 seconds now, or see what Pro adds." | [Preview 60 seconds] · [See Pro] `ref=sheet-message` | preview once per day per device |
| Message preview ends (awake screen, note area) | `ambient.message.previewEnd` **PROPOSED** | "Message preview ended. Showing Clock." | none (D-R15) | — |
| `M` key skips Message | existing toast | "Message is a Pro mode. Pick it from the mode menu to preview it." | none | once per session |
| Settings → lamp, taps mint/sky | `settings.accent.packs` (replace) | "Mint and sky come with Pro. You're seeing a preview; it goes back when you close Settings." | [See Pro] `ref=sheet-lamp` | on tap |
| Stats, locked range | `stats.heatmap.pro` (replace) | "{weeks, plural, one {# older week is} other {# older weeks are}} saved on this device. Pro shows them." (when 0: "Pro keeps 12 weeks of history.") | [See Pro] `ref=sheet-stats` | on open |
| Stats → Export without Pro | `stats.export.pro` **PROPOSED** | "CSV export comes with Pro." | [See Pro] `ref=sheet-export` | on tap |
| Done screen (only if a gate was touched in the last 7 days) | `done.pro.{gate}` **PROPOSED** | message: "Pro keeps your message on screen for the whole session." · lamp: "Liked mint? It comes with Pro." · stats: "Pro shows 12 weeks of your sessions." | [See Pro] `ref=done-{gate}` | 1 per 7 days per device; never with the rating prompt; never in cook mode with timers running |
| Extension options, locked sections | `ext.pro.locked` (replace) | "Schedules and auto-start come with AwakeTab Pro. Already have a key? Paste it under Pro licence below." | [See what's in Pro] `ref=ext-options` | static |
| Settings Pro row (has Pro) | `pro.activated` (keep) + **PROPOSED** `pro.activated.plan` | "Pro is active on this device · Lifetime" / "· Yearly, renews {date}" | [Manage devices] | — |
| Licence ended (yearly lapsed or refunded) | `pro.ended` **PROPOSED** (toast, once, *not during a session*: show at next idle or Done) | "Pro is off on this device. Your free features and settings haven't changed." | [Manage devices] | once |
| Offline near expiry | `pro.err.offline` (docs/09) | "You're offline. Pro keeps working until {date}; AwakeTab re-checks when you're back online." | — | — |
| Kiosk builder, logo field without licence | `builder.logo.preview` **PROPOSED** | Watermark on the preview: "Preview · a Kiosk licence shows your logo" | [See Kiosk licences] `#licence` | static |
| Embed widget credit | `embed.attribution` (keep) | "Keep awake by AwakeTab" → `/embed?ref=widget` | link param only | — |

### 2.3 Post-purchase assets

**Success state on `/pro/activate`** (replaces the redirect to `/`)

> **Pro is on for this browser**
> Lifetime · 1 of 5 devices used *(or: Yearly · renews {date})*
>
> **Now try:**
> - Message mode: pick Message and type your line.
> - Mint or sky: Settings → Lamp colour.
> - Stats: your last 12 weeks are there now.
>
> **Your licence key**
> `AWAKETAB-XXXX-…` [Copy]
> It's also in the email from Polar. Keep it: you'll need it on your other devices.
>
> **Using AwakeTab for Chrome?**
> Open the extension's settings, find Pro licence, and paste this key. That uses one more of your five devices.
> [How to open the extension settings] (links to `/extension#pro`)
>
> [Open AwakeTab]

Kiosk variant: "**Your Kiosk licence is on for this browser.** Open the Kiosk URL builder: your licence token is filled in, so the link you copy works on the kiosk screen." [Open the Kiosk URL builder]

Embed variant (after C6 is built): "**Which site is this licence for?** Enter the domain where the widget runs. `www.` and staging subdomains are included." [example.com] · Brand colour [#RRGGBB] · [Licence this site] → "**example.com is licensed.** The credit link disappears within 5 minutes. You can change the colour here any time."

**Polar product descriptions** (shown at checkout and in the receipt)

- Pro (yearly): "AwakeTab Pro for one year on up to five devices: Message mode, extra lamp colours, 12 weeks of stats with CSV export, and schedules and auto-start in AwakeTab for Chrome. Renews yearly until you cancel. Keeping the screen awake stays free."
- Pro (lifetime): "AwakeTab Pro, paid once, on up to five devices: Message mode, extra lamp colours, 12 weeks of stats with CSV export, and schedules and auto-start in AwakeTab for Chrome. Keeping the screen awake stays free."
- Kiosk (1 / 5): "AwakeTab Kiosk licence for {one site | five sites}. A site is one location, such as a lobby, a shop or a classroom, with any number of screens. Adds your logo, a permanent message screen and no AwakeTab branding or prompts. One-time payment."
- Embed: "AwakeTab Embed licence for one website (one domain and its subdomains) for one year. Removes the credit link and applies your brand colour. Renews yearly until you cancel."

**Licence-key benefit instructions** (Polar benefit description, shown with the key)

> Your AwakeTab licence key. If you came back to awaketab.com after paying, this browser is already activated. On another device, open awaketab.com/pro/activate and paste the key. In AwakeTab for Chrome: extension settings → Pro licence → paste. Five devices per key; remove one at awaketab.com/pro/manage.

**Manage devices** (`/pro/manage`) additions

- Plan line: "Lifetime · bought {date}" / "Yearly · renews {date} · [Manage billing and receipts]" (Polar portal).
- Under the table: "Removing a device frees one of your five activations. Removing this browser turns Pro off here; your free features stay."
- Refund line (existing `page.pro.refund`, with "including AwakeTab for Chrome" added).

### 2.4 `/embed`: landing copy for recipe publishers

- `page.embed.title`: `Cook Mode button for recipe sites: keep readers' screens on`
- `page.embed.description`: `A free keep-screen-on button for recipes and docs, with kitchen timers and an honest status. One script tag, no cookies, no third-party requests. License it to remove the credit.`

> **Keep your readers' screens on while they cook**
> One button in your recipe card. Readers tap it, their phone stays on while they follow the method, and they can see that it's working. Free with a small credit link.
>
> [Try it: the real widget, compact and full width]
>
> **Why it matters to a recipe site**
> In a web.dev case study, Betty Crocker readers who turned on a keep-awake option stayed on the page 3.1 times longer. Those readers chose the feature themselves, so this was not a controlled test, but it shows how much cooks use it.
>
> **Why readers trust it**
> - It tells the truth. If the phone can't keep the screen on (Safari needs a tap, Low Power Mode limits Auto-Lock to 30 seconds), the button says so and shows the fix, instead of pretending.
> - Kitchen timers. Up to three named timers ("Rice 12 min") that chime when time is up.
> - Readers' language. English, Spanish, Portuguese, German, French, Japanese, Chinese and Hindi.
>
> **Why your pages stay fast**
> The loader is under 3 KB compressed, the widget loads only when readers scroll to it, and it reserves its space, so nothing jumps. No cookies, no trackers, no request to anyone but awaketab.com.
>
> **Install: one line**
> [snippet builder] Paste it where the button should appear: inside the recipe card, above the method, or in the sidebar. Works on Squarespace, Wix, Webflow, Ghost, Blogger and WordPress (Custom HTML block).
>
> **Already using a recipe plugin?**
> If your recipe plugin has its own Cook Mode, you may not need this. AwakeTab adds kitchen timers and an honest status that says when the screen can't stay on. Use whichever serves your readers.
>
> **Free, or licensed for your brand**
> | | Free | Embed licence |
> |---|---|---|
> | Keeps the screen on, honest status, 8 languages | Yes | Yes |
> | Cook Mode and kitchen timers | Yes | Yes |
> | "Keep awake by AwakeTab" credit | Shown | Removed |
> | Your brand colour | | Yes |
> | Monthly count of readers who used it *(when built)* | | Yes |
> | Email support | Yes | Replies within 2 working days |
>
> **$29 / year per site**
> One domain, including `www.` and staging subdomains. Renews yearly until you cancel. If the licence ends, the credit link comes back quietly; the button keeps working for your readers either way.
> [Get the Embed licence] · Already bought? [Activate your domain]
> Readers never get a worse widget because a site didn't pay.
>
> **Questions**
> *Will it slow my page down?* (existing answer)
> *Does it keep the screen on if the reader switches tabs?* (existing answer)
> *Is there a WordPress plugin?* (existing answer)
> *Can I use it on more than one site?* "Each site needs its own licence. For three or more, email us."
> *Do you track my readers?* "No. The widget sets no cookies. We count anonymous button uses per site, never who used it."

(Note: the "Already using a recipe plugin?" block is deliberately candid [Opinion]. Bloggers talk to each other, and an honest comparison earns the non-plugin buyers we can actually win.)

### 2.5 `/kiosk`: landing copy for reception desks, shops and classrooms

- `page.kiosk.title`: `Kiosk and signage mode: keep a display on from one URL`
- `page.kiosk.description`: `Point a lobby, shop or classroom screen at one AwakeTab URL. It starts by itself and keeps the display on while the page is in front. Free; add your logo with a Kiosk licence.`

> **Screens that stay on, from one link**
> Point a kiosk browser, a lobby dashboard, a shop-window screen or a classroom display at one AwakeTab URL. It starts by itself, shows your message or a clock, and keeps the display on while the page is in front. No install, no account.
>
> **Build your kiosk link** [builder: mode, theme, length, start automatically, message, logo (watermarked "Preview" without a licence)]
>
> **Where people use it**
> - Reception: "Welcome to Northwind. Please sign in at the desk."
> - Shops and cafés: opening hours or today's special, readable across the room.
> - Classrooms: the clock and "Back at 10:45" during a break, on the projector.
> - Operations rooms: keep a status dashboard on (open the dashboard in the same kiosk browser, with AwakeTab for Chrome on a schedule).
>
> **Free for every screen, or with a Kiosk licence**
> Keeping the display on is free everywhere. A Kiosk licence adds your logo and removes AwakeTab's branding and prompts.
> | | Free | Kiosk licence |
> |---|---|---|
> | Start automatically, message, clock, theme | Yes (message shown on shared links for 60 s) | Yes, message stays on |
> | Your logo | | Yes |
> | AwakeTab wordmark, rating and upgrade prompts | Shown | Never |
> | Works offline | Yes | Yes, licence checked on the device for up to a year |
>
> **$19 once for one site · $49 once for five sites**
> A site is one location, such as a lobby, a shop, a classroom or an office floor, with any number of screens there. One-time payment, 14-day refund, no questions asked. Polar sends an invoice and handles sales tax and VAT. More than five sites? Email us.
> [Buy for one site] [Buy for five sites] · [Activate a Kiosk key]
>
> **Honest limit** (keep the existing paragraph)
>
> **Setting up a screen** (3 steps)
> 1. Build the link above and copy it.
> 2. Set the kiosk browser's start page to that link, full screen.
> 3. Keep the device plugged in, and leave lid and sleep settings to the device's own power plan. No web page can change those.

(The "Classrooms" line is the answer to "schools": a teacher's classroom screen is one site at $19 once.)

---

## 3. Revenue scenarios (all [Estimate])

**Formulas**

- Monthly uniques `U = V / 1.6` (V = visits; docs/09 §8.2 ratio).
- Pro orders per month `O = U × c` (c = orders ÷ monthly uniques).
- Net per order after Polar fees, with `f` = share of non-US cards (assumed 0.75, given 7 of 8 locales):
  `N(p) = p − (0.05p + $0.50) − 0.015p × f` (Polar Starter 5% + 50¢, +1.5% non-US cards [Fact, Polar pricing]).
  - `N($12) = $10.77` · `N($19) = $17.34` · `N($29) = $26.72` · `N($49) = $45.50`
- Blended Pro net per order after the launch window, with lifetime share `s = 0.70` and refund rate `r = 0.03`:
  `N̄ = [s × N($29) + (1 − s) × N($12)] × (1 − r) = (18.70 + 3.23) × 0.97 = $21.27`.
  (During the launch window, with `s = 0.8` at $19: `$15.54`.)
- Pro net per month `R_pro = O × N̄`. Per 1,000 uniques: `1000 × c × N̄`.
- Business net per month `R_biz = k × N̄_K + e × N($29)`, with k = Kiosk orders, e = new Embed licences, and `N̄_K = 0.75 × N($19) + 0.25 × N($49) = $24.38`.
- Year-2 renewals add `R_renew(m) = O_yearly(m − 12) × ρ × N($12)`. Here ρ is the share of yearly buyers who renew: 0.28 in the base case (about 72% of annual subscribers cancelled in year one in 2026 [Fact, RevenueCat 2026, via market §3.2]) and 0.44 in the optimistic case (RevenueCat 2025 one-year retention for yearly plans, via growth §4.3). These are mobile-app benchmarks. We have no account and no reminder emails of our own, so our real rate may be lower.
- Not included: Stripe payout costs ($2 per active payout month + 0.25% + 25¢ per payout + up to 1% cross-border [Fact, Polar pricing]), about 1–2% of revenue; $15 per dispute; ads, sponsor, donations, affiliates (out of scope); regional pricing (unknown net effect: lower price per order in INR/BRL, likely higher conversion there. Measure, don't guess).

**Inputs**

| Input | Conservative | Base | Optimistic | Basis |
|---|---|---|---|---|
| Visits / month, month 6 → 12 | 25k → 60k | 50k → 120k | 100k → 250k | docs/09 §8.2 (Low / Base / High) |
| c (Pro orders ÷ uniques) | 0.05% | 0.15% | 0.30% | growth §4.8 band (0.05–0.45%), docs/09 kill-switch thresholds |
| Kiosk orders / month, M6 → M12 | 1 → 2 | 3 → 6 | 8 → 15 | a guess: no data. Tomás-type buyers arrive from `/for/kiosk`, `/for/dashboards`. Revisit after 60 days of Polar data |
| New Embed licences / month, M6 → M12 | 0 → 1 | 1 → 3 | 3 → 8 | a guess, and zero until C6 is fixed |

**Results (net USD per month)**

| | Conservative | Base | Optimistic |
|---|---|---|---|
| **Month 6** uniques | 15,625 | 31,250 | 62,500 |
| Pro orders | 7.8 | 46.9 | 187.5 |
| Pro net | $166 | $997 | $3,988 |
| Business net | $24 | $100 | $275 |
| **Month 6 total** | **≈ $190** | **≈ $1,100** | **≈ $4,260** |
| **Month 12** uniques | 37,500 | 75,000 | 156,250 |
| Pro orders | 18.8 | 112.5 | 468.8 |
| Pro net | $399 | $2,393 | $9,970 |
| Business net | $75 | $226 | $580 |
| **Month 12 total** | **≈ $475** | **≈ $2,620** | **≈ $10,550** |
| Pro net per 1,000 uniques | $10.6 | $31.9 | $63.8 |

Worked example (base, month 12): `U = 120,000 / 1.6 = 75,000`; `O = 75,000 × 0.0015 = 112.5`; `R_pro = 112.5 × $21.27 = $2,393`. `R_biz = 6 × $24.38 + 3 × $26.72 = $146 + $80 = $226`.

What moves the answer [Estimate]:

- **Traffic and `c` dominate.** Base → conservative traffic alone cuts Pro by 50%. `c` from 0.15% to 0.05% cuts it by 67%.
- **Price choices matter much less.** A permanent $19 lifetime instead of $29 lowers `N̄` from $21.27 to $14.90 (−30%). It pays off only if conversion rises by more than 43%, which is plausible for a $4-app audience. That is exactly why docs/09 §8.4 keeps $19 as the fallback lever.
- **Yearly renewals are a small kicker.** In the base case, about 34 yearly orders in month 12 bring in 33.75 × 0.28 × $10.77 ≈ $100 per month of renewals in month 24 (≈ $160 at ρ = 0.44). This is why the page leads with lifetime (market §3.4 agrees).
- **Growth §4.8 put the base case at ≈ $24 per 1,000 uniques.** Mine is $32 because it assumes the post-launch $29 price. Both sit inside docs/09's band.

---

## 4. Prioritised action table

Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week. Impact on revenue and trust: H / M / L.

| # | Action | Why | Effort | Impact | Owner / where |
|---|---|---|---|---|---|
| 1 | Block Embed sales until a sandbox purchase ends with a licensed domain; build the domain + colour step (docs/09 §7.1) and a Polar custom field for the domain | C6: paying blogger may never lose the credit | M | H (trust) | `pro/activate.astro`, `lib/activate-page.ts`, `functions/api/license/activate.ts`, Polar dashboard |
| 2 | Fix the build-time launch price: scheduled redeploy at `PRO_LAUNCH_END`, build assertion, move the end to `2026-12-09T12:00Z`, same on the Polar discount | L1, L2: `/pro` and checkout would disagree | S | H (trust) | `.github/workflows/`, `lib/license.ts`, Polar discount |
| 3 | Remove web `schedules`, `sounds.custom` (until built), `pip.pro` "taller" and the "No ads on the guides" section from all selling copy; replace `pro.card` | K2, K3, growth F2 | S | H | `en.json` + 7 locales, `Pro.dc.html`, docs/09 §2.9 |
| 4 | Move `ambient.logo` to Kiosk only | K1 cannibalisation | S | M | `packages/core` + `license.ts` `PLAN_FEATURES`, `functions/_lib/license.ts`, docs/00 §8.2, docs/09 §2.9 |
| 5 | Ship `/pro` copy §2.1 (with growth #4 board structure), dated launch line, renewal line, refund beside buttons | Largest conversion lever; ROSCA disclosure | M | H | `pages/pro.astro`, `en.json page.pro.*` |
| 6 | Success state on `/pro/activate` (§2.3) with key + extension step; readable device labels | C4, C5, C7 | M | H | `lib/activate-page.ts`, `pro/activate.astro`, i18n |
| 7 | Polar product and benefit descriptions (§2.3) | C8: receipt is the second-most-read page | S | M | Polar dashboard |
| 8 | Regional prices in Polar (INR, BRL at ≈ 40–50%; parity elsewhere) + `/pro` currency line; verify currency selection and Indian cards in sandbox | 7 of 8 locales non-US; native, no script | S (setup) + S (verify) | M | Polar dashboard, `en.json page.pro.tax` |
| 9 | Message preview offer at selection, neutral end line (§1.10, §2.2) | D-R15 conflict in growth P1 | S | M | `ambient/message.ts`, `ambient/shell.ts`, i18n |
| 10 | In-product microcopy §2.2 with `ref` on every link | Consistent, measurable asks | S | M | `ToolPanel.astro`, `ui/settings.ts`, `stats/panel.ts`, extension `ext.pro.locked` |
| 11 | Decide and publish the lifetime promise (OD-4) | C11: Kenji's first question | S | M (trust) | `/pro` FAQ, `/terms` |
| 12 | Define "site" for Kiosk; add invoice/tax line and "more than five" line; `/kiosk` copy §2.5 | Business clarity | S | M | `pages/kiosk.astro`, `/terms` |
| 13 | `/embed` copy §2.4, incl. the candid plugin comparison; define support promise | Honest positioning wins the reachable buyers | S | M | `pages/embed.astro` |
| 14 | Embed "readers who used it" monthly count per licensed domain | The one real reason to renew | M | M | `functions/_lib/events.ts` (blob6), `/pro/manage`, docs/11, docs/18, `/privacy` |
| 15 | Build a small bundled end-sound set (3–4 sounds + volume) or keep it out of Pro permanently (O-05) | Marco/Lena value, cheap if lazy | M | L | `tool/end.ts`, Settings, size budget |
| 16 | Align `biz_embed_site_yearly` features in code and docs (`ads.free`) | Drift | S | L | `license.ts`, docs/09 §2.9 |
| 17 | Remove the popup-checkout description from docs/09 §2.2 | Spec doesn't match code | S | L | docs/09 |
| 18 | After ≥ 3 requests: Polar seat-based "Pro for teams" (one-time, $15/seat, min 5) | Real demand first | M | L | new plan ID (docs/00 §8.1), Polar |
| 19 | Later: server-side local price on `/pro` via `request.cf.country` | Removes the USD-vs-local mismatch | M | L | Pages Function middleware on `/pro` |

---

## 5. Owner decisions

| # | Decision | Options | Recommendation |
|---|---|---|---|
| OD-1 | Move `ambient.logo` out of Pro into Kiosk only? | Yes / keep in both | **Yes.** Ends the $19-Pro-vs-$49-Kiosk overlap. Contract change: docs/00 §8.2 |
| OD-2 | `pip.pro`: drop, give the taller window to everyone, or redefine as "Message in the floating window"? | three options | **Give the size to everyone; redefine the gate only if Message in PiP is built** |
| OD-3 | Web `schedules`: retire the gate ID for good (extension only)? | Retire / build | **Retire.** A web schedule is a delayed start that needs a visible tab. Pairs with O-05 |
| OD-4 | Publish the lifetime promise ("If AwakeTab ever shuts down, a final update unlocks Pro for everyone")? | Yes / no | **Yes** |
| OD-5 | Launch-price window: fixed 8 December 2026 or production launch + 90 days? | Fixed / relative | **Fixed 8 December** (with market.md). Make it end-of-day everywhere (L2) and change BRD BR-07's "first 90 days" to the date |
| OD-6 | Regional prices: INR ≈ 40%, BRL ≈ 50%, parity elsewhere? | Yes / USD only / PPP coupon service | **Yes, native Polar prices.** No PPP script on `/pro` |
| OD-7 | "Email us for a free key if price is a barrier, no proof needed"? | Yes / no | Owner's call. It costs time, not money |
| OD-8 | Kiosk "site" = one location with any number of screens? | Per location / per screen | **Per location.** It is the only rule we can honestly enforce with a URL token |
| OD-9 | Hold Embed sales until C6 is proven in sandbox? | Hold / sell and fix by hand | **Hold** |
| OD-10 | Embed licence: add a monthly "readers who used it" count (a new aggregate, and a privacy-page line)? | Yes / no | **Yes** |
| OD-11 | Team pack: defer until three requests? | Defer / build now | **Defer** |

(Existing items this file also informs: O-01 lamp split, O-02 free modes → all free except Message, O-04 sponsor removal (agree with growth), O-05 unbuilt features → OD-3 and action 15, O-06 refund window → keep 14 days.)

---

## 6. Sources (accessed 26–27 September 2026)

External:

- Polar, *Pricing* (Starter 5% + 50¢; +1.5% international cards; payouts $2/month + 0.25% + 25¢; $15 per dispute): https://polar.sh/resources/pricing
- Polar, *Product updates* (multi-currency prices 2026-02-28; per-currency fixed discounts 2026-03-31; 80+ presentment currencies and regional formatting 2026-04-22; seat-based one-time purchases 2025-10-24): https://polar.sh/docs/changelog/recent
- Polar, *Discounts & Coupons* (percent/fixed, product scope, redemption caps, start/end dates, pinned to checkout link, `discount_code` query parameter; no country restriction mentioned): https://polar.sh/features/discounts
- Polar, *Implementing Seat-Based Pricing* (subscriptions and one-time; seat holders receive licence keys; up to 1,000 seats): https://polar.sh/docs/guides/seat-based-pricing
- Polar, *Purchase Power Parity with ParityDeals*: https://docs.polar.sh/features/integrations/paritydeals ; Evendeals: https://www.evendeals.com/integrations/polar ; Parity Kit: https://www.paritykit.com/
- Polar on X, presentment currencies announcement (secondary): https://x.com/polar_sh/status/2026979022962401441
- US Code, 15 U.S.C. §8403 (ROSCA negative option requirements): https://www.law.cornell.edu/uscode/text/15/8403
- Bootstrapped Ventures, *WP Recipe Maker* bundles (Premium $49, Pro $99, Elite $149 per year for one site; "Cook Mode Included" in all): https://bootstrapped.ventures/wp-recipe-maker/get-the-plugin/
- WP Tasty, *Tasty Recipes pricing* ($49/$99/$199 first year; renewals $99/$149/$249; "Hands-Free Cook Mode" in all plans): https://www.wptasty.com/pricing-recipes
- Fully Kiosk Browser (PLUS licence €8.90 / $10.99 + tax per device, one-time; volume from 10 devices): https://www.fully-kiosk.com/
- Kiosk Group, *Kiosk Pro pricing* (Lite $5/month; Basic $24.99, Plus $49.99, Enterprise $99.99 per device, one-time): https://www.kioskgroup.com/pages/kiosk-pro-pricing
- Rise Vision, *Yodeck Pricing: What Changed in 2026* (secondary; Free 1 screen, Basic $8, Premium $12, Enterprise $16 per screen per month from 1 April 2026): https://www.risevision.com/blog/yodeck-pricing ; Yodeck notice: https://www.yodeck.com/docs/user-manual/2026-yodeck-pricing-update/
- Pomofocus Premium features: https://pomofocus.io/ ; price $3/month, $18/year, $54 lifetime from secondary sources: https://pomodorian.app/pomodorian-vs-pomofocus , https://www.trustradius.com/products/pomofocus/pricing (not shown on the Pomofocus page itself; treat as secondary)
- Chrome Enterprise, *AllowWakeLocks* and *AllowScreenWakeLocks* policies: https://chromeenterprise.google/intl/en_uk/policies/allow-wake-locks/ , https://chromeenterprise.google/policies/allow-screen-wake-locks/ (platform scope not confirmed from the fetched page)
- Via [market.md](market.md) (fetched by that agent on 26 September 2026; not re-fetched here): RevenueCat 2026 benchmarks (≈ 72% year-one annual cancellations; 35% in month one) https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/ ; Classroomscreen pricing https://classroomscreen.com/pricing ; WordPress.org detailed plugin guidelines https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/ ; web.dev Betty Crocker case study https://web.dev/case-studies/betty-crocker ; HypeStat estimate for screenawake.com https://hypestat.com/info/screenawake.com (low reliability)
- Live site checked: https://awaketab.pages.dev/pro (renders "$19 once" with struck "$29", sandbox checkout links)

Repo (read 26–27 September 2026): `docs/research/growth-conversion.md`, `docs/research/market.md`, `docs/research/canvas-copy-audit.md`, `docs/redesign/{README,DECISIONS,agent-brief}.md`, `PRODUCT.md`, `docs/00-conventions.md` §8, `docs/01-brd.md` BR-07, BR-09, BR-12, §9, `docs/09-monetization-impl.md` §1–2, §4, §7, §8, `apps/web/src/pages/{pro,kiosk,embed}.astro`, `pages/pro/{activate,manage}.astro`, `apps/web/src/lib/{license,checkout,activate-page}.ts`, `apps/web/src/components/ToolPanel.astro`, `apps/web/src/tool/{pip,ctx}.ts`, `tool/ambient/logic.ts`, `tool/stats/panel.ts`, `apps/web/functions/api/webhooks/polar.ts`, `functions/_lib/{embed,license,token}.ts`, `apps/web/src/i18n/en.json`, `apps/extension/src/controller.ts`, `docs/LAUNCH-AUDIT.md`. Canvas boards: `Pro.dc.html`, `PageKiosk.dc.html`, `PageExtension.dc.html` (scratchpad `directions/project`).
