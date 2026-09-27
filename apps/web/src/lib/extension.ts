// Until the stores approve the listing the links are store searches, and the buttons say so (flip with the URLs).
export const EXTENSION_LISTED = false;

export const EXTENSION_STORE_URLS = {
  chrome: 'https://chromewebstore.google.com/search/AwakeTab',
  edge: 'https://microsoftedge.microsoft.com/addons/search/AwakeTab',
} as const;

export function unsupportedBrowser(ua: string): 'firefox' | 'safari' | null {
  if (/Firefox\/|FxiOS\//u.test(ua)) return 'firefox';
  if (/Safari\//u.test(ua) && !/Chrome\/|Chromium\/|CriOS\/|Edg\/|OPR\//u.test(ua)) return 'safari';
  return null;
}

export function bootExtensionPage(
  root: HTMLElement,
  track: (event: string, params: Record<string, string>) => void,
): void {
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
