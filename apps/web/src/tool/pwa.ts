import type { IStore } from './store.js';
import { t } from './i18n.js';
import { toast as pushToast } from './ui/toast.js';

export function mountPwa(
  root: HTMLElement,
  store: IStore,
  sessionStatus: () => string | undefined,
  onInstall: () => void,
): void {
  const installBtn = root.querySelector<HTMLButtonElement>('[data-install]');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const ev = e as Event & { prompt: () => Promise<void> };
    installBtn?.removeAttribute('hidden');
    installBtn?.addEventListener(
      'click',
      () => {
        void ev.prompt();
      },
      { once: true },
    );
  });
  window.addEventListener('appinstalled', onInstall);
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
    installBtn?.removeAttribute('hidden');
    installBtn?.addEventListener('click', () => {
      pushToast(store, { kind: 'info', text: t('pwa.ios.body'), sticky: true, id: 'ios' });
    });
  }
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    void navigator.serviceWorker.register('/sw.js').then((reg) => {
      const offer = () => {
        const st = sessionStatus();
        if (st === 'active' || st === 'paused') return;
        pushToast(store, {
          kind: 'info',
          text: t('tool.toast.update'),
          sticky: true,
          id: 'sw',
          action: {
            label: t('tool.toast.update.action'),
            onClick: () => {
              reg.waiting?.postMessage('SKIP_WAITING');
              location.reload();
            },
          },
        });
      };
      if (reg.waiting) offer();
      reg.addEventListener('updatefound', () => {
        reg.installing?.addEventListener('statechange', () => {
          if (reg.waiting) offer();
        });
      });
    });
  }
}
