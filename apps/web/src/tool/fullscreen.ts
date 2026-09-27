import { t } from './i18n.js';
import type { IStore } from './store.js';
import { toast } from './ui/toast.js';

export function toggleFullscreen(store: IStore): void {
  const fail = () => {
    toast(store, { kind: 'info', text: t('tool.toast.fullscreen'), id: 'fs' });
  };
  if (!document.fullscreenEnabled) {
    fail();
    return;
  }
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(fail);
}
