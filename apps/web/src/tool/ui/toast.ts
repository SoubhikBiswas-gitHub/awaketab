import type { IStore, IToastItem } from '../store.js';

let seq = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function toast(store: IStore, item: Omit<IToastItem, 'id'> & { id?: string }): void {
  const id = item.id ?? `t${String((seq += 1))}`;
  const next: IToastItem = { ...item, id };
  const list = store
    .get()
    .ui.toasts.filter((x) => x.id !== id)
    .concat(next)
    .slice(-3);
  store.set({ ui: { toasts: list } });
  const prev = timers.get(id);
  if (prev) clearTimeout(prev);
  if (item.kind !== 'error' && !item.sticky) {
    timers.set(
      id,
      setTimeout(() => {
        dismiss(store, id);
      }, 6000),
    );
  }
}

export function dismiss(store: IStore, id: string): void {
  const prev = timers.get(id);
  if (prev) clearTimeout(prev);
  timers.delete(id);
  store.set({
    ui: { toasts: store.get().ui.toasts.filter((x) => x.id !== id) },
  });
}
