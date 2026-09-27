import { afterEach, describe, expect, it } from 'vitest';

import { bindEmbedPage, boxLabel, readSnippetForm, snippetParts } from '../../src/lib/embed-page';
import { DEFAULT_SNIPPET, loaderSnippet } from '../../src/tool/embed/snippet';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('/embed snippet builder (B6)', () => {
  it('splits the tag into its head, attributes and tail, and joins back to the exact tag', () => {
    const tag = loaderSnippet({ ...DEFAULT_SNIPPET, lang: 'de' });
    const parts = snippetParts(tag);
    expect(parts.map((p) => p.text + (p.name ? `${p.name}=${p.value ?? ''}` : '')).join('')).toBe(tag);
    expect(parts[0]?.text).toBe('<script async src="https://awaketab.com/embed.js"');
    expect(parts.filter((p) => p.name).map((p) => p.name)).toEqual(['data-mode', 'data-theme', 'data-size', 'data-lang']);
    expect(parts.at(-1)?.text).toBe('></script>');
  });

  it('reads the builder with safe defaults', () => {
    const data = new FormData();
    data.set('mode', 'clock');
    data.set('size', 'full');
    data.set('lang', 'xx');
    expect(readSnippetForm(data)).toEqual({ ...DEFAULT_SNIPPET, mode: 'clock', size: 'full', lang: null });
  });

  it('labels the reserved box as the loader reserves it', () => {
    expect(boxLabel({ size: 'compact', mode: 'cook' }, 640)).toBe('320 × 104');
    expect(boxLabel({ size: 'full', mode: 'standard' }, 320)).toBe('100% × 240');
    expect(boxLabel({ size: 'full', mode: 'cook' }, 320)).toBe('100% × 420');
  });

  it('rewrites the snippet and remounts the live widget when the builder changes', () => {
    // The remounted loader tag is not fetched here: happy-dom treats the disabled script load as a success.
    (window as unknown as { happyDOM: { settings: { handleDisabledFileLoadingAsSuccess: boolean } } }).happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
    document.body.innerHTML = `<main data-embed-root>
      <div data-embed-demo><iframe data-original></iframe></div><span data-embed-box></span>
      <code data-snippet></code>
      <form data-snippet-form>
        <input type="radio" name="mode" value="cook" checked><input type="radio" name="mode" value="clock">
        <input type="radio" name="theme" value="auto" checked><input type="radio" name="size" value="compact" checked>
        <input type="radio" name="size" value="full"><select name="lang"><option value="" selected></option><option value="de"></option></select>
      </form><p><span data-mode-note="cook"></span><span data-mode-note="clock" hidden></span></p></main>`;
    const root = document.querySelector<HTMLElement>('[data-embed-root]') as HTMLElement;
    bindEmbedPage(root);
    const snippet = root.querySelector('[data-snippet]');
    expect(snippet?.textContent).toBe(loaderSnippet(DEFAULT_SNIPPET));
    expect(root.querySelector('[data-original]')).not.toBeNull();
    const clock = root.querySelector<HTMLInputElement>('input[value="clock"]') as HTMLInputElement;
    clock.checked = true;
    root.querySelector('form')?.dispatchEvent(new Event('change', { bubbles: true }));
    expect(snippet?.textContent).toBe(loaderSnippet({ ...DEFAULT_SNIPPET, mode: 'clock' }));
    const script = root.querySelector<HTMLScriptElement>('[data-embed-demo] script');
    expect(script?.hasAttribute('data-original')).toBe(false);
    expect(script?.dataset.mode).toBe('clock');
    expect(script?.getAttribute('src')).toBe('/embed.js');
    expect(root.querySelector<HTMLElement>('[data-mode-note="clock"]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-mode-note="cook"]')?.hidden).toBe(true);

    // A second change mounts one tag with the new language (a tag still loading is waited for, not removed: an
    // async script removed before it runs would still run; the e2e journey checks that in a real browser).
    const lang = root.querySelector<HTMLSelectElement>('select[name="lang"]') as HTMLSelectElement;
    lang.value = 'de';
    root.querySelector('form')?.dispatchEvent(new Event('change', { bubbles: true }));
    expect(snippet?.textContent).toContain('data-lang="de"');
    script?.dispatchEvent(new Event('load'));
    expect(root.querySelector<HTMLScriptElement>('[data-embed-demo] script')?.dataset.lang).toBe('de');
    expect(root.querySelectorAll('[data-embed-demo] script')).toHaveLength(1);
  });
});
