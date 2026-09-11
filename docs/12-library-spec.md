# 12 · Library specification — `@awaketab/wake`

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** `@awaketab/wake` is the low-level Screen Wake Lock layer that the web app, the PiP window, the embed and the extension share — published as a standalone, MIT-licensed npm package. It is the maintained replacement for NoSleep.js (last release December 2020) and the developer-facing asset that earns the links a tool site needs. This document is its contract.

Related docs: `00-conventions.md` §5.1, §13.1 · `04-engine-spec.md` §3–§5 (behaviour it implements) · `13-testing-strategy.md` §2 · `14-devops.md` §7 (release workflow) · `06-content-seo-spec.md` (`/library` page and `/learn/nosleep-js-vs-wake-lock`).

---

## 1. Goals and constraints

| Goal | Target |
|---|---|
| Size | ≤ 2 KB gz for the core entry (`size-limit` in CI); fallback video assets inlined as base64 add ≈ 1.4 KB |
| Dependencies | zero |
| Environments | Browsers per the support matrix; SSR-safe (`typeof window === 'undefined'` → inert instance) |
| Types | TypeScript, `strict`, `.d.ts` shipped |
| Formats | ESM (`exports.import`), CJS (`exports.require`), IIFE (`dist/awaketab-wake.iife.js`, global `AwakeTabWake`) |
| Behaviour | Exactly the seven states and transitions of `04-engine-spec.md` §3–§4; no session/timer logic (that is `@awaketab/core`) |
| Honesty | Never reports `held` unless a live `WakeLockSentinel` exists or the fallback video is actually playing |

---

## 2. Public API

```ts
export type TLockState = 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';
export type TLockReason = 'request' | 'acquired' | 'fallback_started' | 'released_hidden' | 'released_platform'
  | 'denied' | 'unsupported' | 'user_release' | 'retry' | 'destroyed';
export type TAdviceCode = 'battery_saver' | 'low_power_ios' | 'hidden_document' | 'permissions_policy'
  | 'insecure_context' | 'unsupported_browser' | 'ios_safari_old' | 'firefox_old' | 'iframe_no_allow';

export interface IWakeLockOptions {
  fallback?: 'video' | 'none';                 // default 'video'
  videoSources?: { webm?: string; mp4?: string }; // override the inlined 1-frame assets (data: or https: URLs)
  reacquireOnVisible?: boolean;                // default true — re-request when the document becomes visible after `lost`
  retry?: { attempts: number; baseMs: number } | false; // default { attempts: 3, baseMs: 500 } for transient denials
  nudgeIntervalMs?: number;                    // default 20_000 — fallback video currentTime nudge
  navigatorLike?: Pick<Navigator, 'wakeLock' | 'userAgent'>; // test injection
  documentLike?: Document;                     // test injection
  debug?: boolean | ((msg: string, data?: unknown) => void);
}

export interface IChangeEvent { from: TLockState; to: TLockState; reason: TLockReason; advice?: TAdviceCode; error?: unknown; at: number }

export interface IWakeLockHandle {
  readonly state: TLockState;
  readonly supported: boolean;                 // native API present in a secure context
  readonly usingFallback: boolean;
  request(): Promise<TLockState>;               // resolves with the resulting state; never throws
  release(): Promise<void>;
  on(event: 'change', cb: (e: IChangeEvent) => void): () => void;
  on(event: 'error', cb: (e: { error: unknown; at: number }) => void): () => void;
  destroy(): void;                             // release + remove listeners + remove video element
}

export function createWakeLock(options?: IWakeLockOptions): IWakeLockHandle;
export function classifyDenial(err: unknown, ctx: { visible: boolean; secure: boolean; inIframe: boolean; ua: string }): TAdviceCode;
export const isWakeLockSupported: () => boolean;
```

### 2.1 Behavioural notes

- `request()` from `idle`/`lost`/`denied` → `requesting` → `held` on resolve. On `NotAllowedError` → `denied` with `advice` from `classifyDenial()`; transient causes (`hidden_document`) retry per `retry` when the document becomes visible; others wait for a new `request()`.
- Sentinel `release` while `document.hidden` → `lost` (reason `released_hidden`); while visible → `lost` (reason `released_platform`, e.g. battery saver kicked in) and one retry.
- `unsupported` is set at creation when the API is missing or the context is insecure. `request()` in `unsupported` with `fallback:'video'` attempts the video: `play()` rejection (autoplay policy) leaves the state `unsupported` and emits `error` — callers must invoke `request()` from a user gesture in that case (the UI shows "Tap to use the fallback").
- The fallback video element is `<video muted playsinline loop hidden>` appended to `document.body`, sources = inlined 1-frame WebM then MP4; `currentTime` nudged every `nudgeIntervalMs`; paused when hidden and resumed when visible.
- `fullscreenchange` triggers a re-request (some browsers release locks when entering fullscreen).
- All listeners are removed on `destroy()`; the instance is inert afterwards (`state` stays `idle`).

### 2.2 Usage

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock();
lock.on('change', ({ to, advice }) => render(to, advice));
button.addEventListener('click', () => lock.request());   // gesture-safe for the fallback path
```

Framework adapters (separate entry points, each < 400 B): `@awaketab/wake/react` (`useWakeLock(options)` → `{ state, supported, request, release }`), `/preact`, `/vue` (`useWakeLock()` composable). Adapters are optional and tree-shaken.

---

## 3. Package layout

```
packages/wake/
├─ src/
│  ├─ index.ts          # createWakeLock, classifyDenial, isWakeLockSupported
│  ├─ machine.ts        # transition table (mirrors 04-engine-spec §4)
│  ├─ fallback.ts       # video element management + inlined assets
│  ├─ classify.ts       # denial → TAdviceCode
│  ├─ adapters/react.ts · preact.ts · vue.ts
│  └─ assets/blank.webm.b64.ts · blank.mp4.b64.ts
├─ test/                # Vitest: one test per transition row (T01…Tnn), fallback, classify, SSR
├─ README.md · CHANGELOG.md · LICENSE (MIT)
├─ package.json · tsup.config.ts · size-limit.json
```

`package.json` (essential fields):

```json
{
  "name": "@awaketab/wake",
  "version": "1.0.0",
  "description": "Screen Wake Lock with an honest state machine and a tiny video fallback. Maintained replacement for NoSleep.js.",
  "license": "MIT",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./react": { "types": "./dist/adapters/react.d.ts", "import": "./dist/adapters/react.js" },
    "./preact": { "types": "./dist/adapters/preact.d.ts", "import": "./dist/adapters/preact.js" },
    "./vue": { "types": "./dist/adapters/vue.d.ts", "import": "./dist/adapters/vue.js" }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": ["wake lock", "screen wake lock", "nosleep", "keep awake", "prevent sleep", "wakelock"],
  "repository": { "type": "git", "url": "https://github.com/awaketab/awaketab", "directory": "packages/wake" },
  "homepage": "https://awaketab.com/library",
  "peerDependencies": { "react": ">=17", "preact": ">=10", "vue": ">=3" },
  "peerDependenciesMeta": { "react": { "optional": true }, "preact": { "optional": true }, "vue": { "optional": true } }
}
```

Build: `tsup` with `format: ['esm','cjs','iife']`, `dts: true`, `minify: true`, `target: 'es2020'`. IIFE build exposes `window.AwakeTabWake` for `<script>` users and CodePen demos.

---

## 4. Comparison (for README and `/learn/nosleep-js-vs-wake-lock`)

| | `@awaketab/wake` | NoSleep.js 0.12.0 |
|---|---|---|
| Last release | maintained; semver | 16 Dec 2020 |
| Native Wake Lock | yes, first | yes (when present) |
| Honest state | seven states + `change` events with reason and advice | `isEnabled` boolean; state can be wrong after release |
| Fallback | inlined 1-frame video, gesture-aware, pauses when hidden | looping video, always on |
| Denial diagnosis | `classifyDenial()` → advice codes | none |
| Re-acquire on visible | yes, configurable | yes |
| Size (gz) | ≤ 2 KB (+1.4 KB assets) | ≈ 4 KB with assets |
| TypeScript | native | community typings |
| SSR-safe | yes | no |
| Adapters | React/Preact/Vue | no |

---

## 5. README outline

Badges (npm version, size, CI) · one-paragraph what/why · install · 10-line usage · states diagram (the seven states) · options table · adapters · fallback caveats (gesture, battery) · browser support (link to the live matrix) · "Used by AwakeTab" with a link to the demo · contributing · licence.

---

## 6. Demo page `/library`

Live status pill bound to the library, a "simulate tab hidden" button (dispatches a synthetic `visibilitychange` with a stubbed `visibilityState` for demonstration), the code sample, the comparison table, links to npm and GitHub, and the honesty note about what a wake lock cannot do. This page is the canonical target for developer queries (`06-content-seo-spec.md`).

---

## 7. Versioning and release

Changesets in the monorepo; `release.yml` publishes on merge to `main` when a changeset exists, with npm provenance (GitHub Actions OIDC, `npm publish --provenance`). Breaking changes bump major; the web app pins `workspace:*`. Bundle-size check (`size-limit`) fails CI above 2 KB gz for `dist/index.js`.

---

## 8. Browser support statement

Native: Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4 (iOS Home-Screen web apps ≥ 18.4). Fallback: any browser that can autoplay a muted inline video after a user gesture (iOS ≥ 10, Chrome ≥ 53, Firefox ≥ 60). Node/SSR: inert. These claims are generated from `src/data/support-matrix.json` at build so the README, the site and the tests never disagree.

---

## 9. Contributing summary

Issues use templates (bug with browser/OS/version, feature request); PRs require a changeset, tests for any transition change, and a passing size check. Code of conduct: Contributor Covenant. Security issues via `security@awaketab.com`.
