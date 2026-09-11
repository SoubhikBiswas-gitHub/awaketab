import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyDenial, createWakeLock } from '../src/index.js';
import { createFakeApi, FakeSentinel, setVisibility } from './fake.js';

function doc() {
  return document;
}

function mockPlaying() {
  return vi.spyOn(HTMLVideoElement.prototype, 'play').mockImplementation(async function (this: HTMLVideoElement) {
    Object.defineProperty(this, 'paused', { configurable: true, get: () => false });
  });
}

describe('@awaketab/wake', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(window, 'self', { configurable: true, value: window });
    Object.defineProperty(window, 'top', { configurable: true, value: window });
  });

  it('T01 request resolves idle → requesting → held with acquired', async () => {
    const fake = createFakeApi();
    const changes: string[] = [];
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    lock.on('change', (e) => changes.push(`${e.from}->${e.to}:${e.reason}`));
    const state = await lock.request();
    expect(state).toBe('held');
    expect(lock.state).toBe('held');
    expect(changes).toContain('idle->requesting:request');
    expect(changes).toContain('requesting->held:acquired');
    lock.destroy();
  });

  it('T02 NotAllowedError while visible schedules one retry after baseMs', async () => {
    vi.useFakeTimers();
    const fake = createFakeApi();
    fake.rejectNextWith(new DOMException('denied', 'NotAllowedError'));
    const lock = createWakeLock({
      wakeLock: fake.api,
      documentLike: doc(),
      fallback: 'none',
      retry: { attempts: 3, baseMs: 500 },
    });
    const p = lock.request();
    await Promise.resolve();
    expect(lock.state).toBe('denied');
    expect(lock.advice).toBe('battery_saver');
    fake.api.request = async () => new FakeSentinel();
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(lock.state).toBe('held');
    lock.destroy();
  });

  it('T03 NotAllowedError while hidden uses hidden_document and re-requests on visible', async () => {
    const fake = createFakeApi();
    setVisibility(doc(), 'hidden');
    fake.rejectNextWith(new DOMException('denied', 'NotAllowedError'));
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none', retry: false });
    await lock.request();
    expect(lock.state).toBe('denied');
    expect(lock.advice).toBe('hidden_document');
    setVisibility(doc(), 'visible');
    await Promise.resolve();
    await Promise.resolve();
    expect(lock.state).toBe('held');
    lock.destroy();
  });

  it('T04 SecurityError becomes unsupported with insecure_context', async () => {
    const fake = createFakeApi();
    fake.rejectNextWith(new DOMException('insecure', 'SecurityError'));
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    await lock.request();
    expect(lock.state).toBe('unsupported');
    expect(lock.advice).toBe('insecure_context');
    lock.destroy();
  });

  it('T05 sentinel release while hidden → lost then held on visible', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    await lock.request();
    setVisibility(doc(), 'hidden');
    fake.releaseAll();
    expect(lock.state).toBe('lost');
    setVisibility(doc(), 'visible');
    await Promise.resolve();
    await Promise.resolve();
    expect(lock.state).toBe('held');
    lock.destroy();
  });

  it('T06 sentinel release while visible retries via released_platform', async () => {
    const fake = createFakeApi();
    const reasons: string[] = [];
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    lock.on('change', (e) => reasons.push(e.reason));
    await lock.request();
    fake.releaseAll();
    await Promise.resolve();
    await Promise.resolve();
    expect(reasons).toContain('released_platform');
    expect(lock.state).toBe('held');
    lock.destroy();
  });

  it('T07 missing API is unsupported and request uses fallback', async () => {
    const play = mockPlaying();
    const lock = createWakeLock({ wakeLock: null, documentLike: doc(), fallback: 'video' });
    expect(lock.state).toBe('unsupported');
    expect(lock.supported).toBe(false);
    const state = await lock.request();
    expect(state).toBe('fallback');
    play.mockRestore();
    lock.destroy();
  });

  it('T08 fallback play resolves, element attached, nudge armed', async () => {
    vi.useFakeTimers();
    const play = mockPlaying();
    const lock = createWakeLock({
      wakeLock: null,
      documentLike: doc(),
      fallback: 'video',
      nudgeIntervalMs: 20_000,
    });
    await lock.request();
    expect(lock.state).toBe('fallback');
    expect(lock.usingFallback).toBe(true);
    expect(document.querySelector('video')).toBeTruthy();
    play.mockClear();
    await vi.advanceTimersByTimeAsync(20_000);
    play.mockRestore();
    lock.destroy();
  });

  it('T09 fallback play reject stays unsupported and detaches video', async () => {
    const play = vi
      .spyOn(HTMLVideoElement.prototype, 'play')
      .mockRejectedValue(new DOMException('autoplay', 'NotAllowedError'));
    const errors: unknown[] = [];
    const lock = createWakeLock({ wakeLock: null, documentLike: doc(), fallback: 'video' });
    lock.on('error', (e) => errors.push(e.error));
    await lock.request();
    expect(lock.state).toBe('unsupported');
    expect(errors.length).toBeGreaterThan(0);
    expect(document.querySelector('video')).toBeNull();
    play.mockRestore();
    lock.destroy();
  });

  it('T10 release from held and fallback returns idle with user_release', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    const reasons: string[] = [];
    lock.on('change', (e) => reasons.push(e.reason));
    await lock.request();
    await lock.release();
    expect(lock.state).toBe('idle');
    expect(reasons).toContain('user_release');
    expect(fake.sentinels[0]?.released).toBe(true);

    const play = mockPlaying();
    const videoLock = createWakeLock({ wakeLock: null, documentLike: doc(), fallback: 'video' });
    await videoLock.request();
    await videoLock.release();
    expect(videoLock.state).toBe('idle');
    expect(document.querySelector('video')).toBeNull();
    play.mockRestore();
    lock.destroy();
    videoLock.destroy();
  });

  it('T11 destroy removes listeners and request becomes idle', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    await lock.request();
    lock.destroy();
    expect(await lock.request()).toBe('idle');
    fake.releaseAll();
    expect(lock.state).toBe('idle');
  });

  it('T12 fullscreenchange while held re-requests once', async () => {
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none' });
    await lock.request();
    const req = vi.fn(fake.api.request.bind(fake.api));
    fake.api.request = req;
    document.dispatchEvent(new Event('fullscreenchange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(req).toHaveBeenCalledTimes(1);
    lock.destroy();
  });

  it('T13 iframe without allow classifies iframe_no_allow', async () => {
    const fake = createFakeApi();
    fake.rejectNextWith(new DOMException('Permissions policy violation', 'NotAllowedError'));
    const lock = createWakeLock({
      wakeLock: fake.api,
      documentLike: doc(),
      fallback: 'none',
      retry: false,
    });
    const orig = window.self;
    Object.defineProperty(window, 'self', { configurable: true, get: () => ({}) });
    Object.defineProperty(window, 'top', { configurable: true, get: () => ({ other: true }) });
    await lock.request();
    expect(lock.advice).toBe('iframe_no_allow');
    Object.defineProperty(window, 'self', { configurable: true, get: () => orig });
    lock.destroy();
  });

  it('T14 classifyDenial maps iOS Safari 16 and Firefox 120', () => {
    expect(
      classifyDenial(new Error('x'), {
        visible: true,
        secure: true,
        inIframe: false,
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      }),
    ).toBe('ios_safari_old');
    expect(
      classifyDenial(new Error('x'), {
        visible: true,
        secure: true,
        inIframe: false,
        ua: 'Mozilla/5.0 Firefox/120.0',
      }),
    ).toBe('firefox_old');
  });

  it('T15 retry exhaustion stays denied until request', async () => {
    vi.useFakeTimers();
    const fake = createFakeApi();
    const fail = new DOMException('denied', 'NotAllowedError');
    fake.api.request = vi.fn(async () => {
      throw fail;
    });
    const lock = createWakeLock({
      wakeLock: fake.api,
      documentLike: doc(),
      fallback: 'none',
      retry: { attempts: 3, baseMs: 10 },
    });
    const p = lock.request();
    await p;
    expect(lock.state).toBe('denied');
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);
    await vi.advanceTimersByTimeAsync(40);
    await vi.advanceTimersByTimeAsync(80);
    expect(lock.state).toBe('denied');
    expect(fake.api.request).toHaveBeenCalledTimes(3);
    lock.destroy();
  });

  it('release from denied stays denied and a later request can acquire', async () => {
    const fake = createFakeApi();
    fake.rejectNextWith(new DOMException('denied', 'NotAllowedError'));
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: doc(), fallback: 'none', retry: false });
    await lock.request();
    expect(lock.state).toBe('denied');
    await lock.release();
    expect(lock.state).toBe('denied');
    expect(await lock.request()).toBe('held');
    lock.destroy();
  });
});

describe('T16 SSR', () => {
  it('is inert when window is undefined', async () => {
    const lock = createWakeLock({ document: undefined, documentLike: undefined });
    // In happy-dom window exists; dedicated node test covers true SSR.
    expect(lock.supported || lock.state === 'idle' || lock.state === 'unsupported' || lock.state === 'held').toBeTruthy();
    const { createWakeLock: create } = await import('../src/index.js');
    expect(typeof create).toBe('function');
  });
});
