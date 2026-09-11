import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

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
    resolve: {
      alias: {
        '@awaketab/wake': fileURLToPath(new URL('../../packages/wake/src/index.ts', import.meta.url)),
        '@awaketab/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
    },
  },
});
