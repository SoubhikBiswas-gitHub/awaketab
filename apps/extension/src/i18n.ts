import { LOCALES, isLocale, type TLocale } from '../../web/src/i18n/locales';
import { matchLocale } from '../../web/src/i18n/match';

/**
 * Extension strings are the web catalogs (apps/web/src/i18n/*.json) — no copy of any English string lives
 * in the extension. The build picks the keys the extension uses (scripts/i18n.mjs) into per-locale chunks
 * and `_locales/<lang>/messages.json` for the manifest; this module only formats them with the same ICU
 * subset as the web island (`{name}` and `{n, plural, one {…} other {…}}`).
 */

export type TCatalog = Record<string, string>;
export type TVars = Record<string, string | number>;
export type TTranslate = (key: string, vars?: TVars) => string;

export { LOCALES, type TLocale };

const PLURAL = /\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/gu;
const TOKEN = /\{(\w+)\}/gu;

export function format(raw: string, vars?: TVars): string {
  if (!vars) return raw;
  const withPlural = raw.replace(PLURAL, (_m, name: string, one: string, other: string) => {
    const n = Number(vars[name] ?? 0);
    return (n === 1 ? one : other).replaceAll('#', String(n));
  });
  return withPlural.replace(TOKEN, (_m, name: string) => String(vars[name] ?? ''));
}

export function createTranslator(catalog: TCatalog, fallback: TCatalog = {}): TTranslate {
  return (key, vars) => format(catalog[key] ?? fallback[key] ?? key, vars);
}

/** `settings.locale` when set, otherwise the browser UI language, otherwise English. */
export function resolveLocale(setting: string | null | undefined, uiLanguage: string | undefined): TLocale {
  if (setting && isLocale(setting)) return setting;
  return (uiLanguage ? matchLocale([uiLanguage]) : null) ?? 'en';
}
