import { describe, expect, it, vi } from 'vitest';
import { activate, deactivate, deviceLabel, LICENSE_ERROR_KEYS, revalidate } from '../../src/license';
import { createTelemetry } from '../../src/telemetry';
import { bodyOf } from './fake-chrome';
import { proRecord, signToken } from './helpers';

const DEVICE = { id: '22222222-2222-4222-8222-222222222222', label: 'AwakeTab for Chrome · macOS' };

describe('licence reuse (docs/10 §7)', () => {
  it('labels the device "AwakeTab for Chrome · {OS}" within the API limit', () => {
    expect(deviceLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/128')).toBe(
      'AwakeTab for Chrome · macOS',
    );
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128')).toBe('AwakeTab for Chrome · Windows');
    expect(deviceLabel('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/128')).toBe('AwakeTab for Chrome · ChromeOS');
    expect(deviceLabel('x').length).toBeLessThanOrEqual(40);
  });

  it('activates against the API with the per-profile deviceId and verifies the token offline', async () => {
    const exp = Math.floor(Date.now() / 1000) + 86_400;
    const token = await signToken({ plan: 'pro_yearly', features: ['ext.schedules'], exp, deviceId: DEVICE.id });
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(Response.json({ token, plan: 'pro_yearly', features: ['ext.schedules'], exp, activations: [] })),
    );
    const result = await activate(' ATAB-KEY-1234567890-XYZ ', DEVICE, fetchFn);
    expect(result.ok).toBe(true);
    expect(fetchFn.mock.calls[0]?.[0]).toBe('https://awaketab.com/api/license/activate');
    expect(JSON.parse(bodyOf(fetchFn.mock.calls[0]?.[1]))).toEqual({
      key: 'ATAB-KEY-1234567890-XYZ',
      deviceId: DEVICE.id,
      deviceLabel: DEVICE.label,
    });
    if (result.ok)
      expect(result.record).toMatchObject({ plan: 'pro_yearly', deviceId: DEVICE.id, features: ['ext.schedules'] });
  });

  it('refuses a token minted for another device, and maps API errors to the web copy keys', async () => {
    const exp = Math.floor(Date.now() / 1000) + 86_400;
    const other = await signToken({ plan: 'pro_yearly', features: [], exp, deviceId: 'someone-else' });
    const wrong = await activate('ATAB-KEY-1234567890-XYZ', DEVICE, () =>
      Promise.resolve(Response.json({ token: other, plan: 'pro_yearly', features: [], exp })),
    );
    expect(wrong).toEqual({ ok: false, error: 'bad_token' });
    const limit = await activate('ATAB-KEY-1234567890-XYZ', DEVICE, () =>
      Promise.resolve(Response.json({ error: 'activation_limit' }, { status: 409 })),
    );
    expect(limit).toEqual({ ok: false, error: 'activation_limit' });
    expect(LICENSE_ERROR_KEYS.activation_limit).toBe('license.error.limit');
    const offline = await activate('ATAB-KEY-1234567890-XYZ', DEVICE, () =>
      Promise.reject(new TypeError('Failed to fetch')),
    );
    expect(offline).toEqual({ ok: false, error: 'offline' });
  });

  it('re-validates on the web cadence and keeps the token when offline', async () => {
    const now = Date.now();
    const fresh = await proRecord(['ext.schedules'], now);
    const fetchFn = vi.fn(() => Promise.resolve(Response.json({ revoked: false })));
    expect((await revalidate(fresh, fetchFn, now)).status).toBe('fresh');
    expect(fetchFn).not.toHaveBeenCalled();
    const stale = { ...fresh, lastValidatedAt: now - 2 * 86_400_000 };
    expect(await revalidate(stale, fetchFn, now)).toEqual({ status: 'ok', record: { ...stale, lastValidatedAt: now } });
    expect((await revalidate(stale, () => Promise.reject(new Error('offline')), now)).record).toBe(stale);
    expect(await revalidate(stale, () => Promise.resolve(Response.json({ revoked: true })), now)).toEqual({
      status: 'revoked',
      record: null,
    });
    const deact = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(Response.json({ ok: true })));
    expect(await deactivate(stale, deact)).toBe(true);
    expect(JSON.parse(bodyOf(deact.mock.calls[0]?.[1]))).toEqual({ token: stale.token, deviceId: stale.deviceId });
  });
});

describe('opt-in telemetry (docs/10 §8)', () => {
  it('sends nothing while disabled and only four allow-listed events with allow-listed fields', () => {
    let enabled = false;
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response('{}')));
    const telemetry = createTelemetry({
      enabled: () => enabled,
      locale: () => 'en',
      version: '1.0.0',
      path: '/ext',
      fetchFn,
      ua: 'Chrome/128 Macintosh',
    });
    telemetry.track('session_start', { planType: 'duration' });
    expect(fetchFn).not.toHaveBeenCalled();
    enabled = true;
    telemetry.track('session_start', {
      planType: 'duration',
      presetId: 'p30',
      mode: 'standard',
      host: 'meet.example.com',
    });
    telemetry.track('lock_state', { from: 'idle', to: 'held' });
    telemetry.track('page_view');
    telemetry.track('pro_activated', { plan: 'pro_yearly' });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const rows = fetchFn.mock.calls.map(
      (c) => (JSON.parse(bodyOf(c[1])) as { events: Array<Record<string, unknown>> }).events[0],
    );
    expect(rows[0]).toMatchObject({
      event: 'session_start',
      source: 'ext',
      path: '/ext',
      planType: 'duration',
      presetId: 'p30',
      ua: 'chrome-128/mac',
    });
    expect(rows[0]).not.toHaveProperty('host');
    expect(rows[1]).toMatchObject({ event: 'pro_activated', plan: 'pro_yearly' });
  });
});
