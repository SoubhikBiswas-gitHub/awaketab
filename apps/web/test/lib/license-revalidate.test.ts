import { sha256Hex } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSigningKey, signES256 } from '../../functions/_lib/jwt';
import { revalidateStoredLicense } from '../../src/lib/license';
import { lookupCheckoutKey, normaliseLicenseKey } from '../../src/lib/license-lookup';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DEVICE = 'device-1';
// happy-dom replaces URL, so read the dev signing key by path (the functions harness uses import.meta.url).
const SIGNING_KEY =
  readFileSync(path.resolve('apps/web/.dev.vars.example'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('LICENSE_SIGNING_KEY='))
    ?.slice('LICENSE_SIGNING_KEY='.length) ?? '';
const DAY_S = 86_400;

async function token(opts: { exp: number; features?: string[]; plan?: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signES256(
    {
      sub: 'keyhash',
      plan: (opts.plan ?? 'pro_yearly') as 'pro_yearly',
      features: (opts.features ?? ['ads.free']) as ['ads.free'],
      dev: await sha256Hex(DEVICE),
      iat: now,
      exp: opts.exp,
      ver: 1,
    },
    parseSigningKey(SIGNING_KEY),
  );
}

async function store(opts: { lastValidatedAt: number; exp: number; tok?: string }) {
  localStorage.setItem(
    'at.v1.license',
    JSON.stringify({
      v: 1,
      token: opts.tok ?? (await token({ exp: opts.exp })),
      plan: 'pro_yearly',
      features: ['ads.free'],
      exp: opts.exp,
      lastValidatedAt: opts.lastValidatedAt,
      deviceId: DEVICE,
      deviceLabel: 'test',
    }),
  );
}

const stored = () => JSON.parse(localStorage.getItem('at.v1.license') ?? 'null') as { token: string; features: string[]; exp: number } | null;
const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('revalidateStoredLicense', () => {
  const now = Math.floor(Date.now() / 1000);
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips the network while the token is valid and recently validated', async () => {
    await store({ lastValidatedAt: Date.now(), exp: now + 30 * DAY_S });
    const fetchMock = reply(200, {});
    vi.stubGlobal('fetch', fetchMock);
    expect(await revalidateStoredLicense()).toBe('ok');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stores a fresh server token only after it verifies offline for this device', async () => {
    await store({ lastValidatedAt: Date.now() - 2 * DAY_S * 1000, exp: now + 30 * DAY_S });
    const fresh = await token({ exp: now + 365 * DAY_S, features: ['ads.free', 'ambient.packs'] });
    vi.stubGlobal('fetch', reply(200, { revoked: false, token: fresh }));
    expect(await revalidateStoredLicense()).toBe('ok');
    expect(stored()?.token).toBe(fresh);
    expect(stored()?.features).toContain('ambient.packs');
    expect(stored()?.exp).toBe(now + 365 * DAY_S);
  });

  it('ignores a fresh token that does not verify', async () => {
    await store({ lastValidatedAt: Date.now() - 2 * DAY_S * 1000, exp: now + 30 * DAY_S });
    const before = stored()?.token;
    vi.stubGlobal('fetch', reply(200, { revoked: false, token: 'not.a.jwt' }));
    expect(await revalidateStoredLicense()).toBe('ok');
    expect(stored()?.token).toBe(before);
  });

  it('revoked → removed; deactivated device or 401 → reactivate', async () => {
    await store({ lastValidatedAt: 0, exp: now + DAY_S });
    vi.stubGlobal('fetch', reply(200, { revoked: true, reason: 'refunded' }));
    expect(await revalidateStoredLicense()).toBe('revoked');
    expect(stored()).toBeNull();

    await store({ lastValidatedAt: 0, exp: now + DAY_S });
    vi.stubGlobal('fetch', reply(200, { revoked: true, reason: 'deactivated' }));
    expect(await revalidateStoredLicense()).toBe('reactivate');

    await store({ lastValidatedAt: 0, exp: now + DAY_S });
    vi.stubGlobal('fetch', reply(401, { error: 'bad_token' }));
    expect(await revalidateStoredLicense()).toBe('reactivate');
    expect(stored()).toBeNull();
  });

  it('never downgrades on an outage or offline', async () => {
    await store({ lastValidatedAt: 0, exp: now + DAY_S });
    vi.stubGlobal('fetch', reply(502, { error: 'polar_unavailable' }));
    expect(await revalidateStoredLicense()).toBe('skip');
    expect(stored()).not.toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await revalidateStoredLicense()).toBe('skip');
    expect(stored()).not.toBeNull();
  });
});

// docs/09 §2.3a: the /pro/activate?ext=1 hand-off never activates this browser.
describe('normaliseLicenseKey / lookupCheckoutKey', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalises a key like the server (trim + upper case) and rejects other shapes', () => {
    expect(normaliseLicenseKey('  awaketab-pro-test-0001-abcd ')).toBe('AWAKETAB-PRO-TEST-0001-ABCD');
    for (const bad of ['', 'short-key', 'AWAKETAB PRO TEST 0001 ABCD', 'X'.repeat(81)]) expect(normaliseLicenseKey(bad)).toBeNull();
  });

  it('posts { checkoutId, lookup: true } with no device fields and stores nothing', async () => {
    localStorage.clear();
    const fetchMock = reply(200, { key: 'awaketab-pro-test-0001-abcd', plan: 'pro_yearly' });
    vi.stubGlobal('fetch', fetchMock);
    expect(await lookupCheckoutKey('chk_1')).toEqual({ ok: true, key: 'AWAKETAB-PRO-TEST-0001-ABCD' });
    const [url, init] = (fetchMock.mock.calls[0] ?? []) as unknown as [string, RequestInit];
    expect(url).toBe('/api/license/activate');
    expect(JSON.parse(String(init.body))).toEqual({ checkoutId: 'chk_1', lookup: true });
    expect(localStorage.getItem('at.v1.license')).toBeNull();
  });

  it('maps API errors and network failures', async () => {
    vi.stubGlobal('fetch', reply(404, { error: 'invalid_key' }));
    expect(await lookupCheckoutKey('chk_1')).toEqual({ ok: false, error: 'invalid_key' });
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    expect(await lookupCheckoutKey('chk_1')).toEqual({ ok: false, error: 'offline' });
  });
});
