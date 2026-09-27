import type { TTabMessage } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '../../src/i18n/en.json';
import {
  MIRROR_STALE_MS,
  mirrorTime,
  mountMirror,
  pickOwner,
  PIP_ADD_MS as MIRROR_ADD_MS,
} from '../../src/tool/pip-mirror.js';
import { PIP_ADD_MS } from '../../src/tool/ambient/pip-window.js';

type TState = Extract<TTabMessage, { type: 'state' }>;

const state = (over: Partial<TState> = {}): TState => ({
  type: 'state',
  tabId: 'owner',
  ts: 0,
  status: 'active',
  lock: 'held',
  startedAt: 0,
  endsAt: null,
  planType: 'indefinite',
  pausedMs: 0,
  pausedAt: null,
  ...over,
});

describe('PIP_ADD_MS duplication', () => {
  it('the popup and the Document-PiP window add the same amount', () => {
    expect(MIRROR_ADD_MS).toBe(PIP_ADD_MS);
    expect(MIRROR_ADD_MS).toBe(15 * 60_000);
  });
});

describe('pickOwner', () => {
  it('returns null with no snapshots', () => {
    expect(pickOwner([])).toBeNull();
  });

  it('prefers a live session over a newer idle snapshot', () => {
    const live = state({ tabId: 'a', ts: 10, status: 'active' });
    const idle = state({ tabId: 'b', ts: 99, status: 'inactive', startedAt: null });
    expect(pickOwner([idle, live])?.tabId).toBe('a');
    expect(pickOwner([live, idle])?.tabId).toBe('a');
  });

  it('picks the newest among live sessions, else the newest snapshot', () => {
    const a = state({ tabId: 'a', ts: 10 });
    const b = state({ tabId: 'b', ts: 20, status: 'paused' });
    expect(pickOwner([a, b])?.tabId).toBe('b');
    const c = state({ tabId: 'c', ts: 5, status: 'completed' });
    const d = state({ tabId: 'd', ts: 7, status: 'inactive' });
    expect(pickOwner([c, d])?.tabId).toBe('d');
  });
});

describe('mirrorTime', () => {
  it('duration plans count down and add paused time back', () => {
    const s = state({ planType: 'duration', startedAt: 0, endsAt: 600_000, pausedMs: 60_000 });
    expect(mirrorTime(s, 300_000)).toBe('06:00');
    const paused = { ...s, status: 'paused' as const, pausedAt: 300_000 };
    // Another 30 s of the current pause is added back as well.
    expect(mirrorTime(paused, 330_000)).toBe('06:00');
  });

  it('until plans count to the wall target and ignore pauses', () => {
    const s = state({ planType: 'until', startedAt: 0, endsAt: 3_600_000, pausedMs: 60_000 });
    expect(mirrorTime(s, 600_000)).toBe('50:00');
  });

  it('indefinite plans count up without paused time', () => {
    const s = state({ planType: 'indefinite', startedAt: 0, endsAt: null, pausedMs: 30_000 });
    expect(mirrorTime(s, 90_000)).toBe('01:00');
    expect(mirrorTime(s, 30_000 + 86_400_000 + 61_000)).toBe('1d 00:01:01');
  });

  it('clamps at zero and shows the idle placeholder when not live', () => {
    expect(mirrorTime(state({ planType: 'duration', endsAt: 1_000 }), 5_000)).toBe('00:00');
    const idle = state({ status: 'inactive', startedAt: null });
    expect(mirrorTime(idle, 0)).toBe(mirrorTime(idle, 99));
  });
});

const PIP_HTML = `
  <div id="awaketab-pip">
    <button data-pill data-lock="idle"><output data-pill-text></output></button>
    <p data-timer-digits></p>
    <button type="button" data-pip-add hidden>+15</button>
    <button type="button" data-pip-stop hidden>Stop</button>
    <p data-pip-empty>No AwakeTab session</p>
    <script type="application/json" data-i18n-catalog>${JSON.stringify(en)}</script>
  </div>`;

class FakeChannel extends EventTarget {
  postMessage = vi.fn();
  close = vi.fn();
  send(data: TTabMessage) {
    this.dispatchEvent(new MessageEvent('message', { data }));
  }
}

describe('mountMirror', () => {
  let ch: FakeChannel;
  let root: HTMLElement;
  let unmount: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    document.body.innerHTML = PIP_HTML;
    root = document.querySelector('#awaketab-pip') as HTMLElement;
    ch = new FakeChannel();
    unmount = mountMirror(root, ch as unknown as BroadcastChannel);
  });

  afterEach(() => {
    unmount();
    vi.useRealTimers();
  });

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel) as T;
  const lastPost = () => ch.postMessage.mock.calls.at(-1)?.[0] as TTabMessage;

  it('says hello and starts idle', () => {
    expect(ch.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'hello' }));
    expect(q('[data-pill-text]').textContent).toBe('Ready');
    expect(q('[data-pill]').dataset.lock).toBe('idle');
    expect(q('[data-pip-empty]').hidden).toBe(false);
    expect(q('[data-pip-stop]').hidden).toBe(true);
  });

  it("mirrors the owner's lock state and timer", () => {
    ch.send(state({ ts: Date.now(), planType: 'duration', startedAt: Date.now(), endsAt: Date.now() + 1_800_000 }));
    expect(q('[data-pill-text]').textContent).toBe('Screen awake');
    expect(q('[data-pill]').dataset.lock).toBe('held');
    expect(q('[data-timer-digits]').textContent).toBe('30:00');
    expect(q('[data-timer-digits]').classList.contains('is-muted')).toBe(false);
    expect(q('[data-pip-empty]').hidden).toBe(true);
    expect(q('[data-pip-stop]').hidden).toBe(false);
    expect(q('[data-pip-add]').hidden).toBe(false);
  });

  it('Stop posts a stop intent to the owning tab', () => {
    ch.send(state({ tabId: 'tab-1', ts: Date.now(), startedAt: Date.now() }));
    q<HTMLButtonElement>('[data-pip-stop]').click();
    expect(lastPost()).toMatchObject({ type: 'intent', action: 'stop', target: 'tab-1' });
    expect(lastPost()).not.toHaveProperty('ms');
  });

  it('+15 posts an add intent of 15 minutes', () => {
    ch.send(
      state({
        tabId: 'tab-2',
        ts: Date.now(),
        planType: 'duration',
        startedAt: Date.now(),
        endsAt: Date.now() + 60_000,
      }),
    );
    q<HTMLButtonElement>('[data-pip-add]').click();
    expect(lastPost()).toMatchObject({ type: 'intent', action: 'add', target: 'tab-2', ms: 900_000 });
  });

  it('hides +15 for an indefinite session', () => {
    ch.send(state({ ts: Date.now(), planType: 'indefinite', startedAt: Date.now(), endsAt: null }));
    expect(q('[data-pip-add]').hidden).toBe(true);
    expect(q('[data-pip-stop]').hidden).toBe(false);
  });

  it('never claims awake when the owner lost the lock', () => {
    ch.send(state({ ts: Date.now(), startedAt: Date.now(), lock: 'held' }));
    ch.send({ type: 'lock', tabId: 'owner', ts: Date.now(), state: 'lost' });
    expect(q('[data-pill-text]').textContent).toBe('Paused — tab hidden');
    expect(q('[data-timer-digits]').classList.contains('is-muted')).toBe(true);
  });

  it(`falls back to Ready when no state arrives for ${String(MIRROR_STALE_MS)} ms`, async () => {
    ch.send(state({ ts: Date.now(), startedAt: Date.now() }));
    expect(q('[data-pill-text]').textContent).toBe('Screen awake');
    await vi.advanceTimersByTimeAsync(MIRROR_STALE_MS - 1_000);
    expect(q('[data-pill-text]').textContent).toBe('Screen awake');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(q('[data-pill-text]').textContent).toBe('Ready');
    expect(q('[data-pill]').dataset.lock).toBe('idle');
    expect(q('[data-pip-stop]').hidden).toBe(true);
    expect(q('[data-pip-empty]').hidden).toBe(false);
  });

  it('forgets a tab that says bye and ignores its own messages', () => {
    ch.send(state({ ts: Date.now(), startedAt: Date.now() }));
    ch.send({ type: 'bye', tabId: 'owner', ts: Date.now() });
    expect(q('[data-pip-stop]').hidden).toBe(true);
    const own = (ch.postMessage.mock.calls[0]?.[0] as TTabMessage).tabId;
    ch.send(state({ tabId: own, ts: Date.now(), startedAt: Date.now() }));
    expect(q('[data-pill-text]').textContent).toBe('Ready');
  });

  it('says bye on unmount', () => {
    unmount();
    expect(lastPost()).toMatchObject({ type: 'bye' });
    unmount = () => undefined;
  });
});
