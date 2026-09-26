# Market research: keep-screen-awake tools

Status: v1.0 · 26 Sep 2026 · Prepared for Soubhik · Scope: competitors, demand, willingness to pay, positioning, distribution.

**Evidence labels.** **[V]** verified: the page was fetched and the figure or quote read on it. **[S]** secondary: from a search snippet, a third-party summary or a page that only partly rendered, so spot-check it before quoting it publicly. **[E]** estimate. **[O]** opinion or judgement (mine, from the evidence). Every external source was accessed on **26 Sep 2026** unless a different date is shown. Store numbers change daily, so treat them as a snapshot.

**What could not be measured.** Google Trends returned HTTP 429 to every request. SimilarWeb refused the connection, and Semrush has no public pages for these domains. Reddit, Stack Overflow and Super User block automated fetching. So this report has **no search-volume numbers and no reliable traffic numbers**. Demand is inferred from Google autocomplete (live, US English), store install counts, forum "me too" counts and news coverage. §3.5 lists what to pull by hand to close the gap.

---

## Summary for the owner

1. **Keeping a screen awake is free everywhere, so nobody will pay for the lock itself.** Amphetamine, PowerToys Awake, Caffeine, KeepingYouAwake, Google's Keep Awake extension and every web clone are free. Paid Mac utilities in this category cost $4–9 once. Pro has to sell the extras (the kiosk look, schedules, clock and ambient modes, extension auto-start), which it already does.
2. **Your prices are well placed; keep them.** $12/yr is the low end for small utilities: the RevenueCat utilities median is $34.99/yr, Pomofocus charges $18/yr and Classroomscreen $36/yr. Most money will come from the lifetime plan. Annual renewals are weak in general: about 72 % of annual subscribers cancelled in year one in 2026. Keep $29 lifetime, and end the $19 launch price exactly on 8 Dec 2026 as the /pro page says.
3. **The biggest gap in the market is "it doesn't work, and it doesn't say why."** That is the most common complaint in every keep-awake extension's reviews, including Google's. AwakeTab's status pill and "here's the fix" answer that complaint directly. Lead every store listing and comparison page with it.
4. **Google's own Keep Awake extension has 1M users and has not been updated since 4 Aug 2023.** That update broke it for many people, and support posts about it continue into 2026. It says it is meant for ChromeOS. AwakeTab for Chrome can be the maintained, honest alternative, especially for Chromebooks and schools.
5. **Teachers are an under-served group.** One review of a rival extension reads: "LIFESAVER in the classroom where our teacher laptops are set to 'sleep' every 10 minutes". Classroom tools like Classroomscreen show teachers pay about $36/yr. No page targets them yet.
6. **The loudest demand is one you've chosen not to serve: staying "green" on Teams.** Microsoft Q&A threads on it have 1,700+ and 1,200+ "same question" clicks. On Amazon, several jiggler listings each sell 3,000–6,000+ units a month. Microsoft's own docs say status follows inactivity, so a wake lock can't do it. Your honest Teams page will get traffic and help trust, but those visitors won't convert. Don't chase them.
7. **Some competitors sell that promise anyway.** screenawake.online advertises a "stealth F15 key" for Teams. keepawake.app calls itself a "browser mouse jiggler" and says it is "used by 47,291 remote workers". Wells Fargo fired more than a dozen staff in 2024 for faking keyboard activity. Refusing to fake activity is a genuine difference and is safe to say out loud.
8. **Search intent is mostly device-specific.** Autocomplete for "keep screen on" fills with iPhone, Android, iPad, Mac and Windows 11. Many of those people just need the setting, so the /on and /guides pages should give the setting first and the tool second. The best-fit phrases for the tool itself are "keep computer awake without software", "…without changing settings" and "keep laptop awake website/online".
9. **Recipe sites mostly have Cook Mode already.** WP Recipe Maker ($49+/yr) and Tasty Recipes include it in their paid tiers, and big publishers built their own. The embed is best treated as a way to get links from sites that lack it (free WP Recipe Maker users, Create users, sites not on WordPress), not as a revenue line.
10. **Kiosk pricing is fair:** $19 per site sits near Fully Kiosk (€8.90 per device) and Kiosk Pro ($24.99+ per device). Don't try to sell to IT departments: Chrome and PowerToys both give admins policies to switch these tools off, and I found no paid "enterprise keep-awake" market.
11. **Several community channels are closed to a freemium product.** r/InternetIsBeautiful excludes freemium services, r/productivity bans self-promotion outright, and r/software allows only open-source projects. Chrome Web Store "Featured" nominations closed on 20 Aug 2026. Use Show HN (with the library and the test matrix as the substance), Product Hunt, AlternativeTo, Edge Add-ons, and honest answers in help forums.
12. **This report has no search-volume numbers.** Pull Google Trends and Search Console data by hand (§3.5) before committing to new pages.

---

## 1. Competitor landscape

### 1.1 Web tools (the direct category)

At least 14 live sites do the same job. They split into honest tools with a wake-lock toggle and sites that also promise Teams presence.

| Site | What it offers | Money | Claims (verbatim where quoted) | Languages | Traffic |
|---|---|---|---|---|---|
| [nosleep.page](https://nosleep.page) | Ring toggle, 30m/1h/2h/custom, stats, themes | Nothing visible [V] | "Ensure this tab stays in the foreground (desktop) or unlocked (mobile)" [V] | EN | HypeStat shows no data [S] |
| [screenalwayson.com](https://www.screenalwayson.com) | Web tool + Chrome extension + Mac app | "All options are free to use" [V] | [Teams page](https://www.screenalwayson.com/keep-teams-green): the extension "Simulates activity on the Teams web app"; the Mac app "Simulates mouse movement to prevent idle" [V] | EN | Its extension has 252 users and 0 ratings [V] |
| [keep-screen-on.com](https://keep-screen-on.com) | Wake lock + video fallback, many SEO pages | Privacy text says it "may use third-party analytics or advertising services" [V] | None beyond the standard ones | EN | n/a |
| [screenawake.com](https://screenawake.com) | Tool, extension, clock pages, blog | "Completely free"; HypeStat detects AdSense [S] | Extension claimed to work "even when browser is hidden in background" [V] | 10 | [HypeStat](https://hypestat.com/info/screenawake.com): ≈22.7k visits/month, 45 % India, 22 % US [E, low reliability] |
| [screenawake.online](https://screenawake.online) | Timers + "anti-idle" | PayPal donations | "Stealth F15 key simulation… prevents Away status in Teams, Slack & Zoom"; "continues working in the background" [V] | 9 | n/a |
| [keepawake.app](https://www.keepawake.app/) | Calls itself a "browser mouse jiggler" | Free | Keeps Teams, Slack and Zoom active using "5 techniques including Wake Lock, Picture-in-Picture & AudioContext"; "Used by 47,291 remote workers" (unverifiable) [V] | n/a | n/a |
| [keep-awake.com](https://www.keep-awake.com) | Toggle | None | Most candid: "Only works while this tab stays open and visible" [V] | n/a | n/a |
| [nosleep.williamchong.cloud](https://nosleep.williamchong.cloud) | Wake lock, 1–480 min, floating window, open source | "Completely free with no ads" [V] | Standard | n/a | n/a |
| [nosleep.online](https://nosleep.online) | Timers, screensaver | Ko-fi | Says it "continues to function even if your internet connection drops" [V] | EN | n/a |
| keepscreenawake.org · noscreensleep.com · howtokeepscreenon.com · screenawake.space · keepscreenon.com | Thin toggles and guide sites | Mostly none; screenawake.space asks for UPI donations | Mostly honest about hidden tabs [V] | 1–8 | n/a |

**Rank snapshot.** These results came from Claude's US search tool, not Google, so this is not a Google ranking. For "keep screen awake online" the order was: the Chrome extension "Keep Awake (Display | System)", keepscreenawake.org, keep-screen-on.com, screenawake.com, keep-awake.com, screenawake.space, nosleep.page, screenawake.online, keepscreenon.com [V, 26 Sep 2026]. screenawake.com and keep-screen-on.com appeared in every related query [V].

**Reading [O].** The honest tools are all thin. The tools that make bigger claims are selling Teams presence. Nobody combines honest status, depth (until-time, persistence, PiP, alerts) and maintained code. The HN launch of nosleep.page ([252 points, 130 comments, 22 Apr 2022](https://news.ycombinator.com/item?id=31123522) [V]) shows the category can still earn attention. So does [Clocksimulator.com](https://news.ycombinator.com/item?id=47151784), a clock page that uses wake lock (131 points, 25 Feb 2026 [V]).

### 1.2 Browser extensions

Google's extension anchors the category. Everything else is small.

| Extension | Users | Rating (n) | Model | Last updated | Notes |
|---|---|---|---|---|---|
| [Keep Awake](https://chromewebstore.google.com/detail/keep-awake/bijihlabcfdnabacffofojgmehjdielb) (extensions@chromium.org) | 1,000,000 | 4.0 (500) | Free | 4 Aug 2023, v1.9 | "This extension makes it easy to temporarily disable power management on Chrome OS." No timer; state not remembered [V] |
| [Keep Awake your System or Display](https://chromewebstore.google.com/detail/kioaomfokioenhackhaijiebhhkkcojo) | 1,000,000 | 5.0 (3) | Free | 15 Mar 2026 | 1M users with 3 ratings looks inflated [V figure; O on inflation] |
| [Keep Awake (Display \| System)](https://chromewebstore.google.com/detail/apmicgkbejflkgeljipcebaoeigmangd) | 100,000 | 4.3 (47) | Free; opens its website on install | 27 Dec 2025 | Top web result for "keep screen awake online" [V] |
| [Caffeine – Keep Awake](https://chromewebstore.google.com/detail/fcblbbbkcneogddmpmfdchnocbpfpmag) | 80,000 | 4.2 (25) | Free | 21 Aug 2026 | Timer 5 min–24 h, download protection [V] |
| [Keep Awake (Thorium fork)](https://chromewebstore.google.com/detail/inglelmldhjcljkomheneakjkpadclhf) | 60,000 | 4.2 (6) | Free | 9 Mar 2023 | "Featured" badge [V] |
| [Stay Awake](https://chromewebstore.google.com/detail/gofaiibillcpfajafckhoieamembimje) | 10,000 | 4.7 (3) | Free | 29 Aug 2024 | [V] |
| [Keep Computer Awake (for a While)](https://chromewebstore.google.com/detail/imbpigcghoambmanjekibelfjemnnool) | 10,000 | 4.2 (12) | Free | 22 Feb 2023 | Countdown [V] |
| [ScreenAwake](https://chromewebstore.google.com/detail/kndaiollgpbnjgijdimhaobdejoaochh) | 3,000 | 5.0 (1) | Free | 13 Dec 2025 | Calls wake lock from a hidden offscreen page; probably fragile [V code read; O fragility] |
| [Virtual Mouse Jiggler](https://chromewebstore.google.com/detail/nfjplhbfoplapnmjnlakfehkefjlmiii) | 4,000 | 4.2 (28) | Free trial, then a paid key | 24 Sep 2026 | Largest of about 15 Teams/Slack "stay active" extensions, all under 5k users [V] |

**Edge Add-ons** (from the store's product-details endpoint [V]): the leader is [Keep Awake (Display | System)](https://microsoftedge.microsoft.com/addons/detail/jjaendaehnalocdginbjmaclfjgidlla) with 40,618 installs and 3.7 (3). Caffeine – Keep Awake has 31,584 and 3.7 (6). Google's Keep Awake is **not** on Edge.
**Firefox:** there is no `power` extension API, so add-ons use a looping video, a pop-up window or a per-site wake lock. The largest, [Keep Awake (Screen Only)](https://addons.mozilla.org/firefox/addon/keep-awake-screen-only/), has 2,979 users and was last updated in 2020 [V].

**What reviewers say (verbatim).**

- Google Keep Awake, [reviews](https://chromewebstore.google.com/detail/bijihlabcfdnabacffofojgmehjdielb/reviews) [V]:
  - Praise: "Works beautifully for me, thank you Keep Awake!" (5★, Jun 2025)
  - Complaint: "I tried this extension on my office laptop. IT DIDN'T WORK. So, I'm removing it now." (1★, Apr 2025)
  - Feature request: "I wish it would remember the settings I left it on." (4★, Jan 2025)
  - Support post, Aug 2023 (title verbatim, body [S]): "Keep Awake is no longer compatible with the recent version of Chrome."
- Caffeine – Keep Awake, [reviews](https://chromewebstore.google.com/detail/fcblbbbkcneogddmpmfdchnocbpfpmag/reviews) [V]:
  - "LIFESAVER in the classroom where our teacher laptops are set to 'sleep' every 10 minutes requiring us to stop a lesson and enter a password." (Dec 2025)
  - "I dunno about anyone else, but this thing doesn't seem to work. My computer still shuts down." (May 2026)
- Keep Awake (Display | System), [reviews](https://chromewebstore.google.com/detail/apmicgkbejflkgeljipcebaoeigmangd/reviews) [V]:
  - "After installation extension launches as window to their website which has large banner ads… Do not use." (Jun 2026)
  - "Linux, chrome, does nothing." (Feb 2026)
- No sleep, [reviews](https://chromewebstore.google.com/detail/bomdbfmieohagcjbfckpihndjdeeabgo/reviews) [V]: "doesn't work nor a way to tell if its enabled" (Aug 2023)
- Keep Computer Awake (for a While) [V]: "Wish this was baked into google slides natively when I present." (Mar 2020)
- Virtual Mouse Jiggler [V]: "I literally used to have so much anxiety of my boss seeing that my dot was gray and he thought I wasn't working." (Jul 2026)

**Complaint patterns [O, from about 40 listings].**
1. "Doesn't work", with no reason given, on every OS. This is the gap the status pill fills.
2. Google's v1.9 update broke users in Aug 2023 and no fix followed.
3. ChromeOS and external monitors still going to sleep.
4. The on/off state isn't remembered and the icon doesn't make it clear.
5. No timer or auto-off.
6. Ad-heavy install pages, and user counts that look inflated.
7. Teams jigglers break whenever Microsoft changes Teams URLs.
8. Surprise free trials in jigglers, and batches of same-day 5★ reviews.

### 1.3 Desktop apps

| App | Price / model | Platform | Maintained? | Reach | Strength | Weakness |
|---|---|---|---|---|---|---|
| [Caffeine (Zhorn)](https://www.zhornsoftware.co.uk/caffeine/) | Free | Windows | v1.98, Nov 2024 [V] | n/a | Works with nothing visible | Simulates an F15 keypress, which some apps pick up [V] |
| [Amphetamine](https://apps.apple.com/us/app/amphetamine/id937984704) | Free, no in-app purchases | macOS | v5.3.2, 10 Nov 2023, nearly 3 years old [V] | Rating count not exposed | Triggers, closed-lid mode | Unmaintained; the app also has a mouse-move option [S] |
| [KeepingYouAwake](https://github.com/newmarcel/KeepingYouAwake) | Free, MIT | macOS | v1.6.8, Sep 2025 [V] | 6,941 stars; 13,838 Homebrew installs/yr [V] | Simple, open source | No closed-lid mode; broke on Sequoia ([#220](https://github.com/newmarcel/KeepingYouAwake/issues/220)) [V] |
| [Lungo](https://sindresorhus.com/lungo) | $4 one-time (App Store) or Setapp [V; the developer's page says "free", which conflicts] | macOS | v2.8.3, 15 Sep 2026 [V] | Setapp: 99 % of 1,839 ratings [V] | Polish | Mac only |
| [Theine](https://apps.apple.com/us/app/theine/id955848755) | $8.99 one-time | macOS | v4.2, 24 Sep 2026 [V] | n/a | | "that single feature has been totally screwed up" (review, Sep 2024) [V] |
| [PowerToys Awake](https://learn.microsoft.com/en-us/windows/powertoys/awake) | Free, open source | Windows | PowerToys 0.101, Aug 2026 [V] | PowerToys repo 139k stars; Store 4.4 (3,542) [V] | Microsoft-made, CLI | "Awake doesn't function when the lock screen is displayed" [V]; [issue #31529](https://github.com/microsoft/PowerToys/issues/31529): "no longer keeps Microsoft Teams in an available status" [V] |
| [`caffeinate`](https://ss64.com/mac/caffeinate.html) | Built into macOS | macOS | n/a | n/a | `-d -i -s -t -w` flags | Terminal only |
| [Don't Sleep](https://www.softwareok.com/?seite=Microsoft/DontSleep) | Freeware | Windows | v10.22, Jun 2026 [V] | n/a | Portable | Windows only |
| [GNOME Caffeine](https://extensions.gnome.org/extension/517/caffeine/) | Free | Linux | v60 [V] | 3,063,079 downloads [V] | Native | GNOME only |

What users praise about Amphetamine: "Don't let the 'price' fool you—this is a polished, indispensible utility" ([App Store](https://apps.apple.com/us/app/amphetamine/id937984704), 2021) [V]. OS updates break these tools: [Tell HN: macOS Tahoe breaks Caffeine and other keep-awake apps](https://news.ycombinator.com/item?id=45300616) (Sep 2025) [V]. In 2026 there is a cluster of "keep the Mac awake while AI agents run" projects; only [Adrafinil](https://github.com/kageroumado/adrafinil) got traction on HN (124 points) [V]. All of them need lid-closed or system sleep control, which a browser tab cannot provide.

### 1.4 Mouse jigglers

| Kind | Examples | Price | Reach | Promise |
|---|---|---|---|---|
| USB/hardware (Amazon US listings) | [Vaydeer M4](https://www.amazon.com/dp/B08DTXPS51), [TECH8 USA](https://www.amazon.com/dp/B08V73BX53), [AUEDROT](https://www.amazon.com/dp/B09YTB1DSB), Meatanty | $15.90–24.99 for TECH8 variants [V]; "$4 to $40" across the category ([Banking Dive](https://www.bankingdive.com/news/wells-fires-employees-faking-productivity-finra/719033/)) [V] | Vaydeer M4: 4.5★, 9,876 ratings, "6K+ bought in past month". TECH8: 4.7★, 16,562 ratings. Six listings show 3K+ bought each month [V] | Undetectable movement; Liberty Mouse Mover claims "over-zealous IT departments can't track its use" [S] |
| Software | [Move Mouse](https://apps.microsoft.com/detail/9nq4ql59xlbf) (Store 4.4, 690 ratings), [Mouse Jiggler](https://github.com/arkane-systems/mousejiggler) (1,439 stars), Jiggler for Mac | Free | [V] | Keeps Teams green, beats forced screensavers |
| Browser | About 15 Teams/Slack extensions, keepawake.app, screenawake.online | Free, trials, subscriptions | Each under 5k users [V] | Status stays green |

**Why people use them.**
- **Microsoft's own docs.** Status "changes to **Away** if your desktop is inactive for more than five minutes", where inactive includes "You lock your computer" and "The computer enters idle or sleep mode" ([Teams troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/microsoftteams/teams-im-presence/presence-not-show-actual-status), updated 14 Jul 2025) [V]. The [admin doc](https://learn.microsoft.com/en-us/microsoftteams/presence-admins) says presence "becomes Away automatically if they're inactive for a few minutes or if the computer is locked; and it becomes Offline when the computer enters sleep mode" [V].
  - **What this means for AwakeTab [O]:** a wake lock can prevent the "Offline because asleep" case, but not the inactivity timer. Your Teams page should say exactly this.
- **The reviews:**
  - "The cure for being micromanaged… keeps my Teams status Online" (Move Mouse, 2020) [V]
  - "Keeps my Company forced Screensaver Away" (2019) [V]
  - "A must-have when speaking/presenting to large groups and corporate policy is overly restrictive" (2022) [V]
- **The consequences.** Wells Fargo fired "more than a dozen" employees after "allegations involving simulation of keyboard activity creating impression of active work" (FINRA wording via [Banking Dive](https://www.bankingdive.com/news/wells-fires-employees-faking-productivity-finra/719033/), 14 Jun 2024; [CBS](https://www.cbsnews.com/news/wells-fargo-fires-employees-faking-work/)) [V]. Employee-monitoring vendors publish ways to detect jigglers ([Time Doctor](https://www.timedoctor.com/blog/how-to-detect-mouse-jiggler/)) [V].
- **The demand spike.** [Vice](https://www.vice.com/en/article/mouse-mover-jiggler-app-keep-screen-on-active/) (Dec 2021): searches for "mouse jiggler" spiked in March 2020, and TECH8 saw "double-digit growth" [V]. The widely repeated "400 % sales rise" claim has **no primary source I could find**; don't use it.

### 1.5 Mobile

| Option | Price | Fact | Limit |
|---|---|---|---|
| iOS Auto-Lock "Never" | Built in | Settings > Display & Brightness [S] | [Low Power Mode](https://support.apple.com/en-us/101604) "Sets Auto-Lock to 30 seconds" [V]. On managed devices, "never" is allowed only for supervised or Device Enrollment; for User Enrollment "the user is unable to choose 'never.'" ([Apple deployment guide](https://support.apple.com/guide/deployment/passcode-payload-settings-dep4d6a472a/web)) [V] |
| Safari wake lock | Built in | Since [Safari 16.4](https://webkit.org/blog/13966/) (Mar 2023); fixed for Home Screen web apps in [18.4](https://webkit.org/blog/16574/) (Mar 2025) [V] | A developer comment on [WebKit bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545) (Oct 2024): "I have about 40 upset users who will need to migrate to Android devices." [V] |
| Android "Stay awake" | Built in | "Sets your screen to stay on while the device is plugged in" ([developer options](https://developer.android.com/studio/debug/dev-options)) [V] | Only while charging, and hidden in developer options |
| [Screen ON](https://play.google.com/store/apps/details?id=com.eonsoft.ScreenON) | Free with ads; in-app purchases $2.99–54.99 | 1M+ installs, 4.4 (19.9k) [V] | A review praises it for pointing to the native setting [V] |
| [Wakey](https://play.google.com/store/apps/details?id=com.doublep.wakey) | Ads; in-app purchases $2.99–7.99 | 500k+, 4.6 (9.45k) [V] | "It's using more battery… My phone would get warm." [V] |
| [Caffeine (tile)](https://play.google.com/store/apps/details?id=moe.zhs.caffeine) | Free; in-app purchases $1.99–89.99 | 500k+, 3.5 (3.43k) [V] | "My company gave me a one minute timeout." (praise) [V] |
| [Keep Screen On](https://play.google.com/store/apps/details?id=com.psoffritti.keepscreenon) | Ads + subscription | 100k+, 4.3 (5.07k) [V] | "Pay-walled basic functionality and 'free demo' is a lie. Requires credit card and auto-subscription" [V] |
| Recipe apps | [Paprika](https://www.paprikaapp.com/) $4.99 iOS / $29.99 Mac, one-time | "Paprika keeps your screen on when you open a recipe." iOS 4.9★ (53,879) [V] | App-only |

Stay Alive!, once the best-known Android keep-awake app, no longer has a Play Store page [V]. That it was removed in Apr 2024 after about 860k downloads is [S] only.

### 1.6 Kiosk and digital signage

| Product | Price | Screen-on / branding |
|---|---|---|
| [Fully Kiosk Browser](https://www.fully-kiosk.com/) (Android) | "8.90 € (or 10.99 US$) + tax per device", one-time PLUS licence [V]; Play 500k+, 4.0 [V] | Keep Screen On, schedules, motion wake; watermark without a licence [S]. Review: "the one time payment for all the features sets Fully Kiosk apart" [V] |
| [Kiosk Pro](https://www.kioskgroup.com/pages/kiosk-pro-pricing) (iPad) | Lite $5/mo per device; Basic $24.99, Plus $49.99, Enterprise $99.99 one-time per device [V] | Turns Auto-Lock off by default |
| [SiteKiosk](https://www.capterra.com/p/120108/SiteKiosk/pricing/) | $180 one-time (Classic) or $239/yr per device (Online) [S] | Full lockdown |
| [ChromeOS Kiosk & Signage](https://www.ctl.net/products/google-kiosk-annual-license) | $25 per device per year (reseller) [V] | Power policies in the admin console |
| [Yodeck](https://www.yodeck.com/pricing/) · [OptiSigns](https://www.optisigns.com/pricing) · [ScreenCloud](https://screencloud.com/pricing) | $8–16, $9–40.50 and $20–30 per screen per month [V]. Yodeck is free for 1 screen; OptiSigns is free for 3 but shows its logo | Content management, scheduling, screen on/off hours |

**Reading [O].** Kiosk buyers pay per device for lockdown, remote management and content. AwakeTab's kiosk licence only brands an awake screen. That is useful for a dashboard wall, but it is not a kiosk browser, as /for/kiosk already says.

### 1.7 Recipe "Cook Mode" (the embed market)

| Provider | Cook Mode | Price |
|---|---|---|
| [WP Recipe Maker](https://help.bootstrapped.ventures/docs/wp-recipe-maker/prevent-sleep-toggle/) (50k+ installs) | "Prevent Sleep" toggle, **paid tiers only** [V] | Premium $49/yr, Pro $99, Elite $149 for 1 site [V] |
| [Tasty Recipes](https://www.wptasty.com/cook-mode) | In all paid plans, not in Lite [V] | $49 first year, then $99/yr for 1 site [V] |
| [Create](https://wordpress.org/plugins/mediavine-create/) (6k+ installs) | No wake lock found; has "Interactive Mode" [V for what was found] | Free; Pro $150/yr [V] |
| Big publishers | EatingWell (Sep 2024) [S]; The Kitchn "Cook Mode+" (Oct 2025, [AOL syndication](https://www.aol.com/articles/introducing-cook-mode-191500104.html)) [V]; BBC Good Food app "Keep your recipe on-screen while you cook with Cook Mode" ([App Store](https://apps.apple.com/gb/app/good-food-recipe-finder/id533785308)) [V] | Built in-house |

**Evidence publishers value it.** In Betty Crocker's [web.dev case study](https://web.dev/case-studies/betty-crocker) (Dec 2019–Jan 2020), people who turned on the wake lock had "3.1× longer" sessions, a "50% lower" bounce rate and "about 300% higher" purchase-intent indicators [V]. This compares users who chose the feature with all users; it was not an A/B test, so the people were self-selected. If /embed cites it, say so.

### 1.8 Competitor matrix

| Category | Examples | Price / model | Strengths | Weaknesses | Users praise | Users complain | AwakeTab's honest answer |
|---|---|---|---|---|---|---|---|
| Web toggles | nosleep.page, screenawake.com, keep-screen-on.com, keep-awake.com | Free; some ads or donations | No install, instant | Thin, same features everywhere; status not verified; hidden-tab limit | Simplicity | (few public reviews) | Honest pill, until-time, persistence, alerts, PiP, 8 languages, no ads on the awake screen |
| Web tools that over-claim | screenawake.online, keepawake.app | Free / donations | Promise Teams green | Claims a browser can't honour; policy risk | — | — | Refuse; publish the tested answer |
| Keep-awake extensions | Google Keep Awake (1M), Caffeine (80k), Display\|System (100k) | Free | Work with the tab hidden (`chrome.power`) | Google's is unmaintained; silent failures; no timers; ad-heavy install pages | "Works beautifully", "Essential for presentations" | "Doesn't work", "no way to tell if its enabled", "remember the settings" | AwakeTab for Chrome: Screen/System levels, timers, badge, honest popup, remembers state |
| Jiggler extensions | Virtual Mouse Jiggler, Wiggle Teams | Trials / paid | Teams green (sometimes) | Breaks on Teams URL changes; surprise paywalls; review padding | Less anxiety about the grey dot | "only a free trial", "Does NOT work now!" | Not in scope; never a sponsor category |
| Desktop apps | Amphetamine, PowerToys Awake, Caffeine, KeepingYouAwake, Lungo, Theine | Free, or $4–9 one-time | Native, closed-lid (Amphetamine), no visible window | Install/admin rights needed; OS updates break them; Mac or Windows only | "polished, indispensible" | "no longer keeps Teams available"; broke on a new macOS | Point to them honestly on /vs when they fit better; AwakeTab wins where installing isn't allowed |
| Hardware jigglers | Vaydeer, TECH8, Meatanty | $4–40 | Invisible to the computer, works anywhere | Detectable by pattern; employment risk | "cure for being micromanaged" | Detection, firings | Say plainly on /vs/mouse-jigglers what AwakeTab won't do |
| Mobile apps | Screen ON, Wakey, Caffeine tile | Ads, in-app purchases, subscriptions | Per-app, system-wide | Ads, battery, subscription traps | Works when IT sets a 1-minute timeout | "free demo is a lie" | Web tool, no ads, no subscription trap; says when Low Power Mode overrides it |
| Kiosk / signage | Fully Kiosk, Kiosk Pro, Yodeck | €8.90–$99.99 per device one-time; $8–40 per screen per month | Lockdown, remote management | Cost, setup | One-time pricing | — | Branded awake screen at $19 per site, never pitched as a kiosk browser |
| Recipe plugins | WPRM, Tasty | $49–149/yr | Cook Mode bundled with the recipe card | Paid tiers only | — | — | Free widget with attribution for sites without Cook Mode |

---

## 2. Demand map

### 2.1 Query themes (Google autocomplete, US English, live 26 Sep 2026 [V])

Autocomplete shows what people type, not how many. It is the only live demand signal I could get. [Endpoint](https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=keep%20screen%20on).

| Seed | Top completions (in order) |
|---|---|
| keep screen on | iphone · android · ipad · while viewing · macbook · when laptop closed · mac · longer iphone · windows |
| keep screen awake | iphone · **website** · mac · android · ipad · windows 11 · **chrome extension** · macbook · app |
| stop screen from turning off | iphone · (bare) · android · windows 11 · mac · ipad · macbook · windows · when watching videos · samsung |
| prevent computer from sleeping | (bare) · automatically when the display is off · mac · when closing lid · **while downloading** · **website** · windows 11 · automatically · registry · **group policy** |
| keep laptop awake | when closed · **website** · **online** · when lid closed · mac · app · when closed windows 11 · device |
| keep computer awake without | **software** · touching the mouse · **mouse jiggler** · **changing settings** |
| keep computer awake for | a while · **remote desktop** · remote connections |
| keep iphone screen on | longer · all the time · while charging · for certain apps · **for recipe** · shortcut · temporarily |
| keep screen on during | **call** (Android, Samsung, iPhone) · airplay · CarPlay · timer |
| keep teams | **green** · active · status green · active on phone · from showing away · **reddit** |
| mouse jiggler | amazon · download · app · **online** · near me · mac · software · **for teams** · reddit |

Local languages: es "mantener pantalla encendida" → pc, samsung, android, laptop, iphone, windows 11. de "bildschirm anlassen" → iphone, samsung, ipad, laptop, zugeklappt. pt-BR "manter tela ligada" → samsung, notebook, iphone, **xiaomi**. ja "画面 消えないようにする" → iphone, android, ipad. zh "屏幕常亮" → app [V]. **Reading [O]:** outside English, Android brands (Samsung, Xiaomi) take a bigger share of the completions, and so do "laptop closed" variants.

### 2.2 Where the people are (personas, from proxies)

| Theme | Evidence | Size [E, ranked from proxies] | Tool fit | Best page |
|---|---|---|---|---|
| Teams / "stay green" | MS Q&A: [1,700+](https://learn.microsoft.com/en-us/answers/questions/4435380/how-do-you-stop-damn-microsoft-teams-from-changing) and [1,200+](https://learn.microsoft.com/en-us/answers/questions/4419859/change-or-disable-the-5-minute-idle-time-in-teams) "same question" [V/S]; jiggler listings at 3K–6K+ a month [V] | Very large | **None, by choice** | /learn/does-a-wake-lock-keep-teams-green, /vs/mouse-jigglers |
| Phone/tablet screen timeout (iPhone, Android, iPad, Samsung) | Dominates every autocomplete seed [V]; Play apps with 1M+/500k+ installs [V] | Very large | Partial: most people need the setting; the tool helps under MDM or when they don't want to change settings | /on/*, /guides/iphone-auto-lock-never-greyed-out, /guides/android-screen-timeout-one-app |
| Locked-down work or school computer (Priya, teachers) | HN top use case [V]; Apple "configured by a profile", 200+ Me too ([thread](https://discussions.apple.com/thread/255172535)) [V]; "prevent… group policy", "without changing settings", "without software" completions [V]; teacher and office-laptop reviews [V]; [Chromebook help](https://support.google.com/chromebook/answer/3420029): at work or school "you might not be able to change your sleep settings" [V] | Large | **Strong**, the core fit | /, /for/work-laptop, /on/chromebook |
| Chrome/ChromeOS extension users | Google Keep Awake 1M users, unmaintained [V] | Large | Strong (extension) | /extension |
| Downloads, remote desktop, long jobs, AI agents | "while downloading", "for remote desktop" completions [V]; HN agent-app cluster 2026 [V] | Medium | Partial: display yes, lid-closed no; system sleep varies by OS | /for/downloads, /for/ai-agents |
| Cooking / recipes | "keep iphone screen on for recipe" [V]; Apple iPad cooking thread, 74 Me too ([thread](https://discussions.apple.com/thread/3507374)) [V]; publishers building Cook Mode [V] | Medium, seasonal | Strong on sites without Cook Mode; iPad Split View | /for/cooking, /embed |
| Presentations / lecturers | Extension reviews: "Essential for presentations and meetings" [V] | Medium | Strong with PiP or the extension | /for/presentations |
| Video calls ("keep screen on during call") | Autocomplete [V] | Medium (mostly phone calls) | Partial | /for/video-calls |
| Dashboards / kiosks (Tomás) | Signage and kiosk markets are healthy [V] | Small, highest willingness to pay | Strong for walls; not lockdown | /for/dashboards, /kiosk |
| Laptop lid closed | "when closed", "when lid closed windows 11" [V] | Large | **None** (no browser can) | /guides/mac-prevent-sleep-lid-closed; Windows is not covered yet |

### 2.3 Seasonality [S/E]

- **Recipes.** Searches peak on Thanksgiving Day and November is the top recipe month, per [Search Engine Land](https://searchengineland.com/thanksgiving-recipes-searches-peak-thanksgiving-day-44-happening-mobile-209182) [S; page returned 403, snippet only]. Expect /for/cooking and /embed interest to rise from November through the holidays.
- **Remote work.** The jiggler spike in March 2020 is documented [V, Vice]. No 2026 seasonality found.
- **School terms.** No data. Classroom demand should follow the academic calendar (Aug–Sep, Jan starts) [E].

### 2.4 Largest personas, in order [O]

1. Locked-down work and school laptops (Priya, teachers).
2. Chrome/ChromeOS extension users.
3. Phone and tablet users under MDM or Low Power Mode.
4. Cooks.
5. Presenters.
6. Long-job and developer users (Kenji).
7. Dashboard and kiosk operators (Tomás): smallest group, most willing to pay.

The Teams crowd is bigger than all of these but sits outside the product on purpose.

### 2.5 Close the data gap (by hand, 1–2 hours)

- **Google Trends,** worldwide and US, 5 years: compare "keep screen on", "keep screen awake", "mouse jiggler", "keep teams green", "keep laptop awake". Save CSVs into `docs/metrics/`.
- **Search Console,** 28 days after launch: check the 25 tracked queries in `docs/18-analytics-kpis.md` §5 and add the new themes above ("without software", "without changing settings", "remote desktop", "for recipe", "during call", "lid closed windows 11").
- **Rechecks in 60 days:** Chrome Web Store user counts for Google Keep Awake and Caffeine, to see if Google's decline is showing.

---

## 3. Willingness to pay

### 3.1 What comparable products charge

| Product | Price | Model | Source |
|---|---|---|---|
| Amphetamine, PowerToys Awake, Caffeine, KeepingYouAwake, Google Keep Awake | $0 | Free | above [V] |
| Lungo · Theine · Magnet | $4 · $8.99 · $4.99 | One-time | App Store [V] |
| BetterTouchTool | $15 with 2 years of updates / $25 lifetime | Time-limited or lifetime | [folivora.ai/buy](https://folivora.ai/buy) [V] |
| CleanShot X | $35 one-time with 1 year of updates, then $19/yr | Perpetual + update plan | [cleanshot.com/pricing](https://cleanshot.com/pricing) [V] |
| Pomofocus Premium | $3/mo · $18/yr · $54 lifetime | All three | [S] |
| Classroomscreen Pro | $36/yr ($3/mo, billed yearly); schools $525/yr for 25 licences | Yearly | [classroomscreen.com/pricing](https://classroomscreen.com/pricing) [V] |
| Momentum Plus | $39.95/yr | Yearly only | [momentumdash.com/plus](https://momentumdash.com/plus) [V] |
| Raycast Pro · Noisli · Brain.fm | $96/yr · $120/yr · $99.99/yr | Yearly | [V] |
| Paprika (Mac) · Crouton Plus · Mela+ | $29.99 · $24.99 · $6.99 | One-time | App Store [V] |
| RevenueCat median, Utilities | $7.99/mo · $34.99/yr | Subscription | [State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps) [V, summarised] |

### 3.2 Subscription vs lifetime

- **Annual plans churn hard.** "~56% of annual subscribers cancelled in Year 1 in 2025, while this worsened to ~72% in 2026", and "the first month accounts for 35% of all annual cancellations" ([RevenueCat, 19 Mar 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/)) [V].
- **Freemium converts poorly next to hard paywalls.** RevenueCat reports median Day-35 conversion of 10.7 % for hard paywalls vs 2.1 % for freemium, and revenue per install of $3.09 vs $0.38 [V]. Those are figures for installed mobile apps. An anonymous visitor to a web tool is a much colder lead.
- **Freemium extensions.** One developer reports 0.8 % free-to-paid across five extensions (range 0.3–1.4 %) ([dev.to](https://dev.to/ktg0215/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga)) [V, single anecdote].
- **No benchmark exists for visitor-to-paid on free web tools.** I found none. The blueprint assumes 0.06–0.35 % of monthly uniques. That is plausible given the numbers above but **unverified** [E].
- **Kitchen and utility buyers already pay once.** Paprika, Crouton, Lungo, Theine, Fully Kiosk and Kiosk Pro are all one-time purchases [V]. The review "the one time payment for all the features sets Fully Kiosk apart" [V] shows the preference.

### 3.3 Fee maths (Polar Starter: 5 % + 50¢; +1.5 % on international cards) ([Polar fees](https://polar.sh/docs/merchant-of-record/fees) [V])

| Plan | Fee | Share |
|---|---|---|
| $12/yr | $1.10 ($1.28 international) | 9.2 % (10.7 %) |
| $19 launch lifetime | $1.45 | 7.6 % |
| $29 lifetime | $1.95 | 6.7 % |

[Dodo Payments](https://dodopayments.com/pricing) charges 4 % + 40¢ (+1.5 % international, +0.5 % on subscriptions) [V]. It is slightly cheaper on small tickets, which is worth remembering for the UPI rail (R10).

### 3.4 Assessment of $12/yr and $19 → $29 lifetime

- **$12/yr is well placed [O].** It is a third of the utilities median ($34.99) and below Pomofocus ($18), Classroomscreen ($36) and Momentum ($39.95). For a tool most people use in bursts, a low yearly price is right. Raising it would put it next to far richer products. A monthly plan would add churn and fee drag (the 50¢ fixed fee), so keep not offering one.
- **$29 lifetime is well placed [O].** It is 2.4× the yearly price, in line with BetterTouchTool (lifetime ≈ 1.7× its 2-year price) and Pomofocus (3× yearly). It also matches kitchen-app one-time prices ($24.99–29.99). Given 72 % year-one annual churn and no accounts or email to remind people about renewals, **expect lifetime to be most of Pro revenue** [E]. The yearly plan still earns its place as the cheap entry and the anchor.
- **The $19 launch price is fine [O]** only because it has a real, published end date (8 Dec 2026). At $19 (1.6× yearly), almost everyone will pick lifetime during the window. Keep the date fixed. Do not extend it, and do not add a countdown or "only N left" copy. The existing repricing rules (R5: $19 permanently if conversion is under 0.05 %; $39 if over 0.4 %) are sound. Leave them.
- **What Pro should lead with [O].** The things buyers of similar tools pay for: kiosk and logo branding (Tomás), schedules and extension auto-start (Priya, Lena), and clock/night/message ambient modes (cooks, lecturers, bedside use). Keep the lock itself free, as `00-conventions` §8.2 guarantees.

### 3.5 B2B angles

| Angle | Market price | AwakeTab price | Verdict [O] |
|---|---|---|---|
| Recipe publisher embed | WPRM $49+/yr and Tasty $49–99+/yr bundle Cook Mode with the recipe card; big sites build their own | $29/yr per site to remove attribution | Keep the price, but treat it as **distribution**. Buyers are sites without Cook Mode (free WPRM, Create, non-WordPress). Expect few licences. The attributed backlinks are the real value. |
| WordPress plugin wrapper (option) | WP.org rules: credit links "must be optional and default to *not* show"; no locked "trialware" ([guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/)) [V] | Free | Would reach WPRM/Create users, but the attribution backlink must be opt-in. The benefit is reach, not links. Worth doing after launch if /embed gets traction. |
| Kiosk / dashboard | Fully Kiosk €8.90/device; Kiosk Pro $24.99–99.99/device; ChromeOS kiosk $25/device/yr; signage $8–40/screen/month | $19 per site · $49 for five | Fair. Don't raise it before there is demand; the price-review gate is G5. |
| IT-managed laptops | No enterprise keep-awake market found. IT can switch tools off: Chrome `AllowScreenWakeLocks`/`AllowWakeLocks` policies ([Chrome Enterprise](https://chromeenterprise.google/policies/allow-screen-wake-locks/)) [S, policy text didn't render]; PowerToys Awake GPO ([docs](https://learn.microsoft.com/en-us/windows/powertoys/grouppolicy)) [V]; an admin asking how to block wake locks ([Chrome community](https://support.google.com/chrome/thread/189183856)) [S] | none | **Don't sell to IT.** Publish an honest "for IT admins" note: what AwakeTab does, and how to block or allow it. It builds trust and costs nothing. |
| Classrooms | Classroomscreen Organization plan: $525/yr for 25 licences [V] | Pro | A future school or organisation plan is possible, but only once there is real classroom traffic [O]. |

---

## 4. Positioning

**Positioning statement (proposed, consistent with BRD §3).**
For people who need a screen to stay on and can't or won't change system settings, AwakeTab is the keep-awake tab that shows, honestly, whether it's working, and says why when it isn't. Every other keep-awake tool leaves "doesn't work" to its reviews. AwakeTab's status reflects what the browser has actually granted, and it never fakes activity to keep you "green".

**Why this holds up (evidence).**
- The #1 complaint across roughly 40 extensions is silent failure: "doesn't work nor a way to tell if its enabled" [V]. AwakeTab's pill copy "Blocked — here's the fix" is the direct answer.
- The category leader is abandoned: Google Keep Awake, unchanged since Aug 2023 [V]. Native tools break on OS updates (macOS Tahoe, Sequoia) [V]. A maintained, tested product with a support matrix is scarce.
- The over-claimers are the only ones promising Teams presence, and Microsoft's docs contradict what they sell [V]. Refusing is both honest and a safe position given Wells Fargo [V].

**Under-served segments [O].**
1. **Teachers and school Chromebooks.** Forced 10-minute sleeps, managed devices, an abandoned Google extension. No /for page targets them.
2. **Firefox users.** Extensions there are weak for lack of a `power` API. The web tool is the best available answer.
3. **iPhone and iPad Home Screen users.** Wake lock only works there since iOS 18.4, and older guides are out of date.
4. **Recipe sites without Cook Mode.** A free, attributed widget.
5. **Windows users asking about a closed laptop lid.** Big demand and no honest answer page. The honest answer is "you can't from a browser; here's the OS setting and its trade-offs".

**Risks.**

| Risk | Evidence | Likelihood / impact [O] | Mitigation |
|---|---|---|---|
| Teams-green visitors bounce and rate the product low | Demand is huge [V]; competitors promise it [V] | High / Medium | Answer in the first 100 words of the Teams page and on /vs/mouse-jigglers; never target it in titles; keep the rating prompt only after a 5th real session (already built) |
| Admins block wake locks | Chrome policies exist [S]; admins ask how [S] | Medium / Medium | Pill shows `denied` honestly; "for IT admins" note; don't market as a policy bypass |
| Employer-policy ethics (Priya) | CIS benchmark: lock after ≤ 900 s [S]; firings for simulated input [V] | Medium / High for trust | Copy distinguishes the display timeout from a security lock policy (/guides/lock-screen-vs-sleep); never promise to defeat a lock |
| Browser/OS changes | Google's own extension broke in 2023 [V]; macOS updates broke native tools [V]; iOS Low Power Mode forces 30 s [V] | Medium / High | Support-matrix refresh on each release (already planned); canary before extension updates, since recent reviews now count more in the rating [V] |
| Chrome Web Store changes | Featured badge being retired; new publishers get 2 extension slots by default; recent reviews weigh more ([CWS blog, 20 Aug 2026](https://developer.chrome.com/blog/cws-review-updates-2026)) [V] | Certain / Low–Medium | Don't plan on Featured; ship one extension; protect ratings with careful releases |
| Crowded SEO | 14+ clones; "caffeine alternative" already targeted by 5+ sites [V] | High / Medium | Win on depth, tested research, library links and honesty; follow Search Console data |
| Pro doesn't convert | No web-tool benchmark; free substitutes everywhere [V] | Medium / Medium | Repricing rules R5; Pro framed as extras, never the lock |
| Hidden-tab limit misunderstood | Memory Saver discards background tabs ([Chrome blog](https://developer.chrome.com/blog/memory-and-energy-saver-mode)) [V] | Medium / Low | The pill already shows "Paused — tab hidden"; point people to the extension |

---

## 5. Distribution

### 5.1 SEO by page type

| Page type | Demand signal | Competition | Priority [O] | Note |
|---|---|---|---|---|
| Home `/` | "keep screen awake website", "keep laptop awake online", "keep computer awake without software / changing settings" [V] | 14+ thin clones | **Highest** | Put "without installing anything / without admin rights" in the title or H1 area and the first 100 words (copy change only) |
| `/on/{device}` | Device terms dominate autocomplete [V] | Apple, Microsoft and how-to sites own the settings answers | High | Give the native setting first, then when AwakeTab helps (MDM, Low Power, not wanting to change settings). Honesty is also what ranks. |
| `/guides/*` | "screen timeout windows 11", "…group policy", "lid closed" [V] | Microsoft/Apple docs, How-To Geek | Medium | Long-tail. A Windows lid-closed guide is a gap (route change, see actions) |
| `/for/*` | "for recipe", "while downloading", "during call", "for remote desktop" [V] | Clones with 220–360-word pages | High | Depth wins; add classroom and remote-desktop pages when data supports them |
| `/vs/*` | "caffeine alternative" etc.; no public volumes; 5+ sites already target them [V] | Medium | Medium | Useful for links and AlternativeTo visitors; `mouse-jigglers` doubles as the honesty page |
| `/learn/*` | "keep teams green" (large) [V]; developer terms | Low for honest content | High for the Teams page; medium for the rest | The Teams page is the one most likely to earn links |

### 5.2 Store listings (Chrome Web Store and Edge)

- **Chrome Web Store** ([discovery](https://developer.chrome.com/docs/webstore/discovery), [listing rules](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements)) [V]:
  - Ranking uses ratings and installs vs uninstalls over time, and recent reviews now count more.
  - Repeating a keyword more than 5 times is prohibited.
  - "Established publisher" is automatic for verified publishers.
  - Featured is being retired.
  - `apps/extension/store/listing.md` already has "Keep Screen Awake" in the store title and a no-jiggling line.
  - Add, in plain words, what reviewers ask for: timer, remembers its state, a badge that shows whether it's on, and it tells you when Chrome refuses. Don't name Google's extension in the listing.
- **Edge Add-ons** ([publish docs](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)) [V]:
  - Up to 7 hidden search terms and 6 screenshots.
  - The category leader has about 40k installs and Google's extension is absent, so ranking there is easier [O].
- **Firefox:** not in v1, which is correct. A later add-on could hold a wake lock from a small pop-up window, as Caffeine does [V mechanism], with honest limits. Low priority.

### 5.3 Launch channels and community rules

| Channel | Rule (verbatim where quoted) | Fit [O] |
|---|---|---|
| [Show HN](https://news.ycombinator.com/showhn.html) | Something people "can play with"; "The project should be non-trivial. Don't post quickly-generated one-offs"; no landing pages; no organised upvoting [V] | **Good** if the post leads with the MIT library and the tested support matrix, and the tool is the demo. Past results: nosleep.page 252 points, Clocksimulator 131 [V] |
| [Product Hunt](https://www.producthunt.com/launch) | Launch at 12:01 am PT; ask people to "visit and comment", not upvote; featured if Useful, Novel, High Craft, Creative; undifferentiated products aren't featured ([help](https://help.producthunt.com/en/articles/9883485)) [V] | Medium. Lead with craft (pill, PiP, cook mode, OLED clock), not "another keep-awake page" |
| r/InternetIsBeautiful | Excludes "freemium tiered services", extensions and sites that aren't unique; 90/10 rule [S via rankhog] | **Probably ineligible** because of Pro. Don't post. |
| r/productivity | "Self-promotion is not allowed here in any form" [S] | No |
| r/software | Own software only if open source [S] | Library only |
| r/webdev | Projects only on Showoff Saturday [S] | Library + demo |
| r/chrome_extensions | Chrome-extension posts [S] | Extension |
| r/macapps · r/sysadmin | Mac apps only · no promotion [S] | No |
| [AlternativeTo](https://alternativeto.net/software/nosleep-page/about/) | nosleep.page: 2 likes, 42 alternatives; Caffeine: 92 likes; Amphetamine: 52 [V] | List AwakeTab against nosleep.page, Caffeine, Amphetamine, PowerToys Awake and Keep Awake |
| Help forums (Apple Communities, MS Q&A, Chromebook Help) | Threads with 74–1,700+ "me too" [V] | Answer with the native setting first; mention AwakeTab only when it's the answer, with disclosure; check each forum's rules first |

Reddit's own rule pages couldn't be fetched, so every Reddit rule above is [S]. Read each subreddit's sidebar before posting.

### 5.4 Partnerships [O]

- **Recipe bloggers without Cook Mode** (free WPRM, Create, Squarespace/Wix/Ghost). Offer the free widget with attribution; the Betty Crocker data, with its caveat, is the pitch.
- **Teacher communities.** Classroom tools and teacher newsletters. Relevant because classroom laptops sleep every 10 minutes [V].
- **Developers.** Answer existing wake-lock questions with code and disclosure. List `@awaketab/wake` as the maintained alternative to NoSleep.js in comparison pages. Don't open promotional issues on other projects.
- **Lecture/presentation tools.** No evidence of a partner route. Skip for now.

---

## 6. Prioritised actions

Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week. Anything that adds a route or slug needs a `docs/00-conventions.md` §7 update first (a CLAUDE.md contract).

| # | Action | Why (evidence) | Effort | Impact | Where in repo / design |
|---|---|---|---|---|---|
| 1 | Lead store listings and /vs copy with "tells you when it isn't working, and why" | #1 complaint across ~40 extensions is silent failure [V §1.2] | S | H | `apps/extension/store/listing.md`; `apps/web/src/content/vs/en/*.md` |
| 2 | Add to the extension listing what reviewers ask for: timer, remembers state, clear badge, Screen/System | Google Keep Awake reviews and support posts [V] | S | H | `apps/extension/store/listing.md` (detailed description) |
| 3 | Publish on Edge Add-ons on the same day as Chrome, using all 7 search terms | Edge leader ≈ 40k installs, Google absent [V] | S | M | `apps/extension/store/listing.md`; Edge dashboard |
| 4 | Home title/H1-area copy: "no install, no admin rights, no settings changes" | Autocomplete: "without software", "without changing settings", "website/online" [V] | S | H | `apps/web/src/pages/index.astro` + i18n strings; docs/06 §4 title rules |
| 5 | Make the Teams page the best answer online: quote Microsoft's "Away… inactive for more than five minutes", explain the Offline-on-sleep nuance, test dates | 1,700+/1,200+ MS Q&A threads [V/S]; Microsoft docs [V] | S | H (links, trust) | `apps/web/src/content/learn/en/does-a-wake-lock-keep-teams-green.md` |
| 6 | In /on pages, give the native setting before the tool (Auto-Lock, Samsung "keep screen on while viewing", Android "Stay awake") | Device terms dominate intent; most people just need the setting [V] | M | H | `apps/web/src/content/on/*` |
| 7 | Keep $12/yr and $29 lifetime; hold the 8 Dec 2026 end of the $19 price exactly; no countdowns | Pricing benchmarks and annual churn [V §3] | S | M | `/pro` page copy; `docs/09-monetization-impl.md` §8.4 (no change needed) |
| 8 | Track lifetime vs yearly share and refund rate from the first Pro sale; review at 60 days with the R5 rules | No web-tool conversion benchmark exists [§3.2] | S | M | `docs/metrics/`, Polar dashboard |
| 9 | Show HN built around the library + tested matrix + honest Teams test; tool as demo | Show HN "non-trivial" rule; category precedent 252 and 131 points [V] | S | H | `/library`, `/learn/how-we-tested`; launch per `docs/17-launch-checklist.md` |
| 10 | Product Hunt a different week from Show HN, craft-led assets (pill states, PiP, OLED clock, Cook Mode) | Featuring criteria [V] | M | M | OG/screenshot assets; design canvas |
| 11 | List on AlternativeTo against nosleep.page, Caffeine, Amphetamine, PowerToys Awake, Keep Awake | Existing pages and likes [V] | S | M | external |
| 12 | Only post where rules allow: r/webdev Showoff Saturday and r/software (library, MIT), r/chrome_extensions (extension). Skip r/InternetIsBeautiful and r/productivity | Subreddit rules [S] | S | M | external |
| 13 | Propose `/for/classroom` (teachers, school Chromebooks); docs first | Teacher review [V]; Chromebook help [V]; Classroomscreen pricing [V] | M | M | `docs/00-conventions.md` §7 → `docs/06` §12.1 → `apps/web/src/content/for/` |
| 14 | Propose a Windows "laptop lid closed" guide with the honest "a browser can't" answer; docs first | "keep laptop awake when closed windows 11" [V] | M | M | `docs/00` §7 → `docs/06` §12.4 → `apps/web/src/content/guides/` |
| 15 | Add a short "For IT admins" section (what it does, how to block via Chrome policy or the extension blocklist) | Admin policies exist [V/S]; trust | S | M | `/for/work-laptop` FAQ or `/about` |
| 16 | Reframe /embed around sites without Cook Mode; cite Betty Crocker with the self-selection caveat | WPRM/Tasty bundle it [V]; web.dev case study [V] | S | M | `apps/web/src/pages/embed.astro`; `docs/11-embed-spec.md` |
| 17 | Later: WordPress plugin wrapper for the embed, attribution opt-in (WP.org guideline 10) | Plugin rules [V]; WPRM free users lack Prevent Sleep [V] | L | M | new package (plan in `docs/11` first) |
| 18 | Pull Google Trends and add the new query themes to the Search Console tracking list | Volumes could not be measured [§2.5] | S | M | `docs/18-analytics-kpis.md` §5 (docs update), `docs/metrics/` |
| 19 | Prioritise Samsung and Xiaomi notes in es / pt-br / de pages | Local autocomplete [V] | M | M | `apps/web/src/content/on/{es,pt-br,de}/`; `/on/samsung-internet` |
| 20 | Release discipline for the extension: canary and a manual check before each store update | Recent reviews now count more [V]; Google's 2023 break [V] | S | H | `docs/14-devops.md`; `apps/extension` release scripts |

---

## Sources (all accessed 26 Sep 2026)

**Extensions:**
- Chrome Web Store listings and reviews:
  - Keep Awake: https://chromewebstore.google.com/detail/keep-awake/bijihlabcfdnabacffofojgmehjdielb
  - Keep Awake your System or Display: https://chromewebstore.google.com/detail/kioaomfokioenhackhaijiebhhkkcojo
  - Keep Awake (Display | System): https://chromewebstore.google.com/detail/apmicgkbejflkgeljipcebaoeigmangd
  - Caffeine – Keep Awake: https://chromewebstore.google.com/detail/fcblbbbkcneogddmpmfdchnocbpfpmag
  - Keep Awake (Thorium fork): https://chromewebstore.google.com/detail/inglelmldhjcljkomheneakjkpadclhf
  - Stay Awake: https://chromewebstore.google.com/detail/gofaiibillcpfajafckhoieamembimje
  - Keep Computer Awake (for a While): https://chromewebstore.google.com/detail/imbpigcghoambmanjekibelfjemnnool
  - No sleep: https://chromewebstore.google.com/detail/bomdbfmieohagcjbfckpihndjdeeabgo
  - ScreenAwake: https://chromewebstore.google.com/detail/kndaiollgpbnjgijdimhaobdejoaochh
  - Screen Always On: https://chromewebstore.google.com/detail/jejajoajhlohemcppmakjilhcnmabdel
  - Virtual Mouse Jiggler: https://chromewebstore.google.com/detail/nfjplhbfoplapnmjnlakfehkefjlmiii
  - Wiggle Teams: https://chromewebstore.google.com/detail/kbfceooaaajnllddlnimiddlfdhieldp
- Edge Add-ons:
  - Keep Awake (Display | System): https://microsoftedge.microsoft.com/addons/detail/jjaendaehnalocdginbjmaclfjgidlla
  - Caffeine – Keep Awake: https://microsoftedge.microsoft.com/addons/detail/kfcdcelkpooajbeepngjepgklbagnkng
- Firefox add-ons:
  - Keep Awake (Screen Only): https://addons.mozilla.org/firefox/addon/keep-awake-screen-only/
  - Keep Teams Awake: https://addons.mozilla.org/firefox/addon/keep-teams-awake/
- Extpose archive (Keep Awake): https://extpose.com/ext/bijihlabcfdnabacffofojgmehjdielb/en
- Chrome Web Store:
  - 2026 review updates: https://developer.chrome.com/blog/cws-review-updates-2026
  - Discovery: https://developer.chrome.com/docs/webstore/discovery
  - Listing requirements: https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
- Edge publishing: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension

**Web tools:**
- nosleep.page: https://nosleep.page
- screenalwayson.com: https://www.screenalwayson.com/keep-teams-green
- screenawake.com: https://screenawake.com · HypeStat: https://hypestat.com/info/screenawake.com
- screenawake.online: https://screenawake.online
- keepawake.app: https://www.keepawake.app/
- keep-awake.com: https://www.keep-awake.com
- keep-screen-on.com: https://keep-screen-on.com
- nosleep.williamchong.cloud: https://nosleep.williamchong.cloud
- nosleep.online: https://nosleep.online
- Hacker News:
  - nosleep.page Show HN: https://news.ycombinator.com/item?id=31123522
  - Clocksimulator Show HN: https://news.ycombinator.com/item?id=47151784
  - Tell HN, macOS Tahoe breaks Caffeine: https://news.ycombinator.com/item?id=45300616
- Adrafinil: https://github.com/kageroumado/adrafinil

**Desktop:**
- Caffeine (Zhorn): https://www.zhornsoftware.co.uk/caffeine/
- Amphetamine: https://apps.apple.com/us/app/amphetamine/id937984704
- KeepingYouAwake: https://github.com/newmarcel/KeepingYouAwake · issue #220: https://github.com/newmarcel/KeepingYouAwake/issues/220 · Homebrew: https://formulae.brew.sh/cask/keepingyouawake
- Lungo: https://sindresorhus.com/lungo · Setapp: https://setapp.com/apps/lungo
- Theine: https://apps.apple.com/us/app/theine/id955848755
- PowerToys Awake: https://learn.microsoft.com/en-us/windows/powertoys/awake · issue #31529: https://github.com/microsoft/PowerToys/issues/31529 · group policy: https://learn.microsoft.com/en-us/windows/powertoys/grouppolicy
- caffeinate: https://ss64.com/mac/caffeinate.html
- Don't Sleep: https://www.softwareok.com/?seite=Microsoft/DontSleep
- GNOME Caffeine: https://extensions.gnome.org/extension/517/caffeine/
- Setapp pricing: https://setapp.com/pricing

**Jigglers and Teams:**
- Amazon listings: https://www.amazon.com/dp/B08DTXPS51 · https://www.amazon.com/dp/B08V73BX53 · https://www.amazon.com/dp/B09YTB1DSB
- Move Mouse: https://apps.microsoft.com/detail/9nq4ql59xlbf
- Mouse Jiggler (Arkane): https://github.com/arkane-systems/mousejiggler
- Wells Fargo coverage:
  - Banking Dive: https://www.bankingdive.com/news/wells-fires-employees-faking-productivity-finra/719033/
  - CBS: https://www.cbsnews.com/news/wells-fargo-fires-employees-faking-work/
- Vice: https://www.vice.com/en/article/mouse-mover-jiggler-app-keep-screen-on-active/
- Time Doctor: https://www.timedoctor.com/blog/how-to-detect-mouse-jiggler/
- Microsoft Teams docs:
  - Troubleshooting: https://learn.microsoft.com/en-us/troubleshoot/microsoftteams/teams-im-presence/presence-not-show-actual-status
  - Admin presence doc: https://learn.microsoft.com/en-us/microsoftteams/presence-admins
- MS Q&A threads:
  - https://learn.microsoft.com/en-us/answers/questions/4435380/how-do-you-stop-damn-microsoft-teams-from-changing
  - https://learn.microsoft.com/en-us/answers/questions/4419859/change-or-disable-the-5-minute-idle-time-in-teams

**Mobile:**
- Apple:
  - Low Power Mode: https://support.apple.com/en-us/101604
  - Deployment guide (passcode payload): https://support.apple.com/guide/deployment/passcode-payload-settings-dep4d6a472a/web
- WebKit:
  - Safari 16.4: https://webkit.org/blog/13966/
  - Safari 18.4: https://webkit.org/blog/16574/
  - Bug 254545: https://bugs.webkit.org/show_bug.cgi?id=254545
- Android developer options: https://developer.android.com/studio/debug/dev-options
- Google Play:
  - Screen ON: https://play.google.com/store/apps/details?id=com.eonsoft.ScreenON
  - Wakey: https://play.google.com/store/apps/details?id=com.doublep.wakey
  - Caffeine: https://play.google.com/store/apps/details?id=moe.zhs.caffeine
  - Keep Screen On: https://play.google.com/store/apps/details?id=com.psoffritti.keepscreenon
- Paprika: https://www.paprikaapp.com/
- Apple Communities threads:
  - https://discussions.apple.com/thread/255172535
  - https://discussions.apple.com/thread/3507374
- Chromebook help: https://support.google.com/chromebook/answer/3420029

**Kiosk and recipes:**
- Fully Kiosk: https://www.fully-kiosk.com/
- Kiosk Pro: https://www.kioskgroup.com/pages/kiosk-pro-pricing
- ChromeOS kiosk licence (CTL): https://www.ctl.net/products/google-kiosk-annual-license
- Yodeck: https://www.yodeck.com/pricing/
- OptiSigns: https://www.optisigns.com/pricing
- ScreenCloud: https://screencloud.com/pricing
- SiteKiosk (Capterra): https://www.capterra.com/p/120108/SiteKiosk/pricing/
- WP Recipe Maker:
  - Prevent Sleep toggle: https://help.bootstrapped.ventures/docs/wp-recipe-maker/prevent-sleep-toggle/
  - Pricing: https://bootstrapped.ventures/wp-recipe-maker/get-the-plugin/
- Tasty Recipes: https://www.wptasty.com/pricing-recipes · Cook Mode: https://www.wptasty.com/cook-mode
- Create: https://wordpress.org/plugins/mediavine-create/
- The Kitchn Cook Mode+ (AOL syndication): https://www.aol.com/articles/introducing-cook-mode-191500104.html
- BBC Good Food app: https://apps.apple.com/gb/app/good-food-recipe-finder/id533785308
- Betty Crocker case study: https://web.dev/case-studies/betty-crocker
- WordPress plugin guidelines: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- Search Engine Land (snippet only): https://searchengineland.com/thanksgiving-recipes-searches-peak-thanksgiving-day-44-happening-mobile-209182

**Pricing:**
- RevenueCat:
  - State of Subscription Apps: https://www.revenuecat.com/state-of-subscription-apps
  - 2026 benchmarks: https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/
- Lenny's Newsletter: https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion
- Chrome extension freemium anecdote (dev.to): https://dev.to/ktg0215/real-numbers-freemium-chrome-extension-monetization-after-6-months-5hga
- Polar fees: https://polar.sh/docs/merchant-of-record/fees
- Dodo Payments: https://dodopayments.com/pricing
- Comparable product pricing:
  - BetterTouchTool: https://folivora.ai/buy
  - CleanShot: https://cleanshot.com/pricing
  - Raycast: https://www.raycast.com/pricing
  - Momentum: https://momentumdash.com/plus
  - Noisli: https://www.noisli.com/pricing
  - Brain.fm: https://www.brain.fm/pricing
  - Classroomscreen: https://classroomscreen.com/pricing
  - Crouton: https://apps.apple.com/us/app/crouton-recipe-manager/id1461650987
  - Mela: https://apps.apple.com/us/app/mela-recipe-manager/id1548466041
  - Paprika (Mac): https://apps.apple.com/us/app/paprika-recipe-manager-3/id1303222628

**IT policy:**
- Chrome Enterprise, AllowScreenWakeLocks: https://chromeenterprise.google/policies/allow-screen-wake-locks/ (text did not render; [S])
- Chrome community admin thread: https://support.google.com/chrome/thread/189183856
- Chrome Memory and Energy Saver: https://developer.chrome.com/blog/memory-and-energy-saver-mode

**Distribution:**
- Hacker News:
  - Show HN rules: https://news.ycombinator.com/showhn.html
  - Guidelines: https://news.ycombinator.com/newsguidelines.html
- Product Hunt:
  - Launch guide: https://www.producthunt.com/launch
  - Featuring criteria: https://help.producthunt.com/en/articles/9883485
- Subreddit rule summaries [S]: https://rankhog.com/subreddits/internetisbeautiful (and /productivity, /software, /webdev, /chrome_extensions, /macapps, /sysadmin)
- AlternativeTo:
  - nosleep.page: https://alternativeto.net/software/nosleep-page/about/
  - Caffeine: https://alternativeto.net/software/caffeine/about/
  - Amphetamine: https://alternativeto.net/software/amphetamine/about/

**Demand:**
- Google autocomplete: https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q={seed}
- Google Trends: https://trends.google.com (HTTP 429, not measured)

**Not verified, so do not quote:**
- the "400 % jiggler sales rise in 2020"
- SimilarWeb traffic for any competitor
- search volumes for any query
- Amphetamine's rating count
- Allrecipes and Serious Eats Cook Mode
- r/Cooking rules
