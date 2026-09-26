import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTabProtocol } from '../src/tabs.js';

describe('tab protocol channel option', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens no BroadcastChannel when channel is null (extension worker, docs/04 §16)', () => {
    const ctor = vi.fn();
    vi.stubGlobal('BroadcastChannel', ctor);
    const tabs = createTabProtocol({ tabId: 'a', channel: null });
    tabs.post({ type: 'hello', tabId: 'a', ts: 1 });
    tabs.dispose();
    expect(ctor).not.toHaveBeenCalled();
    expect(tabs.peerCount()).toBe(0);
  });

  it('opens the shared awaketab channel only when channel is omitted', () => {
    const posted: unknown[] = [];
    const names: string[] = [];
    class FakeChannel {
      constructor(name: string) {
        names.push(name);
      }
      postMessage(msg: unknown) {
        posted.push(msg);
      }
      addEventListener() {}
      removeEventListener() {}
      close() {}
    }
    vi.stubGlobal('BroadcastChannel', FakeChannel);
    const tabs = createTabProtocol({ tabId: 'b' });
    tabs.dispose();
    expect(names).toEqual(['awaketab']);
    expect(posted.map((m) => (m as { type: string }).type)).toEqual(['hello', 'bye']);
  });
});
