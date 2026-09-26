import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/test/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    // page.route() cannot see requests a service worker makes, so an active SW would silently bypass every
    // API mock. The offline journey opts back in with test.use({ serviceWorkers: 'allow' }).
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm --filter web preview',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: false,
      },
});
