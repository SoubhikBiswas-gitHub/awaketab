import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/web/scripts/**/*.test.ts'],
    environment: 'node',
  },
});
