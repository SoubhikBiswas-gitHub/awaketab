# 04 · Engine specification

Status: v1.1 · 2026-09-26 · Owner: Soubhik

**Purpose.** This is the implementable specification of the two engine layers: the **lock layer** `@awaketab/wake` (seven states, one transition table, video fallback, retry policy, reason/advice codes) and the **session layer** `@awaketab/core` (sessions, plans, the wall-clock tick, pause/resume, end-of-session pipeline, battery monitor, persistence, stats, multi-tab protocol, capability probe). Every state name, status, plan type and storage key is as in `00-conventions.md` §5–§6. Codes introduced here that are not yet in the conventions are marked **PROPOSED — add to 00-conventions.md**. The rule the whole engine serves: *the pill never lies* — UI state is derived only from the promise results and browser events, never from intent.

**Related docs.** `00-conventions.md` · `03-architecture.md` (where the engine sits) · `08-data-storage.md` (schemas for `at.v1.session`, `at.v1.stats`, `at.v1.license`) · `12-library-spec.md` (packaging of `@awaketab/wake`) · `13-testing-strategy.md`.

---

## Part A · Lock layer — `@awaketab/wake`

### 1. Platform facts the design relies on

Verified in the blueprint and re-verified per release on `/support-matrix`:

- `navigator.wakeLock.request('screen')` exists in Chrome/Edge ≥ 84, Firefox ≥ 126, Safari ≥ 16.4, iOS Home-Screen web apps ≥ 18.4. The interface is `[SecureContext]`, so on `http://` (other than `localhost`) `navigator.wakeLock` is `undefined`.
- The browser releases the lock when the document becomes hidden (tab switch, minimise, device lock). The `WakeLockSentinel` fires a `release` event; `sentinel.released` becomes `true`. The page must request again on `visibilitychange` to visible.
- The request rejects with `NotAllowedError` when the document is hidden, when Permissions-Policy `screen-wake-lock` denies the document (typical in an iframe without `allow="screen-wake-lock"`), or when the browser refuses for its own reasons (Safari before a user gesture, Firefox at 5 % battery or less while discharging). Battery savers (Chrome Energy Saver, Android Battery Saver, Windows Energy saver) do not refuse it: Chromium and WebKit have no such check.
- The video fallback needs a user gesture because of autoplay policy; a muted `playsinline` video that is visibly rendered (1 × 1 px, not `display:none`) keeps the screen on in browsers that predate the API.
- iOS Low Power Mode is not detectable; it forces a 30 s Auto-Lock regardless of the wake lock.

### 2. States (exactly seven)

`idle` · `requesting` · `held` · `lost` · `denied` · `unsupported` · `fallback` — meanings and pill copy in `00-conventions.md` §5.1. Only `held` and `fallback` may show a running timer. Two internal fields accompany the state and are exposed read-only: `mode: 'native' | 'video' | null` (which mechanism the last successful acquisition used) and `attempt: number` (retry counter).

```
                 request()                     resolved
   idle ──────────────────────► requesting ──────────────► held ◄──────────────┐
    ▲   API absent│               │  ▲      NotAllowedError   │ release event     │ visible +
    │             ▼               │  │           ▼            ▼ (hidden/OS)       │ reacquire
    │        unsupported          │  │        denied ◄──── lost ──────────────────┘
    │   tap + fallback:'video'│   │  │  retry timer│   ▲      ▲
    │             ▼           └───┘  └─────────────┘   │      │ hidden (pause video)
    │         requesting ──play() ok──► fallback ──────┘      │
    │              │ play() rejects      │                    │
    │              ▼                     └────────────────────┘
    │         unsupported (advice unsupported_browser)
    └── release() from any state; destroy() from any state
```

### 3. Reason and advice codes

```ts
// PROPOSED — add to 00-conventions.md §5.1a
export type TLockState = 'idle' | 'requesting' | 'held' | 'lost' | 'denied' | 'unsupported' | 'fallback';

/** Why a transition happened. Carried on every `change` event. */
export type TLockReason =
  | 'request'            // request() called
  | 'acquired'           // native promise resolved
  | 'fallback_started'   // video play() resolved
  | 'released_hidden'    // sentinel release, or fallback paused, while the document is hidden
  | 'released_platform'  // sentinel release while visible (fullscreen transition, OS)
  | 'denied'             // NotAllowedError or another rejection
  | 'unsupported'        // no API, or no fallback video could play
  | 'user_release'       // release() called
  | 'retry'              // backoff timer, visibility or fullscreen re-request
  | 'destroyed';         // destroy() called

/** What the UI should tell the user to do. Null when nothing is wrong or the cause is unknown. */
export type TAdviceCode =
  | 'hidden_document'      // bring the tab back to the front
  | 'permissions_policy'   // the page's Permissions-Policy blocks screen-wake-lock
  | 'insecure_context'     // page is served over http
  | 'unsupported_browser'  // no API and no playable fallback, or the fallback video was refused
  | 'ios_safari_old'       // iOS Safari before 16.4
  | 'firefox_old'          // Firefox before 126
  | 'iframe_no_allow';     // embedded without allow="screen-wake-lock"
```

Classification of a refusal (`classify.ts`), in order. Battery savers and Low Power Mode never refuse a wake lock (Chromium and WebKit have no such check), so there is no battery advice:

```ts
function classifyDenial(err, ctx: { visible; secure; inIframe; ua }): TAdviceCode | null {
  if (!ctx.secure || err.name === 'SecurityError') return 'insecure_context';
  if (!ctx.visible) return 'hidden_document';
  if (ctx.inIframe) return 'iframe_no_allow';
  if (/permissions policy/i.test(err.message)) return 'permissions_policy';
  if (iOS && Safari < 16.4) return 'ios_safari_old';
  if (Firefox < 126) return 'firefox_old';
  return null; // no known cause (on iOS usually Safari wanting a tap): the UI lists the usual ones
}
```

`unsupported` carries advice `insecure_context` when `!isSecureContext`, otherwise `unsupported_browser`; when the fallback is available the pill reads Tap to use the fallback until the user taps.

### 4. Transition table

Guards reference `vis` (`document.visibilityState`), `fb` (`options.fallback === 'video'`), `reacq` (`options.reacquireOnVisible`, default `true`), `n` (`attempt`), `N` (`retry.attempts`, default 3). Every transition emits `change { from, to, reason, advice }` unless marked *silent*.

| # | From | Event | Guard | To | Side effects |
|---|---|---|---|---|---|
| 1 | `idle` | `request()` | `'wakeLock' in navigator` | `requesting` | `attempt = 0`; call `navigator.wakeLock.request('screen')`; set `pending` flag |
| 2 | `idle` | `request()` | API absent | `unsupported` | advice = `insecure_context` if `!isSecureContext` else `unsupported_browser`; with `fb` the pill offers Tap to use the fallback; emit `error` if not `fb` |
| 3 | `requesting` | native promise resolves | not cancelled | `held` | store sentinel; `sentinel.addEventListener('release', onRelease)`; `mode = 'native'`; `attempt = 0`; advice = null |
| 4 | `requesting` | native promise resolves | cancelled (release() during flight) | `idle` | `await sentinel.release()`; drop sentinel (*silent* beyond the earlier `release` change) |
| 5 | `requesting` | rejects `NotAllowedError` | — | `denied` | `{reason, advice} = classifyDenial()`; if reason is `unknown` and `vis==='visible'` and `n < N` → schedule retry in `min(baseMs·2^n, maxMs)` (defaults 1 s, 2 s, 4 s); if `hidden` → wait for `visibilitychange`; if `policy`/`insecure_context` → no timer; emit `error` |
| 6 | `requesting` | rejects other error | — | `denied` | reason `unknown`, advice `null` (cause unknown); same retry rule; emit `error` |
| 7 | `requesting` (video) | `video.play()` resolves | — | `fallback` | `mode = 'video'`; start 20 s nudge timer; advice = null |
| 8 | `requesting` (video) | `play()` rejects `NotAllowedError` | — | `unsupported` | advice `unsupported_browser`; emit `error` |
| 9 | `requesting` (video) | `play()` rejects another way (`NotSupportedError`, `AbortError`), or the last `<source>` fires `error` | — | `unsupported` | at once, never left on `requesting`: the browser tries the sources in order itself, and when none can play, `play()` never settles, so the last source's `error` ends the request; video removed; advice `unsupported_browser`; emit `error` |
| 10 | `held` | sentinel `release` event | `vis === 'hidden'` | `lost` | sentinel = null; advice `hidden_document`; reason `released_hidden` |
| 11 | `held` | sentinel `release` event | `vis === 'visible'` | `lost` → immediately `requesting` | reason `released_platform`; loop guard: if ≥ 3 visible-releases within 10 s → go to `denied` (reason `denied`, advice null) instead and apply the retry rule |
| 12 | `held` | `release()` | — | `idle` | set `releasing`; `await sentinel.release()`; ignore the resulting `release` event; sentinel = null; `mode` kept |
| 13 | `lost` | `visibilitychange` → visible | `reacq` | `requesting` | native: `request('screen')`; video: `video.play()`; reason `visible` |
| 14 | `lost` | `visibilitychange` → visible | `!reacq` | `lost` | *silent*; caller must `request()` |
| 15 | `lost` | `release()` | — | `idle` | clear timers; pause video if `mode === 'video'` |
| 16 | `denied` | retry timer fires | `vis === 'visible'` | `requesting` | `attempt++`; reason `retry` |
| 17 | `denied` | `visibilitychange` → visible | reason was `hidden` | `requesting` | `attempt = 0`; reason `visible` |
| 18 | `denied` | `fullscreenchange` | any | `requesting` | one attempt, `attempt` unchanged; reason `fullscreen` |
| 19 | `denied` | `request()` | — | `requesting` | `attempt = 0`; cancel retry timer (user action resets the policy) |
| 20 | `denied` | `release()` | — | `idle` | cancel retry timer |
| 21 | `unsupported` | `request()` | `fb` and video not yet created | `requesting` | create `<video>` (§5) synchronously inside the caller's gesture; `play()`; reason `request` |
| 22 | `unsupported` | `request()` | `fb` and video exists | `requesting` | `play()` again |
| 23 | `unsupported` | `request()` | `!fb` | `unsupported` | emit `error`; *silent* |
| 24 | `fallback` | `visibilitychange` → hidden | — | `lost` | `video.pause()`; clear nudge timer; advice `hidden_document`; reason `released_hidden` |
| 25 | `fallback` | nudge timer (every 20 s) | `video.paused \|\| video.ended \|\| video.readyState < 2` | `fallback` (self) | `video.currentTime = 0; video.play()`; on `NotAllowedError` → `unsupported` (advice `unsupported_browser`); *silent* when successful |
| 26 | `fallback` | `release()` | — | `idle` | `video.pause()`; clear timer; keep element for reuse |
| 27 | `held` \| `fallback` | `fullscreenchange` | state unchanged after 250 ms | same | *silent* no-op — if the browser released, row 10/11 already fired |
| 28 | any | `destroy()` | — | `idle` | release sentinel; pause and remove `<video>`; remove all listeners; clear timers; `emitter.clear()`; further calls resolve to `'idle'` |
| 29 | any except `idle` | `pagehide` / `freeze` (Page Lifecycle) | — | as per rows 10/24 | The browser releases anyway; we just mirror it. On `resume` event treat as `visibilitychange` → visible |

Row 5 is the retry policy in full: exponential backoff, at most `N = 3` attempts (1 s, 2 s, 4 s), only while visible and only for refusals with no known cause (advice null); after the third failure the machine stays in `denied` with its advice and waits for one of: `request()` (user tap on the pill's "Try again"), `visibilitychange` → visible, `fullscreenchange`. `hidden` denials never retry on a timer (the visible event is the retry). `policy` and `insecure_context` never retry — nothing the user does in the tab can fix them.

### 5. Video fallback details

Created lazily, inside the user's gesture (row 21):

```ts
function createFallbackVideo(doc: Document, sources: { webm?: string; mp4?: string } = {}): IFallbackHandle {
  const v = doc.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = false; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  v.setAttribute('aria-hidden', 'true'); v.setAttribute('hidden', ''); v.title = 'AwakeTab keeps the screen awake';
  v.disablePictureInPicture = true;
  v.style.cssText = 'position:fixed;inset-inline-start:0;inset-block-end:0;inline-size:1px;block-size:1px;opacity:0.01;pointer-events:none';
  // The WebM is built in; the MP4 is added only when the caller passes one (`@awaketab/wake/video`).
  let last: HTMLSourceElement | null = null;
  for (const [type, src] of [['video/webm', sources.webm ?? WEBM_DATA_URL], ['video/mp4', sources.mp4]] as const) {
    if (!src) continue;
    last = doc.createElement('source'); last.type = type; last.src = src; v.appendChild(last);
  }
  doc.body.appendChild(v);
  // play() never settles once every <source> has failed, so the last source's error rejects it instead.
  const play = () => new Promise<void>((resolve, reject) => {
    if (last) last.onerror = () => reject(new Error('no playable source'));
    v.play().then(resolve, reject);
  });
  return { el: v, play, /* pause, startNudge, stopNudge, remove */ };
}
```

- **Sources.** By default there is one source: an inline `data:video/webm;base64,…` clip built into the core, a valid 16 × 16 VP8 WebM with two keyframes one second apart (a single frame never reaches `HAVE_ENOUGH_DATA` in Chromium). The MP4 is opt-in, so the core stays inside its 3.4 KB budget: `import { mp4 } from '@awaketab/wake/video'` (a valid two-frame H.264 MP4 for Safari before 16.4, which has no Wake Lock API and cannot play WebM; the entry holds both clips and is capped at 650 B gz by `size-limit`), then `createWakeLock({ videoSources: { mp4 } })`. The same entry also exports `webm`. `options.videoSources.webm` replaces the built-in WebM; either source may be a `data:` or `https:` URL.
- **When nothing can play.** If no source can play, the request ends in `unsupported` (advice `unsupported_browser`) straight away and the video element is removed (row 9); it never hangs on `requesting`.
- **Who passes the MP4.** The embed widget (`src/tool/embed/app.ts`) passes it for readers on older Safari, since its own budget has room (`11-embed-spec.md` §2); the tool page uses the default WebM only.
- `play()` is called synchronously in the gesture handler's call stack (no `await` before it); its promise is handled per rows 7–9.
- Nudge: every 20 s (`setInterval`) check `paused || ended || readyState < 2` and re-`play()` from `currentTime = 0`. This is a watchdog for browsers that stall a looping tiny video, not a keep-alive by itself.
- On hidden: pause (row 24) — saves the CPU that older fallbacks burned (25–30% reported for the Firefox video path). On visible: `play()` again; if the browser now demands a gesture the machine goes to `unsupported` and the pill asks for a tap (Tap to use the fallback) instead of pretending.
- The element is removed when a failed `play()` ends the request, on `release()` from `fallback`, and on `destroy()`; the next `request()` creates a fresh one.

### 6. Public API of `@awaketab/wake`

```ts
export interface IWakeLockSentinelLike {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
  removeEventListener(type: 'release', cb: () => void): void;
}
export interface IWakeLockLike { request(type: 'screen'): Promise<IWakeLockSentinelLike>; }

export interface IRetryOptions { attempts?: number /* 3 */; baseMs?: number /* 1000 */; maxMs?: number /* 8000 */ }

export interface IWakeLockOptions {
  fallback?: 'video' | 'none';                 // default 'video'
  videoSources?: { webm?: string; mp4?: string };
  reacquireOnVisible?: boolean;                // default true
  retry?: IRetryOptions;
  debug?: boolean | ((msg: string, data?: unknown) => void);
  /** Test/PiP hooks: inject the API and document to observe. */
  wakeLock?: IWakeLockLike | null;              // default navigator.wakeLock (null forces `unsupported`)
  document?: Document;                          // default globalThis.document
  isIOS?: boolean;                              // default: UA sniff for iPhone|iPad|iPod
}

export interface IChangeEvent { from: TLockState; to: TLockState; reason: TLockReason; advice?: TAdviceCode; error?: unknown; at: number }
export interface IErrorEvent  { error: unknown; state: TLockState; advice: TAdviceCode | null }
export interface WakeLockEvents extends Record<string, unknown> { change: IChangeEvent; error: IErrorEvent }

export interface WakeLock {
  readonly state: TLockState;
  readonly mode: 'native' | 'video' | null;
  readonly advice: TAdviceCode | null;
  readonly supported: boolean;                 // API present in this document (false during SSR)
  /** Never rejects; resolves with the state reached: held | fallback | denied | unsupported | idle (if destroyed). */
  request(): Promise<TLockState>;
  release(): Promise<void>;
  on<K extends keyof WakeLockEvents>(type: K, cb: (ev: WakeLockEvents[K]) => void): () => void;
  destroy(): void;
}

export function createWakeLock(options?: IWakeLockOptions): WakeLock;
export function createEmitter<E extends Record<string, unknown>>(): IEmitter<E>;
```

Usage:

```ts
import { createWakeLock } from '@awaketab/wake';

const lock = createWakeLock({ fallback: 'video' });
lock.on('change', ({ to, advice }) => pill.render(to, advice));
button.addEventListener('click', async () => {
  const state = await lock.request();          // inside the gesture so the fallback can play
  if (state === 'denied' || state === 'unsupported') showFix(lock.advice);
});
```

Constraints: `createWakeLock()` touches no globals until `request()`/`on()` is first called, so it is SSR-safe; `request()` while `requesting` returns the in-flight promise; `release()` while `requesting` sets `cancelled` (row 4).

---

## Part B · Session layer — `@awaketab/core`

### 7. Types

```ts
import type { TLockState, TAdviceCode, WakeLock } from '@awaketab/wake';

export type TPlanType = 'indefinite' | 'duration' | 'until';
export type TPlan =
  | { type: 'indefinite' }
  | { type: 'duration'; ms: number }                       // 60_000 ≤ ms ≤ 7 days
  | { type: 'until'; endsAt: number; wall: string };       // endsAt epoch ms (local clock); wall 'HH:MM' — PROPOSED field `wall`

export type TSessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'aborted';
export type TEndReason = 'completed' | 'user' | 'lost_timeout' | 'denied' | 'battery' | 'error';
export type TPresetId = 'p15' | 'p30' | 'p45' | 'p60' | 'p120' | 'p240' | 'pinf' | 'custom' | 'until';
export type TAmbientMode = 'standard' | 'clock' | 'focus' | 'minimal' | 'night' | 'message' | 'cook';
export type TTheme = 'auto' | 'light' | 'dark' | 'oled';
export type TEndBehaviour = 'stop' | 'prompt_extend';

export interface ISession {
  id: string;                 // crypto.randomUUID()
  plan: TPlan;
  presetId: TPresetId;
  mode: TAmbientMode;
  startedAt: number;          // epoch ms
  endsAt: number | null;      // null for indefinite; shifted on pause/resume for duration plans
  status: TSessionStatus;
  pausedAt: number | null;
  pausedMs: number;           // total paused time — PROPOSED field
  endedAt: number | null;     // PROPOSED field
  endReason: TEndReason | null;// PROPOSED field
  awakeSeconds: number;       // seconds spent in held|fallback, for stats — PROPOSED field
  modeState: Record<string, unknown>; // per-mode data, e.g. cookTimers (08-data-storage.md §2.2); written by updateSession()
  source: 'web' | 'pwa' | 'pip' | 'ext' | 'embed';
}

export const PRESET_MS: Record<Exclude<TPresetId, 'pinf' | 'custom' | 'until'>, number> = {
  p15: 15 * 60_000, p30: 30 * 60_000, p45: 45 * 60_000, p60: 60 * 60_000, p120: 120 * 60_000, p240: 240 * 60_000,
};
```

Status lifecycle: `inactive` →(`start`) `active` ⇄(`pause`/`resume`) `paused`; `active|paused` →(`plan end`) `completed`; `active|paused` →(`stop`/`battery`/`denied`/`lost_timeout`/`error`) `aborted`. `completed` always has `endReason: 'completed'`; `aborted` has any other reason. A new `start()` replaces the session object (the previous one has already been folded into stats).

### 8. Tick algorithm

One `setTimeout` chain aligned to the wall clock; no `setInterval`, no accumulated deltas.

```ts
function scheduleTick(): void {
  const now = opts.now();                               // Date.now() by default
  timer = opts.setTimeout(tick, 1000 - (now % 1000));   // fire just after the next whole second
}
function tick(): void {
  timer = null;
  const now = opts.now();
  if (session.status !== 'active') return;
  if (session.plan.type === 'until') reconcileUntil(now);   // §8.1
  if (session.endsAt !== null && now >= session.endsAt) { finish('completed', now); return; }
  if (lock.state === 'held' || lock.state === 'fallback') {
    session.awakeSeconds += 1;                             // credit only genuinely awake seconds
    if (session.awakeSeconds % 60 === 0) stats.creditMinute(now);
  }
  if (lock.state === 'lost' && lostSince !== null && now - lostSince >= opts.lostTimeoutMs) { finish('lost_timeout', now); return; }
  emit('tick', { now, remainingMs: session.endsAt === null ? null : Math.max(0, session.endsAt - now), elapsedMs: now - session.startedAt - session.pausedMs });
  scheduleTick();
}
```

Properties: a tick that fires late (throttled background tab, long task) computes remaining time from `endsAt - now`, so the display never drifts; catch-up is automatic because the next delay is recomputed from `now % 1000`. On `visibilitychange` → visible the engine cancels the pending timer and runs `tick()` immediately so the UI is correct on the first frame. Background timers in hidden tabs are throttled to ≥ 1 min by browsers — irrelevant here because the lock is `lost` while hidden and the end check runs on return; the end-of-session pipeline still fires late-but-correct.

#### 8.1 `until` plans, DST and clock changes

`Plan.until` stores both `endsAt` (absolute) and `wall` (`'HH:MM'` local). Creation: parse `HH:MM`, build `new Date()` set to today at that local time via `setHours(h, m, 0, 0)`; if `≤ now + 30 s` add one day. Because `endsAt` is absolute, a DST transition between now and the target is handled by the `Date` local-time computation at creation — "until 06:00" across a spring-forward night is a correct 06:00. `reconcileUntil(now)` guards the remaining cases: if `formatHHMM(new Date(endsAt))` no longer equals `wall` (time-zone change, manual clock adjustment, NTP correction > 60 s detected as `|now - lastTickAt| > 90_000` while visible), recompute `endsAt` from `wall` relative to `now` and emit `warning { code: 'clock_adjusted' }`. It runs on every tick and on `visibilitychange`. For `duration` plans, `endsAt` is never recomputed: a backwards clock jump extends the session by the jump, a forward jump past `endsAt` completes it on the next tick — both acceptable and rare.

### 9. Pause and resume

`pause()` (allowed in `active`): `status = 'paused'`, `pausedAt = now`, `lock.release()` — the screen may sleep while paused, that is the point — tick chain stopped, persist. `resume()` (allowed in `paused`): `pausedMs += now - pausedAt`; for `duration` plans `endsAt += now - pausedAt` (remaining time is preserved); for `until` plans `endsAt` is unchanged (the clock target is what matters — if it has passed, `resume()` finishes with `completed` immediately); `indefinite` unchanged; `status = 'active'`, `await lock.request()`, restart ticks, persist. Pause does not count toward `awakeSeconds`.

**`pause({ keepLock: true })`** (cook mode, `05-frontend-spec.md` §3.16): same as `pause()` except the lock is **not** released — the clock stops, the screen stays awake, and the pill keeps reading the real lock state. `resume()` then reuses the kept lock when it is still `held` or `fallback`, and re-requests it otherwise (e.g. it was `lost` while the tab was hidden). A plain `pause()` still releases.

**`addTime(ms)`** (PiP and popup `+15`): allowed in `active` and `paused` on a finite plan; ignored for `indefinite`, for non-finite or `ms ≤ 0`, and when remaining + `ms` would exceed `CUSTOM_MAX_MS`. A `duration` plan grows in place (`plan.ms += ms`, `endsAt += ms`). An `until` plan whose deadline moved is no longer a wall-clock target, so it becomes `{ type: 'duration', ms: endsAt + ms − startedAt − pausedMs }` with `endsAt = startedAt + plan.ms` — the same moved deadline. Unlike `extend()` it never starts a new session. Tracks `session_extend { addedMin }`, persists, and broadcasts a `state` snapshot (§14).

**`updateSession({ mode?, modeState? })`**: sets `session.mode` and shallow-merges `modeState` on the current session, then persists. The island calls it when the ambient mode changes during a live session and whenever cook-mode kitchen timers change, so a reload resumes both.

**`stop()` after completion**: when the session is already `completed`/`aborted`, `stop()` does not finish it again but still calls `lock.release()`, because the UI may have re-requested the lock for the extend-prompt grace period (§10 step 6). Before M6 that grace lock could outlive a Stop.

### 10. End-of-session pipeline

`finish(reason, now)` runs the same ordered steps for every end; steps 3–6 are skipped for `reason === 'user'`.

1. `status = reason === 'completed' ? 'completed' : 'aborted'`; `endReason`, `endedAt` set; tick chain stopped; `lock.release()`.
2. Persist `at.v1.session`; `stats.finalize(session)` (credit the partial minute if `awakeSeconds % 60 ≥ 30`; increment `sessions` and `daySessions[dayKey(now)]`; when `reason === 'completed'` and `modeState.focusBlock === true`, increment `dayFocus[dayKey(now)]`); track `session_end { reason, durationMin }`.
3. Chime (if `settings.sound.enabled`): the `AudioContext` was created and `resume()`d on the start gesture so it can play now without user interaction; a 600 ms two-tone chime from an oscillator (no audio file). Pro `sounds.custom` replaces it.
4. Notification (if `settings.notifications` and permission `granted`): `registration.showNotification(t('end.title'), { body, tag: 'at-end', renotify: true, icon: '/icons/192.png' })` through the service worker so it works with the tab in the background. On iOS this is only possible in the installed Home-Screen app; the settings toggle is hidden when `caps.features.notifications === 'unavailable'`.
5. Title flash: alternate `document.title` between the original and `t('end.titleFlash')` every 1 s until the document is visible *and* focused, then restore. Never `alert()`.
6. Extend prompt: if `settings.endBehaviour === 'prompt_extend'` (default) show the `extend` overlay (+15 min, +30 min, +60 min, ∞) with a 60 s auto-dismiss; `extend(ms)` creates a new `duration` session with `presetId: 'custom'` and the same mode (or `indefinite` for ∞). If `stop`, show the summary toast only. For `battery` and `denied` the overlay shows the fix instead of the extend buttons.

As implemented (M6): steps 1–2 run in the engine; steps 3–6 run in the island's lazily loaded `end.ts` on the `ended` event, for every reason except `user` and `denied` (the capability notice already explains a denial). Step 3 plays two Web Audio oscillator tones (660 Hz, then 880 Hz at +0.3 s) through the `AudioContext` primed on the first gesture, silent when `settings.sound.id === 'none'`. Step 4 uses `registration.showNotification()` with tag `at-end` and falls back to `new Notification()`; it never asks for permission (Settings asks when the toggle is turned on). Step 5 flashes at 1 Hz (`TITLE_FLASH_MS`) for at least 3 s (`TITLE_FLASH_MIN_MS`). Step 6 applies only to `completed` and never in `cook` mode; while the prompt is open the island re-requests the lock as a grace period, and closing the prompt without a choice (Esc, or the auto-stop after `EXTEND_AUTO_STOP_MS` = 5 min — this supersedes the 60 s above, per E10-T04) is a Stop. A `completed` session with `awakeSeconds ≥ 300` increments `at.v1.meta.sessionCount`, and the rating prompt is considered 2 s after the prompt closes (`05-frontend-spec.md` §3.22).

### 11. Battery monitor (Chromium only)

Enabled when `'getBattery' in navigator` and `settings.battery.autoStop`, and only while the session is `active`. The engine calls `navigator.getBattery()` **once** and caches the `BatteryManager` for its lifetime (listeners on `levelchange` and `chargingchange` are removed in `destroy()`); `null` is cached when the API is absent or rejects. It evaluates on start, on every battery event, and on every 60th tick (the first tick included). `evaluateBattery(b, threshold, 0.02)` returns `ok` when charging, `stop` when `level ≤ threshold` (default `0.15`), `low` when `level ≤ threshold + 0.02`:

- `low` → emit `warning { code: 'battery_low', level }` (toast `tool.toast.batteryLow`), at most **once per session** (the flag resets on `start()`).
- `stop` while armed → disarm, then `finish('battery')`.
- Hysteresis: the stop re-arms only once the device is charging or `level ≥ threshold + 0.05`. A session started below the threshold on the same discharge gets the one-time `battery_low` warning instead of being stopped again. The armed flag lives in memory for the engine's lifetime.
- The active check is re-done after `getBattery()` resolves, so a session that ended meanwhile is never finished twice.

### 12. Persistence and resume

Written to `at.v1.session` on every status change, on `extend`, and at most every 30 s while active (`awakeSeconds` heartbeat for stats accuracy; the tick itself never writes). On boot, `getResumable()` returns the stored session when all hold: `status ∈ {'active','paused'}`; and (`endsAt !== null && endsAt > now`) or (`plan.type === 'indefinite' && now - startedAt < 12 h`). Otherwise, if `status === 'active'` and `endsAt !== null && endsAt ≤ now` the session is marked `completed` silently (it ended while unloaded; minutes credited only up to the last heartbeat); if indefinite and older than 12 h it is marked `aborted` with `endReason: 'error'`. The UI shows the `resume` overlay (`resume_shown`); accept → `resumeSession()` (`resume_accepted`), which keeps `id`/`startedAt`, adds the unloaded gap to `pausedMs` for `duration` plans (shifting `endsAt` accordingly, so a reload is treated as a pause), and requests the lock; decline → `aborted` with `endReason: 'user'` and no chime.

### 13. Stats

`at.v1.stats = { days: Record<'YYYY-MM-DD', number>, totalMinutes, sessions, longestStreak }` (schema and retention in `08-data-storage.md`).

```ts
const dayKey = (ms: number) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); // local date, e.g. 2026-09-07
```

**M6 follow-ups.** `finish()` also keeps two optional per-day counters (`08-data-storage.md` §2.3), both through `countDay(rec, now, timeZone)` on the local day the session **ends**, so a session that crosses local midnight counts on the new day while its minutes split at the boundary. `daySessions` goes up under the same ≥ 1 min rule as `sessions`. `dayFocus` goes up for a `completed` session carrying `modeState.focusBlock === true`, which focus mode sets on the block it starts. A block stopped early, or an extension of a finished block, is a session but not a focus block.

`creditMinute(now)` adds 1 to `days[dayKey(now)]` and `totalMinutes`, flushing to storage at most every 60 s. `finalize()` increments `sessions` when the session had ≥ 1 credited minute, prunes keys older than 365 days, and recomputes streaks: walk backwards from today; `currentStreak` counts consecutive days with `minutes ≥ 1` starting at today or, if today is empty, at yesterday; `longestStreak = max(longestStreak, currentStreak)`. `currentStreak` is derived on read, not stored. Free tier renders 7 days; `stats.history` unlocks the 365-day heatmap; `stats.export` the CSV — the data is stored for everyone so upgrading reveals history.

### 14. Multi-tab protocol and single-active-lock election

Channel: `new BroadcastChannel('awaketab')`. `tabId` is `crypto.randomUUID()` kept in `sessionStorage['at.tabId']` (survives reload, not tab duplication — a duplicated tab gets a new id because we also compare `performance.timeOrigin`).

```ts
// Accepted — 00-conventions.md §13.1, §13.8
type TTabMessage =
  | { type: 'hello'; tabId: string; ts: number }
  | { type: 'lock';  tabId: string; ts: number; state: TLockState }
  | { type: 'state'; tabId: string; ts: number; status: TSessionStatus; lock: TLockState; startedAt: number | null;
      // timing snapshot so a mirror (the /pip popup) can count locally between messages
      endsAt?: number | null; planType?: TPlanType; pausedMs?: number; pausedAt?: number | null; wall?: string | null }
  | { type: 'intent'; tabId: string; ts: number; target: string; action: 'stop' | 'add'; ms?: number }
  | { type: 'bye';   tabId: string; ts: number };
```

Rules:

1. On boot post `hello`. Every peer replies with `lock` (its current lock state) and, when it has a session, a full `state` snapshot. Peers are tracked in a map with a 10 s liveness timeout refreshed on any message; `peers` in the store is the map size.
2. Before `start()`, if any peer reports `lock ∈ {'held','fallback'}`, the UI shows the `secondTab` overlay: "AwakeTab is already running in another tab" with *Use this tab* / *Keep the other*. In `/embed/*` and `autostart=1` the newest tab takes over without asking.
3. Election — newest holder wins: whenever a tab transitions to `held`/`fallback` it posts `lock`. A tab that is itself `held`/`fallback` and receives `lock { state: held|fallback }` with `ts > ownAcquiredAt` releases its lock, sets its session to `paused` with a toast "Now running in the other tab", and does not re-request on `visibilitychange` until the user resumes. Because only a visible tab can hold a native lock, this mostly matters for stats double-counting and honest pills.
4. `bye` on `pagehide` removes the peer immediately.
5. Snapshots: while it has a session, the engine posts `state` (with `endsAt`, `planType`, `pausedMs`, `pausedAt`, and `wall` for `until` plans) on every tick, on every status change, on every lock change, and after `addTime()`. Mirrors compute the timer locally from the snapshot, so a throttled owner tab never freezes them.
6. Intents: a tab without an engine (the `/pip` popup, `05-frontend-spec.md` §9) acts through `intent` messages addressed to one owner's `tabId`. The addressed engine runs `stop()` for `action: 'stop'` and `addTime(ms)` for `action: 'add'`; every other tab ignores the message. Intents are commands, never state: the mirror still waits for the owner's next `state` to change its display.

### 15. Capability probe

Synchronous, runs once at boot (< 1 ms), result cached in the store and re-used by the pill copy, settings visibility and analytics `ua` class.

```ts
export type TBrowserFamily = 'chrome' | 'edge' | 'firefox' | 'safari' | 'samsung' | 'opera' | 'other';
export type TOSFamily = 'ios' | 'ipados' | 'android' | 'windows' | 'macos' | 'linux' | 'chromeos' | 'other';

export interface ICapabilities {
  browser: { family: TBrowserFamily; major: number | null; minor: number | null; source: 'ua-ch' | 'ua' };
  os: { family: TOSFamily };
  isIOS: boolean;                 // iPhone/iPad/iPod, including iPadOS desktop UA (MacIntel + maxTouchPoints > 1)
  isStandalone: boolean;          // matchMedia('(display-mode: standalone)') || navigator.standalone === true
  isSecureContext: boolean;
  isEmbedded: boolean;            // window !== window.top
  wakeLock: 'native' | 'fallback' | 'none';   // feature detection first, matrix second
  matrix: { nativeExpected: boolean; minVersion: string | null };   // from the support matrix, for advice copy
  features: {
    battery: boolean;                                      // 'getBattery' in navigator (Chromium only)
    notifications: 'granted' | 'denied' | 'default' | 'unavailable';   // 'unavailable' on iOS when not standalone
    documentPip: boolean;                                  // 'documentPictureInPicture' in window (Chromium only)
    idleDetection: boolean;                                // 'IdleDetector' in window (Chromium only)
    broadcastChannel: boolean;
    serviceWorker: boolean;
    webCrypto: boolean;                                    // crypto.subtle available (needed for licence verify)
  };
  advice: TAdviceCode | null;          // initial advice before any request: insecure_context | unsupported_browser | null
}

const NATIVE_MIN: Partial<Record<TBrowserFamily, [major: number, minor: number]>> = { chrome: [84, 0], edge: [84, 0], firefox: [126, 0], safari: [16, 4], samsung: [14, 0], opera: [70, 0] };
```

Browser family comes from `navigator.userAgentData.brands` when present (pick, in order, `Microsoft Edge`, `Samsung Internet`, `Opera`, `Google Chrome`, `Chromium`; version from that brand), else from the UA string (`Edg/`, `SamsungBrowser/`, `OPR/`, `Firefox/`, `Chrome/`, `Version/… Safari/`). `wakeLock` is `'native'` if `'wakeLock' in navigator`, else `'fallback'` if a `<video>` can be created (`typeof HTMLVideoElement !== 'undefined'`), else `'none'`. The matrix does not override detection; it only produces copy such as "Safari 16.3 — update to 16.4 for native support". iOS Home-Screen apps below 18.4 are detected as `isIOS && isStandalone` with `os` version < 18.4 → `matrix.nativeExpected = false` and advice copy points to the browser tab instead.

**iOS Low Power heuristic** (in `core`, because `wake` has no timeline): on iOS, if the document goes hidden without any user input in the preceding 25–40 s while `held`, twice within one session, emit `warning { code: 'ios_low_power' }`; the UI shows the Low Power Mode fix. This is a heuristic and the copy says "probably".

### 16. Public API of `@awaketab/core`

```ts
export interface IStorageAdapter { get<T>(key: string): T | null; set(key: string, value: unknown): void; remove(key: string): void; readonly persistent: boolean }

export interface ISessionOptions {
  lock: WakeLock;
  storage: IStorageAdapter;                     // from createStorage() — see 08-data-storage.md
  channel?: BroadcastChannel | null;           // null disables multi-tab logic
  settings: () => ISettings;                    // live getter so changes apply without restart
  now?: () => number;                          // default Date.now
  setTimeout?: typeof setTimeout; clearTimeout?: typeof clearTimeout;
  lostTimeoutMs?: number;                      // default 6 h
  notify?: (title: string, body: string) => Promise<void>;   // SW notification adapter (web) / chrome.notifications (extension)
  track?: (event: string, params?: Record<string, string | number | boolean>) => void;
}

export interface ISessionEvents extends Record<string, unknown> {
  tick:    { now: number; remainingMs: number | null; elapsedMs: number };
  status:  { from: TSessionStatus; to: TSessionStatus; reason: TEndReason | null };
  lock:    IChangeEvent;                        // re-emitted from @awaketab/wake
  ended:   { session: ISession; reason: TEndReason };
  warning: { code: 'battery_low' | 'second_tab' | 'clock_adjusted' | 'ios_low_power' | 'storage_memory'; level?: number };
  peers:   { count: number };
}

export interface ISessionEngine {
  readonly session: ISession | null;
  readonly lockState: TLockState;
  start(plan: TPlan, meta: { presetId: TPresetId; mode: TAmbientMode; source?: string }): Promise<TLockState>;
  pause(opts?: { keepLock?: boolean }): void;  // keepLock: clock paused, lock kept (cook mode, §9)
  resume(): Promise<TLockState>;
  stop(): void;                                // endReason 'user'; after completion only releases the grace lock
  extend(ms: number | 'indefinite'): Promise<TLockState>;
  addTime(ms: number): void;                   // grow the live finite plan in place (§9)
  updateSession(patch: { mode?: TAmbientMode; modeState?: Record<string, unknown> }): void;
  getResumable(): ISession | null;
  resumeSession(): Promise<TLockState>;         // accept the resume banner
  discardResumable(): void;
  on<K extends keyof ISessionEvents>(type: K, cb: (ev: ISessionEvents[K]) => void): () => void;
  destroy(): void;
}

export function createSession(opts: ISessionOptions): ISessionEngine;
export function planFromPreset(id: Exclude<TPresetId, 'custom' | 'until'>): TPlan;
export function planUntil(wall: string, now?: number): TPlan;               // 'HH:MM' → { type:'until', endsAt, wall }
export function probeCapabilities(win?: Window & typeof globalThis): ICapabilities;
export { createStorage, migrate, readStats, exportStatsCsv, clearAllData } from './storage';
export { verifyLicenseToken, type ILicenseState } from './license';
export { dayKey, computeStreaks } from './stats';
```

Usage (web island):

```ts
const lock = createWakeLock({ fallback: 'video' });
const engine = createSession({ lock, storage, channel: new BroadcastChannel('awaketab'), settings: () => store.get().settings, notify: swNotify, track });
engine.on('tick', ({ remainingMs }) => store.set({ now: Date.now() }));
engine.on('lock', ({ to, advice, mode }) => store.set({ lock: { state: to, advice, mode } }));
engine.on('ended', ({ reason }) => reason !== 'user' && store.set(s => ({ ui: { ...s.ui, overlay: 'extend' } })));
startButton.onclick = () => engine.start(planFromPreset('p30'), { presetId: 'p30', mode: 'standard', source: 'button' });
```

Extension: the background service worker implements `WakeLock` over `chrome.power.requestKeepAwake('display')` / `releaseKeepAwake()` (always `held` after request; `unsupported` when `chrome.power` is absent) and passes it to `createSession()` with a `chrome.storage.local`-backed `IStorageAdapter`, `channel: null`, and `notify` via `chrome.notifications`. As built (M7): `resumeIndefiniteMs: Infinity` (new `ISessionOptions` field, default 12 h) so the frequently restarted worker can resume a long indefinite session; `channel: null` now really disables the tab protocol (it previously still opened the channel); `IStorageAdapter` is exported. End notifications are sent by the extension controller on `ended`, not through `notify` (see `10-extension-spec.md` §13).

### 17. Test hooks

- `createWakeLock({ wakeLock: fake, document: fakeDoc })` — `@awaketab/wake/testing` exports `createFakeWakeLock()` returning `{ api: WakeLockLike; sentinels: FakeSentinel[]; rejectNextWith(err: Error): void; releaseAll(): void }` where `FakeSentinel.fireRelease()` simulates the browser releasing. `setVisibility(doc, 'hidden' | 'visible')` redefines `visibilityState` and dispatches `visibilitychange`. Passing `wakeLock: null` forces the `unsupported` path; a `HTMLVideoElement.prototype.play` stub (`vi.spyOn`) drives rows 7–9.
- `createSession({ now, setTimeout, clearTimeout })` — inject a controllable clock, or use Vitest fake timers (`vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })`) and `vi.setSystemTime()` to test DST/`until` reconciliation and the 12 h resume window.
- `IStorageAdapter` in-memory implementation is the same class used for the private-mode fallback, so storage tests need no jsdom `localStorage`.
- `BroadcastChannel` is polyfilled in tests with an in-process implementation that delivers to all other instances synchronously; election tests create two engines on the same channel.
- Every transition row in §4 has a Vitest case named `T<row>`; the e2e suite (Playwright, chromium/firefox/webkit) asserts the pill text after tab hide/show and after a forced `NotAllowedError` via `--disable-features=WakeLock` or CDP `Emulation.setIdleOverride`. See `13-testing-strategy.md`.
