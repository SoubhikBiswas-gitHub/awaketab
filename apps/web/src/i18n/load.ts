import en from './en.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import ja from './ja.json';
import ptBr from './pt-br.json';
import zh from './zh.json';
import type { TLocale } from './locales';

export type TCatalog = Record<string, string>;
type TVars = Record<string, string | number>;

const catalogs: Record<TLocale, TCatalog> = {
  en,
  es,
  'pt-br': ptBr,
  de,
  fr,
  ja,
  zh,
  hi,
};

const PLURAL = /\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/g;
const TOKEN = /\{(\w+)\}/g;

function interpolate(raw: string, vars?: TVars): string {
  if (!vars) return raw;
  const withPlural = raw.replace(PLURAL, (_m, name: string, one: string, other: string) => {
    const n = Number(vars[name] ?? 0);
    const picked = n === 1 ? one : other;
    return picked.replaceAll('#', String(n));
  });
  return withPlural.replace(TOKEN, (_m, name: string) => String(vars[name] ?? ''));
}

export function catalogFor(locale: TLocale): TCatalog {
  return catalogs[locale];
}

export function t(key: string, vars?: TVars, locale: TLocale = 'en'): string {
  const catalog = catalogs[locale];
  return interpolate(catalog[key] ?? catalogs.en[key] ?? key, vars);
}

export function createT(locale: TLocale): (key: string, vars?: TVars) => string {
  return (key, vars) => t(key, vars, locale);
}
