import { t } from './i18n.js';
import type { IStore } from './store.js';
import { toast } from './ui/toast.js';

/**
 * `F`, the header and ambient fullscreen buttons (docs/05 §3.13, E4-T05). iPhone Safari has no element
 * fullscreen, so failure points at the Home-Screen app instead of failing silently. The wake lock itself
 * re-requests on `fullscreenchange` inside @awaketab/wake.
 */
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
