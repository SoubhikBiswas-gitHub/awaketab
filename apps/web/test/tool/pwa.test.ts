import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionBusy, watchUpdates } from '../../src/tool/pwa.js';
import { createStore } from '../../src/tool/store.js';

class FakeRegistration extends EventTarget {
  waiting: { postMessage: ReturnType<typeof vi.fn> } | null = { postMessage: vi.fn() };
  installing: EventTarget | null = null;
  active: object | null = {};
}

function setup(initialStatus: string | undefined) {
  let status = initialStatus;
  const reg = new FakeRegistration();
  const sw = new EventTarget();
  const reload = vi.fn();
  const store = createStore();
  const setStatus = (next: string | undefined) => {
    status = next;
    store.set({}); // the island syncs session changes into the store
  };
  const off = watchUpdates(
    reg as unknown as ServiceWorkerRegistration,
    store,
    () => status,
    sw as unknown as ServiceWorkerContainer,
    reload,
  );
  const swToasts = () => store.get().ui.toasts.filter((x) => x.id === 'sw');
  return { reg, sw, reload, store, setStatus, off, swToasts };
}

describe('sessionBusy', () => {
  it.each([
    ['active', true],
    ['paused', true],
    ['inactive', false],
    ['completed', false],
    ['aborted', false],
    [undefined, false],
  ])('%s → %s', (status, busy) => {
    expect(sessionBusy(status)).toBe(busy);
  });
});

describe('watchUpdates (FR-PWA-01)', () => {
  let cleanup: (() => void) | undefined;
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it('offers a waiting worker at once when no session is running', () => {
    const env = setup(undefined);
    cleanup = env.off;
    expect(env.swToasts()).toHaveLength(1);
    expect(env.swToasts()[0]).toMatchObject({
      kind: 'info',
      sticky: true,
      text: 'A new version of AwakeTab is ready.',
    });
    expect(env.swToasts()[0]?.action?.label).toBe('Reload');
  });

  it('never reloads an active session: says so once, then offers Reload when it ends', () => {
    const env = setup('active');
    cleanup = env.off;
    expect(env.swToasts()).toHaveLength(1);
    expect(env.swToasts()[0]).toMatchObject({
      kind: 'info',
      sticky: false,
      text: "A new version of AwakeTab is ready. Reload when you're done.",
    });
    expect(env.swToasts()[0]?.action).toBeUndefined();
    env.store.set({ ui: { toasts: [] } });
    env.setStatus('paused');
    expect(env.swToasts()).toHaveLength(0);
    env.setStatus('inactive');
    expect(env.swToasts()).toHaveLength(1);
    expect(env.swToasts()[0]?.action?.label).toBe('Reload');
    // Offered once: later store changes do not push it again.
    env.store.set({ ui: { toasts: [] } });
    env.setStatus('completed');
    expect(env.swToasts()).toHaveLength(0);
  });

  it('Reload posts SKIP_WAITING and reloads only after controllerchange, once', () => {
    const env = setup('inactive');
    cleanup = env.off;
    const waiting = env.reg.waiting;
    env.swToasts()[0]?.action?.onClick();
    expect(waiting?.postMessage).toHaveBeenCalledWith('SKIP_WAITING');
    expect(env.reload).not.toHaveBeenCalled();
    env.sw.dispatchEvent(new Event('controllerchange'));
    expect(env.reload).toHaveBeenCalledTimes(1);
    env.sw.dispatchEvent(new Event('controllerchange'));
    expect(env.reload).toHaveBeenCalledTimes(1);
  });

  it('never reloads on a controllerchange nobody asked for', () => {
    const env = setup('inactive');
    cleanup = env.off;
    env.sw.dispatchEvent(new Event('controllerchange'));
    expect(env.reload).not.toHaveBeenCalled();
  });

  it('offers a worker that finishes installing later', () => {
    const reg = new FakeRegistration();
    reg.waiting = null;
    const store = createStore();
    const off = watchUpdates(
      reg as unknown as ServiceWorkerRegistration,
      store,
      () => 'inactive',
      new EventTarget() as unknown as ServiceWorkerContainer,
      vi.fn(),
    );
    expect(store.get().ui.toasts).toHaveLength(0);
    const installing = new EventTarget();
    reg.installing = installing;
    reg.dispatchEvent(new Event('updatefound'));
    installing.dispatchEvent(new Event('statechange'));
    expect(store.get().ui.toasts).toHaveLength(0);
    reg.waiting = { postMessage: vi.fn() };
    installing.dispatchEvent(new Event('statechange'));
    expect(store.get().ui.toasts.map((x) => x.id)).toEqual(['sw']);
    cleanup = off;
  });

  it('stays quiet on a first install, when no worker was active before', () => {
    const reg = new FakeRegistration();
    reg.waiting = null;
    reg.active = null;
    const store = createStore();
    const off = watchUpdates(
      reg as unknown as ServiceWorkerRegistration,
      store,
      () => 'inactive',
      new EventTarget() as unknown as ServiceWorkerContainer,
      vi.fn(),
    );
    const installing = new EventTarget();
    reg.installing = installing;
    reg.dispatchEvent(new Event('updatefound'));
    reg.waiting = { postMessage: vi.fn() };
    installing.dispatchEvent(new Event('statechange'));
    expect(store.get().ui.toasts).toHaveLength(0);
    reg.waiting = null;
    reg.active = {};
    installing.dispatchEvent(new Event('statechange'));
    store.set({});
    expect(store.get().ui.toasts).toHaveLength(0);
    cleanup = off;
  });

  it('offers a new worker that replaces an active one', () => {
    const reg = new FakeRegistration();
    reg.waiting = null;
    const store = createStore();
    const off = watchUpdates(
      reg as unknown as ServiceWorkerRegistration,
      store,
      () => 'inactive',
      new EventTarget() as unknown as ServiceWorkerContainer,
      vi.fn(),
    );
    const installing = new EventTarget();
    reg.installing = installing;
    reg.dispatchEvent(new Event('updatefound'));
    reg.waiting = { postMessage: vi.fn() };
    installing.dispatchEvent(new Event('statechange'));
    expect(store.get().ui.toasts.map((x) => x.id)).toEqual(['sw']);
    cleanup = off;
  });
});
