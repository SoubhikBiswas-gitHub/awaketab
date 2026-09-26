import { STORAGE_KEYS, type ISettings } from '@awaketab/core';
import { LOCALE_META } from '../../web/src/i18n/locales';
import type { IExtApi } from './api';
import { createTranslator, resolveLocale, type TCatalog, type TLocale, type TTranslate } from './i18n';
import type { IExtState, TExtRequest } from './messages';
import { readSettings } from './settings';

/** Per-locale page catalogs, each its own chunk: a page loads only the language it shows. */
const CATALOGS: Record<TLocale, () => Promise<{ default: TCatalog }>> = {
  en: () => import('virtual:at-catalog/en'),
  es: () => import('virtual:at-catalog/es'),
  'pt-br': () => import('virtual:at-catalog/pt-br'),
  de: () => import('virtual:at-catalog/de'),
  fr: () => import('virtual:at-catalog/fr'),
  ja: () => import('virtual:at-catalog/ja'),
  zh: () => import('virtual:at-catalog/zh'),
  hi: () => import('virtual:at-catalog/hi'),
};

export interface IPageContext {
  api: IExtApi;
  settings: ISettings;
  locale: TLocale;
  t: TTranslate;
}

/** `data-theme` on <html> like the web (`auto` follows the browser via prefers-color-scheme). */
export function applyTheme(settings: ISettings, root: HTMLElement = document.documentElement): void {
  if (settings.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', settings.theme);
}

/** Fills every `[data-i18n]` text node and `[data-i18n-aria]` label under `root`. */
export function translateTree(root: ParentNode, t: TTranslate): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n ?? '');
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria ?? ''));
}

export async function loadPage(api: IExtApi): Promise<IPageContext> {
  const stored = await api.storage.local.get(STORAGE_KEYS.settings);
  const settings = readSettings(stored[STORAGE_KEYS.settings]);
  const locale = resolveLocale(settings.locale, api.i18n?.getUILanguage() ?? navigator.language);
  const [catalog, english] = await Promise.all([
    CATALOGS[locale]().then((m) => m.default),
    locale === 'en' ? Promise.resolve(null) : CATALOGS.en().then((m) => m.default),
  ]);
  document.documentElement.lang = LOCALE_META[locale].htmlLang;
  applyTheme(settings);
  return { api, settings, locale, t: createTranslator(catalog, english ?? {}) };
}

export async function send(api: IExtApi, request: TExtRequest): Promise<IExtState | null> {
  try {
    return (await api.runtime.sendMessage(request)) as IExtState | null;
  } catch {
    return null;
  }
}
