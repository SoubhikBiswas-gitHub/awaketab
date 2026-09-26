/**
 * Store links for AwakeTab for Chrome (docs/10 §9). The listing ids exist only after the first store
 * approval, so these point at each store's search for "AwakeTab" until then.
 * PROPOSED — add to 00-conventions.md; replace with the listing URLs once published (Needs Soubhik).
 */
export const EXTENSION_STORE_URLS = {
  chrome: 'https://chromewebstore.google.com/search/AwakeTab',
  edge: 'https://microsoftedge.microsoft.com/addons/search/AwakeTab',
} as const;

export type TExtensionStore = keyof typeof EXTENSION_STORE_URLS;

/** FR-EXT-05: browsers with no power API for extensions get the explanation instead of an install button. */
export function unsupportedBrowser(ua: string): 'firefox' | 'safari' | null {
  if (/Firefox\/|FxiOS\//u.test(ua)) return 'firefox';
  if (/Safari\//u.test(ua) && !/Chrome\/|Chromium\/|CriOS\/|Edg\/|OPR\//u.test(ua)) return 'safari';
  return null;
}

/** Wires the /extension page: hides store buttons where they cannot work, and records `extension_click`. */
export function bootExtensionPage(root: HTMLElement, track: (event: string, params: Record<string, string>) => void): void {
  const unsupported = unsupportedBrowser(navigator.userAgent);
  if (unsupported) {
    root.dataset.browser = unsupported;
    for (const el of root.querySelectorAll<HTMLElement>('[data-install]')) el.hidden = true;
  }
  for (const link of root.querySelectorAll<HTMLAnchorElement>('[data-store]')) {
    link.addEventListener('click', () => {
      track('extension_click', { store: link.dataset.store ?? '' });
    });
  }
}
