import { t } from '../i18n.js';
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
  store.set({ ui: { toasts: store.get().ui.toasts.filter((x) => x.id !== id) } });
}

export function mountToasts(root: HTMLElement, store: IStore): () => void {
  return store.subscribe((s) => {
    root.replaceChildren();
    for (const item of s.ui.toasts) {
      const el = document.createElement('div');
      el.className = `at-toast at-toast--${item.kind}`;
      el.setAttribute('role', item.kind === 'error' ? 'alert' : 'status');
      const text = document.createElement('p');
      text.textContent = item.text;
      el.append(text);
      if (item.action) {
        const act = document.createElement('button');
        act.type = 'button';
        act.className = 'at-btn';
        act.textContent = item.action.label;
        act.addEventListener('click', item.action.onClick);
        el.append(act);
      }
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'at-icon-btn';
      close.setAttribute('aria-label', t('tool.toast.dismiss'));
      close.textContent = '×';
      close.addEventListener('click', () => {
        dismiss(store, item.id);
      });
      el.append(close);
      root.append(el);
    }
  });
}
