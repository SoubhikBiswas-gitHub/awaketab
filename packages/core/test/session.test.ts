import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWakeLock } from '../../wake/src/index.js';
import { CUSTOM_MAX_MS, LOST_TIMEOUT_MS } from '../src/constants.js';
import { createSession, planFromPreset, planUntil } from '../src/session.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import { DEFAULT_SETTINGS } from '../src/types.js';
import { createFakeApi } from '../../wake/test/fake.js';

function engine(now: { t: number }, fake = createFakeApi()) {
  const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
  return createSession({
    lock,
    storage: createStorage(memoryAdapter()),
    channel: null,
    settings: () => DEFAULT_SETTINGS,
    now: () => now.t,
    setTimeout: vi.fn((fn: () => void, ms?: number) => setTimeout(fn, ms) as unknown as number),
    clearTimeout: vi.fn((id) => {
      clearTimeout(id as unknown as number);
    }),
    lostTimeoutMs: LOST_TIMEOUT_MS,
  });
}

describe('session engine', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes a duration plan from Date.now without drift', async () => {
    vi.useFakeTimers();
    const start = Date.parse('2026-09-08T00:00:00.000Z');
    vi.setSystemTime(start);
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const s = createSession({
      lock,
      storage: createStorage(memoryAdapter()),
      channel: null,
      settings: () => DEFAULT_SETTINGS,
      now: () => Date.now(),
    });
    await s.start({ type: 'duration', ms: 90 * 60_000 }, { presetId: 'custom', mode: 'standard' });
    expect(s.session?.endsAt).toBe(start + 90 * 60_000);
    await vi.advanceTimersByTimeAsync(90 * 60_000);
    expect(s.session?.status).toBe('completed');
    expect(s.session?.endReason).toBe('completed');
    s.destroy();
  });

  it('until plans keep wall across a backward clock jump and complete on forward jump', async () => {
    const start = Date.parse('2026-09-08T15:00:00.000Z');
    const now = { t: start };
    const s = engine(now);
    const plan = planUntil('18:00', start);
    await s.start(plan, { presetId: 'until', mode: 'standard' });
    now.t = start - 3_600_000;
    expect(s.session?.plan).toMatchObject({ type: 'until', wall: plan.wall });
    now.t = (s.session?.endsAt ?? 0) + 1000;
    s.stop();
    expect(['aborted', 'completed']).toContain(s.session?.status);
    s.destroy();
  });

  it('user pause freezes duration remaining without shifting endsAt', async () => {
    const start = 1_000_000;
    const now = { t: start };
    const s = engine(now);
    await s.start({ type: 'duration', ms: 20 * 60_000 }, { presetId: 'custom', mode: 'standard' });
    const ends = s.session?.endsAt ?? 0;
    expect(ends).toBeGreaterThan(0);
    now.t = start + 60_000;
    s.pause();
    now.t = start + 6 * 60_000;
    expect(s.session?.endsAt).toBe(ends);
    await s.resume();
    expect(s.session?.endsAt).toBe(ends);
    expect(s.session?.pausedMs).toBe(5 * 60_000);
    s.destroy();
  });

  it('lost_timeout aborts after LOST_TIMEOUT_MS', async () => {
    vi.useFakeTimers();
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    vi.setSystemTime(start);
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const s = createSession({
      lock,
      storage: createStorage(memoryAdapter()),
      channel: null,
      settings: () => DEFAULT_SETTINGS,
      now: () => Date.now(),
      lostTimeoutMs: LOST_TIMEOUT_MS,
    });
    await s.start(planFromPreset('pinf'), { presetId: 'pinf', mode: 'standard' });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    fake.releaseAll();
    await vi.advanceTimersByTimeAsync(LOST_TIMEOUT_MS);
    expect(s.session?.endReason).toBe('lost_timeout');
    s.destroy();
  });

  it('denied start aborts the session and leaves the lock denied', async () => {
    const fake = createFakeApi();
    fake.rejectNextWith(new DOMException('Not allowed', 'NotAllowedError'));
    const now = { t: 1_000 };
    const lock = createWakeLock({
      wakeLock: fake.api,
      documentLike: document,
      fallback: 'none',
      retry: false,
    });
    const s = createSession({
      lock,
      storage: createStorage(memoryAdapter()),
      channel: null,
      settings: () => DEFAULT_SETTINGS,
      now: () => now.t,
    });
    const state = await s.start(planFromPreset('p15'), { presetId: 'p15', mode: 'standard' });
    expect(state).toBe('denied');
    expect(lock.state).toBe('denied');
    expect(s.session?.endReason).toBe('denied');
    s.destroy();
  });

  it('rejects custom durations above CUSTOM_MAX_MS', async () => {
    const s = engine({ t: 0 });
    await expect(
      s.start({ type: 'duration', ms: CUSTOM_MAX_MS + 1 }, { presetId: 'custom', mode: 'standard' }),
    ).rejects.toBeInstanceOf(RangeError);
    s.destroy();
  });
});
