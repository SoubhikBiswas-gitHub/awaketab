# @awaketab/wake

[![npm version](https://img.shields.io/npm/v/@awaketab/wake?label=npm&color=B86E00)](https://www.npmjs.com/package/@awaketab/wake)
[![gzip size](https://img.shields.io/badge/gzip-%E2%89%A4%203.4%20KB-B86E00)](https://github.com/SoubhikBiswas-gitHub/awaketab/blob/main/packages/wake/package.json)
[![CI](https://github.com/SoubhikBiswas-gitHub/awaketab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SoubhikBiswas-gitHub/awaketab/actions/workflows/ci.yml)
[![npm provenance](https://img.shields.io/badge/npm-provenance-2B3A67)](https://www.npmjs.com/package/@awaketab/wake#provenance)
[![license: MIT](https://img.shields.io/npm/l/@awaketab/wake)](./LICENSE)

Screen Wake Lock with an honest state machine and a tiny video fallback. The maintained replacement for NoSleep.js (last release December 2020).

`@awaketab/wake` keeps a web page's screen from dimming while it is visible, and tells you the truth about it: it reports `held` only while a live `WakeLockSentinel` exists or the fallback video is actually playing. Zero dependencies, ≤ 3.4 KB gzipped including the inlined 1-frame fallback videos, SSR-safe, TypeScript-native. It is the lock layer behind [AwakeTab](https://awaketab.com), its Picture-in-Picture pill, its embeddable Cook Mode widget and its browser extension.

## Install

The npm package is coming soon; `npm install @awaketab/wake` works once the first version is published. Until then, build it from the repository (`pnpm -F @awaketab/wake build`, output in `packages/wake/dist`).

No bundler? Load the IIFE build: it exposes `window.AwakeTabWake`. The live demo serves the same file:

```html
<script src="https://awaketab.com/library/awaketab-wake.iife.js"></script>
<script>
  const lock = AwakeTabWake.createWakeLock();
</script>
```

## Usage

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ from, to, reason, advice }) => {
  status.textContent = to; // idle · requesting · held · lost · denied · unsupported · fallback
  if (advice) hint.textContent = advice; // e.g. 'hidden_document', 'iframe_no_allow'
});
button.addEventListener('click', () => lock.request()); // a gesture keeps the fallback path open
stopButton.addEventListener('click', () => lock.release());
```

`request()` never throws: it resolves with the resulting state.

## The seven states

```
            request()                 sentinel acquired
  idle ───────────────► requesting ─────────────────────► held
   ▲                        │  │                            │  tab hidden / OS released
   │ release()              │  │ NotAllowedError            ▼
   │                        │  └──────────────► denied     lost ── visible again ──► requesting
   │                        │ no API / insecure              
   │                        ▼                                
   └──────────────── unsupported ── request() + video plays ──► fallback
```

| State | Meaning |
|---|---|
| `idle` | No lock requested |
| `requesting` | `navigator.wakeLock.request('screen')` (or the fallback video) is in flight |
| `held` | A sentinel is alive |
| `lost` | The browser released the sentinel (tab hidden, OS). Re-requested when the document is visible again |
| `denied` | The request was rejected (`NotAllowedError`: hidden document, Permissions-Policy, Safari before a tap, Firefox at 5 % battery or less). `advice` says why when the cause is known, and is `null` otherwise |
| `unsupported` | No Screen Wake Lock API, or an insecure context. `request()` tries the video fallback |
| `fallback` | The hidden 1-frame video loop is playing |

Every `change` event carries `{ from, to, reason, advice?, error?, at }`. Reasons: `request` · `acquired` · `fallback_started` · `released_hidden` · `released_platform` · `denied` · `unsupported` · `user_release` · `retry` · `destroyed`. Advice codes: `hidden_document` · `permissions_policy` · `insecure_context` · `unsupported_browser` · `ios_safari_old` · `firefox_old` · `iframe_no_allow`.

## Options

| Option | Default | What it does |
|---|---|---|
| `fallback` | `'video'` | `'none'` disables the video fallback |
| `videoSources` | inlined 1-frame WebM + MP4 | `{ webm?, mp4? }` — `data:` or `https:` URLs |
| `reacquireOnVisible` | `true` | Re-request when the document becomes visible after `lost` |
| `retry` | `{ attempts: 3, baseMs: 500 }` | Backoff for transient denials; `false` disables |
| `nudgeIntervalMs` | `20000` | How often the fallback video's `currentTime` is nudged |
| `navigatorLike` / `documentLike` | globals | Test injection |
| `debug` | `false` | `true` or a logger `(msg, data) => void` |

Also exported: `classifyDenial(err, ctx)` → advice code (or `null` when the cause is unknown), and `isWakeLockSupported()`.

## Framework adapters

Each adapter is < 400 B and imports the core, so you get one lock instance.

```ts
import { useWakeLock } from '@awaketab/wake/react'; // or '@awaketab/wake/preact'
const { state, supported, request, release } = useWakeLock();
```

```ts
import { useWakeLock } from '@awaketab/wake/vue';
const { state, request, release } = useWakeLock();
```

## Fallback caveats

- The video fallback needs a user gesture (autoplay policy). If `play()` is rejected the state stays `unsupported` and an `error` event fires — call `request()` again from a click.
- It uses more power than a native wake lock. It pauses while the tab is hidden and resumes when it is visible.
- Battery savers do not refuse a wake lock: Chromium and WebKit have no such check. Firefox refuses and releases the lock at 5 % battery or less while discharging, and iPhone Low Power Mode caps Auto-Lock at 30 seconds.

## What a wake lock cannot do

A wake lock keeps the **display** on while the page is **visible**. It does not keep a hidden tab awake, does not stop a laptop sleeping when the lid closes, and does not keep Teams or Slack "Available" — those follow input idle, and this library never fakes input.

## Iframes

A cross-origin iframe can hold a lock only when the embedding page delegates the feature: `<iframe allow="screen-wake-lock" …>`. Without it the request is rejected and the advice is `iframe_no_allow`.

## Browser support

Native: Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4 (iOS Home-Screen web apps ≥ 18.4). Fallback: any browser that can autoplay a muted inline video after a gesture. Node/SSR: an inert handle (`supported: false`, never throws). The live, tested matrix is at [awaketab.com/learn/browser-support-matrix](https://awaketab.com/learn/browser-support-matrix) and the method at [awaketab.com/learn/how-we-tested](https://awaketab.com/learn/how-we-tested).

## Compared with NoSleep.js

| | `@awaketab/wake` | NoSleep.js 0.12.0 |
|---|---|---|
| Last release | maintained; semver | 16 Dec 2020 |
| Honest state | seven states + `change` events with reason and advice | `isEnabled` boolean |
| Denial diagnosis | `classifyDenial()` → advice codes | none |
| Fallback | inlined 1-frame video, gesture-aware, pauses when hidden | looping video, always on |
| TypeScript / SSR | native / inert on the server | community typings / no |

## Used by AwakeTab

Try the live state-machine demo at [awaketab.com/library](https://awaketab.com/library) — it runs this package's published IIFE build.

## Contributing

Issues and PRs are welcome at [github.com/SoubhikBiswas-gitHub/awaketab](https://github.com/SoubhikBiswas-gitHub/awaketab). A PR needs a changeset (`pnpm changeset`), a test for any transition change, and a passing size check (`pnpm -F @awaketab/wake size`). Security issues: security@awaketab.com.

Sponsor development via [GitHub Sponsors](https://github.com/sponsors/awaketab).

## Licence

MIT © AwakeTab
