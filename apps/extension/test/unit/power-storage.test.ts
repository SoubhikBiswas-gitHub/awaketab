import { STORAGE_KEYS } from '@awaketab/core';
import { describe, expect, it, vi } from 'vitest';
import type { TPowerLevel } from '../../src/api';
import { createPowerLock } from '../../src/power';
import { createChromeStorageAdapter } from '../../src/storage';
import { createFakeChrome, flush } from './fake-chrome';

describe('chrome.power lock adapter', () => {
  it('walks idle → requesting → held and back to idle, recording each chrome.power call', async () => {
    const calls: string[] = [];
    let level: TPowerLevel = 'display';
    const lock = createPowerLock({
      power: {
        requestKeepAwake: (l) => calls.push(`request:${l}`),
        releaseKeepAwake: () => calls.push('release'),
      },
      level: () => level,
    });
    const seen: string[] = [];
    lock.on('change', (e) => seen.push(`${e.from}>${e.to}:${e.reason}`));
    expect(lock.state).toBe('idle');
    expect(await lock.request()).toBe('held');
    expect(lock.level).toBe('display');
    level = 'system';
    lock.reassert();
    expect(lock.level).toBe('system');
    await lock.release();
    expect(lock.state).toBe('idle');
    expect(lock.level).toBeNull();
    expect(calls).toEqual(['request:display', 'request:system', 'release']);
    expect(seen).toEqual(['idle>requesting:request', 'requesting>held:acquired', 'held>idle:user_release']);
  });

  it('reports unsupported with the shared advice code when chrome.power is absent', async () => {
    const lock = createPowerLock({ power: undefined, level: () => 'display' });
    expect(lock.supported).toBe(false);
    expect(await lock.request()).toBe('unsupported');
    expect(lock.advice).toBe('unsupported_browser');
  });

  it('reports denied (permissions_policy) when the request throws, e.g. enterprise policy', async () => {
    const lock = createPowerLock({
      power: {
        requestKeepAwake: () => {
          throw new Error('blocked');
        },
        releaseKeepAwake: () => undefined,
      },
      level: () => 'display',
    });
    expect(await lock.request()).toBe('denied');
    expect(lock.advice).toBe('permissions_policy');
  });

  it('never re-issues when nothing is held', () => {
    const request = vi.fn();
    const lock = createPowerLock({
      power: { requestKeepAwake: request, releaseKeepAwake: vi.fn() },
      level: () => 'display',
    });
    lock.reassert();
    expect(request).not.toHaveBeenCalled();
  });
});

describe('chrome.storage.local adapter', () => {
  it('loads at.* keys into a synchronous cache and stores objects, not JSON strings', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { theme: 'dark' });
    fake.local.data.set('unrelated', 1);
    const store = createChromeStorageAdapter(fake.local);
    await store.load();
    expect(store.get(STORAGE_KEYS.settings)).toBe('{"theme":"dark"}');
    expect(store.get('unrelated')).toBeNull();
    store.set(STORAGE_KEYS.meta, JSON.stringify({ v: 1, sessionCount: 2 }));
    await store.flush();
    expect(fake.local.data.get(STORAGE_KEYS.meta)).toEqual({ v: 1, sessionCount: 2 });
  });

  it('coalesces per-second session writes that only advance awakeSeconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const fake = createFakeChrome();
    const store = createChromeStorageAdapter(fake.local, { coalesceMs: 10_000 });
    await store.load();
    const base = { v: 1, id: 's', status: 'active', awakeSeconds: 0 };
    store.set(STORAGE_KEYS.session, JSON.stringify(base));
    await flush();
    for (let i = 1; i <= 5; i += 1) store.set(STORAGE_KEYS.session, JSON.stringify({ ...base, awakeSeconds: i }));
    await flush();
    expect(fake.local.sets).toHaveLength(1);
    expect(store.get(STORAGE_KEYS.session)).toContain('"awakeSeconds":5');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fake.local.sets).toHaveLength(2);
    expect(fake.local.data.get(STORAGE_KEYS.session)).toMatchObject({ awakeSeconds: 5 });
    // A status change is written at once.
    store.set(STORAGE_KEYS.session, JSON.stringify({ ...base, awakeSeconds: 6, status: 'completed' }));
    await flush();
    expect(fake.local.sets).toHaveLength(3);
    vi.useRealTimers();
  });

  it('applies writes from other extension pages and reports which keys changed', async () => {
    const fake = createFakeChrome();
    const store = createChromeStorageAdapter(fake.local);
    await store.load();
    const changed = store.apply({ [STORAGE_KEYS.settings]: { newValue: { theme: 'oled' } }, other: { newValue: 1 } });
    expect(changed).toEqual([STORAGE_KEYS.settings]);
    expect(store.raw(STORAGE_KEYS.settings)).toEqual({ theme: 'oled' });
    expect(store.apply({ [STORAGE_KEYS.settings]: { newValue: { theme: 'oled' } } })).toEqual([]);
    expect(store.apply({ [STORAGE_KEYS.settings]: { oldValue: { theme: 'oled' } } })).toEqual([STORAGE_KEYS.settings]);
    expect(store.get(STORAGE_KEYS.settings)).toBeNull();
  });
});
