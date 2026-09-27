---
title: "Keep the screen on while reading — AwakeTab"
description: "Articles in the browser can stay awake in this tab. Native reader apps hide the browser, so use split-screen if the book lives in another app."
h1: "Keep the screen on while reading"
intent: "keep screen on while reading"
preset: p60
mode: minimal
locale: en
reviewed: true
noindex: true
lastVerified: 2026-09-09
browsers: []
os: []
faq:
  - q: "Does this work if the tab is hidden?"
    a: "No. The browser releases the lock when you switch tabs or apps. Come back and the pill returns to “Screen awake”. On desktop Chrome or Edge, AwakeTab for Chrome keeps the screen on with the tab hidden."
  - q: "Will this keep Teams or Slack Available?"
    a: "No. Teams and Slack set you to Away from keyboard and mouse inactivity, not from a lit screen. AwakeTab never moves the mouse or presses keys."
  - q: "What browsers are in scope?"
    a: "Chrome and Edge 84+, Firefox 126+, Safari 16.4+ and Samsung Internet 14+ support the wake lock natively. Older Firefox can use the video fallback after a tap. Checked against browser documentation on 26 September 2026."
honestLimit: "Only the visible tab is protected; for a reading app, use split-screen with AwakeTab beside it."
related:
  - "/for/workouts"
  - "/on/android-chrome"
  - "/on/firefox"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## What you are actually asking

Articles in the browser can stay awake in this tab. Native reader apps hide the browser, so use split-screen if the book lives in another app.

## How the lock works on this page

AwakeTab asks the browser for a screen wake lock from a secure page that is on screen. The pill at the top of the tool says what the browser answered: "Starting…" while it asks, "Screen awake" once the browser has confirmed the lock, "Paused — tab hidden" when the tab is out of sight, and "Blocked — here's the fix" when the browser refuses, with the cause. Only "Screen awake" and "Awake via video fallback" come with a running timer.

Chrome and Edge 84, Firefox 126, Safari 16.4, Samsung Internet 14 and Opera 70 are the first versions with the Screen Wake Lock API; iPhone and iPad Home Screen apps need iOS 18.4. Older Firefox can use the video fallback after a tap. A browser refuses or takes back the lock when the tab is hidden, when a Permissions-Policy blocks it, when Safari has not had a tap yet, or when Firefox is at 5 % battery or less and not charging. A page without HTTPS has no wake lock at all. Battery savers are not a refusal cause in Chrome or Safari.

## Practical setup

Open this article, keep the embedded tool visible, pick the suggested duration, and watch the pill. If you need the recipe, slides, dashboard or score in another app, use split-screen or a second window so AwakeTab stays on-screen. Closing a laptop lid, switching apps on a phone, or sending this tab to the background ends eligibility until you return.

## Operating-system notes

Windows: Settings > System > Power & battery sets the screen timeout. Energy saver (called Battery saver before Windows 11 24H2) may dim the screen, but it does not refuse a browser wake lock. macOS: System Settings > Lock Screen. While Chrome keeps the display on, the Mac does not idle-sleep; closing the lid still sleeps it unless you use clamshell mode with power and an external display. iPhone: Settings > Display & Brightness > Auto-Lock; Low Power Mode sets Auto-Lock to 30 seconds. Android: Settings > Display (Pixel: Display & touch) > Screen timeout, and some makers' sleeping-apps lists can close a browser after you leave it. Linux: Chrome and Firefox ask the desktop not to sleep; whether that holds depends on your desktop.

## What success looks like

Success is a pill that matches the browser. If the OS still dims, you are looking at a different policy (lock screen, smart card, monitor auto-off) or a hidden tab. Tapping Start again without changing what caused a refusal gets the same answer. Stats count only the time the screen was actually kept awake.


## A short checklist before you walk away

Before you walk away, check that the page uses HTTPS, that this tab is in front, and that the pill says "Screen awake". A dimming clock or a chat avatar tells you nothing about the lock; the pill does. If the pill says "Blocked — here's the fix", follow the line under it instead of tapping Start again. A timed session ends when its time is up, so pick ∞ if you want it to run until you stop it.

## When the pill changes

When you hide the tab, the pill changes to "Paused — tab hidden". That is the page telling the truth, not a bug: the browser has taken the lock back, and AwakeTab asks again as soon as you return. Paused time does not count toward a timed session. If the screen must stay on while the tab is hidden, AwakeTab for Chrome uses Chrome's own power setting instead and keeps working with the tab hidden on desktop Chrome and Edge. Firefox and Safari give extensions no power setting, so there the tab has to stay in view.

## Battery, heat and overnight use

A lit panel costs energy. Plug in for night-clock, dashboard and kiosk sessions. In Chrome and Edge, AwakeTab can stop by itself at a battery level you pick; Firefox and Safari do not tell pages the battery level. OLED burn-in is reduced by night mode pixel shift and is not eliminated. Firmware and OS power rules still win. If you need those jobs, use a native utility and keep this tab for a screen you can see.
