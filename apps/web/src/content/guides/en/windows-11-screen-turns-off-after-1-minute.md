---
title: "Windows 11 screen turns off after 1 minute — AwakeTab"
description: "Three usual causes: the lock screen's own 60-second display timeout, a 1-minute power setting, or a work policy. How to check each, with exact steps."
h1: "Windows 11 screen turns off after 1 minute: how to fix it"
intent: "windows 11 screen turns off after 1 minute"
secondaryQueries:
  - "windows 11 screen turns off after 1 minute when locked"
  - "monitor turns off after 60 seconds lock screen"
  - "console lock display off timeout"
  - "windows 11 screen timeout not working"
  - "windows 10 screen turns off after 1 minute"
preset: p60
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers:
  - chrome
  - edge
os:
  - windows
faq:
  - q: "How do I undo the lock-screen change?"
    a: "Run the same powercfg command with 60 as the number of seconds, then run the /setactive command again. That puts back the Windows default. Use /setdcvalueindex as well if you also changed the value for battery power."
  - q: "Why is the timeout fine on the charger but 1 minute on battery?"
    a: "Windows keeps two separate screen timeouts, one for battery and one for plugged in. Changing one leaves the other alone. Energy saver may also shorten timeouts or dim the screen on battery, so check Settings > System > Power & battery > Energy saver too."
  - q: "My pill said \"Paused — tab hidden\" and the screen went off. Why?"
    a: "Chrome and Edge take the wake lock back when the tab is hidden: another tab in front, the window minimised, or a full-screen app on top. The normal timeout then applies again. Keep the tab visible, or use AwakeTab for Chrome, which works with the tab hidden."
  - q: "Is a 1-minute timeout a sign that something is wrong with my PC?"
    a: "No. It is a setting, a policy or the lock screen doing what it was told. Nothing on this page needs a driver update or a repair Work through the four causes in order."
honestLimit: "AwakeTab cannot change the 60-second display timeout on the Windows lock screen. For that case, Microsoft's powercfg setting is the fix. A tab helps only while you are signed in and it is visible."
related:
  - "/on/windows-11"
  - "/guides/lock-screen-vs-sleep"
  - "/for/work-laptop"
  - "/vs/powertoys-awake"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

If the screen goes dark about a minute after you lock the PC (Windows key + L), that is Windows' separate lock-screen timeout: 60 seconds by default, and the "Turn off my screen after" setting doesn't change it. Microsoft documents a `powercfg` fix. If it happens while you're signed in and working, check your power timeout, then the screen saver, then any work policy.

## The causes, most likely first

1. **The lock-screen display timeout.** Once the PC is locked, Windows switches the monitor off a minute later, on a timer of its own that Microsoft describes as by design ([Microsoft Learn: Monitor powers off when computer is locked](https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/monitor-powers-off-when-pc-locked), checked 26 September 2026). It only happens at the lock screen.
2. **A 1-minute screen timeout.** Windows has one value for battery and one for plugged in. One of them may be set to 1 minute.
3. **A screen saver with a 1-minute wait.** A blank screen saver looks exactly like the display turning off.
4. **A work or school policy.** On a managed PC, your organisation can set the timeout and lock the setting.

## Fix the lock-screen timeout

This works on Windows 11 and Windows 10.

1. Right-click Start and choose **Terminal (Admin)**. On Windows 10 it is **Windows PowerShell (Admin)**.
2. To set 10 minutes when plugged in, run `powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 600`. The number is in seconds.
3. For battery power, run the same command with `/setdcvalueindex` in place of `/setacvalueindex`.
4. Run `powercfg.exe /setactive SCHEME_CURRENT` to apply it.
5. Press Windows key + L and time how long the screen stays on.

Microsoft's article also shows how to add this setting, "Console lock display off timeout", to Advanced power settings if you prefer a menu.

## Fix a 1-minute power setting

1. Open **Settings > System > Power & battery**.
2. Expand **Screen, sleep & hibernate timeouts**. On older Windows 11 builds this section is called **Screen and sleep**.
3. Set both "turn off my screen" choices, on battery and when plugged in, to the length you want.
4. On Windows 10 the same choices are in **Settings > System > Power & sleep**.

If the battery value keeps coming back short, check Energy saver on the same page (Battery saver before Windows 11 24H2).

## Check the screen saver

1. Open **Settings > Personalization > Lock screen** and choose **Screen saver**.
2. Set it to **(None)**, or raise **Wait** above your screen timeout.
3. Note the **On resume, display logon screen** box. It decides whether you sign in again afterwards, which is a separate question covered in [lock screen versus display sleep](/guides/lock-screen-vs-sleep).

## If the setting is greyed out or managed

If Settings shows "Some of these settings are managed by your organization", or your changes revert after a restart, the timeout comes from a policy. Only your IT team can change it, so ask them. The [work laptop page](/for/work-laptop) covers what a browser tab can and cannot do on a managed PC.

## Confirm what is happening

- Run `powercfg /query SCHEME_CURRENT SUB_VIDEO` to see your current display timeouts. Values are shown in seconds, written in hexadecimal: `0x3c` is 60.
- Run `powercfg /requests` in an administrator terminal. The **DISPLAY** section lists every app that is asking Windows to keep the screen on. If it is empty, nothing is.

## Skip the settings for now

If you can't change the timeout, a visible browser tab can hold it while you work. The timer above this guide starts a 1-hour session. In Chrome or Edge, AwakeTab sends Windows a request to keep the display on, and the pill turns to "Screen awake" when the browser has granted it. While it holds, the browser shows up under DISPLAY in `powercfg /requests`.

It does not touch the lock-screen timeout. We have not recorded whether a browser's request keeps the display on at the lock screen, so use the powercfg fix above for that. For the full Windows walk-through, see [keep the screen on in Windows 11](/on/windows-11).
