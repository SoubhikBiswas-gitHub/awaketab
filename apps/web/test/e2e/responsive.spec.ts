import { expect, test, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

/*
 * Responsive sweep (DESIGN.md §5 "Gate", §12.8): every route at every 40 px step from 320 to 2560 wide must
 * not scroll horizontally, and the shared header and footer keep 44 px targets 16 px clear of the edges. One page load per route, resized through the sweep; Chromium only
 * (layout is engine-independent enough here, and 57 widths × 8 routes × 3 engines would not pay for itself).
 */

const ROUTES = ['/', '/30m', '/until/07-30', '/for/cooking', '/pro', '/embed', '/extension', '/about'] as const;
const WIDTHS = Array.from({ length: (2560 - 320) / 40 + 1 }, (_, i) => 320 + i * 40);

// Known overflow on the current (pre-redesign) pages, listed in docs/redesign/B1-token-debt.md. These widths
// run as test.fixme below so the debt stays visible; the milestone that rebuilds the page removes the entry.
const DEBT: Partial<Record<(typeof ROUTES)[number], number[]>> = {
  '/embed': [320], // B8: "Already bought? Activate your domain" is whitespace-nowrap in a 283 px card
};

async function overflowingWidths(page: Page, widths: readonly number[]): Promise<string[]> {
  const bad: string[] = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const m = await page.evaluate(
      () =>
        new Promise<{ scroll: number; inner: number; shell: string[] }>((resolve) => {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              // The shared shell (B2) also meets the rest of the §5 gate: every header and footer control is a
              // 44 × 44 target and sits at least 16 px from the viewport's side edges.
              const shell: string[] = [];
              const controls = document.querySelectorAll(
                'header.at-site-header :is(a, button, .at-theme-item), footer.at-site-footer :is(a, button)',
              );
              for (const el of controls) {
                const r = el.getBoundingClientRect();
                if (r.width <= 1 || r.height <= 1) continue; // hidden (the closed language panel, band-only buttons)
                const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 24);
                if (r.width < 44 || r.height < 44) shell.push(`${name} ${String(Math.round(r.width))}×${String(Math.round(r.height))}`);
                if (r.left < 16 || window.innerWidth - r.right < 16) shell.push(`${name} at ${String(Math.round(r.left))}–${String(Math.round(r.right))}`);
              }
              resolve({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth, shell });
            }),
          );
        }),
    );
    if (m.scroll > m.inner) bad.push(`${String(width)}px: scrollWidth ${String(m.scroll)}`);
    for (const issue of m.shell) bad.push(`${String(width)}px: shell control ${issue}`);
  }
  return bad;
}

test.beforeEach(async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'responsive sweep runs on Chromium only');
  await installFakeWakeLock(page);
});

async function sweep(page: Page, route: string, widths: readonly number[]): Promise<void> {
  await page.setViewportSize({ width: widths[0] ?? 320, height: 900 });
  const res = await page.goto(route);
  expect(res?.status()).toBe(200);
  expect(await overflowingWidths(page, widths)).toEqual([]);
}

for (const route of ROUTES) {
  const debt = DEBT[route] ?? [];
  test(`no horizontal scroll 320–2560: ${route}`, async ({ page }) => {
    await sweep(page, route, WIDTHS.filter((w) => !debt.includes(w)));
  });
  if (debt.length > 0) {
    test.fixme(`no horizontal scroll (known debt, B1-token-debt.md): ${route} at ${debt.join(', ')} px`, async ({ page }) => {
      await sweep(page, route, debt);
    });
  }
}
