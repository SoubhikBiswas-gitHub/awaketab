# Technical fact-check: browser and OS claims (26 September 2026)

Part of the content verification pass (see `content-audit.md`). Produced by a fact-check sub-agent that read browser source code and vendor docs. No product files were edited. Every source was accessed 26 September 2026.

## Summary for the owner
- **Version floors are correct:** Chrome/Edge 84, Opera 70, Samsung Internet 14, Firefox 126, Safari 16.4. iOS Home Screen web apps need 18.4.
- **The most repeated claim is false.** "Battery saver / Energy saver denies the wake lock" has no check behind it in Chromium, and WebKit has no Low Power Mode check either. The line sits in the boilerplate of all 33 learn, on, guides and vs articles, in en.json `tool.advice` (line 150), in `data/support-matrix.json`, in `packages/wake/README.md` and on the home page.
- **The real refusal causes:**
  - the tab is hidden or inactive;
  - a Permissions-Policy blocks it (for example an iframe without `allow`);
  - Safari/iOS needs a tap first;
  - Firefox refuses at 5% battery or less while not charging.
- **Pages without HTTPS have no wake lock at all.** They are "unsupported", not "denied".
- **Other errors:**
  - Caffeine for Mac does not press keys; that is Caffeine for Windows.
  - NoSleep.js uses the Wake Lock API when it is present.
  - PowerToys Awake has a "Keep screen on" switch.
  - iPadOS 26 removed Split View.
  - Windows 11 24H2 renamed Battery saver to Energy saver.
  - The floating window (Document PiP) also works in Firefox 151+ on desktop.
  - amp-iframe does pass `allow` through.
  - The kiosk `autostart` needs one tap on Safari.
- **macOS:** while the display is held, the Mac does not idle-sleep, according to Apple's IOKit docs. Our "macOS did not hold idle sleep" claim contradicts that.

## Verified facts
- **Version floors match docs/00 §11:** Chrome 84 (with Edge, Opera 70 and Samsung Internet 14), Firefox 126, Safari 16.4. iOS/iPadOS standalone Home Screen apps from 18.4 (WebKit bug 254545). Sources: https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json · https://webkit.org/blog/16574/webkit-features-in-safari-18-4/ · https://bugs.webkit.org/show_bug.cgi?id=254545
- **Firefox 126** shipped Screen Wake Lock on 2024-05-14. https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126
- **Chrome 84** launched it. https://developer.chrome.com/blog/new-in-chrome-84/
- **Samsung Internet 14** is based on Chromium 87. https://en.wikipedia.org/wiki/Samsung_Internet
- **Chromium never checks battery saver or Energy Saver.** It rejects only for: no browsing context, Permissions-Policy, not active, page not visible, or permission denied. The `screen-wake-lock` permission defaults to ALLOW. Sources: https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc and `components/permissions/contexts/wake_lock_permission_context.cc`
- **Firefox** refuses or releases at ≤ 5% battery while not charging. It has no battery-saver check. https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp
- **Safari/WebKit** rejects without a recent user gesture or an earlier gesture authorisation. It has no Low Power Mode check. https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp
- **Chromium on macOS** holds `kIOPMAssertionTypeNoDisplaySleep`, so the system will not idle-sleep either. https://developer.apple.com/documentation/iokit/kiopmassertiontypenodisplaysleep
- **Chromium on Windows** uses `PowerRequestDisplayRequired`, plus `SystemRequired` on Windows 10 and earlier. **On Linux** it uses D-Bus idle inhibit (GNOME SessionManager, freedesktop PowerManagement/ScreenSaver).
- **iPhone Low Power Mode** "Sets Auto-Lock to 30 seconds". https://support.apple.com/en-us/101604
- **Document Picture-in-Picture:** Chrome/Edge 116+ desktop and Firefox 151+ desktop (2026-05-19). Not available in Safari or on Android. https://github.com/mdn/browser-compat-data/blob/main/api/DocumentPictureInPicture.json · https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/151
- **Firefox has no WebExtensions `power` API.** https://github.com/mdn/browser-compat-data/tree/main/webextensions/api
- **chrome.power:** "display" prevents display off or dim *and* system sleep; "system" prevents only system sleep. https://developer.chrome.com/docs/extensions/reference/api/power
- **chrome.alarms:** the 30-second minimum applies only from Chrome 120 (60 s before). https://developer.chrome.com/blog/chrome-120-beta-whats-new-for-extensions
- **Presence:** Teams goes Away after about 5 minutes of inactivity; Slack after 10 minutes. https://learn.microsoft.com/en-us/microsoftteams/presence-admins · https://slack.com/help/articles/201864558
- **Battery Status API:** Chrome 38+; Firefox removed it in 52; Safari never had it.
- **NoSleep.js** 0.12.0 (2020-12-16) prefers `navigator.wakeLock` and falls back to video. https://github.com/richtr/NoSleep.js/blob/master/src/index.js
- **Caffeine for Mac** uses `IOPMAssertionDeclareUserActivity` + `PreventUserIdleDisplaySleep`. The F15 keypress is Zhorn Caffeine for Windows. https://github.com/IntelliScape/caffeine/blob/master/AppDelegate.m · https://www.zhornsoftware.co.uk/caffeine/
- **PowerToys Awake** turns the display off by default but has a "Keep screen on" switch. It does not work at the lock screen. https://learn.microsoft.com/en-us/windows/powertoys/awake
- **iPadOS 26** removed Split View; Slide Over returned in 26.1. https://9to5mac.com/2025/06/09/psa-ipados-26-removes-split-view-and-slide-over-multitasking-features/
- **Windows 11 24H2:** "Battery saver" is now "Energy saver". https://learn.microsoft.com/en-us/windows-hardware/design/component-guidelines/energy-saver
- **ChromeOS:** users can turn off "Sleep when cover is closed".
- **iOS 26** opens every Home Screen site as a web app by default. https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios
- **amp-iframe** propagates `allow`, and the validator accepts it. https://github.com/ampproject/amphtml/blob/main/extensions/amp-iframe/0.1/amp-iframe.js
- **Element fullscreen on iOS:** iPad only, not iPhone.
- **nosleep.page** uses the Wake Lock API, offers 30 min / 1 h / 2 h / custom, and asks you to keep the tab in front. https://nosleep.page/

## Findings (to fix during the build)
"All 33" means the boilerplate line in every learn, on, guides and vs article.

| file:line | Current | Problem | Proposed | Sev |
|---|---|---|---|---|
| all 33 `.md`:37 | "Battery Saver, Low Power Mode, a hidden tab, an insecure context or a Permissions-Policy … produce denied or lost" | No battery-saver rejection in Chromium; an insecure context is "unsupported"; Safari needs a tap and Firefox refuses at ≤5% | "A hidden tab, a Permissions-Policy block, Safari without a tap, or Firefox at 5% battery or less produce denied or lost. An insecure context has no wake lock at all (unsupported). Never a fake held." | High |
| all 33 `.md`:45 | "Windows: … battery saver can deny the lock" | Contradicted by source; the feature was renamed Energy saver | "Energy saver (formerly Battery saver) dims the screen but does not refuse a browser wake lock." | High |
| all 33 `.md`:45 | "macOS: … idle system sleep was not held in our tests" | Apple docs: no idle sleep while the display is held; clamshell mode is the exception | "While the display is held, the Mac does not idle-sleep. A closed lid sleeps unless you use clamshell mode." | Med |
| all 33 `.md`:45 | "Android: Settings → Display → Screen timeout" | Pixel on Android 16: Display & touch | "Settings → Display (Pixel: Display & touch) → Screen timeout" | Low |
| learn/screen-wake-lock-api-guide.md:3,20,31 | NotAllowedError = battery saver, policy, insecure context | Wrong mapping | "NotAllowedError: hidden or inactive document, Permissions-Policy, or the browser refused (Safari without a user gesture; Firefox at ≤5% battery). Insecure contexts have no navigator.wakeLock." | High |
| learn/low-power-mode-and-wake-locks.md:3,20,31 | Low Power Mode and battery savers deny | Unsupported by source | "iOS Low Power Mode forces a 30-second Auto-Lock … Chromium does not refuse locks because of battery saver. Firefox refuses at 5% battery or less." | High |
| on/android-chrome.md:3,20,31 | "Battery Saver denies it" | Contradicted | "Battery Saver may shorten the timeout or dim the screen; Chrome itself does not refuse the lock for it." | High |
| on/edge.md, on/windows-11.md, on/windows-10.md, guides/chrome-energy-saver.md | Battery saver or Energy saver denies | Contradicted | Remove the denial claims; lid behaviour follows the lid-close setting | High |
| packages/wake/README.md:102 | Battery savers deny or release any lock | Contradicted | "Firefox refuses and releases at ≤5% battery while discharging. Chromium does not check battery savers. iOS Low Power Mode caps Auto-Lock at 30 s." | High |
| i18n/en.json:150 | "Your device's battery saver is blocking the wake lock." | The cause is never produced by Chromium | "The browser refused the wake lock. If the battery is very low, plug in, then tap Start." | High |
| data/support-matrix.json:10,18,34 | Battery Saver, Efficiency mode, Low Power Mode notes | Contradicted or unverified | Chrome/Edge: "The tab must remain visible." Safari: "Needs a tap to start. Low Power Mode caps Auto-Lock at 30 s." | High |
| data/support-matrix.json:15-17 | Edge platforms: Windows, macOS | Incomplete | Add Linux and Android | Low |
| data/support-matrix.json:57 + store/listing.md:49 | Chrome 116 with a 30-second keep-alive | 30 s alarms need Chrome 120 | Raise the minimum to 120, or "every 30 s (60 s before Chrome 120)" | Med |
| guides/iphone-auto-lock-never-greyed-out.md:3,20,31 | Battery drain greys out Never; AwakeTab overridden | Wrong cause; unverified override | "…under Low Power Mode, or when a work/school (MDM) profile limits Auto-Lock." Hedge the override with a test date. | Med |
| on/macos.md; index.astro:209-220, 339-340 | macOS idle sleep not held; battery saver refuses | Contradicts Apple and Chromium | "While the screen is held, neither Windows nor macOS idle-sleeps." | Med/High |
| index.astro:146 | Stops "showing the lock screen" | Idle-lock policies can still lock the screen | "…stops dimming and sleeping (work idle-lock policies can still lock)" | Med |
| on/chromebook.md | "Closing the lid sleeps." | Users can turn this off | "…unless 'Sleep when cover is closed' is off." | Med |
| on/ipad.md | "iPad Split View" | Removed in iPadOS 26 | "windowed apps / tiling (Split View on iPadOS 18 and earlier)" | Med |
| on/ios-home-screen.md:31 | Different runtime | Incomplete | Add that iOS 26 opens Home Screen sites as web apps by default | Low |
| on/samsung-internet.md | Adaptive battery overrides | These settings affect background apps, not a visible tab | "…can kill the tab after you leave it." | Low |
| on/linux.md:20 | "(GNOME, KDE, Wayland or X11)" | Wayland and X11 are display protocols, not desktops | "a desktop that implements GNOME SessionManager or freedesktop ScreenSaver inhibit" | Low |
| vs/caffeine.md | Mac Caffeine "fakes an F15 key" | Wrong app | "…holds a macOS power assertion (no key presses)" | High |
| vs/nosleep-js.md; learn/nosleep-js-vs-wake-lock.md | "leans on a hidden video" | It prefers the Wake Lock API | "…uses the Wake Lock API where present and falls back to a hidden video" | High |
| vs/powertoys-awake.md | Display-off only | It has a Keep screen on switch | "…display off by default or on via 'Keep screen on'; it stops at the lock screen." | Med |
| i18n/en.json:276 | "Floating window needs Chrome or Edge" | Firefox 151+ also supports it | "needs desktop Chrome, Edge or Firefox 151+" | Med |
| embed.astro:155-156 | "amp-iframe cannot delegate the permission" | False | "amp-iframe passes allow=\"screen-wake-lock\" through (untested)." | Med |
| kiosk.astro:114 | autostart requests on visible | Safari needs a tap | Add "(Safari and iOS need one tap first)" | High |

## Could not verify (needs our own device tests)
- Safari lock under iOS Low Power Mode.
- OS-level overrides by Android or Windows savers.
- Samsung Internet and Edge efficiency modes.
- The video fallback on current iOS.
- Wake lock from Document PiP while the opener tab is hidden.
- The pop-up blocker's effect on Document PiP.
- Mac clamshell requirements.
- "One-minute timeout common on battery".
- chrome.power in Opera and Arc.
- iOS web-app local notifications.
- Our "in our tests" claims (Ubuntu 24.04, Teams avatar), which need our own records.
