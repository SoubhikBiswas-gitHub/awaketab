import { defineConfig } from 'tsup';

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
    dts: false,
    minify: true,
    clean: false,
    splitting: false,
    target: 'es2020',
    external: ['react', 'preact', 'preact/hooks', 'vue', '@awaketab/wake'],
  },
  {
    entry: { 'awaketab-wake.iife': 'src/index.ts' },
    format: ['iife'],
    globalName: 'AwakeTabWake',
    minify: true,
    target: 'es2020',
  },
]);
