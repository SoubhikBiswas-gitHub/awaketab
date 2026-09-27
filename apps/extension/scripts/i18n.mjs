// Extension strings come from the web catalogs in apps/web/src/i18n (docs/07 §2) plus the extension's own
// catalog in apps/extension/locales/<locale>.json, which holds only copy that exists nowhere on the web
// (the Clear Night popup states, options help and the welcome page; `ext.*` keys, never a web key). This
// module chooses which keys ship, per locale, merges the two, and writes the `_locales/<lang>/messages.json`
// files Chrome needs for the manifest name, description and command.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const WEB_I18N = path.resolve(HERE, '../../web/src/i18n');
export const WEB_TOKENS = path.resolve(HERE, '../../web/src/styles/tokens.css');
export const EXT_I18N = path.resolve(HERE, '../locales');

export const LOCALES = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'];

export const CHROME_LOCALES = { en: 'en', es: 'es', 'pt-br': 'pt_BR', de: 'de', fr: 'fr', ja: 'ja', zh: 'zh_CN', hi: 'hi' };

export const PAGE_PREFIXES = ['ext.', 'tool.pill.', 'tool.preset.', 'tool.timer.', 'tool.until.', 'tool.extend.', 'settings.', 'license.', 'pro.'];
export const PAGE_KEYS = [
  'app.name',
  'tool.presets',
  'tool.ring.start',
  'tool.ring.stop',
  'tool.advice.retry',
  'stats.minutes',
  'stats.hours',
  'end.notify.title',
  'end.notify.body',
  'footer.privacy',
  'footer.terms',
  'footer.changelog',
  'footer.donate',
];

export const BG_KEYS = [
  'app.name',
  'end.notify.title',
  'end.notify.body',
  'tool.extend.add30',
  'tool.extend.stop',
  'tool.pill.idle',
  'tool.pill.requesting',
  'tool.pill.held',
  'tool.pill.lost',
  'tool.pill.denied',
  'tool.pill.unsupported',
  'tool.pill.fallback',
  'ext.pill.system',
  'ext.pill.systemHeld',
  'tool.timer.remaining',
  'stats.minutes',
  'tool.preset.p15',
  'tool.preset.p30',
  'tool.preset.p45',
  'tool.preset.p60',
  'tool.preset.p120',
  'tool.preset.p240',
  'tool.preset.pinf.sr',
];

export const MANIFEST_MESSAGES = {
  ext_name: 'ext.name',
  ext_description: 'ext.description',
  ext_command_toggle: 'ext.command.toggle',
};

export function readCatalog(locale) {
  return JSON.parse(readFileSync(path.join(WEB_I18N, `${locale}.json`), 'utf8'));
}

export function readExtCatalog(locale) {
  return JSON.parse(readFileSync(path.join(EXT_I18N, `${locale}.json`), 'utf8'));
}

function pick(catalog, keep) {
  return Object.fromEntries(Object.entries(catalog).filter(([key]) => keep(key)));
}

export function pageCatalog(locale) {
  const web = pick(readCatalog(locale), (key) => PAGE_KEYS.includes(key) || PAGE_PREFIXES.some((prefix) => key.startsWith(prefix)));
  // Web keys win: the extension catalog may only add keys (a unit test keeps the two disjoint).
  return { ...readExtCatalog(locale), ...web };
}

export function bgCatalogs() {
  return Object.fromEntries(LOCALES.map((locale) => [locale, pick(readCatalog(locale), (key) => BG_KEYS.includes(key))]));
}

export function localeMessages() {
  return LOCALES.map((locale) => {
    const catalog = readCatalog(locale);
    const english = readCatalog('en');
    const messages = {};
    for (const [name, key] of Object.entries(MANIFEST_MESSAGES)) {
      const message = catalog[key] ?? english[key];
      if (typeof message !== 'string') throw new Error(`Missing i18n key ${key} for ${locale}`);
      // Chrome treats `$` as a placeholder marker; our copy never uses one, and must not start to.
      if (message.includes('$')) throw new Error(`"$" in ${locale}:${key} would be read as a placeholder`);
      messages[name] = { message };
    }
    return {
      relativeDest: `_locales/${CHROME_LOCALES[locale]}/messages.json`,
      contents: `${JSON.stringify(messages, null, 2)}\n`,
    };
  });
}

export function tokensCss() {
  const css = readFileSync(WEB_TOKENS, 'utf8');
  const start = css.indexOf(':root,\n[data-theme="light"]');
  if (start < 0) throw new Error('tokens.css: the `:root, [data-theme="light"]` block moved; update scripts/i18n.mjs');
  const out = css.slice(start);
  if (!out.includes('--at-accent') || out.includes('@apply') || out.includes('@theme')) {
    throw new Error('tokens.css: unexpected Tailwind syntax after the token blocks');
  }
  return out;
}

export function awaketabExtension() {
  const CATALOG = 'virtual:at-catalog/';
  const BG = 'virtual:at-catalogs-bg';
  const TOKENS = 'virtual:at-tokens.css';
  const TOKENS_ID = '/__at-tokens.css';
  return {
    name: 'awaketab-extension',
    resolveId(id) {
      if (id.startsWith(CATALOG) || id === BG) return `\0${id}`;
      if (id === TOKENS) return TOKENS_ID;
      return null;
    },
    load(id) {
      if (id.startsWith(`\0${CATALOG}`)) {
        const locale = id.slice(CATALOG.length + 1);
        if (!LOCALES.includes(locale)) throw new Error(`Unknown locale ${locale}`);
        this.addWatchFile(path.join(WEB_I18N, `${locale}.json`));
        this.addWatchFile(path.join(EXT_I18N, `${locale}.json`));
        return `export default ${JSON.stringify(pageCatalog(locale))};`;
      }
      if (id === `\0${BG}`) {
        for (const locale of LOCALES) this.addWatchFile(path.join(WEB_I18N, `${locale}.json`));
        return `export default ${JSON.stringify(bgCatalogs())};`;
      }
      if (id === TOKENS_ID) {
        this.addWatchFile(WEB_TOKENS);
        return tokensCss();
      }
      return null;
    },
  };
}
