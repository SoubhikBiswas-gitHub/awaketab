---
title: "iPhone Auto-Lock greyed out? Causes and fixes — AwakeTab"
description: "Auto-Lock is greyed out and stuck at 30 seconds when Low Power Mode is on or a work or school profile sets it. How to check each one, step by step."
h1: "iPhone Auto-Lock greyed out or stuck at 30 seconds"
crumb: "Auto-Lock greyed out"
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
lead: "If Auto-Lock is greyed out and stuck at 30 seconds, Low Power Mode is almost certainly on: iOS sets Auto-Lock to 30 seconds while it runs. Turn it off and the other options, including Never, come back. If Low Power Mode is off and Auto-Lock is still locked, a work or school profile sets it, and only its administrator can change it."
steps:
  - title: "Turn off Low Power Mode"
    short: "Low Power Mode off"
    path: "Settings › Battery › Low Power Mode"
    text: "A yellow battery icon means it is on. Switch it off here, or with the Low Power Mode button in Control Centre if you have added it. Apple lists \"Sets Auto-Lock to 30 seconds\" among the things it changes ([Apple Support](https://support.apple.com/en-us/101604), checked 26 September 2026)."
  - title: "Choose Never in Auto-Lock"
    short: "Auto-Lock to Never"
    path: "Settings › Display & Brightness › Auto-Lock"
    text: "The choices run from 30 seconds to 5 minutes, plus Never. Pick Never only if you want the whole phone to stay on. For most tasks, 5 minutes is a kinder choice for the battery."
  - title: "Look for a work or school profile"
    short: "Check for a profile"
    path: "Settings › General › VPN & Device Management"
    text: "If you see a profile from your employer, your school or a device management service, the phone is managed and the profile may cap Auto-Lock. Tap it to see who issued it and what it includes. Older iOS versions may give this screen a different name."
  - title: "Check that it stuck"
    short: "Check it stuck"
    path: "Leave the phone untouched for a while"
    text: "Set Auto-Lock to 1 minute and time it without touching the phone. If it locks on time, the setting works. If it goes back to 30 seconds, Low Power Mode has come back on."
stepsDone: "All four done. If Never is still grey, read the next section."
toolNote: "If you only need the screen on for one task, you can leave Auto-Lock alone. AwakeTab keeps the screen on while its Safari tab is in front, in Safari 16.4 or later. Tap Keep awake once, because Safari needs that tap. The pill says \"Screen awake\" only once Safari confirms the lock. When you leave the tab, your normal Auto-Lock takes over again."
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

## Get Never back in four steps

These paths are the same on iOS 16 through iOS 26. Older versions can name screens differently.

::steps

## If the setting is still greyed out

With Low Power Mode off, a grey Never most likely means a configuration profile. Schools and employers can set the longest Auto-Lock time a phone may use, and iOS then hides or greys out anything longer, even with Low Power Mode off.

Only the person who manages the phone can lift that limit. If the profile is one you installed yourself and no longer need, you can remove it under **Settings > General > VPN & Device Management**, then check Auto-Lock again. Removing a work profile can also remove your work email, apps and Wi-Fi settings, so ask the administrator first. The limit is usually a security rule.

- **Stuck at exactly 30 seconds, greyed out, yellow battery:** Low Power Mode.
- **Longer choices available but no Never, battery icon normal:** most likely a profile limit.
- **Everything available but the screen still locks early:** time a 1-minute Auto-Lock without touching the phone. If it locks on time, the setting itself works.

::ad

## Stop Low Power Mode coming back

Open the **Shortcuts** app and tap **Automation**. Look for an automation that runs when the battery drops to a level, or one that uses the "Set Low Power Mode" action, and turn it off or delete it. When the low-battery alert appears, dismiss it rather than tapping Low Power Mode.

## When the screen you need is another app

A wake lock in a tab covers that tab only. On an iPhone only one app can be in front, so AwakeTab cannot keep a recipe app or a PDF reader on. For a kitchen, the [cook mode page](/for/cooking) explains what works on a phone and what does not. An iPad can show AwakeTab next to the app you are using; see [keeping an iPad display awake](/on/ipad). The full Safari walk-through is on [keep your iPhone screen on in Safari](/on/iphone-safari).
