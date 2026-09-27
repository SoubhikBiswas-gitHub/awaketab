import { applyLaunch, trackPro } from './pro-common';

export function bootProPage(root: HTMLElement, now = Date.now()): void {
  applyLaunch(root, now);

  trackPro('pro_view', {}, '/pro');
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-plan]')) {
    link.addEventListener('click', () => {
      trackPro('pro_checkout_click', { plan: link.dataset.plan ?? '' }, '/pro');
    });
  }
}
