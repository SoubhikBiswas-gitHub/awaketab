export const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;

export type TLocale = (typeof LOCALES)[number];

export interface ILocaleMeta {
  htmlLang: string;
  hreflang: string;
  label: string;
  reviewed: boolean;
}

export const LOCALE_META: Record<TLocale, ILocaleMeta> = {
  en: { htmlLang: 'en', hreflang: 'en', label: 'English', reviewed: true },
  es: { htmlLang: 'es', hreflang: 'es', label: 'Español', reviewed: false },
  'pt-br': { htmlLang: 'pt-BR', hreflang: 'pt-BR', label: 'Português (Brasil)', reviewed: false },
  de: { htmlLang: 'de', hreflang: 'de', label: 'Deutsch', reviewed: false },
  fr: { htmlLang: 'fr', hreflang: 'fr', label: 'Français', reviewed: false },
  ja: { htmlLang: 'ja', hreflang: 'ja', label: '日本語', reviewed: false },
  zh: { htmlLang: 'zh-Hans', hreflang: 'zh-Hans', label: '简体中文', reviewed: false },
  hi: { htmlLang: 'hi', hreflang: 'hi', label: 'हिन्दी', reviewed: false },
};

export const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar', 'fa', 'he', 'ur']);

export type TTextDirection = 'ltr' | 'rtl';

export function textDirection(htmlLang: string): TTextDirection {
  const primary = htmlLang.toLowerCase().split('-')[0] ?? '';
  return RTL_LANGUAGES.has(primary) ? 'rtl' : 'ltr';
}

export function isLocale(value: string): value is TLocale {
  return LOCALES.includes(value as TLocale);
}

export function localePath(locale: TLocale, pathname = '/'): string {
  const normalized = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/gu, '')}`;
  return locale === 'en' ? normalized : `/${locale}${normalized}`;
}

export function localeFromPath(pathname: string): TLocale {
  const first = pathname.split('/').filter(Boolean)[0];
  return first && isLocale(first) ? first : 'en';
}
