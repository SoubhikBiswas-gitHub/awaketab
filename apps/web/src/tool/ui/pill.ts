import { t } from '../i18n.js';
import { planUntilWall, wallLabel } from '../format.js';
import type { IStore } from '../store.js';

const INTERACTIVE = new Set(['denied', 'unsupported']);

export function mountPill(root: HTMLElement, store: IStore, onActivate: () => void): () => void {
  const output = root.querySelector<HTMLElement>('[data-pill-text]');
  const extra = root.querySelector<HTMLElement>('[data-pill-extra]');
  if (!output) return () => undefined;

  const render = () => {
    const s = store.get();
    const lock = s.lock;
    root.dataset.lock = lock;
    output.textContent = t(`tool.pill.${lock}`);
    const wall = s.session ? planUntilWall(s.session.plan) : null;
    if (extra) {
      if ((lock === 'held' || lock === 'fallback') && wall) {
        extra.hidden = false;
        extra.textContent = t('tool.timer.until', {
          wall: wallLabel(wall, document.documentElement.lang || 'en', s.settings.ambient.clock24h),
        });
      } else if (s.deferredAutostart && lock === 'idle') {
        extra.hidden = false;
        extra.textContent = t('tool.pill.idle.deferred');
      } else {
        extra.hidden = true;
        extra.textContent = '';
      }
    }
    const interactive = INTERACTIVE.has(lock);
    root.toggleAttribute('aria-disabled', !interactive);
    if (root instanceof HTMLButtonElement) root.disabled = !interactive;
  };

  root.addEventListener('click', () => {
    if (INTERACTIVE.has(store.get().lock)) onActivate();
  });

  return store.subscribe(render);
}
