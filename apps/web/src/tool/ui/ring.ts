import { dashOffset, RING_C, progressOf } from '../format.js';
import { t } from '../i18n.js';
import type { IStore } from '../store.js';

export function mountRing(root: HTMLElement, store: IStore): () => void {
  const progressEl = root.querySelector<SVGCircleElement>('[data-ring-progress]');
  const trackEl = root.querySelector<SVGCircleElement>('[data-ring-track]');
  const dot = root.querySelector<SVGCircleElement>('[data-ring-dot]');
  if (!progressEl || !trackEl || !dot) return () => undefined;

  progressEl.style.strokeDasharray = String(RING_C);

  return store.subscribe((s) => {
    const now = Date.now();
    const lock = s.lock;
    const prog = s.session && (lock === 'held' || lock === 'fallback' || lock === 'lost') ? progressOf(s.session, now) : 0;
    root.dataset.lock = lock;
    progressEl.style.strokeDashoffset = String(
      lock === 'idle' || lock === 'denied' || lock === 'unsupported' ? RING_C : dashOffset(lock === 'requesting' ? 0 : prog),
    );
    progressEl.toggleAttribute('hidden', lock === 'requesting' || lock === 'denied' || lock === 'unsupported' || lock === 'idle');
    trackEl.classList.toggle('is-denied', lock === 'denied');
    progressEl.classList.toggle('is-fallback', lock === 'fallback');
    progressEl.classList.toggle('is-lost', lock === 'lost');
    dot.classList.toggle('is-pulse', lock === 'held' && s.session?.plan.type === 'indefinite');
    dot.classList.toggle('is-orbit', lock === 'requesting');
    const status = t(`tool.pill.${lock}`);
    root.setAttribute('aria-label', t('tool.ring.label', { status }));
  });
}
