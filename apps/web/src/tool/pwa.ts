import type { IStore } from './store.js';
import { t } from './i18n.js';
import { dismiss, toast as pushToast } from './ui/toast.js';

export function sessionBusy(status: string | undefined): boolean {
  return status === 'active' || status === 'paused';
}

export function watchUpdates(
  reg: Pick<ServiceWorkerRegistration, 'waiting' | 'installing' | 'active' | 'addEventListener'>,
  store: IStore,
  sessionStatus: () => string | undefined,
  sw: Pick<ServiceWorkerContainer, 'addEventListener'> = navigator.serviceWorker,
  reload: () => void = () => {
    location.reload();
  },
): () => void {
  // 0: not said yet · 1: told to reload when the session is done · 2: Reload offered.
  let said = 0;
  let reloading = false;
  const offer = () => {
    // A first install also passes through waiting; only a worker replacing an active one is an update.
    const busy = sessionBusy(sessionStatus());
    if (said > 1 || (busy && said) || !reg.waiting || !reg.active) return;
    said = busy ? 1 : 2;
    // A running session is never reloaded: it hears once, calmly, and gets the Reload button when it ends.
    pushToast(store, {
      kind: 'info',
      text: t(busy ? 'tool.toast.update.later' : 'tool.toast.update.ready'),
      sticky: !busy,
      id: 'sw',
      ...(!busy && {
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
      }),
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
  // Tool pages link their manifest after the first paint (its fetch sat on the LCP path); the header's Install slot
  // is reserved, so the button showing later moves nothing.
  const manifest = root.dataset.manifest;
  if (manifest)
    document.head.append(Object.assign(document.createElement('link'), { rel: 'manifest', href: manifest }));
  const buttons = [...root.querySelectorAll<HTMLElement>('[data-install]')];
  const card = root.querySelector<HTMLElement>('[data-install-card]');
  const body = card?.querySelector<HTMLElement>('[data-install-body]');
  const now = card?.querySelector<HTMLElement>('[data-install-now]');
  let ev: (Event & { prompt: () => Promise<void> }) | null = null;
  const show = (on: boolean) => {
    for (const b of buttons) b.hidden = !on;
  };
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches;
  for (const b of buttons) {
    b.addEventListener('click', () => {
      if (card) card.hidden = false;
      if (ios && body) body.textContent = t('pwa.ios.body');
      if (now) now.hidden = ios;
      card?.querySelector<HTMLElement>('button')?.focus();
    });
  }
  card?.querySelector('[data-install-later]')?.addEventListener('click', () => {
    card.hidden = true;
  });
  now?.addEventListener('click', () => {
    void ev?.prompt();
  });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ev = e as Event & { prompt: () => Promise<void> };
    show(true);
  });
  window.addEventListener('appinstalled', () => {
    show(false);
    if (card) card.hidden = true;
    pushToast(store, {
      kind: 'success',
      text: t('pwa.installed'),
      id: 'installed',
    });
    onInstall();
  });
  if (ios) show(true);
  // Offline: the tool keeps working from the precached shell; say so once instead of failing silently.
  const offline = () => {
    pushToast(store, {
      kind: 'offline',
      text: t('tool.offline'),
      sticky: true,
      id: 'offline',
    });
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
