import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

// E6-T07 — i18n QA: per-locale smoke, pseudo-locale overflow at 320 px, RTL readiness (docs/07 §6, §8).
const I18N = path.resolve('apps/web/src/i18n');
const catalog = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(path.join(I18N, `${locale}.json`), 'utf8')) as Record<string, string>;
const slugs = JSON.parse(readFileSync(path.join(I18N, 'slugs.json'), 'utf8')) as Record<
  string,
  Record<string, Record<string, string>>
>;

const LOCALES = [
  { code: 'es', lang: 'es' },
  { code: 'pt-br', lang: 'pt-BR' },
  { code: 'de', lang: 'de' },
  { code: 'fr', lang: 'fr' },
  { code: 'ja', lang: 'ja' },
  { code: 'zh', lang: 'zh-Hans' },
  { code: 'hi', lang: 'hi' },
] as const;

const cookingPath = (code: string): string => `/${code}/for/${slugs.for?.cooking?.[code] ?? 'cooking'}`;
// Standard-mode page for the pill smoke (the cooking page opens the full-screen cook layer on start).
const safariPath = (code: string): string => `/${code}/on/${slugs.on?.['iphone-safari']?.[code] ?? 'iphone-safari'}`;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    // Harness artifact, not a product error: playwright.config.ts sets `serviceWorkers: 'block'`, under which
    // `navigator.serviceWorker.register()` resolves without a usable registration and src/tool/pwa.ts's
    // watchUpdates() then reads `.addEventListener` of undefined. Real browsers reject register() instead.
    if (/addEventListener/u.test(error.message) && /\/_astro\/pwa\.[\w-]+\.js/u.test(error.stack ?? '')) return;
    errors.push(`${error.message} @ ${error.stack ?? ''}`);
  });
  return errors;
}

test.beforeEach(async ({ page }) => {
  await installFakeWakeLock(page);
  // `astro preview` serves no Pages Functions: answer the first-party beacon like /api/e does (204), or
  // WebKit logs the pagehide sendBeacon's 404 as a console error and the zero-errors check fails there.
  await page.route('**/api/e', (route) => route.fulfill({ status: 204, body: '' }));
});

test.describe('per-locale smoke', () => {
  for (const { code, lang } of LOCALES) {
    test(`${code}: home and a translated page render with the right lang/dir and a working pill`, async ({ page }) => {
      const strings = catalog(code);
      const errors = collectErrors(page);
      // The static preview has no Pages Functions; WebKit logs the analytics beacon's 404 to the console.
      await page.route('**/api/e', (route) => route.fulfill({ status: 204, body: '' }));

      await page.goto(`/${code}/?ref=e2e`);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['page.home.h1'] ?? '');
      await expect(page.locator('[data-pill-text]')).toHaveText(strings['tool.pill.held'] ?? '', { timeout: 4000 });
      // The island strips the query but keeps the locale home's slash: /es/ is its served, canonical URL
      // (es/index.html; Cloudflare Pages 308s /es → /es/, docs/14 §2.1).
      await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe(`/${code}/`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://awaketab.com/${code}/`);

      // Let the home's lazy chunks settle: WebKit reports a module import aborted by navigation as an error.
      await page.waitForLoadState('networkidle');
      await page.goto(safariPath(code));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u);
      // Unreviewed translation: labelled as such, linked to the English original.
      await expect(page.locator('[data-translation-pending]')).toContainText(
        strings['content.translation.pending'] ?? '',
      );
      // The locale switcher offers this page's English version, not the English home.
      await expect(page.locator('footer a[hreflang="en"]')).toHaveAttribute('href', '/on/iphone-safari');
      const pill = page.locator('[data-pill-text]');
      await expect(pill).toHaveText(strings['tool.pill.idle'] ?? '');
      await page.locator('[data-chips] [data-preset="p15"]').click();
      await expect(pill).toHaveText(strings['tool.pill.held'] ?? '', { timeout: 4000 });

      expect(errors).toEqual([]);
    });
  }

  test('an English top-10 page links its translations in the locale switcher', async ({ page }) => {
    await page.goto('/for/cooking');
    await expect(page.locator('footer a[hreflang="es"]')).toHaveAttribute('href', cookingPath('es'));
    await expect(page.locator('footer a[hreflang="es"]')).toHaveAttribute('href', '/es/for/cocinar');
    // ja, zh and hi keep the English slug (docs/06 §5, LAUNCH-AUDIT D-03).
    await expect(page.locator('footer a[hreflang="ja"]')).toHaveAttribute('href', '/ja/for/cooking');
    await expect(page.locator('footer a[hreflang="zh-Hans"]')).toHaveAttribute('href', '/zh/for/cooking');
    await expect(page.locator('footer a[hreflang="hi"]')).toHaveAttribute('href', '/hi/for/cooking');
    // No reviewed translation yet: the English page lists only itself and x-default.
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(2);
  });
});

// ---------------------------------------------------------------------------------------------------
// Pseudo-locale: every catalog string (and every static text node) expanded by ~40 % with accented
// letters, so layout bugs that German, French or Hindi would hit show up in any build.

async function usePseudoLocale(page: Page): Promise<void> {
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (request.resourceType() !== 'document') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const html = await response.text();
    const expanded = html.replace(
      /(<script type="application\/json" data-i18n-catalog>)([\s\S]*?)(<\/script>)/u,
      (_match, open: string, json: string, close: string) => {
        const strings = JSON.parse(json) as Record<string, string>;
        const pseudo = Object.fromEntries(Object.entries(strings).map(([key, value]) => [key, pseudoString(value)]));
        return `${open}${JSON.stringify(pseudo).replaceAll('<', '\\u003c')}${close}`;
      },
    );
    await route.fulfill({
      response,
      body: expanded,
      headers: { ...response.headers(), 'content-type': 'text/html; charset=utf-8' },
    });
  });
  await page.addInitScript(() => {
    const ACCENT: Record<string, string> = {
      a: 'á',
      e: 'ë',
      i: 'ï',
      o: 'ö',
      u: 'ü',
      c: 'ç',
      n: 'ñ',
      y: 'ÿ',
      A: 'Å',
      E: 'É',
      O: 'Ö',
      U: 'Ü',
    };
    const expand = (text: string): string => {
      if (!/\p{L}/u.test(text)) return text;
      const accented = [...text].map((char) => ACCENT[char] ?? char).join('');
      const extra = Math.ceil(text.trim().length * 0.4);
      return `${accented}${' ẋẋẋẋ'.repeat(Math.max(1, Math.ceil(extra / 5)))}`;
    };
    const walk = (): void => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) =>
          node.parentElement?.closest('script, style, noscript, [data-pseudo]')
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      for (const node of nodes) node.data = expand(node.data);
      document.body.setAttribute('data-pseudo-ready', '1');
    };
    (window as Window & { __pseudo?: () => void }).__pseudo = walk;
  });
}

function pseudoString(value: string): string {
  // Accent letters outside ICU arguments ({name}, {n, plural, …}); text inside plural branches is
  // translatable (depth ≥ 2) and gets accented too. Padding is appended outside every brace.
  let depth = 0;
  let out = '';
  const ACCENT: Record<string, string> = {
    a: 'á',
    e: 'ë',
    i: 'ï',
    o: 'ö',
    u: 'ü',
    c: 'ç',
    n: 'ñ',
    y: 'ÿ',
    A: 'Å',
    E: 'É',
    O: 'Ö',
    U: 'Ü',
  };
  for (const char of value) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    out += depth === 0 || depth >= 2 ? (ACCENT[char] ?? char) : char;
  }
  if (!/\p{L}/u.test(value)) return value;
  const extra = Math.ceil(value.length * 0.4);
  return `${out}${' ẋẋẋẋ'.repeat(Math.max(1, Math.ceil(extra / 5)))}`;
}

interface IClip {
  selector: string;
  text: string;
  reason: string;
}

async function findClipping(page: Page): Promise<{ scrollWidth: number; clips: IClip[] }> {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const clips: Array<{ selector: string; text: string; reason: string }> = [];
    const describe = (el: Element): string =>
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList]
        .slice(0, 3)
        .map((c) => `.${c}`)
        .join('')}`;
    const scrollsX = (el: Element | null): boolean => {
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') return true;
      }
      return false;
    };
    for (const el of document.body.querySelectorAll('*')) {
      // .at-skip is the visually hidden skip link; it is only laid out while focused.
      if (el.closest('dialog:not([open]), [hidden], template, script, style, .sr-only, .at-skip:not(:focus)')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const ownText = [...el.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
      if (!ownText) continue;
      if (!scrollsX(el) && (rect.right > viewport + 1 || rect.left < -1)) {
        clips.push({
          selector: describe(el),
          text: ownText.slice(0, 40),
          reason: `outside viewport ${String(Math.round(rect.left))}–${String(Math.round(rect.right))}`,
        });
      }
      const hidesOverflow = ['hidden', 'clip'].includes(style.overflowX) || style.textOverflow === 'ellipsis';
      if (hidesOverflow && el.scrollWidth > el.clientWidth + 1) {
        clips.push({
          selector: describe(el),
          text: ownText.slice(0, 40),
          reason: `clipped ${String(el.scrollWidth)} > ${String(el.clientWidth)}`,
        });
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, clips };
  });
}

test.describe('pseudo-locale overflow at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  // Standard-mode pages: on the cooking pages the cook layer (data-mode="cook") covers the chips.
  for (const route of ['/?autostart=0', '/15m?autostart=0', '/es/on/iphone-safari', '/on/iphone-safari']) {
    test(`no clipped strings on ${route}`, async ({ page }) => {
      await usePseudoLocale(page);
      await page.goto(route);
      await expect(page.locator('[data-pill-text]')).toContainText('ẋẋẋẋ');
      await page.evaluate(() => (window as Window & { __pseudo?: () => void }).__pseudo?.());
      await expect(page.locator('body')).toHaveAttribute('data-pseudo-ready', '1');
      let result = await findClipping(page);
      expect(result.scrollWidth, 'horizontal page scroll').toBeLessThanOrEqual(320);
      expect(result.clips).toEqual([]);

      // Running state: the held pill and the timer caption, both from the pseudo catalog.
      await page.locator('[data-chips] [data-preset="p15"]').click();
      await expect(page.locator('[data-pill-text]')).toContainText('ẋẋẋẋ');
      await expect(page.locator('[data-timer]')).toBeVisible();
      result = await findClipping(page);
      expect(result.scrollWidth, 'horizontal page scroll (running)').toBeLessThanOrEqual(320);
      expect(result.clips).toEqual([]);
    });
  }

  for (const { code } of LOCALES) {
    for (const route of [`/${code}/`, cookingPath(code)]) {
      test(`no clipped strings in ${route}`, async ({ page }) => {
        await page.goto(route === `/${code}/` ? `${route}?autostart=0` : route);
        await expect(page.locator('[data-pill-text]')).toBeVisible();
        const result = await findClipping(page);
        expect(result.scrollWidth, 'horizontal page scroll').toBeLessThanOrEqual(320);
        expect(result.clips).toEqual([]);
      });
    }
  }
});

test.describe('RTL readiness (phase-2 ar)', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test('a content page mirrors cleanly under dir="rtl"', async ({ page }) => {
    await page.goto('/es/for/cocinar');
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
    const result = await findClipping(page);
    expect(result.scrollWidth).toBeLessThanOrEqual(320);
    expect(result.clips).toEqual([]);
    // Direction-implying icons flip.
    const separator = page.locator('[data-slot="breadcrumb-separator"] > svg').first();
    await expect(separator).toHaveCSS('transform', 'matrix(-1, 0, 0, 1, 0, 0)');
    // The honest-limit note's glyph sits on the inline start edge, i.e. the right edge in RTL. (Clear Night, B5:
    // the note is a card with a leading glyph; side-stripe borders are banned, DESIGN.md §11.2.)
    const limit = page.locator('[role="note"]').first();
    const [noteBox, glyphBox] = await Promise.all([limit.boundingBox(), limit.locator('> svg').boundingBox()]);
    expect(noteBox).not.toBeNull();
    expect(glyphBox).not.toBeNull();
    if (noteBox && glyphBox) expect(glyphBox.x + glyphBox.width / 2).toBeGreaterThan(noteBox.x + noteBox.width / 2);
    // Start-aligned text follows the direction.
    await expect(page.locator('h1')).toHaveCSS('direction', 'rtl');
  });
});
