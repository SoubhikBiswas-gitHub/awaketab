import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Tests sign tokens with the dev pair (apps/web/.dev.vars.example), so they build like a sandbox bundle.
  define: { __AT_POLAR_SERVER__: JSON.stringify('sandbox'), __AT_LICENSE_DEV_KEY__: 'true' },
  resolve: {
    alias: {
      '@awaketab/wake': fileURLToPath(new URL('./packages/wake/src/index.ts', import.meta.url)),
      '@awaketab/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: [
      'apps/web/scripts/**/*.test.ts',
      'apps/web/test/tool/**/*.test.ts',
      'apps/web/test/ui/**/*.test.ts',
      'apps/web/test/lib/**/*.test.ts',
      'apps/web/test/i18n/**/*.test.ts',
      'packages/*/test/**/*.test.ts',
      'apps/extension/test/**/*.test.ts',
    ],
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    environmentMatchGlobs: [['packages/wake/test/ssr.test.ts', 'node']],
  },
});
