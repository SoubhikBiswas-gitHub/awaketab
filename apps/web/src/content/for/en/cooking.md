---
title: "Cook mode: keep your screen on while cooking — AwakeTab"
description: "Keep the screen on with floury hands: kitchen timers, a one-tap pause, no install. It works while its tab is visible; on a phone, that is the catch."
h1: "Cook mode: keep your screen on while you cook"
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
faq:
  - q: "Can AwakeTab keep a recipe app awake on my iPhone?"
    a: "No. The browser keeps the screen on only while AwakeTab’s own tab is in front, and an iPhone shows one app at a time. Open the recipe app and the screen follows Auto-Lock again. Use the app’s own keep-awake option, or a longer Auto-Lock until you finish."
  - q: "What happens when I tap the big number?"
    a: "The count-up stops and the hint tells you it is paused, but the screen stays on. Any kitchen timers you added carry on counting down. Tap the number again to carry on counting from where you stopped."
  - q: "Do my kitchen timers survive if the page reloads?"
    a: "Yes. Timers are saved in this browser with the session, so a reload or an accidental swipe back picks them up with the right time left."
  - q: "Does iPhone Low Power Mode matter in the kitchen?"
    a: "It can. Low Power Mode sets Auto-Lock to 30 seconds, and we have not yet recorded a device test of whether a Safari wake lock still holds under it. Until that result is published, turn Low Power Mode off while you cook."
honestLimit: "On a phone, AwakeTab keeps the screen on only while its own tab is in front. It cannot keep a recipe in another app or tab lit; use that site’s cook mode or a longer Auto-Lock instead."
related:
  - "/on/ipad"
  - "/on/iphone-safari"
  - "/guides/iphone-auto-lock-never-greyed-out"
  - "/on/android-chrome"
  - "/embed"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

AwakeTab's cook mode keeps the screen on with big kitchen timers and a count you pause with one tap. It works only while its tab is visible. On a tablet or laptop, put it beside the recipe. On an iPhone only one app is in front, so AwakeTab can't keep a recipe in another app or tab awake. Use the recipe site's own cook mode if it has one, or lengthen Auto-Lock while you cook.

## Which screen to cook from

| Device | Does it fit? | How |
|---|---|---|
| iPad | Yes | Two Safari windows side by side: windowed apps on iPadOS 26, Split View on iPadOS 18 and earlier |
| Android tablet or phone | Yes, with split screen | The recipe in one half, AwakeTab in the other |
| Laptop | Yes | Two browser windows next to each other |
| iPhone | Only for the timers | The recipe can't share the screen, so see the iPhone section below |

A wake lock keeps the whole display on, not one window. So when the AwakeTab half is visible, the recipe half stays lit too. We have not yet recorded a device test of Android split screen; the result will appear on our how-we-tested page.

## Set it up on a tablet or laptop

1. Open the recipe in one window.
2. Open AwakeTab in a second window and place it beside the recipe. On iPad, [the iPad page](/on/ipad) has the details for your iPadOS version.
3. Tap the big number. The pill shows "Starting…", then "Screen awake" once the browser agrees. Safari needs that tap before it will keep the screen on, so the page never starts by itself there.

## On an iPhone

The recipe and AwakeTab can't both be in front, so pick one of these:

- **The recipe site's cook mode.** Many recipe sites have a "Cook Mode" switch on the recipe card. It keeps the screen on for that page, which is exactly what you need.
- **A longer Auto-Lock, for tonight only.** Settings > Display & Brightness > Auto-Lock, then set it back afterwards. If Never is greyed out, the fix is in [iPhone Auto-Lock greyed out or stuck at 30 seconds](/guides/iphone-auto-lock-never-greyed-out).
- **AwakeTab for the timers alone.** If you cook from a printed page or from memory, cook mode on the phone gives you three timers on a screen that stays on while the tab is in front. [Keep your iPhone screen on in Safari](/on/iphone-safari) covers the Safari details.

## How cook mode works

The big number counts up from zero when you start, so you can see how long the onions have had. Tap it to pause the count; the screen stays on while it is paused. Tap again to carry on.

Below it you can add up to three kitchen timers. Give one a name ("Rice") if you like, then tap 5, 10, 15, 30 or 60 minutes, or type your own length. Each timer chimes when it reaches zero, flashes, and can send a notification if you allowed them.

## What you'll see

"Screen awake" means the browser has confirmed the lock. If you switch tabs or apps, the pill changes to "Paused — tab hidden" and the screen follows its normal timeout. Come back and AwakeTab asks again. On a very old browser without wake lock support, the pill offers "Tap to use the fallback", which uses a silent video and shows "Awake via video fallback".

## For recipe-site owners

The phone problem goes away when the lock lives on the recipe page itself. The free [Cook Mode widget](/embed) adds a button and kitchen timers to your recipe with one script tag, and shows your readers the same status pill. The Embed licence, $29 a year per site, removes the credit link and applies your brand; sales open soon.
