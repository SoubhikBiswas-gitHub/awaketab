import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import {
  badge,
  expect,
  localStore,
  mockLicenseApi,
  openOptions,
  openPopup,
  powerLog,
  syncStore,
  test,
} from './fixtures';

test.beforeEach(({ context }) => {
  // docs/19 B1: never alert/confirm/prompt.
  context.on('dialog', () => {
    throw new Error('A dialog opened');
  });
});

const pill = (page: Page) => page.locator('[data-pill-text]');

test('the built manifest asks for power, storage and alarms only — no host permissions', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const manifest = (await (await page.goto(`chrome-extension://${extensionId}/manifest.json`))?.json()) as Record<
    string,
    unknown
  >;
  expect(manifest.permissions).toEqual(['power', 'storage', 'alarms']);
  expect(manifest.optional_permissions).toEqual(['notifications']);
  expect(manifest.host_permissions ?? []).toEqual([]);
  expect(manifest.content_scripts).toBeUndefined();
  expect(manifest.name).toBe('__MSG_ext_name__');
});

test('popup opens fast in the Ready state with the web copy', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await expect(pill(page)).toHaveText('Ready');
  await expect(page.locator('[data-pill]')).toHaveAttribute('data-lock', 'idle');
  // The lamp CTA names the default length (∞, "Until I stop") before anything starts (DESIGN.md §4).
  await expect(page.locator('[data-toggle]')).toHaveText('Start · ∞');
  await expect(page.locator('[data-toggle]')).toHaveAttribute('aria-label', 'Start, until I stop');
  await expect(page.locator('[data-chips] [data-preset]')).toHaveCount(7);
  await expect(page.locator('[data-preset="pinf"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-caption]')).toHaveText('until you stop');
  const ready = Number(await page.evaluate(() => document.documentElement.dataset.ready));
  // E11-T03 AC is < 100 ms on a real machine; the headless CI budget leaves room for a cold worker.
  expect(ready).toBeLessThan(1_000);
  expect(await badge(page)).toBe('');
});

test('start ∞ holds the display keep-awake, shows ON, and stop releases it', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await page.locator('[data-preset="pinf"]').click();
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-pill]')).toHaveAttribute('data-lock', 'held');
  await expect(page.locator('[data-timer]')).toHaveText(/^00:0\d$/u);
  await expect(page.locator('[data-kicker]')).toHaveText('Awake for');
  await expect(page.locator('[data-meta]')).toHaveText('No end time. Stop when you are done.');
  // Stop is the raised neutral (D-R20), not the lamp.
  await expect(page.locator('[data-toggle]')).toHaveText('Stop');
  await expect(page.locator('[data-toggle]')).toHaveAttribute('data-live', '1');
  await expect.poll(() => badge(page)).toBe('ON');
  await expect
    .poll(async () => (await powerLog(page)).filter((c) => c.call === 'request').at(-1)?.level)
    .toBe('display');
  await page.locator('[data-toggle]').click();
  await expect(pill(page)).toHaveText('Ready');
  await expect.poll(() => badge(page)).toBe('');
  await expect.poll(async () => (await powerLog(page)).at(-1)?.call).toBe('release');
});

test('a finite preset shows minutes left on the badge; keyboard shortcuts work', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await page.locator('body').press('2');
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-preset="p30"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => badge(page)).toMatch(/^(30|29)m$/u);
  await expect(page.locator('[data-timer]')).toHaveText(/^(30:00|29:5\d)$/u);
  await page.locator('body').press(' ');
  await expect(pill(page)).toHaveText('Ready');
});

test('System level: requestKeepAwake("system"), SYS badge, and the pill never says "Screen awake" (D-02)', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await page.locator('input[name="level"][value="system"]').check({ force: true });
  await expect(page.locator('[data-level-help]')).toHaveText(
    'Keeps the computer awake. The screen may still dim or turn off.',
  );
  await page.locator('[data-preset="pinf"]').click();
  await expect(page.locator('[data-pill]')).toHaveAttribute('data-lock', 'held');
  await expect(pill(page)).toHaveText('System awake');
  await expect(page.locator('[data-pill-extra]')).toHaveText('Screen may dim or lock');
  await expect(page.locator('[data-pill]')).not.toContainText('Screen awake');
  await expect.poll(() => badge(page)).toBe('SYS');
  await expect
    .poll(async () => (await powerLog(page)).filter((c) => c.call === 'request').at(-1)?.level)
    .toBe('system');
  // Switching back to display level mid-session restores the shared held pill and drops the secondary line.
  await page.locator('input[name="level"][value="display"]').check({ force: true });
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-pill-extra]')).toBeHidden();
  await expect.poll(() => badge(page)).toBe('ON');
});

test('until-time starts an until session from the 15-minute stepper', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await page.locator('[data-until-open]').click();
  await expect(page.locator('[data-until]')).toBeVisible();
  // The panel replaces the chips and the Start button in place (inline, never a modal).
  await expect(page.locator('[data-chips]')).toBeHidden();
  await expect(page.locator('[data-toggle]')).toBeHidden();
  const first = (await page.locator('[data-until-time]').textContent()) ?? '';
  await page.locator('[data-until-more]').click();
  const target = (await page.locator('[data-until-time]').textContent()) ?? '';
  expect(target).not.toBe(first);
  expect(target).toMatch(/^\d{1,2}:(00|15|30|45) (AM|PM)$/u);
  await expect(page.locator('[data-until-summary]')).toContainText(`at ${target}`);
  await page.locator('[data-until] button[type="submit"]').click();
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-caption]')).toHaveText(new RegExp(`^Until ${target}( tomorrow)?$`, 'u'));
  await expect(page.locator('[data-until-open]')).toHaveText(target);
  await expect(page.locator('[data-until-open]')).toHaveAttribute('aria-pressed', 'true');
});

test('+15 min on a running session adds to it; the badge follows', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await page.locator('[data-preset="p15"]').click();
  await expect(pill(page)).toHaveText('Screen awake');
  await expect.poll(() => badge(page)).toMatch(/^(15|14)m$/u);
  await page.locator('[data-add] [data-add-ms="900000"]').click();
  await expect(page.locator('[data-timer]')).toHaveText(/^(30:00|29:5\d)$/u);
  await expect.poll(() => badge(page)).toMatch(/^(30|29)m$/u);
});

test('Blocked: a refused request says so, shows the fix, and Retry works once allowed', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await page.evaluate(() => chrome.storage.session.set({ 'at.test.deny': true }));
  await page.locator('[data-preset="p30"]').click();
  await expect(page.locator('[data-pill]')).toHaveAttribute('data-lock', 'denied');
  await expect(pill(page)).toHaveText("Blocked — here's the fix");
  await expect(page.locator('[data-error]')).toBeVisible();
  await expect(page.locator('[data-error] h2')).toHaveText(
    'Your browser or organisation blocked keeping this device awake.',
  );
  await expect(page.locator('[data-meta2]')).toHaveText('Nothing is keeping this device awake.');
  await expect(page.locator('[data-chips]')).toBeHidden();
  await expect(page.locator('[data-toggle]')).toBeHidden();
  expect(await badge(page)).toBe('');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.evaluate(() => chrome.storage.session.set({ 'at.test.deny': false }));
  await page.locator('[data-retry]').click();
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-error]')).toBeHidden();
});

test('first open: the tips card shows once; then free users get the inline Pro row', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await expect(page.locator('[data-tips]')).toBeVisible();
  await expect(page.locator('[data-tips]')).toContainText('starts or stops from any tab.');
  await page.locator('[data-tips-ok]').click();
  await expect(page.locator('[data-tips]')).toBeHidden();
  await expect
    .poll(
      async () =>
        ((await localStore(page))['at.v1.onboarding'] as { dismissedTips?: string[] } | undefined)?.dismissedTips,
    )
    .toContain('ext-first-open');
  const again = await openPopup(context, extensionId);
  await expect(again.locator('[data-tips]')).toBeHidden();
  await again.locator('[data-pro-row]').click();
  await expect(again.locator('[data-pro]')).toBeVisible();
  await expect(again.locator('[data-pro] h2')).toHaveText('Schedules and auto-start are part of AwakeTab Pro.');
  await again.locator('[data-pro-close]').click();
  await expect(again.locator('[data-pro-row]')).toBeVisible();
});

test('install opens the welcome page once, and it has no axe violations', async ({ context, extensionId }) => {
  const url = `chrome-extension://${extensionId}/welcome.html`;
  await expect.poll(() => context.pages().filter((p) => p.url() === url).length).toBe(1);
  const page = context.pages().find((p) => p.url() === url);
  if (!page) throw new Error('welcome page not open');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('h1')).toHaveText('AwakeTab is ready. Pin it where you can see it.');
  // The toolbar menu mock and the pin step name the extension exactly as Chrome lists it (the manifest name).
  await expect(page.locator('[data-store-name]')).toHaveText('AwakeTab: Keep Screen Awake');
  await expect(page.locator('[data-step2]')).toHaveText('Click the pin next to AwakeTab: Keep Screen Awake.');
  await page.locator('[data-pin-button]').click();
  await expect(page.locator('[data-pin]')).toHaveAttribute('aria-pressed', 'true');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('the session survives a forced service-worker restart and the keep-awake is re-issued', async ({
  context,
  extensionId,
}) => {
  const page = await openPopup(context, extensionId);
  await page.locator('[data-preset="p60"]').click();
  await expect(pill(page)).toHaveText('Screen awake');
  const before = (await localStore(page))['at.v1.session'] as { id: string };
  const requestsBefore = (await powerLog(page)).filter((c) => c.call === 'request').length;
  const cdp = await context.newCDPSession(page);
  await cdp.send('ServiceWorker.enable');
  await cdp.send('ServiceWorker.stopAllWorkers');
  // Any extension event wakes the worker again; the popup asking for state is one.
  const next = context.waitForEvent('serviceworker', { timeout: 3_000 }).catch(() => null);
  const reopened = await openPopup(context, extensionId);
  await next;
  await expect(pill(reopened)).toHaveText('Screen awake');
  await expect
    .poll(async () => (await powerLog(reopened)).filter((c) => c.call === 'request').length)
    .toBeGreaterThan(requestsBefore);
  const after = (await localStore(reopened))['at.v1.session'] as { id: string; status: string };
  expect(after.id).toBe(before.id);
  expect(after.status).toBe('active');
  await expect.poll(() => badge(reopened)).toMatch(/^(60|59)m$/u);
});

test('options: telemetry is off by default and free users see honest Pro gates', async ({ context, extensionId }) => {
  const page = await openOptions(context, extensionId);
  await expect(page.locator('input[name="telemetry"]')).not.toBeChecked();
  await expect(page.locator('input[name="notifications"]')).not.toBeChecked();
  const schedules = page.locator('[data-gated="ext.schedules"]');
  await expect(schedules.locator('[data-locked]')).toBeVisible();
  await expect(schedules.locator('[data-locked] a')).toHaveAttribute('href', 'https://awaketab.com/pro');
  await expect(schedules.locator('button[type="submit"]')).toBeDisabled();
  await expect(schedules.locator('.op-day').first()).toBeDisabled();
  // No dead control: battery auto-stop cannot work in an MV3 worker (docs/10 §13), so none is offered.
  await expect(page.locator('input[name="batteryAutoStop"]')).toHaveCount(0);
  // Changing a default is saved to chrome.storage.local and reaches the popup.
  await page.locator('label:has(input[name="defaultPreset"][value="p45"])').click();
  await expect(page.locator('input[name="defaultPreset"][value="p45"]')).toBeChecked();
  await expect(page.locator('[data-saved]')).toHaveText('Saved');
  await expect
    .poll(
      async () => ((await localStore(page))['at.v1.settings'] as { defaultPreset?: string } | undefined)?.defaultPreset,
    )
    .toBe('p45');
  const popup = await openPopup(context, extensionId);
  await expect(popup.locator('[data-toggle]')).toHaveText('Start · 45 min');
});

test('options: the language row stores settings.locale and switches the page in place', async ({
  context,
  extensionId,
}) => {
  const page = await openOptions(context, extensionId);
  await expect(page.locator('[data-lang-now]')).toHaveText('Browser language (English)');
  await page.locator('[data-lang-toggle]').click();
  await expect(page.locator('[data-lang-toggle]')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('input[name="locale"]')).toHaveCount(9);
  await page.locator('label:has(input[name="locale"][value="de"])').click();
  await expect(page.locator('h1')).toHaveText('AwakeTab-Einstellungen');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect
    .poll(async () => ((await localStore(page))['at.v1.settings'] as { locale?: string } | undefined)?.locale)
    .toBe('de');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-lang-list]')).toBeHidden();
  const popup = await openPopup(context, extensionId);
  await expect(pill(popup)).toHaveText('Bereit');
});

test('licence activation against a mocked API: local only, never synced, unlocks schedules', async ({
  context,
  extensionId,
}) => {
  const calls = await mockLicenseApi(context, extensionId, ['ext.schedules', 'ext.autostart']);
  const page = await openOptions(context, extensionId);
  await page.locator('input[name="key"]').fill('ATAB-WRONG-KEY-0000000000');
  await page.locator('[data-license-submit]').click();
  await expect(page.locator('[data-license-error]')).toHaveText(
    "That key doesn't match a purchase. Check the receipt email.",
  );
  await page.locator('input[name="key"]').fill('ATAB-E2E-KEY-1234567890');
  await page.locator('[data-license-submit]').click();
  await expect(page.locator('[data-license-active]')).toBeVisible();
  await expect(page.locator('[data-license-active]')).toContainText('Pro is active on this device');
  const body = JSON.parse(calls.at(-1) ?? '{}') as { deviceId: string; deviceLabel: string };
  const local = await localStore(page);
  expect((local['at.v1.device'] as { id: string }).id).toBe(body.deviceId);
  expect(body.deviceLabel).toMatch(/^AwakeTab for Chrome · /u);
  expect((local['at.v1.license'] as { deviceId: string }).deviceId).toBe(body.deviceId);
  await expect(page.locator('[data-gated="ext.schedules"] [data-locked]')).toBeHidden();
  await page.locator('[data-schedule-form] button[type="submit"]').click();
  await expect(page.locator('[data-schedules] li')).toHaveCount(1);
  // The worker mirrors settings to chrome.storage.sync after a short debounce; the licence never goes there.
  await expect.poll(async () => Object.keys(await syncStore(page)), { timeout: 8_000 }).toContain('at.v1.ext');
  const synced = await syncStore(page);
  expect(synced).not.toHaveProperty('at.v1.license');
  expect(synced).not.toHaveProperty('at.v1.device');
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe: popup and options have no violations (${theme})`, async ({ context, extensionId }) => {
    const popup = await openPopup(context, extensionId);
    // Colour transitions (0.45–0.9 s) would be sampled mid-way after the runtime theme flip below; with
    // reduced motion every colour is final at once, which is what a reader sees.
    await popup.emulateMedia({ reducedMotion: 'reduce' });
    await popup.evaluate((value) => {
      document.documentElement.setAttribute('data-theme', value);
    }, theme);
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    await popup.locator('[data-preset="p15"]').click();
    await expect(pill(popup)).toHaveText('Screen awake');
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    await popup.locator('[data-toggle]').click();
    await expect(pill(popup)).toHaveText('Ready');
    await popup.locator('[data-until-open]').click();
    await expect(popup.locator('[data-until]')).toBeVisible();
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    const options = await openOptions(context, extensionId);
    await options.emulateMedia({ reducedMotion: 'reduce' });
    await options.evaluate((value) => {
      document.documentElement.setAttribute('data-theme', value);
    }, theme);
    expect((await new AxeBuilder({ page: options }).analyze()).violations).toEqual([]);
    await options.locator('[data-lang-toggle]').click();
    await expect(options.locator('[data-lang-list]')).toBeVisible();
    expect((await new AxeBuilder({ page: options }).analyze()).violations).toEqual([]);
  });
}
