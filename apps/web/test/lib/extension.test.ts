import { describe, expect, it, vi } from 'vitest';
import { bootExtensionPage, EXTENSION_STORE_URLS, unsupportedBrowser } from '../../src/lib/extension';

const UA = {
  chrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 Edg/128.0',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:130.0) Gecko/20100101 Firefox/130.0',
  safari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
};

describe('/extension page script (FR-EXT-05)', () => {
  it('flags Firefox and Safari, never Chromium browsers', () => {
    expect(unsupportedBrowser(UA.chrome)).toBeNull();
    expect(unsupportedBrowser(UA.edge)).toBeNull();
    expect(unsupportedBrowser(UA.firefox)).toBe('firefox');
    expect(unsupportedBrowser(UA.safari)).toBe('safari');
  });

  it('hides the install buttons in Firefox and records extension_click on store links', () => {
    document.body.innerHTML = `<main data-root><div data-install><a data-store="chrome" href="${EXTENSION_STORE_URLS.chrome}">Add</a></div></main>`;
    const root = document.querySelector<HTMLElement>('[data-root]');
    if (!root) throw new Error('fixture');
    const track = vi.fn();
    const ua = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(UA.chrome);
    bootExtensionPage(root, track);
    root.querySelector<HTMLAnchorElement>('[data-store]')?.dispatchEvent(new MouseEvent('click', { cancelable: true }));
    expect(track).toHaveBeenCalledWith('extension_click', { store: 'chrome' });
    expect(root.querySelector<HTMLElement>('[data-install]')?.hidden).toBe(false);
    ua.mockReturnValue(UA.firefox);
    bootExtensionPage(root, track);
    expect(root.dataset.browser).toBe('firefox');
    expect(root.querySelector<HTMLElement>('[data-install]')?.hidden).toBe(true);
    ua.mockRestore();
  });
});
