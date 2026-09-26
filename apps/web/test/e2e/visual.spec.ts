import { expect, test } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

// Nightly visual regression of the awake screen: every ambient mode × theme at phone and desktop widths.
// Runs only with VISUAL=1 (nightly.yml); PR runs skip the whole file. Baselines are not committed yet:
// nightly passes --update-snapshots=missing so the first run records them.
test.skip(process.env.VISUAL !== '1', 'visual snapshots run nightly only (VISUAL=1)');

const MODES = ['clock', 'focus', 'minimal', 'night', 'message', 'cook'] as const;
const THEMES = ['light', 'dark', 'oled'] as const;
const WIDTHS = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
] as const;
// A fixed wall clock so the clock digits, the date line and the session timer never change between runs.
const FROZEN = new Date('2026-03-10T09:41:00');

test.beforeEach(async ({ page }) => {
  await installFakeWakeLock(page);
});

for (const mode of MODES) {
  for (const theme of THEMES) {
    for (const size of WIDTHS) {
      test(`${mode} · ${theme} · ${String(size.width)}px`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.clock.setFixedTime(FROZEN);
        await page.goto(`/?mode=${mode}&theme=${theme}`);
        const layer = page.locator('dialog[data-ambient]');
        await expect(layer).toHaveAttribute('data-mode', mode);
        await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
        // The awake screen at rest: controls auto-hide after 3 s without input.
        await expect(layer).toHaveAttribute('data-controls', 'hidden', { timeout: 6000 });
        await expect(page).toHaveScreenshot(`${mode}-${theme}-${String(size.width)}.png`, {
          maxDiffPixelRatio: 0.002,
          animations: 'disabled',
          caret: 'hide',
        });
      });
    }
  }
}
