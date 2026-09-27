import { t } from '../i18n.js';
import type { IStore, IToastItem } from '../store.js';
import { dismiss } from './toast.js';

// Toast icons (canvas TOAST_ICON): a check for success, an info ring, a triangle for warnings and errors.
const ICON: Record<IToastItem['kind'], string> = {
  success: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM8 12.2l2.8 2.8L16 9.6',
  info: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM12 11v5M12 7.8v.1',
  warn: 'M12 3.5L21.5 20h-19zM12 10v4.5M12 17.2v.3',
  error: 'M12 3.5L21.5 20h-19zM12 10v4.5M12 17.2v.3',
};
const svg = (d: string, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

export function mountToasts(root: HTMLElement, store: IStore): () => void {
  return store.subscribe((s) => {
    root.replaceChildren(
      ...s.ui.toasts.map((item) => {
        const el = document.createElement('div');
        el.className = `at-toast at-toast-${item.kind}`;
        el.setAttribute('role', item.kind === 'error' ? 'alert' : 'status');
        el.innerHTML = `${svg(ICON[item.kind], 'at-toast-i')}<p></p>`;
        (el.querySelector('p') as HTMLElement).textContent = item.text;
        if (item.action) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'at-toast-act';
          b.textContent = item.action.label;
          b.addEventListener('click', item.action.onClick);
          el.append(b);
        }
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'at-icon-button at-toast-x';
        x.setAttribute('aria-label', t('tool.toast.dismiss'));
        x.innerHTML = svg('M6 6l12 12M18 6L6 18');
        x.addEventListener('click', () => {
          dismiss(store, item.id);
        });
        el.append(x);
        return el;
      }),
    );
  });
}
