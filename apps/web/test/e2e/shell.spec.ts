import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

const SURFACES = ['/', '/for/cooking', '/about', '/pro', '/pro/activate', '/es/'] as const;

async function axe(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const summary = results.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
  expect(summary).toEqual([]);
}

const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el
      ? `${el.tagName.toLowerCase()}${el.getAttribute('hreflang') ? `[${el.getAttribute('hreflang') ?? ''}]` : ''}#${el.id}`
      : '';
  });

async function openLang(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(150);
  await page.locator('#at-lang-btn').click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installFakeWakeLock(page);
});

test.describe('header and footer on every surface', () => {
  for (const path of SURFACES) {
    test(`${path}: one header (60 / 68 px), menus from 1160 (Menu on the tool), one footer in the fixed order`, async ({
      page,
    }) => {
      const tool = path === '/' || path === '/es/';
      await page.setViewportSize({ width: 390, height: 800 });
      await page.goto(path);
      const header = page.locator('header.at-site-header');
      const nav = header.locator('nav.at-nav');
      const menu = header.locator('button.at-hm-open');
      await expect(header).toHaveCount(1);
      expect((await header.boundingBox())?.height).toBe(60);
      await expect(nav).toBeHidden();
      await expect(menu).toBeVisible();
      await expect(header.locator('a.at-logo')).toHaveAttribute('aria-label', /AwakeTab/u);

      await page.setViewportSize({ width: 820, height: 800 });
      expect((await header.boundingBox())?.height).toBe(68);
      await expect(nav).toBeHidden();
      await expect(menu).toBeVisible();

      await page.setViewportSize({ width: 1280, height: 800 });
      if (tool) {
        await expect(nav).toHaveCount(0);
        await expect(menu).toBeVisible();
      } else {
        await expect(nav).toBeVisible();
        await expect(nav.locator('button.at-hm-trigger')).toHaveCount(3);
        await expect(nav.locator('button.at-hm-trigger').first()).toBeVisible();
        await expect(nav.locator('a.at-hm-hub').first()).toBeHidden();
        await expect(menu).toBeHidden();
      }
      // Header gutter = page gutter (80 at desktop): the logo starts 80 px in.
      expect(Math.round((await header.locator('a.at-logo').boundingBox())?.x ?? 0)).toBe(80);

      const footer = page.locator('footer.at-site-footer');
      await expect(footer).toHaveCount(1);
      const hrefs = await footer.locator('nav a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
      expect(hrefs).toEqual(['/privacy', '/terms', '/changelog', '/about', 'https://buymeacoffee.com/awaketab']);
      await expect(footer.locator('#at-lang-btn')).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('the current section is marked in the nav (ink 600 + lamp dot, aria-current)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/for/cooking');
    const current = page.locator('header nav.at-nav button[aria-current="true"]');
    await expect(current).toHaveAttribute('popovertarget', 'at-hm-for');
    await expect(page.locator('#at-hm-for a[aria-current="page"]')).toHaveAttribute('href', '/for/cooking');
    await page.goto('/guides');
    await expect(current).toHaveAttribute('popovertarget', 'at-hm-res');
    await page.goto('/pro/activate');
    await expect(page.locator('header nav.at-nav a:visible[aria-current="page"]')).toHaveAttribute('href', '/pro');
    await page.goto('/about');
    await expect(page.locator('header nav.at-nav [aria-current]')).toHaveCount(0);
  });

  test('header menus open from their buttons, close on Esc, and never stop a running session', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/about');
    await page.locator('header button[popovertarget="at-hm-for"]').click();
    const panel = page.locator('#at-hm-for');
    await expect(panel).toBeVisible();
    await expect(panel.locator('a[href="/for/cooking"]')).toBeVisible();
    await expect(panel.locator('a[href="/30m"]')).toBeVisible();
    await expect(panel.locator('a[href="/for"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await page.locator('header button[popovertarget="at-hm-on"]').click();
    await expect(page.locator('#at-hm-on a[href="/on/iphone-safari"]')).toBeVisible();
    await page.mouse.click(8, 400);
    await expect(page.locator('#at-hm-on')).toBeHidden();

    // Phones: one Menu button opens a bottom sheet with the same groups.
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('header button.at-hm-open').click();
    const sheet = page.locator('#at-hm-menu');
    await expect(sheet).toBeVisible();
    // It rises into place; once settled its bottom edge is the viewport's.
    await expect
      .poll(async () => {
        const box = await sheet.boundingBox();
        return Math.round((box?.y ?? 0) + (box?.height ?? 0));
      })
      .toBe(800);
    await expect(sheet.locator('a[href="/on/android-chrome"]')).toBeVisible();
    await sheet.locator('button[popovertargetaction="hide"]').click();
    await expect(sheet).toBeHidden();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
    await page.locator('#awaketab-tool header button.at-hm-open').click();
    await expect(page.locator('#at-hm-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#at-hm-menu')).toBeHidden();
    await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  });

  test('tool header: Stats from 600, Settings always, Menu always; the compact theme button below 768 px', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'layout check, engine-independent');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?autostart=0');
    const header = page.locator('#awaketab-tool header.at-site-header');
    await expect(header.locator('[data-open-stats]')).toBeVisible();
    await expect(header.locator('[data-open-settings]')).toBeVisible();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(header.locator('[data-open-stats]')).toBeHidden();
    // Phones reach Stats, Share and Shortcuts from the Settings footer (canvas ToolSettings; decision D-R27).
    await header.locator('[data-open-settings]').click();
    const sheet = page.locator('dialog[data-dialog="settings"]');
    await expect(sheet.locator('[data-open-stats]')).toBeVisible();
    await expect(sheet.locator('[data-open-share]')).toBeVisible();
    await expect(sheet.locator('[data-open-shortcuts]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(header.locator('button.at-hm-open')).toBeVisible();
    await page.setViewportSize({ width: 820, height: 800 });
    await expect(header.getByRole('radiogroup')).toBeVisible();
    await expect(header.locator('[data-theme-cycle]')).toBeHidden();
    await page.setViewportSize({ width: 320, height: 568 });
    await expect(header.getByRole('radiogroup')).toBeHidden();
    // Below 360 px the logo keeps its ring and bead and drops the word, so the Menu fits.
    await expect(header.locator('.at-logo-word')).toBeHidden();
    await expect(header.locator('button.at-hm-open')).toBeVisible();
    const cycle = header.locator('[data-theme-cycle]');
    await expect(cycle).toBeVisible();
    await expect(cycle).toHaveAccessibleName('Theme: Auto, follows your system. Change theme');
    await cycle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(cycle).toHaveAccessibleName('Theme: Light. Change theme');
  });
});

test.describe('theme switch', () => {
  test('Light · Dark · Auto persist, apply at once, slide the indicator and survive a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/about');
    const html = page.locator('html');
    const bar = page.getByRole('radiogroup', { name: 'Theme' });
    await expect(bar.getByRole('radio', { name: 'Auto, follows your system' })).toBeChecked();
    await expect(html).toHaveAttribute('data-theme-pref', 'auto');

    await page.locator('.at-theme-item[data-v="dark"]').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(html).toHaveAttribute('data-theme-pref', 'dark');
    expect(
      await page.evaluate(
        () => (JSON.parse(localStorage.getItem('at.v1.settings') ?? '{}') as { theme?: string }).theme,
      ),
    ).toBe('dark');
    // The indicator sits under item 2 (one item width to the right), driven by CSS alone.
    await expect
      .poll(() =>
        page
          .locator('.at-theme .at-seg-ind')
          .evaluate((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41)),
      )
      .toBe(44);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(bar.getByRole('radio', { name: 'Dark' })).toBeChecked();
    // No slide on load: the position is right from the first frame (data-theme-pref is set before first paint).
    expect(await page.locator('.at-theme .at-seg-ind').evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(
      await page
        .locator('.at-theme .at-seg-ind')
        .evaluate((el) => Math.round(new DOMMatrix(getComputedStyle(el).transform).m41)),
    ).toBe(44);

    // Auto follows the system live (DESIGN.md §9).
    await page.locator('.at-theme-item[data-v="auto"]').click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('keyboard: one Tab stop, arrows move and select (native radios), focus is visible', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit arrow keys on radios follow the macOS setting; covered in Chromium and Firefox',
    );
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/about');
    await page.getByRole('radio', { name: 'Auto, follows your system' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeFocused();
    await expect(page.locator('.at-theme-item[data-v="dark"]')).toHaveCSS('outline-style', 'solid');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('tool: the header switch keeps the island in step (D continues from the picked theme)', async ({ page }) => {
    await page.goto('/?autostart=0');
    await page.locator('#awaketab-tool[data-booted]').waitFor();
    await page.locator('.at-theme-item[data-v="dark"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('h1').click();
    await page.keyboard.press('d');
    // auto → light → dark → oled: D after Dark is OLED; the switch shows OLED as Dark.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');
    await expect(page.locator('html')).toHaveAttribute('data-theme-pref', 'oled');
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect
      .poll(() =>
        page.evaluate(() => (JSON.parse(localStorage.getItem('at.v1.settings') ?? '{}') as { theme?: string }).theme),
      )
      .toBe('oled');
  });
});

test.describe('language switcher (P-LANG)', () => {
  test('desktop panel: non-modal group, focus on the current row, arrows wrap, Home/End, Esc returns focus', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/for/cooking');
    const btn = page.locator('#at-lang-btn');
    await expect(btn).toHaveAccessibleName('Language: English');
    const panel = page.locator('#at-lang-list');
    await expect(panel).toBeHidden();
    await openLang(page);
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('role', 'group');
    await expect(panel).not.toHaveAttribute('aria-modal', /.*/u);
    await expect(page.locator('.at-lang-scrim')).toBeHidden();
    // Rows are real links in their own language, with this page's translations.
    const rows = panel.locator('a[hreflang]');
    await expect(rows).toHaveCount(8);
    expect(await rows.evaluateAll((els) => els.map((a) => a.textContent?.replace(/\s+/gu, ' ').trim()))).toEqual([
      'English Current',
      'Español Translation in review',
      'Português (Brasil) Translation in review',
      'Deutsch Translation in review',
      'Français Translation in review',
      '日本語 Translation in review',
      '简体中文 Translation in review',
      'हिन्दी Translation in review',
    ]);
    await expect(panel.locator('a[hreflang="es"]')).toHaveAttribute('href', '/es/for/cocinar');
    await expect(panel.locator('a[hreflang="es"]')).toHaveAttribute('lang', 'es');
    await expect(panel.locator('a[aria-current="true"]')).toHaveAttribute('hreflang', 'en');

    expect(await focused(page)).toBe('a[en]#');
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toBe('a[es]#');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toBe('a[hi]#');
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toBe('a[en]#');
    await page.keyboard.press('End');
    expect(await focused(page)).toBe('a[hi]#');
    await page.keyboard.press('Home');
    expect(await focused(page)).toBe('a[en]#');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(await focused(page)).toBe('button#at-lang-btn');

    // An outside click closes it; so does focus leaving it.
    await btn.click();
    await expect(panel).toBeVisible();
    await page.locator('h1').click();
    await expect(panel).toBeHidden();
    await btn.click();
    await page.locator('footer nav a').first().focus();
    await expect(panel).toBeHidden();
  });

  test('phone sheet: modal dialog with a scrim, Tab stays inside, Close and Esc return focus', async ({
    page,
    browserName,
  }) => {
    // WebKit follows Safari: plain Tab skips links; Option+Tab reaches every control (keyboard.spec.ts).
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/about');
    const btn = page.locator('#at-lang-btn');
    await openLang(page);
    const sheet = page.getByRole('dialog', { name: 'Language' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('.at-lang-scrim')).toBeVisible();
    await sheet.evaluate((el) => el.getAnimations().forEach((a) => a.finish()));
    // Bottom sheet: flush with the viewport's bottom edge, full width.
    const box = await sheet.boundingBox();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(844);
    expect(Math.round(box?.width ?? 0)).toBe(390);
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press(i % 3 === 2 ? `Shift+${tab}` : tab);
      expect(await page.evaluate(() => document.activeElement?.closest('#at-lang-list') !== null)).toBe(true);
    }
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toBeHidden();
    expect(await focused(page)).toBe('button#at-lang-btn');
    await btn.click();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await btn.click();
    await page.locator('.at-lang-scrim').click({ position: { x: 20, y: 20 } });
    await expect(sheet).toBeHidden();
  });

  test('Esc closes only the panel on the tool page, never the session', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake', { timeout: 4000 });
    await openLang(page);
    await expect(page.locator('#at-lang-list')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#at-lang-list')).toBeHidden();
    await expect(page.locator('[data-pill-text]')).toHaveText('Screen awake');
  });

  test('a localized page names its language natively and links the English original', async ({ page }) => {
    await page.goto('/es/');
    await expect(page.locator('#at-lang-btn')).toHaveAccessibleName('Idioma: Español');
    await expect(page.locator('footer .at-footer-line')).toHaveText(
      'Sin anuncios en la pantalla activa, ni ahora ni después.',
    );
    await expect(page.locator('footer a[hreflang="en"]')).toHaveAttribute('href', '/');
    await expect(page.locator('footer a[aria-current="true"]')).toHaveAttribute('hreflang', 'es');
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe: panel and sheet open, ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/about');
      await openLang(page);
      await expect(page.locator('#at-lang-list')).toBeVisible();
      await page.locator('#at-lang-list').evaluate((el) => el.getAnimations().forEach((a) => a.finish()));
      await axe(page);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      await openLang(page);
      await expect(page.getByRole('dialog', { name: 'Language' })).toBeVisible();
      await page.locator('#at-lang-list').evaluate((el) => el.getAnimations().forEach((a) => a.finish()));
      await axe(page);
    });
  }
});

test.describe('status pill and logo bead', () => {
  test('the tool pill carries tone and glyph per state; the header bead takes the same tone', async ({ page }) => {
    await page.goto('/?autostart=0');
    await page.locator('#awaketab-tool[data-booted]').waitFor();
    const pill = page.locator('#awaketab-tool [data-pill]');
    await expect(pill).toHaveAttribute('data-lock', 'idle');
    await expect(pill.locator('[data-pill-text]')).toHaveText('Ready');
    const glyph = () =>
      pill
        .locator('.at-pill-glyph path')
        .evaluateAll((els) =>
          els.filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.getAttribute('class')),
        );
    expect(await glyph()).toEqual(['at-g-dot']);
    // M pill: 38 px drawn (O-62 allows a second line in long locales).
    expect((await pill.boundingBox())?.height).toBe(38);
    const bead = () => page.locator('.at-logo-bead').evaluate((el) => getComputedStyle(el).fill);
    const muted = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--at-muted').trim(),
    );
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--at-accent').trim(),
    );
    const rgb = (hex: string) => {
      const n = Number.parseInt(hex.replace('#', ''), 16);
      return `rgb(${String((n >> 16) & 255)}, ${String((n >> 8) & 255)}, ${String(n & 255)})`;
    };
    expect(await bead()).toBe(rgb(muted));
    await page.getByRole('button', { name: '15 minutes', exact: true }).click();
    await page.locator('#awaketab-tool .at-cta').click();
    await expect(pill).toHaveAttribute('data-lock', 'held');
    await expect(pill.locator('[data-pill-text]')).toHaveText('Screen awake');
    expect(await glyph()).toEqual(['at-g-dot']);
    await expect.poll(bead).toBe(rgb(accent));
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`Stop is the raised neutral (D-R20): raised fill, line-strong border, ink text, 60 px, ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      const stop = page.locator('#awaketab-tool [data-stop]');
      await expect(stop).toBeVisible({ timeout: 4000 });
      // The actions rise in (DESIGN.md §8); measure the resting button, not a frame of its 0.985 → 1 scale.
      await page.evaluate(() => {
        for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      });
      const css = await stop.evaluate((el) => {
        const cs = getComputedStyle(el);
        const root = getComputedStyle(document.documentElement);
        const probe = (v: string) => {
          const d = document.createElement('i');
          d.style.color = root.getPropertyValue(v);
          document.body.append(d);
          const c = getComputedStyle(d).color;
          d.remove();
          return c;
        };
        return {
          bg: cs.backgroundColor === probe('--at-raised'),
          border: cs.borderTopColor === probe('--at-line-strong'),
          ink: cs.color === probe('--at-ink'),
          h: el.getBoundingClientRect().height,
        };
      });
      expect(css).toEqual({ bg: true, border: true, ink: true, h: 60 });
    });
  }
});
