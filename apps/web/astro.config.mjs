import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { bootInline, BOOT_FILE } from './scripts/boot-inline.mjs';
import { polarDefines } from './scripts/polar-server.mjs';

// Libraries each feature pack owns; they never enter the tool's own chunks.
const PACK_LIBS = [
  [/\/node_modules\/.*(?:@pqina|embla-carousel)/u, 'faces'],
  [/\/node_modules\/.*\/(?:number-flow|esm-env)\//u, 'faces-rolling'],
  [
    /\/node_modules\/(?:.*\/(?:tone|standardized-audio-context|automation-events|tslib)|@babel\/runtime)\//u,
    'sound-tone',
  ],
  [/\/node_modules\/.*\/howler\//u, 'sound-howler'],
  [
    /\/node_modules\/.*(?:@tiptap|prosemirror-|orderedmap|rope-sequence|w3c-keyname|linkifyjs|idb-keyval|annyang)/u,
    'notes',
  ],
  [/\/node_modules\/.*(?:vanilla-colorful|@tsparticles|tsparticles)/u, 'themes'],
  [/\/node_modules\/.*(?:dayjs|easytimer|hotkeys-js)/u, 'extras'],
];

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
    plugins: [
      tailwindcss(),
      {
        // Pages inline `boot.js?raw`; they get the minified text that headers.mjs hashes for the CSP.
        name: 'at-boot-inline',
        enforce: 'pre',
        load(id) {
          if (id === `${BOOT_FILE}?raw`) return `export default ${JSON.stringify(bootInline())};`;
          return undefined;
        },
      },
    ],
    // F-06: PUBLIC_POLAR_SERVER picks CHECKOUT_LINKS and whether the bundles trust the dev licence key.
    define: polarDefines(),
    build: {
      // No __vitePreload wrapper or deps map: it put a shared helper chunk and a dependency table on the
      // island's critical path (docs/00 §11: ≤ 15 KB gz). Lazy chunks are small and load on first use.
      modulePreload: false,
      // Astro inlines a processed <script> under this limit, and the CSP allows only the boot script's hash, so
      // an inlined page script would be blocked. JS always ships as a 'self' file; other assets keep the default.
      assetsInlineLimit: (file) => (file.endsWith('.js') ? false : undefined),
      // Terser with extra compress passes (and `unsafe`: the island never patches built-ins) packs the island a few
      // percent tighter than esbuild's minifier, which keeps the Clear Night tool inside its budgets (docs/00 §11).
      minify: 'terser',
      terserOptions: {
        compress: {
          passes: 5,
          ecma: 2020,
          unsafe_arrows: true,
          unsafe_methods: true,
          pure_getters: true,
          unsafe: true,
        },
        mangle: { toplevel: true },
        format: { comments: false, ecma: 2020 },
        module: true,
      },
      rollupOptions: {
        output: {
          // The tool's on-demand UI (panels, sheets, cards, the end pipeline) ships as one lazy chunk instead of a
          // dozen small ones: every chunk repeats its import header and compresses alone, which cost more of the
          // 40 KB total budget than the code itself. It still loads only on first use, never on the boot path.
          manualChunks(id) {
            // Feature packs (src/tool/packs/<name>/ and their libraries) load on first use under their own budgets.
            // Each clock face is its own chunk (pack-faces-<id>), so picking one never downloads the others.
            const face = /\/src\/tool\/packs\/faces\/(flip|rolling|analog|rings|word|nixie|lcd|matrix)[.-]/u.exec(
              id,
            )?.[1];
            if (face) return `pack-faces-${face}`;
            // The sound pack's synth engine and track player load when something first plays, not with its panel.
            const snd = /\/src\/tool\/packs\/sound\/(engine|player)\./u.exec(id)?.[1];
            if (snd) return snd === 'engine' ? 'pack-sound-tone' : 'pack-sound-howler';
            const own = /\/src\/tool\/packs\/(faces|sound|notes|themes|extras)\//u.exec(id)?.[1];
            if (own) return `pack-${own}`;
            const lib = PACK_LIBS.find(([re]) => re.test(id));
            if (lib) return `pack-${lib[1]}`;
            // The boot path's shared modules are named first, so the lazy chunk never pulls them in.
            if (
              /\/packages\/core\/src\/(?!license|capability)|\/packages\/wake\/src\/|\/src\/tool\/(?:main|format|i18n|store|params|ctx|ui\/(?:view|toast))\.ts/u.test(
                id,
              )
            )
              return 'tool-boot';
            if (
              /\/src\/tool\/(?:ui\/(?:actions|dialog|more-css|view-more|banners|toast-view|why|receipt|settings|rating|lang-suggest)|stats\/\w+|shortcuts|msg|theme|end|signal|pwa|extras|fullscreen|accent|sponsor|embed\/kiosk|pip)\./u.test(
                id,
              )
            )
              return 'tool-ui';
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@awaketab/wake/video': fileURLToPath(new URL('../../packages/wake/src/video.ts', import.meta.url)),
        '@awaketab/wake': fileURLToPath(new URL('../../packages/wake/src/index.ts', import.meta.url)),
        '@awaketab/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
    },
  },
});
