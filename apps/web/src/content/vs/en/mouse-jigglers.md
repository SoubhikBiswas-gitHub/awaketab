---
title: "A mouse jiggler alternative that fakes no input — AwakeTab"
description: "Mouse jigglers fake pointer movement so chat apps see activity. AwakeTab only keeps the display on, sends no input and won't change your status."
h1: "AwakeTab vs mouse jigglers"
intent: "mouse jiggler alternative"
secondaryQueries:
  - "mouse jiggler vs keep screen awake"
  - "keep screen on without mouse jiggler"
  - "online mouse jiggler"
  - "is a mouse jiggler allowed at work"
preset: p60
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari"]
os: ["windows", "macos", "linux", "chromeos"]
faq:
  - q: "Is AwakeTab a mouse jiggler?"
    a: "No. It never moves the pointer or presses a key. It asks your browser to keep the display on, the same request a video player makes during playback, and it shows you whether the browser said yes."
  - q: "Why doesn't AwakeTab offer a fake-activity mode?"
    a: "Because your status is a signal your colleagues rely on, and faking it has cost people their jobs. AwakeTab does one job: it keeps the screen lit while you read, watch or present, and it tells you plainly when it can't."
  - q: "Will AwakeTab stop my work laptop from locking?"
    a: "It stops the display timeout while its tab is visible. A lock rule set by your IT team, such as a 5-minute sign-in lock, may still lock the screen. That is your organisation's rule, and AwakeTab doesn't change it."
  - q: "Does a wake lock show up in activity monitoring software?"
    a: "It sends no keyboard or mouse input, so a tool that counts input sees none from it. What else a monitoring tool records depends on the product. If you're unsure what your employer's software measures, ask your IT team."
honestLimit: "AwakeTab won't move the pointer or press keys, so it can't do what a jiggler does. If the goal is to look active, it's the wrong tool; if the goal is a screen you can keep reading, it's the right one."
related:
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/for/work-laptop"
  - "/guides/lock-screen-vs-sleep"
  - "/on/windows-11"
  - "/for/video-calls"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

They do different jobs. A mouse jiggler fakes pointer movement, from a USB device or an app, so the computer and your chat apps think someone is at the desk. AwakeTab keeps the display on through the browser's Screen Wake Lock API and sends no input at all. The screen stays lit, and Teams or Slack still set you to Away when you stop typing.

## What each one actually does

A **hardware jiggler** plugs into USB, presents itself as a mouse and nudges the pointer now and then. A **software jiggler** does the same from an app, or sends key presses. Either way the operating system sees input, so every idle timer resets: the screen timeout, sleep, and the inactivity timers chat apps use for presence.

**AwakeTab** makes a different request. The browser asks the operating system to keep the display on, the way a video player does during playback. Nothing is typed and nothing moves, so the timers that watch for input keep counting. Microsoft Teams sets Away after about 5 minutes without keyboard or mouse activity (Microsoft Learn), and Slack after about 10 minutes of desktop inactivity (Slack Help), both checked 26 September 2026. [Does keeping your screen on keep Teams green?](/learn/does-a-wake-lock-keep-teams-green) walks through what sets each status.

## Jigglers and AwakeTab compared on 26 September 2026

| Feature | USB mouse jiggler | Software jiggler | AwakeTab |
|---|---|---|---|
| Mechanism | A device the computer treats as a mouse | An app that moves the pointer or sends keys | Screen Wake Lock API, no input |
| Works with the tab hidden | Yes, no tab involved | Yes | No: the tab must stay visible |
| Changes chat status | Yes, it looks like activity | Usually | No |
| Install | Plug in | Install an app | None |
| Platforms | Any computer with USB | Depends on the app | Current Chrome, Edge, Firefox and Safari |
| Price | About $4 to $40 (Banking Dive, June 2024) | Often free | Free, with optional Pro |
| Last release | Not applicable | Varies by app | Web app, see the [changelog](/changelog) |

## When a jiggler is the better pick

- **Your own machine has no usable browser.** An old computer or a dedicated rig running one native app full screen can't show a tab beside it. A USB device needs no software on the machine at all.
- **An app on your own computer times out on input, not on display sleep.** Some programs log out or pause after a spell without input, and keeping the screen lit does nothing for them. On a computer you own, where no one else's rules apply, a jiggler addresses that timer and AwakeTab can't.

On a work computer, whether simulated input is acceptable is your employer's call, not a tool's.

## When AwakeTab is the better pick

- **You need the screen on for a reason anyone can see.** Reading a long report, watching a dashboard, following a recipe or presenting. [Keep a work laptop display awake](/for/work-laptop) covers the office case.
- **You'd rather not have to explain it.** AwakeTab doesn't fake activity, doesn't change your status and leaves sign-in and lock policies alone. It keeps the display on the same way a video player does. If your employer has rules about screen locking, follow them.
- **You want to know it's working.** You can read the state at a glance: "Screen awake" while the lock holds, "Paused — tab hidden" after you switch away.

## Presence, policy and the Wells Fargo case

Employers can treat simulated activity as misconduct. Bloomberg reported in June 2024 that Wells Fargo had dismissed more than a dozen employees over "simulation of keyboard activity". That is why AwakeTab refuses to fake input, and why it won't add a mode that does.

If the worry is a grey dot while you read, the fixes are human ones: a status that says what you're doing, time blocked in your calendar, a word with your manager. For how a lit screen differs from a locked one, see [Lock screen versus display sleep](/guides/lock-screen-vs-sleep).
