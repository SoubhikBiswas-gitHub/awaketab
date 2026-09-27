---
title: "iPhone Auto-Lock greyed out? Causes and fixes — AwakeTab"
description: "Auto-Lock is greyed out and stuck at 30 seconds when Low Power Mode is on or a work or school profile sets it. How to check each one, step by step."
h1: "iPhone Auto-Lock greyed out or stuck at 30 seconds"
intent: "iphone auto lock never greyed out"
secondaryQueries:
  - "iphone auto lock greyed out"
  - "iphone auto lock stuck at 30 seconds"
  - "auto lock never missing iphone"
  - "low power mode auto lock"
  - "auto lock managed by work profile"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers:
  - safari
os:
  - ios
  - ipados
faq:
  - q: "Why does Auto-Lock go back to 30 seconds every evening?"
    a: "Something switches Low Power Mode on again, and that resets Auto-Lock to 30 seconds. A battery-level automation in Shortcuts is the usual reason, especially one someone else set up on a shared or family phone."
  - q: "Will removing the work profile bring Never back?"
    a: "It may, but it usually takes work email, apps and Wi-Fi with it, and it can break your employer's rules. Some managed phones do not let you remove the profile at all. Ask the administrator whether they can raise the limit for your role instead."
  - q: "Is Never a bad idea for the battery?"
    a: "A lit screen is the biggest drain on a phone, so Never costs battery every time you forget to lock it. It is fine on a charger. For cooking or reading, 5 minutes is often enough."
  - q: "Does the same fix work on an iPad?"
    a: "Yes. The iPad has the same Auto-Lock row under Display & Brightness, and a school or work profile can cap it in the same way. On an iPad you can also keep AwakeTab on screen next to another app, which a phone cannot do."
honestLimit: "We have not yet recorded a device test of whether a Safari wake lock keeps an iPhone screen on while Low Power Mode is on, so this page does not claim it. Until that result is in, turning Low Power Mode off is the fix we can stand behind."
related:
  - "/on/iphone-safari"
  - "/on/ipad"
  - "/for/cooking"
  - "/learn/low-power-mode-and-wake-locks"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

If Auto-Lock is greyed out and stuck at 30 seconds, Low Power Mode is almost certainly on: iOS sets Auto-Lock to 30 seconds while it runs. Turn it off in Settings > Battery and the other options, including Never, come back. If Low Power Mode is off and Auto-Lock is still locked, a work or school profile sets it, and only its administrator can change it.

## The causes, most likely first

1. **Low Power Mode is on.** Apple's page on Low Power Mode lists "Sets Auto-Lock to 30 seconds" among the things it changes ([Apple Support](https://support.apple.com/en-us/101604), checked 26 September 2026). The row is greyed out on purpose; nothing is broken. The giveaway is a yellow battery icon at the top of the screen.
2. **Low Power Mode keeps switching itself back on.** An automation or the low-battery alert is turning it on again.
3. **A work or school profile caps Auto-Lock.** A phone managed by an employer or a school can have a maximum Auto-Lock time set by its administrator. Never, and sometimes the longer choices, are then missing or greyed out, even with Low Power Mode off.

## Turn off Low Power Mode

These steps are the same on iOS 16 through iOS 26.

1. Open **Settings > Battery**.
2. Find **Low Power Mode** and switch it off.
3. Open **Settings > Display & Brightness > Auto-Lock**.
4. Pick a length. The choices run from 30 seconds to 5 minutes, plus Never.

If you added the Low Power Mode button to Control Centre, tapping it there does the same as step 2.

## Stop it coming back

1. Open the **Shortcuts** app and tap **Automation**.
2. Look for an automation that runs when the battery drops to a level, or one that uses the "Set Low Power Mode" action.
3. Turn it off or delete it.
4. When the low-battery alert appears, dismiss it rather than tapping Low Power Mode.

## If it's greyed out and Low Power Mode is off

This is the managed case.

1. Open **Settings > General > VPN & Device Management**.
2. If you see a profile from your employer, your school or a device management service, the phone is managed.
3. Tap the profile to see who issued it and what it includes.
4. If it is a profile you installed yourself and no longer need, you can remove it here, then check Auto-Lock again.
5. If it belongs to work or school, ask the administrator. The limit is usually a security rule.

## Confirm which one it is

- **Stuck at exactly 30 seconds, greyed out, yellow battery:** Low Power Mode.
- **Longer choices available but no Never, battery icon normal:** most likely a profile limit.
- **Everything available but the screen still locks early:** set Auto-Lock to 1 minute and time it without touching the phone. If it locks on time, the setting itself works.

## Meanwhile: a tab as a stopgap

If you can't change the setting yet, a browser tab can keep the screen on while it is in front. Open AwakeTab in Safari 16.4 or later and tap Start in the timer above, which is set to 30 minutes. The pill says "Screen awake" only once Safari confirms the wake lock. If you switch apps, iOS releases it; come back and AwakeTab asks again.

Two cases are not yet tested: whether a Safari wake lock still holds while Low Power Mode is on, and whether it holds on a phone whose profile caps Auto-Lock. We will publish both results with our device tests. The full Safari walk-through is on [keep your iPhone screen on in Safari](/on/iphone-safari).

## When the screen you need is another app

A wake lock in a tab covers that tab only. On an iPhone only one app can be in front, so AwakeTab cannot keep a recipe app or a PDF reader on. For a kitchen, the [cook mode page](/for/cooking) explains what works on a phone and what does not. An iPad can show AwakeTab next to the app you are using; see [keeping an iPad display awake](/on/ipad).
