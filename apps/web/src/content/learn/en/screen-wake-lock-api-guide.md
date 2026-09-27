---
title: "Screen Wake Lock API: guide and error handling — AwakeTab"
description: "How navigator.wakeLock.request('screen') works, why it throws NotAllowedError, how to re-acquire after visibilitychange, and support as of September 2026."
h1: "Screen Wake Lock API: a practical guide with error handling"
intent: "screen wake lock api"
secondaryQueries:
  - "navigator.wakeLock.request"
  - "wake lock notallowederror"
  - "screen wake lock visibilitychange"
  - "wake lock iframe permissions policy"
  - "screen wake lock safari"
preset: p15
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet", "opera"]
os: []
faq:
  - q: "Does the Screen Wake Lock API show a permission prompt?"
    a: "Not in Chromium: its screen-wake-lock permission is allowed by default, so a visible, top-level HTTPS page gets the lock without asking. Safari's condition is a recent tap on the page, and Firefox's is a battery above 5 % or a charger."
  - q: "Why does the release event fire when my code never called release()?"
    a: "The browser releases the lock when the page becomes hidden, and Firefox also releases it when the battery drops to 5 % or less while unplugged. Check document.visibilityState in the handler: if the page is still visible, the browser took the lock back for another reason."
  - q: "Does a wake lock work on localhost?"
    a: "Yes. Browsers treat http://localhost as a secure context, so navigator.wakeLock exists there. A plain http:// address on your local network does not count, so test phones over HTTPS or through a tunnel."
  - q: "Can a service worker or web worker hold a wake lock?"
    a: "No. The WakeLock interface is exposed on the window only, and the lock is tied to a visible document. A worker can't ask for one, and a page can't keep one while it is in the background."
  - q: "Is it a problem to call request() while I already hold a lock?"
    a: "It works: each call returns a new sentinel, and the screen stays on while any of them is unreleased. Keep one reference and check sentinel.released before asking again, so stray sentinels don't keep the screen on after you meant to stop."
honestLimit: "The Screen Wake Lock API holds only while the document is visible. No code can keep the screen on from a hidden tab, a closed laptop or another app; for those, the answer is an OS setting or a browser extension."
related:
  - "/learn/browser-support-matrix"
  - "/vs/nosleep-js"
  - "/library"
  - "/learn/does-a-wake-lock-keep-teams-green"
  - "/embed"
  - "/learn/how-we-tested"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

`navigator.wakeLock.request('screen')` asks the browser to keep the display on and returns a `WakeLockSentinel`. It works only on HTTPS in a visible document. The browser releases it when the page is hidden, so request it again on `visibilitychange`. It rejects with `NotAllowedError` when the document is hidden, a Permissions-Policy blocks `screen-wake-lock`, Safari has no recent tap, or Firefox is at 5 % battery or less.

## The whole pattern in one block

```js
let sentinel = null;
let wanted = false;

async function keepScreenOn() {
  wanted = true;
  if (!('wakeLock' in navigator)) return 'unsupported';
  try {
    const s = await navigator.wakeLock.request('screen');
    s.addEventListener('release', () => {
      if (sentinel === s) sentinel = null;
    });
    sentinel = s;
    return 'held';
  } catch (err) {
    console.warn(`${err.name}: ${err.message}`);
    return 'refused';
  }
}

async function letScreenSleep() {
  wanted = false;
  const s = sentinel;
  sentinel = null;
  await s?.release();
}

document.addEventListener('visibilitychange', () => {
  if (wanted && !sentinel && document.visibilityState === 'visible') {
    keepScreenOn();
  }
});

startButton.addEventListener('click', keepScreenOn);
stopButton.addEventListener('click', letScreenSleep);
```

Start the request from a click handler: that click is the tap Safari needs. A missing `wakeLock` means an http page or an old browser; a rejection is almost always a `NotAllowedError` for one of the four causes above. The `wanted` flag separates "the user asked for the screen to stay on" from "the browser currently holds a lock". The browser can drop the second at any time; only the user should change the first.

## Feature detection and secure contexts

The `wakeLock` property only exists in secure contexts. On a page served over plain http, `navigator.wakeLock` is undefined, so the right state is "unsupported", not "refused": there is nothing to ask. `https://` pages and `http://localhost` count as secure. Check with `'wakeLock' in navigator` rather than calling and catching, because calling `request` on `undefined` throws a `TypeError` that looks like a bug in your code.

## Release, and asking again

A sentinel has a `released` boolean, a `type` (always `'screen'` today), a `release()` method and a `release` event. The event fires when you call `release()`, when the page becomes hidden, and when the browser takes the lock back for its own reasons.

The browser treats a page as hidden when the user switches tabs or apps, minimises the window, or locks the phone. A visible window that has lost focus keeps its lock. When the page comes back, nothing restores the lock for you: listen for `visibilitychange` and request again, as the block above does. Safari usually accepts that second request thanks to the earlier tap; if it rejects, show a button so the next tap can ask.

## Iframes and Permissions-Policy

The `screen-wake-lock` feature is allowed for the page's own origin by default. A cross-origin iframe needs the embedding page to delegate it:

```html
<iframe src="https://widget.example.com/timer" allow="screen-wake-lock"></iframe>
```

A site can also switch the feature off, or allow named origins, with a response header:

```http
Permissions-Policy: screen-wake-lock=(self "https://widget.example.com")
```

`screen-wake-lock=()` blocks it everywhere on that page, including in the top-level document. In both cases the request rejects with `NotAllowedError`, which is why "iframe without `allow`" is the first thing to check when a widget works on its own and fails when embedded.

## Why a request fails, by engine

Checked against engine source on 26 September 2026.

| Cause | Chromium (Chrome, Edge, Opera, Samsung Internet) | WebKit (Safari) | Gecko (Firefox) |
|---|---|---|---|
| Page hidden or tab not active | `NotAllowedError`; a held lock is released | Same | Same |
| Permissions-Policy or iframe without `allow` | `NotAllowedError` | `NotAllowedError` | `NotAllowedError` |
| No recent user gesture | No check | `NotAllowedError` without a recent tap or an earlier gesture | No check |
| Battery at or below 5 %, unplugged | No check | No check | `NotAllowedError`; a held lock is released |
| Battery saver, Energy Saver or Low Power Mode | No check | No check | No check beyond the 5 % rule |
| Plain http page | `navigator.wakeLock` is undefined | Same | Same |

Sources: [Chromium wake_lock.cc](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/wake_lock/wake_lock.cc), [WebKit WakeLock.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/screen-wake-lock/WakeLock.cpp) and [Firefox WakeLockJS.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/power/WakeLockJS.cpp).

The battery-saver row matters because many pages, including earlier versions of ours, blamed battery savers for `NotAllowedError`. The engines don't check for them. A saver can still change how long the device waits before the display goes dark, but that happens in the operating system's settings, outside the browser, and your promise never rejects because of it.

## Support floors

Chromium browsers have had the API since Chrome 84 (Edge 84, Opera 70, Samsung Internet 14). Safari added it in 16.4 on Mac, iPhone and iPad, and Firefox in 126. Installed Home Screen apps on Apple's mobile devices got it later, in 18.4. The [wake lock browser support matrix](/learn/browser-support-matrix) has platforms, notes and sources for each row.

## The video fallback trade-off

Before the API, libraries kept screens on by playing a tiny silent video in a loop. It still works as a fallback for browsers without the API, with three costs. It needs a user gesture, because browsers block video autoplay until someone interacts. It uses more power than a native lock, since the media pipeline stays busy. And your code can't easily tell whether it is working, only whether `play()` resolved. Use it only when `wakeLock` is missing, never as a second attempt after a `NotAllowedError`. [NoSleep.js vs @awaketab/wake](/vs/nosleep-js) compares two libraries that handle this differently.

## If you'd rather not write this yourself

`@awaketab/wake` wraps the pattern above: feature detection, the re-request on `visibilitychange`, a gesture-aware video fallback, and a `change` event every time the state moves. Its source is MIT on GitHub, and the npm package is coming soon. The [@awaketab/wake library page](/library) runs a live demo.

## What a wake lock can't do

It keeps the display on while the page is visible. It can't hold from a hidden tab, stop a laptop sleeping when the lid closes, or change an operating system rule such as a work sign-in lock. It sends no input, so it doesn't change a chat app's Away timer. On desktop Chrome or Edge, an extension with the `power` permission, such as [AwakeTab for Chrome](/extension), can keep the screen on from a hidden tab; a web page can't.
