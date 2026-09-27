import { matchLocale } from '../../i18n/match.js';
import { LOCALE_META, localeFromPath, localePath } from '../../i18n/locales.js';
import { t } from '../i18n.js';
import type { createStorage } from '@awaketab/core';

export function mountLangSuggest(root: HTMLElement, storage: ReturnType<typeof createStorage>): void {
  const banner = root.querySelector<HTMLElement>('[data-lang-suggest]');
  if (!banner) return;
  const onboard = storage.onboarding();
  const current = localeFromPath(location.pathname);
  const suggested = matchLocale(navigator.languages);
  if (!suggested || suggested === current || onboard.dismissedTips.includes('lang-suggest')) return;
  const text = banner.querySelector('[data-lang-suggest-text]');
  const accept = banner.querySelector<HTMLAnchorElement>('[data-lang-suggest-accept]');
  if (text) text.textContent = t('i18n.suggest', { language: LOCALE_META[suggested].label });
  if (accept) accept.href = localePath(suggested, '/');
  banner.hidden = false;
  banner.querySelector('[data-lang-suggest-dismiss]')?.addEventListener('click', () => {
    banner.hidden = true;
    storage.writeOnboarding({
      ...onboard,
      dismissedTips: [...onboard.dismissedTips, 'lang-suggest'],
    });
  });
}
