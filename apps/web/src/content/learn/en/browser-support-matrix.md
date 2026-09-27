---
title: "Wake lock browser support matrix — AwakeTab"
description: "Screen Wake Lock support: Chrome and Edge 84, Firefox 126, Safari 16.4 and more, checked against docs and engine source. Device results are pending."
h1: "Wake lock browser support matrix"
crumb: "Browser support matrix"
intent: "wake lock browser support"
secondaryQueries:
  - "screen wake lock api browser support"
  - "wake lock safari support"
  - "wake lock firefox support"
  - "can i use wake lock"
  - "wake lock ios home screen app"
preset: p15
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet", "opera"]
os: ["windows", "macos", "linux", "chromeos", "android", "ios", "ipados"]
lead: "Every current major browser supports the Screen Wake Lock API: Chrome and Edge from version 84, Opera 70, Samsung Internet 14, Firefox 126, and Safari 16.4 on Mac, iPhone and iPad. Home Screen web apps on iPhone and iPad need iOS or iPadOS 18.4. In all of them the lock lasts only while the tab is visible. Checked against browser documentation and engine source on 26 September 2026. Device results are pending and appear on How we tested as they are recorded."
toc:
  which-browsers-support-the-screen-wake-lock-api: "Browser support"
  what-works-beyond-a-single-tab: "Beyond a single tab"
  which-page-covers-my-device: "Your device"
  why-would-a-supported-browser-refuse-the-lock: "Why a lock is refused"
  what-does-the-operating-system-do-while-the-lock-holds: "What the OS does"
  how-is-this-table-checked: "How it is checked"
  what-does-this-table-not-tell-you: "Limits"
rows:
  refusals:
    - title: "The page is hidden or not the active tab."
      text: "Switching tabs or apps, minimising or locking the phone releases it. A visible window without focus keeps it."
    - title: "A Permissions-Policy blocks `screen-wake-lock`."
      text: "The usual case is an iframe embedded without `allow=\"screen-wake-lock\"`."
    - title: "Safari has had no recent tap."
      text: "The first request on a page needs one."
    - title: "Firefox's battery reads 5 % or lower with no charger attached."
      text: "Firefox refuses new locks and releases a held one. Plug in, then try again."
  os:
    - title: "Windows"
      text: "Chrome and Edge ask Windows to keep the display on. While it is on, Windows does not idle-sleep."
    - title: "macOS"
      text: "Chrome holds a \"no display sleep\" power assertion, and per Apple's IOKit documentation the Mac does not idle-sleep while it is held."
    - title: "Linux"
      text: "Chrome and Firefox ask the desktop not to sleep over D-Bus (GNOME SessionManager or freedesktop ScreenSaver). Whether that holds depends on your desktop."
    - title: "ChromeOS"
      text: "A closed lid sleeps unless \"Sleep when cover is closed\" is turned off."
    - title: "iPhone and Android"
      text: "The lock holds only while the browser is the app in front. [Keep your iPhone screen on in Safari](/on/iphone-safari) and [Keep your Android screen on in Chrome](/on/android-chrome) cover each phone's own settings."
notes:
  savers:
    kicker: "Good to know"
    text: "Battery savers are not on that list. Chromium's code has no check for Android Battery Saver, Windows Energy saver or Chrome's Energy Saver, and WebKit has no check for Low Power Mode. Savers can still shorten the operating system's own timeout: iPhone Low Power Mode sets Auto-Lock to 30 seconds ([Apple Support](https://support.apple.com/en-us/101604), checked 26 September 2026)."
faq:
  - q: "Why does a browser on the list still let my screen turn off?"
    a: "Usually because the tab was hidden: the browser releases the lock when you switch tabs or apps. Other causes are a shorter operating system limit, such as iPhone Low Power Mode's 30-second Auto-Lock, or Safari waiting for a first tap."
  - q: "Does Brave support the Screen Wake Lock API?"
    a: "Brave is built on Chromium, so it follows Chrome's implementation, but we have not checked its version history separately. Open AwakeTab in it and read the pill: “Screen awake” means the browser confirmed the lock."
  - q: "What does “device results are pending” mean?"
    a: "Every row here comes from browser documentation and engine source code. We have not yet recorded our own run of each browser on a real device. Those results will be added, with dates, as they are recorded, and no row claims a device test before then."
  - q: "Is the video fallback listed as supported everywhere?"
    a: "No. It is a last resort for browsers without the API: it needs a tap, uses more power and depends on the browser letting a muted video play. We have not re-checked it on current iOS, so treat it as best effort."
honestLimit: "This table says which browsers have the Screen Wake Lock API, not that a lock will hold on your device. Every browser releases it when the tab is hidden, and our own device results are still pending."
related:
  - "/learn/screen-wake-lock-api-guide"
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/windows-11"
  - "/on/macos"
  - "/learn/how-we-tested"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Which browsers support the Screen Wake Lock API?

| Browser | First version with the API | Platforms | Notes |
|---|---|---|---|
| Chrome | 84 (July 2020) | Windows, macOS, Linux, ChromeOS, Android | The tab must stay visible. No battery-saver or Energy Saver check. |
| Edge | 84 | Windows, macOS, Linux, Android | Same Chromium code as Chrome. The tab must stay visible. |
| Opera | 70 | Windows, macOS, Linux, Android | Chromium-based. The tab must stay visible. |
| Samsung Internet | 14 (Chromium 87 base) | Android | Chromium-based. Power-saving settings can close the browser after you leave it, which does not affect a visible tab. |
| Firefox | 126 (14 May 2024) | Windows, macOS, Linux, Android | Refuses, and releases a held lock, at 5 % battery or less while not charging. Older versions: video fallback after a tap. |
| Safari | 16.4 (March 2023) | macOS, iOS, iPadOS | Needs a tap on the page first. No Low Power Mode check. |
| iPhone and iPad Home Screen web apps | iOS and iPadOS 18.4 | iOS, iPadOS | iOS 26 opens every site added to the Home Screen as a web app by default. On older iOS, use Safari. |
| Video fallback | Any browser that plays a muted inline video after a tap | Varies | Needs a tap, uses more power than a native lock. Not re-checked on current iOS. |

Other Chromium browsers, such as Brave, share Chrome's code, but their version floors are not listed here because we haven't checked them separately.

Native support means the browser implements the Screen Wake Lock API. Below these versions, AwakeTab shows "Tap to use the fallback" and offers a silent one-frame video loop after one tap. While it runs, the pill reads "Awake via video fallback".

## What works beyond a single tab?

Two AwakeTab features depend on browser support of their own.

| Feature | Where it works | Notes |
|---|---|---|
| Floating window (Document Picture-in-Picture) | Desktop Chrome and Edge 116+, desktop Firefox 151+ (May 2026) | Not in Safari, not on Android. Whether it keeps the screen on while the opener tab is hidden has not been device-tested yet. |
| AwakeTab for Chrome (extension) | Chrome and Edge on desktop | Uses Chrome's power API, so it keeps working with the tab hidden or the window minimised. It can't stop sleep when a lid closes. Firefox and Safari give extensions no power API, so there is no version for them. |

If your job needs a hidden tab to keep the screen on, [AwakeTab for Chrome](/extension) is the row that matters.

::ad

## Which page covers my device?

Wake locks behave differently on an iPhone, a managed Chromebook and a Windows laptop. These pages name the supported versions and the settings that still apply on each one:

- [Keep your iPhone screen on in Safari](/on/iphone-safari)
- [Keep your Android screen on in Chrome](/on/android-chrome)
- [Keep the screen on in Windows 11 and 10](/on/windows-11)
- [Keep your Mac screen awake from a browser tab](/on/macos)
- [Keep a Chromebook screen on](/on/chromebook)
- [Keep the screen on in Firefox](/on/firefox)

Every device and browser page is listed on the [devices hub](/on).

## Why would a supported browser refuse the lock?

A browser can refuse the lock, or take it back, for four reasons only:

::rows refusals

A page served over plain http has no wake lock at all. That is "unsupported" rather than a refusal.

::note savers

Chromium's wake lock permission is also allowed by default, so there is no prompt to refuse. Whether a Safari wake lock still holds the screen on under Low Power Mode is one of the device results we have not recorded yet. For the code side of each reason, including the error each engine returns, see [Screen Wake Lock API: a practical guide with error handling](/learn/screen-wake-lock-api-guide).

## What does the operating system do while the lock holds?

The browser passes the lock on to the operating system, and each one handles it its own way:

::rows os

## How is this table checked?

Each version floor comes from MDN's browser compatibility data and the vendor's own release notes. Each note about refusals comes from reading the wake lock code in the three browser engines. A row changes only when one of those sources changes, and the checked date on this page moves with it. When our own device runs are recorded, each will carry the device, browser version, OS version and date, and appear on How we tested beside these rows.

## Sources

All checked 26 September 2026.

- [MDN browser-compat-data, WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json): version floors for every browser.
- [New in Chrome 84](https://developer.chrome.com/blog/new-in-chrome-84/): the API's first stable release.
- [Firefox 126 release notes for developers](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/126): Firefox support from 14 May 2024.
- [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/): Home Screen web apps (WebKit bug 254545).
- [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc): the only refusal checks in Chrome, Edge, Opera and Samsung Internet.
- [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp): Safari's user-gesture rule.
- [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp): the 5 % battery rule.
- MDN browser-compat-data for Document Picture-in-Picture, and the Firefox 151 release notes: floating window support.

## What does this table not tell you?

A row here means the browser has the API, not that the screen stays on in every case. Every browser releases the lock when the tab is hidden. Closing a laptop lid still sleeps it, apart from a Mac in clamshell mode (with power and an external display) or a Chromebook with "Sleep when cover is closed" turned off. And our own device results are still pending.

::limit inline
