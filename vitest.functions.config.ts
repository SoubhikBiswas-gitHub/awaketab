import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/web/functions/**/*.test.ts'],
    environment: 'node',
  },
});
