import type { ILicenseRecord } from '@awaketab/core';
import { t } from './i18n.js';
import type { IStore } from './store.js';
import { toast as pushToast } from './ui/toast.js';

export function sessionSource(source: string | null): 'web' | 'pwa' | 'pip' | 'ext' | 'embed' {
  if (source === 'pwa' || source === 'pip' || source === 'ext' || source === 'embed') return source;
  return 'web';
}

export function track(store: IStore, event: string, params?: Record<string, string | number | boolean>): void {
  if (!store.get().settings.telemetry) return;
  const source = sessionSource(new URL(location.href).searchParams.get('source'));
  void import('../lib/analytics.js').then((mod) => {
    mod.track(event, params ?? {}, {
      telemetry: true,
      source,
      locale: document.documentElement.lang || 'en',
    });
  });
}

export function mountExtras(
  store: IStore,
  storage: { license(): ILicenseRecord | null; writeLicense(s: ILicenseRecord | null): void },
): () => void {
  const opts = {
    telemetry: store.get().settings.telemetry,
    source: sessionSource(new URL(location.href).searchParams.get('source')),
    locale: document.documentElement.lang || 'en',
  };
  void import('../lib/analytics.js').then((mod) => {
    if (opts.telemetry) mod.bindClientErrors(opts);
  });
  track(store, 'page_view');
  const proBadge = document.querySelector<HTMLElement>('[data-pro-badge]');
  const syncPro = () => {
    const lic = store.get().license;
    if (proBadge) proBadge.hidden = !(lic?.features.includes('ads.free') || lic?.features.includes('ambient.packs'));
  };
  syncPro();
  void import('../lib/license.js').then(async (mod) => {
    const result = await mod.revalidateStoredLicense();
    if (result === 'revoked') {
      store.set({ license: null });
      storage.writeLicense(null);
      pushToast(store, { kind: 'warn', text: t('license.error.revoked'), id: 'license' });
    } else {
      store.set({ license: storage.license() });
    }
    syncPro();
  });
  const sheet = document.querySelector<HTMLDialogElement>('[data-dialog="pro"]');
  document.querySelector('[data-open-pro]')?.addEventListener('click', () => {
    sheet?.showModal();
  });
  sheet?.querySelector('[data-pro-close]')?.addEventListener('click', () => {
    sheet.close();
  });
  return store.subscribe(syncPro);
}
