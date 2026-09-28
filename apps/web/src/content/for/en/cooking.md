---
title: "Cook mode: keep your screen on while cooking — AwakeTab"
description: "Keep the screen on with floury hands: kitchen timers, a one-tap pause, no install. It works while its tab is visible; on a phone, that is the catch."
h1: "Keep your screen on while cooking"
crumb: "Cooking"
intent: "keep screen on while cooking"
secondaryQueries:
  - "cook mode keep screen on"
  - "keep iphone screen on for recipe"
  - "keep ipad screen on while cooking"
  - "kitchen timer that keeps screen on"
preset: pinf
mode: cook
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet"]
os: ["ipados", "ios", "android", "windows", "macos", "chromeos"]
lead: "Phones dim and lock after 30 seconds to a few minutes without a touch, and nobody wants to wake a screen with floury fingers. AwakeTab asks your browser for a screen wake lock, so the display stays on for as long as you cook. It works while this tab is on screen, next to the recipe or on its own, and the pill in the tool tells you whether the lock is really held."
toc:
  what-to-expect-while-you-cook: "What to expect"
steps:
  - title: "Open this page on the kitchen device."
    text: "Prop the phone, tablet or laptop where you can read it from the counter. Plug it in if the cook will run long."
  - title: "Tap \"Keep awake · ∞\"."
    text: "The tool is already in cook mode with no end time. In Safari, this tap is also the one the browser needs before it grants the lock. Wait for the pill to read \"Screen awake\"."
  - title: "Put the recipe beside it."
    text: "On an iPad, a laptop or an Android phone in split screen, open the recipe in a window next to AwakeTab. On an iPhone only one app is on screen, so keep this tab in front and use the kitchen timers here."
figures:
  - frame: phone
    label: "Phone screenshot"
    alt: "AwakeTab in cook mode on iPhone Safari"
    caption: "Cook mode on iPhone Safari."
  - frame: desktop
    label: "Desktop screenshot"
    alt: "a recipe and AwakeTab side by side in Chrome on a laptop"
    caption: "A recipe and AwakeTab side by side in Chrome on a laptop."
pills:
  - state: requesting
    text: "AwakeTab has asked the browser and is waiting for an answer."
  - state: held
    text: "The browser is holding the lock, so the screen stays on while you cook."
  - state: lost
    text: "You switched apps, changed tabs or the phone locked. Come back to this tab and AwakeTab asks again."
  - state: denied
    text: "The browser said no. The card names the cause, such as Safari wanting one more tap, or Firefox at 5% battery or less while not charging."
checklist:
  - "The phone or tablet is plugged in for a braise or a slow bake."
  - "Low Power Mode is off on iPhone, so Auto-Lock is not forced to 30 seconds."
  - "A kitchen timer is set for anything in the oven."
  - "The pill reads \"Screen awake\" before your hands get messy."
faq:
  - q: "My hands are covered in flour. How do I pause without a mess?"
    a: "Tap the big number with a knuckle or the back of a finger. In cook mode the whole elapsed timer is one large target, so you do not need to hit a small button. The screen stays on while the count is paused, and your kitchen timers keep counting down."
  - q: "The recipe is in another app. Can I still use AwakeTab?"
    a: "Yes, if both stay on screen. Put the recipe app and your browser in side by side windows on an iPad, or use split screen on Android. On an iPhone only one app shows at a time, so use the recipe site's own cook mode, or a longer Auto-Lock in Settings > Display & Brightness until you finish."
  - q: "Will a long braise drain my battery?"
    a: "The wake lock costs almost nothing; the lit screen is what uses power. For a cook that runs for hours, plug the phone in and turn the brightness down. In Chrome and Edge, AwakeTab can also stop by itself at a battery level you pick in Settings."
  - q: "Does it keep working if the phone locks?"
    a: "No. Pressing the side button or letting the phone lock hides the page, and the browser takes the lock back. Unlock it and return to this tab, and AwakeTab asks the browser again."
honestLimit: "Works while the AwakeTab tab is on screen. On a phone the recipe and AwakeTab cannot both be in front, so opening another app releases the lock until you return, and so does locking the phone."
related:
  - "/on/iphone-safari"
  - "/on/android-chrome"
  - "/on/ipad"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/embed"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

## Set it up in 30 seconds

::steps

::figures

::ad

## What to expect while you cook

Cook mode counts up from the moment the screen is held, so you can see how long the onions have had. Tap the big number to pause the count; the screen stays on while it is paused. Add up to three kitchen timers with the 5, 10, 15, 30 and 60 min buttons. Each one counts down on its own, chimes and flashes at zero, and keeps running while the count is paused. Cook mode has no end time, so no end-of-session prompt interrupts a recipe.

The pill at the top of the tool tells you what the browser is doing:

::pills

## Before a long cook

::checklist
