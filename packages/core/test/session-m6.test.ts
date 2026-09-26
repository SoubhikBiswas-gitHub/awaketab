import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWakeLock } from '../../wake/src/index.js';
import { createFakeApi } from '../../wake/test/fake.js';
import { createSession } from '../src/session.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import type { TTabMessage } from '../src/tabs.js';
import { DEFAULT_SETTINGS, type ISettings } from '../src/types.js';

/** In-process stand-in for BroadcastChannel('awaketab'): delivers to every other endpoint on the bus. */
function bus() {
  const endpoints = new Set<FakeChannel>();
  class FakeChannel extends EventTarget {
    sent: TTabMessage[] = [];
    constructor() {
      super();
      endpoints.add(this);
    }
    postMessage(data: TTabMessage) {
      this.sent.push(data);
      for (const ep of endpoints) if (ep !== this) ep.dispatchEvent(new MessageEvent('message', { data }));
    }
    close() {
      endpoints.delete(this);
    }
  }
  return FakeChannel;
}

function setup(opts: { now?: { t: number }; settings?: ISettings; channel?: BroadcastChannel | null } = {}) {
  const fake = createFakeApi();
  const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
  const storage = createStorage(memoryAdapter());
  const now = opts.now;
  const engine = createSession({
    lock,
    storage,
    channel: opts.channel ?? null,
    settings: () => opts.settings ?? DEFAULT_SETTINGS,
    ...(now ? { now: () => now.t } : {}),
  });
  return { engine, lock, storage, fake };
}

describe('session engine — M6 additions', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('pause({ keepLock }) freezes the clock but keeps the screen awake (cook mode)', async () => {
    const now = { t: 1_000_000 };
    const { engine, lock } = setup({ now });
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'cook' });
    expect(lock.state).toBe('held');
    now.t += 60_000;
    engine.pause({ keepLock: true });
    expect(engine.session?.status).toBe('paused');
    expect(lock.state).toBe('held');
    now.t += 5 * 60_000;
    const state = await engine.resume();
    expect(state).toBe('held');
    expect(engine.session?.pausedMs).toBe(5 * 60_000);
    engine.destroy();
  });

  it('plain pause still releases the lock', async () => {
    const { engine, lock } = setup({ now: { t: 5_000 } });
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    engine.pause();
    await vi.waitFor(() => {
      expect(lock.state).toBe('idle');
    });
    engine.destroy();
  });

  it('addTime extends a duration plan in place', async () => {
    const now = { t: 1_000_000 };
    const { engine } = setup({ now });
    await engine.start({ type: 'duration', ms: 30 * 60_000 }, { presetId: 'p30', mode: 'standard' });
    const id = engine.session?.id;
    engine.addTime(15 * 60_000);
    expect(engine.session?.id).toBe(id);
    expect(engine.session?.endsAt).toBe(1_000_000 + 45 * 60_000);
    expect(engine.session?.plan).toEqual({ type: 'duration', ms: 45 * 60_000 });
    engine.destroy();
  });

  it('addTime turns an until plan into a duration with the same moved deadline', async () => {
    const now = { t: Date.parse('2026-09-26T10:00:00') };
    const { engine } = setup({ now });
    const endsAt = now.t + 60 * 60_000;
    await engine.start({ type: 'until', endsAt, wall: '11:00' }, { presetId: 'until', mode: 'standard' });
    now.t += 10 * 60_000;
    engine.addTime(15 * 60_000);
    const s = engine.session;
    expect(s?.plan.type).toBe('duration');
    // remaining = endsAt - now + pausedMs for duration plans
    expect((s?.endsAt ?? 0) - now.t + (s?.pausedMs ?? 0)).toBe(endsAt + 15 * 60_000 - now.t);
    engine.destroy();
  });

  it('addTime ignores indefinite plans and non-positive or oversized values', async () => {
    const { engine } = setup({ now: { t: 0 } });
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    engine.addTime(15 * 60_000);
    expect(engine.session?.endsAt).toBeNull();
    await engine.start({ type: 'duration', ms: 60_000 }, { presetId: 'custom', mode: 'standard' });
    engine.addTime(-5);
    engine.addTime(8 * 86_400_000);
    expect(engine.session?.endsAt).toBe(60_000);
    engine.destroy();
  });

  it('updateSession persists mode and modeState', async () => {
    const { engine, storage } = setup({ now: { t: 0 } });
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    engine.updateSession({ mode: 'cook', modeState: { cookTimers: [{ id: 'a' }] } });
    expect(storage.session()?.mode).toBe('cook');
    expect(storage.session()?.modeState).toEqual({ cookTimers: [{ id: 'a' }] });
    engine.destroy();
  });

  it('stop after completion releases the extend-prompt grace lock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-09-26T00:00:00Z'));
    const fake = createFakeApi();
    const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
    const engine = createSession({
      lock,
      storage: createStorage(memoryAdapter()),
      channel: null,
      settings: () => DEFAULT_SETTINGS,
    });
    await engine.start({ type: 'duration', ms: 60_000 }, { presetId: 'custom', mode: 'standard' });
    await vi.advanceTimersByTimeAsync(61_000);
    expect(engine.session?.status).toBe('completed');
    await lock.request();
    expect(lock.state).toBe('held');
    engine.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect(lock.state).toBe('idle');
    engine.destroy();
  });

  it('broadcasts state snapshots and obeys intents addressed to it', async () => {
    const Channel = bus();
    const ownerCh = new Channel();
    const mirror = new Channel();
    const heard: TTabMessage[] = [];
    mirror.addEventListener('message', (e) => heard.push((e as MessageEvent<TTabMessage>).data));
    const { engine } = setup({ now: { t: 1_000 }, channel: ownerCh as unknown as BroadcastChannel });
    await engine.start({ type: 'duration', ms: 30 * 60_000 }, { presetId: 'p30', mode: 'standard' });
    const state = heard.filter((m): m is Extract<TTabMessage, { type: 'state' }> => m.type === 'state').at(-1);
    expect(state).toMatchObject({ status: 'active', lock: 'held', planType: 'duration', endsAt: 1_000 + 30 * 60_000 });

    const owner = state?.tabId ?? '';
    mirror.postMessage({ type: 'intent', tabId: 'mirror', ts: 2, target: 'someone-else', action: 'stop' });
    expect(engine.session?.status).toBe('active');
    mirror.postMessage({ type: 'intent', tabId: 'mirror', ts: 3, target: owner, action: 'add', ms: 15 * 60_000 });
    expect(engine.session?.endsAt).toBe(1_000 + 45 * 60_000);
    mirror.postMessage({ type: 'intent', tabId: 'mirror', ts: 4, target: owner, action: 'stop' });
    expect(engine.session?.status).toBe('aborted');
    expect(engine.session?.endReason).toBe('user');
    engine.destroy();
  });

  it('answers a hello with a state snapshot', async () => {
    const Channel = bus();
    const ownerCh = new Channel();
    const { engine } = setup({ now: { t: 1_000 }, channel: ownerCh as unknown as BroadcastChannel });
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    const late = new Channel();
    const heard: TTabMessage[] = [];
    late.addEventListener('message', (e) => heard.push((e as MessageEvent<TTabMessage>).data));
    late.postMessage({ type: 'hello', tabId: 'late', ts: 5 });
    expect(heard.some((m) => m.type === 'state' && m.planType === 'indefinite')).toBe(true);
    engine.destroy();
  });

  it('battery auto-stop: 14% with a 15% threshold ends the session once, warning first', async () => {
    const battery = Object.assign(new EventTarget(), { level: 0.16, charging: false });
    vi.stubGlobal('navigator', { ...navigator, getBattery: () => Promise.resolve(battery) });
    const settings: ISettings = { ...DEFAULT_SETTINGS, battery: { ...DEFAULT_SETTINGS.battery, autoStop: true, threshold: 15 } };
    const { engine } = setup({ now: { t: 0 }, settings });
    const warnings: string[] = [];
    engine.on('warning', (w) => warnings.push(w.code));
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    await vi.waitFor(() => {
      expect(warnings).toEqual(['battery_low']);
    });
    battery.level = 0.14;
    battery.dispatchEvent(new Event('levelchange'));
    await vi.waitFor(() => {
      expect(engine.session?.endReason).toBe('battery');
    });
    // Same charge cycle: a new session is not stopped again (hysteresis), and the warning fires once.
    await engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    battery.dispatchEvent(new Event('levelchange'));
    await new Promise((r) => setTimeout(r, 0));
    expect(engine.session?.status).toBe('active');
    expect(warnings.filter((w) => w === 'battery_low')).toHaveLength(2);
    // Charging re-arms the monitor.
    battery.charging = true;
    battery.dispatchEvent(new Event('chargingchange'));
    await new Promise((r) => setTimeout(r, 0));
    battery.charging = false;
    battery.dispatchEvent(new Event('levelchange'));
    await vi.waitFor(() => {
      expect(engine.session?.endReason).toBe('battery');
    });
    engine.destroy();
  });
});
