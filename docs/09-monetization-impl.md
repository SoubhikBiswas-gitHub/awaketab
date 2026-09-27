# 09 · Monetization implementation

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** This document turns the monetization decision in `awaketab-blueprint.md` §11 into code-level specifications: Polar.sh products and licence keys, the three licence endpoints and the webhook, the ES256 token, client-side feature gating, the ads placement contract and loader, the sponsor card, donations, affiliate cards, Business licences (Embed, Kiosk), and the metrics that decide when each layer turns on or off. Everything here is gated by G0–G5 from `00-conventions.md` §8.3; nothing in this doc ships before its gate.

**Related docs.** `00-conventions.md` (identifiers, plans, gates, budgets, ad rules) · `awaketab-blueprint.md` §11 (why) · `04-engine-spec.md` (lock states the sponsor card keys off) · `08-data-storage.md` (`at.v1.license` schema) · `13-testing-strategy.md` (test cases referenced below) · `14-devops.md` (secrets, KV namespaces, `_headers`, kill-switch delivery) · `17-launch-checklist.md`.

Identifiers not present in `00-conventions.md` are marked **PROPOSED** and collected in §9 at the end.

---

## 1. Principles that bind every section

| Rule | Source | Consequence in code |
|---|---|---|
| The awake screen, `/pip`, `/embed/*` and the extension never carry a Google ad | conventions §8.3 | `ads.ts` is imported only by the content layout; a build-time test fails if `AdSlot` appears anywhere else |
| No auto-refresh under AdSense; network-managed refresh (≥ 30 s, in-view) only from G3 | blueprint §11 | No refresh code exists in our bundle; refresh is a network dashboard setting |
| ≤ 3 ads in view, ads-to-content ≤ 20%, fixed slot sizes, scripts after LCP | conventions §8.3, §11 | `AdSlot.astro` reserves the box in static HTML; loader waits for LCP; `maxUnits` in `/config/ads.json` |
| Pro never gates the lock, presets, until-time, restore, PWA, languages | conventions §8.2 | `hasFeature()` is only consulted for the 13 gate IDs |
| No accounts, no PII | conventions §3, §10 | Licence = key + device id; token verified offline; `ref=` never stored |
| No dark patterns | blueprint §5 | One upsell surface per session; no countdowns, no fake scarcity, no nagging; free features never degrade |

---

## 2. Pro licensing end-to-end (G2)

### 2.1 Polar.sh setup

Polar.sh is the merchant of record (MoR): it charges the buyer, handles VAT/GST, issues receipts and invoices, generates licence keys, sends webhooks, and pays out to an Indian individual via Stripe Connect Express. We hold no card data and issue no invoices ourselves.

**Organization.** Slug `awaketab`, support email `support@awaketab.com`, website `https://awaketab.com`. Two environments: Polar **sandbox** (`sandbox.polar.sh`, API `sandbox-api.polar.sh`) for local and preview deployments, **production** for `awaketab.com`. One variable switches between them (as built, M9 F-06): `PUBLIC_POLAR_SERVER` (`sandbox` by default, `production` on the Production environment). The build reads it to pick `CHECKOUT_LINKS` and to decide whether the bundles trust the dev licence key (§2.4); the Pages Functions read the same variable at run time to pick the API base (`functions/_lib/polar.ts`, `POLAR_API_BASES`). Only the exact value `production` reaches production; a build with any value other than `sandbox` or `production` fails. `/api/health` reports `polar: "sandbox" | "production"`.

**Products.** One product per plan ID from conventions §8.1. Product `metadata.plan` carries our plan ID so dashboards and webhooks can be mapped without a lookup table.

| Plan ID (ours) | Polar product | Billing | Price | Benefit (License Keys) | Activation limit |
|---|---|---|---|---|---|
| `pro_yearly` | AwakeTab Pro (yearly) | recurring, yearly | $12 | `lk_pro_yearly` | 5 |
| `pro_lifetime` | AwakeTab Pro (lifetime) | one-time | $29 | `lk_pro_lifetime` | 5 |
| `biz_embed_site_yearly` | AwakeTab Embed licence | recurring, yearly | $29 | `lk_embed` | 1 (the domain) |
| `biz_kiosk_site` | AwakeTab Kiosk licence (1 site) | one-time | $19 | `lk_kiosk_site` | 1 |
| `biz_kiosk_5` | AwakeTab Kiosk licence (5 sites) | one-time | $49 | `lk_kiosk_5` | 5 |

Benefit names `lk_*` are **PROPOSED** labels for the Polar dashboard. One License Keys benefit per product (not one shared benefit) so that the validate response's `benefit_id` identifies the plan directly. Benefit settings: key prefix `AWAKETAB`, no usage limit, no TTL (Polar revokes the grant itself when a subscription ends or an order is refunded), activation limit as above. The `benefit_id → plan` mapping is the secret `POLAR_BENEFIT_MAP` (JSON, **PROPOSED**), e.g. `{"ben_01…":"pro_yearly", …}`.

**Launch discount.** Discount "Pro launch", fixed amount $10 off, restricted to the `pro_lifetime` product, `ends_at` = Pro launch date + 90 days, unlimited redemptions, code `LAUNCH19` (**PROPOSED**). It is pre-attached to the lifetime checkout link so buyers never type it; the `/pro` page shows `$29` struck through and `$19` while `Date.now() < PRO_LAUNCH_END` (build-time constant, **PROPOSED**). After 90 days the discount expires server-side even if a stale page is open.

**Checkout links.** One Polar Checkout Link per product (`https://buy.polar.sh/polar_cl_…`), each with success URL `https://awaketab.com/pro/activate?checkout_id={CHECKOUT_ID}` (Polar substitutes the placeholder). Business links use `/pro/activate?checkout_id={CHECKOUT_ID}&plan=embed|kiosk` so the activation page can show the domain / site form. Links live in `apps/web/src/lib/checkout.ts` (as built, M9): `CHECKOUT_LINKS_SANDBOX`, `CHECKOUT_LINKS_PRODUCTION`, and `CHECKOUT_LINKS = checkoutLinks(POLAR_SERVER)` picked at build time by `PUBLIC_POLAR_SERVER`. Only the `.astro` pages import it, so it adds no tool-page JS. The production links are **PROPOSED** placeholders (`https://buy.polar.sh/PROPOSED-REPLACE-…`) until the production products exist (`LAUNCH-AUDIT.md` N-04 step 4); a production build refuses to ship them (`scripts/check-keys.mts`).

`?ref=` on `/pro` is our attribution param (conventions §7). It is read once, emitted in `pro_view` and `pro_checkout_click {plan}` as `source`, and never forwarded to Polar or stored.

**Webhook endpoint.** `https://awaketab.com/api/webhooks/polar`, secret stored as `POLAR_WEBHOOK_SECRET`. Subscribed events: `order.created`, `order.paid`, `order.refunded`, `refund.created`, `refund.updated`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.uncanceled`, `subscription.revoked`, `benefit_grant.created`, `benefit_grant.updated`, `benefit_grant.revoked`. `benefit_grant.*` are required, not optional: they are the only events that name the licence key (by id), so without them key-less refunds and revocations fall back to the customer (§2.7, D-06).

**Organization access token.** `POLAR_ACCESS_TOKEN` with scopes `checkouts:read`, `orders:read`, `benefits:read`, `license_keys:read`, `license_keys:write`, `subscriptions:read`, `customer_portal:read`, `customer_portal:write`. `checkouts:read`, `orders:read`, `benefits:read` and `license_keys:read` are what checkout auto-fill needs (§2.3b); without `benefits:read` every auto-fill answers "still syncing" and buyers fall back to pasting the key. Rotation schedule is in `14-devops.md`.

Polar's API surface changes; pin `@polar-sh/sdk` (or the raw paths below) at implementation time and re-verify against docs.polar.sh. The paths used here are:

| Purpose | Polar endpoint |
|---|---|
| Validate a key | `POST /v1/customer-portal/license-keys/validate` `{ key, organization_id, activation_id? }` |
| Activate a device | `POST /v1/customer-portal/license-keys/activate` `{ key, organization_id, label, meta }` → activation `{ id, license_key: { id, customer_id, benefit_id, status, limit_activations, expires_at } }` |
| Deactivate a device | `POST /v1/customer-portal/license-keys/deactivate` `{ key, organization_id, activation_id }` → 204 |
| Subscription period end | `GET /v1/subscriptions?customer_id=&active=true` → `current_period_end` |
| Checkout auto-fill: the checkout | `GET /v1/checkouts/{id}` (`checkouts:get`, scope `checkouts:read`) → `status`, `customer_id`, `subscription_id`. Polar's `Checkout` has **no licence key and no order id** (§2.7.1), so the key takes the three reads below (§2.3b, F-08) |
| Checkout auto-fill: the order | `GET /v1/orders/?organization_id=&checkout_id=&limit=10` (`orders:list`, scope `orders:read`) → `ListResource_Order_`, `items[].id` (one-time purchases only) |
| Checkout auto-fill: the grant | `GET /v1/benefit-grants/?organization_id=&customer_id=&limit=100&sorting=-created_at` (`benefit-grants:list`, scope `benefits:read`) → `ListResource_BenefitGrant_`, `items[]` with `order_id`, `subscription_id`, `benefit_id`, `is_granted`, `properties.license_key_id` |
| Checkout auto-fill: the key | `GET /v1/license-keys/{id}` (`license_keys:get`, scope `license_keys:read`) → `LicenseKeyWithActivations`, `key` |

### 2.2 Purchase flow

1. `/pro` renders the price table (§2.11) and one button per plan. Click → `pro_checkout_click {plan}` → open the checkout link. Desktop: `window.open(url, 'awaketab-checkout', 'popup,width=520,height=760')`; if the popup is blocked (`window.open` returns `null`) or on mobile viewports (`< 768px`), same-tab `location.assign(url)`. COOP `same-origin-allow-popups` (see `14-devops.md`) keeps the opener relationship intact.
2. Polar shows the hosted checkout, collects tax by buyer location, charges, emails the receipt and the licence key, and shows the key on its confirmation page.
3. Polar redirects to `/pro/activate?checkout_id=…`. In popup mode the popup navigates there; the page detects `window.opener` and posts `{ type: 'awaketab:checkout-complete', checkoutId }` to the opener, then closes itself; the opener navigates to `/pro/activate?checkout_id=…`.
4. `/pro/activate` runs the activation flow (§2.3). With `checkout_id` present it first tries auto-fill: `POST /api/license/activate { checkoutId, deviceId, deviceLabel }` (field `checkoutId` is an alternative to `key`, **PROPOSED** addition to the request schema). The function reads the checkout from Polar, confirms `status === 'succeeded'`, finds the licence key of that purchase through its order or subscription and benefit grant (§2.3b), and activates it. Polar creates the order, grant and key a few seconds after the checkout succeeds; until then the function answers the retryable 503 `polar_unavailable`, and the page asks again after 3, 6 and 12 s (`CHECKOUT_RETRY_MS` in `src/lib/activate-page.ts`) while showing "Your purchase is still syncing". If auto-fill fails for any reason the page falls back to the paste field with copy "Your key is in the email from Polar and on the receipt page." The paste path is the contract; auto-fill is a convenience. With `ext=1` (the extension hand-off) the page never activates the browser: auto-fill uses the non-activating lookup of §2.3a instead, and a pasted key is only checked for shape client-side before the copy panel shows it. B7 (O-26): a successful activation stays on the page ("Pro is active" with next steps; after checkout also "Your purchase": plan, price, renewal date, devices and the key's last four characters from the lookup), never redirecting to `/`; an unknown, expired or failed checkout shows our "payment didn't go through" page and a purchase still syncing after every retry shows "Where is my licence key?" (`?checkout=cancelled|failed|help` opens those pages directly). `deviceLabel` is the readable UA class (`deviceLabel()` in `src/lib/pro-common.ts`, e.g. "Chrome · macOS"), and the Pro pages send analytics only while `at.v1.settings.telemetry` is not `false` (O-43).

```mermaid
sequenceDiagram
  autonumber
  participant U as User (browser)
  participant S as awaketab.com /pro, /pro/activate
  participant P as Polar (checkout, License Key API)
  participant F as POST /api/license/activate
  participant K as KV LICENSES
  U->>S: /pro?ref=footer → click "Pro yearly"
  S->>S: event pro_checkout_click {plan: pro_yearly}
  S->>P: open checkout link (popup or same tab)
  P-->>U: charge, receipt email with AWAKETAB-… key
  P->>S: redirect success_url /pro/activate?checkout_id=…
  U->>F: { checkoutId | key, deviceId, deviceLabel }
  F->>P: validate key (status granted? benefit_id → plan)
  F->>P: activate (label = deviceLabel, meta.deviceId)
  F->>P: subscriptions?customer_id (yearly only) → current_period_end
  F->>K: put lic:{keyHash} (merge activation), cus:{customerId}
  F-->>U: { token, plan, features, exp, activations }
  U->>U: verify token offline (public key ver), store at.v1.license
  U->>S: event pro_activated {plan}; unlock features
```

### 2.3 Activation flow (`POST /api/license/activate`)

Request `{ key, deviceId, deviceLabel }` (conventions §9) or `{ checkoutId, deviceId, deviceLabel }`. Response `{ token, plan, features, exp, activations }`.

Server steps:

1. Rate limit: 10 requests / minute / IP hash on `/api/license/*` (KV counter `rl:{route}:{ipHash}:{minuteBucket}`, TTL 120 s, **PROPOSED**). Optional Turnstile: when `TURNSTILE_SECRET_KEY` is set, require header `cf-turnstile-response` and verify it (see `14-devops.md`).
2. Validate the body with zod: `key` matches `/^[A-Z0-9-]{20,80}$/` after `trim().toUpperCase()`; `deviceId` is a UUID v4; `deviceLabel` ≤ 40 chars, stripped of control characters.
3. `keyHash = sha256Hex(key)`. Load `lic:{keyHash}`.
4. If a record exists with `status` `revoked` or `refunded` → 403 with that code. If the device is already in `activations` → refresh `lastSeenAt`, mint a token, return (no Polar call; this makes re-activation after a cleared localStorage idempotent).
5. Call Polar validate. 404 → `invalid_key`. Non-2xx → `polar_unavailable` (502). `status !== 'granted'` → `revoked`.
6. Map `benefit_id` → plan via `POLAR_BENEFIT_MAP`. Unknown → `invalid_key` (log it).
7. Activation limit: if `Object.keys(activations).length >= limit`, look for an activation with `lastSeenAt` older than 90 days; if found, deactivate it on Polar and drop it (silent eviction of an abandoned device is not a dark pattern; it is documented on `/pro/manage`). If none, → 409 `activation_limit` with the list of device labels so the client can offer `/pro/manage`.
8. Call Polar activate with `label = deviceLabel`, `meta = { deviceId }`. 403 from Polar → 409 `activation_limit`.
9. For `pro_yearly` and `biz_embed_site_yearly`, fetch `current_period_end` → `periodEnd`.
10. Write the merged record (§2.5), append `keyHash` to `cus:{customerId}`, and for embed licences write `embed:{domain}` (§7.1).
11. Mint the token (§2.4) and respond.

### 2.3a Checkout lookup without activation (as built, 2026-09-26)

`/pro/activate?ext=1` used to activate the key for the browser before showing the copy panel, so pasting it into the extension spent a second of the five activations. The page now never activates in `ext=1` mode, and a `checkout_id` there is resolved by a non-activating mode of the same function (no new route, so the CORS allow-list and route contract are unchanged):

Request `{ checkoutId, lookup: true }` → `200 { key, plan }`. Steps: rate limit (same `license` bucket, 10/min/IP hash) → `checkoutId` must match `^[A-Za-z0-9_-]{1,80}$` (else 400 `bad_request`, no Polar call) → the checkout's key, resolved exactly as on the activating path (§2.3b): unknown, `expired`, `failed` or not this purchase's key → 404 `invalid_key` (one answer for all of them); `open`, `confirmed`, or order / grant / key not created yet → 503 `polar_unavailable` with `Retry-After: 5` → KV `lic:{keyHash}` `revoked`/`refunded` → 403 with that code → Polar validate (read-only): not granted → 403 `revoked`; benefit not in `POLAR_BENEFIT_MAP` → 404 `invalid_key` → respond. No `deviceId` is read, nothing is written to KV (other than the rate-limit counter) and Polar activate is never called. `Cache-Control: no-store`.

Why returning the key is acceptable: the checkout ID already authorises activating that key through the activating path (up to the five-device limit), and Polar shows the same key on its receipt page and in the receipt email, so returning it to the holder of the checkout ID grants nothing new. Checkout IDs are Polar UUIDs (not enumerable at 10 requests per minute), the success URL is only known to the buyer, and `Referrer-Policy: strict-origin-when-cross-origin` keeps the query string out of cross-origin referrers.

Client: `lookupCheckoutKey()` and `normaliseLicenseKey()` in `apps/web/src/lib/license-lookup.ts`; `activate-page.ts` calls the lookup only when `ext=1` and `checkout_id` are both present, and never calls `activateLicense()` in `ext=1` mode. Tests: `functions/api/license/activate.test.ts` (lookup block), `test/lib/activate-page.test.ts`, `test/lib/license-revalidate.test.ts`, e2e `tool.spec.ts` ("pro activate with ext=1 …", asserting no activate request).

### 2.3b Checkout → licence key (as built, F-08, 2026-09-26)

Polar's `Checkout` has no licence key and no order id, so `functions/_lib/checkout-key.ts` `resolveCheckoutKey()` reaches the key in up to four reads with the organisation token. Both `{ checkoutId }` activation and `{ checkoutId, lookup: true }` use it, then continue exactly as the key path does (KV `revoked`/`refunded` → 403, Polar validate, benefit → plan, and for activation the device activation). Every endpoint, filter and field below was checked against `https://polar.sh/docs/openapi/2026-10.openapi.json` on 2026-09-26 (operation ids in brackets):

| Step | Request | What we read | Outcome |
|---|---|---|---|
| 1 | `GET /v1/checkouts/{id}` [`checkouts:get`, scope `checkouts:read`; 404 `ResourceNotFound`, 422 `HTTPValidationError` for a non-UUID] | `Checkout.status` (`CheckoutStatus`: `open`, `expired`, `confirmed`, `succeeded`, `failed`), `customer_id`, `subscription_id` (both nullable) | 404 / 422 / `expired` / `failed` / anything unknown → 404 `invalid_key`. `open` / `confirmed` → 503 syncing. `succeeded` without `customer_id` → 503 syncing |
| 2 | one-time purchase (`subscription_id` null) only: `GET /v1/orders/?organization_id=…&checkout_id=…&limit=10` [`orders:list`, scope `orders:read`; query `checkout_id` "Filter by checkout ID", uuid4] | `items[]` (`Order`): `id`, `checkout_id`, `customer_id` | Orders whose `checkout_id` and `customer_id` match the checkout. None → 503 syncing |
| 3 | `GET /v1/benefit-grants/?organization_id=…&customer_id=…&limit=100&sorting=-created_at` [`benefit-grants:list`, scope `benefits:read`; `limit` max 100; `BenefitGrantSortProperty` has `-created_at`] | `items[]` (`BenefitGrant`): `id`, `customer_id`, `benefit_id`, `order_id`, `subscription_id`, `is_granted`, `is_revoked`, `granted_at`, `created_at`, `properties.license_key_id` (`BenefitGrantLicenseKeysProperties`, optional) | Keep grants of the same customer with a `license_key_id` that belong to **this** purchase: `subscription_id` equals the checkout's, or (one-time) `order_id` is one of step 2's orders. None → 503 syncing (grant not created yet, or created before its key). Of those, only benefits in `POLAR_BENEFIT_MAP`; none → 404. Several → a live grant (`is_granted && !is_revoked`) before a revoked one, then the newest (`granted_at`, else `created_at`) |
| 4 | `GET /v1/license-keys/{license_key_id}` [`license_keys:get`, scope `license_keys:read`; 404 `ResourceNotFound`] | `LicenseKeyWithActivations`: `id`, `key`, `customer_id`, `benefit_id` | 404 → 503 syncing. `id`, `customer_id` or `benefit_id` different from the grant's → 404. `key` is `trim().toUpperCase()`d and must match `^[A-Z0-9-]{20,80}$`, else 404 |

Design notes:

- **No other purchase's key.** The grant is chosen by this checkout's subscription or order, never by "newest grant of the customer", so a buyer with an older yearly key who buys lifetime gets the lifetime key, and the reverse. The `is_granted` filter is deliberately not sent: a purchase refunded or revoked before auto-fill must answer `revoked` / `refunded` (step 4's key then goes through KV and Polar validate), not "still syncing" forever.
- **Why the orders read.** Polar's `Order` has `checkout_id` and `orders:list` filters by it, so a one-time purchase maps to its order without guessing by customer and time. A subscription checkout already names its subscription, and the subscription's grant carries `subscription_id`, so it needs no order read.
- **Retryable syncing.** `syncing()` in `functions/_lib/http.ts`: HTTP 503, body `{ "error": "polar_unavailable" }` (the existing code, shown by `/pro/activate` as `license.info.syncing`), `Retry-After: 5` (`SYNCING_RETRY_S`), `Cache-Control: no-store`. A real outage (network error, 5xx, or a missing token scope such as `benefits:read`) is still 502 `polar_unavailable`.
- **Uniform errors, no enumeration.** Unknown, expired, failed and foreign checkouts all answer the same 404 body; the licence key is only ever returned to the holder of the checkout ID, as before (§2.3a). The rate limit (10 / min / IP hash, `license` bucket) is checked before any Polar call and is unchanged; one request costs at most four Polar reads plus validate.
- **Ids for webhooks (D-06).** On activation the resolved `grantId`, the one-time `orderId` and the `subscriptionId` are stored on `lic:` and `lk:` straight away, so key-less webhooks match before any `benefit_grant.*` event arrives.
- **Page 1 only.** Step 3 reads one page of 100 grants, newest first. A customer would need more than 100 benefit grants in the organisation for the purchase's grant to fall off that page; it then answers "still syncing" and the buyer pastes the key.

Tests: `functions/api/license/activate.test.ts` "checkout auto-fill resolves the key through order → benefit grant → licence key (F-08)" (one-time and subscription paths with the exact Polar calls and filters, `open` / `confirmed` / order missing / grant missing / grant without key id → 503 then success on retry, several purchases by one customer, another customer's grant on the same order id, a revoked and a re-granted grant, revoked and refunded keys, 5xx part-way through), plus the existing checkout and lookup blocks, now against a `FakePolar` whose checkout has no key (`addCheckout()`, `orders`, `GET /v1/benefit-grants/`, `GET /v1/license-keys/{id}` in `test/functions/harness.ts`); `test/lib/activate-page.test.ts` (auto-fill retries). Live check: `LAUNCH-AUDIT.md` N-04 step 7 (f).

### 2.4 Token

JWT, `alg: ES256`, header `{ alg, typ: 'JWT', kid: String(ver) }`, claims exactly `{ sub, plan, features, dev, iat, exp, ver }` (conventions §9):

| Claim | Value |
|---|---|
| `sub` | `keyHash` (SHA-256 hex of the normalized key; the raw key never appears in the token) |
| `plan` | plan ID |
| `features` | the gate IDs for that plan (§2.9) |
| `dev` | `deviceId` |
| `iat` | now, seconds |
| `exp` | see table |
| `ver` | signing key version (integer, starts at 1); selects the public key in `@awaketab/core` |

| Plan | `exp` | Client re-validates (when online) | After `exp` offline |
|---|---|---|---|
| `pro_yearly` | `periodEnd + 7 d` | every 7 days, and immediately when `exp − now < 14 d` | features off, key kept, "Reconnect to re-validate" |
| `pro_lifetime` | `now + 90 d` | every 30 days, and immediately when `exp − now < 30 d` | same |
| `biz_kiosk_site` / `biz_kiosk_5` | `now + 365 d` (**PROPOSED**; kiosks are often offline) | every 30 days | same |
| `biz_embed_site_yearly` | no client token; `GET /api/embed/config` reads KV | n/a | attribution returns |

If `periodEnd` is unknown (Polar lookup failed) the yearly token gets `now + 30 d` and the next validation fixes it.

```ts
// apps/web/functions/_lib/jwt.ts  (PROPOSED path: functions/_lib/ is not a route)
export type PlanId = 'pro_yearly' | 'pro_lifetime' | 'biz_embed_site_yearly' | 'biz_kiosk_site' | 'biz_kiosk_5';
export type FeatureId =
  | 'ambient.packs' | 'ambient.message' | 'ambient.logo' | 'schedules' | 'sounds.custom'
  | 'stats.history' | 'stats.export' | 'pip.pro' | 'ext.autostart' | 'ext.schedules'
  | 'ads.free' | 'embed.noattrib' | 'kiosk.branding';

export interface LicenseClaims {
  sub: string; plan: PlanId; features: FeatureId[]; dev: string; iat: number; exp: number; ver: number;
}

const enc = new TextEncoder();
const b64u = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uJson = (o: unknown) => b64u(enc.encode(JSON.stringify(o)));

export async function signES256(claims: LicenseClaims, privateJwk: JsonWebKey): Promise<string> {
  const key = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const header = b64uJson({ alg: 'ES256', typ: 'JWT', kid: String(claims.ver) });
  const payload = b64uJson(claims);
  // WebCrypto ECDSA returns the raw 64-byte r||s signature, which is exactly the JWS ES256 encoding (no DER).
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${payload}`));
  return `${header}.${payload}.${b64u(sig)}`;
}
```

The private key is the secret `LICENSE_SIGNING_KEY` (JWK JSON, **PROPOSED**) and its version `LICENSE_SIGNING_VER` (**PROPOSED**). Public keys ship in `@awaketab/core` as `LICENSE_PUBLIC_KEYS: Record<number, JsonWebKey>` (**PROPOSED**); rotation is in `14-devops.md` §10.

**Production never trusts the dev key (as built, M9, `LAUNCH-AUDIT.md` N-03).** The dev pair (`ver` 1) has its private half committed in `apps/web/.dev.vars.example`, so anyone could sign a Pro token with it. `LICENSE_PUBLIC_KEYS` is `PRODUCTION_LICENSE_PUBLIC_KEYS` plus the dev key only when the bundler defines `__AT_LICENSE_DEV_KEY__` as true: dev, test and `PUBLIC_POLAR_SERVER=sandbox` builds. Web, embed and extension bundles built with `PUBLIC_POLAR_SERVER=production` contain no trace of it. `scripts/check-keys.mts` fails a production build that has no production key, lists the dev key, or ships its coordinates anywhere in the output. `pnpm keys:prod` prints a fresh pair (next `ver`, 2 for the first) without writing it to disk: the public JWK goes into `PRODUCTION_LICENSE_PUBLIC_KEYS`, the private JWK into the `LICENSE_SIGNING_KEY` secret, the `ver` into `LICENSE_SIGNING_VER` (steps in `14-devops.md` §10).

Offline verification (`@awaketab/core/license.ts`, shared by web and extension):

```ts
export type VerifyResult =
  | { ok: true; claims: LicenseClaims }
  | { ok: false; reason: 'malformed' | 'unknown_ver' | 'bad_signature' | 'expired' | 'future_iat' };

export async function verifyLicenseToken(
  token: string,
  opts: { now?: number; keys?: Record<number, JsonWebKey>; skewMs?: number; allowExpired?: boolean } = {},
): Promise<VerifyResult> {
  const { now = Date.now(), keys = LICENSE_PUBLIC_KEYS, skewMs = 5 * 60_000, allowExpired = false } = opts;
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  let header: { alg: string; kid: string }, claims: LicenseClaims;
  try { header = JSON.parse(b64uDecodeText(parts[0])); claims = JSON.parse(b64uDecodeText(parts[1])); }
  catch { return { ok: false, reason: 'malformed' }; }
  if (header.alg !== 'ES256' || typeof claims.ver !== 'number') return { ok: false, reason: 'malformed' };
  const jwk = keys[claims.ver];
  if (!jwk) return { ok: false, reason: 'unknown_ver' };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' }, key, b64uDecodeBytes(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return { ok: false, reason: 'bad_signature' };
  if (claims.iat * 1000 > now + skewMs) return { ok: false, reason: 'future_iat' };
  if (!allowExpired && claims.exp * 1000 < now) return { ok: false, reason: 'expired' };
  return { ok: true, claims };
}
```

### 2.5 KV schemas (namespace `LICENSES`)

```ts
// lic:{keyHash}
interface ILicenseRecord {
  v: 1;
  plan: PlanId;
  status: 'active' | 'canceled' | 'revoked' | 'refunded';   // canceled = still valid until periodEnd
  keyEnc: string;              // AES-256-GCM(key) with LICENSE_KEY_ENC_KEY, base64url iv||ciphertext (PROPOSED)
  polar: { licenseKeyId: string; benefitId: string; customerId: string; orderId?: string; subscriptionId?: string };
  periodEnd: number | null;    // epoch ms; subscriptions only
  limit: number;               // 5 | 1
  activations: Record<string /* deviceId */, {
    label: string; polarActivationId: string; createdAt: number; lastSeenAt: number;
  }>;
  createdAt: number; updatedAt: number;
}
// cus:{customerId}  → string[]            keyHashes for webhook fan-out              (PROPOSED)
// wh:{eventId}      → { at: number }       idempotency, expirationTtl 30 days          (PROPOSED)
// ord:{orderId}     → { plan, amountCents, currency, customerId, at }  reporting only  (PROPOSED)
// embed:{domain}    → { keyHash, attribution: false, theme: { accent, scheme }, expiresAt }  (PROPOSED)
// rl:{route}:{ipHash}:{bucket} → count, expirationTtl 120 s                            (PROPOSED)
```

**As built (D-06, 2026-09-26).** The record is flat, not the `polar: {…}` object above: `lic:{keyHash}` carries `polarOrderId`, `customerId` and the optional `polarLicenseKeyId`, `polarSubscriptionId`, `polarGrantId`, `benefitId`, and the Polar ids are indexed in `lk:{polarLicenseKeyId}`, `grant:{benefitGrantId}`, `sub:{subscriptionId}` and `ord:{orderId}.lks`. The schemas and TTLs are in `08-data-storage.md` §4; how the webhook uses them is §2.7.

`keyEnc` exists because Polar's deactivate call needs the raw key and we do not want the raw key in the token or in `at.v1.license`. `LICENSE_KEY_ENC_KEY` is a 32-byte base64 secret (**PROPOSED**).

### 2.6 Client storage and cadence

`at.v1.license` = `{ token, plan, exp, features[], lastValidatedAt, deviceId }` (conventions §6). `deviceId` is generated (`crypto.randomUUID()`) the first time `/pro/activate` is opened and reused forever. `deviceLabel` defaults to the UA class ("Chrome · Windows") and is editable.

`license.ts` (web) and the extension background both run `maybeRevalidate()` on start-up and once per hour while open:

```ts
export async function maybeRevalidate(): Promise<void> {
  const lic = readLicense();                      // at.v1.license or null
  if (!lic || !navigator.onLine) return;
  const now = Date.now();
  const due = lic.plan === 'pro_yearly'
    ? now - lic.lastValidatedAt > 7 * DAY || lic.exp - now < 14 * DAY
    : now - lic.lastValidatedAt > 30 * DAY || lic.exp - now < 30 * DAY;
  if (!due) return;
  const res = await fetch('/api/license/validate', { method: 'POST', body: JSON.stringify({ token: lic.token }) });
  if (res.status >= 500 || res.type === 'error') return;          // offline / API down: keep going until exp
  const body = await res.json();
  if (body.revoked) { clearLicense(); toast(t('pro.revoked')); return; }
  const v = await verifyLicenseToken(body.token);
  if (v.ok) writeLicense({ ...lic, token: body.token, exp: v.claims.exp * 1000, features: v.claims.features, lastValidatedAt: now });
}
```

`POST /api/license/validate` verifies the presented token with `allowExpired: true` (up to 30 days past `exp`, so a returning user is refreshed without re-entering the key), loads `lic:{sub}`, checks that `dev` is still an activation, checks `status`, calls Polar validate with the stored `polarActivationId`, updates `lastSeenAt`, and returns `{ token, plan, features, exp, activations }` or `{ revoked: true, reason }`. If Polar is unreachable the KV record is authoritative and the response is minted from it (logged as `polar_unavailable`). Adding `activations` to the validate response is **PROPOSED** (conventions §9 lists only the token).

### 2.7 Revocation via webhooks (`POST /api/webhooks/polar`)

Polar signs webhooks per the Standard Webhooks spec: headers `webhook-id`, `webhook-timestamp`, `webhook-signature` (`v1,<base64 HMAC-SHA256>` of `${id}.${timestamp}.${rawBody}`). Polar's SDK base64-encodes the plain secret you typed before handing it to the Standard Webhooks verifier, which decodes it back, so the HMAC key is the raw UTF-8 bytes of `POLAR_WEBHOOK_SECRET`. Using `validateEvent` from `@polar-sh/sdk/webhooks` is acceptable if the dependency is pinned; the raw version is:

```ts
// apps/web/functions/api/webhooks/polar.ts
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const raw = await request.text();
  const id = request.headers.get('webhook-id'), ts = request.headers.get('webhook-timestamp'), sigHeader = request.headers.get('webhook-signature');
  if (!id || !ts || !sigHeader) return new Response('missing headers', { status: 400 });
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return new Response('stale', { status: 400 });

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.POLAR_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${raw}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  const ok = sigHeader.split(' ').some((s) => { const [v, sig] = s.split(','); return v === 'v1' && timingSafeEqual(sig, expected); });
  if (!ok) return new Response('bad signature', { status: 401 });

  if (await env.LICENSES.get(`wh:${id}`)) return new Response('duplicate', { status: 200 });   // idempotent
  const evt = JSON.parse(raw) as PolarEvent;
  await handle(evt, env);                                                                    // table below
  await env.LICENSES.put(`wh:${id}`, JSON.stringify({ at: Date.now() }), { expirationTtl: 30 * 86400 });
  return new Response('ok', { status: 200 });
};
```

As built (D-06, 2026-09-26; `functions/api/webhooks/polar.ts`, `functions/_lib/links.ts`):

| Polar event | Handler action |
|---|---|
| `order.created`, `order.paid` | merge `ord:{orderId}` = `{ plan, amountCents, currency, customerId, at }` (plan from `metadata.plan` or `product.metadata.plan`; `amountCents` = `net_amount`), keeping its `lks` |
| `benefit_grant.created`, `benefit_grant.updated`, `benefit_grant.revoked` | **link**: `lk:{properties.license_key_id}` gains the grant, order, subscription, customer and benefit ids; write `grant:{id}`, `sub:{subscription_id}`, `ord:{order_id}.lks`; copy the ids onto every `lic:` the link already names |
| `subscription.canceled` | `status = 'canceled'` (features continue until `periodEnd + 7 d`) |
| `subscription.uncanceled` | `status = 'active'`, only from `canceled` |
| `subscription.revoked`, `benefit_grant.revoked` | `status = 'revoked'` |
| `order.refunded` | `status = 'refunded'`, unless `data.status === 'partially_refunded'` (policy §2.11: a refund ends the licence; a partial refund is a credit) |
| `refund.created`, `refund.updated` | `status = 'refunded'` when `status === 'succeeded'` and `revoke_benefits` is true (`refund.created` fires "regardless of status") |
| `subscription.created`, `.active`, `.updated`, anything else | 200, no change |

**Finding the licence (D-06).** Production payloads never carry the key (§2.7.1), so each status change is resolved in this order, and the first step that finds anything wins:

1. `data.license_key.key` → `lic:{sha256(key)}` (tests and any key-bearing payload);
2. the licence-key id (`properties.license_key_id`) → `lk:{id}`;
3. the grant id → `grant:{id}` → `lk:`;
4. the subscription id (`data.id` on `subscription.*`, `subscription_id` elsewhere) → `sub:{id}` → `lk:`;
5. the order id (`data.id` on `order.*`, `order_id` on `refund.*`) → `ord:{id}.lks` → `lk:`;
6. the customer id → every `lic:` in `cus:{customerId}` that fits: a record holding the same kind of id as the event must hold the same value, and if any record matches an id exactly only exact matches count. Otherwise (records without ids, written before D-06) the plan must fit the event (`subscription.*` and orders with a `subscription_id` → `pro_yearly` / `biz_embed_site_yearly`; orders with `subscription_id: null` → one-time plans) and the record's `benefitId` must be among the event's benefits. All that fit are changed: a customer can hold several licences. A raw key that matches no licence never falls back to the customer.

`lk:{id}` names the key hashes of every activation of that Polar licence key. If it names none yet (the grant arrived, nobody activated), the change waits in `lk:{id}.pending` (`revoked`/`refunded` never replaced by `canceled`/`active`), the customer's pre-D-06 records are tried as in step 6, and activation applies it: a `revoked`/`refunded` pending status answers 403 with that code before Polar activate is called, a `canceled` one activates as `canceled`, and the pending value is then cleared because `lic:` is authoritative. Unknown ids resolve to nothing: 200, no licence write. `revoked` and `refunded` stay terminal, whichever order the events arrive in; `wh:{webhook-id}` is still written last, so a failed delivery is re-run and a replay is not.

**Activation side.** `POST /api/license/activate` stores `polarLicenseKeyId` (validate `id`), `benefitId`, `customerId` and, on the checkout path, `polarSubscriptionId` (checkout `subscription_id`) on `lic:`, merges any ids a grant already linked in `lk:`, and writes `lk:{id}` with the key hash. Before D-06 it stored the licence-key id in `polarOrderId`; a re-activation clears that value, and the customer fallback ignores `polarOrderId` on records without `polarLicenseKeyId`.

**Records written before D-06 (backfill).** They keep working through the key path and the customer fallback, and are linked for good the next time any device on the key activates (validate response → `polarLicenseKeyId`, `lk:`). Only sandbox or preview data can predate D-06 (production was not live), so there is no backfill script: if one is ever needed, list `lic:*`, decrypt `keyEnc`, call Polar validate for each key and write the fields and `lk:` as activation does (`pnpm kv:reencrypt` is the pattern for a dry-run-first KV script).

Limits to know: KV writes are last-writer-wins, so two webhooks for the same subscription landing at the same moment can drop one index entry (the ids also sit on `lic:`, which the customer fallback matches exactly). Polar key rotation keeps the licence-key id and changes the key; the new key's first activation adds its hash to `lk:`, so revocation reaches both records.

Any 5xx from us makes Polar retry with backoff; the idempotency key makes retries safe. Because Polar also flips the key's own `status` to `revoked`, the periodic client validate would catch revocation even if the webhook were lost; the webhook is the fast path and what powers `/pro/manage`.

```mermaid
sequenceDiagram
  autonumber
  participant P as Polar
  participant W as POST /api/webhooks/polar
  participant K as KV LICENSES
  participant C as Client (web or extension)
  participant V as POST /api/license/validate
  P->>W: subscription.revoked + webhook-id/-timestamp/-signature
  W->>W: HMAC-SHA256 with POLAR_WEBHOOK_SECRET; reject |skew| > 300 s
  W->>K: get wh:{eventId} — present? return 200
  W->>K: sub:{subscriptionId} → lk:{licenceKeyId} → each lic:{keyHash}.status = revoked (else cus:{customerId}, §2.7)
  W->>K: put wh:{eventId} (TTL 30 d)
  W-->>P: 200
  Note over C: next cadence tick (≤ 7 d yearly)
  C->>V: { token }
  V->>K: lic:{sub}.status = revoked
  V-->>C: { revoked: true, reason: 'revoked' }
  C->>C: clearLicense(); toast; features off
```

### 2.7.1 Polar event payloads (verified 2026-09-26)

Read from Polar's published OpenAPI specs, which the docs' webhook pages render: `https://polar.sh/docs/openapi/2026-04.openapi.json` and `https://polar.sh/docs/openapi/2026-10.openapi.json` (the two API versions listed in `https://polar.sh/docs/llms.txt`). For every schema below the two versions are identical, except that `LicenseKeyRead` / `ValidatedLicenseKey` gain `member_id` and `member` in 2026-10. `docs.polar.sh/…` URLs now 301-redirect to `polar.sh/docs/…`; every page cited here was reachable. `https://api.polar.sh/openapi.json` answers 404.

Every webhook body is `{ type, timestamp, api_version, data }`; there is no top-level event id, so the `webhook-id` header stays the idempotency key.

| Events | `data` schema | Ids in `data` | Licence key? |
|---|---|---|---|
| `order.created`, `order.paid`, `order.updated`, `order.refunded` ([order.refunded](https://polar.sh/docs/api-reference/webhooks/order.refunded)) | `Order` | `id` (order), `customer_id`, `product_id`, `subscription_id` (null for one-time purchases), `checkout_id`, `discount_id`; also `status` (`paid`, `refunded`, `partially_refunded`, …), `billing_reason` (`purchase`, `subscription_create`, `subscription_cycle`, …), nested `customer`, `product` (`OrderProduct`: `metadata`, **no** `benefits`), `subscription` | No |
| `refund.created`, `refund.updated` | `Refund` | `id` (refund), `order_id`, `subscription_id` (nullable), `customer_id`, `organization_id`; also `status` (`pending`, `succeeded`, `failed`, `canceled`), `amount`, `revoke_benefits` | No |
| `subscription.created`, `.updated`, `.active`, `.canceled`, `.uncanceled`, `.revoked` (and `.cycled`, `.past_due`, `.paused`, `.resumed`, `.migrated`) | `Subscription` | `id` (subscription), `customer_id`, `product_id`, `checkout_id`, `discount_id`; nested `product` (`Product`, with `benefits[].id`) | No |
| `benefit_grant.created`, `.updated`, `.revoked` (and `.cycled`) | `BenefitGrantLicenseKeysWebhook` (for a License Keys benefit) | `id` (benefit grant), `benefit_id`, `customer_id`, `subscription_id` (nullable), `order_id` (nullable), `member_id`; `properties.license_key_id`, `properties.display_key`, `properties.user_provided_key` (all optional), `previous_properties` | **No**: only the licence-key id and a masked `display_key` |
| `POST /v1/customer-portal/license-keys/validate` → 200 | `ValidatedLicenseKey` | `id` (licence key), `customer_id`, `benefit_id`, `organization_id`, optional `activation` | echoes `key`; no order or subscription id |
| `POST /v1/customer-portal/license-keys/activate` → 200 | `LicenseKeyActivationCreated` | `id` (activation), `license_key_id`, `license_key` (`GrantedLicenseKey`, same ids as validate) | echoes `key` |
| `GET /v1/checkouts/{id}` → 200 | `Checkout` | `id`, `customer_id`, `subscription_id`, `product_id`, `discount_id` | **No** (and no order id): the key is reached through `GET /v1/orders/?checkout_id=`, `GET /v1/benefit-grants/` and `GET /v1/license-keys/{id}` (§2.3b, `LAUNCH-AUDIT.md` F-08, fixed) |
| `GET /v1/license-keys/{id}` → 200 | `LicenseKeyWithActivations` | `id` (licence key), `customer_id`, `benefit_id`, `organization_id`, `activations[]` | **Yes**, `key`: the one organisation read that returns it |

So no production webhook carries the key, and the benefit grant is the only event that joins a licence-key id to its order or subscription. The activate and validate responses give the licence-key, customer and benefit ids, never the order or subscription.

Behaviour from the prose docs that the handler relies on:

- **Cancellation** ([events](https://polar.sh/docs/integrate/webhooks/events)): end-of-period cancel sends `subscription.updated` + `subscription.canceled` at once (status still `active`, `cancel_at_period_end: true`), then `subscription.updated` + `subscription.revoked` at period end, when "benefits are revoked". Immediate revocation sends `updated`, `canceled`, `revoked` together. `subscription.uncanceled` undoes a pending cancel.
- **Refunds** ([refunds](https://polar.sh/docs/features/refunds)): `order.refunded` is "sent when an order is fully or partially refunded"; `refund.created` is sent "regardless of status". For one-time purchases, revoking benefits is selected by default on a full refund and can be switched off. "You can't revoke access by refunding an order tied to a subscription"; access ends when the subscription is revoked. Polar may refund within 60 days on its own to head off a chargeback, cancelling the subscription and revoking benefits.
- **Licence keys** ([license keys](https://polar.sh/docs/features/benefits/license-keys)): keys are revoked automatically when a subscription is cancelled. Rotation "generates a new key string on the same license key record"; the old key stops validating and activations are kept.
- **Pause** ([events](https://polar.sh/docs/integrate/webhooks/events)): when a scheduled pause takes effect, "benefits are revoked until the subscription resumes". AwakeTab products do not offer pausing; if they ever do, `benefit_grant.revoked` would end the licence for good under the terminal-status rule.

Not answerable from the docs; check with a sandbox purchase + refund (`LAUNCH-AUDIT.md` N-04 step 6):

- whether `benefit_grant.created` already carries `properties.license_key_id`, or only a later `benefit_grant.updated` does (the handler links on both);
- whether a subscription's grant has `order_id` set or null (both work);
- whether a full refund of a one-time order with "revoke benefits" sends `benefit_grant.revoked` as well (any one of the three events is enough);
- the delivery order of `order.*`, `benefit_grant.*` and the buyer's activation (any order works; see §2.7).
- for checkout auto-fill (§2.3b, N-04 step 7 (f)): whether Polar redirects to the success URL at `confirmed` or only at `succeeded`, and how many seconds pass before the order, the benefit grant and its `license_key_id` exist (the page retries for about 21 s).

### 2.8 Deactivation and `/pro/manage`

`POST /api/license/deactivate { token, deviceId }`: verify token (`allowExpired: true`), load `lic:{sub}`, require `activations[deviceId]` to exist, decrypt `keyEnc`, call Polar deactivate with that activation's `polarActivationId`, delete the entry, save, return `{ ok: true, activations }`. A device may deactivate itself or any other device on the same key (the token proves possession of the key).

`/pro/manage` (no account, works from any activated device): on load calls validate → shows a table of `label`, `lastSeenAt` (relative), "this device" marker, and a Remove button per row; below: "Devices unused for 90 days are removed automatically when you activate a new one." Also: plan, renewal/expiry date, "Manage billing / receipts" (link to Polar customer portal), "Deactivate this device", and the refund policy line.

### 2.9 Feature gating in code

`@awaketab/core` owns the plan → features table and the gate check:

```ts
export const PLAN_FEATURES: Record<PlanId, FeatureId[]> = {
  pro_yearly:   ['ambient.packs', 'ambient.message', 'ambient.logo', 'schedules', 'sounds.custom', 'stats.history', 'stats.export', 'pip.pro', 'ext.autostart', 'ext.schedules', 'ads.free'],
  pro_lifetime: ['ambient.packs', 'ambient.message', 'ambient.logo', 'schedules', 'sounds.custom', 'stats.history', 'stats.export', 'pip.pro', 'ext.autostart', 'ext.schedules', 'ads.free'],
  biz_embed_site_yearly: ['embed.noattrib'],
  biz_kiosk_site: ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
  biz_kiosk_5:    ['kiosk.branding', 'ambient.message', 'ambient.logo', 'ads.free'],
};

let cache: { token: string; claims: LicenseClaims } | null = null;

/** Synchronous gate check; call `await loadLicense()` once at boot to prime the cache. */
export function hasFeature(id: FeatureId, now = Date.now()): boolean {
  return !!cache && cache.claims.exp * 1000 > now && cache.claims.features.includes(id);
}

export async function loadLicense(): Promise<void> {
  const lic = readLicense();
  if (!lic) { cache = null; return; }
  if (cache?.token === lic.token) return;
  const v = await verifyLicenseToken(lic.token);
  cache = v.ok ? { token: lic.token, claims: v.claims } : null;
}
```

The token's `features` array is the source of truth in the client; `PLAN_FEATURES` lives only on the server (`functions/_lib/license.ts`), which mints tokens from it.

UI affordances (all in the island, `apps/web/src/tool/ui/pro.ts`):

- A locked feature shows a small "Pro" badge (`i18n: pro.badge`) on the control; the control stays visible and focusable. Activating it opens the **Pro sheet**: a bottom sheet listing what Pro includes, the price (§2.11), a "Get Pro" link to `/pro?ref=sheet-<feature>`, and "Already have a key?" → `/pro/activate`. Close on `Esc`, backdrop, or the close button.
- One upsell surface per session: the end-of-session extend prompt may include one line "Pro adds schedules and custom chimes" with a link. Nothing else nags. No countdowns, no fake scarcity, no interstitials, no pre-ticked options, no "are you sure you want to stay free" copy.
- Free features never degrade when a licence expires; only gated features turn off, and a single toast explains why with a link to `/pro/manage`.

### 2.10 Error UX

| Code (API) | HTTP | Copy on `/pro/activate` (i18n key) | Recovery |
|---|---|---|---|
| `invalid_key` | 404 | "That key wasn't recognised. Check for typos — keys start with AWAKETAB-." (`pro.err.invalid`) | Re-enter; link to "Where is my key?" |
| `activation_limit` | 409 | "This key is already active on 5 devices." + device labels (`pro.err.limit`) | Button → `/pro/manage` to remove one |
| `revoked` / `refunded` | 403 | "This licence is no longer active." (`pro.err.revoked`) | Link to support and to `/pro` |
| `polar_unavailable` | 502 | "Our licence service is taking a break. Try again in a minute." (`pro.err.unavailable`) | Retry button; nothing is stored |
| `polar_unavailable` (syncing, as built F-08) | 503 + `Retry-After: 5` | "Your purchase is still syncing. Retry in a minute." (`license.info.syncing`, the same copy as the 502) | A paid checkout whose order, grant or key Polar has not created yet (§2.3b). `/pro/activate` auto-fill retries after 3, 6 and 12 s; nothing is stored |
| `rate_limited` | 429 | "Too many attempts. Wait a minute." (`pro.err.rate`) | Retry after 60 s (`Retry-After`) |
| `bad_token` | 401 | "This device needs to re-activate." (`pro.err.token`) | Paste key again |
| offline (client) | — | "You're offline. Pro keeps working until {date}; we'll re-check when you're back." (`pro.err.offline`) | Nothing to do |
| clock skew (client, `future_iat`) | — | "Your device clock looks wrong ({delta}). Fix the time to use Pro." (`pro.err.clock`) | Free features unaffected |

The i18n keys above are **PROPOSED** (`pro.*` group).

### 2.11 Pricing display, refunds, receipts, tax

- Prices are defined in USD in `PLAN_PRICES` (**PROPOSED**, `apps/web/src/lib/license.ts`) and displayed as USD with the note "Charged in USD; taxes added at checkout where applicable." If Polar presents a localized currency at checkout, that is Polar's display; the site never hardcodes converted prices. The lifetime launch price rule is in §2.1.
- Refund policy text (on `/pro`, `/pro/manage`, `/terms`): "14-day refund, no questions asked. Email support@awaketab.com with your receipt or use the Polar customer portal. Refunds deactivate the licence key."
- Receipts and invoices: Polar emails them and hosts the customer portal; `/pro/manage` links to it. We never issue invoices.
- VAT/GST: Polar, as MoR, is the seller of record and remits consumption taxes globally. Our income is Polar's payout, an export of services from India.

### 2.12 Extension reuse of the same key

v1: the extension's options page has a "Licence key" field that calls the same `POST /api/license/activate` with its own `deviceId` (stored in `chrome.storage.local`) and label "AwakeTab for Chrome · {OS}". This counts as one of the 5 activations; the options page says so. Token verification uses the same `@awaketab/core` code. v1.1 (**PROPOSED**): optional host permission for `https://awaketab.com/*`; `/pro/activate` posts `{ type: 'awaketab:license', token }` via `window.postMessage`, a content script relays it to `chrome.storage.local`, and the extension shares the website's activation.

### 2.13 India admin notes (from the blueprint; confirm with a CA)

- Polar payouts arrive through Stripe Connect Express to an Indian bank account. Exports of services are zero-rated under GST but require GST registration and a **LUT** (Letter of Undertaking) filed before invoicing/receiving; keep Polar and AdSense payout statements as remittance proof because INR credits often carry no FIRA.
- Ask the CA about Section 44ADA presumptive taxation and the inward-remittance purpose code the bank should record.
- AdSense pays in USD by wire/EFT at the $100 threshold; Buy Me a Coffee and GitHub Sponsors both pay to India.
- Sole proprietorship + GST registration later unlocks Stripe India / Razorpay international if a second rail is ever needed.

### 2.14 Test cases (detailed in `13-testing-strategy.md` §8)

| ID | Case | Expected |
|---|---|---|
| LIC-01 | activate with unknown key | 404 `invalid_key`, no KV write |
| LIC-02 | activate, then activate same device again | second call returns a token without calling Polar |
| LIC-03 | 6th device on a Pro key, all seen within 90 d | 409 `activation_limit` with 5 labels |
| LIC-04 | 6th device, one stale > 90 d | stale evicted on Polar, new device activated |
| LIC-05 | yearly token `exp` | `periodEnd + 7 d` |
| LIC-06 | lifetime token `exp` | `iat + 90 d` |
| LIC-07 | validate with expired-but-signed token < 30 d past `exp` | fresh token |
| LIC-08 | validate after `subscription.revoked` webhook | `{ revoked: true }` |
| LIC-09 | webhook with bad signature / stale timestamp | 401 / 400, no KV write |
| LIC-10 | webhook replay (same `webhook-id`) | 200, handler not re-run |
| LIC-11 | `order.refunded` | keys with that `orderId` → `refunded`; activate → 403 |
| LIC-12 | deactivate other device with valid token | Polar deactivate called; entry removed |
| LIC-13 | token verify: tampered payload / wrong key / unknown `ver` / `iat` 10 min ahead | `bad_signature` / `bad_signature` / `unknown_ver` / `future_iat` |
| LIC-14 | `hasFeature('ambient.packs')` with expired cache | `false`; `hasFeature('ads.free')` same |
| LIC-15 | rate limit: 11th activate in 60 s | 429 with `Retry-After` |
| LIC-16 | activate / lookup by `checkoutId` (F-08, §2.3b) | `succeeded` → the key of that checkout's order or subscription; `open` / `confirmed` / grant not yet created → 503 `polar_unavailable` + `Retry-After`; unknown / `expired` / `failed` → 404 `invalid_key`; never another purchase's key |

---

## 3. Ads implementation (G1 → G4)

### 3.1 Placement contract

Restating conventions §8.3 as implementable checks:

| Contract | Enforcement |
|---|---|
| Content pages only: `/for/*`, `/on/*`, `/vs/*`, `/guides/*`, `/learn/*` | `AdSlot.astro` may only be rendered by `ContentLayout.astro`; test `ads-placement.test.ts` greps `src/pages` and `src/components` |
| Never on `/`, presets, `/until/*`, `/pip`, `/embed/*`, `/pro*`, the extension | Tool layout has no `ads.ts` import; CSP on tool routes has no Google hosts (see `14-devops.md`), so a mistake fails loudly |
| ≤ 3 ads in view | max 3 `AdSlot` per page; `maxUnits` in remote config can lower it |
| Ads-to-content ≤ 20% | 1 unit per ≥ 300 words, computed at build from MDX word count: < 600 words → 1 unit; 600–899 → 2; ≥ 900 → 3 |
| Fixed slot sizes, CLS 0 | box dimensions in static HTML; a box is never removed after first paint |
| Load after LCP | `PerformanceObserver` LCP entry + `requestIdleCallback` (timeout 3 s) |
| No refresh under AdSense | no refresh code exists; network refresh is enabled only in the network's dashboard from G3 |
| No vignettes / interstitials | AdSense Auto ads: all formats off except the mobile anchor |

### 3.2 `AdSlot.astro`

```astro
---
// apps/web/src/components/AdSlot.astro  (PROPOSED component)
interface Props {
  size: '300x250' | '336x280' | '728x90' | '320x100' | '300x600';
  position: 'top' | 'inline-1' | 'inline-2' | 'sidebar' | 'bottom';
  page: string;            // content slug, emitted in ad_slot_loaded {page}
  lazy?: boolean;          // default true; 'top' is eager
}
const { size, position, page, lazy = position !== 'top' } = Astro.props;
const [w, h] = size.split('x').map(Number);
---
<div class="ad-slot" data-size={size} data-position={position} data-page={page} data-lazy={lazy}
     style={`width:${w}px;height:${h}px`} aria-label="Advertisement">
  <ins class="adsbygoogle" style={`display:inline-block;width:${w}px;height:${h}px`}></ins>
  <div class="ad-slot__house" hidden><!-- Pro house card, shown when unfilled or maxUnits reached --></div>
</div>
```

`data-ad-client` and `data-ad-slot` are set at runtime by `ads.ts` from `AD_UNITS` (**PROPOSED**, `Record<position, slotId>`), so the network can be swapped without touching templates. On viewports narrower than the slot, CSS swaps the reserved size to the mobile size declared in a `data-size-sm` attribute (the box size is still known before paint).

### 3.3 `ads.ts` loader (`apps/web/src/lib/ads.ts`)

Order of operations:

1. Build flag `ADS_ENABLED` (from `import.meta.env.PUBLIC_ADS_ENABLED === '1'`, **PROPOSED** env var) — when false the content layout does not even include the module. Preview deployments set it to `0`.
2. Head snippet (≤ 300 bytes, inline, content layout only): if `localStorage['at.v1.license']` parses and its `features` includes `'ads.free'`, add `html.ads-free`. CSS collapses `.ad-slot` before first paint (no CLS). This is a cheap unverified check; spoofing it only hides ads.
3. `ads.ts` runs after `DOMContentLoaded`: `await loadLicense(); if (hasFeature('ads.free')) return;`
4. Wait for LCP: resolve on the first `largest-contentful-paint` entry after `load`, then `requestIdleCallback(cb, { timeout: 3000 })`.
5. `fetch('/config/ads.json')` (same-origin, `max-age=300`). If `!enabled` → stop. Respect `maxUnits`: slots beyond the limit show the house card.
6. Load the CMP (Google Privacy & messaging, the certified CMP formerly Funding Choices) from `https://fundingchoicesmessages.google.com/i/pub-XXXX?ers=1`. Register `__tcfapi('addEventListener', 2, cb)`; proceed when `gdprApplies === false`, or `eventStatus` is `tcloaded` / `useractioncomplete`. No consent signal in EEA/UK → no ad script at all; slots show the house card.
7. Inject `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX` (`async`, `crossorigin="anonymous"`).
8. Fill: `top` immediately; others via `IntersectionObserver` with `rootMargin: '200px 0px'`; `(window.adsbygoogle ||= []).push({})` per slot.
9. A `MutationObserver` watches `data-ad-status` on each `ins`: `filled` → emit `ad_slot_loaded {page}`; `unfilled` → reveal the house card (box unchanged).
10. Footer link "Manage consent" calls `googlefc.showRevocationMessage()`.

```ts
// apps/web/src/lib/ads.ts (skeleton)
import { hasFeature, loadLicense } from '@awaketab/core';
import { track } from './analytics';

interface AdsConfig { enabled: boolean; maxUnits: 1 | 2 | 3; network: 'adsense' | 'journey' | 'raptive'; updatedAt: string }

const afterLcp = () => new Promise<void>((resolve) => {
  let seen = false;
  const po = new PerformanceObserver(() => { seen = true; });
  po.observe({ type: 'largest-contentful-paint', buffered: true });
  addEventListener('load', () => (window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1)))(() => { po.disconnect(); resolve(); }, { timeout: 3000 }), { once: true });
  setTimeout(() => { if (!seen) resolve(); }, 6000); // never wait forever
});

export async function initAds(): Promise<void> {
  await loadLicense();
  if (hasFeature('ads.free')) return;
  await afterLcp();
  const cfg = await fetch('/config/ads.json').then((r) => r.json() as Promise<AdsConfig>).catch(() => null);
  if (!cfg?.enabled) return;
  const slots = [...document.querySelectorAll<HTMLElement>('.ad-slot')];
  slots.slice(cfg.maxUnits).forEach(showHouseCard);
  const consent = await waitForConsent();          // loads CMP; resolves true when ads may load
  if (!consent) { slots.forEach(showHouseCard); return; }
  await loadNetwork(cfg.network);                    // adsense | journey | raptive
  slots.slice(0, cfg.maxUnits).forEach((el) => (el.dataset.lazy === 'false' ? fill(el) : lazyFill(el)));
}

function fill(el: HTMLElement): void {
  const ins = el.querySelector<HTMLElement>('ins.adsbygoogle')!;
  ins.dataset.adClient = AD_CLIENT; ins.dataset.adSlot = AD_UNITS[el.dataset.position as keyof typeof AD_UNITS];
  new MutationObserver((_, mo) => {
    if (ins.dataset.adStatus === 'filled') { track('ad_slot_loaded', { page: el.dataset.page! }); mo.disconnect(); }
    if (ins.dataset.adStatus === 'unfilled') { showHouseCard(el); mo.disconnect(); }
  }).observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
  ((window as any).adsbygoogle ||= []).push({});
}
```

`ads.txt` lives at `apps/web/public/ads.txt` with `google.com, pub-XXXX, DIRECT, f08c47fec0942fa0` under AdSense. Journey and Raptive each supply a hosted `ads.txt`; switch to a `_redirects` rule `/ads.txt https://<network-hosted-url> 301` at that point (see `14-devops.md`).

### 3.4 Network migration checklist

| Gate | Network | Prerequisites | Code changes |
|---|---|---|---|
| G1 | Google AdSense | 60 EN content pages indexed; `/about`, `/privacy`, `/terms` live; site ≥ a few weeks old; original content (AdSense rejects "low value content" tool sites — apply only after content is live); payee = Soubhik, India, USD wire/EFT | `PUBLIC_ADS_ENABLED=1` on production; `ads.txt`; CMP configured in AdSense Privacy & messaging; content-route CSP with Google hosts; `AD_UNITS` filled |
| G3 | Journey by Mediavine | 1,000 Tier-1 sessions / 30 d; domain ≥ 4 months; Grow script installed (`grow.me`, their identity/consent layer); GA4 read access for traffic verification. **Decision needed:** GA4 on content pages only, consent-gated, after LCP — a documented exception to "no third-party analytics", or ask Journey whether Cloudflare analytics suffice | `network: 'journey'` in `/config/ads.json`; `loadNetwork('journey')` injects Grow + the Mediavine script (`scriptwrapper.com`) with `data-noptimize="1" data-cfasync="false"`; remove `adsbygoogle`; `ads.txt` redirect; CSP host list from their integration doc; network-managed in-view refresh enabled in their dashboard (≥ 30 s); content pages only is guaranteed by the layout split |
| G4 | Raptive (or stay Mediavine) | 25k pv/mo; ≥ 50% Tier-1 (check monthly in Cloudflare zone analytics by country; locales may pull it under 50%); long-form majority; GA access | `network: 'raptive'`; their script replaces ours; same invariants; `ads.txt` redirect to their manager |

Each migration is a PR that changes `loadNetwork`, `_headers` CSP, `ads.txt` handling, and `/privacy`; it runs the content-page Lighthouse budget before merge.

### 3.5 CWV guardrails and kill switch

`/config/ads.json` (**PROPOSED** file, `apps/web/public/config/ads.json`, served with `Cache-Control: public, max-age=300`):

```json
{ "enabled": true, "maxUnits": 3, "network": "adsense", "updatedAt": "2026-10-01T00:00:00Z", "note": "" }
```

- Manual kill: set `enabled: false`, push; live within 5 minutes plus deploy time (~1 min). Existing pages keep their boxes with house cards; nothing shifts.
- Auto-disable rule: the weekly CrUX job (`crux-weekly.yml`, `14-devops.md`) queries the origin's content-page group; if INP p75 > 200 ms or CLS p75 > 0.1 it sets `maxUnits: 1` and opens a PR labelled `ads-guardrail` with the numbers. It never raises the value back; that is a manual decision after a fix.
- Lab guard: Lighthouse CI on preview for one `/for` and one `/guides` page must keep Performance ≥ 90 with ads enabled in the preview run (`PUBLIC_ADS_ENABLED=1` and a test `AD_CLIENT`); the tool routes keep ≥ 95 from conventions §11.

### 3.6 Policy compliance checklist (review before each network application and quarterly)

- [ ] Out of context ads: no Google ad on any surface where attention is elsewhere — awake screen, `/pip`, `/embed/*`, extension, `/until/*`, preset pages. Verified by the placement test and by manual click-through.
- [ ] Screens without publisher content: every page with an ad has ≥ 600 words of original content above the fold or immediately after; `/404`, `/pro/*`, `/changelog` carry no ads.
- [ ] More ads than content: ratio rule in §3.1; no sticky sidebars taller than content.
- [ ] Invalid traffic: no incentives to click, no ads near controls (≥ 24 px from any button), no "click here" copy; the tool's own buttons never overlap a slot; traffic from the extension or PWA shortcuts lands on tool routes (no ads).
- [ ] Consent: CMP live in EEA/UK/CH; "Manage consent" in the footer; `/privacy` lists the ad vendors.
- [ ] `ads.txt` current; publisher ID matches.
- [ ] No auto-refresh under AdSense; refresh declared with the network after G3.
- [ ] "No ads on the awake screen" published on `/about` and `/privacy` (blueprint guardrail).

### 3.7 Consent and privacy text (for `/privacy`, EN source)

"AwakeTab's tool pages load no third-party scripts and show no ads. Our articles (pages under /for, /on, /vs, /guides and /learn) show advertisements from Google AdSense [or: Journey by Mediavine / Raptive]. Ad vendors may set cookies and process your IP address and browsing information to show and measure ads. If you are in the EEA, the UK or Switzerland we ask for your consent first through a certified consent management platform, and you can change your choice any time via 'Manage consent' in the footer. AwakeTab Pro removes ads on all pages. We never show ads on the awake screen, in Picture-in-Picture, in embeds or in the browser extension."

---

## 4. Sponsor card (G5)

`SponsorCard.astro` (**PROPOSED** component) renders a fixed-size card (320×72 mobile, 360×80 desktop) reserved in the awake-screen layout when the build flag `PUBLIC_SPONSOR_ENABLED` (**PROPOSED**) is `1`. Content comes from `/config/sponsor.json` (**PROPOSED** file, 5-minute cache):

```json
{
  "active": {
    "id": "acme-2027-03",
    "name": "Acme Tablet Stands",
    "logo": "/sponsors/acme.svg",
    "url": "https://acme.example/?utm_source=awaketab&utm_medium=sponsor",
    "tagline": "The stand we use in our own kitchen tests.",
    "startsAt": "2027-03-01T00:00:00Z",
    "endsAt": "2027-03-31T23:59:59Z"
  }
}
```

Rules:

- Placement: awake screen only in lock states `idle` and `held`, plus the extend prompt at timer end. Not in `requesting`, `lost`, `denied`, `unsupported`, `fallback` (those states carry the status message and its fix). Hidden in ambient modes `night` and `minimal` by design (stated in the rate card). Never on `/pip`, `/embed/*`, the extension, or content pages.
- One sponsor at a time; if `active` is `null` or `now` is outside `[startsAt, endsAt]` the reserved box collapses only before first paint (the head snippet reads a cached copy from the previous load) — otherwise it shows the house card.
- Disclosure label "Sponsored" (`i18n: sponsor.label`) always visible inside the card; link is `<a rel="sponsored noopener" target="_blank">`.
- Logo is self-hosted under `/sponsors/`; no sponsor script, pixel or iframe, ever (0 third-party requests on tool pages).
- Events: `sponsor_view` once per page load when the card is rendered and `document.visibilityState === 'visible'`; `sponsor_click` on click. Both carry `sponsorId` (**PROPOSED** field).
- Fetching the JSON happens after LCP via `requestIdleCallback`; the box is reserved before paint so CLS stays 0.

Rate card (fixed fee, monthly, invoiced through Polar as a one-time product `sponsor_month`, **PROPOSED**):

| Traffic tier (visits / month) | Monthly fee | Included |
|---|---|---|
| 100k–249k | $300 | card on awake screen + extend prompt, all locales, monthly report (`sponsor_view`, `sponsor_click`) |
| 250k–499k | $600 | same |
| ≥ 500k | $1,000 | same + one mention on `/about` "Supported by" |

Acceptable categories: tablet/phone stands and mounts, e-readers and tablets, kitchen and cooking products, sheet-music and reading tools, developer tools and hosting, productivity software, monitors and desk hardware. Never: mouse jigglers, "stay online"/presence-faking tools, gambling, crypto, VPN "unblockers", anything conflicting with the trust claim. The sponsor is named on `/about` while active.

---

## 5. Donations (G0)

- Buy Me a Coffee: plain link `https://buymeacoffee.com/awaketab` (handle to confirm) with `rel="noopener"`, no BMC widget script (it is a third-party script). Placement: site footer ("Support AwakeTab") and a paragraph on `/about`.
- GitHub Sponsors: `.github/FUNDING.yml` in the monorepo and a badge in `packages/wake/README.md`; the `/library` page links to it.
- No donation prompts inside the tool, no popups, no "tip jar" on the awake screen. Track clicks with `share_click`? No — donations use a plain outbound link; the BMC dashboard is the source of truth. Expected yield is noise (0.02–0.05% of visitors); this exists for goodwill.

---

## 6. Affiliate cards (G1)

`AffiliateCard.astro` (**PROPOSED** component) appears once per page on `/for/cooking`, `/on/ipad`, `/for/sheet-music` (and later other `/for` pages where a physical product genuinely helps), placed after the second content section, never above the fold and never adjacent to an `AdSlot`.

```astro
---
interface Props {
  sku: string;                 // internal id, e.g. 'stand-kitchen-01'
  title: string; blurb: string; image: string;   // image self-hosted under /affiliates/
  amazonIn: string;            // https://www.amazon.in/dp/ASIN?tag=awaketab-21
  geniuslink?: string;         // https://geni.us/xxxx for non-IN geos (routes to local storefront)
}
---
```

- Link handling: default href = `geniuslink` when present (Geniuslink routes IN visitors to `amazon.in` with our Associates India tag and other geos to their local storefront with the corresponding tag where an Associates account exists); otherwise `amazonIn`. All links `rel="sponsored nofollow noopener" target="_blank"`.
- Disclosure text directly under the card: "As an Amazon Associate, AwakeTab earns from qualifying purchases. This does not affect the price you pay." (`i18n: affiliate.disclosure`), and a one-line disclosure in `/privacy`.
- Event `affiliate_click {page, sku}` (**PROPOSED** event) on click; revenue itself is read from the Associates and Geniuslink dashboards.
- Editorial rule: only products Soubhik has used or tested in the device matrix; the card says which test it appeared in.

---

## 7. Business licences (G5 push; available from G2)

### 7.1 Embed licence (`biz_embed_site_yearly`)

The Cook Mode widget is free with attribution; the licence removes attribution and unlocks brand colours (`embed.noattrib`).

- Purchase via `/embed` → Polar checkout link → `/pro/activate?checkout_id=…&plan=embed`, which shows a domain field instead of a device label.
- Activation reuses `POST /api/license/activate` with `deviceId = 'domain:' + registrableDomain` and `deviceLabel = registrableDomain`, plus an optional `embed: { accent: '#RRGGBB', scheme: 'auto' | 'light' | 'dark' }` object (**PROPOSED** request field). The server normalizes to the registrable domain (eTLD+1 via a bundled public-suffix list), so `www.`, `staging.` and any subdomain are covered — this is the "1 domain (+ staging subdomain)" rule. The activation label on Polar is the domain; limit 1.
- The server writes `embed:{domain}` = `{ keyHash, attribution: false, theme, expiresAt: periodEnd + 7 d }`.
- `GET /api/embed/config?domain=` returns `{ licensed, attribution, theme, expiresAt }` from `embed:{domain}`; unknown domain → `{ licensed: false, attribution: true, theme: null, expiresAt: null }`. Cached publicly 5 minutes. The iframe app at `/embed/cook` determines its host from `location.ancestorOrigins[0]` (Chromium/Safari) or `document.referrer` (Firefox) and calls this endpoint; if neither is available it shows attribution.
- Webhook revocation deletes `embed:{domain}` (attribution returns within 5 minutes).

### 7.2 Kiosk licence (`biz_kiosk_site`, `biz_kiosk_5`)

A kiosk licence unlocks `kiosk.branding`, `ambient.message`, `ambient.logo` and `ads.free` (no ads exist on the tool anyway; the gate documents intent) and grants the commercial right to deploy on N sites. Free users already have `?autostart=1`, `mode=`, `msg=` (≤ 80 chars) and `theme=`; the licence adds custom logo (`logo=` URL param, https only, **PROPOSED** query param), removal of the AwakeTab wordmark and all rating/upsell prompts, and priority support.

Unlock paths:

1. **URL hash** (kiosk browsers configure a start URL, often offline): `https://awaketab.com/?autostart=1&mode=message&msg=Welcome&theme=dark#lic=<token>`. On load the island reads `location.hash`, verifies the token offline (`verifyLicenseToken`), stores it into `at.v1.license` if valid, then strips the hash with `history.replaceState`. The hash never reaches the server or the `page_view` path. `#lic=` is **PROPOSED**.
2. **Settings**: paste the key at `/pro/activate` like Pro; `deviceId` per kiosk device, label = site name. `biz_kiosk_5` is one key with activation limit 5.

The token for kiosk plans is minted once at activation via `/pro/activate` (the operator does this on their own machine), copied from `/pro/manage` ("Kiosk URL builder" shows the full URL with `#lic=`), and has `exp = now + 365 d`. Tokens embedded in URLs re-validate silently when the device is online.

### 7.3 Price table and sales pages

| Product | Price | Term | What it unlocks | Sales page |
|---|---|---|---|---|
| `biz_embed_site_yearly` | $29 / year per site | 12 months | `embed.noattrib`, brand colours, usage stats email (later) | `/embed` |
| `biz_kiosk_site` | $19 one-time | perpetual | `kiosk.branding`, logo, message, no prompts, 1 site | `/kiosk` |
| `biz_kiosk_5` | $49 one-time | perpetual | same, 5 sites | `/kiosk` |

`/embed` shows the live widget, the `<iframe allow="screen-wake-lock">` snippet, the attribution vs licensed comparison, and the checkout button. `/kiosk` shows the URL builder (free params), the licensed extras, and a screenshot of a branded kiosk. Both pages carry no ads and link to `/terms` for the licence terms (per-site definition: one registrable domain for Embed; one physical installation for Kiosk).

---

## 8. Metrics and reporting

### 8.1 Revenue KPIs (weekly)

| KPI | Definition | Source |
|---|---|---|
| Uniques, visits, content pageview share | conventions §10 events | Analytics Engine SQL (`14-devops.md` §7) |
| Pro conversion | `pro_activated` (first activation per key) ÷ monthly uniques | AE + Polar |
| Pro funnel | `pro_view` → `pro_checkout_click` → Polar orders → `pro_activated` | AE + Polar |
| Net Pro revenue | Polar payouts (after 5% + 50¢) | Polar |
| Refund rate | refunds ÷ orders, 30 d | Polar |
| Content RPM | ad revenue ÷ content pageviews × 1000 | AdSense/network + AE |
| Fill and viewability | network dashboard | network |
| Sponsor | `sponsor_view`, `sponsor_click`, CTR | AE |
| Business | embed/kiosk orders and active `embed:*` keys | Polar + KV backup |
| Donations | BMC + GitHub Sponsors dashboards | external |
| CWV on content pages | INP/CLS p75 | CrUX weekly job |

### 8.2 Reference targets (estimates from the blueprint model; not commitments)

| Scenario | Month 6 | Month 12 |
|---|---|---|
| Low | 25k visits ≈ $260 (ads 51 · Pro 150) | 60k ≈ $770 (ads 136 · Pro 480) |
| Base | 50k ≈ $1,060 (ads 136 · Pro 750) | 120k ≈ $3,860 (ads 546 · Pro 2,400 · sponsor 400 · business 250) |
| High | 100k ≈ $3,850 | 250k ≈ $12,960 (ads 1,706 · Pro 8,750 · sponsor 1,000) |

Assumptions: 1.3 pv/visit, 35% content pageviews, 1.6 visits/unique, Pro 0.06–0.35% of monthly uniques × $16 net, donations 0.02–0.04% of visits × $4.50.

### 8.3 Weekly review checklist (Monday, 30 minutes)

- [ ] Run the KPI SQL notebook; paste numbers into the month's row in `docs/metrics/YYYY-MM.md` (**PROPOSED** location).
- [ ] Pro conversion vs bands (§8.4); refund rate < 5%.
- [ ] Content RPM and fill; unfilled share < 15%.
- [ ] CrUX job output: INP/CLS on content pages; any `ads-guardrail` PR open?
- [ ] AdSense Policy Center: zero notices.
- [ ] Polar webhook delivery log: zero failed deliveries; if any, replay (`14-devops.md` §8).
- [ ] KV backup succeeded; licence count vs Polar order count reconciles (±2).
- [ ] Sponsor (G5+): impressions on track for the monthly report.
- [ ] Decide: any gate reached (G1–G5)? Any kill switch triggered?

### 8.4 Kill switches and repricing rules

| Signal | Threshold | Action |
|---|---|---|
| Pro conversion | < 0.05% of uniques after 60 days on sale | lifetime to $19 permanently, make one ambient pack free, re-test 30 days |
| Pro conversion | > 0.4% of uniques | lifetime to $39; keep yearly at $12 |
| Content RPM | < $3 after 90 days | drop to 1–2 units (`maxUnits`), prioritise the Journey application |
| CrUX INP p75 | > 200 ms on content pages | `maxUnits: 1` until fixed (auto PR) |
| CrUX CLS p75 | > 0.1 on content pages | same |
| AdSense policy notice | any | remove the flagged unit within 24 h, fix, request review; never argue placement on the awake screen |
| Sponsor CTR | < 0.1% for 2 months | change creative or category; do not add a second card |
| Licence API error rate | > 1% for 1 h | see incident playbook; users are covered by offline grace |

---

## 9. Identifiers introduced in this document (PROPOSED — add to `00-conventions.md`)

| Kind | Identifier | Where |
|---|---|---|
| Polar labels | benefits `lk_pro_yearly`, `lk_pro_lifetime`, `lk_embed`, `lk_kiosk_site`, `lk_kiosk_5`; discount code `LAUNCH19`; product `sponsor_month` | §2.1, §4 |
| Secrets / env | `POLAR_BENEFIT_MAP`, `POLAR_ORGANIZATION_ID`, `LICENSE_SIGNING_KEY`, `LICENSE_SIGNING_VER`, `LICENSE_KEY_ENC_KEY`, `TURNSTILE_SECRET_KEY`, `PUBLIC_POLAR_SERVER`, `PUBLIC_ADS_ENABLED`, `PUBLIC_SPONSOR_ENABLED` | §2, §3, §4 |
| KV keys | `lic:{keyHash}`, `cus:{customerId}`, `wh:{eventId}`, `ord:{orderId}`, `embed:{domain}`, `rl:{route}:{ipHash}:{bucket}`; D-06 (accepted, `00-conventions.md` §13.15): `lk:{polarLicenseKeyId}`, `grant:{benefitGrantId}`, `sub:{subscriptionId}` | §2.5, §2.7 |
| Code constants | `CHECKOUT_LINKS`, `PLAN_PRICES`, `PLAN_FEATURES`, `PRO_LAUNCH_END`, `LICENSE_PUBLIC_KEYS`, `AD_UNITS`, `AD_CLIENT` (build flag `PUBLIC_ADS_ENABLED`) | §2, §3 |
| API additions | `checkoutId` and `embed{}` fields on activate; `activations` in validate response; error codes `invalid_key`, `activation_limit`, `revoked`, `refunded`, `polar_unavailable`, `rate_limited`, `bad_token`, `bad_request` | §2.3, §2.6, §2.10 |
| Files / paths | `functions/_lib/`, `/config/ads.json`, `/config/sponsor.json`, `/sponsors/*`, `/affiliates/*`, `docs/metrics/` | §2.4, §3.5, §4, §6, §8.3 |
| Components | `AdSlot.astro`, `SponsorCard.astro`, `AffiliateCard.astro`, `ContentLayout.astro` | §3, §4, §6 |
| Events / fields | `affiliate_click {page, sku}`; `sponsorId` on `sponsor_view` / `sponsor_click` | §4, §6 |
| Query / hash params | `#lic=`, `logo=` | §7.2 |
| i18n groups | `pro.*`, `sponsor.label`, `affiliate.disclosure` | §2.10, §4, §6 |
| Token rule | kiosk plans `exp = now + 365 d` | §2.4 |
