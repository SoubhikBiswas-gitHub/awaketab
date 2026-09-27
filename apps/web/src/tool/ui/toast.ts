import type { IStore, IToastItem } from '../store.js';

// The boot chunk only keeps the queue; timers, pausing and the DOM live in the lazy toast-view.ts.
export function toast(store: IStore, item: Omit<IToastItem, 'id'> & { id?: string }): void {
  const id = item.id ?? item.text;
  const list = store.get().ui.toasts.filter((x) => x.id !== id);
  // A fourth notice makes room by dropping the oldest one that would time out anyway.
  const old =
    list.length > 2
      ? Math.max(
          0,
          list.findIndex((x) => x.kind !== 'error' && !x.sticky),
        )
      : -1;
  store.set({ ui: { toasts: [...list.filter((_, i) => i !== old), { ...item, id }] } });
}

export function dismiss(store: IStore, id: string): void {
  store.set({ ui: { toasts: store.get().ui.toasts.filter((x) => x.id !== id) } });
}
