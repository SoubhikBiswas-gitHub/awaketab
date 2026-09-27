---
title: "NoSleep.js vs the Wake Lock API — AwakeTab"
description: "NoSleep.js last shipped in December 2020 and uses the Wake Lock API where present. @awaketab/wake does too, and tells your code what happened."
h1: "NoSleep.js vs @awaketab/wake"
intent: "nosleep.js alternative"
secondaryQueries:
  - "nosleep.js vs wake lock"
  - "nosleep.js alternative"
  - "nosleep.js wake lock api"
  - "nosleep.js maintained"
  - "keep screen awake javascript library"
preset: p15
mode: standard
locale: en
reviewed: true
lastVerified: 2026-09-26
browsers: ["chrome", "edge", "firefox", "safari", "samsung-internet", "opera"]
os: []
faq:
  - q: "Does NoSleep.js still work in 2026?"
    a: "On browsers with the Screen Wake Lock API, yes: version 0.12.0 calls navigator.wakeLock.request('screen') first. Its video path is only reached where the API is missing. We have not re-checked that video path on current iOS."
  - q: "Is @awaketab/wake a drop-in replacement for NoSleep.js?"
    a: "No. The calls differ: createWakeLock(), request() and release() instead of new NoSleep(), enable() and disable(). Moving over is a few lines, and in return you get change events you can show to your users."
  - q: "Why does the video fallback need a click?"
    a: "Browsers block video autoplay until the person has interacted with the page. If play() is refused, @awaketab/wake stays in the unsupported state and emits an error event, so call request() again from a click or tap handler."
  - q: "Can I use @awaketab/wake before the npm package is out?"
    a: "Yes. The source is MIT-licensed in the packages/wake folder of the AwakeTab repository on GitHub. Copy it into your project and build it with your own bundler. The npm package is coming soon."
honestLimit: "Neither library can keep a hidden tab awake. Every browser releases the wake lock when the page is hidden; the most a library can do is ask again when the page returns, and tell you it did."
related:
  - "/library"
  - "/learn/screen-wake-lock-api-guide"
  - "/vs/nosleep-page"
  - "/learn/browser-support-matrix"
  - "/embed"
author: soubhik
published: 2026-09-09
updated: 2026-09-27
---

NoSleep.js 0.12.0, its last release (16 December 2020), already calls the Screen Wake Lock API when the browser has it, and falls back to a hidden looping video when it doesn't. If it works for you, there is no emergency. `@awaketab/wake` takes the same first step, then tells your code what happened: seven states, and a reason with every change. It is an actively maintained alternative, MIT-licensed.

## What changed since 2020

When NoSleep.js was written, a silent video was the only way to keep most phones awake. The Screen Wake Lock API arrived in Chrome and Edge 84 (July 2020), Safari 16.4 (March 2023) and Firefox 126 (May 2024). On current browsers both libraries take the native path, so the difference is no longer how the screen stays on. It is what your page knows about it. For the API itself, see [Screen Wake Lock API: a practical guide with error handling](/learn/screen-wake-lock-api-guide).

## The two libraries compared, as of 26 September 2026

| Feature | NoSleep.js 0.12.0 | `@awaketab/wake` |
|---|---|---|
| Mechanism | Wake Lock API if present; hidden looping video otherwise; a page-reload timer on very old iOS | Wake Lock API; video fallback only where the API is missing, and it needs a user gesture |
| Works with the tab hidden | No | No |
| Install | The npm package `nosleep.js` | Copy `packages/wake` from the repository; npm package coming soon |
| Platforms | Browsers | Browsers; returns an inert handle during server rendering |
| Status | `isEnabled`, a boolean | Seven states, with a `change` event carrying `from`, `to`, `reason` and `advice` |
| Asks again after the tab returns | Yes, on `visibilitychange` and `fullscreenchange` | Yes, on both, controlled by `reacquireOnVisible` |
| When the browser takes the lock back | Logs a console message | Moves to `lost` with a reason |
| Licence and price | MIT, free | MIT, free |
| Last release | 0.12.0, 16 December 2020 | Source on GitHub; not yet published |

## The same job in code

NoSleep.js:

```js
import NoSleep from 'nosleep.js';

const noSleep = new NoSleep();
startButton.addEventListener('click', () => {
  noSleep.enable().catch((err) => console.warn(err.name));
});
stopButton.addEventListener('click', () => noSleep.disable());
```

`@awaketab/wake`:

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ from, to, reason, advice }) => {
  console.log(`${from} -> ${to} (${reason})`, advice ?? '');
});
startButton.addEventListener('click', () => lock.request());
stopButton.addEventListener('click', () => lock.release());
```

`request()` does not throw. It resolves with the resulting state: `held` when the browser grants the lock, `fallback` when the video is playing, `denied` or `unsupported` when neither worked. The seven states are `idle`, `requesting`, `held`, `lost`, `denied`, `unsupported` and `fallback`. When a state changes for a reason you can act on, `advice` names it, for example `hidden_document`, `permissions_policy`, `iframe_no_allow` or `insecure_context`.

## When NoSleep.js is the better pick

- **It already works and you only show an on/off switch.** On current browsers it makes the same API call. Switching buys you status reporting, not a stronger lock.
- **You need a package from npm today.** `@awaketab/wake` isn't published yet, and some teams can't vendor source.
- **You want the smallest surface.** Two methods and a boolean, with years of tutorials behind them.

## When @awaketab/wake is the better pick

- **Your users see the status.** A kiosk, a recipe site or a dashboard that says "awake" should only say it while the browser holds the lock. `held` means the browser holds a live lock, and `fallback` means the video is really playing.
- **You need to know why it failed.** A missing `allow="screen-wake-lock"` on an iframe, a hidden page and an http origin each get their own advice code.
- **You use a framework.** `@awaketab/wake/react`, `/preact` and `/vue` export a `useWakeLock()` hook that returns the state with `request` and `release`.
- **You render on the server.** Without a `window`, `createWakeLock()` returns an inert handle instead of throwing.

The [@awaketab/wake library page](/library) has a live demo of every state. If you came here looking for a ready-made page rather than code, nosleep.page is a website unrelated to NoSleep.js; [nosleep.page vs AwakeTab](/vs/nosleep-page) compares the two.
