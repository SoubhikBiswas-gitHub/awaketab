import { formatHms, planLabel, remainingOf } from '../format.js';
import { t } from '../i18n.js';
import type { IStore } from '../store.js';

export function mountResume(
  root: HTMLElement,
  store: IStore,
  handlers: { accept: () => void; dismiss: () => void },
): () => void {
  const title = root.querySelector<HTMLElement>('[data-resume-title]');
  root.querySelector('[data-resume-accept]')?.addEventListener('click', handlers.accept);
  root.querySelector('[data-resume-dismiss]')?.addEventListener('click', handlers.dismiss);

  return store.subscribe((s) => {
    const show = s.ui.resumeVisible;
    root.hidden = !show;
    if (!show || !title) return;
    const session = s.session;
    if (!session) return;
    const rem = remainingOf(session, Date.now());
    title.textContent =
      rem === null
        ? t('tool.resume.body', { label: planLabel(session.presetId, s.eightHour) })
        : t('tool.resume.title', { time: formatHms(rem) });
  });
}

export function mountStop(root: HTMLElement, store: IStore, stop: () => void): () => void {
  root.addEventListener('click', stop);
  return store.subscribe((s) => {
    const on = s.session?.status === 'active' || s.session?.status === 'paused';
    root.hidden = !on;
  });
}

export function mountSecondTab(
  root: HTMLElement,
  store: IStore,
  handlers: { useThis: () => void; keep: () => void },
): () => void {
  root.querySelector('[data-tab-use]')?.addEventListener('click', handlers.useThis);
  root.querySelector('[data-tab-keep]')?.addEventListener('click', handlers.keep);
  return store.subscribe((s) => {
    root.hidden = !s.ui.secondTab;
  });
}
