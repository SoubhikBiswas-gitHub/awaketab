# 18 · Analytics and KPIs

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** What we measure, why, and how — with the exact events from `00-conventions.md` §10 and §13.4, the SQL that turns them into numbers, the targets from the blueprint, and the alert thresholds. Measurement is first-party, cookieless and anonymous by design, so this document is also a privacy contract.

Related docs: `08-data-storage.md` §5 (event storage) · `00-conventions.md` §10, §13.4 · `09-monetization-impl.md` §8 · `14-devops.md` §9 (alerting) · `06-content-seo-spec.md` §14 (tracked queries).

---

## 1. North-star metric

**Weekly awake-hours delivered** = sum of `awakeSeconds` across sessions ended in the week ÷ 3600 (from `session_end.durationMin`, counting only time in `held`/`fallback`).

Why this and not "completed sessions": a session that ends because the lock was lost delivered nothing; awake-hours counts only the outcome the user came for, scales with both reach and reliability, and is the number ads and Pro revenue ultimately follow. Guardrail pair: **autostart success rate** (reliability) and **return-visit rate** (whether people come back).

---

## 2. KPI tree

| Area | KPI | Definition | Source |
|---|---|---|---|
| Acquisition | Impressions, clicks, CTR by query cluster | Search Console, grouped by the 25 tracked queries × locales | GSC API weekly |
| | Indexed pages | Valid pages in GSC coverage | GSC |
| | Referring domains | Distinct linking domains | GSC links + Ahrefs free |
| | Brand searches | Queries containing "awaketab" | GSC |
| Activation | Session start rate | `session_start` ÷ `page_view` on tool routes | AE |
| | Autostart success | `lock_state` to `held` with `double1 ≤ 300` ÷ `session_start` with `blob6 = 'autostart'` | AE |
| Reliability | Lost/denied share | `session_end` where `blob6 ∈ {lost_timeout, denied}` ÷ all `session_end` | AE |
| | Fallback usage | `fallback_used` ÷ `session_start` | AE |
| | Denied by OS | `lock_denied` grouped by `blob3` (ua class) | AE |
| Engagement | Return-visit rate | Visits with `source` ≠ first-touch… — approximated as share of `page_view` with `blob4 = 'pwa'` or `ref = 'return'`? No: use **sessions per sid ≥ 2 within 7 days is impossible without ids** → use **PWA installs + bookmark/direct share** (GSC direct traffic proxy via Cloudflare referer analytics) and the **rating-prompt eligibility count** (`meta.sessionCount ≥ 5` reached, reported once as `rating_prompt {action:'eligible'}`) | Cloudflare + AE |
| | Median session length | median `session_end.durationMin` | AE |
| | Awake-hours per week | north star | AE |
| | PWA installs, PiP opens, shares | `pwa_install`, `pip_open`, `share_click` | AE |
| Monetization | Pro funnel | `pro_view` → `pro_checkout_click` → `pro_activated` | AE + Polar |
| | Conversion per 1k uniques | Polar orders ÷ (visits ÷ 1.6) × 1000 (estimate of uniques) | Polar + Cloudflare |
| | Content RPM | network revenue ÷ content pageviews × 1000 | ad network + AE `page_view` on content routes |
| | Sponsor CTR | `sponsor_click` ÷ `sponsor_view` | AE |
| | Embed adoption | distinct `blob6` hosts on `/embed/cook` `page_view` | AE |
| Trust | Rating distribution | `rating_submitted.double1` histogram; average shown publicly only at ≥ 25 | AE + KV |
| | Rating-prompt outcomes | `rating_prompt.blob6 ∈ {rated, later, never}` | AE |

Privacy note on "return visits": without a persistent identifier we cannot count returning users directly and we do not try. The proxies above (installs, direct traffic share, rating eligibility) are enough to steer the product.

---

## 3. Event → KPI mapping (canonical events only)

| Event | Fields used (AE columns) | Feeds |
|---|---|---|
| `page_view` | `blob1` path, `blob2` locale, `blob4` source | starts denominator, content pageviews, embed hosts (`blob6`) |
| `session_start` | `blob6` planType or `autostart`, `blob7` presetId, `blob4` source | activation, preset popularity |
| `session_end` | `blob6` reason, `double1` durationMin | reliability, session length, north star |
| `lock_state` | `blob6` from, `blob7` to, `double1` ms since DOMContentLoaded (only for the first `held`) | autostart success |
| `lock_denied` | `blob6` advice code, `blob3` ua class | denied by OS/advice |
| `fallback_used` | `blob3` | fallback share |
| `resume_shown` / `resume_accepted` | — | persistence value |
| `pwa_install`, `pip_open`, `share_click` | `blob7` variant | engagement |
| `session_extend` | `double1` addedMin | extend-prompt effectiveness |
| `pro_view`, `pro_checkout_click`, `pro_activated` | `blob6` plan | Pro funnel |
| `rating_prompt`, `rating_submitted` | `blob6` action, `double1` stars | trust |
| `ad_slot_loaded` | `blob6` page, `double1` count | ads coverage vs. pageviews |
| `sponsor_view`, `sponsor_click` | `blob7` sponsorId | sponsor CTR |
| `affiliate_click` | `blob6` page, `blob7` sku | affiliate |
| `client_error` | `blob6` code | quality |

---

## 4. Analytics Engine SQL (dataset `awaketab_events`)

Autostart success (7 days):

```sql
SELECT toStartOfDay(timestamp) AS day,
       countIf(index1 = 'lock_state' AND blob7 = 'held' AND double1 <= 300) / countIf(index1 = 'session_start' AND blob6 = 'autostart') AS autostart_success
FROM awaketab_events WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob4 IN ('web','pwa')
GROUP BY day ORDER BY day;
```

Reliability by browser class (30 days):

```sql
SELECT blob3 AS ua,
       countIf(index1='session_end' AND blob6 IN ('lost_timeout','denied')) / countIf(index1='session_end') AS bad_end_share,
       countIf(index1='fallback_used') AS fallback
FROM awaketab_events WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY ua ORDER BY bad_end_share DESC;
```

North star (weekly awake-hours):

```sql
SELECT toStartOfWeek(timestamp) AS week, sum(double1) / 60 AS awake_hours
FROM awaketab_events WHERE index1 = 'session_end' AND timestamp > NOW() - INTERVAL '12' WEEK
GROUP BY week ORDER BY week;
```

Pro funnel (30 days):

```sql
SELECT countIf(index1='pro_view') AS views, countIf(index1='pro_checkout_click') AS checkouts, countIf(index1='pro_activated') AS activated,
       activated / views AS view_to_active
FROM awaketab_events WHERE timestamp > NOW() - INTERVAL '30' DAY;
```

Content pageviews (for RPM):

```sql
SELECT count() AS content_pv FROM awaketab_events
WHERE index1='page_view' AND timestamp > NOW() - INTERVAL '30' DAY
  AND (blob1 LIKE '/for/%' OR blob1 LIKE '/on/%' OR blob1 LIKE '/vs/%' OR blob1 LIKE '/guides/%' OR blob1 LIKE '/learn/%'
       OR blob1 LIKE '/%/for/%' OR blob1 LIKE '/%/on/%' OR blob1 LIKE '/%/vs/%' OR blob1 LIKE '/%/guides/%' OR blob1 LIKE '/%/learn/%');
```

Preset popularity, extend usage, embed hosts and error codes follow the same pattern; the full notebook lives in `docs/metrics/queries.sql` (written by E8).

---

## 5. Search Console tracking list (English; per-locale equivalents in `07-i18n.md` §7)

Tool intent: keep screen awake · keep screen awake online · keep screen on · keep screen on website · prevent screen from sleeping · stop screen from sleeping · no sleep page · nosleep page alternative · screen always on website · keep my screen on

Use-case: keep screen on while cooking · keep screen on while reading · keep screen on during download · keep screen on while presenting · keep screen on for dashboard · keep tablet screen on sheet music · night clock keep screen on

Device: keep iphone screen on safari · keep android screen on chrome · keep ipad screen on · keep chromebook screen on · keep laptop screen on without changing settings

Alternative and developer: caffeine alternative online · amphetamine alternative no install · powertoys awake alternative · wake lock api demo · nosleep.js alternative

Weekly: position, impressions, clicks, CTR per query; flag any query with > 500 impressions and no dedicated page → content backlog.

---

## 6. Core Web Vitals monitoring

Weekly CrUX API pull (origin + the five route-class URLs) for LCP, INP, CLS p75 on mobile and desktop; PageSpeed Insights lab run on the same URLs; stored in `docs/metrics/cwv.csv` (PROPOSED path — accepted). Thresholds: LCP ≤ 2.0 s field, INP ≤ 100 ms target / 200 ms alert, CLS ≤ 0.1 alert (target 0).

---

## 7. Targets (from the blueprint; estimates)

| Horizon | Targets |
|---|---|
| Day 30 | 60 English URLs indexed; CWV green; extension in review; autostart success ≥ 95%; first Show HN done |
| Day 90 | Top 10 for "keep screen awake" and "keep screen awake online" in ≥ 3 locales; ≥ 20 referring domains; PWA installs visible daily; Pro live with ≥ 0.1% of monthly uniques converting |
| Day 180 | Top 3 → #1 for "keep screen awake" (EN); #1 on ≥ 15 long-tail queries; library ≥ 200 stars; brand searches visible; Pro conversion 0.2%+ |
| Month 6 revenue | Low ≈ $260 · Base ≈ $1,060 · High ≈ $3,850 per month |
| Month 12 revenue | Low ≈ $770 · Base ≈ $3,860 · High ≈ $12,960 per month |

---

## 8. Review cadence

**Weekly (30 min, Monday):** autostart success and denied share (fix first if red) → CWV → GSC queries and coverage → Pro funnel and revenue → content backlog decisions (pages to write/refresh) → one line in `docs/metrics/YYYY-MM.md`.

**Monthly (2 h):** full KPI tree; device-matrix spot checks if a browser major shipped; ad RPM vs. floor; pricing experiment review; update the blueprint's model with actuals; publish changelog summary.

---

## 9. Experiments (guardrails: autostart success, CLS, rating average)

| Hypothesis | Variant | Primary metric | Guardrail |
|---|---|---|---|
| $19 lifetime converts ≥ 1.4× $29 with higher total revenue | price shown on `/pro` (by week, not by user — no ids) | `pro_activated` per `pro_view`; revenue | refund rate ≤ 3% |
| Extend prompt defaulting to +30 min increases awake-hours without annoyance | `endBehaviour` default | awake-hours per session | `rating_prompt` "never" rate |
| Clock ambient mode as default for `/for/night-clock` increases session length | page-level default mode | median duration | CLS unchanged |
| Preset order p30-first vs pinf-first | chips order by week | session_start rate | lost/denied share |
| Showing the support matrix above FAQs increases install rate | home layout | `pwa_install` per `page_view` | LCP |

Experiments alternate by week (no user-level bucketing exists); results need ≥ 2 full weeks per arm.

---

## 10. Privacy constraints on measurement

- No cookies, no persistent identifiers, no IP storage (hash used for rate limiting only, salted, rotated quarterly).
- Paths without query strings; hostnames only for embeds; UA reduced to family + major + OS family.
- `client_error` sampled 10%; everything else 100% but capped at 20 events per batch.
- Retention 90 days in Analytics Engine; aggregates only in `docs/metrics/`.
- Users can turn telemetry off in Settings; the extension defaults to off.
- Nothing about ads or Pro purchases is joined to usage events; Polar holds purchase data as merchant of record.

---

## 11. Alert thresholds (wired in `14-devops.md` §9)

| Condition | Action |
|---|---|
| Autostart success < 90% for 3 h | Alert; check for a browser change; review `lock_denied` by ua |
| `lost_timeout` + `denied` > 5% of session ends (24 h) | Alert; check advice mapping and platform news |
| INP p75 > 200 ms or CLS > 0.1 on any route class | Open issue; if content routes → ads kill switch consideration |
| Pro activation errors > 2% of attempts (24 h) | Check Polar status, webhook backlog |
| `/api/*` 5xx > 1% (15 min) | Alert |
| `client_error` rate doubles week over week | Triage top codes |
