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
  build: {
    inlineStylesheets: 'always',
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
