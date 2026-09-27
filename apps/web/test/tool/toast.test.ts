import { describe, expect, it } from 'vitest';
import { createStore } from '../../src/tool/store.js';
import { dismiss, toast } from '../../src/tool/ui/toast.js';

const ids = (store: ReturnType<typeof createStore>) => store.get().ui.toasts.map((x) => x.id);

describe('toast queue (docs/05 §3.7)', () => {
  it('replaces a notice with the same id instead of stacking it', () => {
    const store = createStore();
    toast(store, { kind: 'info', text: 'Switched to 30 min', id: 'switch' });
    toast(store, { kind: 'info', text: 'Switched to 1 h', id: 'switch' });
    expect(store.get().ui.toasts).toEqual([{ kind: 'info', text: 'Switched to 1 h', id: 'switch' }]);
  });

  it('uses the text as the id when none is given, so a repeat does not stack', () => {
    const store = createStore();
    toast(store, { kind: 'success', text: 'Link copied' });
    toast(store, { kind: 'success', text: 'Link copied' });
    expect(ids(store)).toEqual(['Link copied']);
  });

  it('keeps three at most, dropping the oldest one that would time out anyway', () => {
    const store = createStore();
    toast(store, { kind: 'error', text: 'Something went wrong', id: 'end' });
    toast(store, { kind: 'info', text: 'Offline', id: 'offline', sticky: true });
    toast(store, { kind: 'info', text: 'a', id: 'a' });
    toast(store, { kind: 'info', text: 'b', id: 'b' });
    expect(ids(store)).toEqual(['end', 'offline', 'b']);
  });

  it('drops the oldest when every notice is persistent', () => {
    const store = createStore();
    for (const id of ['x', 'y', 'z', 'w']) toast(store, { kind: 'error', text: id, id });
    expect(ids(store)).toEqual(['y', 'z', 'w']);
  });

  it('dismiss removes only the given id', () => {
    const store = createStore();
    toast(store, { kind: 'info', text: 'a', id: 'a' });
    toast(store, { kind: 'warn', text: 'b', id: 'b' });
    dismiss(store, 'a');
    expect(ids(store)).toEqual(['b']);
  });
});
