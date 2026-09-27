import { test as base, chromium, expect, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { createHash, webcrypto } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const EXTENSION_DIR = path.resolve(HERE, '../.output-test/chrome-mv3');

export interface IPowerCall {
  call: 'request' | 'release';
  level?: 'display' | 'system';
  at: number;
}

export const test = base.extend<{ context: BrowserContext; worker: Worker; extensionId: string }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures take their dependencies by destructuring.
  context: async ({}, use) => {
    const profile = await mkdtemp(path.join(tmpdir(), 'awaketab-e2e-'));
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`],
    });
    await use(context);
    await context.close();
    await rm(profile, { recursive: true, force: true });
  },
  worker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(worker);
  },
  extensionId: async ({ worker }, use) => {
    await use(new URL(worker.url()).host);
  },
});

export { expect };

export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 360, height: 600 });
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.locator('[data-root]')).toBeVisible();
  return page;
}

export async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('[data-root]')).toBeVisible();
  return page;
}

export async function powerLog(page: Page): Promise<IPowerCall[]> {
  return page.evaluate(async () => {
    const raw = (await chrome.storage.session.get('at.test.power'))['at.test.power'];
    return Array.isArray(raw) ? (raw as IPowerCall[]) : [];
  });
}

export async function badge(page: Page): Promise<string> {
  return page.evaluate(() => chrome.action.getBadgeText({}));
}

export async function localStore(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => chrome.storage.local.get(null));
}

export async function syncStore(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => chrome.storage.sync.get(null));
}

export async function devToken(claims: { plan: string; features: string[]; deviceId: string; exp: number }): Promise<string> {
  const vars = await readFile(path.resolve(HERE, '../../web/.dev.vars.example'), 'utf8');
  const line = vars.split('\n').find((l) => l.startsWith('LICENSE_SIGNING_KEY='));
  if (!line) throw new Error('dev signing key missing');
  const jwk = JSON.parse(line.slice('LICENSE_SIGNING_KEY='.length)) as JsonWebKey;
  const key = await webcrypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const enc = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = enc({ alg: 'ES256', typ: 'JWT', ver: 1 });
  const dev = createHash('sha256').update(claims.deviceId).digest('hex');
  const payload = enc({ sub: 'e2e', plan: claims.plan, features: claims.features, dev, iat: Math.floor(Date.now() / 1000), exp: claims.exp, ver: 1 });
  const sig = Buffer.from(await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, Buffer.from(`${header}.${payload}`)));
  return `${header}.${payload}.${sig.toString('base64url')}`;
}

export async function mockLicenseApi(context: BrowserContext, extensionId: string, features: string[]): Promise<string[]> {
  const origin = `chrome-extension://${extensionId}`;
  const cors = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'Origin',
  };
  const seen: string[] = [];
  await context.route('https://awaketab.com/api/license/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    const body = JSON.parse(request.postData() ?? '{}') as { key?: string; deviceId?: string; deviceLabel?: string };
    seen.push(JSON.stringify(body));
    if (body.key !== 'ATAB-E2E-KEY-1234567890') {
      await route.fulfill({ status: 404, headers: cors, json: { error: 'invalid_key' } });
      return;
    }
    const exp = Math.floor(Date.now() / 1000) + 30 * 86_400;
    const token = await devToken({ plan: 'pro_yearly', features, deviceId: body.deviceId ?? '', exp });
    await route.fulfill({ headers: cors, json: { token, plan: 'pro_yearly', features, exp, activations: [] } });
  });
  return seen;
}
