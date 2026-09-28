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
| Scenarios | `/for/{slug}` | 14 | "Scenarios" grid | rewritten pages yes; drafts `noindex` (§20) |
| Devices and browsers | `/on/{slug}` | 11 | "Devices" row | rewritten pages yes; drafts `noindex` (§20) |
| Comparisons | `/vs/{slug}` | 7 | "Alternatives" | rewritten pages yes; drafts `noindex` (§20) |
| OS how-tos | `/guides/{slug}` | 7 | Honest-limits callout | rewritten pages yes; drafts `noindex` (§20) |
| Docs, deep and developer | `/learn/{slug}` | 8 | Support matrix, footer, header Resources menu | rewritten pages yes; drafts `noindex` (§20) |
| Product | `/pro` `/pro/activate` `/pro/manage` `/extension` `/embed` `/kiosk` `/library` | 7 | Pro strip, product cards | `/pro/activate` `/pro/manage` `noindex`; rest yes |
| Trust | `/about` `/privacy` `/terms` `/changelog` `/support-matrix` `/how-we-tested` | 6 | Footer, author box | yes |
| Apps | `/embed/cook` `/pip` `/404` | 3 | — | no |

Route conflicts to resolve (**PROPOSED — decide in 00-conventions.md**): `/support-matrix` duplicates `/learn/browser-support-matrix` and `/how-we-tested` duplicates `/learn/how-we-tested`. Recommendation: the short trust URLs `301` to the `/learn/*` articles, which carry the content; the trust pages then exist only as redirects, keeping one indexable URL per topic.

The English content total is 47 pages (14 + 11 + 7 + 7 + 8): 44 after OD-3 (redesign B11, §20) and three `/learn` pages that took over the home page's story (§23). 28 are indexable and 19 are `noindex` drafts until rewritten. (The v1.0 plan was 66 indexable URLs with 51 content pages.) Locales replicate the content families and the tool routes; product pages localize in phase 3.

---

## 2. Page templates

Every template shares: one `<h1>` matching the target intent; the answer in the first 100 words; the tool island (`05-frontend-spec.md` §2) with the scenario preset via `data-preset` and `data-mode`, after the body and the honest limit in the one article order (§24); a 3–5 item FAQ as `<details>`; breadcrumbs; related links; the author box; a "Sources checked {date}" line where facts depend on software versions (O-46; "Tested on {device}" once a device run is recorded); and no ad slot above the fold on any page (`09-monetization-impl.md`).

### 2.1 `/` — home

Sections in order (also in `05-frontend-spec.md` §4.2): tool → use cases (six cards and a link to all of them) → make it yours (faces, looks, sounds, notes, focus) → extension showcase → choose your level → closing band with one link to the docs → footer. The home sells; how it works, the limits, the support matrix and the FAQ live in `/learn` (the FAQPage schema goes there too). Word bar below the tool 120–1,200. `<h1>` "Keep your screen awake" (locale equivalents in `07-i18n.md`). Preset `p30`, mode `standard`.

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

Sections: abstract (first 100 words) → body with `<h2>` per question, code blocks for API pages → methodology and dates for tests → results table → limits → "Try it" tool embed at the end → related. Word bar 1,000–2,000 (was 1,200; lowered to the research standard, `marketing-seo-content.md` §4, so a complete explainer such as the Teams page is not padded). `Article` schema with `dateModified`. Code samples use `@awaketab/wake`.

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
- **Canonical**: absolute `https://awaketab.com{path}` (or `/{lang}{path}`), self-referential on every indexable page; preset pages self-canonical; `/until/*` canonical `/` (with `noindex`); `/embed/*`, `/pip`, `/pro/activate`, `/pro/manage`, `/404` `noindex, follow` via `<meta name="robots">`; query strings are never part of the canonical (the island strips them client-side too, `05-frontend-spec.md` §10). Canonical URLs have no trailing slash, except `/` and the locale homes, which are `/{lang}/` (`https://awaketab.com/es/`). Each canonical is the exact URL Cloudflare Pages serves with a 200: `/for/cooking` is `for/cooking.html` and `/es/` is `es/index.html`. Pages itself 308-redirects the other spelling (`/for/cooking/` → `/for/cooking`, `/es` → `/es/`); `_redirects` has no slash rules. See `14-devops.md` §2.1, which `test/seo/served-urls.test.ts` enforces for canonicals, hreflang, sitemaps and internal links.
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

`https://awaketab.com/sitemap-index.xml` lists one sitemap per locale: `sitemap-en.xml`, `sitemap-es.xml`, … `sitemap-hi.xml`. Each `<url>` carries `<loc>`, `<lastmod>` and the `xhtml:link` alternates. `lastmod` is each page's real last change, never the build time (`apps/web/scripts/sitemap.mjs`, a post-build step that replaces `@astrojs/sitemap` because the latter cannot read git dates). Content pages use their frontmatter `updated`, else `published`, which is also the `dateModified` in the page's Article JSON-LD, so the two always agree. Every other page uses the last commit that touched its sources (`git log -1 --format=%cI -- <paths>`, run from `apps/web`; the list is `PAGE_SOURCES`): the page file, plus the tool island for `/` and the presets, `LegalDoc.astro` for `/privacy` and `/terms`, the `changelog/` fragments for `/changelog` and `components/pro/` for `/pro`; the five hubs also take the newest date of the English articles they list. In a shallow clone the oldest fetched commit looks as if it added every file, so a date that lands on that boundary commit is dropped. A page with no known date gets no `<lastmod>` rather than a guess. Each sitemap in the index carries the newest `lastmod` of its URLs, or none. No `<priority>`/`<changefreq>`. Excluded: everything `noindex`, `/api/*`, `/until/*`. `scripts/sitemap.test.ts` covers the git and shallow-clone rules; `test/seo/holding-page.test.ts` checks the built sitemaps.

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
      "sameAs": ["https://github.com/SoubhikBiswas-gitHub/awaketab"]
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

`sameAs` lists only profiles that exist and answer today (2026-09-27): the public source repository `github.com/SoubhikBiswas-gitHub/awaketab`, which the AwakeTab founder owns and which is the project's only official page outside the site. The `github.com/awaketab` account does not exist and `@awaketab/wake` is not on npm yet, so neither is listed; add `https://www.npmjs.com/package/@awaketab/wake` after the first publish, and a GitHub organisation or social profile only once it exists. `test/seo/holding-page.test.ts` checks the list on every home page.

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

### 12.1 `/for/` — 14 scenarios

Honest limits below were corrected on 2026-09-27 (redesign B11, decision O-79) to match `docs/research/fact-check-2026-09-26.md`: no browser refuses a wake lock because of a battery saver, and no claim rests on device tests that have not been recorded.

| Slug | Intent (target query) | Preset / mode | Honest limit |
|---|---|---|---|
| `cooking` | keep screen on while cooking | `pinf` / `cook` | Works while the AwakeTab tab is on screen; on a phone the recipe and AwakeTab cannot both be in front, so switching apps releases the lock until you return. |
| `presentations` | keep screen on during presentation | `p120` / `standard` | Full-screen slides hide the tab; use the floating window (desktop Chrome, Edge 116+, Firefox 151+) or the extension, and the projector still follows the OS display timeout. |
| `downloads` | keep screen on during a long download | `pinf` / `standard` | Keeps the display on while visible, which also stops Windows and macOS idle sleep; closing the lid always sleeps. |
| `ai-agents` | keep computer awake while an ai agent runs | `pinf` / `minimal` | A visible tab keeps the display on; for a terminal job with the screen off, `caffeinate -i` or PowerToys Awake fit better; a closed lid sleeps. |
| `dashboards` | keep dashboard screen on | `pinf` / `minimal` | AwakeTab must stay visible on the same display as the dashboard (side by side, second window or its own monitor). Use `?autostart=1` (Safari needs one tap). |
| `kiosk` | keep screen on kiosk browser | `pinf` / `minimal` | Not a kiosk browser: no lockdown, no auto-launch. Pair it with the OS kiosk mode; see `/kiosk` for the licence. |
| `sheet-music` | keep ipad screen on for sheet music | `p60` / `minimal` | AwakeTab must stay on screen beside the score app (windowed apps on iPadOS 26, Split View on iPadOS 18 and earlier); Low Power Mode sets Auto-Lock to 30 s. |
| `reading` | keep screen on while reading | `p60` / `minimal` | Only the visible tab is kept awake; for a reading app, use split-screen with AwakeTab beside it. |
| `night-clock` | night clock online oled | `pinf` / `night` | A screen on all night needs power, so plug in. Pixel shift reduces OLED burn-in risk but cannot remove it. |
| `video-calls` | keep screen on during video call | `p60` / `standard` | Does not keep Teams, Slack or Zoom "available": presence follows keyboard and mouse activity, not the display. |
| `teleprompter` | teleprompter keep screen on | `p30` / `minimal` | Not a teleprompter; the prompter page must be visible alongside AwakeTab (side by side or the floating window). |
| `workouts` | keep screen on during workout timer | `p45` / `clock` | Sweaty taps can stop the session; lock the phone orientation and keep it plugged in for long sessions. |
| `work-laptop` | keep work laptop from locking | `p30` / `standard` | Cannot override lid-close sleep, smart-card removal or a lock policy that isn't the display timeout; will not show you as active in Teams. |
| `classroom` | keep classroom screen on | `p60` / `clock` | Keeps the display on while this tab is visible. A school policy that locks the screen still applies; ask IT about the timeout. |

### 12.2 `/on/` — 11 devices and browsers

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `iphone-safari` | keep iphone screen on safari | `p30` / `standard` | Safari 16.4+ only, after one tap; switching apps releases the lock; Low Power Mode sets Auto-Lock to 30 s (whether the lock still holds under it is not yet device-tested). |
| `ios-home-screen` | keep screen on iphone web app | `pinf` / `clock` | Wake lock in Home Screen web apps needs iOS 18.4+ (iOS 26 opens Home Screen sites as web apps by default); notifications work only in the installed app. |
| `ipad` | keep ipad screen on | `p60` / `minimal` | A tab in the background releases the lock (windowed apps on iPadOS 26; Split View on 18 and earlier); Low Power Mode sets Auto-Lock to 30 s. |
| `android-chrome` | keep android screen on chrome | `p30` / `standard` | Leaving Chrome releases the lock; some makers' sleeping-apps settings can close the tab after you leave it. Battery Saver does not refuse the lock. |
| `samsung-internet` | keep screen on samsung internet | `p30` / `standard` | Samsung Internet 14+ (Chromium 87 base); Samsung's sleeping-apps settings can close the tab after you leave it. |
| `chromebook` | keep chromebook screen on | `pinf` / `standard` | Managed Chromebooks may enforce power policies AwakeTab cannot override; closing the lid sleeps unless "Sleep when cover is closed" is off. |
| `windows-11` | keep screen on windows 11 (and 10; `/on/windows-10` 301s here) | `p60` / `standard` | The lock screen has its own 60-second monitor timeout; the lid follows the lid-close setting. Energy saver does not refuse the lock. |
| `macos` | prevent mac display sleep in browser | `p60` / `standard` | While the display is kept on, the Mac does not idle-sleep; closing the lid still sleeps unless you use clamshell mode with power and an external display. |
| `linux` | keep screen on linux browser | `pinf` / `standard` | Needs a desktop that honours the browser's sleep inhibit (GNOME SessionManager or freedesktop ScreenSaver); device results pending. |
| `firefox` | keep screen on firefox | `p30` / `standard` | Wake lock since Firefox 126 (May 2024); refused at 5 % battery or less while not charging; older versions use the video fallback with higher CPU. |
| `edge` | keep screen on edge | `p30` / `standard` | Edge 84+; sleeping tabs affect only background tabs; Energy saver may dim the screen but does not refuse the lock. |

### 12.3 `/vs/` — 7 comparisons

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `caffeine` | caffeine alternative online | `pinf` / `standard` | Caffeine for Mac holds a macOS power assertion with nothing visible (the F15 key press is Caffeine for Windows); AwakeTab needs a visible tab. |
| `amphetamine` | amphetamine mac alternative | `pinf` / `standard` | Amphetamine is native, has triggers and a closed-display mode; no browser tab can keep a closed Mac awake. |
| `powertoys-awake` | powertoys awake alternative | `pinf` / `standard` | PowerToys Awake keeps the system awake with the display off by default, or on with "Keep screen on"; it stops at the lock screen. AwakeTab needs a visible tab. |
| `caffeinate-command` | caffeinate command alternative | `pinf` / `standard` | `caffeinate -di` prevents idle and display sleep from a terminal; AwakeTab needs its tab on screen. |
| `nosleep-page` | nosleep.page alternative | `p30` / `standard` | Both are tabs and both release when hidden; the difference is the status, until-time and session restore. Facts dated. |
| `nosleep-js` | nosleep.js alternative (absorbs nosleep.js vs wake lock; `/learn/nosleep-js-vs-wake-lock` 301s here) | `pinf` / `standard` | NoSleep.js (last release December 2020) uses the Wake Lock API where present and a video otherwise; `@awaketab/wake` is an actively maintained alternative (npm package coming soon); see `/library`. |
| `mouse-jigglers` | mouse jiggler alternative | `pinf` / `standard` | AwakeTab never simulates input and does not keep Teams or Slack green. Jigglers do, and may breach your employer's policy. |

### 12.4 `/guides/` — 7 OS how-tos

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `windows-11-screen-turns-off-after-1-minute` | windows 11 screen turns off after 1 minute | `p60` / `standard` | On managed PCs the setting is locked by policy; the lock screen's 60-second timeout needs the powercfg fix; AwakeTab works only while its tab is visible. |
| `mac-prevent-sleep-lid-closed` | prevent mac sleep lid closed | `pinf` / `standard` | No browser can keep a closed Mac awake; clamshell mode with power and an external display, or a native tool, can. |
| `iphone-auto-lock-never-greyed-out` | iphone auto lock never greyed out | `p30` / `standard` | Low Power Mode, or a work or school profile, locks Auto-Lock; whether a Safari wake lock holds under Low Power Mode is not yet device-tested. |
| `chrome-energy-saver` | chrome energy saver | `p30` / `standard` | Energy Saver throttles background tabs; it does not block a visible tab's wake lock, and neither do OS battery savers. |
| `android-screen-timeout-one-app` | android screen timeout for one app | `p30` / `standard` | Stock Android has no per-app timeout; AwakeTab covers the browser only. |
| `second-monitor-turns-off` | second monitor turns off (absorbs `/for/second-monitor`, which 301s here) | `pinf` / `clock` | Signal-detection sleep, DisplayPort link drops and cables are outside any software's reach. |
| `lock-screen-vs-sleep` | lock screen vs sleep (absorbs modern standby; `/guides/modern-standby` 301s here) | `p30` / `standard` | A wake lock prevents display sleep, not a "require sign-in after N minutes" policy, and it does not control what drivers do in Modern Standby once the screen is off. |

### 12.5 `/learn/` — 8 docs, deep and developer pages

| Slug | Intent | Preset / mode | Honest limit |
|---|---|---|---|
| `how-awaketab-works` | how does awaketab work | `p30` / `standard` | A wake lock holds the display only while the tab is visible and only as long as the browser and OS allow it; AwakeTab shows when that stops. |
| `honest-limits` | what awaketab cannot do | `p30` / `standard` | Each limit rests on documentation and engine source checked 26 September 2026; device results pending. |
| `faq` | awaketab faq | `p30` / `standard` | Answers describe what browsers are built to do; device results pending. |
| `screen-wake-lock-api-guide` | screen wake lock api | `p15` / `standard` | Secure contexts only; released when the document is hidden; `NotAllowedError` for a hidden document, a Permissions-Policy block, Safari without a tap, or Firefox at ≤ 5 % battery. |
| `does-a-wake-lock-keep-teams-green` | does wake lock keep teams status green | `p30` / `standard` | No. Presence follows keyboard and mouse input (Microsoft and Slack documentation); AwakeTab will not change your status. |
| `low-power-mode-and-wake-locks` | low power mode wake lock | `p30` / `standard` | iOS Low Power Mode sets Auto-Lock to 30 s; Chromium and WebKit have no battery-saver check; Firefox refuses at ≤ 5 % battery. Draft until device results exist. |
| `browser-support-matrix` | wake lock browser support | `p15` / `standard` | Checked against browser documentation and engine source on the stated date; device results pending; older versions fall back. |
| `how-we-tested` | how awaketab is checked | `p15` / `standard` | Methodology page: what each claim rests on today, and which device runs are still pending. |

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

A page whose `lastVerified` is older than 180 days shows "Sources checked over 6 months ago. Re-checking now." (O-46, B5) and appears in the weekly freshness report (`14-devops.md`).

## 15. Search Console, Bing, IndexNow

- [ ] Verify `awaketab.com` as a Domain property in Google Search Console (DNS TXT); add Soubhik's account as owner.
- [ ] Submit `sitemap-index.xml`; check each per-locale sitemap reports "Success".
- [ ] Bing Webmaster Tools: import from Search Console; submit the same index.
- [ ] IndexNow: generate a key, serve `/{key}.txt`, and on every deploy `POST https://api.indexnow.org/indexnow` with changed URLs (`14-devops.md` step); Bing and Yandex share the endpoint. As built (M9, F-05): set `INDEXNOW_KEY` (8–128 characters of `A–Z a–z 0–9 -`, e.g. `openssl rand -hex 16`) as a Pages Production variable, so the build writes `/{key}.txt`, and as the GitHub secret of the same name, so `.github/workflows/indexnow.yml` pings after each production deploy (`scripts/indexnow.mjs`; only URLs the sitemaps list, i.e. indexable pages, never `noindex` or unreviewed translations). Launch day: run the workflow by hand with `all`.
- [ ] Set the international targeting to none (hreflang handles it).
- [ ] Request indexing manually for `/` and the first 10 pages at launch.
- [ ] Enable Core Web Vitals report review weekly; CrUX API key for the dashboard.
- [ ] Watch "Page indexing" for "Alternate page with proper canonical tag" spikes (means a locale URL is being folded — check hreflang).

## 16. Measurement

Rank tracking: 25 English queries × 8 locales (localized equivalents from `07-i18n.md` §7), weekly, plus Search Console clicks/impressions per family. The 25 English queries:

1. keep screen awake · 2. keep screen awake online · 3. keep screen on · 4. keep my screen on · 5. prevent screen from sleeping · 6. stop screen from turning off · 7. keep computer awake · 8. keep screen on website · 9. nosleep page · 10. nosleep.page alternative · 11. keep screen on while cooking · 12. keep screen on during presentation · 13. keep computer awake while downloading · 14. keep iphone screen on safari · 15. keep chromebook screen on · 16. keep screen on windows 11 · 17. prevent mac display sleep · 18. caffeine alternative online · 19. powertoys awake alternative · 20. screen wake lock api · 21. nosleep.js alternative · 22. does wake lock keep teams green · 23. keep android screen on chrome · 24. keep screen on for 2 hours · 25. awaketab

Targets follow the blueprint: day 30 — 60 URLs indexed; day 90 — top 10 for queries 1–3 in three locales; day 180 — top 3 for query 1 in EN and #1 on 15+ long-tail queries. **Superseded (OD-13, adopted 2026-09-27 under O-49):** the day 30/60/90 targets are the KPI table in `docs/research/marketing-seo-content.md` §10 (index coverage of indexable pages, zero draft leakage, long-tail top-10s, referring domains, organic tool starts); head-term goals move to day 180 and depend on links.

## 17. Acceptance criteria (selection)

- **FR-SEO-01** Given any indexable page, when built, then it has exactly one `<h1>`, a title ≤ 60 chars ending in " — AwakeTab" (or starting with "AwakeTab"), a unique description of 70–155 chars and a self canonical.
- **FR-SEO-02** Given a page with translations, when built, then every alternate lists all others plus self and `x-default`, and the sitemap alternates match.
- **FR-SEO-03** Given fewer than 25 ratings in `data/ratings.json`, when the home page is built, then the `WebApplication` object has no `aggregateRating` property.
- **FR-CONTENT-01** Given any `/on/*` page, when built, then `lastVerified` is present and rendered as "Sources checked {date}" (decision O-46, redesign B5; was "Last verified: {date}").

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

- **Files and routes.** Translations live at `src/content/{collection}/{locale}/{EN slug}.md` (Markdown, same schema as English) and render at `/{lang}/{collection}/{translated slug}` from one route, `src/pages/[lang]/[kind]/[slug].astro`. The public slug comes from `src/i18n/slugs.json` for the Latin-script locales (`es`, `pt-br`, `de`, `fr`); a missing entry falls back to the EN slug. `ja`, `zh` and `hi` use the English slug, as §5 prescribes (`/ja/for/cooking`, `/zh/on/iphone-safari`, `/hi/guides/iphone-auto-lock-never-greyed-out`): `slugs.json` carries no `ja` / `zh` / `hi` keys, and `publicSlug()` in `scripts/translations.mjs` ignores any it finds (`TRANSLATED_SLUG_LOCALES`). The romanised slugs of the first build (`/ja/for/ryouri`, `/zh/for/pengren`, `/hi/for/khana-banana`, …) were retired on 2026-09-26 (decision D-03) before any of those pages was reviewed or indexed, so they have no redirects; `test/seo/launch-audit.test.ts` (D-03) fails if a built page, sitemap, OG path or IndexNow URL still names one, and `test/i18n/parity.test.ts` fails if `slugs.json` gains a `ja` / `zh` / `hi` key.
- **Scope shipped.** The 10 top pages of `07-i18n.md` §5 × 7 locales = 70 pages (`/for/cooking`, `/for/downloads`, `/for/presentations`, `/on/iphone-safari`, `/on/android-chrome`, `/on/windows-11`, `/on/macos`, `/guides/iphone-auto-lock-never-greyed-out`, `/vs/caffeine`, `/learn/browser-support-matrix`). LLM-drafted as localized adaptations (local head query in `intent`/`h1`, `secondaryQueries` from §7 of 07, Hinglish variant on every `hi` page), fact-checked against `support-matrix.json` and an honesty audit (docs/19 B7). Not word-for-word: the English boilerplate sections were not repeated across pages.
- **Frontmatter.** `locale`, `translationOf` (= EN slug, enforced at build by `src/lib/content-i18n.ts`), `reviewed: false`, `lastVerified` (copied from the English source — the facts were verified then, the translation does not re-verify), `published: 2026-09-26`; `preset`, `mode`, `browsers`, `os` copied from English; `related` holds **English** route paths — the page renders each as the same-locale translation when one exists (anchor = its `h1`), otherwise the English page with `hreflang="en" lang="en"` and "(English)" appended.
- **Indexing rule.** `reviewed: false` → `noindex, follow`, no hreflang, not in any sitemap — the same rule the locale homes follow via `LOCALE_META[locale].reviewed`. Flipping one page to `reviewed: true` makes it indexable, adds it to `sitemap-{locale}.xml`, and adds it to the hreflang set of every indexable version of that page (English included). The set is computed by one function, `alternatesFor()` in `apps/web/scripts/translations.mjs`, used by both the HTML (`ArticlePage.astro`) and `scripts/sitemap.mjs`, so the two cannot disagree. Unreviewed pages show a "Translated from English — native review pending" badge linking the English original.
- **Locale switcher.** The footer's `LangSwitch` (redesign B2, `05-frontend-spec.md` §3.27; `LocaleNav` before it) takes the page's translations (`localeLinks`) and links each locale to that page's version, falling back to the locale home; links carry `hreflang` and `lang`.
- **Page chrome on translations.** Breadcrumb is two levels (locale home → page) because locale hub pages do not exist; "Start this session" links the locale home with `?preset=…&mode=…` (tool routes are not duplicated per locale); dates use `Intl.DateTimeFormat(htmlLang, { dateStyle: 'long', numberingSystem: 'latn' })`.
- **OG images (§9).** `scripts/og.mts` renders one PNG per translated page to `public/og/{lang}/{collection}/{public slug}.png` (the English slug for `ja` / `zh` / `hi`) (regenerated from scratch each build): title = `ogTitle ?? h1`, footer "awaketab.com · {language name}", Noto Sans JP / SC / Devanagari from `@fontsource` read from `node_modules` at build time only (the SEO suite asserts no font file in `dist/`). Titles wrap with `textWrap: balance` and step down from 68 px to 58/50 px when their display width exceeds 36/56; locale home images (`/og/home-{lang}.png`) now also show the language name. Pages also emit `og:image:alt` (= `h1`) and, when indexable, `og:locale:alternate`. English content pages still use the per-family image (`/og/{collection}-en.png`).
- **JSON-LD.** `inLanguage` is the BCP 47 tag (`pt-BR`, `zh-Hans`), not the folder code, on `WebSite`, `WebApplication` and `Article`; `Article` gains `image`.
- **Word bar.** §2's word bars are English targets; translations run ≈ 440–660 words (Latin scripts, Hindi) or ≈ 1,200–1,550 characters (ja, zh).
- **Resolved (B11, §20).** `vs/en/caffeine.md` was rewritten: it no longer says Caffeine keeps a closed-lid Mac awake, and the F15 key press is attributed to Caffeine for Windows.

## 20. As built — content fixes (redesign B11 · 2026-09-27)

Applies owner decisions OD-3, OD-2 / O-45, O-15, O-23, O-49 and O-79 (`docs/redesign/DECISIONS.md`) and the research in `docs/research/content-audit.md`, `fact-check-2026-09-26.md`, `editorial-audit-articles.md` and `marketing-seo-content.md`.

- **Routes (OD-3).** 51 English content pages became 44 (`00-conventions.md` §7, §13.20). 301s: `/for/second-monitor` → `/guides/second-monitor-turns-off`, `/on/windows-10` → `/on/windows-11` (retitled "Windows 11 and 10"), `/guides/modern-standby` → `/guides/lock-screen-vs-sleep`, `/learn/nosleep-js-vs-wake-lock` → `/vs/nosleep-js`; each target absorbed the useful facts of the page it replaces. Cut with no redirect (404; never indexed, and a redirect to an unrelated page would be a soft 404; `_redirects` cannot send 410): `/for/navigation`, `/for/live-streams`, `/for/exams-proctoring`, `/for/baby-monitor`. New: `/for/classroom` (O-23), English only per `07-i18n.md` §5 (not a top-10 page).
- **Draft gate (OD-2, O-45).** No new schema field: the existing `noindex: true` frontmatter is the draft flag. A draft is live, `noindex, follow`, has no hreflang and is absent from the sitemaps and IndexNow (the machinery in `scripts/translations.mjs` `isIndexable()`). The **launch set** (indexable, rewritten from scratch to its §2 template and the research standard, `lastVerified` 2026-09-26 = the date the sources were checked): `/for/cooking`, `/for/ai-agents`, `/for/presentations`, `/for/work-laptop`, `/for/dashboards`, `/for/classroom`, `/on/iphone-safari`, `/on/macos`, `/on/android-chrome`, `/on/windows-11`, `/on/chromebook`, `/on/ipad`, `/guides/iphone-auto-lock-never-greyed-out`, `/guides/windows-11-screen-turns-off-after-1-minute`, `/guides/mac-prevent-sleep-lid-closed`, `/guides/lock-screen-vs-sleep`, `/guides/second-monitor-turns-off`, `/vs/nosleep-page`, `/vs/caffeine`, `/vs/powertoys-awake`, `/vs/mouse-jigglers`, `/vs/nosleep-js`, `/learn/screen-wake-lock-api-guide`, `/learn/does-a-wake-lock-keep-teams-green`, `/learn/browser-support-matrix` (25). **Drafts** (19, generated text with the false claims removed, `noindex: true`): `/for/downloads`, `/for/kiosk`, `/for/sheet-music`, `/for/reading`, `/for/night-clock`, `/for/video-calls`, `/for/teleprompter`, `/for/workouts`, `/on/ios-home-screen`, `/on/samsung-internet`, `/on/linux`, `/on/firefox`, `/on/edge`, `/vs/amphetamine`, `/vs/caffeinate-command`, `/guides/chrome-energy-saver`, `/guides/android-screen-timeout-one-app`, `/learn/low-power-mode-and-wake-locks` (rewritten accurately, but it waits for the device run), `/learn/how-we-tested`. A draft flips to indexable only after a rewrite to its template and a check against the fact-check.
- **Word bars as tested.** `test/seo/holding-page.test.ts` measures the built `.at-prose` block (body, FAQ, related links): indexable pages meet §2 (for 600–1,000, on 600–900, vs 700–1,000, guides 700–1,100, learn 1,000–2,000); drafts keep the old 600–1,000 band.
- **Fact fixes.** The battery-saver refusal claim (decision D-R12), unrecorded device-test claims ("in our tests", "tested on Ubuntu"), the macOS idle-sleep claim, Caffeine's F15 key press on Mac, iPadOS 26 Split View, the floating window's Firefox 151+ support and the Windows Energy saver rename are fixed in every English page, in the 70 translations and in the seven locale homes (`src/content/locale-home/*.ts`), and in `src/data/support-matrix.json` (notes per engine; Edge platforms; the extension's 30 s alarm needs Chrome 120; unverified Brave, Arc and Opera removed from the extension row, O-41). `test/lib/content.test.ts` fails if a false claim, a banned term or an em dash in English prose comes back.
- **Generator retired (O-15).** `scripts/write-content.mjs` wrote the 51 templated pages; it is deleted, and `test/lib/content.test.ts` fails if the file or an npm script running it comes back, so a re-run can never overwrite the rewrites.
- **Not done here (UI or code follow-ups).** (Done in B5, §21.) The "Last verified" badge copy (O-46: "Sources checked {date}" / "Tested on {device}") lives in `en.json` `content.verified` and `ArticlePage.astro`; the hub pages' intro copy and item lines (`HubPage.astro`, canvas `HubFor.dc.html`), and the home page's battery-saver and testing claims (`index.astro`) belong to B5; `tool.advice.battery_saver` in all locale catalogs is O-59.

## 21. As built — Clear Night templates (redesign B5 · 2026-09-27)

- **Templates.** `ArticlePage.astro` + `ContentLayout.astro` render every content page to the canvas boards (`ContentArticle` for `/for`; `GuideOn`, `GuideVs`, `GuideGuides`, `GuideLearn` for the other families); `HubPage.astro` renders the `/for`, `/on`, `/vs` and `/guides` hubs (`HubFor` board, `hub` prop); `DocsHub.astro` renders `/learn` as the Docs landing (featured "Start here" pages when present, Reference, Behaviour and Trust groups, then Guides and Compare tiles); `HomeBelow.astro` renders the home below the tool. Layout and component values: `05-frontend-spec.md` §3.31; identifiers: `00-conventions.md` §13.21.

- **Templates.** `ArticlePage.astro` + `ContentLayout.astro` render every content page to the canvas boards (`ContentArticle` for `/for`; `GuideOn`, `GuideVs`, `GuideGuides`, `GuideLearn` for the other families); `HubPage.astro` renders the `/for`, `/on` and `/learn` hubs (`HubFor` board, `hub` prop) and `HubGallery.astro` renders `/vs` and `/guides` as card galleries with an `ItemList` in their structured data; `HomeBelow.astro` renders the home below the tool. Layout and component values: `05-frontend-spec.md` §3.31; identifiers: `00-conventions.md` §13.21.
- **Section order** (superseded by §24, one order for every family). `/for`, `/on`, `/vs`: head → tool → body → honest limit → (related rows on `/for`) → FAQ → (related links on the guide boards) → author. `/guides`, `/learn`: head → body → honest limit → FAQ → tool ("Or skip the settings: open AwakeTab" / "Try it") → related → author: the tool is the shortcut after the how-to (§2.6, §2.7). The limit and FAQ stay inside `.at-prose`, so the word bars of §20 measure the same blocks as before (body, FAQ, related links on the tool-on-top pages).
- **Badge (O-46).** "Sources checked {date}" (`content.verified`, all eight locales) in the head, on the author card of `/for` pages and on the device matrix; the stale notice reads "Sources checked over 6 months ago. Re-checking now.". "Tested on {device}" needs a recorded device run (the matrix is still `pending`), so nothing renders it yet.
- **Hubs.** Groups, intro copy and one-line item summaries follow `HubFor.dc.html` (`src/lib/hubs.ts`); every page of the family is listed, drafts included (14 · 11 · 7 · 7 · 5), and a page no group names joins the last group. Items without a board line show their honest limit. The "Try it now" card links the tool with no end time (`/?preset=pinf&autostart=1`); hubs load no tool island.
- **Home below the tool.** The canvas copy, with the fact-check applied: no battery-saver refusal, no "in our tests" or "device on a shelf" claims, "hidden" rather than "lost focus", and no claim that it stops the lock screen. Hub link counts come from the collections ("All fourteen situations").
- **Related anchors.** English pages use the target's `h1` (§10); site pages outside the collections (`/embed`, `/extension`, `/kiosk`, `/library`, `/pro`, `/about`) use their page `h1` key.
- **Known gaps against the canvas (content, not template).** Closed in §22: the lead, step cards, screenshots, menu paths, checklists and per-page matrices are now structured blocks.

## 22. As built — structured article blocks (2026-09-27)

The canvas boards draw more than prose: a lead under the h1, numbered step cards, screenshot frames, a pill-states table, a checklist, comparison tables, code with a Copy button. These are build-time components fed by frontmatter; the Markdown body says where each one goes. No MDX, no new dependency, zero hydration.

- **Authoring.** Structured data lives in the frontmatter (schema: `blocks` in `src/content.config.ts`, validated at build). The Markdown body places a block on a line of its own, in the remark-directive leaf style: `::steps`, `::rows blockers`, `::code wake-lock.js`. Markdown renders that line as a paragraph; `src/lib/article.ts` `splitArticle()` cuts the rendered HTML into `h2` sections and swaps each block line for its component. An unknown name, or a block without its frontmatter data, fails the build. Strings inside blocks take inline Markdown only: `code`, **strong**, `[label](/path)` (`inline()`); external links get `rel="noopener"`.
- **Page fields.** `lead` (the answer paragraph under the h1; above the tool on `/for`, under the byline on the guide boards) · `crumb` (short breadcrumb label) · `toc` (short "On this page" labels by `h2` id) · `facts` (up to four chips on `/on`) · `stepsDone` (message when every tracked step is ticked) · `toolNote` (the paragraph above the embedded tool on `/guides` and `/learn`).
- **Blocks.** `steps` (numbered cards on `/for`; screenshot rows when a step has `shot`, as on `/on`; tracked steps with "Mark as done", a progress rail and a desktop progress list on `/guides`; `path` shows the menu path) · `figures` (up to two labelled placeholder frames, phone and desktop, `data-placeholder`, captioned) · `pills` (state → explanation; the label comes from the locale catalog through `StatusPill`, so the pill copy cannot drift) · `checklist` (native checkboxes, "n of m checked" counter) · `matrix` (setup / result tag / what to know) · `rows <key>` (key–value rows such as a support list, or title–text rows with an optional link) · `compare` (AwakeTab first, `same` rows tagged) · `picks <key>` (numbered "better choice" rows) · `code <file>` (file bar, Copy button, line numbers from CSS counters, the board's highlighter) · `note <key>` ("Good to know" callout) · `lifecycle` (the wake lock state diagram with its "other ways out") · `limit` (the honest-limit card placed in the body; `::limit inline` keeps it inside the section above, as on GuideLearn) · `ad` (where the in-content ad unit goes; ads stay gated by `PUBLIC_ADS_ENABLED`).
- **Family order.** Each family follows its board: `/for` ContentArticle (lead, set-up steps and figures, what to expect with the pills table, honest limit, checklist, related, questions, author) · `/on` GuideOn (lead and fact chips, steps with menu paths and screenshots, support matrix, blockers) · `/vs` GuideVs (verdict lead, side by side, when they are the better choice, when AwakeTab is) · `/guides` GuideGuides (lead, tracked steps, the greyed-out case, then the tool, limit, questions) · `/learn` GuideLearn (lead, question-style sections with rows, code, notes and the diagram, limits with the inline note, questions, then "Try it"). All 25 indexed English pages and the translated versions of the nine indexed top pages use it; drafts keep plain Markdown until rewritten. Translations were restructured from their own sentences only; a block the translation has no sentences for is left out.
- **Behaviour.** `src/lib/content-nav.ts` (the content-page script, no framework) keeps the checklist counter, the tracked-step state, the progress bar and list, and the Copy button honest. Nothing is stored: ticks reset on reload, because no existing storage key covers them. Without JavaScript the checkboxes still tick, and the tracked-step buttons, "Clear my progress" and Copy stay hidden.
- **Styles.** Block CSS sits in `src/styles/article/*.css` (on the strict token lint with `content.css`) and is inlined only on pages that use the block (`src/lib/article-css.ts`). Largest content page CSS: 20,227 bytes gzipped (drafts 18,699) (`/learn/screen-wake-lock-api-guide`), within the 20 KB budget.
- **Word bars.** `test/seo/holding-page.test.ts` now counts the lead plus every `.at-prose` block (the guides and learn tail after the tool included), so the lead, which used to be the body's first paragraph, still counts.
- **Tests.** `test/lib/article.test.ts` (block lines, inline Markdown, highlighter) · `test/seo/article-blocks.test.ts` (every indexed page has its lead and family blocks; no block line leaks; pill labels are contract copy; `/for/cooking` section order; per-page CSS) · `test/e2e/article-blocks.spec.ts` (checklist counter, tracked steps, Copy, axe).

## 23. As built — the home page's story moves to /learn (2026-09-28)

The home page now sells and starts the tool (hero, use cases, extension showcase, levels). Its explanatory sections moved into the Docs section so each has one indexable home (`00-conventions.md` §7, §13.24).

- **New pages.** `/learn/how-awaketab-works` takes "What AwakeTab does", "How it works" (the three steps and the keyboard shortcuts) and the seven states, drawn with `::pills` so each pill shows its exact contract copy (`tool.pill.*`) beside its one-line meaning. `/learn/honest-limits` takes the six honest limits, each with the reason and what to use instead. `/learn/faq` takes all eight home questions, grouped under four headings, plus four getting-started questions; its frontmatter `faq` holds three further questions so the FAQ block never repeats the body (§8).
- **Merged copy.** The home support table and its "below these versions" line join `/learn/browser-support-matrix`, with a new "Which page covers my device?" section for the device list. "How AwakeTab is checked" joins `/learn/how-we-tested` (the changelog line). "When something else is the better tool" is the `/vs` hub intro and "Or fix the setting itself" is the `/guides` hub intro; the scenario and device copy of "Pick the guide for what you are doing" was already in the `/for` and `/on` hub intros.
- **Indexing and dates.** The three pages are indexable (`reviewed: true`), `published` 2026-09-28, `lastVerified` 2026-09-26 (the source check their facts come from). Their word counts sit in the `/learn` band of §20 (1,000–2,000).
- **Structured data.** No `FAQPage` (§7): the home page never emitted it, so nothing moves. `/learn/faq` has `Article` and `BreadcrumbList` like every article.
- **Hub order.** `/learn` lists How AwakeTab works, Honest limits and FAQ first, then the existing pages.

## 24. As built — one article pattern (2026-09-29)

Owner request: every article, in every family, follows one component pattern. This section overrides the per-family section orders of §2.3–§2.7, §21 and §22 wherever they differ; the per-family content (which blocks a page uses, word bars, the family's own copy) stays as those sections describe.

- **One order.** Breadcrumbs → family kicker → h1 → lead → meta row → "On this page" → body → honest limit → tool → questions → related → author card → site footer. A family may leave a block out (a page with no `related` has no Related section, a draft may have no lead) but never moves or restyles one. `ContentLayout.astro` has one grid for all families (`data-family` names the family; the old `toolAt`, `variant` and `notesAfterTool` props are gone): phone `head / body / tool / tail`, desktop `toc head . / toc body rail / toc tool tool / toc tail .`.
- **Head.** The family kicker reads Use case · Device guide · Comparison · Fix · Docs (`content.family.*`); device pages show the real logos of the system and browser they are about beside it (the same pair as their `/on` card, `deviceLogos()` in `src/lib/brands.ts`). The meta row reads the source-check date (or, without `lastVerified`, "Updated {date}" from `updated` or `published`) as a full date with the weekday ("Sources checked Saturday, 26 September 2026"; other locales use their own full date style), the reading time ("4 min read", `readingMinutes()` at 220 words a minute) and the byline; the stale and translation-pending notices follow. Device fact chips sit under the meta row.
- **Contents.** Desktop: the sticky side rail ("On this page" with the tool mirror card, which now points down to the tool); `/guides` pages with tracked steps keep the step progress list in that rail. Phone and tablet: a collapsible "On this page" (`<details class="at-toc-m">`, 44 px rows) under the meta row, on every page. Entries: the page's h2 sections, then Honest limit, the tool, Questions and Related.
- **Blocks.** Honest limit: always the `Limit` card right after the body; `::limit` and `::limit inline` are gone and fail the build as unknown blocks, so it can never be placed by hand again. Tool: one `.at-tool-area` section everywhere (h2 "Try it", or "Or skip the settings: open AwakeTab" on `/guides`; the family or `toolNote` line; the embedded tool; then the §10 down-link, "Start a 30-minute session", as a button). Questions: the same `<details>` list everywhere, bare plus that turns into a cross. Related: the same 56 px link rows with a sliding arrow everywhere ("Related devices and guides" on `/for`, "Related" elsewhere). Callouts: `Note` ("Good to know", Phosphor `lightbulb`, lamp tone) and `Limit` (Phosphor `info`, ink) are the only callout shapes; the device test matrix's pending notice uses the same card with `hourglass-medium`. Steps, checklists, tables, code, figures and comparisons use their §22 blocks.
- **Headings and type.** One h1 (the template's); the body starts at h2 and never skips a level; body text keeps the 680 px main column, lists the shared `.at-md` list spacing, links the shared underline style. A short sub-procedure inside a section stays a Markdown ordered list; the page's main procedure is `::steps`.
- **Tests.** `test/lib/article-template.test.ts` (sources): no skipped heading level and no `#` h1 in the body, no hand-made callout (raw HTML, blockquote, "Note:" or bold "Tip" paragraphs, inline styles), no hand-placed limit, every page has its h1, honest limit and 3–5 questions. `test/seo/article-template.test.ts` (built pages, all 47 English articles, drafts included): the blocks above appear in the one order, one h1 and no skipped heading level, every callout is `.at-note` with a Phosphor icon, the meta row has the full weekday date and the reading time. `test/seo/article-blocks.test.ts` checks `/for/cooking` in the new order.
