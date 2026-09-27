---
title: "Keep the screen on in Windows 11 and 10 — AwakeTab"
description: "Chrome or Edge keeps a Windows 11 or 10 screen on from a visible tab. Energy saver does not refuse it, and closing the lid follows your lid setting."
h1: "Keep the screen on in Windows 11 and 10"
intent: "keep screen on windows 11"
secondaryQueries:
  - "keep screen on windows 10"
  - "stop screen turning off windows 11"
  - "windows 11 screen timeout"
  - "keep laptop screen on without admin rights"
preset: p60
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox"]
os: ["windows"]
faq:
  - q: "Is anything different on Windows 10?"
    a: "Only the Settings path: System > Power & sleep instead of Power & battery. Chrome and Edge keep the display on the same way from a visible tab, and on Windows 10 Chrome also asks Windows to keep the system itself awake."
  - q: "Why does the screen go dark a minute after I lock the PC?"
    a: "When the PC is locked, Windows uses a separate lock-screen display timeout of 60 seconds, and your normal screen setting does not change it. A locked PC also hides the tab. Microsoft documents a powercfg setting for this timeout; the one-minute guide has the steps."
  - q: "Do I need admin rights to use AwakeTab on a work laptop?"
    a: "No. The tab needs no install and no admin rights. Only the optional check, powercfg /requests, needs an administrator terminal. If your company sets a screen lock policy, that policy still applies."
  - q: "Can I keep the tab on a second monitor while I work on the first?"
    a: "Yes. A window that is visible but not focused keeps the display on, so a small AwakeTab window on another monitor works while you type on the first."
honestLimit: "The tab has to stay visible. Minimise the window, lock the PC or close the lid, and Windows follows its own screen, lock-screen and lid settings again."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/guides/lock-screen-vs-sleep"
  - "/vs/powertoys-awake"
  - "/for/work-laptop"
  - "/extension"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

Windows has its own screen timeout: Settings > System > Power & battery > Screen, sleep & hibernate timeouts on Windows 11, or Settings > System > Power & sleep on Windows 10. If you can't or don't want to change it, a visible AwakeTab tab in Chrome or Edge 84 or later asks Windows to keep the display on, and Windows doesn't idle-sleep while it does.

## Change the timeout in Windows 11

1. Press Windows key + I to open Settings.
2. Go to System > Power & battery.
3. Open Screen, sleep & hibernate timeouts. Older Windows 11 builds call it Screen and sleep.
4. Choose longer screen times for battery and for plugged in, or Never.

## Change the timeout in Windows 10

1. Open Settings > System > Power & sleep.
2. Under Screen, choose the times for battery and for plugged in.

Windows 10 mainstream support ended in October 2025. Everything below applies to both versions.

## When a tab is the better choice

On a managed laptop the power settings may be locked. A tab keeps the display on for a set time or until a clock time, then hands control back to Windows; [keeping a work laptop display awake](/for/work-laptop) covers what office policy can still do.

## Browser support on Windows

| Browser | First version | What it asks Windows for |
|---|---|---|
| Chrome, Edge | 84 (July 2020) | A display-required power request, so the screen stays on and Windows does not idle-sleep |
| Firefox | 126 (May 2024) | Also works from a visible tab, but Firefox refuses when the battery is at 5 % or less and not charging |

Dates and sources are in the [full support table](/learn/browser-support-matrix).

## Check it with powercfg

1. Start a session and wait for "Screen awake".
2. Right-click Start and open Terminal (Admin). On Windows 10, open Windows PowerShell (Admin).
3. Run `powercfg /requests`.
4. Your browser should be listed under DISPLAY. Hide the tab, run it again, and the entry should disappear.

## What stops it on Windows

- **Hiding the tab.** Minimising the window or switching tabs releases it, and the pill shows "Paused — tab hidden". A visible window that is not focused keeps it.
- **Locking the PC.** A locked PC turns the monitor off after 60 seconds by design. [Windows 11 screen turns off after 1 minute](/guides/windows-11-screen-turns-off-after-1-minute) gives Microsoft's powercfg fix.
- **Energy saver.** Windows 11 24H2 renamed Battery saver to Energy saver. It does not refuse the wake lock, but it may dim the screen.
- **Closing the lid.** The laptop follows Control Panel > Power Options > Choose what closing the lid does, and no tab or extension changes that.
- **A sign-in policy.** A work screen lock is separate from display sleep. [Lock screen versus display sleep](/guides/lock-screen-vs-sleep) explains the difference.

## When another tool fits better

PowerToys Awake needs no open tab, and its "Keep screen on" switch holds the display; [PowerToys Awake compared with a tab](/vs/powertoys-awake) weighs the two. If the AwakeTab tab needs to stay hidden, the Chrome and Edge [extension](/extension), AwakeTab for Chrome, keeps the screen on with the window minimised.

## What we have checked

Microsoft's documentation and the Chromium power code were last checked on 26 September 2026. A Windows device run is still to come; once it is done, its results go on /learn/how-we-tested.
