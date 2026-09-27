import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/en.json';
import { embedCatalog, isEmbedKey } from '../../src/tool/embed/catalog.js';
import { optionsFromDataset } from '../../src/tool/embed/protocol.js';
import { creditSnippet, DEFAULT_SNIPPET, iframeSnippet, kioskMsg, kioskUrl, loaderSnippet } from '../../src/tool/embed/snippet.js';

describe('/embed snippet generator (docs/11 §1, E12-T02)', () => {
  it('renders the default tag exactly as sites paste it', () => {
    expect(loaderSnippet(DEFAULT_SNIPPET)).toBe(
      '<script async src="https://awaketab.com/embed.js" data-mode="cook" data-theme="auto" data-size="compact"></script>',
    );
  });

  it('adds only the attributes that differ from the page defaults', () => {
    const tag = loaderSnippet({ ...DEFAULT_SNIPPET, lang: 'ja', preset: 'p60', size: 'full', theme: 'oled', mode: 'clock' });
    expect(tag).toBe(
      '<script async src="https://awaketab.com/embed.js" data-mode="clock" data-theme="oled" data-size="full" data-lang="ja" data-preset="p60"></script>',
    );
  });

  it('produces a tag the loader parses back to the same options', () => {
    const opts = { ...DEFAULT_SNIPPET, lang: 'de' as const, preset: 'p45' as const, size: 'full' as const };
    const doc = new DOMParser().parseFromString(loaderSnippet(opts), 'text/html');
    const script = doc.querySelector('script');
    expect(optionsFromDataset({ ...script?.dataset }, 'en')).toEqual({ ...opts, lang: 'de' });
  });

  it('keeps allow="screen-wake-lock" in the bare-iframe fallback', () => {
    const frame = iframeSnippet(DEFAULT_SNIPPET, 'Keep "screen" awake');
    expect(frame).toContain('allow="screen-wake-lock"');
    expect(frame).toContain('src="https://awaketab.com/embed/cook?mode=cook&theme=auto&lang=en&size=compact&preset=pinf"');
    expect(frame).toContain('title="Keep &quot;screen&quot; awake"');
    expect(frame).toContain('loading="lazy"');
    // O-58: the compact box is 320 × 104 with the widget's 16 px corner.
    expect(frame).toContain('style="width:320px;max-width:100%;height:104px;border:0;border-radius:16px;display:block"');
    expect(iframeSnippet({ ...DEFAULT_SNIPPET, size: 'full' }, 'x')).toContain('height:240px;border:0;border-radius:28px');
  });

  it('ends the bare-iframe fallback with the credit line as plain HTML (O-47)', () => {
    const lines = iframeSnippet(DEFAULT_SNIPPET, 'Keep screen awake').split('\n');
    const doc = new DOMParser().parseFromString(lines.join('\n'), 'text/html');
    const iframe = doc.querySelector('iframe');
    const credit = iframe?.nextElementSibling;
    expect(credit?.className).toBe('awaketab-credit');
    const link = credit?.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://awaketab.com/?ref=embed&source=embed');
    expect(link?.getAttribute('rel')).toBe('nofollow');
    expect(link?.textContent).toBe('Keep awake by AwakeTab');
    expect(lines.at(-1)).toBe(creditSnippet());
    expect(iframeSnippet(DEFAULT_SNIPPET, 't', undefined, 'Wach gehalten von <AwakeTab>')).toContain('>Wach gehalten von &lt;AwakeTab></a>');
  });
});

describe('/kiosk URL builder (docs/09 §7.2)', () => {
  const base = { preset: 'pinf', mode: 'message', theme: 'dark', msg: 'Welcome', autostart: true, logo: '', token: '' } as const;

  it('builds the free URL', () => {
    expect(kioskUrl(base)).toBe('https://awaketab.com/?autostart=1&mode=message&msg=Welcome&theme=dark');
    expect(kioskUrl({ ...base, mode: 'clock', preset: 'p120', autostart: false })).toBe(
      'https://awaketab.com/?autostart=0&preset=p120&mode=clock&theme=dark',
    );
  });

  it('adds licensed extras: an https logo and the token in the hash', () => {
    const url = kioskUrl({ ...base, logo: 'https://cdn.example.com/l.png', token: 'aaa.bbb.ccc' });
    expect(url).toBe('https://awaketab.com/?autostart=1&mode=message&msg=Welcome&theme=dark&logo=https%3A%2F%2Fcdn.example.com%2Fl.png#lic=aaa.bbb.ccc');
    expect(new URL(url).search).not.toContain('aaa.bbb.ccc');
  });

  it('drops unsafe logos and malformed tokens', () => {
    for (const logo of ['http://cdn.example.com/l.png', 'javascript:alert(1)', 'https://u:p@cdn.example.com/l.png', 'not a url']) {
      expect(kioskUrl({ ...base, logo })).not.toContain('logo=');
    }
    expect(kioskUrl({ ...base, token: 'no-dots' })).not.toContain('#lic=');
  });

  it('tidies the message to 80 characters without control characters', () => {
    expect(kioskMsg(`  a\u0000b‮c   ${'x'.repeat(100)}`)).toHaveLength(80);
    expect(kioskMsg('a\n\n b')).toBe('a b');
  });
});

describe('embed catalog subset', () => {
  it('covers every literal key the widget modules call t() with', async () => {
    const dir = path.resolve('apps/web/src/tool/embed');
    // Widget-side modules (the tool-side kiosk module uses the full tool catalog).
    const files = (await readdir(dir)).filter((f) => f.endsWith('.ts') && !['kiosk.ts', 'snippet.ts'].includes(f));
    const missing: string[] = [];
    for (const file of files) {
      const src = await readFile(path.join(dir, file), 'utf8');
      for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]/gu)) if (!isEmbedKey(m[1] ?? '')) missing.push(`${file}: ${m[1] ?? ''}`);
    }
    expect(missing).toEqual([]);
  });

  it('includes the seven pill states and every advice code, and nothing unrelated', () => {
    const subset = embedCatalog(en);
    for (const s of ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback']) expect(subset[`tool.pill.${s}`]).toBeTruthy();
    for (const code of [
      'battery_saver',
      'low_power_ios',
      'hidden_document',
      'permissions_policy',
      'insecure_context',
      'unsupported_browser',
      'ios_safari_old',
      'firefox_old',
      'iframe_no_allow',
    ]) {
      expect(subset[`tool.advice.${code}`]).toBeTruthy();
    }
    expect(Object.keys(subset).some((k) => k.startsWith('page.') || k.startsWith('settings.'))).toBe(false);
    expect(Object.keys(subset).length).toBeLessThan(60);
  });
});
