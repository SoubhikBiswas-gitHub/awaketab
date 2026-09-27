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

export const ISLAND_PREFIXES = [
  'tool.',
  'ambient.',
  'stats.',
  'settings.',
  'rating.',
  'pip.',
  'end.',
  'pro.',
  'license.',

  'pwa.',
  'i18n.',
  'kiosk.',
] as const;

// Rendered at build time by ToolIsland.astro, so the client never needs them.
const ISLAND_EXCLUDED_PREFIXES = ['pro.lapse.'] as const;

export function islandCatalog(locale: TLocale): TCatalog {
  return Object.fromEntries(
    Object.entries(catalogs[locale]).filter(
      ([key]) =>
        ISLAND_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
        !ISLAND_EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix)),
    ),
  );
}

export function t(key: string, vars?: TVars, locale: TLocale = 'en'): string {
  const catalog = catalogs[locale];
  return interpolate(catalog[key] ?? catalogs.en[key] ?? key, vars);
}

export function createT(locale: TLocale): (key: string, vars?: TVars) => string {
  return (key, vars) => t(key, vars, locale);
}
