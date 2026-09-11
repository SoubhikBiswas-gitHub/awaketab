import { LOCALES, type TLocale } from './locales';

export function matchLocale(tags: readonly string[]): TLocale | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('pt-br') || lower === 'pt-br' || lower.startsWith('pt')) return 'pt-br';
    if (lower.startsWith('zh')) return 'zh';
    const base = lower.split('-')[0] ?? '';
    if (LOCALES.includes(base as TLocale) && base !== 'en') return base as TLocale;
    if (base === 'en') return 'en';
  }
  return null;
}
