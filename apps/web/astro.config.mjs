import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { polarDefines } from './scripts/polar-server.mjs';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://awaketab.com',
  output: 'static',
  // shadcn/ui components are rendered at build time only (docs/03 ADR-013). No client:* directives.
  integrations: [react()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
    fallback: {},
  },
  // Code blocks take their colours from content.css (--astro-code-* → Clear Night tokens), so they follow the theme
  // and keep AA contrast on the sunken well in light and dark (redesign B5; canvas GuideLearn code blocks).
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
  build: {
    inlineStylesheets: 'always',
    // The file layout IS the URL shape Cloudflare Pages serves with no redirect (docs/14 §2.1):
    //   src/pages/30m.astro, for/[slug].astro, for.astro → dist/30m.html, for/cooking.html, for.html → /30m, /for/cooking, /for
    //   src/pages/index.astro, [lang]/index.astro        → dist/index.html, es/index.html        → /, /es/
    // Pages serves `x.html` at `/x` and `x/index.html` at `/x/`, and 308-redirects the other spelling. So a page
    // whose URL has no trailing slash must be `x.astro`, never `x/index.astro`; only the locale homes are
    // directory indexes. 'directory' (the default) wrote every page as `x/index.html`, and 'file' writes the
    // locale homes as `es.html` (and gives Astro.url a `.html` suffix). test/seo/served-urls.test.ts guards it.
    format: 'preserve',
  },
  vite: {
    plugins: [tailwindcss()],
    // F-06: PUBLIC_POLAR_SERVER picks CHECKOUT_LINKS and whether the bundles trust the dev licence key.
    define: polarDefines(),
    build: {
      // No __vitePreload wrapper or deps map: it put a shared helper chunk and a dependency table on the
      // island's critical path (docs/00 §11: ≤ 15 KB gz). Lazy chunks are small and load on first use.
      modulePreload: false,
    },
    resolve: {
      alias: {
        '@awaketab/wake': fileURLToPath(new URL('../../packages/wake/src/index.ts', import.meta.url)),
        '@awaketab/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
    },
  },
});
