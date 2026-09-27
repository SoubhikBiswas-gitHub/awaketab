# 12 · Library specification — `@awaketab/wake`

Status: v1.1 · 2026-09-26 (as built in M8, §10) · Owner: Soubhik

**Purpose.** `@awaketab/wake` is the low-level Screen Wake Lock layer that the web app, the PiP window, the embed and the extension share — published as a standalone, MIT-licensed npm package. It is the maintained replacement for NoSleep.js (last release December 2020) and the developer-facing asset that earns the links a tool site needs. This document is its contract.

Related docs: `00-conventions.md` §5.1, §13.1 · `04-engine-spec.md` §3–§5 (behaviour it implements) · `13-testing-strategy.md` §2 · `14-devops.md` §7 (release workflow) · `06-content-seo-spec.md` (`/library` page and `/learn/nosleep-js-vs-wake-lock`).

---

## 1. Goals and constraints

| Goal | Target |
|---|---|
| Size | ≤ 3.4 KB gz for the core entry (`size-limit` in CI, `packages/wake/package.json`); the base64-inlined fallback video assets are part of that entry, not an addition on top |
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
| Size (gz) | ≤ 3.4 KB (fallback assets inlined in that budget) | ≈ 3.2 KB measured |
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

Changesets in the monorepo; `release.yml` publishes on merge to `main` when a changeset exists, with npm provenance (GitHub Actions OIDC, `npm publish --provenance`). Breaking changes bump major; the web app pins `workspace:*`. Bundle-size check (`size-limit`) fails CI above 3.4 KB gz for `dist/index.js`.

---

## 8. Browser support statement

Native: Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4 (iOS Home-Screen web apps ≥ 18.4). Fallback: any browser that can autoplay a muted inline video after a user gesture (iOS ≥ 10, Chrome ≥ 53, Firefox ≥ 60). Node/SSR: inert. These claims are generated from `src/data/support-matrix.json` at build so the README, the site and the tests never disagree.

---

## 9. Contributing summary

Issues use templates (bug with browser/OS/version, feature request); PRs require a changeset, tests for any transition change, and a passing size check. Code of conduct: Contributor Covenant. Security issues via `security@awaketab.com`.

---

## 10. As built (M8, 2026-09-26)

Identifiers are canonical in `00-conventions.md` §13.10.

### 10.1 Package fixes made before the first publish

- **IIFE name.** tsup emitted `dist/awaketab-wake.iife.global.js`; the contract (§1, README, CDN URLs, `/library`) is `dist/awaketab-wake.iife.js`. `tsup.config.ts` now sets `outExtension` for that build.
- **Adapters.** Each adapter imported the core through `../index.js` and so bundled a full second copy of the state machine (≈ 3 KB gz each, a separate lock instance). An esbuild plugin now resolves that import to the external `@awaketab/wake`: react 271 B, preact 277 B, vue 237 B gz. Adapters also gained CJS builds and `.d.ts`/`.d.cts` types (the §3 `exports` pointed at `.d.ts` files that did not exist).
- **`exports`.** Nested `import`/`require` conditions, each with its own `types` (`.d.ts` / `.d.cts`), plus `"./iife"` and `"./package.json"`; `unpkg` and `jsdelivr` point at the IIFE.
- **Metadata.** `author`, `bugs`, `funding` (GitHub Sponsors), `publishConfig: { access: 'public', provenance: true, registry }`; `files` adds `CHANGELOG.md`.
- **Changesets.** `.changeset/config.json` `access` is `public`. The two pending wake changesets (`wake-lock-layer` patch, and the wake half of `type-name-prefixes` major) are folded into `CHANGELOG.md` → `## 1.0.0`, so `changeset version` does not bump the never-published package to 2.0.0. The `@awaketab/core` half stays pending (core is private).
- **size-limit.** `dist/index.js` ≤ 3.4 kB (3.21 kB), the IIFE ≤ 3.6 kB (3.45 kB), each adapter ≤ 400 B.

### 10.2 Release (`.github/workflows/release.yml`)

Job `version` runs `changesets/action` (opens the "version packages" PR while changesets are pending). When none are pending, job `publish-wake` (environment `npm`) tests, builds and size-checks the package, skips if `@awaketab/wake@<version>` is already on npm, prints `npm pack --dry-run`, runs `npm publish --provenance --access public` from `packages/wake`, and pushes the tag `@awaketab/wake@<version>`. Auth: npm trusted publishing (GitHub OIDC; the job installs npm 11.6.2 because trusted publishing needs ≥ 11.5.1 and Node 22 bundles npm 10), with an `NPM_TOKEN` automation-token secret as the fallback. Nothing is published from a laptop: `publishConfig.provenance` makes a local `npm publish` fail outside CI.

`npm pack --dry-run` for 1.0.0 (23 files, 12.9 kB packed, 55.8 kB unpacked): `CHANGELOG.md`, `LICENSE`, `README.md`, `package.json`, `dist/index.{js,cjs,d.ts,d.cts}`, `dist/types-*.d.{ts,cts}`, `dist/awaketab-wake.iife.js`, `dist/adapters/{react,preact,vue}.{js,cjs,d.ts,d.cts}`. `packages/wake/test/pack.test.ts` asserts this list, that every `exports`/`unpkg` target is packed, and that no `src/`, `test/` or config file is.

### 10.3 README and `/library`

The README follows §5 (badges: npm version, gzip size, CI, provenance, licence; CDN usage; the seven-state diagram; options; adapters; caveats; the "cannot do" note; iframes; support; NoSleep.js comparison). `/library` runs the **published** IIFE: `scripts/library.mjs` copies `dist/awaketab-wake.iife.js` to `/library/awaketab-wake.iife.js` at build (same origin — tool-route CSP allows only `'self'` scripts). The demo (`src/lib/library-demo.ts`) offers four scenarios so all seven states are reachable in any browser: this browser's API (`idle → requesting → held`), a simulated device whose "tab hidden" releases the sentinel via an injected `documentLike` + wake-lock API (`lost`, then re-acquired), a simulated battery-saver denial (`denied` + `battery_saver`), and no API (`unsupported`, then a click starts the real inlined video → `fallback`). The page also carries ESM, CDN and React samples, the §4 comparison and the honesty note; no ads.

Clear Night B6 (2026-09-27, board `PageLibrary`): the demo is one card. The status pill shows the exact pill string for the current state (`[data-demo-pill]`, `data-lock`), next to `state: <id>` and an advice chip (`Advice: <code>`). The seven states are drawn as a state diagram (pills on a 3 × 3 grid, arrows for the seven transitions: `request()`, acquired, denied, released, retry, no API, gesture); the current state glows in its tone, visited states stay lit, and the arrow of the last transition lights up (`[data-edge="from-to"][data-on]`). The transition log lists the time, `from → to` and `(reason, advice)`, newest first, last 12, in a scrolling box. The usage samples are tabs (ESM · CDN · React · Preact · Vue) with line numbers, build-time highlighting and a Copy button (`src/lib/code-tabs.ts`, `src/lib/library-code.ts`). The npm and GitHub links wait for the package to be published ("npm package coming soon" beside the install line); related links go to How AwakeTab is checked, the Screen Wake Lock API guide and NoSleep.js vs Wake Lock.

