# Live site audit, 27 Sep 2026

Report only. No app code, content, translation or config file was changed.

## Summary

- **Date:** 27 September 2026.
- **Target:** `https://awaketab.pages.dev` and the repository at `origin/main` (commit `4c195bf`).
- **Blocker: the live site could not be reached from the audit container.** The egress proxy refused the HTTPS CONNECT to `awaketab.pages.dev:443` with a 403 (organisation network policy, `connect_rejected`). `awaketab.com:443` and `www.awaketab.com:443` were refused the same way. No result below comes from the live host, and nothing was guessed.
- **What was audited instead:** a production-style build of `origin/main` (`pnpm -F web build`, the same command the Pages project runs), served by a small local emulator of Cloudflare Pages. The emulator follows the repo's own contract (`apps/web/scripts/served.mjs`, `docs/14-devops.md`): `x.html` is served at `/x`, other spellings get a 308, `_redirects` is applied, `_headers` is applied with path and host rules, splats, `! Name` detach and the `awaketab.pages.dev` host rules. It also serves `404.html` and uses Brotli for text. Pages Functions (`/api/*`) were not emulated.
- **Crawl:** 8 sitemaps from `/sitemap-index.xml` with 47 URLs, plus every internal link on those pages, plus canonical, hreflang, Open Graph, icon, script and image targets. That came to 317 URLs: 188 HTML pages and 121 assets, 4 requests at a time with `redirect: 'manual'`. `/until/07-30`, `/embed/cook`, `/embed.js`, `/pip`, `/ja/pip` and a 404 were checked separately.
- **Browser checks:** headless Chromium (Playwright 1.63) at 390 × 844, mobile user agent, with the service worker blocked and then allowed. There was also a throttled run (150 ms latency, 1.6 Mbps, CPU ×4). The repo gates `pnpm test:seo` (83 of 83 passed) and `pnpm -F web size` were also run.
- **Limits:** results match what Cloudflare would serve from this build. They do not cover anything Cloudflare adds at the edge (Web Analytics or Zaraz injection, email obfuscation, the real Brotli level), the Pages environment variables used on the live project, or whether `awaketab.com` is attached yet. Byte counts use Brotli quality 4, so the real site may be a little smaller.

## 1. Links

The crawl found no 4xx or 5xx on any internal link. No internal link hits a redirect or a non-canonical spelling (a trailing slash, `.html` or `/index`). No `#id` link targets a missing anchor. Every redirect in `_redirects` is a single hop to a 200. `/for/navigation` and the other cut pages return 404, as intended.

| URL or key | Problem | Severity | Suggested fix |
|---|---|---|---|
| `/how-we-tested` (301 to `/learn/how-we-tested`) | The legacy URL redirects to a page that is a noindex draft, so any link equity it has goes to a page that cannot rank. | Low | Leave it until `/learn/how-we-tested` is rewritten. Or point the redirect at `/about`, which is indexable, for now. |
| 48 indexable English pages link to 91 noindex pages (453 links; for example the `/for` hub links to `/for/downloads` and `/for/reading`, and every page links to the 7 locale homes) | Crawl budget goes to pages that are not meant to rank yet. This is what the draft gate intends (`noindex, follow`), so it is informational. | Low | No change needed now. Recheck when the drafts are rewritten. |
| `/extension` links to `https://chromewebstore.google.com/search/AwakeTab` and `https://microsoftedge.microsoft.com/addons/search/AwakeTab` | The store links are search pages, not listings, because the extension is not published yet. | Low | Replace them with the listing URLs at store launch (that work is on its own branch). |
| `apps/web/public/sitemap-0.xml` (copied to `dist/sitemap-0.xml`) | An old static sitemap that lists only `/` is still deployed. The index does not reference it, but crawlers that remember it will keep fetching it. | Low | Delete `public/sitemap-0.xml`. The build writes `sitemap-{locale}.xml`. |

## 2. SEO

**Checks that passed.** All 47 sitemap URLs return 200, are indexable and have a self canonical. Each has exactly one `h1`, a title of 60 characters or less and a description of 70 to 155 characters. Each has a reachable `og:image` (1200 × 630), `og:url` equal to the canonical, and hreflang `en` plus `x-default`, and the sitemap `xhtml:link` sets match the HTML. There are no duplicate titles or descriptions. All 19 English draft articles, all 70 translated articles, the 7 locale homes, `/until/*`, `/pip`, `/{lang}/pip`, `/pro/activate`, `/pro/manage`, `/embed/cook` and `/404` are noindex. No indexable page points hreflang at a noindex page, and the hreflang links are reciprocal. Every JSON-LD block parses, 188 of 188.

| URL or key | Problem | Severity | Suggested fix |
|---|---|---|---|
| Organization JSON-LD on 51 pages (`sameAs`) | `sameAs` lists `https://github.com/awaketab`, which GitHub says does not exist or is not visible, and `https://www.npmjs.com/package/@awaketab/wake`, where the registry returns 404 because the package is unpublished. Pointing to entities that do not exist weakens the knowledge-graph signal. | Medium | List only profiles that exist today, such as the real repository `github.com/SoubhikBiswas-gitHub/awaketab`. Add the npm URL after the first publish. |
| Article JSON-LD on 135 pages (`author`, `publisher`) | `author` and `publisher` are only `@id` references (`/about#person`, `/#org`). Google does not resolve `@id` across pages, so on every page except `/about` the Article has an author and publisher with no `name`. | Medium | Put `name` (and `url`) on the author and publisher objects inline, keeping the `@id`. |
| Article JSON-LD without `image` on 19 indexable pages: `/15m`, `/30m`, `/45m`, `/1h`, `/2h`, `/4h`, `/8h`, `/for`, `/on`, `/vs`, `/guides`, `/learn`, `/privacy`, `/terms`, `/changelog`, `/pro`, `/embed`, `/kiosk`, `/library` | Google lists `image` as a recommended Article property. These pages already have an `og:image`. | Medium | Emit `image` from the same Open Graph image URL. |
| Absolute URLs in canonicals, `og:image`, JSON-LD and sitemaps (all `https://awaketab.com/...`) | On the `pages.dev` host every share card, canonical and sitemap points at `awaketab.com`. If the custom domain is not attached yet, shared links show no preview image. **Not verified**, because both hosts were blocked. | Medium (if the domain is not live) | Check `curl -I https://awaketab.com/og/home-en.png`. If it fails, attach the domain before sharing links, or build previews with `PUBLIC_SITE_URL` set to the host they are served from. |
| `scripts/sitemap.mjs` (`lastmod` on every URL and sitemap) | `git log -- apps/web/src` runs with `apps/web` as the working directory, so the pathspec matches nothing. `lastmod` therefore falls back to the build time on every deploy. Google ignores `lastmod` once it proves unreliable. | Medium | Use the pathspec `src` (relative to `apps/web`) or `:/apps/web/src`. Better still, take each page's own `updated` date from frontmatter. |
| Every URL on `awaketab.pages.dev` | The host rules in `_headers` send `X-Robots-Tag: noindex` to every response on `*.pages.dev`, so the live preview site cannot be indexed. This is intended (`docs/14-devops.md` §1); it is recorded so nobody mistakes it for a bug. | Low | None. Index through `awaketab.com` only. |
| `robots.txt` `Disallow: /embed/` and `Disallow: /pip` (plus `/{lang}/pip`) | Crawlers never fetch these URLs, so they never see the `noindex`. `/embed/cook` will be iframed on many third-party pages, and Google can index a blocked URL from links alone ("Indexed, though blocked by robots.txt"). | Low | Allow crawling of `/embed/` and `/pip` and rely on the `noindex` meta and header that are already there. |
| `/until/HH-MM` (288 pages) | `noindex` and a canonical to `/` on the same page send mixed signals. | Low | Keep `noindex` and drop the cross-page canonical, or keep the canonical and drop `noindex` (the routes table asks for both, so decide in `docs/00-conventions.md` first). |
| `/404` served for unknown URLs | The error page declares `canonical: https://awaketab.com/404`. | Low | Omit the canonical on the 404 page. |
| 74 pages, including every indexable non-article page (`/`, `/15m` to `/8h`, hubs, `/pro`, `/about`, legal pages) | `og:image:alt` is missing (article pages have it). | Low | Add `og:image:alt` to the base layout for every page. |
| `og:locale` on all pages | Values are `en`, `es`, `de`, `fr`, `ja`, `hi`, `pt_BR` and `zh_Hans`. Open Graph expects `language_TERRITORY` (for example `en_US`, `zh_CN`), and `zh_Hans` is a script code, not a territory. | Low | Map to `en_US`, `es_ES`, `pt_BR`, `de_DE`, `fr_FR`, `ja_JP`, `zh_CN` and `hi_IN`. |
| `/pro/activate` | Five `h1` elements (one per hidden state: "Activate Pro", "Pro is active", "Checkout closed", and so on). The page is noindex, but screen readers list five top-level headings. | Low | Keep one `h1` and render the state headings as `h2` with the existing `.at-pro-h1` class, so nothing changes visually. |
| Article type on tool, pricing, hub and legal pages (`/30m`, `/pro`, `/for`, `/privacy`, and others) | Duration tool pages and `/pro` are typed `Article` with no image. The type does not describe the page. | Low | Use `WebPage` (or `CollectionPage` for hubs), and `WebApplication` with `offers` for the duration pages. |
| `WebApplication` and `SoftwareApplication` (`/`, `/extension`) | Required fields are present (`name`, `applicationCategory`, `operatingSystem`, `offers`). Google shows software rich results only with `aggregateRating` or `review`, so these will not be eligible. That is correct: fake ratings must never be added. | Low | None. This row is for information. |
| FAQPage and HowTo | Not emitted anywhere, although the articles have FAQ sections and step lists. Google shows FAQ rich results only for a few authoritative sites and has retired HowTo, so the gain would be small. | Low | Optional. If added, mark up only the visible FAQ text. |
| Locale homes (`/ja/`, `/zh/`, `/hi/` and the others) JSON-LD | The same `@id` values (`/#org`, `/#website`, `/#app`) are repeated with a different `inLanguage` and with `url` pointing to the English root. | Low | Give locale nodes their own `@id` and `url` (for example `/ja/#website`). This matters once the locale homes become indexable. |
| Locale home descriptions (noindex today) | `/ja/` is 68 characters and `/zh/` is 55, both under the repo's 70-character minimum. `/de/` is 163, over 155. | Low | Fix before those pages are reviewed and made indexable. |

## 3. Security headers

**Checks that passed** on `/`, `/30m`, `/until/07-30`, `/for/cooking`, `/pro`, `/pro/activate`, `/embed/cook`, `/embed.js`, `/es/`, `/privacy` and a 404:

- Every response has a CSP. `script-src` is `'self'` plus one sha256 hash, with no `'unsafe-inline'`, and the hash matches `src/boot/boot.js`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: screen-wake-lock=(self), picture-in-picture=(self), camera=(), ...`.
- `frame-ancestors 'none'` plus `X-Frame-Options: DENY` everywhere except `/embed/*`, which sends `frame-ancestors *` and no `X-Frame-Options`, so it can be framed as intended. The landing page `/embed` is not framable.
- The loader `/embed.js` creates the iframe with `allow="screen-wake-lock"` and a sandbox.
- Third-party requests on tool routes: headless Chromium made requests only to the site's own origin on `/` (15 requests), `/30m` (15), `/for/cooking` (13), `/pro` (8) and `/until/07-30` (14). Budget: 0. Passed.

| URL or key | Problem | Severity | Suggested fix |
|---|---|---|---|
| `/pip`, `/es/pip`, `/pt-br/pip`, `/de/pip`, `/fr/pip`, `/ja/pip`, `/zh/pip`, `/hi/pip` | The popup fallback for the floating window has its whole logic in an inline `<script type="module">` (3.4 KB) with hash `sha256-0gf9FeQCkJJ1NZYFVLuYxFYmlmLr1mo1z42gDWWjqqE=`, which is not in the CSP. Chromium refuses it: "Refused to execute inline script because it violates ... script-src". The popup opens but shows nothing live. It is used when Document Picture-in-Picture is missing (Safari, Firefox before 151, some Chromium builds). The cause is that Astro inlines small processed scripts (`<script src="../tool/pip-mirror.ts">` in `components/PipPage.astro`). | High | Stop Astro inlining processed scripts (`vite.build.assetsInlineLimit: 0` in `astro.config.mjs`, then check the size gate). Or have `scripts/headers.mjs` hash every inline executable script found in `dist`. |
| `/privacy`, `/terms` | The same cause: the "On this page" scroll-spy script from `components/pages/LegalDoc.astro` is inlined (hash `sha256-g9Nb0tNLwAtr5sB7BFeBDJX0u9ybb66ez6kk97BDlyw=`) and blocked. `aria-current` never updates. | Low | The fix above covers this too. |
| `apps/web/test/seo/security.test.ts` ("every built page carries only inline scripts whose sha256 the route CSP allows") | The test name says every page, but it checks only 6 pages (`/`, `/30m`, `/for/cooking`, `/es/`, `/embed/cook`, `/pro`). That is how the two problems above got through. | Medium | Walk every `.html` file in `dist` (443 files) and match each against the CSP of its route. |
| All routes: `style-src 'self' 'unsafe-inline'` | Needed today because every page inlines its CSS and uses `style=""` custom properties. The risk is low (no script execution), but it permits CSS injection. | Low | Accept it for now. Revisit if the inline styles become static hashes plus `'unsafe-hashes'`. |
| Content routes (`/for/*`, `/on/*`, `/vs/*`, `/guides/*`, `/learn/*`, and the same under every locale) | The content CSP has no `form-action` (it does not fall back to `default-src`) and no `upgrade-insecure-requests`, unlike the default CSP. | Low | Add `form-action 'self'` and `upgrade-insecure-requests` to `CONTENT_CSP` in `scripts/headers.mjs`. |
| Content routes | Ad hosts (`pagead2.googlesyndication.com`, `*.google.com`, `*.doubleclick.net`) are allowed in `script-src` and `connect-src` although ads are off (`config/ads.json` has `enabled: false`). | Low | Add the ad hosts only when the ads gate opens. |
| `/embed/*` | The embed CSP has no `base-uri`, `form-action` or `report-to`, although `Reporting-Endpoints` is sent. | Low | Add `base-uri 'none'; form-action 'none'; report-to csp`. |
| All routes | CSP reports use only `report-to`. Firefox and Safari do not support the Reporting API for CSP yet, so violations in those browsers (where the `/pip` fallback runs most) are never reported. | Low | Add `report-uri /api/csp` alongside `report-to` (the endpoint already accepts the legacy body). |
| `/kiosk`, `/pro/manage`, `/pro/activate` | This build links to `sandbox.polar.sh` and `sandbox-api.polar.sh` because `PUBLIC_POLAR_SERVER` was not `production`. Whether the live project uses the sandbox value could not be checked. | Low (unverified) | Confirm the Production environment variables in the Pages project before launch. |

## 4. Translations (ja, zh, hi against en)

**Programmatic checks.** Each of `ja.json`, `zh.json` and `hi.json` has all 886 keys of `en.json`, with no missing or extra keys and no broken HTML. Placeholders were compared by name and by plural structure (`{name}`, `{n}`, `{minutes, plural, one {...} other {...}}`), with 0 mismatches in all three files.

**English on purpose (reported once).** 337 `page.pro.*` keys (including `page.pro.activate.*`, `page.pro.manage.*`, `page.pro.checkout.*`, `page.pro.lapse.*` and the rest of the Pro page) are English in every locale, as intended. The brand and symbol keys are also English: `app.name`, `pro.title`, `pro.badge`, `settings.pro`, `header.nav.pro`, `end.notify.title`, `ext.name`, `page.extension.h1`, `tool.preset.pinf`, `tool.timer.indefiniteIdle` and `pip.add15`. These are not findings.

"Certain" means objective: untranslated text, a meaning that differs from the current English, or an inconsistency inside the same file. Everything stylistic is marked "needs a native speaker".

### 4.1 Issues in all three locales

| Key | Locale: current text | Problem | Suggested text | Severity | Confidence |
|---|---|---|---|---|---|
| `license.error.token` | ja, zh, hi: "This device needs to re-activate." | Untranslated. It is not a Pro-page key; the other `license.error.*` keys are translated. | ja: 「このデバイスは再度有効化が必要です。」 · zh: "此设备需要重新激活。" · hi: "इस डिवाइस को फिर से सक्रिय करना होगा।" | Low | Certain |
| `page.hub.on.description`, `page.hub.on.h1`, `page.hub.guides.description`, `page.hub.guides.h1`, `page.hub.learn.description`, `page.hub.learn.h1`, `content.stale`, `content.author.role` | Translations of the earlier English (the English was rewritten for the fact-check; the locales were not) | The meaning differs from the current English. Three of these bring back claims the English removed: the guides hub description mentions battery saver (ja 「省電力」, zh "省电", hi "बैटरी सेवर"); `content.stale` says "re-testing" (ja 「再テスト中」, zh "正在重新测试", hi "दोबारा परीक्षण जारी"); `content.author.role` says the author "develops and tests" AwakeTab. | See the per-locale rows below. | Medium | Certain |
| Term for "screen awake" | Several different terms in each locale (listed per locale below) | The same idea (the pill "Screen awake", hub titles, embed labels, footer) uses 3 or 4 different terms per locale, so readers cannot tell they mean the same state. | ja: 「画面をオンのまま（に保つ）」, pill 「画面オン中」 · zh: "保持常亮" · hi: "स्क्रीन ऑन रखें" / "स्क्रीन ऑन है". Keep the "system/computer awake" wording (the extension's System level) separate. | Medium | Certain (inconsistency); choice of term needs a native speaker |

### 4.2 Japanese (ja.json)

| Key | Current text | Problem | Suggested text | Severity | Confidence |
|---|---|---|---|---|---|
| `page.hub.on.description` | ブラウザとOSごとの正直な手順。ネイティブ対応、電池制限、フォールバックを分けて書きます。 | Stale; the English now reads "Pick your phone, tablet, computer or browser: the version that works, the steps, and the limits your system still sets." | スマホ、タブレット、パソコン、ブラウザを選んでください。使える方法と手順、そしてシステム側に残る制限をまとめています。 | Medium | Certain |
| `page.hub.on.h1` | 端末でAwakeTabを使う | Stale ("Use AwakeTab on your device"); the English is "Keep the screen awake on your device". | お使いの端末で画面をオンのままにする | Medium | Certain |
| `page.hub.guides.description` | 省電力や自動ロックの直し方。隠れタブや閉じたフタは約束しません。 | Stale, and brings back the battery-saver framing. | 画面が消えるまでの時間、グレー表示の自動ロック、暗くなる画面の直し方と、AwakeTab で変えられること・変えられないこと。 | Medium | Certain |
| `page.hub.guides.h1` | ウェイクロックの対処ガイド | Stale; the English is "Fix the settings that turn your screen off". | 画面が消える設定を直す | Medium | Certain |
| `page.hub.learn.description` | Screen Wake Lock API、対応、プライバシー、検証、ウェブページの限界。 | Stale; still mentions "testing". | AwakeTab のステータス表示を支える事実：どのブラウザがウェイクロックに対応し、何がそれを拒否し、何ができないのか。 | Medium | Certain |
| `page.hub.learn.h1` | ウェイクロックを学ぶ | Stale; the English is "How screen wake locks work". | ウェイクロックの仕組み | Medium | Certain |
| `content.stale` | 最終確認から6か月以上経過 — 再テスト中 | Stale; says re-testing, but the English says the sources are being re-checked. | 情報源の最終確認から6か月以上たっています。現在確認し直しています。 | Medium | Certain |
| `content.author.role` | AwakeTabを開発・テストしています。 | Adds "tests", which the English removed ("Builds AwakeTab."). | AwakeTab を開発しています。 | Medium | Certain |
| Terminology (`page.home.intro`, `page.hub.for.title`, `page.hub.for.h1`, `page.hub.for.description`, `page.hub.on.title`, `page.hub.vs.h1`, `footer.honest`, `ambient.awakeFor`, `ext.pill.systemHeld`) | 画面を起こす / 画面が起きている / 起動中の画面 / 画面起こしツール | 起こす and 起きている read as "wake someone up" or "get up", and 起動中 means "starting up" or "running". Neither matches 画面オン中 on the pill. | 画面をオンのままにする / 画面オン中 (for example `page.hub.for.h1`: 作業中は画面をオンのままに) | Medium | Needs a native speaker |
| `page.home.intro` | …ロックが確認されたあとでのみ画面が起きていると表示します。 | Unnatural, and it does not use the pill wording. | …ブラウザがロックを確認したときだけ「画面オン中」と表示します。 | Low | Needs a native speaker |
| `ambient.awakeFor` | 起動からの時間 | Reads as "time since start-up"; the English is how long the screen has been kept awake. | 画面オンの経過時間 | Low | Needs a native speaker |
| `ext.pill.systemHeld` | システム起動中 | Reads as "system is booting/running". | システムのスリープ防止中 | Low | Needs a native speaker |
| `footer.honest` | 起動中の画面に広告は出しません。今後も同じです。 | 起動中の画面 does not mean "the awake screen". | 画面をオンにしている間は広告を出しません。今後も出しません。 | Low | Needs a native speaker |
| `page.home.limits.title`, `content.limit` | 正直な制限 | A literal rendering of "honest limits"; unnatural. | できないこと（正直にお伝えします） or 制限について | Low | Needs a native speaker |
| `page.library.description` | …NoSleep.js の後継です。 | 後継 implies an official successor; the English says "the maintained replacement". | …メンテナンスが続いている NoSleep.js の代替です。 | Low | Needs a native speaker |
| `embed.meta.requesting`, `library.demo.scenario.real`, `research.col.browser` | ブラウザー | Everywhere else the file uses ブラウザ. | ブラウザ | Low | Certain |
| `ext.options.defaults`, `page.extension.permissions.sites` | デフォルト | `settings.defaultPreset`, `settings.reset` and `settings.ambient.mode` use 既定. | 既定 (or use デフォルト everywhere) | Low | Certain (inconsistency) |
| `page.library.description`, `library.demo.scenario.unsupported` | フォールバック | The tool strings use 代替方式 for the same fallback. | 代替方式 | Low | Certain (inconsistency) |
| `footer.changelog` | 変更履歴 | The page it links to is titled 更新履歴. | 更新履歴 | Low | Certain |
| `builder.size.compact`, `builder.size.full`, `builder.msg`, `builder.logo`, `builder.token`, `library.demo.*`, `page.library.h1` | Half-width `(` `)` `:` (for example コンパクト(320 × 96), シミュレーション:省電力モード…) | The rest of the file uses full-width （） and ：. | コンパクト（320 × 96）, シミュレーション：… | Low | Certain (inconsistency) |

### 4.3 Chinese, Simplified (zh.json)

| Key | Current text | Problem | Suggested text | Severity | Confidence |
|---|---|---|---|---|---|
| `page.hub.on.description` | 按浏览器和系统设计的诚实说明，区分原生支持、电池限制和回退。 | Stale (see the ja row). | 选择你的手机、平板、电脑或浏览器：可用的方法、具体步骤，以及系统仍会施加的限制。 | Medium | Certain |
| `page.hub.on.h1` | 在设备上使用 AwakeTab | Stale. | 在你的设备上让屏幕保持常亮 | Medium | Certain |
| `page.hub.guides.description` | 修复省电和自动锁定。从不承诺后台标签或合盖仍有效。 | Stale, and brings back the battery-saver framing. | 逐步解决屏幕超时、自动锁定变灰和屏幕变暗的问题，并说明 AwakeTab 能改变和不能改变的部分。 | Medium | Certain |
| `page.hub.guides.h1` | 唤醒锁排除指南 | Stale. | 修复让屏幕熄灭的设置 | Medium | Certain |
| `page.hub.learn.description` | Screen Wake Lock API、支持、隐私、测试，以及网页能做到的边界。 | Stale; still mentions "testing". | AwakeTab 状态标签背后的事实：哪些浏览器支持屏幕唤醒锁、什么会拒绝它，以及它做不到什么。 | Medium | Certain |
| `page.hub.learn.h1` | 学习屏幕唤醒锁 | Stale. | 屏幕唤醒锁的工作原理 | Medium | Certain |
| `content.stale` | 上次验证已超过 6 个月 — 正在重新测试 | Stale; says re-testing. | 来源核对已超过 6 个月，正在重新核对。 | Medium | Certain |
| `content.author.role` | 开发并测试 AwakeTab。 | Adds "tests". | 开发 AwakeTab。 | Medium | Certain |
| Terminology (`page.home.intro`, `page.hub.for.title`, `page.hub.for.h1`, `page.hub.on.title`, `page.hub.vs.h1`, `page.hub.for.description`, `tool.fallback.consent.body`, `ambient.cook.pausedNote`, `ambient.message.label`, `ambient.awakeFor`) | 保持唤醒 / 保持点亮 / 唤醒屏幕 / 已唤醒 | The pill says 屏幕保持常亮; four other variants are used for the same state. | 保持常亮 (for example `page.hub.for.title`: 按任务让屏幕保持常亮 — AwakeTab) | Medium | Needs a native speaker |
| `page.home.intro` | …只有浏览器确认锁定后，状态才会写屏幕已保持唤醒。 | 写 ("writes") is unnatural. | …只有在浏览器确认锁定后，状态才会显示“屏幕保持常亮”。 | Low | Needs a native speaker |
| `ambient.message.label` | 唤醒屏幕上的消息 | Reads as "message on the wake-up screen" (唤醒 as a verb). | 常亮屏幕上的留言 | Low | Needs a native speaker |
| Message mode (`ambient.mode.message`, `settings.ambient.message`, `ambient.message.empty`, `ambient.message.pro` against `ambient.message.edit`, `ambient.message.show`, `ambient.message.label`, `page.kiosk.description`, `builder.msg`) | 留言 in some keys, 消息 in others | One feature, two names. | Pick one (留言 matches the mode name) | Low | Certain (inconsistency) |
| `page.library.description`, `library.demo.scenario.unsupported` | 后备 | The tool strings use 备用方案 for the fallback. | 备用方案 | Low | Certain (inconsistency) |
| `ext.privacy.stored` | Chrome 帐号 | `page.home.description` uses 账号 (the standard form). | Chrome 账号 | Low | Certain |
| `settings.telemetry.help` | 事件只留在 awaketab.com。 | 事件 ("events") is literal and unclear to users. | 数据只发送到 awaketab.com。 | Low | Needs a native speaker |
| `embed.advice.iframe_no_allow`, `page.embed.description`, `page.kiosk.description`, `page.library.description`, `page.library.h1`, `builder.*`, `library.demo.*`, `research.pending.body` | Half-width `,` `:` `(` `)` inside Chinese text (for example 请联系网站所有者,为此小组件…) | The rest of the file uses full-width ，：（）. | Full-width punctuation | Low | Certain (inconsistency) |

### 4.4 Hindi (hi.json)

| Key | Current text | Problem | Suggested text | Severity | Confidence |
|---|---|---|---|---|---|
| `page.hub.on.description` | ब्राउज़र और सिस्टम के लिए ईमानदार निर्देश: मूल समर्थन, बैटरी सीमा और फॉलबैक। | Stale. | अपना फ़ोन, टैबलेट, कंप्यूटर या ब्राउज़र चुनें: कौन-सा तरीका काम करता है, उसके स्टेप, और आपका सिस्टम अब भी कौन-सी सीमाएँ लगाता है। | Medium | Certain |
| `page.hub.on.h1` | अपने डिवाइस पर AwakeTab चलाएँ | Stale. | अपने डिवाइस पर स्क्रीन ऑन रखें | Medium | Certain |
| `page.hub.guides.description` | बैटरी सेवर और ऑटो-लॉक ठीक करें। छिपा टैब या बंद ढक्कन का वादा नहीं। | Stale, and brings back the battery-saver framing. | स्क्रीन टाइमआउट, ग्रे हुआ Auto-Lock और बुझती स्क्रीन के लिए स्टेप-बाय-स्टेप हल, साथ में यह कि AwakeTab क्या बदल सकता है और क्या नहीं। | Medium | Certain |
| `page.hub.guides.h1` | वेक लॉक गाइड | Stale. | स्क्रीन बंद करने वाली सेटिंग ठीक करें | Medium | Certain |
| `page.hub.learn.description` | Screen Wake Lock API, समर्थन, गोपनीयता, परीक्षण और वेब पेज की सीमाएँ। | Stale; still mentions "testing". | AwakeTab के स्टेटस के पीछे के तथ्य: कौन-से ब्राउज़र स्क्रीन वेक लॉक सपोर्ट करते हैं, कौन इसे मना कर सकता है, और यह क्या नहीं कर सकता। | Medium | Certain |
| `page.hub.learn.h1` | वेक लॉक सीखें | Stale. | स्क्रीन वेक लॉक कैसे काम करते हैं | Medium | Certain |
| `content.stale` | अंतिम जाँच 6 महीने से पहले — दोबारा परीक्षण जारी | Stale; says re-testing. | स्रोत 6 महीने से ज़्यादा पहले जाँचे गए थे। अभी दोबारा जाँचे जा रहे हैं। | Medium | Certain |
| `content.author.role` | AwakeTab बनाते और टेस्ट करते हैं। | Adds "tests". | AwakeTab बनाते हैं। | Medium | Certain |
| Terminology (`page.home.intro`, `page.hub.for.*`, `page.hub.on.title`, `page.hub.vs.h1`, `footer.honest`, `embed.frame.title`, `embed.digits.start`, `embed.advice.tapToStart`, `embed.attribution`, `embed.minimal.*`, `embed.timers.empty`, `page.embed.*`, `page.kiosk.description`, `page.extension.title`, `ambient.message.label`, `ambient.cook.pausedNote`) | स्क्रीन जगाए रखें / जगी / जागती / स्क्रीन-जाग / चालू | The pill says "स्क्रीन ऑन है"; four other variants are used for the same state. | स्क्रीन ऑन रखें / स्क्रीन ऑन है. Keep जागा रखें only for the computer or system level. | Medium | Needs a native speaker |
| `page.hub.vs.h1` | स्क्रीन-जाग उपकरण तुलना | Unnatural compound. | स्क्रीन ऑन रखने वाले टूल की तुलना | Low | Needs a native speaker |
| `page.home.intro` | …लॉक की पुष्टि के बाद ही स्थिति स्क्रीन जगे होने की बात कहती है। | Awkward, and not the pill wording. | …और ब्राउज़र के लॉक की पुष्टि करने के बाद ही स्टेटस “स्क्रीन ऑन है” दिखाता है। | Low | Needs a native speaker |
| "Key" (`ext.license.devices`, `ext.license.get`, `ext.license.working` against `pro.activate`, `license.error.*`) | की against कुंजी | The loanword की collides with the postposition की (अपनी की awaketab.com पर देखें), and the web app uses कुंजी. | कुंजी (for example अपनी कुंजी awaketab.com पर देखें) | Low | Certain (inconsistency) |
| `content.start`, `page.privacy.description` | सत्र | Every other key uses सेशन. | सेशन | Low | Certain (inconsistency) |
| `footer.privacy`, `footer.terms`, `footer.changelog` | प्राइवेसी / शर्तें / चेंजलॉग | The pages they link to are titled गोपनीयता / नियम / परिवर्तन सूची. | Use the page titles (or rename the pages) | Low | Certain (inconsistency) |
| Message mode (`ambient.mode.message`, `settings.ambient.message`, `ambient.message.empty` against `ambient.message.edit`, `ambient.message.show`, `ambient.message.label`, `builder.msg`) | मैसेज in some keys, संदेश in others | One feature, two names. | Pick one | Low | Certain (inconsistency) |
| Extension strings (`ext.remove`, `ext.license.*`, `page.extension.*`) | हटाएं, यहां, मांगता, पांच, अनुमतियां, पाएं | The web strings use chandrabindu (हटाएँ, यहाँ, माँगने). | Chandrabindu forms throughout | Low | Certain (inconsistency) |
| `pwa.ios.hint`, `pwa.ios.body`, `tool.advice.low_power_ios` | Share, "Add to Home Screen", Low Power Mode, Settings → Battery in English | iOS in Hindi shows Hindi labels. English may be the better choice if most users run iOS in English. | Decide per audience; if Hindi: “शेयर करें”, “होम स्क्रीन में जोड़ें” | Low | Needs a native speaker |
| `tool.timer.elapsed` | {time} से ऑन | With a clock-like value (00:12:34) this can read as "on since 00:12:34". | ऑन: {time} | Low | Needs a native speaker |
| `ambient.cook.for` | पकाते हुए | Drops "for" (a duration label follows). | पकाने का समय | Low | Needs a native speaker |
| `ambient.cook.timer.hours`, `ambient.cook.min` | {hours} घं, मि | Uncommon abbreviations. | {hours} घंटे, मिनट | Low | Needs a native speaker |

## 5. Performance (mobile)

Method: headless Chromium, 390 × 844, mobile user agent, cold cache, service worker blocked, Brotli from the emulator. "Transferred" is the sum of encoded response bodies. Load times come from a local server and are shown only to compare pages; they are not field data.

| Page | Requests | Transferred | HTML (br) | JS | Fonts | CLS, throttled run | Render-blocking |
|---|---|---|---|---|---|---|---|
| `/` | 15 | 111.3 KB | 36.9 KB | 12 files, 23.1 KB | 2 files, 51.3 KB | 0.072 | none |
| `/30m` | 15 | 104.9 KB | 30.6 KB | 12 files, 23.1 KB | 2 files, 51.3 KB | 0.060 | none |
| `/for/cooking` | 13 | 86.5 KB | 36.5 KB | 11 files, 21.3 KB | 1 file, 28.7 KB | 0 | none |
| `/pro` | 8 | 69.5 KB | 34.7 KB | 6 files, 6.1 KB | 1 file, 28.7 KB | 0 | none |

No page has a stylesheet or a network script in `<head>` without `async`, `defer` or `type="module"`. Chromium's `renderBlockingStatus` reported no blocking resources. The only synchronous head script is the inline boot script (8.9 KB, allowed by hash).

Budgets (`docs/00-conventions.md` §11), from the repo's own size gate on this build: critical JS 14,819 of 15,360 bytes gz · total tool JS 40,892 of 40,960 bytes gz · tool CSS 16,914 of 20,480 bytes gz · embed app 14,859 of 25,600 · loader 2,969 of 3,072 · hydrated islands 0 · third-party requests 0. **No budget is exceeded.** CLS goes over its budget of 0 in the throttled run (see below).

| URL or key | Problem | Severity | Suggested fix |
|---|---|---|---|
| `/`, `/30m` (and every page with the tool) | CLS was 0.060 to 0.072 in the throttled run, against a budget of 0. The shifting elements were `.at-chips`, `.at-tool-more` and the content below them. They move when the hidden notice (`.at-notice` in `ToolPanel.astro`) is revealed after a denied lock. In headless Chromium this happened on first load. Unthrottled CLS was 0. | Medium | Keep the notice out of the flow above the chips: reserve its row with the existing gap tokens (`--at-gap-item`, `--at-gap-group`) or show it through the existing toast or banner pattern (`.at-toast`, `.at-banner`). No new styles. |
| Tool JS budget | Total tool JS is 40,892 of 40,960 bytes, 68 bytes (0.2%) under the limit. Critical JS is at 96.5%. The next feature will fail the gate. | Medium | Plan headroom now, for example by moving rarely used lazy chunks (rating, sponsor, kiosk) out of the tool-page closure, before new work lands. |
| Service worker precache (first visit to any tool page) | On first load the service worker fetched 71 URLs: all 7 locale homes, all 8 `/pip` pages, every `_astro` chunk (including Pro, kiosk, embed and library page scripts), manifests and icons. That is about 660 KB after Brotli, on a mobile connection, for pages this visitor will mostly never open. | Medium | Precache only the visitor's own locale home, `/` and the tool's closure. Cache the rest at runtime. |
| All pages: CSS inlined in full (`build.inlineStylesheets: 'always'`) | Each page carries 83 to 150 KB of raw CSS (15 to 26 KB gz) in its HTML, so every navigation downloads the shared CSS again. HTML is 166 to 213 KB raw. | Low | Inline only the above-the-fold CSS (the budget says "critical inlined") and serve the rest as one cached, hashed stylesheet under `/_astro/`. |
| `/pro`, `/about`, legal and product pages | 21.9 to 25.8 KB gz of inlined CSS. The 20 KB budget applies only to tool pages, so this is not a breach. | Low | Covered by the row above. |
| Tool pages: fonts | Geist (28.7 KB) is preloaded; Geist Mono (22.6 KB, used for the timer digits) is not, and both use `font-display: swap`. No shift from the font swap was measured, but the timer digits can reflow when Geist Mono arrives. | Low | Preload Geist Mono on tool pages only, or keep the digit box a fixed width (it uses the existing `--at-*` type roles). |

## Outside the five sections (found while testing)

| URL or key | Problem | Severity | Suggested fix |
|---|---|---|---|
| `packages/wake/src/classify.ts` (`classifyDenial`, default return) and `index.ts` (three visible releases in 10 s); `en.json` `tool.advice.battery_saver` and its ja, zh and hi versions; `library.demo.scenario.denied` | Any denial that matches no specific cause is reported as "Your device's battery saver is blocking the wake lock". In headless Chromium, `/30m` showed "Blocked — here's the fix. Your device's battery saver is blocking the wake lock." on first load. The repo's own fact-check (`docs/research/fact-check-2026-09-26.md`) found that Chromium and WebKit never refuse a lock because of battery saver. This is the exact claim that was removed from the articles. | High | Add a neutral default advice ("The browser refused the wake lock. Tap Start to try again, or use the fallback."). Keep the specific causes that were verified. Relabel the library demo scenario. This changes pill-adjacent copy, so update docs/04 and docs/05 first. |

## Top 10 findings

1. **High.** The floating-window fallback `/pip` and its 7 locale copies are broken by the CSP. The inline module script is not hashed, and Chromium refuses to run it (Security §3).
2. **High.** A denied lock with no known cause is blamed on "battery saver", which the repo's own fact-check says is false. This is visible in the tool and in all translations (Outside the five sections).
3. **Medium.** The CSP inline-script test checks 6 of 443 pages, which let the `/pip`, `/privacy` and `/terms` breakage through (Security §3).
4. **Medium.** In ja, zh and hi, 8 keys are stale translations that bring back claims the English removed (battery saver, "re-testing", "tests AwakeTab") (Translations §4.1).
5. **Medium.** Each of ja, zh and hi uses 3 or 4 different terms for "screen awake" (Translations §4.1).
6. **Medium.** Organization `sameAs` points at a GitHub account and an npm package that do not exist (SEO §2).
7. **Medium.** Article structured data has author and publisher only as cross-page `@id` references with no `name`, and 19 indexable pages have no Article `image` (SEO §2).
8. **Medium.** CLS of 0.06 to 0.07 on `/` and `/30m` when the denial notice appears, against a budget of 0 (Performance §5).
9. **Medium.** The tool JS budget has 68 bytes of headroom, and first-visit service-worker precache pulls about 660 KB on mobile (Performance §5).
10. **Medium.** Sitemap `lastmod` is always the build time because of a pathspec bug in `scripts/sitemap.mjs` (SEO §2).

Two more to note: every absolute URL points at `awaketab.com`, which could not be checked from here (SEO §2), and the whole `pages.dev` host is noindex by design.

## Counts per section

| Section | High | Medium | Low | Total |
|---|---|---|---|---|
| 1. Links | 0 | 0 | 4 | 4 |
| 2. SEO | 0 | 5 | 12 | 17 |
| 3. Security headers | 1 | 1 | 7 | 9 |
| 4. Translations (rows: 3 shared, 20 ja, 16 zh, 20 hi) | 0 | 29 | 30 | 59 |
| 5. Performance | 0 | 3 | 3 | 6 |
| Outside the five sections | 1 | 0 | 0 | 1 |

## Design check

- Visible changes made: none. This task changed no page, style, token, component, copy or image.
- Every recommendation that touches the UI names an existing Clear Night token or shared component: `--at-gap-item` and `--at-gap-group`, `.at-notice`, `.at-toast` and `.at-banner` (tool.css, `ToolPanel.astro`), and `.at-pro-h1`. No new colour, font, size, spacing, radius, shadow or icon is proposed.
- Images: none regenerated or changed. The Open Graph images were only fetched to check they were reachable.
