if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
}

// The island's t() reads the catalog the page embeds; unit tests get the English source catalog.
if (typeof window !== 'undefined') {
  const { setCatalog } = await import('./apps/web/src/tool/i18n.js');
  const en = (await import('./apps/web/src/i18n/en.json')).default;
  setCatalog(en);
}
