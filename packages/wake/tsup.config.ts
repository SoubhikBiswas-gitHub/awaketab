import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/adapters/react.ts',
      'src/adapters/preact.ts',
      'src/adapters/vue.ts',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    minify: true,
    clean: true,
    target: 'es2020',
  },
  {
    entry: { 'awaketab-wake.iife': 'src/index.ts' },
    format: ['iife'],
    globalName: 'AwakeTabWake',
    minify: true,
    target: 'es2020',
  },
]);
