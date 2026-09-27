import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  analyticsLimits,
  bindClientErrors,
  flush,
  queuedEvents,
  resetAnalyticsForTests,
  sampleClientError,
  tabSid,
  track,
  uaClass,
  viewportClass,
} from '../../src/lib/analytics';

const opts = { telemetry: true, source: 'web', locale: 'en', path: '/' };

function stubBeacon() {
  const beacon = vi.fn(() => true);
  vi.stubGlobal('navigator', { sendBeacon: beacon, userAgent: 'Mozilla/5.0 Chrome/128.0.0.0' });
  return beacon;
}

describe('analytics client', () => {
  afterEach(() => {
    resetAnalyticsForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not enqueue when telemetry is off', () => {
    const beacon = stubBeacon();
    track('page_view', {}, { ...opts, telemetry: false });
    expect(beacon).not.toHaveBeenCalled();
    expect(tabSid()).toMatch(/-/u);
    expect(queuedEvents()).toHaveLength(0);
  });

  it('classifies ua and viewport', () => {
    expect(uaClass('Mozilla/5.0 (Macintosh) Chrome/128.0.0.0 Safari/537.36')).toBe('chrome-128/mac');
    expect(viewportClass(375)).toBe('sm');
    expect(viewportClass(800)).toBe('md');
    expect(viewportClass(1280)).toBe('lg');
  });

  it('flushes at 20 events via sendBeacon', () => {
    const beacon = stubBeacon();
    for (let i = 0; i < 20; i += 1) track('page_view', { i }, opts);
    expect(beacon).toHaveBeenCalledTimes(1);
    const body = beacon.mock.calls[0]?.[1] as Blob | undefined;
    expect(queuedEvents()).toHaveLength(0);
    expect(analyticsLimits.MAX_BATCH).toBe(20);
    expect(body).toBeInstanceOf(Blob);
  });

  it('flushes when the encoded batch reaches 8 KB', () => {
    const beacon = stubBeacon();
    track('lock_state', { from: 'idle', to: 'held', pad: 'x'.repeat(8_200) }, opts);
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(analyticsLimits.MAX_BYTES).toBe(8 * 1024);
  });

  it('a failed timer flush (offline, blocked) resolves instead of raising an unhandled rejection', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/128.0.0.0' });
    const fetchMock = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    vi.stubGlobal('fetch', fetchMock);
    track('page_view', {}, opts);
    await expect(flush(false)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(queuedEvents()).toHaveLength(0);
  });

  it('samples client_error deterministically at 10%', () => {
    expect(sampleClientError('')).toBe(true);
    expect(sampleClientError('a')).toBe(false);
    const hits = Array.from({ length: 100 }, (_, i) => sampleClientError(String(i))).filter(Boolean).length;
    expect(hits).toBeGreaterThan(5);
    expect(hits).toBeLessThan(20);
  });

  it('drops client_error when the sid is not in the sample', () => {
    stubBeacon();
    vi.stubGlobal('crypto', { randomUUID: () => 'a' });
    expect(sampleClientError(tabSid())).toBe(false);
    track('client_error', { code: 'state_mismatch' }, opts);
    expect(queuedEvents()).toHaveLength(0);
  });

  it('records client_error from window error when sampled', () => {
    stubBeacon();
    vi.stubGlobal('crypto', { randomUUID: () => '' });
    bindClientErrors(opts);
    dispatchEvent(new Event('error'));
    expect(queuedEvents().some((row) => row.event === 'client_error')).toBe(true);
  });
});
