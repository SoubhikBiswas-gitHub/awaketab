import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { installFakeWakeLock } from './fake-wakelock';

// The owner's rule: nothing flickers and nothing moves, on any page, at any moment.
// Layout-shift entries exist in Chromium only, so the CLS tests skip where the entry type is missing.

const LIMIT = 0.001;

const PAGES = [
  '/',
  '/30m',
  '/until/22-30',
  '/es/',
  '/for',
  '/on',
  '/vs',
  '/guides',
  '/learn',
  '/learn/how-awaketab-works',
  '/for/cooking',
  '/on/iphone-safari',
  '/vs/caffeine',
  '/guides/chrome-energy-saver',
  '/extension',
  '/pro',
  '/about',
  '/changelog',
  '/privacy',
  '/embed',
  '/kiosk',
  '/library',
  '/this-page-does-not-exist',
] as const;

interface IViewport {
  name: string;
  width: number;
  height: number;
  mobile: boolean;
}

const VIEWPORTS: IViewport[] = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

// WebPageTest's "3G Slow" profile: 400 ms round trip, 400 kbit/s each way.
const SLOW_3G = {
  offline: false,
  latency: 400,
  downloadThroughput: (400 * 1024) / 8,
  uploadThroughput: (400 * 1024) / 8,
};

interface IShift {
  t: number;
  value: number;
  input: boolean;
  nodes: string[];
}

interface ILayoutShiftSource {
  node: Node | null;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface ILayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: ILayoutShiftSource[];
}

type TShiftWindow = Window & { __shifts: IShift[] };

interface IToolFrame {
  t: number;
  face: string | null;
  digits: string | null;
  tab: string | null;
  preset: string | null;
  pill: string | null;
  primary: boolean;
}

type TToolWindow = Window & { __frames: IToolFrame[]; __probe: boolean };

interface ISvgSeen {
  w: number;
  h: number;
  t: number;
}

type TSvgWindow = Window & { __svgReport: () => string[] };

function recordShifts(): void {
  const w = window as unknown as TShiftWindow;
  w.__shifts = [];
  if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) return;
  const rect = (r: DOMRectReadOnly) =>
    `${String(Math.round(r.x))},${String(Math.round(r.y))} ${String(Math.round(r.width))}x${String(Math.round(r.height))}`;
  const name = (n: Node | null): string => {
    const el = n instanceof Element ? n : (n?.parentElement ?? null);
    if (!el) return '(removed node)';
    const cls = (el.getAttribute('class') ?? '').trim().split(/\s+/u).filter(Boolean).slice(0, 3);
    return `${el.nodeName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls.map((c) => `.${c}`).join('')}`;
  };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries() as ILayoutShiftEntry[]) {
      w.__shifts.push({
        t: Math.round(e.startTime),
        value: e.value,
        input: e.hadRecentInput,
        nodes: (e.sources ?? []).map((s) => `${name(s.node)} ${rect(s.previousRect)} -> ${rect(s.currentRect)}`),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
}

// Samples the tool's visible state on every frame from first paint (rAF never runs while the page is render-blocked).
function probeTool(): void {
  const w = window as unknown as TToolWindow;
  w.__frames = [];
  w.__probe = true;
  let last = '';
  const rendered = (el: Element | null | undefined): el is HTMLElement =>
    el instanceof HTMLElement && el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
  const opacity = (el: Element): number => {
    let o = 1;
    for (let n: Element | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };
  const seg = (group: Element | null | undefined, selected: string): string | null => {
    if (!rendered(group)) return null;
    const on = [...group.querySelectorAll(selected)]
      .filter(rendered)
      .map((el) => el.getAttribute('data-face') ?? el.getAttribute('data-preset') ?? '?')
      .join('+');
    const ind = group.querySelector('.at-seg-ind');
    if (!rendered(ind)) return `${on || 'none'}`;
    const g = group.getBoundingClientRect();
    const r = ind.getBoundingClientRect();
    return `${on || 'none'} @${String(Math.round(r.left - g.left))}+${String(Math.round(r.width))} o${opacity(ind).toFixed(1)}`;
  };
  const sample = () => {
    if (!w.__probe) return;
    const tool = document.getElementById('awaketab-tool');
    if (tool?.querySelector('.at-cta')) {
      const face = [...tool.querySelectorAll('.at-face')].find(rendered);
      const digits = face ? [...face.querySelectorAll('.at-digits')].find(rendered) : undefined;
      const pill = tool.querySelector('[data-pill-text]');
      const primary = [...tool.querySelectorAll('.at-cta, [data-act="stop"]')].filter(
        (el) => !el.closest('dialog') && rendered(el),
      );
      const frame: IToolFrame = {
        t: Math.round(performance.now()),
        face: face ? (/\bat-face-(\w+)/u.exec(face.className)?.[1] ?? '?') : null,
        digits: digits ? (digits.textContent ?? '').replace(/\s+/gu, '') : null,
        tab: [...tool.querySelectorAll('.at-fc [data-t="fn"]')].find(rendered)?.textContent ?? null,
        preset: seg(tool.querySelector('[data-chips] .at-bar'), '[aria-pressed="true"]'),
        pill: rendered(pill) ? (pill.textContent ?? '').trim() : null,
        primary: primary.length > 0 && primary.every((el) => opacity(el) >= 0.99),
      };
      const key = JSON.stringify({ ...frame, t: 0 });
      if (key !== last) w.__frames.push(frame);
      last = key;
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}

// Tracks the largest size every outer <svg> reaches from first paint on; the report compares it with the
// width/height attributes and with the size it settles at.
function probeSvgs(): void {
  const w = window as unknown as TSvgWindow;
  const sizes = new Map<SVGSVGElement, ISvgSeen>();
  let running = true;
  const size = (svg: SVGSVGElement): { w: number; h: number } | null => {
    if (svg.getClientRects().length === 0) return null;
    const cs = getComputedStyle(svg);
    const sw = parseFloat(cs.width);
    const sh = parseFloat(cs.height);
    return Number.isFinite(sw) && Number.isFinite(sh) ? { w: sw, h: sh } : null;
  };
  const attr = (svg: SVGSVGElement, name: string): number | null => {
    const v = svg.getAttribute(name)?.trim() ?? '';
    return /^\d+(?:\.\d+)?(?:px)?$/u.test(v) ? parseFloat(v) : null;
  };
  const what = (svg: SVGSVGElement): string => {
    const cls = svg.getAttribute('class') ?? '';
    const host = svg.parentElement;
    const hostCls = (host?.getAttribute('class') ?? '').trim().split(/\s+/u)[0] ?? '';
    return `svg${cls ? `.${cls.trim().split(/\s+/u).join('.')}` : ''}[viewBox="${svg.getAttribute('viewBox') ?? ''}"] in ${host?.nodeName.toLowerCase() ?? '?'}${hostCls ? `.${hostCls}` : ''}`;
  };
  const px = (n: number) => String(Math.round(n));
  const sample = () => {
    if (!running) return;
    for (const svg of document.querySelectorAll('svg')) {
      if (svg.ownerSVGElement) continue;
      const s = size(svg);
      if (!s) continue;
      const seen = sizes.get(svg);
      if (!seen) sizes.set(svg, { ...s, t: Math.round(performance.now()) });
      else if (s.w > seen.w || s.h > seen.h) {
        seen.w = Math.max(seen.w, s.w);
        seen.h = Math.max(seen.h, s.h);
        seen.t = Math.round(performance.now());
      }
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  w.__svgReport = () => {
    running = false;
    const out: string[] = [];
    for (const [svg, seen] of sizes) {
      const aw = attr(svg, 'width');
      const ah = attr(svg, 'height');
      const peak = `${px(seen.w)}x${px(seen.h)} px at ${String(seen.t)} ms`;
      if ((aw !== null && seen.w > aw + 0.5) || (ah !== null && seen.h > ah + 0.5))
        out.push(`${what(svg)}: ${peak}, its attributes say ${String(aw ?? 'auto')}x${String(ah ?? 'auto')}`);
      const now = svg.isConnected ? size(svg) : null;
      // A flash of an unstyled icon is many times its size; sub-pixel reflow is the CLS tests' job.
      if (now && (seen.w > now.w * 1.25 + 2 || seen.h > now.h * 1.25 + 2))
        out.push(`${what(svg)}: ${peak}, settles at ${px(now.w)}x${px(now.h)} px`);
    }
    return out;
  };
}

async function openPage(
  browser: Browser,
  browserName: string,
  baseURL: string | undefined,
  vp: IViewport,
  throttle: boolean,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    ...(baseURL ? { baseURL } : {}),
    viewport: { width: vp.width, height: vp.height },
    serviceWorkers: 'block',
    // Firefox has no mobile emulation; the viewport width is what the layout reacts to anyway.
    ...(vp.mobile && browserName !== 'firefox' ? { isMobile: true, hasTouch: true } : {}),
  });
  const page = await context.newPage();
  page.on('dialog', () => {
    throw new Error('native dialog opened');
  });
  await installFakeWakeLock(page);
  if (throttle && browserName === 'chromium') {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', SLOW_3G);
  }
  return { context, page };
}

async function skipWithoutLayoutShift(page: Page): Promise<void> {
  const supported = await page.evaluate(() => PerformanceObserver.supportedEntryTypes.includes('layout-shift'));
  test.skip(!supported, 'layout-shift entries exist in Chromium only');
}

// Finite entrance animations must end, then a grace period covers transitions and late work.
async function settle(page: Page, graceMs: number): Promise<void> {
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .every(
          (a) =>
            !(a instanceof CSSAnimation) ||
            !(a.timeline instanceof DocumentTimeline) ||
            a.effect?.getTiming().iterations === Infinity ||
            a.playState !== 'running',
        ),
    undefined,
    { timeout: 15_000 },
  );
  await page.waitForTimeout(graceMs);
}

async function settleLoad(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Routes that start on load hold the pill back until the browser answers (at most 2 s).
  if ((await page.locator('#awaketab-tool[data-auto]').count()) > 0)
    await page.locator('#awaketab-tool[data-settled]').waitFor({ timeout: 15_000 });
  await settle(page, 1500);
}

const shifts = (page: Page) => page.evaluate(() => (window as unknown as TShiftWindow).__shifts.slice());

function report(moved: IShift[]): string {
  return moved
    .map((s) => `  +${s.value.toFixed(4)} at ${String(s.t)} ms: ${s.nodes.join(' | ') || '(no source node)'}`)
    .join('\n');
}

async function pickTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  const html = page.locator('html');
  const item = page.locator(`#awaketab-tool header .at-theme-item[data-v="${theme}"]:visible`).first();
  if ((await item.count()) > 0) await item.click();
  else {
    const cycle = page.locator('#awaketab-tool header [data-theme-cycle]');
    for (let i = 0; i < 4 && (await html.getAttribute('data-theme-pref')) !== theme; i += 1) await cycle.click();
  }
  await expect(html).toHaveAttribute('data-theme-pref', theme);
}

test.describe('layout stability', { tag: '@stability' }, () => {
  test.describe('page load moves nothing on slow 3G', () => {
    test.describe.configure({ timeout: 90_000 });
    for (const vp of VIEWPORTS) {
      for (const path of PAGES) {
        test(`${path} at ${vp.name}`, async ({ browser, browserName, baseURL }) => {
          const { context, page } = await openPage(browser, browserName, baseURL, vp, true);
          try {
            await skipWithoutLayoutShift(page);
            await page.addInitScript(recordShifts);
            const res = await page.goto(path, { waitUntil: 'load', timeout: 60_000 });
            expect(res?.status()).toBe(path === '/this-page-does-not-exist' ? 404 : 200);
            await settleLoad(page);
            const moved = (await shifts(page)).filter((s) => !s.input && s.value > 0);
            const total = moved.reduce((sum, s) => sum + s.value, 0);
            expect(total, `${path} at ${vp.name} shifted while loading:\n${report(moved)}`).toBeLessThanOrEqual(LIMIT);
          } finally {
            await context.close();
          }
        });
      }
    }
  });

  test.describe('tool controls move nothing', () => {
    for (const vp of VIEWPORTS) {
      test(`tool page at ${vp.name}`, async ({ browser, browserName, baseURL }) => {
        const { context, page } = await openPage(browser, browserName, baseURL, vp, false);
        try {
          await skipWithoutLayoutShift(page);
          await page.addInitScript(recordShifts);
          // Without auto-start, so Space starts the session rather than stopping the one that began on load.
          await page.goto('/?autostart=0');
          const tool = page.locator('#awaketab-tool');
          await page.locator('#awaketab-tool[data-booted][data-settled]').waitFor();
          await settleLoad(page);
          await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          });
          const html = page.locator('html');
          const gallery = page.locator('dialog[data-dialog="faces"]');
          const menu = page.locator('#at-hm-menu');
          const steps: Array<[string, () => Promise<void>]> = [
            [
              'start (Space)',
              async () => {
                await page.keyboard.press('Space');
                await expect(tool).toHaveAttribute('data-status', 'awake');
              },
            ],
            [
              'stop (Space)',
              async () => {
                await page.keyboard.press('Space');
                await expect(tool).not.toHaveAttribute('data-status', 'awake');
              },
            ],
            ...(['bold', 'horizon', 'tide', 'ring'] as const).map((name): [string, () => Promise<void>] => [
              `face ${name}`,
              async () => {
                await page.locator('#awaketab-tool .at-fc-open:visible').first().click();
                await expect(gallery).toBeVisible();
                await gallery.locator(`[data-pick="${name}"]`).click();
                await expect(gallery).toBeHidden();
                if (name === 'ring') await expect(html).not.toHaveAttribute('data-face');
                else await expect(html).toHaveAttribute('data-face', name);
              },
            ]),
            [
              'preset 1 h',
              async () => {
                const chip = page.locator('#awaketab-tool [data-chips] [data-preset="p60"]:visible').first();
                await chip.click();
                await expect(chip).toHaveAttribute('aria-pressed', 'true');
              },
            ],
            ['theme dark', () => pickTheme(page, 'dark')],
            ['theme light', () => pickTheme(page, 'light')],
            [
              'open the header Menu',
              async () => {
                await page.locator('#awaketab-tool header button.at-hm-open').click();
                await expect(menu).toBeVisible();
              },
            ],
            [
              'close the header Menu',
              async () => {
                await page.keyboard.press('Escape');
                await expect(menu).toBeHidden();
              },
            ],
            [
              'scroll down the page',
              () =>
                page.evaluate(async () => {
                  for (let i = 0; i < 6; i += 1) {
                    window.scrollBy(0, 700);
                    await new Promise<void>((done) => {
                      requestAnimationFrame(() => setTimeout(done, 150));
                    });
                  }
                }),
            ],
            ['resize to 1024 x 768', () => page.setViewportSize({ width: 1024, height: 768 })],
          ];
          for (const [label, run] of steps) {
            const from = (await shifts(page)).length;
            await run();
            await settle(page, 800);
            const moved = (await shifts(page)).slice(from).filter((s) => !s.input && s.value > 0);
            const total = moved.reduce((sum, s) => sum + s.value, 0);
            expect
              .soft(total, `${label} at ${vp.name} shifted the layout:\n${report(moved)}`)
              .toBeLessThanOrEqual(LIMIT);
          }
        } finally {
          await context.close();
        }
      });
    }
  });

  test.describe('the tool paints its final state on the first frame', () => {
    test.describe.configure({ timeout: 90_000 });
    const ROUTES = [
      ['/', true],
      ['/?autostart=0', false],
    ] as const;
    for (const vp of VIEWPORTS) {
      for (const [path, auto] of ROUTES) {
        test(`${path} at ${vp.name}`, async ({ browser, browserName, baseURL }) => {
          // Known issue: on slow 3G the desktop face tabs appear one frame after first paint.
          test.fixme(vp.name === 'desktop', 'desktop face tabs paint one frame late on slow 3G');
          const { context, page } = await openPage(browser, browserName, baseURL, vp, true);
          try {
            // A frozen wall clock keeps the awake face's elapsed digits still, so any change is a real flicker.
            await page.clock.setFixedTime(new Date('2026-09-26T22:00:00'));
            await page.addInitScript(probeTool);
            await page.goto(path, { waitUntil: 'load', timeout: 60_000 });
            await page.locator('#awaketab-tool[data-booted][data-settled]').waitFor({ timeout: 30_000 });
            await page.waitForTimeout(2000);
            const frames = await page.evaluate(() => {
              const w = window as unknown as TToolWindow;
              w.__probe = false;
              return w.__frames;
            });
            const first = frames.at(0);
            const last = frames.at(-1);
            if (!first || !last) throw new Error('the probe never saw the tool painted');
            const log = frames
              .slice(0, 40)
              .map((f) => `  ${String(f.t)} ms ${JSON.stringify({ ...f, t: undefined })}`)
              .join('\n');
            for (const key of ['face', 'digits', 'tab', 'preset'] as const) {
              const seen = [...new Set(frames.map((f) => f[key]))];
              expect.soft(seen, `${key} changed after first paint on ${path}:\n${log}`).toEqual([last[key]]);
            }
            // The pill may wait for the browser's answer on a route that starts on load (it never guesses),
            // but once shown its text never changes and it never hides again.
            const pills = frames.map((f) => f.pill);
            const shown = pills.findIndex((p) => p !== null);
            expect.soft(last.pill, `the pill never showed on ${path}:\n${log}`).not.toBeNull();
            expect
              .soft(
                [...new Set(pills.slice(Math.max(shown, 0)))],
                `the pill changed after first paint on ${path}:\n${log}`,
              )
              .toEqual([last.pill]);
            if (!auto) expect.soft(first.pill, `the pill was held back on ${path}:\n${log}`).toBe(last.pill);
            expect
              .soft(
                frames.filter((f) => !f.primary).map((f) => f.t),
                `the primary button was missing or not fully opaque on ${path}:\n${log}`,
              )
              .toEqual([]);
          } finally {
            await context.close();
          }
        });
      }
    }
  });

  test.describe('no unstyled flash of icons on slow 3G', () => {
    test.describe.configure({ timeout: 90_000 });
    for (const vp of VIEWPORTS) {
      for (const path of ['/', '/extension', '/pro'] as const) {
        test(`${path} at ${vp.name}`, async ({ browser, browserName, baseURL }) => {
          const { context, page } = await openPage(browser, browserName, baseURL, vp, true);
          try {
            await page.addInitScript(probeSvgs);
            await page.goto(path, { waitUntil: 'load', timeout: 60_000 });
            await settleLoad(page);
            const flashes = await page.evaluate(() => (window as unknown as TSvgWindow).__svgReport());
            expect(flashes, `icons drew larger than their size on ${path} at ${vp.name}`).toEqual([]);
          } finally {
            await context.close();
          }
        });
      }
    }
  });
});
