import { defineConfig, type Options } from 'tsup';

// Adapters import the core through `../index.js` in source (so they typecheck without a build). In the
// published build that import must stay external — otherwise every adapter would bundle its own copy of the
// state machine (≈ 3 KB each instead of < 400 B, docs/12 §2.2) and hold a second, unrelated lock instance.
const externalCore: NonNullable<Options['esbuildPlugins']>[number] = {
  name: 'external-core',
  setup(build) {
    build.onResolve({ filter: /^\.\.\/index\.js$/ }, () => ({ path: '@awaketab/wake', external: true }));
  },
};

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    clean: true,
    splitting: false,
    target: 'es2020',
  },
  {
    entry: {
      'adapters/react': 'src/adapters/react.ts',
      'adapters/preact': 'src/adapters/preact.ts',
      'adapters/vue': 'src/adapters/vue.ts',
    },
    format: ['esm', 'cjs'],
    // package.json "exports" points each adapter's `types` at dist/adapters/*.d.ts (docs/12 §3).
    dts: true,
    minify: true,
    clean: false,
    splitting: false,
    target: 'es2020',
    external: ['react', 'preact', 'preact/hooks', 'vue', '@awaketab/wake'],
    esbuildPlugins: [externalCore],
  },
  {
    // `dist/awaketab-wake.iife.js`, global `AwakeTabWake` (docs/12 §1). tsup's default IIFE extension is
    // `.global.js`; the published name is part of the CDN contract (README, /library), so it is fixed here.
    entry: { 'awaketab-wake.iife': 'src/index.ts' },
    format: ['iife'],
    globalName: 'AwakeTabWake',
    minify: true,
    clean: false,
    target: 'es2020',
    outExtension: () => ({ js: '.js' }),
  },
]);
