import { t } from '../i18n.js';
import type { IStore, IToastItem } from '../store.js';
import { styled } from './more-css.js';
import { dismiss } from './toast.js';

// Toast icons (canvas TOAST_ICON): a check for success, an info ring, a triangle for warnings and errors, and a
// crossed-out signal for offline (Main board).
const ICON: Record<IToastItem['kind'], string> = {
  success: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM8 12.2l2.8 2.8L16 9.6',
  info: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM12 11v5M12 7.8v.1',
  warn: 'M12 3.5L21.5 20h-19zM12 10v4.5M12 17.2v.3',
  error: 'M12 3.5L21.5 20h-19zM12 10v4.5M12 17.2v.3',
  offline:
    'M2.5 8.8a14 14 0 0 1 5-3M11 5a14 14 0 0 1 10.5 3.8M5.6 12.2a9.5 9.5 0 0 1 3.9-2.3M14.8 10.1a9.5 9.5 0 0 1 3.6 2.1M9 15.6a4.5 4.5 0 0 1 6 0M12 19.2v.1M3.5 3.5l17 17',
};
const svg = (d: string, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

export function mountToasts(root: HTMLElement, store: IStore): () => void {
  return styled(() =>
    store.subscribe((s) => {
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
    }),
  );
}
