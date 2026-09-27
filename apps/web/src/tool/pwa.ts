import type { IStore } from './store.js';
import { t } from './i18n.js';
import { dismiss, toast as pushToast } from './ui/toast.js';

export function sessionBusy(status: string | undefined): boolean {
  return status === 'active' || status === 'paused';
}

export function watchUpdates(
  reg: Pick<ServiceWorkerRegistration, 'waiting' | 'installing' | 'addEventListener'>,
  store: IStore,
  sessionStatus: () => string | undefined,
  sw: Pick<ServiceWorkerContainer, 'addEventListener'> = navigator.serviceWorker,
  reload: () => void = () => {
    location.reload();
  },
): () => void {
  let offered = false;
  let reloading = false;
  const offer = () => {
    if (offered || !reg.waiting || sessionBusy(sessionStatus())) return;
    offered = true;
    pushToast(store, {
      kind: 'info',
      text: t('tool.toast.update'),
      sticky: true,
      id: 'sw',
      action: {
        label: t('tool.toast.update.action'),
        onClick: () => {
          sw.addEventListener('controllerchange', () => {
            if (reloading) return;
            reloading = true;
            reload();
          });
          reg.waiting?.postMessage('SKIP_WAITING');
        },
      },
    });
  };
  reg.addEventListener('updatefound', () => {
    reg.installing?.addEventListener('statechange', offer);
  });
  offer();
  // A waiting worker found mid-session is offered the moment the session ends.
  return store.subscribe(() => {
    offer();
  });
}

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
  // Offline: the tool keeps working from the precached shell; say so once instead of failing silently.
  const offline = () => {
    pushToast(store, { kind: 'info', text: t('tool.offline'), sticky: true, id: 'offline' });
  };
  window.addEventListener('offline', offline);
  window.addEventListener('online', () => {
    dismiss(store, 'offline');
  });
  if (!navigator.onLine) offline();
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    // Registration can be refused (blocked by policy, some private modes); the tool works without it.
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        watchUpdates(reg, store, sessionStatus);
      })
      .catch(() => undefined);
  }
}
