import { defineConfig } from '@playwright/test';

/**
 * Extension journeys (docs/13 §10): the unpacked test build (`AT_EXT_TEST=1` — chrome.power replaced by a
 * recorder) loaded into Chromium with a persistent profile per test. Run with `pnpm test:e2e:ext`.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 30_000,
  use: { trace: 'on-first-retry' },
  projects: [{ name: 'chromium-extension' }],
});
