# Editorial audit: 51 articles and 5 hubs (26 September 2026)

Part of the content verification pass (see `content-audit.md`). Produced by an editorial sub-agent. Nothing was edited.

## Summary for the owner
- **Every article is one generated template.** `apps/web/scripts/write-content.mjs` (commit 56e3dee) wrote all 51 files with the same 9 H2s and 8 body paragraphs. Only the line-31 lead (23–62 words) is unique. Fix the generator or retire it before rewriting, or a re-run will overwrite manual fixes.
- **Duplicate content:** 84–90% of each article's 8-word shingles appear in another article, and body Jaccard runs 0.70–0.81. docs/06 §11.4 caps this at 2%, and no `content:lint` shingle check exists.
- **Descriptions:** 40 of 51 are cut mid-sentence because `fitDesc` slices at 150 characters.
- **FAQs:** Q2 and Q3 are identical on all 51 pages, and A3 repeats the body. Q1 has broken grammar ("Does does a wake lock keep Teams green? work in a hidden tab?"). A1 leaks slugs ("The ai-agents flow…").
- **Page types:** the §2 templates are missing for vs (comparison table, "when the alternative is better"), guides (numbered steps) and learn (code, methods, results).
- **Word counts:** learn pages are 680–691 words (1,200+ needed), guides 678–690 (700+), and 6 of 7 vs pages are under 700.
- **Tone:** no marketing adjectives and no overclaiming, but a lot of engine jargon: sentinel, held/lost/denied, `Date.now()`, "native floors".
- **Conversion:** no article mentions Pro, the extension, Embed, Kiosk or /library, even where docs/06 §12 says to. The hidden-tab FAQ answers "No" 51 times with no next step, when the extension is the real answer.
- **Links:** `relatedFor` picks related links by index arithmetic, so most are off-topic, and chip labels show slug text instead of the target's H1.
- **Em dashes:** 63 outside titles. 51 of them come from the one shared line 37.

## Top findings (line numbers are the same in all 51 files unless a file is named)
| file:line | Current | Problem | Proposed | Sev |
|---|---|---|---|---|
| all:31–65 | 8 identical paragraphs + 9 identical H2s | Templated filler; breaks §11.4 and §2 | Rewrite each page to its §2 template; delete the shared sections | High |
| all:3 (40 files) | description cut mid-sentence | Unfinished; the honest limit is lost | Use the description table below | High |
| all:14 | "Does {h1 lowercased} work in a hidden tab?" | Broken grammar | "Does this work if the tab is hidden?" plus a page-specific answer | High |
| all:15 | "The {slug} flow releases…" | Slug leak | "No. The lock is released when you switch tabs or apps. Come back and the pill returns to "Screen awake"." | High |
| all:16–19 | Same Q2/Q3 on every page | §8 violation | 3–5 page-specific FAQs | High |
| all:35 | Internal state names (idle, requesting, held…) | Readers never see these words | Describe the pill messages "Ready" … "Awake via video fallback" | High |
| all:35, :53, :39, :65 | Raw slug/collection/h1 pasted into sentences and headings | Nonsense copy | Delete, or write page-specific text | High |
| all:61 | "success of the model"; digs at "pages keep a video looping" | Jargon; disparages competitors | "When you hide the tab, the pill changes to "Paused — tab hidden". That is the page telling the truth, not a bug." | Medium |
| all:49 | "Stats accrue only while held or fallback; Date.now()…" | Developer jargon | "Stats count only the time the screen was actually kept awake." | Medium |
| all:65 | Plug-in/safety paragraph everywhere | Off-topic on 49 pages | Keep only on night-clock, dashboards, kiosk, baby-monitor | Medium |
| all:45 | Five-OS menu paragraph everywhere | on/guides need one OS | One OS per page, as numbered steps | Medium |
| learn/low-power-mode-and-wake-locks.md:31 | "The pill should show Blocked" | Wrong pill string | ""Blocked — here's the fix"" | Medium |
| for/presentations, teleprompter | "PiP pill" | UI calls it "floating window" | "floating window"; mention the extension | Medium |
| for/kiosk, dashboards, macos, nosleep-js | §12 pointers dropped | Missing next steps | Kiosk licence ($19/site), `?autostart=1`, Low Power Mode note, /library | Medium |
| vs/*.md h1 | "Caffeine vs a wake-lock tab" | Misses the "alternative" intent | "AwakeTab vs Caffeine"; titles as in the table below | Medium |
| vs/nosleep-page.md title | Brand appears twice | Anti-pattern listed in §4 | "A nosleep.page alternative with honest status — AwakeTab" | Medium |
| ArticlePage related chips | "for · reading" | §10: the anchor must be the target's H1 | Use the target's H1; curate 4–6 on-topic links | Medium |
| all articles | No Pro, extension, Embed, Kiosk or /library | Lost conversion | Extension CTA on ai-agents, downloads, presentations, work-laptop; Pro logo/message + Embed on dashboards; Kiosk licence on kiosk; ambient packs on night-clock; /library on nosleep-js and the API guide | High |
| en.json `page.hub.vs.title` | Brand appears twice | §4 | "Compare screen-awake tools — AwakeTab" | Medium |
| en.json `page.pro.description`, `pro.card` | "twelve-week stats", "Yearly or lifetime" | Canon wording is "stats history beyond 7 days", "one-time" | Align | Low |

## Proposed descriptions (70–155 characters, complete sentences, no em dashes)
| file | description |
|---|---|
| for/ai-agents | Keep the screen on while an AI agent runs in your browser. AwakeTab must stay visible; it cannot stop a site's idle timeout or a hidden tab's throttling. |
| for/baby-monitor | Keep a phone screen on beside a web baby monitor. AwakeTab is not a safety device: plug in and keep both pages visible in split-screen. |
| for/cooking | Keep a recipe on screen while you cook, in the browser with no install. Works while the AwakeTab tab stays visible; switching apps releases the lock. |
| for/dashboards | Keep a wall dashboard or NOC screen on all day. AwakeTab must stay visible on the same display: split-screen, a second window or its own monitor. |
| for/exams-proctoring | Keep the screen on during an online exam's reading time. AwakeTab never touches proctoring software. Check your rules first: a second tab may be banned. |
| for/kiosk | Keep a lobby tablet or kiosk display on from a browser tab. AwakeTab is not a kiosk shell: no lockdown, no auto-launch. Pair it with the OS kiosk mode. |
| for/live-streams | Keep the screen on while a stream is paused or you sit in chat. Most players hold their own lock while playing. The AwakeTab tab must stay visible. |
| for/navigation | Keep the screen on for web maps. Native map apps hide the browser, so this works only with web maps in split-screen. Expect heavy battery use. |
| for/presentations | Keep the screen on while you present. Full-screen slides hide the tab, so keep AwakeTab visible in the floating window (Chrome, Edge) or a second window. |
| for/second-monitor | Keep a second monitor from sleeping on the OS display timeout. AwakeTab can hold that timeout; it cannot fix a monitor's own auto-off or a bad cable. |
| for/sheet-music | Keep an iPad on for sheet music: put AwakeTab beside the score app in Split View. Low Power Mode still forces a 30-second Auto-Lock. (Note: iPadOS 26 removed Split View; see fact-check.) |
| for/teleprompter | Keep a teleprompter screen awake while you rehearse. AwakeTab is not a prompter: keep your script visible next to it or use the floating window. |
| for/work-laptop | Keep a work laptop display on while its tab is visible. AwakeTab holds only the display timeout; it cannot beat a lock policy, card removal or lid close. |
| for/workouts | Keep a workout timer on screen with clock mode. Lock the orientation and plug in; a sweaty tap can stop the session, so glance at the status pill. |
| guides/android-screen-timeout-one-app | Stock Android has no per-app screen timeout; the setting is global. AwakeTab keeps the screen on only while its Chrome tab is visible. |
| guides/chrome-energy-saver | Chrome Energy Saver throttles background tabs but does not block a visible tab's wake lock. (Fact-check: drop the battery-saver denial clause.) |
| guides/lock-screen-vs-sleep | Display sleep and "require sign-in" are separate settings. A wake lock stops display sleep, not a sign-in policy. Check both in Settings. |
| guides/mac-prevent-sleep-lid-closed | No browser tab can keep a closed Mac awake. Use clamshell mode with power and an external display, pmset, or Amphetamine instead. |
| guides/modern-standby | Modern Standby (S0) is run by firmware and drivers. A wake lock holds the display timeout, not those low-power states. What to check instead. |
| guides/second-monitor-turns-off | If only your second monitor turns off, check the cable, DisplayPort and the monitor's auto-off. If both follow the OS timeout, a wake lock helps. |
| learn/browser-support-matrix | Which browsers support the Screen Wake Lock API, tested 9 September 2026: Chrome, Edge, Firefox, Safari and Samsung Internet. Older versions fall back. |
| learn/does-a-wake-lock-keep-teams-green | No. Teams and Slack set Available from keyboard and mouse activity, not a lit screen. A wake lock does not keep the status green. |
| learn/how-we-tested | How AwakeTab is tested: request a lock, hide the tab, block it with policy, read the pill. Devices, versions, dates, and what we did not test. |
| learn/low-power-mode-and-wake-locks | iOS Low Power Mode forces a 30-second Auto-Lock. What each OS and browser does to a wake lock, and what the pill shows. (Reworded per fact-check.) |
| learn/nosleep-js-vs-wake-lock | NoSleep.js uses the Wake Lock API where present and a hidden video otherwise. AwakeTab uses the API first and a video fallback only after a tap. |
| learn/screen-wake-lock-api-guide | How navigator.wakeLock.request('screen') works: secure, visible pages only, released when hidden, NotAllowedError when refused. With handling code. |
| on/android-chrome | Chrome on Android keeps the screen on from a visible tab. Leaving Chrome releases it, and OEM sleep lists can close the tab after you leave. |
| on/chromebook | Keep a Chromebook screen on from a Chrome tab. School or work policies can still force sleep; closing the lid sleeps unless that setting is off. |
| on/firefox | Firefox 126 and later keep the screen on natively from a visible tab. Older versions use the video fallback after a tap, which uses more CPU. |
| on/ios-home-screen | Keep an iPhone Home Screen web app awake. The wake lock there needs iOS 18.4 or later; on older iOS, use Safari. Notifications need the installed app. |
| on/iphone-safari | Keep an iPhone screen on in Safari 16.4 or later while the tab is in front. Safari needs one tap; Low Power Mode forces a 30-second Auto-Lock. |
| on/linux | Keep the screen on in Firefox or Chrome on Linux. Tested on Ubuntu 24.04 GNOME; other desktops must honour idle-inhibit, and untested ones are not claimed. |
| on/samsung-internet | Samsung Internet 14 and later keep the screen on from a visible tab. Power-saving settings can close the tab after you leave it. |
| on/windows-11 | Keep the screen on in Windows 11 with Chrome or Edge in a visible tab. Closing the lid follows your lid setting, and Modern Standby differs. |
| vs/amphetamine | Amphetamine is a native Mac app with triggers and closed-lid mode; no web page can match that. AwakeTab suits a visible task when you can't install apps. |
| vs/caffeinate-command | caffeinate -i keeps a Mac awake with the screen off from a terminal. AwakeTab keeps the screen on from a visible tab and needs nothing installed. |
| vs/caffeine | Caffeine for macOS holds a power assertion to keep the Mac awake with no window open. AwakeTab needs a visible tab, but shows honest status and needs no install. |
| vs/nosleep-js | NoSleep.js last shipped in December 2020. @awaketab/wake uses the Screen Wake Lock API first, a video fallback only after a tap, and reports honest status. |
| vs/nosleep-page | nosleep.page and AwakeTab are both tabs, and both stop when hidden. AwakeTab adds an honest status pill, an until-time and session restore. |
| vs/powertoys-awake | PowerToys Awake keeps Windows awake with the screen off by default or on. AwakeTab keeps the screen on from a visible tab and needs no install. |

## Proposed titles
| file | Proposed title |
|---|---|
| on/android-chrome | Keep your Android screen on in Chrome — AwakeTab |
| on/iphone-safari | Keep your iPhone screen on in Safari — AwakeTab |
| on/samsung-internet | Keep the screen on in Samsung Internet — AwakeTab |
| guides/windows-11-screen-turns-off-after-1-minute | Windows 11 screen turns off after 1 minute: fix — AwakeTab |
| guides/android-screen-timeout-one-app | Android screen timeout for one app — AwakeTab |
| vs/caffeine | Caffeine alternative in a browser tab — AwakeTab |
| vs/amphetamine | Amphetamine alternative in a browser tab — AwakeTab |
| vs/powertoys-awake | PowerToys Awake alternative in a browser — AwakeTab |

## Terminology to adopt
- **"No limit" preset:** show "∞", with accessible name "Until I stop". Never write "indefinite".
- **The small always-on-top timer:** "floating window". Never "PiP pill".
- **Wake lock:** lowercase "wake lock" in prose; "Screen Wake Lock API" as the API name.
- **Power-saving modes:** "Battery Saver" for Android, "Energy saver" for Windows 11, "battery saver" when generic.
- **Other spellings:** "closing the lid"; "on-screen" as an adjective. British spelling throughout (the hubs still use "behavior").
- **Pill strings:** always quote them exactly: "Screen awake".
