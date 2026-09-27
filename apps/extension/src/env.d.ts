declare const __AT_TEST__: boolean;

declare module 'virtual:at-catalog/*' {
  const catalog: Record<string, string>;
  export default catalog;
}

declare module 'virtual:at-catalogs-bg' {
  const catalogs: Partial<Record<'en' | 'es' | 'pt-br' | 'de' | 'fr' | 'ja' | 'zh' | 'hi', Record<string, string>>>;
  export default catalogs;
}

declare module 'virtual:at-tokens.css';
