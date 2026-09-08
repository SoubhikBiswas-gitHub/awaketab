# AwakeTab build state

Current milestone: M0 — foundation.

## Completed

- pnpm workspace with strict ESM TypeScript projects for the Astro site, WXT extension, `@awaketab/wake`, and `@awaketab/core`.
- Static Astro holding page with canonical metadata, social metadata, JSON-LD, and a static OG placeholder.
- Tailwind CSS v4 token foundation using the `--at-*` namespace and logical CSS properties.
- Generated Cloudflare `_headers` and `_redirects`, canonical robots and sitemap stubs, and `/api/health`.
- Linting, formatting, unit/function/SEO testing, Playwright, axe, size budgets, Lighthouse assertions, Changesets, and GitHub workflows.
- Toolchain pinned to Node 22 LTS, pnpm 9.15.9, Ubuntu 24.04 LTS runners, Astro 5, Tailwind 4, and exact package versions (no `latest` tags).

## Proposed identifiers

None.

## Known external gaps

- Cloudflare Pages, custom domains, redirects for alternate TLDs, KV bindings, Analytics Engine bindings, and secrets require Soubhik's Cloudflare account.
- GitHub organization/repository settings, branch protection, npm scope ownership, and trusted publishing require external account access.
- Search Console, Bing Webmaster Tools, IndexNow, domain registration, and trademark screening are not local repository work.
- The OG asset and extension icons are foundation placeholders and require final approved brand artwork before public release.
- Native browser and real-device checks remain release-gate work.

## Next

M1 is awaiting approval. It will implement the `@awaketab/wake` lock layer and its complete transition test matrix.
