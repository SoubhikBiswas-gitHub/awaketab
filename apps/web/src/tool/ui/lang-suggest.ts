import { matchLocale } from '../../i18n/match.js';
import type { createStorage } from '@awaketab/core';

export function mountLangSuggest(root: HTMLElement, storage: ReturnType<typeof createStorage>): void {
  const banner = root.querySelector<HTMLElement>('[data-lang-suggest]');
  if (!banner) return;
  const onboard = storage.onboarding();
  // Each Settings language row carries the question and the button in its own language (the reader may not read ours).
  const row = document.querySelector<HTMLAnchorElement>(
    `#at-lang-set-list [data-code="${matchLocale(navigator.languages) ?? ''}"]`,
  );
  const text = banner.querySelector<HTMLElement>('[data-lang-suggest-text]');
  const accept = banner.querySelector<HTMLAnchorElement>('[data-lang-suggest-accept]');
  if (!row || row.hasAttribute('aria-current') || !text || !accept || onboard.dismissedTips.includes('lang-suggest'))
    return;
  text.textContent = row.dataset.q ?? '';
  accept.textContent = row.dataset.a ?? '';
  text.lang = accept.lang = row.lang;
  // The footer switcher links this same page in that language; the Settings row links its home.
  accept.href = document.querySelector<HTMLAnchorElement>(`footer [hreflang="${row.hreflang}"]`)?.href ?? row.href;
  banner.hidden = false;
  banner.querySelector('[data-lang-suggest-dismiss]')?.addEventListener('click', () => {
    banner.hidden = true;
    storage.writeOnboarding({
      ...onboard,
      dismissedTips: [...onboard.dismissedTips, 'lang-suggest'],
    });
  });
}
