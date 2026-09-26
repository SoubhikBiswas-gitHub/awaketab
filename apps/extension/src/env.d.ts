/** `true` only in the Playwright test build (`AT_EXT_TEST=1`); see src/test-hooks.ts. */
declare const __AT_TEST__: boolean;

/** Per-locale page strings picked from apps/web/src/i18n/<locale>.json by scripts/i18n.mjs. */
declare module 'virtual:at-catalog/*' {
  const catalog: Record<string, string>;
  export default catalog;
}

/** Background strings (notifications, badge title) for every locale. */
declare module 'virtual:at-catalogs-bg' {
  const catalogs: Partial<Record<'en' | 'es' | 'pt-br' | 'de' | 'fr' | 'ja' | 'zh' | 'hi', Record<string, string>>>;
  export default catalogs;
}

/** The `--at-*` token blocks of apps/web/src/styles/tokens.css, without the Tailwind layer. */
declare module 'virtual:at-tokens.css';
