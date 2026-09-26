# 08 · Data and storage

Status: v1.1 · 2026-09-26 · Owner: Soubhik

**Purpose.** Every byte AwakeTab persists — in the browser, in the extension, in Cloudflare KV and in Workers Analytics Engine — with its schema, defaults, versioning, retention and privacy classification. There are no accounts and no database; this document is the whole data model.

Related docs: `00-conventions.md` §6, §9, §10, §13 · `04-engine-spec.md` (who writes the session and stats) · `09-monetization-impl.md` (licence records) · `18-analytics-kpis.md` (how events are read) · `14-devops.md` (backups, secrets).

---

## 1. Principles

1. **Local first.** Everything the product needs to function lives in the user's browser under the `at.v1.*` keys. The server holds only licence records, embed configs and anonymous events.
2. **No identifiers that follow a person.** No cookies, no user ids, no fingerprinting. `deviceId` is a random UUID that exists only to count licence activations; `sid` is a per-tab random id that dies with the tab.
3. **Schema-on-read with defaults.** Every read passes through `parse<T>(key, schema, defaults)`; corrupt or missing values fall back to defaults and are logged as `client_error {code:'storage_unavailable'}` only when the whole store is inaccessible.
4. **Versioned keys.** The `v1` in `at.v1.settings` is the *schema major*. Additive changes keep `v1`; a breaking change ships `migrate()` and a `v2` prefix.

---

## 2. Browser storage (localStorage)

All values are JSON. Sizes are well under 50 KB total; localStorage quota (≥ 5 MB) is never a concern. `sessionStorage['at.tabId']` (UUID) is the only sessionStorage item.

### 2.1 `at.v1.settings`

```ts
export interface ISettings {
  v: 1;
  theme: 'auto' | 'light' | 'dark' | 'oled';        // default 'auto'
  accent: string;                                   // light-theme hex, default '#B86E00'; one of '#B86E00' (amber) · '#4F46E5' (indigo) · '#0F766E' (teal, ambient.packs) · '#BE123C' (rose, ambient.packs); unknown or unlicensed values render as amber — dark variants come from tokens.css (05-frontend-spec.md §1.1a)
  defaultPreset: TPresetId;                          // 'p15'|'p30'|'p45'|'p60'|'p120'|'p240'|'pinf'|'custom'|'until'; default 'pinf'
  lastCustomMs: number;                             // default 90 * 60_000
  lastUntilWall: string | null;                     // 'HH:MM', default null
  autostart: boolean;                               // default true (request lock on load when visible)
  sound: { id: 'chime' | 'bell' | 'soft' | 'none' | `custom:${string}`; volume: number }; // default {id:'chime', volume:0.6}; custom ids gated by `sounds.custom`
  notifications: boolean;                           // default false (permission asked only when turned on)
  endBehaviour: 'stop' | 'prompt_extend';           // default 'prompt_extend'
  battery: { autoStop: boolean; threshold: number; chargingReminder: boolean }; // default {false, 15, true}; UI hidden when Battery API absent
  ambient: {
    mode: 'standard' | 'clock' | 'focus' | 'minimal' | 'night' | 'message' | 'cook'; // default 'standard'
    message: string;                                // ≤ 80 chars, default ''
    clock24h: boolean | null;                       // null = follow locale
    showSeconds: boolean;                           // default false
    pixelShift: boolean;                            // default true in ambient modes
    autoHideMs: number;                             // default 3000
    focus: { workMin: number; breakMin: number; cycles: number }; // default {25, 5, 4}
  };
  locale: string | null;                            // explicit override, default null (URL decides)
  telemetry: boolean;                               // default true (anonymous events); toggle in ISettings + /privacy
  keyboardShortcuts: boolean;                       // default true — single-key shortcuts (WCAG 2.1.4)
  keyboardHints: boolean;                           // default true — show hints in UI
  reduceMotion: 'system' | 'on' | 'off';            // default 'system'
}
```

### 2.2 `at.v1.session`

Written by `@awaketab/core` on every status change and at most once per 15 s while active (the tick does not write).

```ts
export type TPlan =
  | { type: 'indefinite' }
  | { type: 'duration'; ms: number }
  | { type: 'until'; endsAt: number; wall: string };

export type TSessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'aborted';
export type TEndReason = 'completed' | 'user' | 'lost_timeout' | 'denied' | 'battery' | 'error';

export interface ISession {
  v: 1;
  id: string;               // UUID
  plan: TPlan;
  presetId: TPresetId;
  mode: TAmbientMode;
  startedAt: number;        // epoch ms
  endsAt: number | null;    // null for indefinite
  status: TSessionStatus;
  pausedAt: number | null;
  pausedMs: number;         // total paused time (informational; endsAt is never shifted)
  endedAt: number | null;
  endReason: TEndReason | null;
  awakeSeconds: number;     // seconds spent in lock `held` or `fallback`
  modeState: Record<string, unknown>; // per-mode data merged by engine.updateSession(): { cookTimers?: ICookTimer[]; focusBlock?: true }
  source: 'web' | 'pwa' | 'pip' | 'ext' | 'embed';
}
```

```ts
// cook mode kitchen timers — session.modeState.cookTimers (apps/web/src/tool/ambient/logic.ts)
export interface ICookTimer {
  id: string;               // 8-char random id
  name: string;             // ≤ 20 code points, NFC, control/format chars stripped; default 'Timer N'
  durationMs: number;       // 60_000 … 12 h
  endsAt: number;           // epoch ms (wall clock; keeps running while the session clock is paused)
  doneAt: number | null;    // epoch ms when it fired, null while counting
}
```

`modeState.focusBlock` (M6 follow-ups) is `true` on a session started by focus mode's "Start a focus block". It is what makes the session count toward `at.v1.stats.dayFocus` when it completes (§2.3).

At most 3 timers. The reader is defensive: a non-array or malformed entry is dropped (localStorage is user-editable). Focus-mode phases are not stored — they are derived from `startedAt`, `pausedMs` and `settings.ambient.focus` on every repaint. Since M6 the session also changes through `addTime(ms)` (an `until` plan may become a `duration` plan with the same deadline) and `pause({ keepLock: true })` (cook mode; `04-engine-spec.md` §9).

**Resume rule** (evaluated on load): offer the resume banner when `status ∈ {active, paused}` and (`endsAt > now` or (`plan.type === 'indefinite'` and `now - startedAt < 12 h`)) and `now - (pausedAt ?? startedAt) < LOST_TIMEOUT_MS`. Otherwise mark `aborted` with `lost_timeout` and fold `awakeSeconds` into stats.

### 2.3 `at.v1.stats`

```ts
export interface IStats {
  v: 1;
  days: Record<string, number>;   // 'YYYY-MM-DD' (LOCAL date) → awake minutes
  totalMinutes: number;
  sessions: number;               // completed + user-ended sessions ≥ 1 min
  longestStreakDays: number;
  currentStreakDays: number;      // recomputed on read
  lastSessionAt: number | null;
  daySessions?: Record<string, number>; // M6 follow-ups: 'YYYY-MM-DD' (LOCAL) → sessions ≥ 1 min that ENDED that day
  dayFocus?: Record<string, number>;    // M6 follow-ups: 'YYYY-MM-DD' (LOCAL) → focus blocks completed that day
}
```

**Per-day counters (M6 follow-ups, backward-compatible, no version bump).** `daySessions` goes up wherever `sessions` does, on the local day the session ends. `dayFocus` goes up when a session with `modeState.focusBlock === true` ends with reason `completed` (`04-engine-spec.md` §10). Both are optional. Data written before them has neither field, and `storage.stats()` does not invent them: a missing record or a missing day means "not recorded", which the Stats panel shows as 0 sessions today and the CSV leaves empty. On read, both are pruned with the same 365-day window as `days`. A value that is not an object is dropped, and `pruneDays()` keeps only number values, for `days` too. `dayFocus` is a separate sparse record rather than a second number inside `daySessions`, so the common record stays `Record<string, number>`, and people who never use focus mode store nothing extra.

Day key: `new Intl.DateTimeFormat('en-CA', { year:'numeric', month:'2-digit', day:'2-digit' }).format(date)` — always the user's local date (the nosleep.page UTC bug is a regression test). Minutes are added at each whole awake minute and at session end; a session spanning midnight splits at the local boundary. Retention: prune keys older than 365 days on write. Free users see the last 7 days; `stats.history` unlocks the full 365 and `stats.export` the CSV.

### 2.4 `at.v1.license`

```ts
export interface ILicenseRecord {
  v: 1;
  token: string;            // JWT (ES256)
  plan: 'pro_yearly' | 'pro_lifetime' | 'biz_embed_site_yearly' | 'biz_kiosk_site' | 'biz_kiosk_5';
  features: TFeatureGate[];  // copied from token for fast reads
  exp: number;              // epoch seconds from token
  lastValidatedAt: number;  // epoch ms of last successful online validate
  deviceId: string;         // random UUID, generated once, never derived from hardware
  deviceLabel: string;      // e.g. 'Chrome on macOS' (user-editable)
}
```

Token claims: `{ sub: keyHash, plan, features, dev: deviceHash, iat, exp, ver }`. Verification (browser and extension): `crypto.subtle.verify({ name:'ECDSA', hash:'SHA-256' }, publicKey(ver), sig, data)` against `LICENSE_PUBLIC_KEYS[ver]`; reject if `exp < now`, `dev !== sha256(deviceId)`, or unknown `ver`. Re-validation: yearly plans on load when `now - lastValidatedAt > 24 h`; lifetime every 90 days; kiosk every 30 days; failures while offline never downgrade until `exp` (yearly tokens carry a 7-day grace past period end).

### 2.5 `at.v1.meta`

```ts
export interface IMeta {
  v: 1;
  installedAt: number;
  sessionCount: number;            // completed sessions ≥ 5 min
  ratingPrompt: { shownAt: number | null; action: 'rated' | 'later' | 'never' | null; stars?: number; rearmAt?: number }; // rearmAt = sessionCount at which 'later' asks again (sessionCount + 10)
  lastSeenVersion: string;         // for the changelog toast
  pwa: { installed: boolean; promptShownAt: number | null };
  secondTabWarnedAt: number | null;
}
```

### 2.6 `at.v1.onboarding`

`{ v: 1, dismissedTips: string[] }` — tip ids such as `pip`, `until`, `shortcuts`.

### 2.7 Access layer

```ts
// packages/core/src/storage.ts
export interface IStorageAdapter { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void }
export const memoryAdapter: IStorageAdapter;   // used when localStorage throws (private mode, disabled)
export function createStore(adapter?: IStorageAdapter): {
  settings: Ref<ISettings>; session: Ref<ISession | null>; stats: Ref<IStats>; license: Ref<ILicenseRecord | null>; meta: Ref<IMeta>;
  migrate(): void; clearAll(): void; exportCsv(): string;
};
```

Writes are debounced 250 ms except `session.status` changes (immediate). If `localStorage` throws on first access, the store switches to `memoryAdapter`, shows one toast ("Settings won't be saved in this private window") and emits `client_error {code:'storage_unavailable'}` once.

### 2.8 Migration

`migrate()` runs before first render: reads `at.v1.*`; unknown fields are dropped, missing fields get defaults, and `v` is stamped. A future `v2` adds `migrateV1toV2()` and removes `at.v1.*` after a successful copy. Never migrate `at.v1.license` lossy — if it cannot be parsed, keep the raw string under `at.v1.license.raw` for support.

### 2.9 Clear all data

Settings → "Delete all local data": removes every `at.*` key and `sessionStorage['at.tabId']`, unregisters the service worker's caches, reloads. The licence is included (the user is warned and shown the key-recovery link — keys are recoverable from the Polar receipt email).

---

## 3. Extension storage

`chrome.storage.local`: the same `ISettings`, `ISession` (extension-scoped, `source:'ext'`), `ILicenseRecord` and `IMeta` shapes under keys `at.v1.*`. `chrome.storage.sync` (≤ 100 KB): `ISettings` and the list of auto-start domains and schedules only; never the licence token. See `10-extension-spec.md`.

---

## 4. Server storage (Cloudflare KV, namespace `LICENSES`)

| Key | Value | TTL / lifecycle |
|---|---|---|
| `lic:{keyHash}` | `{ plan, status: 'active'|'canceled'|'revoked'|'refunded'|'expired', keyEnc, polarOrderId, customerId, activations: [{ devHash, label, at }], limit, exp, createdAt, updatedAt }` | until `exp + 1 y`, then expire |
| `cus:{customerId}` | `string[]` of keyHashes | with the licences |
| `wh:{eventId}` | `{ at }` | 30 days (idempotency) |
| `ord:{orderId}` | `{ plan, amountCents, currency, customerId, at }` | 2 years (reporting) |
| `embed:{domain}` | `{ keyHash, attribution: false, theme: { accent, scheme }, expiresAt }` | until `expiresAt + 30 d` |
| `rl:{route}:{ipHash}:{bucket}` | counter | 120 s |
| `rating:{id}` | `{ stars, text?, locale, ver, at }` | 2 years; exported nightly to `data/ratings.json` (aggregate only) |

`canceled` = the subscription will not renew; tokens keep working until `exp` (docs/09 §2.7). `revoked` and `refunded` are terminal. `activations[].at` is the device's last-seen time (refreshed by `/api/license/validate`); activate evicts a device unseen for 90 days. `wh:{eventId}` is written after the event is handled, so a failed delivery is re-processed on Polar's retry.

`keyHash = sha256(licenceKey)` hex; `devHash = sha256(deviceId)`; `ipHash = sha256(RATE_LIMIT_SALT + ip)` — the salt rotates quarterly so hashes cannot be joined across quarters. The raw key is stored only as `keyEnc` (AES-256-GCM with `LICENSE_KEY_ENC_KEY`) because Polar's deactivate endpoint needs it.

Backups: a scheduled Worker exports `lic:*`, `embed:*`, `ord:*` to R2 weekly (`14-devops.md` §11).

---

## 5. Analytics Engine (dataset `awaketab_events`)

Written by `POST /api/e` (batch ≤ 20 events, ≤ 8 KB). No PII by construction: the function drops any field not in the allow-list.

| Column | Type | Contents |
|---|---|---|
| `index1` | index | `event` name (from `00-conventions.md` §10 and §13.4) |
| `blob1` | string | `path` (no query string; locale prefix kept) |
| `blob2` | string | `locale` |
| `blob3` | string | `ua` class, e.g. `chrome-128/mac`, `safari-17/ios`, `firefox-129/win` |
| `blob4` | string | `source` (`web`,`pwa`,`pip`,`ext`,`embed`) |
| `blob5` | string | `sid` (per-tab random id; used for funnels within a tab, never persisted) |
| `blob6` | string | event attribute 1 (`planType` / `reason` / `from` / `plan` / `action` / `code` / `page`) |
| `blob7` | string | event attribute 2 (`presetId` / `to` / `sku` / `sponsorId`) |
| `blob8` | string | `viewport` class (`sm`,`md`,`lg`) |
| `blob9` | string | `ver` (site version) |
| `double1` | number | numeric attribute (`durationMin`, `addedMin`, `stars`, `count`) |
| `double2` | number | client `ts` skew vs server (ms), for sanity checks |

Sampling: all events except `client_error` (10%, done client-side). Retention: Analytics Engine keeps 90 days; monthly KPI snapshots are written to `docs/metrics/YYYY-MM.md` before they age out.

Example — autostart success rate (last 7 days):

```sql
SELECT
  countIf(index1 = 'lock_state' AND blob7 = 'held' AND double1 <= 300) AS held_fast,
  countIf(index1 = 'session_start') AS starts,
  held_fast / starts AS autostart_success
FROM awaketab_events
WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob4 IN ('web','pwa');
```

More queries in `18-analytics-kpis.md` §4.

---

## 6. CSV export (Pro `stats.export`)

Columns: `date,awake_minutes,sessions` (one row per local day, ISO dates; the rows are the union of the `days` and `daySessions` keys), plus a trailer comment `# exported YYYY-MM-DD from AwakeTab vX.Y`. Generated client-side; nothing is uploaded. `sessions` is `daySessions[date]`. It is left empty for a day with no per-day count (days recorded before the M6 follow-ups), never filled with a guessed 0. The download is named `awaketab-stats-YYYY-MM-DD.csv`.

---

## 7. Privacy classification (feeds `/privacy`)

| Data | Where | Why | Leaves the device? |
|---|---|---|---|
| Settings, session, stats, onboarding | localStorage / chrome.storage | The product works offline and without an account | No |
| Licence token + random `deviceId` | localStorage / chrome.storage.local | Prove a Pro purchase; count activations (max 5) | Token only, to `/api/license/*` |
| Anonymous usage events | Analytics Engine, 90 days | Reliability (does the lock hold?) and product decisions | Yes — no IP stored, no ids beyond a per-tab random `sid`; toggle in Settings |
| Licence record | KV | Fulfil purchases, handle refunds, stop abuse | Held by us; purchase details are with Polar (merchant of record) |
| Ratings | KV → aggregate | Show a real rating in search results | Stars + optional text; no identity |
| Ad cookies (content pages only, with consent) | Google / network | Ads fund the free content pages | Governed by the CMP; never on the tool |

---

## 8. Test fixtures

`packages/core/test/fixtures/`: `settings.default.json`, `session.active-duration.json`, `session.until-tomorrow.json`, `stats.kolkata-midnight.json` (session crossing 00:00 IST), `stats.la-dst.json` (session across the DST change), `license.valid.json`, `license.expired.json`, `license.tampered.json`, `storage.private-mode.ts` (adapter that throws on `set`).
