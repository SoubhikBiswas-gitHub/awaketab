# 06 · Content and SEO specification

Status: v1.0 · 2026-09-07 · Owner: Soubhik

**Purpose.** This document turns the blueprint's SEO plan into build rules: the information architecture, the page template for every route family, the MDX frontmatter schema, title/description/canonical/hreflang/sitemap/robots rules, JSON-LD per page type, OG image generation, internal linking, the content quality bar, the complete slug lists with intent, embedded scenario and honest limit for every page, the editorial workflow, freshness cadence and measurement. Everything here is implementable in Astro 5 content collections without a CMS. Identifiers follow `00-conventions.md`; new ones are marked **PROPOSED — add to 00-conventions.md** and listed in §18.

**Related docs.** `00-conventions.md` §7 (routes, slugs, locales) · `05-frontend-spec.md` (tool embed, layout, `data-preset`/`data-mode`) · `07-i18n.md` (translated slugs, string files, translation workflow) · `09-monetization-impl.md` (ad slots on content pages, gates G1–G4) · `13-testing-strategy.md` (SEO checks in CI) · `14-devops.md` (build, IndexNow key, Search Console) · `awaketab-blueprint.md` §02, §04, §08.

---

## 1. Information architecture

Hub-and-spoke with one hub (`/`), five spoke families, one product family and one trust family. Every spoke links up to its hub section on `/`, sideways to 3–5 siblings, and down to the tool route it recommends.

| Family | Route | Count (EN) | Hub link on `/` | Indexable |
|---|---|---|---|---|
| Home | `/` | 1 | — | yes |
| Preset pages | `/15m` `/30m` `/45m` `/1h` `/2h` `/4h` `/8h` | 7 | chips | yes (self-canonical) |
| Until deep links | `/until/HH-MM` | ∞ | — | no (`noindex`, canonical `/`) |
| Scenarios | `/for/{slug}` | 18 | "Scenarios" grid | yes |
| Devices and browsers | `/on/{slug}` | 12 | "Devices" row | yes |
| Comparisons | `/vs/{slug}` | 7 | "Alternatives" | yes |
| OS how-tos | `/guides/{slug}` | 8 | Honest-limits callout | yes |
| Deep and developer | `/learn/{slug}` | 6 | Support matrix, footer | yes |
| Product | `/pro` `/pro/activate` `/pro/manage` `/extension` `/embed` `/kiosk` `/library` | 7 | Pro strip, product cards | `/pro/activate` `/pro/manage` `noindex`; rest yes |
| Trust | `/about` `/privacy` `/terms` `/changelog` `/support-matrix` `/how-we-tested` | 6 | Footer, author box | yes |
| Apps | `/embed/cook` `/pip` `/404` | 3 | — | no |

Route conflicts to resolve (**PROPOSED — decide in 00-conventions.md**): `/support-matrix` duplicates `/learn/browser-support-matrix` and `/how-we-tested` duplicates `/learn/how-we-tested`. Recommendation: the short trust URLs `301` to the `/learn/*` articles, which carry the content; the trust pages then exist only as redirects, keeping one indexable URL per topic.

The English total is 66 indexable URLs (1 + 7 + 18 + 12 + 7 + 8 + 6 + 5 + 2 trust after redirects). Locales replicate the content families and the tool routes; product pages localize in phase 3.

---

## 2. Page templates

Every template shares: one `<h1>` matching the target intent; the answer in the first 100 words; the tool island (`05-frontend-spec.md` §2) above the fold with the scenario preset via `data-preset` and `data-mode`; a 3–5 item FAQ as `<details>`; breadcrumbs; related links; the author box; a "Last verified" line where facts depend on software versions; and no ad slot above the fold on any page (`09-monetization-impl.md`).

### 2.1 `/` — home

Sections in order (also in `05-frontend-spec.md` §4.2): tool → answer paragraph → how it works → honest limits → support matrix → scenarios grid → devices → comparisons → 8 FAQs → Pro strip and product cards → author box + footer. Word bar 1,200–1,800. `<h1>` "Keep your screen awake" (locale equivalents in `07-i18n.md`). Preset `p30`, mode `standard`.

### 2.2 Preset pages `/15m` … `/8h`

Purpose: indexable landing pages for "keep screen on for 30 minutes"-type queries and share targets. Sections: tool (preset pressed, `autostart` off) → 150–300 words: what starts, what happens at the end (`ExtendPrompt`), how to change → three related presets → link to `/`. Word bar 150–300; `<h1>` "Keep your screen awake for 30 minutes". Self-canonical; hreflang to `/{lang}/30m` (numeric slugs are not translated). No FAQ, no ads.

### 2.3 `/for/{slug}` — scenarios

Sections: tool with scenario preset/mode → answer paragraph (why this scenario needs a wake lock and what AwakeTab does) → "Set it up in 30 seconds" (3 steps, screenshots for one phone and one desktop) → what to expect (timer end, pill states you'll see) → **honest-limit callout** (`<aside class="limit">`, required, from §12 table) → related devices and guides → 3–5 FAQs → author box + last verified. Word bar 600–1,000. Ads (from G1): one in-content unit after "Set it up", one at the end, mobile anchor; never inside the tool or callout.

### 2.4 `/on/{slug}` — devices and browsers

Sections: tool (preset per §12) → support statement in the first sentence ("Safari 16.4 and later supports the Wake Lock API; on iPhone the tab must stay in the foreground.") → version table (browser / OS versions tested, result, date) → device-specific steps with screenshots → known blockers (Low Power Mode, Battery Saver, policies) linking `/guides/*` → honest limit → FAQs → **"Last verified: 2026-08-30 on iOS 26.0 / Safari 26"** line (required on every `/on/*` page) → author box. Word bar 600–900.

### 2.5 `/vs/{slug}` — comparisons

Sections: tool → verdict paragraph in the first 100 words (who should use which) → comparison table (mechanism, works with tab hidden, install needed, platforms, price, last updated) → "When the alternative is the better choice" (required — honest, at least two cases) → "When AwakeTab is" → honest limit → FAQs. Word bar 700–1,000. Competitor names in `<h1>` as "AwakeTab vs Caffeine"; never disparaging, facts dated.

### 2.6 `/guides/{slug}` — OS how-tos

The how-to is the answer; the tool is the shortcut. Sections: answer paragraph (cause in one sentence) → numbered steps with screenshots per OS version → "If the setting is greyed out" → "Or skip the settings: open AwakeTab" with the tool embedded here (mid-page, `data-preset`) → honest limit → FAQs → last verified. Word bar 700–1,100. `<h1>` states the problem ("Windows 11 screen turns off after 1 minute — how to fix it").

### 2.7 `/learn/{slug}` — deep and developer

Sections: abstract (first 100 words) → body with `<h2>` per question, code blocks for API pages → methodology and dates for tests → results table → limits → "Try it" tool embed at the end → related. Word bar 1,200–2,000. `Article` schema with `dateModified`. Code samples use `@awaketab/wake`.

### 2.8 Trust pages

`/about`: real name, photo, testing rig list (devices, OS versions), contact, "no ads on the awake screen" statement, `Person` schema. `/privacy` and `/terms`: plain language, `dateModified`. `/changelog`: monthly entries, newest first, each dated. Word bar: as needed, no filler.

---

## 3. MDX frontmatter schema

`apps/web/src/content.config.ts` defines one schema shared by the five collections (`for`, `on`, `vs`, `guides`, `learn`); collection-specific fields are refined per collection.

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const locales = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;
const presets = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf', 'custom', 'until'] as const;
const modes = ['standard', 'clock', 'focus', 'minimal', 'night', 'message', 'cook'] as const;
const browsers = ['chrome', 'edge', 'firefox', 'safari', 'samsung-internet', 'opera', 'brave'] as const;
const oses = ['windows', 'macos', 'linux', 'chromeos', 'android', 'ios', 'ipados'] as const;

const faq = z.object({ q: z.string().max(120), a: z.string().min(40).max(600) });

export const page = z.object({
  title: z.string().max(60),                       // "<Intent phrase> — AwakeTab" ≤ 60 chars, validated below
  description: z.string().min(70).max(155),
  h1: z.string().max(70),
  intent: z.string().max(80),                      // the target query, lowercase
  secondaryQueries: z.array(z.string()).max(8).default([]),
  preset: z.enum(presets).default('p30'),
  mode: z.enum(modes).default('standard'),
  locale: z.enum(locales),
  translationOf: z.string().optional(),            // EN slug this page translates; absent on EN
  lastVerified: z.coerce.date().optional(),        // required for /on and /guides (refined per collection)
  browsers: z.array(z.enum(browsers)).default([]),
  os: z.array(z.enum(oses)).default([]),
  faq: z.array(faq).min(3).max(5),
  honestLimit: z.string().min(60).max(400),        // rendered as the <aside class="limit">
  related: z.array(z.string()).min(3).max(6),      // route paths, e.g. "/for/presentations"
  noindex: z.boolean().default(false),
  ogTitle: z.string().max(48).optional(),          // shorter title for the OG image; falls back to h1
  author: z.literal('soubhik').default('soubhik'),
  published: z.coerce.date(),
  updated: z.coerce.date().optional(),             // falls back to git commit date at build
}).refine(p => p.title.endsWith(' — AwakeTab'), { message: 'title must end with " — AwakeTab"' });

const withVerified = page.refine(p => !!p.lastVerified, { message: 'lastVerified required' });

export const collections = {
  for:    defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/for' }),    schema: page }),
  on:     defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/on' }),     schema: withVerified }),
  vs:     defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/vs' }),     schema: withVerified }),
  guides: defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }), schema: withVerified }),
  learn:  defineCollection({ loader: glob({ pattern: '**/*.mdx', base: './src/content/learn' }),  schema: page }),
};
```

Files live at `src/content/{collection}/{locale}/{slug}.mdx`; the EN slug is the file name for every locale, and the *translated public slug* comes from `src/i18n/slugs.json` (§6). The build fails on any schema error, so the frontmatter is the fact-check contract.

---

## 4. Title, description, canonical

- **Title formula**: `{Intent phrase} — AwakeTab`, ≤ 60 characters including the suffix; the intent phrase is the `<h1>` or a shorter form of it. Examples: "Keep your screen on while cooking — AwakeTab" (45), "Keep iPhone screen on in Safari — AwakeTab" (43), "AwakeTab vs Caffeine — AwakeTab" is wrong (duplicate brand) → "AwakeTab vs Caffeine: which keeps your screen on?" (49, brand already present; the suffix rule is waived when the title starts with the brand).
- **Meta description**: 70–155 characters, states the answer and the limit ("Keeps your screen awake with the browser's Wake Lock API while the tab is visible. Free, no install. Not for hidden tabs — for that, use the extension."), no ellipsis, no "click here", unique per URL and per locale (CI checks duplicates).
- **Canonical**: absolute `https://awaketab.com{path}` (or `/{lang}{path}`), self-referential on every indexable page; preset pages self-canonical; `/until/*` canonical `/` (with `noindex`); `/embed/*`, `/pip`, `/pro/activate`, `/pro/manage`, `/404` `noindex, follow` via `<meta name="robots">`; query strings are never part of the canonical (the island strips them client-side too, `05-frontend-spec.md` §10). Trailing slashes are removed by `_redirects` (`/for/cooking/` → `/for/cooking` 301).
- `<meta name="robots" content="max-image-preview:large">` on content pages.

---

## 5. hreflang

- Every indexable page emits one `<link rel="alternate" hreflang="…">` per locale where a translation exists (**reciprocal** — each translation lists all the others), plus a **self** reference, plus `hreflang="x-default"` pointing at the EN URL. A page with no translations still emits self + `x-default`.
- Locale codes in hreflang: `en`, `es`, `pt-BR`, `de`, `fr`, `ja`, `zh-Hans`, `hi` (BCP 47 casing differs from the folder names `pt-br`, `zh`; the mapping lives in `src/i18n/locales.ts`).
- Locale subfolders only (`/es/for/cocinar`), no ccTLDs, no `?lang=`. The English page is at the root; no `/en/` prefix exists (redirect `/en/*` → `/*` 301).
- The same alternates are repeated in the sitemap (`xhtml:link`), and the two sources must agree — a CI test parses the built HTML and the sitemaps and fails on any asymmetric pair.
- Translated slugs: Latin-script locales (`es`, `pt-br`, `de`, `fr`) translate slugs; `ja`, `zh`, `hi` keep the English slug (readable when shared, no percent-encoding). Mapping file `src/i18n/slugs.json` (**PROPOSED — add to §4 repository layout**), keyed by collection and EN slug:

```json
{
  "for": {
    "cooking": { "es": "cocinar", "pt-br": "cozinhar", "de": "kochen", "fr": "cuisine" },
    "presentations": { "es": "presentaciones", "pt-br": "apresentacoes", "de": "praesentationen", "fr": "presentations" },
    "night-clock": { "es": "reloj-nocturno", "pt-br": "relogio-noturno", "de": "nachtuhr", "fr": "horloge-de-nuit" }
  },
  "on": {
    "iphone-safari": { "es": "iphone-safari", "pt-br": "iphone-safari", "de": "iphone-safari", "fr": "iphone-safari" },
    "windows-11": { "es": "windows-11", "pt-br": "windows-11", "de": "windows-11", "fr": "windows-11" }
  }
}
```

Missing entries fall back to the EN slug. Slugs are ASCII only (no diacritics: `praesentationen`, `apresentacoes`), lowercase, hyphenated, ≤ 60 chars.

---

## 6. Sitemaps and robots

`https://awaketab.com/sitemap-index.xml` lists one sitemap per locale: `sitemap-en.xml`, `sitemap-es.xml`, … `sitemap-hi.xml`. Each `<url>` carries `<loc>`, `<lastmod>` and the `xhtml:link` alternates. `lastmod` is real: the MDX file's last git commit date (`git log -1 --format=%cI -- <file>` at build; Cloudflare Pages needs `fetch-depth: 0` in CI, see `14-devops.md`), overridden by frontmatter `updated` when later; for the tool routes, the date of the last change to the tool island or layout. No `<priority>`/`<changefreq>`. Excluded: everything `noindex`, `/api/*`, `/until/*`. A custom Astro integration (`src/lib/sitemap.ts`) replaces `@astrojs/sitemap` because the latter cannot read git dates; output is validated in CI against the sitemap XSD.

`public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /pip
Disallow: /embed/

Sitemap: https://awaketab.com/sitemap-index.xml
```

No AI-crawler blocks in v1 (the content is the marketing). `ads.txt` is added at G1 (`09-monetization-impl.md`).

---

## 7. Structured data (JSON-LD)

Generated by `src/lib/seo.ts` from frontmatter and site config; one `<script type="application/ld+json">` per page containing a `@graph`. Only types Google still renders or uses for entity understanding: `WebSite`, `Organization`, `WebApplication`, `Article`, `BreadcrumbList`, `Person`. `FAQPage` and `HowTo` are **not emitted** (rich results removed May 2026 and Sept 2023 respectively); FAQs remain content.

### 7.1 Home

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://awaketab.com/#org",
      "name": "AwakeTab",
      "url": "https://awaketab.com/",
      "logo": { "@type": "ImageObject", "url": "https://awaketab.com/icons/icon-512.png", "width": 512, "height": 512 },
      "founder": { "@id": "https://awaketab.com/about#person" },
      "sameAs": ["https://github.com/awaketab", "https://www.npmjs.com/package/@awaketab/wake"]
    },
    {
      "@type": "WebSite",
      "@id": "https://awaketab.com/#website",
      "url": "https://awaketab.com/",
      "name": "AwakeTab",
      "publisher": { "@id": "https://awaketab.com/#org" },
      "inLanguage": "en"
    },
    {
      "@type": "WebApplication",
      "@id": "https://awaketab.com/#app",
      "name": "AwakeTab",
      "url": "https://awaketab.com/",
      "description": "Keeps your screen awake with the browser's Wake Lock API. Presets, until-time, clock modes. No account, no tracking.",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Any (web browser)",
      "browserRequirements": "Requires a browser with the Screen Wake Lock API (Chrome 84, Edge 84, Firefox 126, Safari 16.4) or a video fallback.",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "featureList": ["Screen Wake Lock", "Timer presets", "Until a clock time", "Ambient clock modes", "Picture-in-Picture", "Offline PWA"],
      "screenshot": "https://awaketab.com/screens/phone-held.png",
      "author": { "@id": "https://awaketab.com/#org" },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.7",
        "ratingCount": "312",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  ]
}
```

`aggregateRating` is emitted **only when** the ratings export has ≥ 25 submitted ratings. The export is `data/ratings.json` (**PROPOSED — build input written by a scheduled Worker from the KV store fed by `POST /api/rating`, see `05-frontend-spec.md` §3.22**) with `{ count, average, updatedAt }`; the build reads it, rounds `ratingValue` to one decimal, and omits the property entirely below the threshold. Ratings come solely from the in-app `RatingPrompt` — never from testimonials, store reviews or invented numbers. Locale homes reuse the same `@id`s and set `inLanguage`.

### 7.2 Content pages (`/for`, `/on`, `/vs`, `/guides`, `/learn`)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://awaketab.com/for/cooking#article",
      "headline": "Keep your screen on while cooking",
      "description": "…",
      "inLanguage": "en",
      "datePublished": "2026-09-20",
      "dateModified": "2026-10-04",
      "author": { "@id": "https://awaketab.com/about#person" },
      "publisher": { "@id": "https://awaketab.com/#org" },
      "mainEntityOfPage": "https://awaketab.com/for/cooking",
      "image": "https://awaketab.com/og/en/for/cooking.png",
      "about": { "@id": "https://awaketab.com/#app" },
      "isPartOf": { "@id": "https://awaketab.com/#website" }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "AwakeTab", "item": "https://awaketab.com/" },
        { "@type": "ListItem", "position": 2, "name": "Scenarios", "item": "https://awaketab.com/for" },
        { "@type": "ListItem", "position": 3, "name": "Cooking", "item": "https://awaketab.com/for/cooking" }
      ]
    }
  ]
}
```

`/for`, `/on`, `/vs`, `/guides`, `/learn` index pages exist as simple hub lists so breadcrumb item 2 resolves (**PROPOSED — add the five hub index routes to §7**). `dateModified` equals the sitemap `lastmod`. Visible breadcrumbs (`<nav aria-label="Breadcrumb">`) render the same items.

### 7.3 `/about`

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://awaketab.com/about#person",
  "name": "Soubhik <surname>",
  "url": "https://awaketab.com/about",
  "image": "https://awaketab.com/img/soubhik.jpg",
  "jobTitle": "Developer, AwakeTab",
  "worksFor": { "@id": "https://awaketab.com/#org" },
  "knowsAbout": ["Screen Wake Lock API", "Progressive Web Apps", "Browser power management"],
  "sameAs": ["https://github.com/<handle>", "https://www.linkedin.com/in/<handle>"]
}
```

Product pages (`/pro`, `/extension`, `/embed`, `/library`) reuse `WebApplication`/`SoftwareApplication` with their own `offers` (Pro: `price` `12`, `priceCurrency` `USD`, `category` "subscription"); no `aggregateRating` on those.

---

## 8. FAQ policy

Each content page has 3–5 FAQs written as `<details><summary>question</summary><p>answer</p></details>` inside a `<section aria-labelledby="faq">`. They answer real follow-ups (from HN comments, competitor FAQs, GSC "People also ask"), 40–600 characters each, and never repeat the body. No `FAQPage` markup; no expectation of rich results; their value is covering secondary queries and reducing bounce.

---

## 9. OG images

1200 × 630 PNG per page and locale, generated at build in `src/lib/og.ts` with satori + resvg (`00-conventions.md` §3), written to `/og/{lang}/{collection}/{slug}.png` (home: `/og/{lang}/home.png`). Composition: light ground `#FAF7F2`; a 220 px ring at left in `#B86E00` with the 12-o'clock dot; `ogTitle` (fallback `h1`) at 64 px, max three lines, `text-wrap: balance`; the locale name in its own language ("Español") in 24 px muted; "awaketab.com" bottom-right. Fonts for satori are build-time only (Noto Sans variants per script under `tools/fonts/`); nothing ships to the client. Tags: `og:image`, `og:image:width/height`, `og:image:alt` (= `h1`), `twitter:card summary_large_image`, `og:locale` and `og:locale:alternate` for each translation. Regenerated only when `h1`/`ogTitle` changes (hash-cached in CI).

---

## 10. Internal linking

- Every content page links **up** to `/` (logo, breadcrumb) and to its family hub; **sideways** to 3–6 `related` from frontmatter, rendered as cards with the target's `h1` as anchor text; **down** to the exact tool route it recommends (`/30m`, `/until/…`) using the duration as anchor ("start a 30-minute session").
- Anchor text is the target's intent phrase, never "here", "this page" or a bare URL. Vary phrasing across pages; no site-wide footer link farms (footer carries only trust, product and locale links).
- Scenario ↔ device ↔ guide triangles are mandatory where they exist (e.g. `/for/sheet-music` → `/on/ipad` → `/guides/iphone-auto-lock-never-greyed-out`).
- `/vs/*` pages link to `/learn/*` evidence, never to the competitor's pricing page with money anchors; external links to competitors are plain (`rel` empty) — honest citations, not `nofollow` games.
- Max 100 links per page; in-body links ≤ 12.

---

## 11. Content quality bar

Every page passes this checklist before publish (Google's helpful-content and "people-first" guidance, restated as tests):

1. Written from **tested experience**: names the browser versions, OS versions and the date the author tested; screenshots are the author's own, dated in the caption.
2. **Specific facts** over adjectives: "Safari 16.4 (March 2023) added the Wake Lock API" not "modern browsers support it".
3. **Honest limit** present and prominent (`<aside class="limit">`), stating when the page's promise fails.
4. **No templated filler**: no paragraph may appear on more than one page (CI shingles 8-word windows across the collection and fails on duplicates > 2 %); no "In today's fast-paced world".
5. **The reader can act** within the first screen: the tool or the first step is above the fold.
6. **Sources cited** for any claim about a third party (link to the vendor doc with an access date).
7. **Freshness signal**: `lastVerified` or `updated` visible and truthful.
8. **Native-reviewed** for non-EN.
9. Reading level ≈ grade 8 (Hemingway), active voice, second person.
10. Word bar met without padding; shorter is fine if complete.

---

## 12. Slug lists with intent, embed and honest limit

`preset`/`mode` are the `data-preset`/`data-mode` values on the embedded tool. Honest limits are the sentence the `<aside class="limit">` must convey (edit for voice, keep the fact).

### 12.1 `/for/` — 18 scenarios

| Slug | Intent (target query) | Preset / mode | Honest limit |
|---|---|---|---|
| `cooking` | keep screen on while cooking | `pinf` / `cook` | Works while the AwakeTab tab is on screen; opening another app on a phone releases the lock until you return. |
| `presentations` | keep screen on during presentation | `p120` / `standard` | Full-screen slide apps hide the tab; use the PiP pill (Chromium) or the extension, and remember the projector still follows the OS display timeout. |
| `downloads` | keep computer awake while downloading | `pinf` / `standard` | Keeps the display on; whether idle system sleep is also held off varies by OS (Chromium on Windows: yes in our tests; macOS: no). Closing the lid always sleeps. |
| `ai-agents` | keep browser awake while ai agent runs | `pinf` / `minimal` | Keeps the screen on; it cannot stop a site's own inactivity timeout or the throttling of a hidden agent tab. |
| `dashboards` | keep dashboard screen on | `pinf` / `minimal` | AwakeTab must stay visible on the same display as the dashboard (split-screen, second window or its own monitor). Use `?autostart=1`. |
| `kiosk` | keep screen on kiosk browser | `pinf` / `minimal` | Not a kiosk browser: no lockdown, no auto-launch. Pair it with the OS kiosk mode; see `/kiosk` for the licence. |
| `sheet-music` | keep ipad screen on for sheet music | `p60` / `minimal` | Needs Split View next to the score app; Low Power Mode forces a 30 s lock regardless. |
| `reading` | keep screen on while reading | `p60` / `minimal` | Only the visible tab is protected; for a reading app, use split-screen with AwakeTab beside it. |
| `night-clock` | night clock online oled | `pinf` / `night` | A screen on all night needs power — plug in. Pixel shift reduces OLED burn-in risk but cannot remove it. |
| `baby-monitor` | keep phone screen on baby monitor | `pinf` / `standard` | AwakeTab is not a safety device and must share the screen with a web-based monitor; battery auto-stop is Chromium-only. |
| `navigation` | keep screen on while navigating maps | `pinf` / `standard` | Native map apps hide the browser; works only with web maps in split-screen. Expect heavy battery use. |
| `video-calls` | keep screen on during video call | `p60` / `standard` | Does not keep Teams, Slack or Zoom "available" — presence follows keyboard and mouse activity, not the display. |
| `live-streams` | keep screen from sleeping while watching stream | `p240` / `standard` | Most players hold their own wake lock while playing; AwakeTab helps when paused, muted or in chat. The tab must stay visible. |
| `teleprompter` | teleprompter keep screen on | `p30` / `minimal` | Not a teleprompter; the prompter page must be visible alongside AwakeTab (split view or PiP pill). |
| `workouts` | keep screen on during workout timer | `p45` / `clock` | Sweaty taps can stop the session; lock the phone orientation and keep it plugged in for long sessions. |
| `second-monitor` | keep second monitor from turning off | `pinf` / `clock` | A wake lock holds the OS display timeout for all displays; it cannot fix a monitor that sleeps on its own signal detection or a flaky cable. |
| `work-laptop` | keep work laptop from locking | `p30` / `standard` | Cannot override lid-close sleep, smart-card removal or a lock policy that isn't the display timeout; will not show you as active in Teams. |
| `exams-proctoring` | keep screen on during online exam | `p120` / `minimal` | Never interacts with proctoring software; check your exam rules — a second tab may be forbidden. |

### 12.2 `/on/` — 12 devices and browsers

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `iphone-safari` | keep iphone screen on safari | `p30` / `standard` | Safari 16.4+ only; Low Power Mode forces 30 s Auto-Lock; switching apps releases the lock. |
| `ios-home-screen` | keep screen on iphone web app | `pinf` / `clock` | Wake Lock in Home Screen web apps needs iOS 18.4+; notifications work only in the installed app. |
| `ipad` | keep ipad screen on | `p60` / `minimal` | Split View works; Stage Manager backgrounding and Low Power Mode release or override the lock. |
| `android-chrome` | keep android screen on chrome | `p30` / `standard` | Battery Saver denies the lock; leaving Chrome releases it; some OEM "sleeping apps" settings kill the tab. |
| `samsung-internet` | keep screen on samsung internet | `p30` / `standard` | Samsung Internet 14+ (Chromium 87 base); Samsung "Adaptive battery" and "Put unused apps to sleep" can override. |
| `chromebook` | keep chromebook screen on | `pinf` / `standard` | Managed Chromebooks may enforce power policies AwakeTab cannot override; lid close sleeps. |
| `windows-11` | keep screen on windows 11 | `p60` / `standard` | Battery saver denies the lock; Modern Standby quirks (`/guides/modern-standby`); lid close sleeps. |
| `windows-10` | keep screen on windows 10 | `p60` / `standard` | Same as Windows 11; Chrome's Energy Saver does not block a visible tab. |
| `macos` | prevent mac display sleep in browser | `p60` / `standard` | Display stays on; idle *system* sleep is not held on macOS in our tests; lid close always sleeps; Low Power Mode may shorten. |
| `linux` | keep screen on linux browser | `pinf` / `standard` | Needs a desktop that honours idle-inhibit (GNOME, KDE, Wayland or X11); tested on Ubuntu 24.04 GNOME. |
| `firefox` | keep screen on firefox | `p30` / `standard` | Wake Lock since Firefox 126 (May 2024); older versions use the video fallback with higher CPU. |
| `edge` | keep screen on edge | `p30` / `standard` | Edge 84+; Windows Battery saver denies; Sleeping Tabs affect only background tabs. |

### 12.3 `/vs/` — 7 comparisons

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `caffeine` | caffeine alternative online | `pinf` / `standard` | Caffeine simulates an F15 key press system-wide and works with nothing visible; AwakeTab needs a visible tab. |
| `amphetamine` | amphetamine mac alternative | `pinf` / `standard` | Amphetamine is native, has triggers and closed-lid mode; no browser tab can keep a closed Mac awake. |
| `powertoys-awake` | powertoys awake alternative | `pinf` / `standard` | PowerToys Awake keeps the system awake with the display off; AwakeTab keeps the display on and needs a visible tab. |
| `caffeinate-command` | caffeinate command alternative | `pinf` / `standard` | `caffeinate -di` prevents idle and display sleep from a terminal; AwakeTab holds the display only. |
| `nosleep-page` | nosleep.page alternative | `p30` / `standard` | Both are tabs and both release when hidden; the difference is honesty of status, until-time and persistence. Facts dated. |
| `nosleep-js` | nosleep.js alternative | `pinf` / `standard` | NoSleep.js last shipped Dec 2020; a fallback video costs CPU. `@awaketab/wake` is the maintained option; see `/library`. |
| `mouse-jigglers` | mouse jiggler alternative | `pinf` / `standard` | AwakeTab never simulates input and does not keep Teams or Slack green. Jigglers do, and may breach your employer's policy. |

### 12.4 `/guides/` — 8 OS how-tos

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `windows-11-screen-turns-off-after-1-minute` | windows 11 screen turns off after 1 minute | `p60` / `standard` | On managed PCs the setting is locked by policy; AwakeTab works there only while its tab is visible. |
| `mac-prevent-sleep-lid-closed` | prevent mac sleep lid closed | `pinf` / `standard` | No browser can keep a closed Mac awake; needs an external display and power, or `pmset`/Amphetamine. |
| `iphone-auto-lock-never-greyed-out` | iphone auto lock never greyed out | `p30` / `standard` | Low Power Mode greys it out and forces 30 s; even AwakeTab is overridden until it is off. |
| `chrome-energy-saver` | chrome energy saver | `p30` / `standard` | Energy Saver throttles background tabs; it does not block a visible tab's wake lock, but OS battery saver does. |
| `android-screen-timeout-one-app` | android screen timeout for one app | `p30` / `standard` | Stock Android has no per-app timeout; AwakeTab covers the browser only. |
| `modern-standby` | modern standby keep awake | `pinf` / `standard` | A wake lock controls the display, not S0 low-power states; drivers and firmware decide the rest. |
| `second-monitor-turns-off` | second monitor turns off | `pinf` / `clock` | Signal-detection sleep, DisplayPort link drops and cables are outside any software's reach. |
| `lock-screen-vs-sleep` | lock screen vs sleep | `p30` / `standard` | A wake lock prevents display sleep, not a "require sign-in after N minutes" policy. |

### 12.5 `/learn/` — 6 deep and developer pages

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `screen-wake-lock-api-guide` | screen wake lock api | `p15` / `standard` | Secure contexts only; released when the document is hidden; `NotAllowedError` on battery saver — the guide shows the handling. |
| `nosleep-js-vs-wake-lock` | nosleep.js vs wake lock | `p15` / `standard` | The video fallback costs CPU and needs a gesture; measured numbers with dates. |
| `does-a-wake-lock-keep-teams-green` | does wake lock keep teams status green | `p30` / `standard` | No. Presence follows input idle in our tests (dates, versions); AwakeTab will not change your status. |
| `low-power-mode-and-wake-locks` | low power mode wake lock | `p30` / `standard` | iOS Low Power Mode and Android/Windows battery savers override or deny; the page lists exact behaviours per OS. |
| `browser-support-matrix` | wake lock browser support | `p15` / `standard` | Table is as of `lastVerified`; older versions fall back; each row states the test date. |
| `how-we-tested` | how awaketab was tested | `p15` / `standard` | Methodology page: what was tested and what was not (no claims beyond the matrix). |

---

## 13. Editorial workflow

1. **Brief**: slug, intent, secondary queries, preset/mode, honest limit, related, from §12 — copied into the frontmatter first.
2. **Draft** (EN): outline per template, screenshots captured on the rig listed on `/about`, facts with versions and dates.
3. **Fact-check** against the support matrix (`/learn/browser-support-matrix` data file `src/data/support-matrix.json` — **PROPOSED — add to §4**): every browser/OS claim must match a row or add one.
4. **Quality checklist** (§11) and lint: `pnpm content:lint` (schema, title length, duplicate descriptions, shingle duplicates, link targets exist, images have alt and captions with dates).
5. **Native review** for translations (`07-i18n.md` §8); EN gets a second read for tone.
6. **Publish**: PR merge deploys; `published` set; `lastVerified` set to the test date, not the merge date.
7. **Post-publish**: URL submitted via IndexNow (automatic on deploy); check Search Console indexing after 7 days.

## 14. Freshness cadence

| Content | Trigger | Action |
|---|---|---|
| Support matrix and `/on/*` | Every Chrome/Edge/Firefox/Safari stable release (monthly-ish) and every iOS/Android major | Re-run the matrix script, update rows and `lastVerified`, republish |
| `/guides/*` | Quarterly, or on an OS release that moves the setting | Re-shoot screenshots, update steps |
| `/vs/*` | Quarterly | Check competitor versions, prices, last-shipped dates |
| `/for/*` | Semi-annually | Re-verify limits, refresh FAQs from GSC queries |
| `/learn/*` research | On any contradicting evidence, else yearly re-test | Re-run the Teams test and OS sleep matrix |
| `/changelog` | Monthly | One entry per release |

A page whose `lastVerified` is older than 180 days shows "Last verified over 6 months ago — re-testing" and appears in the weekly freshness report (`14-devops.md`).

## 15. Search Console, Bing, IndexNow

- [ ] Verify `awaketab.com` as a Domain property in Google Search Console (DNS TXT); add Soubhik's account as owner.
- [ ] Submit `sitemap-index.xml`; check each per-locale sitemap reports "Success".
- [ ] Bing Webmaster Tools: import from Search Console; submit the same index.
- [ ] IndexNow: generate a key, serve `/{key}.txt`, and on every deploy `POST https://api.indexnow.org/indexnow` with changed URLs (`14-devops.md` step); Bing and Yandex share the endpoint.
- [ ] Set the international targeting to none (hreflang handles it).
- [ ] Request indexing manually for `/` and the first 10 pages at launch.
- [ ] Enable Core Web Vitals report review weekly; CrUX API key for the dashboard.
- [ ] Watch "Page indexing" for "Alternate page with proper canonical tag" spikes (means a locale URL is being folded — check hreflang).

## 16. Measurement

Rank tracking: 25 English queries × 8 locales (localized equivalents from `07-i18n.md` §7), weekly, plus Search Console clicks/impressions per family. The 25 English queries:

1. keep screen awake · 2. keep screen awake online · 3. keep screen on · 4. keep my screen on · 5. prevent screen from sleeping · 6. stop screen from turning off · 7. keep computer awake · 8. keep screen on website · 9. nosleep page · 10. nosleep.page alternative · 11. keep screen on while cooking · 12. keep screen on during presentation · 13. keep computer awake while downloading · 14. keep iphone screen on safari · 15. keep chromebook screen on · 16. keep screen on windows 11 · 17. prevent mac display sleep · 18. caffeine alternative online · 19. powertoys awake alternative · 20. screen wake lock api · 21. nosleep.js alternative · 22. does wake lock keep teams green · 23. keep android screen on chrome · 24. keep screen on for 2 hours · 25. awaketab

Targets follow the blueprint: day 30 — 60 URLs indexed; day 90 — top 10 for queries 1–3 in three locales; day 180 — top 3 for query 1 in EN and #1 on 15+ long-tail queries.

## 17. Acceptance criteria (selection)

- **FR-SEO-01** Given any indexable page, when built, then it has exactly one `<h1>`, a title ≤ 60 chars ending in " — AwakeTab" (or starting with "AwakeTab"), a unique description of 70–155 chars and a self canonical.
- **FR-SEO-02** Given a page with translations, when built, then every alternate lists all others plus self and `x-default`, and the sitemap alternates match.
- **FR-SEO-03** Given fewer than 25 ratings in `data/ratings.json`, when the home page is built, then the `WebApplication` object has no `aggregateRating` property.
- **FR-CONTENT-01** Given any `/on/*` page, when built, then `lastVerified` is present and rendered as "Last verified: {date}".

## 18. PROPOSED identifiers (add to 00-conventions.md)

| Identifier | Where | Proposal |
|---|---|---|
| Resolve `/support-matrix` → `/learn/browser-support-matrix`, `/how-we-tested` → `/learn/how-we-tested` | §1 | 301 redirects; one indexable URL per topic |
| Hub index routes `/for`, `/on`, `/vs`, `/guides`, `/learn` | §7.2 | Needed for breadcrumbs and hub-and-spoke |
| `src/i18n/slugs.json` | §5 | Translated slug mapping |
| `src/data/support-matrix.json` | §13 | Single source for support claims |
| `data/ratings.json` (build input) and the Worker that exports it | §7.1 | Feeds `aggregateRating`; pairs with `POST /api/rating` |
| Frontmatter fields `author`, `published`, `updated` | §3 | Beyond the listed schema fields |

## 19. As built — translated content pages (E6-T05, E6-T06 · 2026-09-26)

- **Files and routes.** Translations live at `src/content/{collection}/{locale}/{EN slug}.md` (Markdown, same schema as English) and render at `/{lang}/{collection}/{translated slug}` from one route, `src/pages/[lang]/[kind]/[slug].astro`. The public slug comes from `src/i18n/slugs.json`; a missing entry falls back to the EN slug. **Deviation from §5:** `slugs.json` also carries ASCII romanised slugs for `ja`, `zh` and `hi` (e.g. `/ja/for/ryouri`, `/zh/for/pengren`, `/hi/for/khana-banana`), so those are used instead of the English slug — still ASCII, no percent-encoding. Owner to confirm or replace with the EN slug in `slugs.json` (no code change needed).
- **Scope shipped.** The 10 top pages of `07-i18n.md` §5 × 7 locales = 70 pages (`/for/cooking`, `/for/downloads`, `/for/presentations`, `/on/iphone-safari`, `/on/android-chrome`, `/on/windows-11`, `/on/macos`, `/guides/iphone-auto-lock-never-greyed-out`, `/vs/caffeine`, `/learn/browser-support-matrix`). LLM-drafted as localized adaptations (local head query in `intent`/`h1`, `secondaryQueries` from §7 of 07, Hinglish variant on every `hi` page), fact-checked against `support-matrix.json` and an honesty audit (docs/19 B7). Not word-for-word: the English boilerplate sections were not repeated across pages.
- **Frontmatter.** `locale`, `translationOf` (= EN slug, enforced at build by `src/lib/content-i18n.ts`), `reviewed: false`, `lastVerified` (copied from the English source — the facts were verified then, the translation does not re-verify), `published: 2026-09-26`; `preset`, `mode`, `browsers`, `os` copied from English; `related` holds **English** route paths — the page renders each as the same-locale translation when one exists (anchor = its `h1`), otherwise the English page with `hreflang="en" lang="en"` and "(English)" appended.
- **Indexing rule.** `reviewed: false` → `noindex, follow`, no hreflang, not in any sitemap — the same rule the locale homes follow via `LOCALE_META[locale].reviewed`. Flipping one page to `reviewed: true` makes it indexable, adds it to `sitemap-{locale}.xml`, and adds it to the hreflang set of every indexable version of that page (English included). The set is computed by one function, `alternatesFor()` in `apps/web/scripts/translations.mjs`, used by both the HTML (`ArticlePage.astro`) and `scripts/sitemap.mjs`, so the two cannot disagree. Unreviewed pages show a "Translated from English — native review pending" badge linking the English original.
- **Locale switcher.** `LocaleNav` takes the page's translations (`localeLinks`) and links each locale to that page's version, falling back to the locale home; links carry `hreflang` and `lang`.
- **Page chrome on translations.** Breadcrumb is two levels (locale home → page) because locale hub pages do not exist; "Start this session" links the locale home with `?preset=…&mode=…` (tool routes are not duplicated per locale); dates use `Intl.DateTimeFormat(htmlLang, { dateStyle: 'long', numberingSystem: 'latn' })`.
- **OG images (§9).** `scripts/og.mts` renders one PNG per translated page to `public/og/{lang}/{collection}/{translated slug}.png` (regenerated from scratch each build): title = `ogTitle ?? h1`, footer "awaketab.com · {language name}", Noto Sans JP / SC / Devanagari from `@fontsource` read from `node_modules` at build time only (the SEO suite asserts no font file in `dist/`). Titles wrap with `textWrap: balance` and step down from 68 px to 58/50 px when their display width exceeds 36/56; locale home images (`/og/home-{lang}.png`) now also show the language name. Pages also emit `og:image:alt` (= `h1`) and, when indexable, `og:locale:alternate`. English content pages still use the per-family image (`/og/{collection}-en.png`).
- **JSON-LD.** `inLanguage` is the BCP 47 tag (`pt-BR`, `zh-Hans`), not the folder code, on `WebSite`, `WebApplication` and `Article`; `Article` gains `image`.
- **Word bar.** §2's word bars are English targets; translations run ≈ 440–660 words (Latin scripts, Hindi) or ≈ 1,200–1,550 characters (ja, zh).
- **Open for the owner.** `vs/en/caffeine.md` says "Pick Caffeine when you need closed-lid … behaviour"; the translations do not repeat that claim (no evidence Caffeine keeps a closed Mac awake, and §12.3 amphetamine row says no tab can). Fix the English source to match.
