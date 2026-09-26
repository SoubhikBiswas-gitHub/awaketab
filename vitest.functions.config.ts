import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Pages Functions run against in-memory KV / Analytics Engine / Polar fakes in Node
// (apps/web/test/functions/harness.ts): @cloudflare/vitest-pool-workers 0.22.0 peers vitest ^4.1
// and this repo pins vitest 5.0.0. See docs/13-testing-strategy.md §9.
export default defineConfig({
  resolve: {
    alias: {
      '@awaketab/wake': fileURLToPath(new URL('./packages/wake/src/index.ts', import.meta.url)),
      '@awaketab/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['apps/web/functions/**/*.test.ts'],
    environment: 'node',
  },
});
