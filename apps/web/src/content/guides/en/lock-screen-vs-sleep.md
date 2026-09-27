---
title: "Lock screen vs display sleep on Windows and Mac — AwakeTab"
description: "Display sleep, the sign-in lock, screen savers and Modern Standby are separate settings. A wake lock stops display sleep, not a sign-in policy."
h1: "Lock screen versus display sleep"
intent: "prevent screen from locking windows 11"
secondaryQueries:
  - "lock screen vs sleep"
  - "modern standby"
  - "modern standby keep awake"
  - "windows 11 require sign in after sleep"
  - "dynamic lock windows 11"
  - "mac require password after display is turned off"
preset: p30
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers:
  - chrome
  - edge
os:
  - windows
  - macos
faq:
  - q: "Can I stop Windows 11 asking for my password without admin rights?"
    a: "If the choice under Accounts > Sign-in options is not greyed out, you can change it yourself. If it is greyed out, your organisation sets it and only IT can change it. Keeping the display on from a tab needs no admin rights."
  - q: "My PC locked even though the screen never went dark. What did that?"
    a: "Something other than display sleep: usually Dynamic lock (your paired phone left with you), a work inactivity policy, or a screen saver that asks for a password."
  - q: "Does Modern Standby drain my battery with the lid closed?"
    a: "It can, and the cause is usually a driver or an app waking the PC. Run powercfg /sleepstudy in an administrator terminal: the report shows each standby session and what used power during it. A wake lock plays no part once the lid is shut."
  - q: "Is the Mac's password delay the same as its display timeout?"
    a: "No. The timeout decides when the screen turns off; the password delay decides how long after that you can wake the Mac without typing your password. Each can be set without the other."
honestLimit: "A wake lock stops the display sleeping. It does not change when Windows or macOS asks for your password, and a work policy that locks after inactivity can still lock the screen while the pill says \"Screen awake\"."
related:
  - "/guides/windows-11-screen-turns-off-after-1-minute"
  - "/on/windows-11"
  - "/on/macos"
  - "/for/work-laptop"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

Your screen going dark and your computer locking are two separate settings. Display sleep turns the screen off after a timeout. The sign-in lock asks for your password when you come back. A screen saver, Dynamic lock or a work policy can lock you out as well. A wake lock stops display sleep only, so to stop the lock you need to find which setting is doing it.

## What looks like "the screen locked"

| What you see | The setting behind it | Does a wake lock change it? |
|---|---|---|
| Screen dark; a key brings it back with no password | Display timeout | Yes, while its tab is visible |
| Screen dark; you must sign in to get back | Display timeout, then the sign-in rule | It stops the dark screen; the sign-in rule stays as set |
| A pattern or picture, then a sign-in | Screen saver with a password on resume | Not reliably; change the screen saver |
| Locked soon after you walk away with your phone | Dynamic lock (Windows) | No |
| Locked after a fixed time on a work PC | An inactivity policy from IT | No |
| PC asleep or in standby | Sleep or Modern Standby | It prevents idle sleep while the tab is visible; not after the lid closes |

While the screen is kept on, neither Windows nor macOS idle-sleeps, but that does not reach the sign-in rules.

## Windows 11: where each setting lives

1. **Display timeout:** in Settings, go to System, then Power & battery, and open the timeouts section.
2. **Sign-in on return:** Settings > Accounts > Sign-in options, then "If you've been away, when should Windows require you to sign in again?"
3. **Dynamic lock:** the same page. It locks the PC when a phone paired over Bluetooth goes out of range.
4. **Screen saver:** Settings > Personalization > Lock screen > Screen saver. Untick "On resume, display logon screen", or set the screen saver to (None).
5. **Work policy:** if choices are greyed out and Settings notes that your organisation manages them, IT has set them. One common source is the "Interactive logon: Machine inactivity limit" policy. Ask IT.

## Mac: where each setting lives

On macOS Ventura and later, almost everything is in **System Settings > Lock Screen**:

1. **Turn display off on battery when inactive** and **Turn display off on power adapter when inactive** set the display timeout.
2. **Start Screen Saver when inactive** sets the screen saver.
3. **Require password after screen saver begins or display is turned off** sets the sign-in rule. "Immediately" means any dark screen is a locked screen.

A work Mac can have these set by a profile, in which case they are greyed out.

## Modern Standby: the part a wake lock can't touch

Many recent Windows laptops use Modern Standby (S0 low-power idle) in place of classic sleep. When the screen goes off, firmware and drivers run the PC in a low-power state, more like a phone.

A wake lock keeps the display on, so the PC does not enter standby while the tab is visible. Once the screen is off or the lid is closed, drivers and firmware decide what happens.

To see what your PC does:

1. Open an administrator terminal.
2. Run `powercfg /a` to list the sleep states the PC supports. "Standby (S0 Low Power Idle)" means Modern Standby.
3. Run `powercfg /sleepstudy`. It saves a report of recent standby sessions and what used the battery during each.

## Confirm which one you hit

- On Windows, an administrator terminal running `powercfg /requests` lists Chrome or Edge in its DISPLAY section while the AwakeTab tab is visible.
- On a Mac, Terminal's `pmset -g assertions` output should include a PreventUserIdleDisplaySleep line from the browser.
- If that entry is there and the computer still locks, a sign-in rule or policy is doing it.

## Keeping the display on from a tab

The 30-minute timer above keeps the display on while its tab is visible. It leaves every lock rule in place; if your employer sets one, follow it. Managed machines get their own page: [keeping a work laptop display awake](/for/work-laptop). For browser steps per system, see the [Windows 11 device page](/on/windows-11) or the [Mac device page](/on/macos). A screen that goes dark after only a minute has its own guide: [Windows 11 screen turns off after 1 minute](/guides/windows-11-screen-turns-off-after-1-minute).
