---
title: "Keep an iPad display awake — AwakeTab"
description: "Safari on iPadOS 16.4 or later keeps an iPad display on from a visible tab after one tap. Low Power Mode sets Auto-Lock to 30 seconds."
h1: "Keep an iPad display awake"
intent: "keep ipad screen on"
secondaryQueries:
  - "ipad auto-lock never"
  - "keep ipad awake for sheet music"
  - "stop ipad screen turning off safari"
preset: p60
mode: minimal
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["safari"]
os: ["ipados"]
faq:
  - q: "Which layout keeps AwakeTab beside my music on iPadOS 26?"
    a: "Use windowed apps and tile Safari next to your score app, or open Safari in Slide Over, which returned in iPadOS 26.1. Split View is the name on iPadOS 18 and earlier."
  - q: "Why does my school iPad still lock after two minutes?"
    a: "A school or work profile can cap Auto-Lock, and only its administrator can change it. You can see installed profiles in Settings > General > VPN & Device Management. A visible AwakeTab tab may help within those rules, but it does not change them."
  - q: "Does the screen stay on if my score app fills the whole screen?"
    a: "No. If the score app covers the display, Safari is no longer visible and iPadOS releases the wake lock. Keep a small AwakeTab window on screen beside it, or change Auto-Lock for the length of the rehearsal."
  - q: "Is the iPad any different from an iPhone here?"
    a: "Two things. An iPad can show more than one app, so AwakeTab can stay visible next to a recipe or score. And Safari on iPad lets a page go full screen, which iPhone Safari does not allow for page elements."
honestLimit: "The display stays on only while the AwakeTab tab is visible. If another app fills the screen or you switch Safari tabs, the iPad falls back to its Auto-Lock time, which Low Power Mode cuts to 30 seconds."
related:
  - "/for/cooking"
  - "/on/iphone-safari"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/for/sheet-music"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

The iPad's own switch is Settings > Display & Brightness > Auto-Lock, where you can pick a longer time or Never. To keep the display on for one session instead, open AwakeTab in Safari on iPadOS 16.4 or later and tap Start. The display stays on while the tab is visible and goes back to your Auto-Lock time when you stop, switch tabs or leave Safari.

## Change Auto-Lock

1. Go to Settings, tap Display & Brightness, then Auto-Lock.
2. Pick a longer interval, or Never.
3. If the choices are greyed out, check Settings > Battery for Low Power Mode, then Settings > General > VPN & Device Management for a work or school profile.

The guide to [Auto-Lock being greyed out](/guides/iphone-auto-lock-never-greyed-out) is written for iPhone, and the same two causes apply to an iPad.

## Why use a tab on a shared iPad

A family or school iPad is often shared, and a changed Auto-Lock setting is easy to forget. A tab keeps the display on for one rehearsal, one recipe or one talk, then lets it lock as usual. The Minimal view keeps the screen uncluttered, which suits a music stand. For the kitchen, [cook mode](/for/cooking) adds big timers you can tap with a floury finger.

## Keep AwakeTab beside your score or recipe

Unlike an iPhone, an iPad can show two apps, so the tab can stay visible next to what you are reading.

- **iPadOS 26:** turn on windowed apps and tile Safari beside the other app. Slide Over came back in iPadOS 26.1, if you prefer a narrow floating panel.
- **iPadOS 18 and earlier:** open the other app and Safari in Split View.

The AwakeTab window can be small; it only needs to be on screen. We have not yet recorded which of these layouts keep the wake lock on a real iPad, and the results will appear on /learn/how-we-tested.

## Full screen for a clock or timer

Safari on iPad lets a page element go full screen, which iPhone Safari does not. Tap Fullscreen in AwakeTab's header and the clock or countdown fills the display for a class or a talk, readable from across the room.

## Safari support on iPad

| Where you open AwakeTab | Keeps the display on? | What to know |
|---|---|---|
| Safari on iPadOS 16.4 or later | Yes, once you tap Start | Keep the tab visible |
| Home Screen web app | iPadOS 18.4 or later | Earlier versions have no wake lock there |
| Safari before iPadOS 16.4 | No Screen Wake Lock API | You will see "Tap to use the fallback" |

## What stops it on an iPad

- **Hiding the tab.** Another app filling the screen, a different Safari tab or the Home Screen releases it. The pill shows "Paused — tab hidden" until you come back.
- **Low Power Mode.** It sets Auto-Lock to 30 seconds. Whether the tab still holds the display with it on is not yet tested.
- **No tap.** Safari needs one tap before it grants a wake lock, even from a shared /1h link.
- **Closing the cover or pressing the top button.** Either locks the iPad straight away.

## What we have checked

Apple's Auto-Lock and Low Power Mode documentation, the WebKit source and the iPadOS 26 multitasking changes were checked on 26 September 2026. No iPad device result is recorded yet.
