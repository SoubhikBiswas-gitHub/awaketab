# SEO and content marketing audit

Status: research input, not a spec · 27 Sep 2026 · Author: Head of SEO and Content Marketing (marketing audit, wave 5) · Owner: Soubhik

Scope: the keyword universe, a technical SEO audit of the built site (`apps/web`, `dist/` built 26 Sep 2026 20:59), the templated-content problem and how to recover from it, an editorial standard per page type, a 90-day content plan, internal linking, E-E-A-T, link earning, SEO KPIs, and title/H1/meta rewrites for the 10 highest-value pages. Nothing in the product was edited. Anything that touches a route, slug, pill string, ad rule or budget needs the `CLAUDE.md` docs update first, so those items are listed under Owner decisions.

Read with: [market.md](market.md) (competitors, demand map, distribution; I build on its §2 and §5 and do not repeat them), [editorial-audit-articles.md](editorial-audit-articles.md) (the 51-article template problem, fixed descriptions), [fact-check-2026-09-26.md](fact-check-2026-09-26.md) (which claims are false), [growth-conversion.md](growth-conversion.md) (funnels, KPIs).

**Evidence labels.** **[V]** verified: I fetched the page, file or command output and read it. **[S]** secondary: a search-tool snippet or third-party summary. **[E]** estimate. **[O]** opinion. External sources were accessed 26–27 Sep 2026 (list at the end). **No search-volume numbers exist in this report.** Like market.md, I had no keyword tool; demand is given as tiers inferred from Google autocomplete and SERP make-up, and is labelled [E]. The "SERP" snapshots come from Claude's US search tool, not a Google results page, so treat rankings as indicative.

---

## Summary for the owner

1. **The domain every SEO signal points at is not registered.** `whois awaketab.com` returns "No match" and the name does not resolve [V, 26 Sep 2026]. Every canonical, hreflang, sitemap URL, JSON-LD `@id`, the robots.txt `Sitemap:` line and the embed attribution link point to `https://awaketab.com`. Register it today (or choose the real domain and change `SITE` in three files). This is open item O-16, but it is now urgent: someone else can buy the name.
2. **Nothing is indexed yet, and that is good news.** The sandbox `awaketab.pages.dev` sends `X-Robots-Tag: noindex` from the platform [V]. We have no rankings to lose, so we can launch small and good instead of launching 73 templated URLs and trying to recover later.
3. **Launch with about 20 rewritten pages; keep the other 50 live but `noindex` until each is rewritten.** The 51 articles are one generated template (84–90 % duplicate) and repeat a claim the fact-check proved false. Google's scaled-content policy names "many pages generated … without adding value" [V]. A new domain that opens with 51 near-duplicates teaches Google the site is low value, and that judgement is site-wide and slow to reverse [O].
4. **"Last verified 9 September 2026" is not true yet, and the home page says more.** The home page says "Every support claim comes from a device on a shelf here … retested after each browser and OS release", but `docs/metrics/device-matrix.json` has 14 rows, all `pending` [V]. The same pages carry the battery-saver claim the fact-check disproved. Remove the shelf sentence now. Split the stamp into "Sources checked {date}" and "Tested on {device, OS, browser} {date}". Show the second only when a device row passes.
5. **Win the long tail and developer queries first, not "keep screen awake".** The head terms belong to at least 14 exact-match-domain clones (keepscreenawake.org, keep-screen-on.com, screenawake.com, keep-awake.com …) and nosleep.page [V]. They win on the domain name, a query-matching title, a tool that works in one tap, and age. A new domain will not beat them in 90 days [O]. Problem queries and developer queries are winnable because the pages that rank there are thin or out of date.
6. **Fresh demand the plan doesn't cover:** "claude code keep computer awake", "keep mac awake for claude", "screen wake lock is not allowed in this document" (a developer error message), "screen wake lock api react", "wake lock demo", "keep screen on while viewing not working samsung", "keep laptop on when closed" [V, autocomplete]. §5 turns these into pages.
7. **The embed earns no backlinks as built.** The "Keep awake by AwakeTab" link sits inside the iframe (`embed/cook.astro:57`), so Google credits it to `/embed/cook`, which is disallowed in robots.txt and `noindex`. The host page gets no link at all. docs/11 assumes "a contextual backlink"; that assumption is wrong. Fix: a visible, branded credit in the host page's own HTML (§4.4), with care, because Google names widget links as link spam [V].
8. **The best link magnets are things only we can publish:** an open wake-lock behaviour dataset with real device results (Dataset schema, CC BY), a live "Wake Lock test" diagnostic page (demand shown by "wake lock demo" autocomplete), and a "battery saver doesn't block wake locks" myth-buster built from the fact-check's reading of Chromium and WebKit source. All three need the device run done first.
9. **Structured data: stay restrained, and fix the entity basics.** Skip FAQPage and HowTo: Google stopped showing FAQ rich results on 7 May 2026, and HowTo is gone too [V]. `SoftwareApplication` rich results need a rating or review [V], so none appear until 25 real ratings exist, and that rating must also show on the page. The Organization `sameAs` points to two 404s (github.com/awaketab, npm `@awaketab/wake`) [V].
10. **Technical base is strong apart from four bugs:** every sitemap URL shares one `lastmod` (the last commit to `apps/web/src`); `/until/*` combines `noindex` with a canonical to `/`; a stale `sitemap-0.xml` ships; and the English home never lists its locale versions in hreflang, so the moment a locale is approved, hreflang is one-sided. Clean URLs, 308 slash handling, IndexNow, one H1 per page and Lighthouse SEO 100 are all in place [V].
11. **Eight languages are machinery, not traffic yet.** All 7 locale homes and 70 translated articles are `noindex` (`reviewed: false`). That is correct: the translations were drafted from the templated English. Retranslate from the rewritten English, have a native speaker review, then flip them. Start with pt-BR and es, which market.md §2.1 shows skew to Samsung/Xiaomi queries.
12. **Recalibrate targets.** docs/06 §16 aims for "top 10 for queries 1–3 in three locales" by day 90. On an unregistered, zero-link domain with no indexable locales, that will not happen. §9 gives honest targets: indexation, long-tail top-10s, referring domains and tool starts from organic.

---

## Scorecard (0–10)

| Area | Score | One-line reason |
|---|---|---|
| Keyword targeting and intent | 5 | Families and intents are right. It misses the AI-agent, lid-closed, error-message and "website/online/without software" modifiers, and titles use jargon ("vs a wake-lock tab") |
| Technical crawl and index | 5 | Excellent machinery (served-URL tests, reciprocal hreflang generator, IndexNow), undercut by the unregistered domain, a global `lastmod`, mixed `/until` signals and a stale sitemap |
| International SEO | 3 | Subfolders, BCP 47 codes, slug mapping and the review gate are all right, but 0 indexable non-EN pages and translations derived from the template |
| Structured data | 5 | Correct restraint on FAQ/HowTo. Weak entity data: 404 `sameAs`, one-line Person, preset tool pages typed as `Article`, author via a cross-page `@id` only |
| Content quality | 1 | 51 pages from one template, 40 truncated descriptions, a false claim on 33 pages, slug leaks in FAQs |
| E-E-A-T and evidence | 2 | The honest limits are a real asset. The testing claims have no records behind them yet |
| Internal linking | 4 | Hubs, breadcrumbs and `related` exist. Links are off-topic, triangles are missing, and nothing links to the extension, embed or library where they are the answer |
| Authority and link earning | 1 | No domain, npm package unpublished, GitHub org 404, embed link inside the iframe |
| Measurement | 5 | GSC/Bing/IndexNow plan and a 25-query list exist. No data yet, and the targets are unrealistic |
| Page experience | 8 | Zero hydration, CLS 0, TBT 0. Mobile LCP 1.82 s misses the in-house 1.2 s budget but is well inside Google's 2.5 s "good" |

---

## 1. Keyword universe

### 1.1 How demand was estimated

Google autocomplete (US English, `suggestqueries.google.com`, fetched 26 Sep 2026) shows what people type, and in what order, but not how many [V]. I rank clusters by how many seeds they appear under, whether Apple, Microsoft or Samsung publish a support page for the query, and how many forum threads and tool clones compete. **Tiers [E]:** T1 = mass consumer (on many seeds, vendor support pages exist); T2 = large; T3 = medium; T4 = niche. Replace them with Keyword Planner and 28 days of Search Console data (§9, market.md §2.5).

### 1.2 Clusters

| # | Cluster (intent) | Queries seen in autocomplete [V] | Tier [E] | Who holds the results now [V/S] | Why they win [O] | Our page | Fit |
|---|---|---|---|---|---|---|---|
| A | **Tool, head** (do it now, in a browser) | keep screen awake **website** · keep computer awake **website** · keep laptop awake **online** · keep awake website · keep mac awake website · keep computer awake **without software / without changing settings** · no sleep page | T2 | Keep Awake (Display \| System) on the Chrome Web Store, keepscreenawake.org, keep-screen-on.com, screenawake.com, keep-awake.com, nosleep.page, screenawake.online | Exact-match domain and title; one-tap tool above the fold; 250–1,400 words, not depth; device sub-pages (keep-awake.com has `/keep-screen-on-iphone/` etc.); nosleep.page's 2022 HN launch (252 points) gave it links | `/` | Core |
| A2 | Tool, duration | keep screen on for 30 minutes (no tool completions) | T4 | Android Central forum, HowToGeek, Samsung support, screenawake.com | Searchers mostly want the phone setting | `/15m`…`/8h` | Share targets, not traffic pages |
| B | **Extension** | keep screen awake chrome extension · keep awake extension · keep awake chrome · keep screen on chrome extension · keep awake firefox | T2 | Chrome Web Store listings (Google Keep Awake, 1M users, not updated since Aug 2023) | The store listing *is* the result; the web page barely matters | `/extension` + the store listing | Strong (market.md §1.2) |
| C | **Device settings and problems** | keep screen on iphone / android / ipad / macbook / windows · screen timeout windows 11 · iphone auto lock greyed out · windows 11 screen turns off after 1 minute · keep screen on while viewing **not working samsung** · keep screen on while charging · prevent screen from locking windows 11 · keep chromebook screen on | T1 in total; each T2–T3 | Apple Support, Microsoft Learn and Q&A, Samsung support, HowToGeek, iGeeksBlog, macReports, elevenforum, Apple Community, vendor blogs (Dr.Fone, Tenorshare) | Authority plus the exact steps; the OS version in the title; Microsoft's own KB answers the 1-minute case with the lock-screen timeout, and our guide doesn't mention it | `/on/*`, `/guides/*` | Partial: give the setting first, the tool second (market.md action 6) |
| D | **Lid closed / system sleep** | keep laptop on when closed · keep mac awake with lid closed · keep laptop awake when closed windows 11 · keep computer awake when closing lid | T1–T2 | Microsoft and Apple docs, how-to sites | Authority | `/guides/mac-prevent-sleep-lid-closed`; Windows is missing | None for the tool. An honest answer earns trust and links |
| E | **Long jobs and AI agents** (new) | keep computer awake **claude** · **claude code** keep computer awake · claude desktop keep computer awake · keep mac awake **for claude** · keep computer awake for remote desktop · prevent computer from sleeping while downloading · keep mac awake terminal command | T3, rising [E] | GitHub issues, personal blogs on `caffeinate`, notch/menu-bar apps | Nobody has written the tool-agnostic answer | `/for/ai-agents` (currently about agents *in a browser*), `/for/downloads` | Partial: a visible tab, the extension's System level, or `caffeinate` |
| F | **Use cases** | keep iphone screen on for recipe · cook mode · keep screen on during call · during presentation · full screen clock / night clock online | T3 each (full-screen clock T2, a different category) | Recipe-plugin vendors (WP Tasty, Bootstrapped Ventures), clock sites (time.now, clockfaceonline, dayspedia, clocksimulator) | Plugins own "cook mode" because the feature lives in their product; clock sites use exact-match titles and have been around for years | `/for/*`, `/embed` | Strong on tablets and laptops; weak on phones (§4.1) |
| G | **Presence (refused by design)** | keep teams green · keep teams status green · how to keep teams from showing away · mouse jiggler online · mouse jiggler for teams | T1 | SaaS content blogs (ClickUp, Reclaim, Krisp, Notta), Microsoft Q&A, UC Today, AlternativeTo, online jiggler sites | Listicles of "hacks"; Q&A threads with 1,200–1,700 "same question" clicks | `/learn/does-a-wake-lock-keep-teams-green`, `/vs/mouse-jigglers` | None. Honest answer for trust and links; won't convert (market.md §2.2) |
| H | **Alternatives and comparisons** | caffeine alternative mac · amphetamine alternative · powertoys awake keep screen on · nosleep.page alternative · keepingyouawake alternatives | T3 | AlternativeTo, iDownloadBlog, vendor pages (Caffeinated, Notchy), Microsoft Learn for PowerToys | List format and many options; AlternativeTo's authority | `/vs/*` | Medium. An AlternativeTo listing is the bigger lever |
| I | **Developer** | screen wake lock api · wake lock demo · screen wake lock api **react** / safari / ios / example · **screen wake lock is not allowed in this document** · wake lock permission · nosleep.js alternative | T3–T4 | MDN, web.dev, Chrome for Developers, W3C, caniuse, chromestatus; NoSleep.js on GitHub/npm plus forks (mosleep, no-sleep-app) | Canonical authorities; NoSleep.js ranks on age alone (last release Dec 2020) | `/learn/screen-wake-lock-api-guide`, `/learn/browser-support-matrix`, `/library` | Strong. The best link-earning cluster |
| J | **Localised** | es mantener pantalla encendida · pt-BR manter tela ligada (samsung, xiaomi) · de bildschirm anlassen (zugeklappt) · ja 画面 消えないようにする · zh 屏幕常亮 (market.md §2.1) | T2 in total [E] | Local how-to sites, vendor pages | Local phrasing; Android-brand specifics | 70 translations + 7 locale homes, all `noindex` | Later (§5) |

### 1.3 What the results pages tell us [O]

- **Head terms reward the domain name and a working button, not depth.** keepscreenawake.org ranks with about 250–300 words and four FAQs [V]; nosleep.page with about 75 [V]. More words on `/` will not move us. The levers are a title with the query ("online", "website", "no install"), a tool that starts in one tap, fast return visits (bookmarks, installs), and links.
- **Problem queries reward the exact cause.** Microsoft's KB 2835052 says a locked Windows PC turns the monitor off after 60 seconds "by design" and gives the `powercfg` fix [V]. Our Windows guide gives the Settings path and "common on battery" and misses that cause. The page that names the real cause and says how to confirm it wins.
- **Developer queries reward the code and the error string.** Autocomplete carries an exact error message. MDN explains the API but not every rejection cause across engines; the fact-check already has that from engine source. That is the gap.
- **AI answers now sit above many informational results [O].** A page is more likely to be quoted when a dated, sourced answer sits in its first 60 words and is phrased as a plain sentence. Our "answer first" template is the right shape; the content inside it is what fails today.

---

## 2. Technical SEO audit (built site)

Checked against `apps/web/src`, `apps/web/scripts`, `public/_headers`, `public/_redirects`, `public/robots.txt` and the built `dist/` (450 HTML files, 73 URLs in `sitemap-en.xml`, 0 in the other seven) [V].

| ID | Finding | Evidence | Sev | Fix |
|---|---|---|---|---|
| T-01 | **Canonical domain unregistered** | `whois awaketab.com` → "No match"; no DNS [V]. `SITE = 'https://awaketab.com'` in `scripts/sitemap.mjs:11` and `src/lib/seo.ts:22`; embed links in `embed/cook.astro:46,57` | Critical | Register now. After launch: Search Console domain property, then 301 `awaketab.pages.dev/*` → the domain (a Pages redirect rule or a `_redirects` host rule) |
| T-02 | Sandbox noindexed by the platform | `curl -I awaketab.pages.dev` → `x-robots-tag: noindex`; not in our `_headers` [V] | Info | Keep. On launch day, confirm the custom domain does **not** send it (add to launch checklist) |
| T-03 | **One `lastmod` for every URL** | `sitemap.mjs` `lastModified()` runs `git log -1 -- apps/web/src` once and stamps it on all URLs and the index [V]. docs/06 §6 requires a per-file date | High | Per-file `git log -1 --format=%cI -- <md file>` (frontmatter `updated` wins if later); tool routes use the island/layout date. Make `Article.dateModified` the same value. Google ignores `lastmod` on sites where it is consistently wrong [O] |
| T-04 | Stale `sitemap-0.xml` ships | `public/sitemap-0.xml` (holding page, lists only `/`, commit d90d952) is copied to `dist/` [V]. The index no longer lists it | Low | Delete `public/sitemap-0.xml` and `public/sitemap-index.xml` (the build writes the real index) |
| T-05 | **`/until/*`: `noindex` plus canonical to `/`** | `until/[time].astro:22-27` sets `canonical={site}` and `noindex` [V]. Google: "We don't recommend using `noindex` to prevent selection of a canonical page" [V] | Med | Keep `noindex, follow`, drop the cross-canonical (self or none). See §2.1 |
| T-06 | `/until` H1 contains the title suffix | Built H1: "Keep the screen awake until 09:30 — AwakeTab" [V]; `heading={t('page.until.title')}` | Low | Pass the heading without the suffix. For `en`, show "until 9:30 AM" (decision D-R07); the slug stays `09-30` |
| T-07 | Presets are thin near-duplicates with jargon and one false line | `[preset].astro`: only `label`/`use` vary; body cites `Date.now()`; the limit says "battery saver … may still let the display sleep" (unsupported per the fact-check) [V]. Titles say "30 min", "1 h" | Med | Rewrite per §4.2 and the §7 examples; title "Keep your screen on for 30 minutes — AwakeTab"; drop `Article` schema on tool pages |
| T-08 | **Home hreflang never lists the locale homes** | `index.astro` passes no `alternates`; `sitemap.mjs` `ENGLISH_PATHS` emit `en` + `x-default` only [V]. The `/es/`… homes are `noindex` today, so the bug is latent | High (the day a locale flips) | Build the static-path alternates from `LOCALE_META[*].reviewed`, with the same function as the pages and sitemap; extend `test/seo` to assert `/` ↔ `/{lang}/` reciprocity |
| T-09 | 0 indexable non-EN URLs | `LOCALE_META` `reviewed: false` ×7; 70 translations `reviewed: false` [V] | Info (correct) | Keep until they are rewritten and reviewed (§3.4) |
| T-10 | robots.txt disallows `/embed/` and `/pip` that already send `X-Robots-Tag: noindex` | `robots.txt`, `dist/_headers` [V] | Low | Remove those two `Disallow` lines so crawlers can see the `noindex`. Otherwise a much-embedded `/embed/cook` URL can be indexed from links alone as a bare URL. Keep `/api/` |
| T-11 | **Entity data points at 404s** | Org `sameAs`: `github.com/awaketab` → 404, `npmjs.com/package/@awaketab/wake` → 404 [V]; `library.astro:166` links `github.com/awaketab/awaketab` → 404; the real repo `github.com/SoubhikBiswas-gitHub/awaketab` → 200 [V] | Med | Point `sameAs` and the library link at URLs that exist today; add npm when it is published |
| T-12 | Article author only by cross-page `@id` | `articleSchema()` → `author: { '@id': '/about#person' }`; the Person node exists only on `/about` [V] | Med | Inline `author: { '@type': 'Person', name: 'Soubhik Biswas', url: 'https://awaketab.com/about' }` on every Article (§7.4) |
| T-13 | Thin `WebApplication` | `homeSchema()`: no `description`, `screenshot`, `featureList` [V] | Low | Add them (§4.3) |
| T-14 | ~780 words of tool UI on every article | `/for/cooking`: 783 words of prose out of 1,567 in the page [V] | Med | Mark the tool island's chrome `data-nosnippet` (settings, stats, shortcuts, sheets) so snippets and AI answers quote the article, and keep the article H1 plus the first paragraph before the tool in source order |
| T-15 | Titles: brand twice, jargon, inconsistent case | "AwakeTab alternatives compared — AwakeTab"; "Caffeine vs a wake-lock tab"; "Keep Your Screen Awake" (Title Case only on home) [V] | Med | §7 rewrites; enforce sentence case |
| T-16 | 40 of 51 descriptions cut mid-sentence | `fitDesc` slices at 150 characters (editorial audit) [V] | High | Use the editorial audit's description table; the build should fail on a description that doesn't end in `.`, `?` or `!` |
| T-17 | Ads CSP on every content path | `_headers` `/for/*`, `/on/*` … and locale equivalents [V] | Med | Show ads only on pages that pass the §4 standard (Owner decision OD-8) |
| T-18 | The redesign bakes the template in | Canvas `ContentArticle.dc.html` renders the same 9 sections ("What you are actually asking", "Why the pill is the product", …) and the battery-saver claim [V] | High | Content layout = slots per page type (§4), not fixed prose |
| T-19 | Good, keep | No trailing slash, Pages 308s, `/en/*` 301, `/support-matrix` and `/how-we-tested` 301 to `/learn/*`, one H1, self-canonicals on content, IndexNow workflow, served-URL tests, OG per locale, Lighthouse SEO 100 (docs/metrics) [V] | — | — |

### 2.1 The 288 `/until` pages and the 7 presets

- **`/until/HH-MM` (288 static files).** They exist for sharing ("keep it on until 11:30"), not for search. Nobody searches "keep screen awake until 09:35" [E]. Keep them `noindex, follow`, out of the sitemap, and crawlable (no robots block, so the `noindex` is seen). Remove the canonical to `/`: they are not duplicates of the home page, they are unindexed utility URLs. **Option [O]:** replace the 288 prerendered files with one `/until` template and a `_redirects` 200 rewrite (`/until/:time /until-template 200`), parsing the time in the island. That allows any minute and removes 288 near-identical HTML files from every deploy. The redesign's "Nearby times" block links `/until` pages to each other. That is fine for users, but keep it to 3–4 links so crawlers don't spend time on a web of `noindex` pages.
- **Presets (`/15m` … `/8h`).** They are low-demand as queries (cluster A2) but are the shareable tool entries. Keep them indexable and self-canonical, but make each genuinely different in 150–250 words: what that length suits, what happens at the end (the "Time's up" prompt, "+15 min"), the battery note for 4 h and 8 h, and links to the two scenario pages that use that preset. Do not canonicalise them to `/`: their content and preset differ, so Google would likely ignore the hint anyway [O]. If Search Console shows none of the 7 getting impressions after 90 days, `noindex` `/45m`, `/4h` and `/8h` and keep the four common ones.

### 2.2 hreflang for 8 locales: what must be true before any locale goes live

1. The locale home, the 10 translated articles and the English originals list each other reciprocally, plus self and `x-default` (the machinery does this for articles; fix T-08 for homes and static paths).
2. Only `reviewed: true` pages appear in hreflang and sitemaps (built and tested, §19 of docs/06).
3. The locale home's H1 and title target the local query, not a translation of the English one. "Mantén tu pantalla despierta" is not how Spanish speakers search; docs/07 §7 lists "mantener pantalla encendida". Same for pt-BR "manter tela ligada".
4. The locale `/on/*` pages lead with Samsung/Xiaomi settings where the local autocomplete does (market.md §2.1).

---

## 3. The templated-content problem and the recovery plan

### 3.1 Diagnosis (from the editorial audit, confirmed in `dist/`)

- 51 English articles come from `scripts/write-content.mjs`: 9 identical H2s, 8 shared paragraphs, only the lead is unique; 84–90 % of 8-word shingles repeat elsewhere.
- FAQs Q2/Q3 are identical on all 51, Q1 has broken grammar, and A1 leaks the slug ("The cooking flow releases…").
- The shared line repeats the false battery-saver claim on 33 pages (fact-check).
- Every page carries "Last verified: 9 September 2026" although no device run is recorded.
- The 70 translations were drafted from these pages (docs/06 §19).

Under Google's spam policies, this is the pattern described as scaled content abuse: "many pages … generated for the primary purpose of manipulating search rankings and not helping users", including "generative AI tools … to generate many pages without adding value" [V]. It was not written with that intent, but the output looks the same to a classifier [O].

### 3.2 Recovery plan

| Step | What | Done when |
|---|---|---|
| 0 | Retire `write-content.mjs` (O-15) so a re-run can't overwrite rewrites | Script deleted or moved out of `build`; CI fails if it is referenced |
| 1 | **Gate indexing by quality.** Add a frontmatter field `quality: draft \| ready` (PROPOSED identifier). `draft` → `noindex, follow`, out of the sitemap and IndexNow, no ads, URL stays live. Set all 51 to `draft` | Sitemap has only `ready` pages; test asserts it |
| 2 | **Lint so the template can't come back.** `pnpm content:lint`: 8-word shingle overlap ≤ 2 % across the collection (docs/06 §11.4); no identical FAQ question on two pages; descriptions are whole sentences of 70–155 characters; banned tokens in prose (`sentinel`, `held`, `lost`, `denied`, `Date.now()`, raw slugs, "flow"); any pill string must match `en.json` exactly | CI red on violation |
| 3 | **Rewrite in waves** by value (§5), each to its §4 page-type standard, each fact tied to a source or a device row | Page flips to `ready` only after a second read and a fact check against the fact-check list |
| 4 | **Stamps tell the truth.** "Sources checked {date}" for desk-verified facts; "Tested on {device} · {OS} · {browser} · {date}" only from `device-matrix.json` rows with `verdict: pass/partial`. `/on/*` and `/guides/*` need at least one tested row to go `ready` | Build fails if a page shows "Tested" without a matching row |
| 5 | **Merge and cut** (§5.3) with 301s, after the docs/00 §7 update | Redirects in `_redirects`; `served-urls` test updated |
| 6 | **Translations restart from the rewritten English**, adapted to the local query, native-reviewed, then `reviewed: true` | Per locale: home + top 10 pages |

Because nothing is indexed, steps 1–2 cost no traffic and should ship before the domain goes live.

---

## 4. Editorial standard per page type

Rules for every page: the answer in the first 60 words; one honest limit, specific to the page, in the `<aside class="limit">`; sentence case; British spelling; grade-8 reading level; pill strings quoted exactly ("Screen awake", "Paused — tab hidden", "Blocked — here's the fix", "Awake via video fallback"); third-party claims linked to the vendor source with an access date; no marketing adjectives; no engine state names in prose; one next step when the tool can't do the job (the extension, `caffeinate`, the OS setting). If a page cannot say something true and specific that no other page on the site says, it should not exist.

| Type | Its job | First 60 words must | Required blocks | Evidence | Words | Never | Allowed CTA |
|---|---|---|---|---|---|---|---|
| **Home `/`** | Start the tool; prove honesty | Say what it does, where it works, the visible-tab limit | Tool; how the pill works (3 states pictured); honest limits; support table from data; links to top 12 pages by cluster; 6–8 FAQs | Support table generated from `support-matrix.json` | 900–1,500 | Claims about device testing without records | Extension (hidden-tab limit), install |
| **Preset** | Share target for one length | Say what starts and what happens at the end | Tool with preset; end behaviour; who uses this length (2 linked scenarios); battery note ≥ 2 h | — | 150–250 | Jargon, other presets' copy | — |
| **Scenario `/for`** | Solve one real job | Say whether AwakeTab fits this job, and on which devices | Setup in 3 steps for phone and desktop *as they actually work*; what you'll see; honest limit; the better tool when it isn't us; 3–5 unique FAQs | One screenshot per device, dated, own | 500–900 | Pretending a phone can keep another app's screen awake | Extension, embed, kiosk licence, ambient pack, only when it solves this job |
| **Device `/on`** | Get this device's screen to stay on | Give the native setting first, then when a tab helps | Native steps with the current OS menu names; browser support row; what breaks it (Low Power Mode, MDM, OEM sleep lists); tested row | ≥ 1 device row with `pass`/`partial` | 500–900 | Untested "works on" claims | Extension on desktop Chromium |
| **Guide `/guides`** | Fix one problem | Name the cause in one sentence | Cause list ranked by likelihood; numbered steps per OS version; "if it's greyed out / managed"; a way to confirm (`powercfg /requests`, `pmset -g assertions`); the tool as a shortcut | Vendor doc links; screenshots | 600–1,100 | Tool-first answers to a settings question | Tool mid-page |
| **Comparison `/vs`** | Help choose | Give the verdict: who should use which | Dated comparison table (mechanism, hidden tab, install, platforms, price, last release); "When {competitor} is better" (≥ 2 cases); "When AwakeTab is" | Competitor docs and release pages, dated | 600–1,000 | Disparaging copy; stale facts; brand twice in the title | AlternativeTo-style honesty; library for NoSleep.js |
| **Learn / developer** | Be the reference | Give the one-paragraph answer or the code | Code that runs; the error table with causes per engine; methods, dates and results for tests; limits | Engine source links (Chromium, WebKit, Gecko); test logs | 1,000–2,000 | Untested numbers | `@awaketab/wake`, the test page |
| **Product (`/extension`, `/embed`, `/kiosk`, `/library`, `/pro`)** | Explain and convert | Say what it does that the free web tab can't | Features that exist today; limits; permissions/privacy; price and refund; FAQ | Store listing and changelog | 400–900 | Features not built (O-05) | One primary CTA |
| **Translation** | Same job, local query | Answer the local query | As the EN type, adapted (local OS menu names, local Android brands) | Native reviewer sign-off | ~70–100 % of EN | Word-for-word translation of EN idioms | Same as EN |

### 4.1 The phone problem the scenario pages must be honest about

On a phone only one app or tab is in front. If the recipe, map or score lives in another tab or app, a wake lock in the AwakeTab tab does nothing for it. `/for/cooking`, `/for/navigation`, `/for/reading` and `/for/sheet-music` must say this in the first 60 words, then give what does work: a tablet or laptop with the tool beside the content; the recipe site's own cook mode; a temporary Auto-Lock change; or, for site owners, the embed. Saying this plainly is what makes the page worth ranking [O].

### 4.2 Page-type copy that is safe to reuse

Only the pill-state explainer on home and the support table (generated from data) may appear on more than one page. Everything else is written per page.

### 4.3 Structured data per page type

| Page | Emit | Don't emit | Notes |
|---|---|---|---|
| `/` | `Organization`, `WebSite`, `WebApplication` (+ `description`, `screenshot`, `featureList`, `isAccessibleForFree: true`) | `aggregateRating` below 25 ratings (already coded) | When ratings appear, show "Rated {x} by {n} people who used AwakeTab" visibly on the page: Google requires marked-up ratings to be visible |
| `/extension` | `SoftwareApplication` (`applicationCategory: BrowserApplication`, `operatingSystem: "ChromeOS, Windows, macOS, Linux"`, `offers` price 0, `installUrl` to the store once live) | Store ratings copied as `aggregateRating` (third-party ratings can't be marked up) | No rich result without our own ratings; still helps entity understanding |
| `/library` | `SoftwareSourceCode` (`codeRepository`, `programmingLanguage: TypeScript`, `license`, `runtimePlatform: "Web browsers"`) | — | Only after the npm package and repo URL resolve |
| `/learn/browser-support-matrix` (+ `/data/`) | `Dataset` (name, description, `license` CC BY 4.0, `distribution` JSON and CSV, `temporalCoverage`, `creator`) | — | Eligible for Google Dataset Search [V]; the strongest SEO asset we can mark up |
| Articles | `Article` with inline author `{name, url}`, per-page `dateModified`, `image`; `BreadcrumbList` | `FAQPage`, `HowTo` (no rich results since 7 May 2026 / 2023 [V]) | FAQs stay as visible content |
| Presets, `/until` | `BreadcrumbList` only, or nothing | `Article` | They are tool pages |
| `/about` | `Person` with `sameAs` (GitHub profile), `knowsAbout`, `image` if the owner wants a photo | — | — |
| Demo videos (later) | `VideoObject` for 20–40 s screen recordings of the pill on real devices | — | Doubles as test evidence |

---

## 5. 90-day content plan (from domain registration)

Assumes one writer (the owner plus an agent), about 6–8 pages a week, and the device run in weeks 1–3. Dates are relative to "day 0" = the domain is live.

### 5.1 Waves

| When | Ship (set `ready`) | Why these |
|---|---|---|
| **Before day 0** | T-01 to T-08 fixes; quality gate and lint (§3.2 steps 0–2); home and presets rewritten; `/about` with a real test-rig list; remove the "device on a shelf" sentence | Nothing indexed yet, so no risk |
| **Days 0–14 (launch set, about 20 URLs)** | `/`, 7 presets, 5 hubs, `/extension`, `/library` (when npm is live), `/about`, `/privacy`, `/terms`, `/changelog`, plus **the 10 pages in §7** | Highest intent, winnable, or link-earning |
| **Days 15–45** | `/on/android-chrome`, `/on/windows-11` (absorbs `windows-10`), `/on/chromebook` (+ Google Keep Awake angle, market.md §1.2), `/on/ipad` (iPadOS 26 windowing), `/guides/mac-prevent-sleep-lid-closed` (broadened), `/guides/lock-screen-vs-sleep` (retarget "prevent screen from locking windows 11"), `/vs/nosleep-page`, `/vs/caffeine`, `/vs/powertoys-awake`, `/vs/mouse-jigglers`, `/for/presentations`, `/for/work-laptop` (+ "For IT admins", market.md action 15), `/for/dashboards`, `/learn/browser-support-matrix` + open dataset | Device queries plus comparisons for AlternativeTo visitors |
| **Days 46–90** | New pages (§5.2); `/for/downloads`, `/for/night-clock` (retarget "full screen night clock that stays on"), `/for/video-calls`, `/on/firefox`, `/on/samsung-internet` (+ "keep screen on while viewing" Samsung setting), `/on/linux`, `/vs/amphetamine`, `/vs/caffeinate-command`, `/learn/how-we-tested`; first two locales (pt-BR, es): home + 10 pages; decide the rest from Search Console | Data-led: pick from queries with impressions but no good page |

### 5.2 New pages worth writing (routes need docs/00 §7 first)

| Proposed route | Target query (evidence) | Why it will earn its place |
|---|---|---|
| `/learn/wake-lock-test` | wake lock demo · screen wake lock api demo [V] | A live diagnostic: API present? secure context? Permissions-Policy? visible? request result and the exact error; copy-paste report for bug trackers. Developers link to tools like this |
| `/learn/wake-lock-notallowederror` | "screen wake lock is not allowed in this document" [V] | Engine-by-engine causes from the fact-check (hidden document, Permissions-Policy/iframe `allow`, Safari gesture, Firefox ≤ 5 % battery), each with the fix |
| `/guides/laptop-lid-closed` (Windows + Mac, or a Windows page beside the Mac one) | keep laptop on when closed · …windows 11 [V] | The honest answer: a browser can't; here are the OS lid settings and their heat and battery trade-offs (market.md action 14) |
| `/for/classroom` | teacher laptops that sleep every 10 minutes (market.md §4) | An under-served, recurring audience; Chromebook policy limits said plainly (market.md action 13) |
| `/learn/wake-lock-react` (or a section of the API guide first) | screen wake lock api react [V] | A hook that re-acquires on `visibilitychange`, built on `@awaketab/wake` |
| `/learn/battery-saver-and-wake-locks` (rewrite of `low-power-mode-and-wake-locks`) | low power mode wake lock; the myth the whole web repeats | Cites the engine source; the link magnet in §8 |

### 5.3 Merge and cut (proposal; Owner decision OD-3)

| Page | Action | Reason |
|---|---|---|
| `/learn/nosleep-js-vs-wake-lock` | 301 → `/vs/nosleep-js` | Same intent; two pages split the signals |
| `/for/second-monitor` | 301 → `/guides/second-monitor-turns-off` | Same intent; the problem phrasing is what people type |
| `/on/windows-10` | 301 → `/on/windows-11` retitled "Windows 11 and 10" | Same steps; Windows 10 mainstream support ended Oct 2025 |
| `/for/navigation` | Cut (410) or keep `noindex` | Its own honest limit says it doesn't work with map apps; no useful promise left |
| `/for/live-streams` | Cut or `noindex` | Players already hold a wake lock while playing |
| `/for/exams-proctoring` | Cut | Reads as a way around exam rules; trust risk outweighs any traffic |
| `/for/baby-monitor` | Cut, or keep `noindex` | Safety-adjacent; "not a safety device" is the whole answer |
| `/guides/modern-standby` | Fold into `/guides/lock-screen-vs-sleep` | Niche; AwakeTab can't act on it |
| `/for/reading`, `/for/teleprompter`, `/for/workouts` | Keep `draft` until data shows impressions | Plausible, weak demand |

### 5.4 Refresh cadence and the "last checked" process

| Trigger | Pages | Action |
|---|---|---|
| Stable release of Chrome, Firefox or Safari; iOS/Android/Windows/macOS feature update | Support matrix, affected `/on`, `/learn` | Re-run the affected device rows; update the dataset and changelog; stamps change only for pages whose facts were re-checked |
| Quarterly | `/vs/*` | Check competitor versions, prices, last release dates |
| Twice a year | `/for/*`, `/guides/*` | Re-verify menu names and limits; refresh FAQs from Search Console queries |
| 180 days without a re-check | Any | The stale badge shows (already built); the page drops out of IndexNow pings until re-checked |

The weekly freshness report (docs/06 §14) should list pages by oldest "Tested" stamp, not by file date.

---

## 6. Internal linking model

```
            ┌──────────────── / (tool + 12 curated links by cluster) ───────────────┐
            │                                                                        │
      /for hub      /on hub       /guides hub      /vs hub       /learn hub     product pages
         │             │               │              │               │        (/extension /embed
    scenario ◄──► device ◄──────► guide          comparison ──► evidence        /kiosk /library)
         │   (triangle per job)        │              │         (matrix, test,        ▲
         └────► tool route (/30m, /until…) ◄──────────┘          how-we-tested) ──────┘
                                 "when the tab can't" links go to the real fix
```

Rules:
1. **Up:** breadcrumb + hub link on every page (built).
2. **Triangles:** each scenario links its main device page and its main guide, and back. Example: `/for/sheet-music` ↔ `/on/ipad` ↔ `/guides/iphone-auto-lock-never-greyed-out`.
3. **Down:** each content page links the exact tool route it recommends, with the duration as the anchor ("start a 1-hour session").
4. **Honest exits are links too.** Where the page says "a tab can't", link the fix: the extension (hidden tab, desktop Chromium), `/vs/caffeinate-command` (terminal jobs), the lid guide, `/library` (developers). The editorial audit found none of these links today.
5. **Evidence links:** every `/vs`, `/on` and `/learn` page links the support matrix row or dataset it relies on.
6. **Anchors = the target's H1** (built for translations; enforce for EN), varied, never "here". ≤ 12 in-body links.
7. **Curated `related`, 3–5, on-topic.** No index-arithmetic picks. CI: every `ready` page has ≥ 3 inbound links from other `ready` pages (orphan check), and no `ready` page links to a `draft` page in body copy.
8. **Home carries 12 curated links**, not every page: the top 2–3 per cluster, refreshed quarterly from Search Console.
9. **The library, dataset and test page link to the tool once each**, as their demo. They are the pages most likely to be linked from outside, so they pass the most authority inward [O].

---

## 7. Rewrites: the 10 highest-value pages

Chosen for intent × winnability × fit (cluster in brackets). Titles ≤ 60 characters and end in " — AwakeTab" (docs/06 §4); descriptions are 70–155 characters, whole sentences, with no em dash. All lengths were checked with a script. Leads are written to be accurate against the fact-check; anything unverified is hedged or waits for the device run.

| # | Page | Title | H1 | Meta description |
|---|---|---|---|---|
| 1 | `/` (A) | Keep your screen awake online, no install — AwakeTab | Keep your screen awake | A free browser tab that keeps your screen on while it stays visible, and tells you plainly when it can't. Timers, until a set time, no account. |
| 2 | `/extension` (B) | Keep your screen awake: Chrome extension — AwakeTab | AwakeTab for Chrome: keeps working when the tab is hidden | AwakeTab for Chrome and Edge keeps the screen, or only the computer, awake even when the tab is hidden. Timers, a toolbar badge, no tracking. |
| 3 | `/for/ai-agents` (E) | Keep your computer awake while an AI agent runs — AwakeTab | Keep your computer awake while an AI agent or long build runs | Claude Code, Codex or a long build stalls when the computer sleeps. What a visible tab can hold, and when caffeinate or PowerToys Awake fits better. |
| 4 | `/guides/iphone-auto-lock-never-greyed-out` (C) | iPhone Auto-Lock greyed out? Causes and fixes — AwakeTab | iPhone Auto-Lock greyed out or stuck at 30 seconds | Auto-Lock is greyed out and stuck at 30 seconds when Low Power Mode is on or a work or school profile sets it. How to check each one, step by step. |
| 5 | `/guides/windows-11-screen-turns-off-after-1-minute` (C) | Windows 11 screen turns off after 1 minute — AwakeTab | Windows 11 screen turns off after 1 minute: how to fix it | Three usual causes: the lock screen's own 60-second display timeout, a 1-minute power setting, or a work policy. How to check each, with exact steps. |
| 6 | `/learn/does-a-wake-lock-keep-teams-green` (G) | Does keeping the screen on keep Teams green? — AwakeTab | Does keeping your screen on keep Teams green? No. Here's why | No. Teams shows Away after about 5 minutes without keyboard or mouse input, and Slack after 10, even with the screen on. Here is what sets your status. |
| 7 | `/on/iphone-safari` (C) | Keep your iPhone screen on in Safari — AwakeTab | Keep your iPhone screen on in Safari | Safari 16.4 and later can keep an iPhone screen on from a tab after one tap, while the tab stays in front. Low Power Mode can still force a 30-second lock. |
| 8 | `/on/macos` (C, A) | Keep your Mac awake from a browser tab — AwakeTab | Keep your Mac screen awake from a browser tab | In Chrome or Edge, a visible tab keeps your Mac's display on, and the Mac does not idle-sleep while it does. Closing the lid still puts it to sleep. |
| 9 | `/for/cooking` (F) | Cook mode: keep your screen on while cooking — AwakeTab | Cook mode: keep your screen on while you cook | Keep a recipe on screen with floury hands: big timers, tap anywhere to pause, no install. It works while its tab is visible; on a phone, that is the catch. |
| 10 | `/learn/screen-wake-lock-api-guide` (I) | Screen Wake Lock API: guide and error handling — AwakeTab | Screen Wake Lock API: a practical guide with error handling | How navigator.wakeLock.request('screen') works, why it throws NotAllowedError, how to re-acquire after visibilitychange, and support as of September 2026. |

Note on #6: market.md advises against targeting Teams in titles. The page's whole intent is the question, and a title that is the question, with "No" as the first word of the description, filters people rather than baiting them [O]. If the owner prefers market.md's line, use "Screen on vs Teams status: what a wake lock can't do — AwakeTab".

### 7.1 Opening paragraphs (the first 60 words of each page)

1. **`/`** AwakeTab keeps your screen on from this browser tab. Pick a length or an end time. The pill says "Screen awake" only after your browser confirms it. Keep the tab visible: if you switch tabs or apps, or close the lid, the screen can sleep, and the pill tells you so. Nothing to install, no account, no admin rights.
2. **`/extension`** The web page can keep the screen on only while its tab is visible. AwakeTab for Chrome uses Chrome's own power setting instead, so the screen, or just the computer, stays awake when the tab is hidden or the window is minimised. It works while Chrome is running. It can't stop sleep when you close a laptop lid.
3. **`/for/ai-agents`** If your agent or build runs in a terminal, the simplest fix is the operating system's own: `caffeinate -i` on a Mac, or PowerToys Awake on Windows. AwakeTab helps when you also want to watch progress. In Chrome or Edge, a visible AwakeTab tab keeps the display on. On a Mac, that also stops idle sleep. Closing the lid still sleeps. Check it with `pmset -g assertions` (Mac) or `powercfg /requests` (Windows).
4. **`/guides/iphone-auto-lock-…`** If Auto-Lock is greyed out and stuck at 30 seconds, Low Power Mode is almost certainly on: iOS sets Auto-Lock to 30 seconds while it runs. Turn it off in Settings > Battery and the other options, including Never, come back. If Low Power Mode is off and Auto-Lock is still locked, a work or school profile sets it, and only its administrator can change it.
5. **`/guides/windows-11-…-1-minute`** If the screen goes dark about a minute after you lock the PC (Windows key + L), that is Windows' separate lock-screen timeout: 60 seconds by default, and the "Turn off my screen after" setting doesn't change it. Microsoft documents a `powercfg` fix. If it happens while you're signed in and working, check your power timeout, then the screen saver, then any work policy.
6. **`/learn/…teams-green`** No. Microsoft Teams sets you to Away after about five minutes without keyboard or mouse activity, and Slack after about ten, whether or not the screen is on. A wake lock only stops the display sleeping. It sends no input, so your status changes as it normally would. AwakeTab never fakes input.
7. **`/on/iphone-safari`** On iOS 16.4 or later, open AwakeTab in Safari and tap Start. The screen stays on while the tab is in front. Switch apps or tabs and iOS releases it; come back and the pill shows the real state. Low Power Mode sets Auto-Lock to 30 seconds. We are still testing whether a wake lock holds under it, and will post the result here.
8. **`/on/macos`** In Chrome or Edge on a Mac, a visible AwakeTab tab asks macOS to keep the display on. While it does, the Mac doesn't idle-sleep either (Apple's power-assertion rules). To check, run `pmset -g assertions` in Terminal while the pill says "Screen awake". Closing the lid still sleeps the Mac unless it's in clamshell mode, with power and an external display.
9. **`/for/cooking`** AwakeTab's cook mode keeps the screen on with big kitchen timers and a tap-anywhere pause. It works only while its tab is visible. On a tablet or laptop, put it beside the recipe. On a phone, the recipe and AwakeTab can't both be in front, so use the recipe site's own cook mode if it has one, or lengthen Auto-Lock while you cook.
10. **`/learn/screen-wake-lock-api-guide`** `navigator.wakeLock.request('screen')` asks the browser to keep the display on and returns a `WakeLockSentinel`. It works only on HTTPS in a visible document. The browser releases it when the page is hidden, so request it again on `visibilitychange`. It rejects with `NotAllowedError` when the document is hidden, a Permissions-Policy blocks `screen-wake-lock`, Safari has no recent tap, or Firefox is at 5 % battery or less.

### 7.2 Other titles to fix at the same time

| Page | Title | Description / note |
|---|---|---|
| `/30m` (pattern for presets) | Keep your screen on for 30 minutes — AwakeTab | Starts a 30-minute screen-awake timer in this tab, then lets the screen sleep again. Add 15 minutes or stop at any time. Free, no install, no account. (Use "1 hour", "8 hours", not "1 h") |
| `/until/HH-MM` (pattern) | Keep your screen awake until 7:30 AM — AwakeTab | Stays `noindex`; H1 without the suffix |
| `/vs` hub | Compare screen-awake tools — AwakeTab | From the editorial audit; removes the second "AwakeTab" |
| `/vs/nosleep-page` | A nosleep.page alternative with honest status — AwakeTab | Both keep a screen on from a visible tab. AwakeTab adds a status that only says awake when it is, an end time you set, and session restore. |
| `/vs/caffeine`, `/vs/amphetamine`, `/vs/powertoys-awake` | Use the editorial audit's titles ("Caffeine alternative in a browser tab — AwakeTab", …) | Descriptions from the editorial audit, corrected per the fact-check |
| `/library` | NoSleep.js alternative: @awaketab/wake — AwakeTab | Only once the npm package is published |

---

## 8. E-E-A-T: experience and evidence

**Strengths to keep.** An honest limit on every page; a named maker; refusing to fake presence; a fact-check that reads engine source. Very few pages in this category do any of this [O].

**What must change:**

1. **Stop claiming tests we haven't recorded.** Remove the home sentence "Every support claim comes from a device on a shelf here … retested after each browser and OS release" until `device-matrix.json` has results. Until then: "Support claims come from browser documentation and source code, checked on {date}. Device tests are in progress; results appear on each page as they're recorded."
2. **Run the device matrix (14 rows) before launch.** It is the single thing that unlocks the `/on` pages, the dataset, the test page, Show HN (market.md action 9) and truthful stamps. Record the device, OS build, browser version, power state, the observed pill, and a 20–40 s screen recording as evidence.
3. **Make `/about` a real "who and how" page.** A rig table (owner fills in, nothing invented: device · OS version · browsers · owned since), a link to the public repo, a link to the dataset, a contact line (built), and a short "what I got wrong" changelog note. Optional photo.
4. **Stamps copy.** "Sources checked 26 September 2026" (desk review) and "Tested 3 October 2026 on iPhone 15 · iOS 26.0 · Safari 26" (device). Link each stamp to its dataset row.
5. **Show corrections.** When a fact changes (for example, the battery-saver claim), add a dated line under the article: "Corrected 30 September 2026: an earlier version said battery saver blocks the wake lock. Chromium's source has no such check." This is trust-building, and it is honest.
6. **Author markup inline** on every Article (T-12), plus `Person.sameAs` on `/about`.

---

## 9. Link earning that fits an honest utility

| # | Asset | Who links, and why | Needs | Effort | Guardrail |
|---|---|---|---|---|---|
| L1 | **Open wake-lock behaviour dataset** (`/data/wake-lock.json` + CSV, CC BY 4.0, `Dataset` schema, in the public repo) | Developers, MDN/caniuse contributors, bloggers: it has what they lack (hidden-tab release, Low Power Mode, iOS Home Screen, Document PiP, real devices) | The device run | M | Every row dated, with a method; untested = blank, not guessed |
| L2 | **Live Wake Lock test page** (`/learn/wake-lock-test`) | Developers debugging, bug reports ("paste this report"), Q&A answers | Small script; reuses `@awaketab/wake` | M | Runs locally; sends nothing |
| L3 | **Myth-buster: "Battery saver doesn't block wake locks"** | Frontend newsletters, HN, Stack Overflow answers: it corrects a claim repeated across the web, with engine source links | The fact-check (done) + device confirmation | S | Cite engine lines; say what we couldn't verify |
| L4 | **`@awaketab/wake` on npm + GitHub** | "NoSleep.js alternative" searchers; package READMEs; awesome-lists | Publish; fix `sameAs` | M | Don't open promotional issues on other repos (market.md §5.4) |
| L5 | **Embed credit in the host page** (fixes summary point 7) | Recipe and classroom sites that use the widget | docs/11 change (OD-6) | S | Branded anchor ("AwakeTab"), visible, pointing at `/embed` or `/for/cooking`, `rel="nofollow"` by default: Google lists "keyword-rich, hidden, or low-quality links embedded in widgets" and "widely distributed links in the footers or templates of various sites" as link spam [V]. The value is referral traffic and brand, not PageRank |
| L6 | **The best Teams-status explainer online** | Journalists and forum answerers covering jigglers; Microsoft Q&A answers | Quote Microsoft docs; the 2024 Wells Fargo dismissals as context (Bloomberg) | S | Never give tips to fake presence |
| L7 | **AlternativeTo listing** against nosleep.page, Caffeine, Amphetamine, PowerToys Awake, Keep Awake | AlternativeTo visitors; it ranks for "X alternative" | 30 minutes | S | Honest description; no incentivised likes |
| L8 | **Show HN** on the library, dataset and test page, with the tool as the demo | HN; follow-on blog posts | L1, L2, L4 | S | Per market.md §5.3 rules |

---

## 10. SEO KPIs

Sources: Search Console (GSC), Bing Webmaster, first-party analytics (docs/18), the Ahrefs free backlink checker or GSC Links. Targets are [E] and assume the launch set ships at day 0.

| KPI | Definition | Day 30 | Day 60 | Day 90 |
|---|---|---|---|---|
| Index coverage | `ready` URLs indexed ÷ `ready` URLs submitted | ≥ 70 % | ≥ 85 % | ≥ 90 % |
| Draft leakage | `draft` URLs in sitemap or index | 0 | 0 | 0 |
| Non-brand impressions | GSC impressions excluding "awaketab" | Baseline | ×3 baseline | ×6 baseline |
| Long-tail top-10s | EN queries at average position ≤ 10 with ≥ 10 impressions/28 d | 5 | 15 | 30 |
| Cluster share | Impressions by cluster (§1.2) | Reported | Reported | Clusters C, E, I ≥ 60 % of non-brand |
| CTR vs position | CTR for queries at positions 1–5 compared with the site median | Reported | Fix titles under the median | — |
| Organic tool starts | `session_start` where the landing page came from organic search ÷ organic landings | Baseline | +10 % | +20 % |
| Honest-exit clicks | Clicks to the extension, library, caffeinate/lid guides from "can't" lines | Reported | Reported | Reported |
| Referring domains | Unique, non-spam | 3 | 10 | 20 |
| Dataset/test page links | Referring domains to L1 + L2 | — | 3 | 8 |
| Freshness | `ready` pages with a "Tested" stamp < 180 days | 50 % | 75 % | 90 % |
| Duplication | Max 8-word shingle overlap between `ready` pages | ≤ 2 % | ≤ 2 % | ≤ 2 % |
| Core Web Vitals | CrUX p75 (when data exists) | Good | Good | Good |

Replace docs/06 §16's day-90 target ("top 10 for queries 1–3 in three locales") with the table above; head-term goals move to day 180 and depend on links.

Add these queries to the tracked list in docs/18 §5: keep screen awake website · keep laptop awake online · keep computer awake without software · claude code keep computer awake · screen wake lock is not allowed in this document · wake lock demo · windows 11 screen turns off after 1 minute · iphone auto lock greyed out · keep laptop on when closed · keep screen on while viewing samsung.

---

## 11. Concrete assets

### 11.1 Article JSON-LD (replaces the cross-page author `@id`)

```json
{
  "@type": "Article",
  "headline": "Windows 11 screen turns off after 1 minute: how to fix it",
  "description": "Three usual causes: the lock screen's own 60-second display timeout, a 1-minute power setting, or a work policy. How to check each, with exact steps.",
  "url": "https://awaketab.com/guides/windows-11-screen-turns-off-after-1-minute",
  "mainEntityOfPage": "https://awaketab.com/guides/windows-11-screen-turns-off-after-1-minute",
  "datePublished": "2026-09-09",
  "dateModified": "<git date of this file>",
  "inLanguage": "en",
  "author": { "@type": "Person", "name": "Soubhik Biswas", "url": "https://awaketab.com/about" },
  "publisher": { "@id": "https://awaketab.com/#org" },
  "image": "https://awaketab.com/og/en/guides/windows-11-screen-turns-off-after-1-minute.png"
}
```

### 11.2 Dataset JSON-LD (support matrix)

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Screen Wake Lock behaviour by browser, OS and device",
  "description": "Whether a web page can keep the screen on, tested on real devices: browser and OS versions, power state, hidden-tab release, Low Power Mode, iOS Home Screen apps and the video fallback. Each row has a test date and method; untested cases are left blank.",
  "url": "https://awaketab.com/learn/browser-support-matrix",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "creator": { "@type": "Person", "name": "Soubhik Biswas", "url": "https://awaketab.com/about" },
  "temporalCoverage": "2026-09/..",
  "distribution": [
    { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://awaketab.com/data/wake-lock.json" },
    { "@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": "https://awaketab.com/data/wake-lock.csv" }
  ]
}
```

### 11.3 Embed credit (host-page HTML, part of the copied snippet)

```html
<script async src="https://awaketab.com/embed.js" data-mode="cook"></script>
<p class="awaketab-credit">Cook mode by <a href="https://awaketab.com/embed" rel="nofollow">AwakeTab</a></p>
```

### 11.4 Honest home sentence (replaces the "device on a shelf" line)

> AwakeTab is built by Soubhik Biswas. Support claims come from browser documentation and source code, last checked {date}. Device tests are under way; each page shows its own test date as results are recorded, and the raw results are public.

---

## 12. Prioritised actions

| # | Action | Why | Effort | Impact | Owner / where |
|---|---|---|---|---|---|
| 1 | Register awaketab.com (or pick the domain and change `SITE`) | Every SEO signal points there; it is unregistered (T-01) | S | H | Owner; `scripts/sitemap.mjs`, `src/lib/seo.ts`, `embed/cook.astro` |
| 2 | Remove the "device on a shelf" sentence; use §11.4 | Claim not backed by records (§8) | S | H | `src/pages/index.astro:394` |
| 3 | Quality gate: `quality: draft\|ready`; all 51 `draft` → `noindex`, out of sitemap/IndexNow, no ads | Avoid a scaled-content first impression (§3) | M | H | `content.config.ts`, `ArticlePage.astro`, `scripts/sitemap.mjs`, `scripts/indexnow.mjs`; docs/06 §3 |
| 4 | Retire `write-content.mjs`; add `content:lint` (shingles, duplicate FAQs, whole-sentence descriptions, banned tokens, exact pill strings) | Stop the template coming back | M | H | `apps/web/scripts`, CI; docs/06 §13, docs/13 |
| 5 | Run the 14-row device matrix with recordings | Unlocks stamps, `/on` pages, dataset, test page, Show HN | M | H | Owner; `docs/metrics/device-matrix.json` |
| 6 | Split the stamp into "Sources checked" and "Tested on" | Truthful freshness (§8) | S | H | `ArticlePage.astro`, `en.json` `content.verified`; docs/06 FR-CONTENT-01 |
| 7 | Rewrite and ship the 10 pages in §7 plus home and presets | Highest intent × winnability | L | H | `src/content/*/en/*.md`, `[preset].astro`, `index.astro`, `en.json` |
| 8 | Per-file `lastmod` and `dateModified` | T-03 | S | M | `scripts/sitemap.mjs`, `lib/seo.ts` |
| 9 | Home and static-path hreflang reciprocity + test | T-08 | S | H (at locale launch) | `index.astro`, `scripts/sitemap.mjs`, `test/seo` |
| 10 | `/until`: drop the cross-canonical, fix the H1 suffix, 12-hour en times | T-05, T-06 | S | M | `until/[time].astro` |
| 11 | Delete `public/sitemap-0.xml` and `public/sitemap-index.xml` | T-04 | S | L | `apps/web/public` |
| 12 | Fix `sameAs` and the library GitHub link; inline Article author | T-11, T-12 | S | M | `lib/seo.ts`, `library.astro:166` |
| 13 | `data-nosnippet` on the tool island's chrome | T-14 | S | M | `ToolIsland.astro` / `ToolPanel.astro` |
| 14 | Remove `/embed/` and `/pip` from robots.txt `Disallow` | T-10 | S | L | `public/robots.txt`, robots test |
| 15 | Titles and descriptions: §7 table + editorial audit tables; sentence case | T-15, T-16 | S | H | frontmatter, `en.json` |
| 16 | Publish `@awaketab/wake` on npm; public repo URL in `sameAs` | L4; entity data | M | M | `packages/wake`, docs/12 |
| 17 | Build `/learn/wake-lock-test` and `/learn/wake-lock-notallowederror` | Cluster I demand; link magnets | M | H | new routes after docs/00 §7 (OD-10) |
| 18 | Open dataset + `Dataset` schema | L1 | M | H | `src/data`, `/data/*`, `lib/seo.ts` |
| 19 | Embed credit in the host DOM, branded, `nofollow` | The in-iframe link earns nothing (§9 L5) | S | M | `public/embed.js`, snippet generator, docs/11 (OD-6) |
| 20 | Merges and cuts (§5.3) with 301s | Consolidate signals; drop pages that can't be honest | S | M | `_redirects`, content, docs/00 §7 (OD-3) |
| 21 | New `/guides/laptop-lid-closed` and `/for/classroom` | Clusters D and F gaps (market.md 13, 14) | M | M | content, docs/00 §7 |
| 22 | AlternativeTo listing; Show HN on library + dataset + test page | L7, L8 | S | M | external |
| 23 | Retranslate pt-BR and es from rewritten EN, localised titles, native review | Cluster J | L | M | `src/content/*/{pt-br,es}`, `locale-home` |
| 24 | Content layout by page-type slots in the redesign | T-18 | M | H | canvas `ContentArticle`, `ArticlePage.astro` |
| 25 | Update docs/06 §16 and docs/18 §5 targets and tracked queries | §10 | S | M | docs |

---

## Owner decisions

| # | Decision | Recommendation |
|---|---|---|
| OD-1 | Register awaketab.com now, or confirm a different domain (escalates O-16) | Register today; nothing else in this plan works without it |
| OD-2 | Launch with about 20 `ready` URLs and keep the rest live but `noindex`, instead of launching all 73 | Yes |
| OD-3 | Route changes (docs/00 §7 contract): 301 `/learn/nosleep-js-vs-wake-lock` → `/vs/nosleep-js`; `/for/second-monitor` → `/guides/second-monitor-turns-off`; `/on/windows-10` → `/on/windows-11`; cut `/for/navigation`, `/for/live-streams`, `/for/exams-proctoring`, `/for/baby-monitor`; fold `/guides/modern-standby` | Yes, all |
| OD-4 | Replace the single "Last verified" stamp with "Sources checked" + "Tested on" (changes docs/06 FR-CONTENT-01 and `en.json`) | Yes |
| OD-5 | Remove the home "device on a shelf" claim now, or do the device run before launch | Both: remove now, run within 3 weeks |
| OD-6 | Embed attribution: add a visible host-page credit, branded, `rel="nofollow"` (docs/11 change) | Yes; accept that its value is referral and brand, not rankings |
| OD-7 | License the support dataset CC BY 4.0 and publish it in a public repo | Yes |
| OD-8 | Ads only on content pages that pass the §4 standard (additive rule in docs/09) | Yes |
| OD-9 | Retarget `/for/ai-agents` to terminal and desktop agents, naming Claude Code and Codex in the copy | Yes |
| OD-10 | New routes: `/learn/wake-lock-test`, `/learn/wake-lock-notallowederror`, `/guides/laptop-lid-closed`, `/for/classroom`, `/data/*` | Yes, in that order |
| OD-11 | `/until`: keep 288 static files or switch to one rewritten template | Switch when the tool is rebuilt; drop the cross-canonical now either way |
| OD-12 | Teams page title: the question form (§7 #6) or market.md's non-targeting form | Question form, answered "No" in the description |
| OD-13 | Replace docs/06 §16 day-90 targets with §10 of this file | Yes |

---

## Sources (accessed 26–27 Sep 2026)

- Google autocomplete, US English: `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=…` (seeds listed in §1.2) [V]
- `whois awaketab.com` and `dig awaketab.com` from the author's machine, 26 Sep 2026: "No match", no A or NS records [V]
- `curl -I https://awaketab.pages.dev/`: `x-robots-tag: noindex` [V]
- Google Search Central, spam policies (scaled content abuse; link spam in widgets and templates): https://developers.google.com/search/docs/essentials/spam-policies [V]
- Google Search Central, consolidate duplicate URLs (noindex vs canonical): https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls [V]
- Google Search Central, SoftwareApplication structured data (rating or review required): https://developers.google.com/search/docs/appearance/structured-data/software-app [V]
- Google Search Central, Dataset structured data: https://developers.google.com/search/docs/appearance/structured-data/dataset [V]
- Search Engine Journal, "Google Drops FAQ Rich Results From Search" (7 May 2026; HowTo already gone): https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/ [V]
- Microsoft Learn, "Monitor powers off when computer is locked" (60 s by design, `powercfg` fix): https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/monitor-powers-off-when-pc-locked [V]
- Apple Support, Low Power Mode sets Auto-Lock to 30 seconds: https://support.apple.com/en-us/101604 (via fact-check) [V]
- Microsoft Learn, Teams presence (Away after about 5 minutes): https://learn.microsoft.com/en-us/microsoftteams/presence-admins (via fact-check) [V]
- Bloomberg, "Wells Fargo Fires Over a Dozen for 'Simulation of Keyboard Activity'" (13 Jun 2024): https://www.bloomberg.com/news/articles/2024-06-13/wells-fires-over-a-dozen-for-simulation-of-keyboard-activity [S]
- Competitor pages fetched: https://keepscreenawake.org/ · https://nosleep.page/ · https://www.keep-awake.com/ · https://screenawake.com/ · https://www.keepscreenon.com/ [V]
- Search-tool result snapshots (not Google SERPs) for: keep screen awake online; keep screen on website; iphone auto lock never greyed out; windows 11 screen turns off after 1 minute; keep screen on while cooking recipe; nosleep.js alternative; how to keep teams status green; caffeine alternative mac; how to keep iphone screen on; keep chromebook screen on; powertoys awake keep screen on; mouse jiggler alternative; night clock online fullscreen [S]
- npm registry `@awaketab/wake` → 404; https://github.com/awaketab → 404; https://github.com/SoubhikBiswas-gitHub/awaketab → 200 [V]
- Repo files read: `apps/web/scripts/sitemap.mjs`, `src/lib/seo.ts`, `src/pages/until/[time].astro`, `src/pages/[preset].astro`, `src/pages/index.astro`, `src/pages/about.astro`, `src/components/ArticlePage.astro`, `src/i18n/locales.ts`, `src/i18n/en.json`, `src/data/support-matrix.json`, `src/content/*/en/*.md`, `public/_headers`, `public/_redirects`, `public/robots.txt`, `public/embed.js`, `src/pages/embed/cook.astro`, `docs/metrics/device-matrix.json`, `docs/metrics/lighthouse-local-2026-09-26.md`, `dist/` (built 26 Sep 2026 20:59); canvas boards `ContentArticle`, `PageAbout`, `PresetPage`, `UntilPage` [V]
