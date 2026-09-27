---
title: "Chrome Energy Saver and wake locks — AwakeTab"
description: "Chrome Energy Saver slows background tabs but does not block a visible tab's wake lock. If the screen still goes dark, here is how to find the real cause."
h1: "Chrome Energy Saver and wake locks: why the screen still goes dark"
crumb: "Chrome Energy Saver"
intent: "chrome energy saver"
preset: p30
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge"]
os: ["windows", "macos", "linux", "chromeos", "android"]
lead: "You can leave Chrome's Energy Saver on. It slows tabs in the background, and Chromium's wake lock code has no check for it, so a visible tab still keeps the screen on. If the screen goes dark anyway, the tab was hidden, or a setting outside Chrome took over. The steps below find which one."
toc:
  find-the-real-cause-in-five-steps: "Find the cause"
  if-the-screen-still-goes-dark: "Still going dark"
  what-each-saver-changes: "What each saver changes"
steps:
  - title: "Bring the AwakeTab tab to the front"
    short: "Tab in front"
    path: "Chrome › the AwakeTab tab"
    text: "Energy Saver slows background tabs, and a hidden tab has no wake lock anyway. Switching tabs or minimising the window releases the lock. A visible window without focus keeps it."
  - title: "Start a session and read the pill"
    short: "Read the pill"
    path: "AwakeTab › Start"
    text: "Wait for \"Screen awake\", which shows only once Chrome has granted the lock. If it says \"Blocked — here's the fix\", follow the line under it."
  - title: "Check the Windows screen timeout and Energy saver"
    short: "Check Windows settings"
    path: "Settings › System › Power & battery"
    text: "Windows keeps one screen timeout for battery and one for plugged in. Energy saver (Battery saver before Windows 11 24H2) may shorten timeouts or dim the screen on battery, but it does not refuse a browser wake lock."
  - title: "Check the phone's own timeout"
    short: "Check the phone"
    path: "Settings › Display › Screen timeout"
    text: "On a Pixel with Android 16, the path is Settings › Display & touch › Screen timeout. Battery Saver may shorten it or dim the screen, but Chrome does not refuse the lock because of it."
  - title: "Confirm the request reached the system"
    short: "Confirm the request"
    path: "Terminal › powercfg /requests or pmset -g assertions"
    text: "On Windows, run `powercfg /requests` in an administrator terminal: the browser should be listed under DISPLAY. On a Mac, run `pmset -g assertions` and look for a PreventUserIdleDisplaySleep or NoDisplaySleep line from your browser."
stepsDone: "All five done. If the screen still goes dark with the tab in front, read the next section."
rows:
  still:
    - title: "The lid closed"
      text: "A closed laptop lid sleeps the computer whatever a page asks, apart from a Mac in clamshell mode or a Chromebook with \"Sleep when cover is closed\" turned off."
    - title: "A work lock screen appeared"
      text: "A wake lock holds off display sleep, not a \"require sign-in after N minutes\" policy. On a work computer, only your IT team can change it."
      link:
        label: "Lock screen versus sleep"
        href: "/guides/lock-screen-vs-sleep"
    - title: "The session ended"
      text: "A timed session stops at the time you picked, and your normal timeout takes over. Pick ∞ to run until you stop it."
  savers:
    - title: "Chrome's Energy Saver"
      text: "Slows tabs in the background. It does not touch the wake lock of the tab you are looking at."
    - title: "Windows Energy saver"
      text: "Called Battery saver before Windows 11 24H2. It may dim the screen or shorten timeouts; it does not refuse a browser wake lock."
    - title: "Android Battery Saver"
      text: "Chrome has no Battery Saver check on the wake lock. It may shorten your timeout or dim the screen once you leave the tab."
    - title: "iPhone Low Power Mode"
      text: "Sets Auto-Lock to 30 seconds. WebKit has no Low Power Mode check; whether a Safari lock holds under it has not been device-tested yet."
      link:
        label: "iPhone Auto-Lock greyed out"
        href: "/guides/iphone-auto-lock-never-greyed-out"
toolNote: "You don't need to turn Energy Saver off first. Keep this tab in front and press Start: the pill says \"Screen awake\" once Chrome grants the lock, and it changes to \"Paused — tab hidden\" the moment the tab is out of sight."
faq:
  - q: "Should I turn off Energy Saver to keep the screen on?"
    a: "No. Chromium's wake lock code has no check for Energy Saver, and the lock permission is allowed by default. Turning it off changes how background tabs behave, not whether the visible tab can keep the screen on."
  - q: "Does Energy Saver affect AwakeTab for Chrome?"
    a: "AwakeTab for Chrome uses Chrome's own power setting instead of a page's wake lock, so it keeps working with the tab hidden or the window minimised. It still cannot stop sleep when a laptop lid closes."
  - q: "Why did the pill change to \"Paused — tab hidden\"?"
    a: "The browser took the lock back because the tab was hidden: another tab in front, the window minimised, or a full-screen app on top. AwakeTab asks again as soon as you return, and paused time does not count toward a timed session."
honestLimit: "Energy Saver throttles background tabs. It does not block a visible tab's wake lock, and neither do Windows Energy saver or Android Battery Saver, which may still dim the screen. A hidden tab has no lock at all."
related:
  - "/learn/browser-support-matrix"
  - "/on/windows-11"
  - "/on/android-chrome"
  - "/guides/lock-screen-vs-sleep"
  - "/learn/low-power-mode-and-wake-locks"
author: soubhik
published: 2026-09-09
updated: 2026-09-28
---

## Find the real cause in five steps

These work in Chrome and Edge on any system. Sources checked 26 September 2026: Chromium's [wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc) refuses only for a hidden or inactive page, a Permissions-Policy block or a denied permission, and never reads a saver mode.

::steps

## If the screen still goes dark

With the tab in front and the pill saying "Screen awake", the cause is outside the browser. These are the usual ones.

::rows still

::ad

## What each saver changes

Four different switches share the name. None makes Chrome refuse a wake lock, but some change what the system does around it.

::rows savers

To keep the screen on while you work in another tab, use [AwakeTab for Chrome](/extension) on desktop Chrome or Edge.
