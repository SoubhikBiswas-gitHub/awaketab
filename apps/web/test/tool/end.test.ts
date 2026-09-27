import type { ISession } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setVisibility } from '../../../../packages/wake/test/fake.js';
import {
  COUNTED_SESSION_S,
  extendAsk,
  finishAsk,
  flashTitle,
  onEnded,
  RATING_DELAY_MS,
  TITLE_FLASH_MIN_MS,
  TITLE_FLASH_MS,
} from '../../src/tool/end.js';
import { EXTEND_AUTO_STOP_MS } from '../../src/tool/params.js';
import { makeCtx } from './ctx-helper.js';

// The rating prompt waits for tool-more.css; happy-dom never loads the stylesheet.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));

function session(over: Partial<ISession> = {}): ISession {
  return {
    v: 1,
    id: 's1',
    plan: { type: 'duration', ms: 15 * 60_000 },
    presetId: 'p15',
    mode: 'standard',
    startedAt: 0,
    endsAt: 15 * 60_000,
    status: 'completed',
    pausedAt: null,
    pausedMs: 0,
    endedAt: 15 * 60_000,
    endReason: 'completed',
    awakeSeconds: 15 * 60,
    modeState: {},
    source: 'web',
    ...over,
  };
}

function fakeAudio() {
  const osc = () => ({
    type: '',
    frequency: { value: 0 },
    connect: vi.fn((n: unknown) => n),
    start: vi.fn(),
    stop: vi.fn(),
  });
  const gain = () => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn((n: unknown) => n),
  });
  return {
    currentTime: 1,
    destination: {},
    createOscillator: vi.fn(osc),
    createGain: vi.fn(gain),
  };
}

const notificationSpy = vi.fn();
function stubNotification(permission: NotificationPermission) {
  class FakeNotification {
    static permission = permission;
    readonly title: string;
    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      notificationSpy(title, options);
    }
  }
  vi.stubGlobal('Notification', FakeNotification);
}

function withServiceWorker(reg: unknown) {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: vi.fn(async () => reg) },
  });
}

const RATING_HTML = `
  <dialog data-dialog="rating">
    <form data-rating-form>
      <input type="radio" name="stars" value="1" /><input type="radio" name="stars" value="5" />
      <textarea name="text"></textarea>
      <p data-rating-error></p>
      <button type="submit">Send</button>
      <button type="button" data-rating-later>Later</button>
      <button type="button" data-rating-never>Never</button>
    </form>
  </dialog>`;

const settle = async () => {
  await vi.dynamicImportSettled();
  await vi.advanceTimersByTimeAsync(0);
};

beforeEach(() => {
  vi.useFakeTimers();
  notificationSpy.mockReset();
  document.title = 'AwakeTab — Keep your screen awake';
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'serviceWorker');
  Reflect.deleteProperty(document, 'visibilityState');
  Reflect.deleteProperty(document, 'hidden');
});

describe('onEnded: skipped reasons', () => {
  it.each(['user', 'denied'] as const)('%s runs none of the end steps', async (reason) => {
    stubNotification('granted');
    const audio = fakeAudio();
    const { ctx, store, storage } = makeCtx({
      settings: { notifications: true },
    });
    ctx.audio = () => audio as unknown as AudioContext;
    onEnded(ctx, reason, session({ endReason: reason }));
    await settle();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(audio.createOscillator).not.toHaveBeenCalled();
    expect(notificationSpy).not.toHaveBeenCalled();
    expect(document.title).toBe('AwakeTab — Keep your screen awake');
    expect(storage.meta().sessionCount).toBe(0);
    expect(document.querySelector('dialog[open]')).toBeNull();
    expect(store.get().ui.toasts).toHaveLength(0);
  });
});

describe('onEnded: completed', () => {
  it('shows a page notification when enabled, granted and no SW registration exists', async () => {
    stubNotification('granted');
    const { ctx, store } = makeCtx({
      settings: { notifications: true, endBehaviour: 'stop' },
    });
    onEnded(ctx, 'completed', session());
    await settle();
    expect(notificationSpy).toHaveBeenCalledTimes(1);
    const [title, options] = notificationSpy.mock.calls[0] as [string, NotificationOptions];
    expect(title).toBe('AwakeTab');
    expect(options.body).toMatch(/session is done$/u);
    expect(options.tag).toBe('at-end');
    expect(store.get().ui.toasts.map((x) => x.text)).toContain('Session complete');
  });

  it('prefers the service-worker registration when there is one', async () => {
    stubNotification('granted');
    const reg = { showNotification: vi.fn(async () => undefined) };
    withServiceWorker(reg);
    const { ctx } = makeCtx({
      settings: { notifications: true, endBehaviour: 'stop' },
    });
    onEnded(ctx, 'completed', session());
    await settle();
    expect(reg.showNotification).toHaveBeenCalledWith('AwakeTab', expect.objectContaining({ tag: 'at-end' }));
    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it('never notifies when the setting is off or permission is not granted', async () => {
    stubNotification('granted');
    const off = makeCtx({
      settings: { notifications: false, endBehaviour: 'stop' },
    });
    onEnded(off.ctx, 'completed', session());
    await settle();
    expect(notificationSpy).not.toHaveBeenCalled();

    stubNotification('default');
    const pending = makeCtx({
      settings: { notifications: true, endBehaviour: 'stop' },
    });
    onEnded(pending.ctx, 'completed', session());
    await settle();
    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it('plays the end chime through the primed AudioContext', () => {
    const audio = fakeAudio();
    const { ctx } = makeCtx({ settings: { endBehaviour: 'stop' } });
    ctx.audio = () => audio as unknown as AudioContext;
    onEnded(ctx, 'completed', session());
    expect(audio.createOscillator).toHaveBeenCalledTimes(2);
    expect(audio.createGain).toHaveBeenCalledTimes(2);
    const osc = audio.createOscillator.mock.results[0]?.value as {
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    };
    expect(osc.start).toHaveBeenCalledWith(1);
    expect(osc.stop).toHaveBeenCalled();
  });

  it("stays silent when sound is 'none'", () => {
    const audio = fakeAudio();
    const { ctx } = makeCtx({
      settings: { endBehaviour: 'stop', sound: { id: 'none', volume: 0.6 } },
    });
    ctx.audio = () => audio as unknown as AudioContext;
    onEnded(ctx, 'completed', session());
    expect(audio.createOscillator).not.toHaveBeenCalled();
  });

  it('counts only completed sessions of at least 5 minutes', () => {
    const { ctx, storage } = makeCtx({ settings: { endBehaviour: 'stop' } });
    onEnded(ctx, 'completed', session({ awakeSeconds: COUNTED_SESSION_S - 2 }));
    expect(storage.meta().sessionCount).toBe(0);
    // One tick short (session started on a whole second) still counts.
    onEnded(ctx, 'completed', session({ awakeSeconds: COUNTED_SESSION_S - 1 }));
    expect(storage.meta().sessionCount).toBe(1);
    onEnded(ctx, 'completed', session({ awakeSeconds: COUNTED_SESSION_S }));
    expect(storage.meta().sessionCount).toBe(2);
    onEnded(ctx, 'battery', session({ awakeSeconds: 3_600, endReason: 'battery' }));
    onEnded(ctx, 'lost_timeout', session({ awakeSeconds: 3_600, endReason: 'lost_timeout' }));
    expect(storage.meta().sessionCount).toBe(2);
  });
});

describe('flashTitle', () => {
  it('alternates the title at 1 Hz and restores it once seen after the 3 s minimum', async () => {
    setVisibility(document, 'hidden');
    const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    const original = document.title;
    flashTitle('Done — AwakeTab');
    expect(document.title).toBe('Done — AwakeTab');
    await vi.advanceTimersByTimeAsync(TITLE_FLASH_MS);
    expect(document.title).toBe(original);
    await vi.advanceTimersByTimeAsync(TITLE_FLASH_MS);
    expect(document.title).toBe('Done — AwakeTab');

    // Seen before the minimum: keeps flashing until 3 s have passed.
    setVisibility(document, 'visible');
    focus.mockReturnValue(true);
    expect(TITLE_FLASH_MIN_MS).toBe(3 * TITLE_FLASH_MS);
    await vi.advanceTimersByTimeAsync(TITLE_FLASH_MS - 1);
    expect(document.title).toBe('Done — AwakeTab');
    await vi.advanceTimersByTimeAsync(1);
    expect(document.title).toBe(original);

    // Stopped for good: no further flips.
    await vi.advanceTimersByTimeAsync(10 * TITLE_FLASH_MS);
    expect(document.title).toBe(original);
  });

  it('keeps flashing while the tab is hidden', async () => {
    setVisibility(document, 'hidden');
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    const stop = flashTitle('Done');
    const seen = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      await vi.advanceTimersByTimeAsync(TITLE_FLASH_MS);
      seen.add(document.title);
    }
    expect(seen).toEqual(new Set(['Done', 'AwakeTab — Keep your screen awake']));
    stop();
    expect(document.title).toBe('AwakeTab — Keep your screen awake');
  });

  it('a new flash stops the previous one and keeps the real title', async () => {
    setVisibility(document, 'hidden');
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    flashTitle('One');
    const stop = flashTitle('Two');
    expect(document.title).toBe('Two');
    stop();
    expect(document.title).toBe('AwakeTab — Keep your screen awake');
  });
});

describe("onEnded: time's up (docs/05 §3.9, canvas status timesup)", () => {
  it('asks inline and holds the lock during the 60 s grace', async () => {
    const { ctx, store, lock } = makeCtx();
    onEnded(ctx, 'completed', session());
    await settle();
    const ask = store.get().ui.ask;
    expect(ask).not.toBeNull();
    expect((ask?.until ?? 0) - Date.now()).toBe(EXTEND_AUTO_STOP_MS);
    expect(EXTEND_AUTO_STOP_MS).toBe(60_000);
    expect(lock.state).toBe('held');
    expect(store.get().ui.toasts).toHaveLength(0);
    expect(store.get().ui.done).toBeNull();
  });

  it('Stop releases the lock and shows the Done receipt', async () => {
    const { ctx, store, lock, engine } = makeCtx();
    onEnded(ctx, 'completed', session());
    await settle();
    expect(lock.state).toBe('held');
    finishAsk(ctx);
    await settle();
    expect(store.get().ui.ask).toBeNull();
    expect(lock.state).toBe('idle');
    expect(store.get().lock).toBe('idle');
    expect(engine.session?.status ?? 'inactive').not.toBe('active');
    expect(store.get().ui.done).toMatchObject({
      reason: 'completed',
      total: 15 * 60_000,
    });
  });

  it('stops by itself when the grace runs out', async () => {
    const { ctx, store, lock } = makeCtx();
    onEnded(ctx, 'completed', session());
    await settle();
    await vi.advanceTimersByTimeAsync(EXTEND_AUTO_STOP_MS);
    await settle();
    expect(store.get().ui.ask).toBeNull();
    expect(lock.state).toBe('idle');
  });

  it('+15 extends into a new session on the held lock', async () => {
    const { ctx, store, engine, lock } = makeCtx();
    onEnded(ctx, 'completed', session());
    await settle();
    extendAsk(ctx, 15 * 60_000);
    await settle();
    expect(store.get().ui.ask).toBeNull();
    expect(engine.session).toMatchObject({
      status: 'active',
      plan: { type: 'duration', ms: 15 * 60_000 },
    });
    expect(lock.state).toBe('held');
    expect(ctx.track).toHaveBeenCalledWith('session_extend', { addedMin: 15 });
    // A later grace timer must not stop the new session.
    await vi.advanceTimersByTimeAsync(EXTEND_AUTO_STOP_MS);
    expect(engine.session?.status).toBe('active');
  });

  it("the rating prompt can follow once time's up is stopped", async () => {
    const { ctx, root, storage } = makeCtx({ html: RATING_HTML });
    storage.writeMeta({ ...storage.meta(), sessionCount: 4 });
    onEnded(ctx, 'completed', session());
    expect(storage.meta().sessionCount).toBe(5);
    await settle();
    finishAsk(ctx);
    await settle();
    await vi.advanceTimersByTimeAsync(RATING_DELAY_MS);
    await settle();
    expect(root.querySelector<HTMLDialogElement>('[data-dialog="rating"]')?.open).toBe(true);
  });

  it('cook mode and the stop behaviour skip the question, toast and show the receipt instead', async () => {
    const cook = makeCtx();
    cook.store.set({ ui: { mode: 'cook' } });
    onEnded(cook.ctx, 'completed', session());
    await settle();
    expect(cook.store.get().ui.ask).toBeNull();
    expect(cook.store.get().ui.toasts.map((x) => x.text)).toContain('Session complete');

    const stop = makeCtx({ settings: { endBehaviour: 'stop' } });
    onEnded(stop.ctx, 'completed', session());
    await settle();
    expect(stop.store.get().ui.ask).toBeNull();
    expect(stop.store.get().ui.done?.reason).toBe('completed');
    expect(stop.lock.state).toBe('idle');
  });

  it('a battery stop keeps its figures for the low-battery card', () => {
    const { ctx, store } = makeCtx();
    onEnded(ctx, 'battery', session({ endReason: 'battery' }));
    expect(store.get().ui.done?.reason).toBe('battery');
  });
});
