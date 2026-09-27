---
title: "Keep the screen on in Firefox — AwakeTab"
description: "Firefox 126 and later keep the screen on natively from a visible tab. Older versions use the video fallback after a tap, which uses more power."
h1: "Keep the screen on in Firefox"
crumb: "Firefox"
intent: "keep screen on firefox"
secondaryQueries:
  - "firefox wake lock"
  - "stop firefox screen turning off"
  - "firefox keep screen awake"
preset: p30
mode: standard
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-26
browsers: ["firefox"]
os: ["windows", "macos", "linux", "android"]
lead: "Firefox 126 and later keep the screen on natively while the AwakeTab tab is visible, on Windows, macOS, Linux and Android. Firefox shipped the Screen Wake Lock API in May 2024. On older versions, AwakeTab offers a video fallback after one tap. Firefox refuses the lock at 5 % battery or less while not charging, so plug in for long sessions."
facts:
  - label: "Firefox"
    value: "126 or later"
  - label: "Low battery"
    value: "refused at 5 % or less"
  - label: "Older Firefox"
    value: "video fallback after a tap"
  - label: "Extension"
    value: "not for Firefox"
toc:
  set-it-up-in-firefox: "Set it up"
  which-firefox-setups-keep-the-screen-on: "Which setups work"
  what-turns-the-screen-off-anyway: "What turns it off"
steps:
  - title: "Open AwakeTab in Firefox and press Start"
    path: "Firefox › awaketab.com"
    text: "Wait for the pill to say \"Screen awake\". If it says \"Tap to use the fallback\" instead, this Firefox has no Screen Wake Lock API: update to 126 or later, or tap to use the video fallback."
    shot: "AwakeTab in Firefox with the pill reading Screen awake"
  - title: "Keep the tab visible"
    path: "No minimising while it runs"
    text: "Minimise the window or switch tabs and Firefox releases the lock. The pill changes to \"Paused — tab hidden\", and AwakeTab asks again when you come back."
    shot: "the pill after switching tabs and back"
  - title: "Plug in when the battery is low"
    path: "Charger in, then Start"
    text: "At 5 % battery or less and not charging, Firefox refuses the lock or takes it back, and the pill says \"Blocked — here's the fix\". Plug in, then press Start again."
    shot: "the Blocked pill with the Firefox battery fix"
  - title: "Optional: change the system timeout"
    path: "Windows: Settings › System › Power & battery"
    text: "This sets the screen timeout for every app. On a Mac, it is Apple menu › System Settings › Lock Screen. It stays changed until you set it back."
    shot: "the screen timeout choices in Windows 11 Settings"
matrix:
  label: "Firefox support, sources checked 26 September 2026"
  cols: ["Setup", "Result", "What to know"]
  rows:
    - what: "Firefox 126 or later on Windows, macOS or Linux, tab visible"
      result: works
      label: "Supported"
      text: "Native wake lock since 14 May 2024."
    - what: "Firefox 126 or later on Android, tab on screen"
      result: works
      label: "Supported"
      text: "Leaving Firefox releases the lock."
    - what: "Battery at 5 % or less and not charging"
      result: blocked
      label: "Blocked"
      text: "Firefox refuses or releases the lock. Plug in and press Start."
    - what: "Window minimised or another tab in front"
      result: pauses
      label: "Pauses"
      text: "The lock is released until the tab is back in front."
    - what: "Firefox before 126"
      result: fallback
      label: "Video fallback"
      text: "Tap once to start it. It needs this tab visible and uses a little more battery."
    - what: "Stop automatically on low battery"
      result: "no"
      label: "Not available"
      text: "Firefox removed the Battery Status API in version 52, so AwakeTab cannot read the battery level."
    - what: "AwakeTab browser extension"
      result: "no"
      label: "Not available"
      text: "Firefox gives extensions no power API, so there is no Firefox version."
rows:
  blockers:
    - title: "A low battery"
      text: "At 5 % or less and not charging, Firefox itself refuses the lock."
    - title: "A hidden tab"
      text: "A minimised window or another tab in front lets the display go."
    - title: "Locking a Windows PC"
      text: "A locked PC hides the tab and turns the monitor off after 60 seconds."
      link:
        label: "Windows 11 screen turns off after 1 minute"
        href: "/guides/windows-11-screen-turns-off-after-1-minute"
    - title: "A Linux desktop that ignores the request"
      text: "Firefox can grant the lock while the desktop still blanks the screen."
      link:
        label: "Keep the screen on in Linux"
        href: "/on/linux"
faq:
  - q: "Why did Firefox stop keeping the screen on when my battery ran low?"
    a: "Firefox refuses a new wake lock, and releases a held one, when the battery is at 5 % or less and not charging. It is Firefox's own rule. Plug in and press Start again."
  - q: "Is there an AwakeTab extension for Firefox?"
    a: "No. Firefox gives extensions no power API, so an extension could not keep the screen on. The web app keeps it on while its tab is visible."
  - q: "Is the video fallback as good as the native lock?"
    a: "It keeps the screen on, but it needs one tap to start, needs the tab visible and uses more power than a native wake lock. On Firefox 126 or later you do not need it."
  - q: "Does it work in Firefox on Android?"
    a: "Yes, from Firefox 126, while the tab is on screen. Press Home or open another app and the phone goes back to its normal screen timeout."
honestLimit: "Firefox 126 (May 2024) and later hold the lock only while the tab is visible, and refuse it at 5 % battery or less while not charging. Older versions need the video fallback, which uses more power, and no extension can keep the screen on with the tab hidden."
related:
  - "/on/linux"
  - "/on/windows-11"
  - "/learn/browser-support-matrix"
  - "/vs/nosleep-js"
  - "/extension"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up in Firefox

Two steps start a session. The third is Firefox's own low-battery rule, and the fourth is optional.

::steps

::ad

## Which Firefox setups keep the screen on

These results come from Mozilla's documentation and Firefox's source, checked 26 September 2026. Real-device results appear here once recorded.

::matrix

## What turns the screen off anyway

When the screen still goes dark in Firefox, one of these is usually why.

::rows blockers
