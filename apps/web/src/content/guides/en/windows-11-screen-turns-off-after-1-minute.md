---
title: "Windows 11 screen turns off after 1 minute — AwakeTab"
description: "Four usual causes: the lock screen's 60-second display timeout, a 1-minute power setting, a screen saver or a work policy. How to check each, step by step."
h1: "Windows 11 screen turns off after 1 minute: how to fix it"
crumb: "Screen off after 1 minute"
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
lead: "If the screen goes dark about a minute after you lock the PC (Windows key + L), that is the lock screen's own display timeout. It is 60 seconds by default, and the \"Turn off my screen after\" setting does not change it. A `powercfg` command sets it longer. If the screen goes dark while you are signed in, check your power timeout, then the screen saver, then any work policy."
steps:
  - title: "Open an administrator terminal"
    short: "Open Terminal (Admin)"
    path: "Start (right-click) › Terminal (Admin)"
    text: "On Windows 10 the same menu item is **Windows PowerShell (Admin)**."
  - title: "Set the timeout for plugged-in power"
    short: "Set the plugged-in value"
    path: "Terminal (Admin)"
    text: "Run `powercfg.exe /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 600` to set 10 minutes. The number is in seconds, so pick your own."
  - title: "Set the timeout for battery power"
    short: "Set the battery value"
    path: "Terminal (Admin)"
    text: "On a laptop, run the same command with `/setdcvalueindex` in place of `/setacvalueindex`."
  - title: "Apply the change"
    short: "Apply it"
    path: "Terminal (Admin)"
    text: "Run `powercfg.exe /setactive SCHEME_CURRENT`. Until you do, Windows keeps the old value."
  - title: "Check that it stuck"
    short: "Check it stuck"
    path: "Windows key + L"
    text: "Lock the PC and time how long the screen stays on. If it lasts longer than a minute, the fix worked."
stepsDone: "All five done. If the screen still goes dark a minute after you lock the PC, or your change reverts, read the next section."
toolNote: "If you can't change a timeout, a visible browser tab can hold the display on while you are signed in. In Chrome or Edge, AwakeTab asks Windows to keep the display on, and the pill says \"Screen awake\" once the browser grants it. It does not touch the lock-screen timeout, so use the powercfg fix for that."
faq:
  - q: "How do I undo the lock-screen change?"
    a: "Run the same powercfg command with 60 as the number of seconds, then run the /setactive command again. That puts back the Windows default. Use /setdcvalueindex as well if you also changed the value for battery power."
  - q: "Why is the timeout fine on the charger but 1 minute on battery?"
    a: "Windows keeps two separate screen timeouts, one for battery and one for plugged in. Changing one leaves the other alone. Energy saver may also shorten timeouts or dim the screen on battery, so check Settings > System > Power & battery > Energy saver too."
  - q: "My pill said \"Paused — tab hidden\" and the screen went off. Why?"
    a: "Chrome and Edge take the wake lock back when the tab is hidden: another tab in front, the window minimised, or a full-screen app on top. The normal timeout then applies again. Keep the tab visible, or use AwakeTab for Chrome, which works with the tab hidden."
  - q: "Is a 1-minute timeout a sign that something is wrong with my PC?"
    a: "No. It is a setting, a policy or the lock screen doing what it was told. Nothing on this page needs a driver update or a repair. Work through the four causes in order."
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

## Fix the lock-screen timeout in 5 steps

This works on Windows 11 and Windows 10. Microsoft describes the 60-second timer as by design ([Microsoft Learn: Monitor powers off when computer is locked](https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/monitor-powers-off-when-pc-locked), checked 26 September 2026).

::steps

If you prefer a menu, Microsoft's article also shows how to add this setting, "Console lock display off timeout", to Advanced power settings.

## If the setting is greyed out or managed

If Settings shows "Some of these settings are managed by your organization", or your changes revert after a restart, the timeout comes from a work or school policy. On a managed PC, your organisation can set the timeout and lock the setting. Only your IT team can change it, so ask them. The [work laptop page](/for/work-laptop) covers what a browser tab can and cannot do on a managed PC.

::ad

## Fix a 1-minute power setting

If the screen goes dark while you are signed in and working, check this first. Windows keeps one screen timeout for battery and one for plugged in, and either may be set to 1 minute.

1. Open **Settings > System > Power & battery**.
2. Expand **Screen, sleep & hibernate timeouts**. On older Windows 11 builds this section is called **Screen and sleep**.
3. Set both "turn off my screen" choices, on battery and when plugged in, to the length you want.

On Windows 10 the same choices are in **Settings > System > Power & sleep**. If the battery value keeps coming back short, check Energy saver on the same page (Battery saver before Windows 11 24H2).

## Check the screen saver

A blank screen saver with a 1-minute wait looks exactly like the display turning off.

1. Open **Settings > Personalization > Lock screen** and choose **Screen saver**.
2. Set it to **(None)**, or raise **Wait** above your screen timeout.
3. Note the **On resume, display logon screen** box. It decides whether you sign in again afterwards, which is a separate question covered in [lock screen versus display sleep](/guides/lock-screen-vs-sleep).

## Confirm what is happening

- Run `powercfg /query SCHEME_CURRENT SUB_VIDEO` to see your current display timeouts. Values are shown in seconds, written in hexadecimal: `0x3c` is 60.
- Run `powercfg /requests` in an administrator terminal. The **DISPLAY** section lists every app that is asking Windows to keep the screen on. If it is empty, nothing is. While AwakeTab holds the screen on, the browser shows up there.

We have not recorded whether a browser's request keeps the display on at the lock screen, so use the powercfg fix for that case. For the full Windows walk-through, see [keep the screen on in Windows 11](/on/windows-11).
