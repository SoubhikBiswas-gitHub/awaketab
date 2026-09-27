import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

type TTheme = 'light' | 'dark' | 'oled';

async function useTheme(page: Page, theme: TTheme, extra: Record<string, unknown> = {}): Promise<void> {
  await page.emulateMedia({ colorScheme: theme === 'light' ? 'light' : 'dark' });
  await page.addInitScript(
    ([t, more]) => {
      localStorage.setItem('at.v1.settings', JSON.stringify({ v: 1, theme: t, ...more }));
    },
    [theme, extra] as const,
  );
}

async function expectNoViolations(page: Page, theme: TTheme): Promise<void> {
  // theme-boot.js ran and applied the stored theme (night mode forces oled on purpose).
  await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark|oled)$/u);
  const html = page.locator('html');
  if ((await html.getAttribute('data-theme')) !== 'oled' || theme === 'oled') {
    await expect(html).toHaveAttribute('data-theme', theme);
  }
  // Wait for entrance rises; endless loops and scroll-driven rises are skipped.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          !(a instanceof CSSAnimation) ||
          !(a.timeline instanceof DocumentTimeline) ||
          a.effect?.getTiming().iterations === Infinity ||
          a.playState === 'finished',
      ),
  );
  const results = await new AxeBuilder({ page }).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.slice(0, 5).map((n) => `${n.target.join(' ')} — ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`),
  }));
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installFakeWakeLock(page);
});

// Every template that ships (docs/00 §7). /embed, /extension, /kiosk and /library land in M8.
const PAGES: Array<[string, string]> = [
  ['home', '/'],
  ['preset route', '/30m'],
  ['until route', '/until/17-30'],
  ['pip', '/pip'],
  ['for hub', '/for'],
  ['for article', '/for/cooking'],
  ['on hub', '/on'],
  ['on article', '/on/iphone-safari'],
  ['vs hub', '/vs'],
  ['vs article', '/vs/nosleep-page'],
  ['guides hub', '/guides'],
  ['guides article', '/guides/lock-screen-vs-sleep'],
  ['learn hub', '/learn'],
  ['learn article', '/learn/screen-wake-lock-api-guide'],
  ['pro', '/pro'],
  ['pro activate', '/pro/activate'],
  ['pro manage', '/pro/manage'],
  ['about', '/about'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
  ['changelog', '/changelog'],
  ['404', '/this-page-does-not-exist'],
  ['locale home', '/es/'],
  ['translated article', '/es/for/cocinar'],
];

test.describe('page templates', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const [name, path] of PAGES) {
      test(`${name} (${path}), ${theme}`, async ({ page }) => {
        await useTheme(page, theme);
        const res = await page.goto(path);
        expect(res?.status()).toBe(name === '404' ? 404 : 200);
        await expect(page.locator('h1').first()).toBeVisible();
        await expectNoViolations(page, theme);
      });
    }
  }
});

// Open-state surfaces of the tool. Each opener leaves the surface visible.
const pill = (page: Page) => page.locator('#awaketab-tool [data-pill-text]').first();

// Click only after the island has bound its handlers (it starts after first paint), as tool.spec.ts does;
// a click before that is a race, not an accessibility result.
async function openTool(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator('#awaketab-tool[data-booted]').waitFor();
}

// The stored last custom length is one minute (useTheme below), so Custom + the lamp button runs a 1-minute session.
async function customMinute(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Custom length' }).click();
  await page.locator('#awaketab-tool .at-cta').click();
  await expect(pill(page)).toHaveText('Screen awake');
}

const SURFACES: Array<{ name: string; open: (page: Page, theme: TTheme) => Promise<void> }> = [
  {
    name: 'settings dialog',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.locator('#awaketab-tool header [data-open-settings]').click();
      await expect(page.locator('dialog[data-dialog="settings"]')).toBeVisible();
    },
  },
  {
    name: 'Pro sheet',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.locator('#awaketab-tool header [data-open-settings]').click();
      await page.locator('dialog[data-dialog="settings"] [data-open-pro]').click();
      await expect(page.locator('dialog[data-dialog="pro"]')).toBeVisible();
    },
  },
  {
    name: 'stats dialog',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.locator('#awaketab-tool header [data-open-stats]').click();
      await expect(page.locator('dialog[data-dialog="stats"] .at-heat-cell')).toHaveCount(84);
    },
  },
  {
    name: 'shortcuts overlay',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.locator('#awaketab-tool header [data-open-shortcuts]').click();
      await expect(page.locator('dialog[data-dialog="shortcuts"]')).toBeVisible();
    },
  },
  {
    name: 'custom panel',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.getByRole('button', { name: 'Custom length' }).click();
      await expect(page.locator('.at-lp-custom')).toBeVisible();
    },
  },
  {
    name: 'until panel',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.getByRole('button', { name: 'Until a time' }).click();
      await expect(page.locator('.at-lp-until [data-slot="0"]')).toContainText(/\d/u);
    },
  },
  {
    name: 'share dialog',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.locator('#awaketab-tool header [data-open-share]').click();
      await expect(page.locator('dialog[data-dialog="share"] [data-share-url]')).toHaveValue(/^http/u);
    },
  },
  {
    name: "time's-up card",
    open: async (page) => {
      await page.clock.install();
      await openTool(page, '/?autostart=0');
      await customMinute(page);
      await page.clock.fastForward(61_000);
      await expect(page.locator('#awaketab-tool .at-ask')).toBeVisible({ timeout: 4000 });
    },
  },
  {
    name: 'rating prompt',
    open: async (page) => {
      await page.clock.install();
      await openTool(page, '/?autostart=0');
      await page.evaluate(() => {
        localStorage.setItem(
          'at.v1.meta',
          JSON.stringify({
            v: 1,
            installedAt: Date.now() - 86_400_000,
            sessionCount: 5,
            ratingPrompt: { shownAt: null, action: null },
            lastSeenVersion: '',
            pwa: { installed: false, promptShownAt: null },
            secondTabWarnedAt: null,
          }),
        );
      });
      await openTool(page, '/?autostart=0');
      await customMinute(page);
      await page.clock.runFor(61_000 + 3000);
      await expect(page.locator('dialog[data-dialog="rating"]')).toBeVisible({ timeout: 4000 });
    },
  },
  {
    name: 'blocked card',
    open: async (page) => {
      await openTool(page, '/?autostart=0');
      await page.evaluate(() => {
        (window as Window & { __at: { rejectNext: string | null } }).__at.rejectNext = 'NotAllowedError';
      });
      await page.locator('#awaketab-tool .at-cta').click();
      await expect(page.locator('#awaketab-tool .at-blocked')).toBeVisible({ timeout: 4000 });
    },
  },
  {
    name: 'resume banner',
    open: async (page) => {
      await page.goto('/');
      await expect(pill(page)).toHaveText('Screen awake', { timeout: 4000 });
      await page.reload();
      await expect(page.locator('[data-resume]')).toBeVisible();
    },
  },
  ...(['clock', 'focus', 'cook', 'message', 'night'] as const).map((mode) => ({
    name: `ambient ${mode}`,
    open: async (page: Page) => {
      await page.goto(`/?mode=${mode}${mode === 'cook' ? '&autostart=0' : ''}`);
      const layer = page.locator('dialog[data-ambient]');
      await expect(layer).toHaveAttribute('data-mode', mode);
      // Wait for the lazily loaded mode module to render its content (idle-only parts start hidden).
      await expect(layer.locator('[data-ambient-content] > :not([hidden])').first()).toBeVisible();
      // …and for its entrance (a 0.7 s rise from opacity 0, DESIGN.md §8): mid-fade colours are not the
      // resting colours axe must judge. Infinite loops (aura, halo) and the per-second transitions never end.
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) =>
              !(a instanceof CSSAnimation) ||
              !(a.timeline instanceof DocumentTimeline) ||
              a.effect?.getTiming().iterations === Infinity ||
              a.playState === 'finished',
          ),
      );
    },
  })),
];

test.describe('tool surfaces', () => {
  for (const theme of ['light', 'dark', 'oled'] as const) {
    for (const surface of SURFACES) {
      test(`${surface.name}, ${theme}`, async ({ page }) => {
        await useTheme(page, theme, {
          lastCustomMs: 60_000,
          ...(surface.name === 'rating prompt' ? { endBehaviour: 'stop' } : {}),
        });
        await surface.open(page, theme);
        await expectNoViolations(page, theme);
      });
    }
  }
});
