import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/web/test/seo/**/*.test.ts'],
    environment: 'node',
  },
});
