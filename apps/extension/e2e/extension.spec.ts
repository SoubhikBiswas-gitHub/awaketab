import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { badge, expect, localStore, mockLicenseApi, openOptions, openPopup, powerLog, syncStore, test } from './fixtures';

test.beforeEach(({ context }) => {
  // docs/19 B1: never alert/confirm/prompt.
  context.on('dialog', () => {
    throw new Error('A dialog opened');
  });
});

const pill = (page: Page) => page.locator('[data-pill-text]');

test('the built manifest asks for power, storage and alarms only — no host permissions', async ({ context, extensionId }) => {
  const page = await context.newPage();
  const manifest = (await (await page.goto(`chrome-extension://${extensionId}/manifest.json`))?.json()) as Record<string, unknown>;
  expect(manifest.permissions).toEqual(['power', 'storage', 'alarms']);
  expect(manifest.optional_permissions).toEqual(['notifications']);
  expect(manifest.host_permissions ?? []).toEqual([]);
  expect(manifest.content_scripts).toBeUndefined();
  expect(manifest.name).toBe('__MSG_ext_name__');
});

test('popup opens fast in the Ready state with the web copy', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await expect(pill(page)).toHaveText('Ready');
  await expect(page.locator('[data-toggle]')).toHaveText('Start');
  await expect(page.locator('[data-chips] [data-preset]')).toHaveCount(7);
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
  await expect.poll(() => badge(page)).toBe('ON');
  await expect.poll(async () => (await powerLog(page)).filter((c) => c.call === 'request').at(-1)?.level).toBe('display');
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

test('System level: requestKeepAwake("system"), SYS badge and the honest secondary line', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await page.locator('input[name="level"][value="system"]').check({ force: true });
  await expect(page.locator('[data-level-help]')).toHaveText('Keeps the computer awake. The screen may still dim or turn off.');
  await page.locator('[data-preset="pinf"]').click();
  await expect(page.locator('[data-pill-extra]')).toHaveText('System awake — screen may dim');
  await expect.poll(() => badge(page)).toBe('SYS');
  await expect.poll(async () => (await powerLog(page)).filter((c) => c.call === 'request').at(-1)?.level).toBe('system');
});

test('until-time starts an until session', async ({ context, extensionId }) => {
  const page = await openPopup(context, extensionId);
  await page.locator('[data-until-open]').click();
  await page.locator('[data-until-input]').fill('23:59');
  await expect(page.locator('[data-until-summary]')).toContainText('23:59');
  await page.locator('[data-until] button[type="submit"]').click();
  await expect(pill(page)).toHaveText('Screen awake');
  await expect(page.locator('[data-caption]')).toHaveText('Until 23:59');
});

test('the session survives a forced service-worker restart and the keep-awake is re-issued', async ({ context, extensionId }) => {
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
  await expect.poll(async () => (await powerLog(reopened)).filter((c) => c.call === 'request').length).toBeGreaterThan(requestsBefore);
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
  await expect(page.locator('input[name="batteryAutoStop"]')).toBeDisabled();
  // Changing a default is saved to chrome.storage.local and reaches the popup.
  await page.locator('select[name="defaultPreset"]').selectOption('p45');
  await expect(page.locator('[data-saved]')).toHaveText('Saved');
  await expect.poll(async () => ((await localStore(page))['at.v1.settings'] as { defaultPreset?: string } | undefined)?.defaultPreset).toBe('p45');
});

test('licence activation against a mocked API: local only, never synced, unlocks schedules', async ({ context, extensionId }) => {
  const calls = await mockLicenseApi(context, extensionId, ['ext.schedules', 'ext.autostart']);
  const page = await openOptions(context, extensionId);
  await page.locator('input[name="key"]').fill('ATAB-WRONG-KEY-0000000000');
  await page.locator('[data-license-submit]').click();
  await expect(page.locator('[data-license-error]')).toHaveText("That key doesn't match a purchase. Check the receipt email.");
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
    await popup.evaluate((value) => {
      document.documentElement.setAttribute('data-theme', value);
    }, theme);
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    await popup.locator('[data-preset="p15"]').click();
    await expect(pill(popup)).toHaveText('Screen awake');
    expect((await new AxeBuilder({ page: popup }).analyze()).violations).toEqual([]);
    const options = await openOptions(context, extensionId);
    await options.evaluate((value) => {
      document.documentElement.setAttribute('data-theme', value);
    }, theme);
    expect((await new AxeBuilder({ page: options }).analyze()).violations).toEqual([]);
  });
}
