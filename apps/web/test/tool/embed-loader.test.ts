import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry, EMBED_SANDBOX, install, keepsCredit, mountFrame } from '../../src/tool/embed/loader.js';
import { EMBED_CREDIT_URL } from '../../src/tool/embed/protocol.js';
import { creditSnippet, SNIPPET_SANDBOX } from '../../src/tool/embed/snippet.js';

const TITLES = {
  titles: { en: 'Keep screen awake', de: 'Bildschirm wach halten' },
  credits: { en: 'Keep awake by AwakeTab', de: 'Wach gehalten von AwakeTab' },
};

const flush = () => new Promise((r) => setTimeout(r, 0));

function tag(attrs: Record<string, string> = {}, src = 'https://awaketab.com/embed.js'): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = src;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  const holder = document.createElement('div');
  holder.append(script);
  document.body.append(holder);
  return script;
}

function deliver(source: Window | null, origin: string, data: unknown): void {
  window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
}

beforeAll(() => {
  // Unit tests must not fetch the iframe's src over the network; happy-dom's settings are live.
  const hd = (
    window as Window & {
      happyDOM?: { settings: { disableIframePageLoading: boolean; handleDisabledFileLoadingAsSuccess: boolean } };
    }
  ).happyDOM;
  if (hd) {
    hd.settings.disableIframePageLoading = true;
    hd.settings.handleDisabledFileLoadingAsSuccess = true;
  }
});

beforeEach(() => {
  // install() asks the licence endpoint for the credit; unit tests answer as a free domain unless they say otherwise.
  vi.spyOn(window, 'fetch').mockResolvedValue(Response.json({ licensed: false, attribution: true }));
});

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as Window & { AwakeTabEmbed?: unknown }).AwakeTabEmbed;
  vi.restoreAllMocks();
});

describe('embed.js loader (docs/11 §1)', () => {
  it('replaces its tag with a lazy, sandboxed iframe that delegates screen-wake-lock', () => {
    const script = tag({ 'data-size': 'full', 'data-lang': 'de', 'data-theme': 'dark', 'data-preset': 'p60' });
    const holder = script.parentElement;
    const frame = mountFrame(script, createRegistry(window), TITLES);
    expect(frame).not.toBeNull();
    expect(holder?.querySelector('script')).toBeNull();
    expect(holder?.querySelector('iframe')).toBe(frame);
    expect(frame?.getAttribute('allow')).toBe('screen-wake-lock');
    expect(frame?.getAttribute('loading')).toBe('lazy');
    expect(frame?.getAttribute('referrerpolicy')).toBe('strict-origin');
    expect(frame?.getAttribute('sandbox')).toBe(EMBED_SANDBOX);
    expect(frame?.title).toBe('Bildschirm wach halten');
    const src = new URL(frame?.src ?? '');
    expect(`${src.origin}${src.pathname}`).toBe('https://awaketab.com/embed/cook');
    expect(Object.fromEntries(src.searchParams)).toEqual({
      mode: 'cook',
      theme: 'dark',
      lang: 'de',
      size: 'full',
      preset: 'p60',
      host: location.hostname,
    });
    expect(frame?.style.height).toBe('240px');
    expect(frame?.style.width).toBe('100%');
    expect(frame?.style.borderRadius).toBe('28px');
  });

  it('reserves the compact 320 × 104 box (O-58), and 116 in a container under 300 px', () => {
    const frame = mountFrame(tag({ 'data-size': 'compact' }), createRegistry(window), TITLES);
    expect(frame?.style.width).toBe('320px');
    expect(frame?.style.height).toBe('104px');
    expect(frame?.style.borderRadius).toBe('16px');
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(280);
    expect(mountFrame(tag({ 'data-size': 'compact' }), createRegistry(window), TITLES)?.style.height).toBe('116px');
    // A full cook widget in a phone column stacks its kitchen timers (420); other modes keep 240.
    expect(mountFrame(tag({ 'data-size': 'full' }), createRegistry(window), TITLES)?.style.height).toBe('420px');
    expect(mountFrame(tag({ 'data-size': 'full', 'data-mode': 'clock' }), createRegistry(window), TITLES)?.style.height).toBe('240px');
  });

  it('puts the credit link in the host page right after the iframe (O-47)', () => {
    const frame = mountFrame(tag({ 'data-lang': 'de' }), createRegistry(window), TITLES);
    const credit = frame?.nextElementSibling as HTMLElement | null;
    expect(credit?.className).toBe('awaketab-credit');
    const link = credit?.querySelector('a');
    expect(link?.textContent).toBe('Wach gehalten von AwakeTab');
    expect(link?.getAttribute('href')).toBe('https://awaketab.com/?ref=embed&source=embed');
    expect(link?.getAttribute('rel')).toBe('nofollow');
    expect(link?.hasAttribute('target')).toBe(false);
    // Neutral on any site: the host's font and colour, a fixed 24 px line so it never shifts the page.
    expect(link?.style.color).toBe('inherit');
    expect(credit?.style.height).toBe('24px');
    expect(credit?.style.lineHeight).toBe('24px');
    expect(credit?.style.whiteSpace).toBe('nowrap');
    // The bare-iframe snippet carries the same line as plain HTML.
    const doc = new DOMParser().parseFromString(creditSnippet('Wach gehalten von AwakeTab'), 'text/html');
    const pasted = doc.querySelector<HTMLElement>('.awaketab-credit');
    const pastedLink = pasted?.querySelector('a');
    expect(pasted?.style.cssText).toBe(credit?.style.cssText);
    expect(pastedLink?.style.cssText).toBe(link?.style.cssText);
    expect([pastedLink?.getAttribute('href'), pastedLink?.getAttribute('rel'), pastedLink?.textContent]).toEqual([
      link?.getAttribute('href'),
      link?.getAttribute('rel'),
      link?.textContent,
    ]);
  });

  it('keeps the sandbox tokens in step with the documented iframe snippet', () => {
    expect(EMBED_SANDBOX).toBe(SNIPPET_SANDBOX);
    expect(EMBED_SANDBOX.split(' ')).toEqual(expect.arrayContaining(['allow-scripts', 'allow-same-origin', 'allow-popups']));
  });

  it('points the iframe at the origin the loader was served from (preview deployments work)', () => {
    const frame = mountFrame(tag({}, 'https://feature-x.awaketab.pages.dev/embed.js'), createRegistry(window), TITLES);
    expect(frame?.src.startsWith('https://feature-x.awaketab.pages.dev/embed/cook?')).toBe(true);
  });

  it('refuses a tag it cannot derive an http(s) origin from', () => {
    const script = document.createElement('script');
    script.setAttribute('src', 'data:text/javascript,1');
    document.body.append(script);
    expect(mountFrame(script, createRegistry(window), TITLES)).toBeNull();
  });

  it('moves a tag pasted into <head> to the body', () => {
    const script = document.createElement('script');
    script.src = 'https://awaketab.com/embed.js';
    document.head.append(script);
    const frame = mountFrame(script, createRegistry(window), TITLES);
    expect(frame?.parentElement).toBe(document.body);
    expect(document.head.contains(script)).toBe(false);
  });

  it('installs one window.AwakeTabEmbed for several tags', () => {
    const a = tag();
    install(window, a, TITLES);
    const first = (window as Window & { AwakeTabEmbed?: unknown }).AwakeTabEmbed;
    install(window, tag({ 'data-size': 'full' }), TITLES);
    expect((window as Window & { AwakeTabEmbed?: unknown }).AwakeTabEmbed).toBe(first);
    expect(document.querySelectorAll('iframe')).toHaveLength(2);
    expect(document.querySelectorAll('.awaketab-credit')).toHaveLength(2);
  });
});

describe('credit lookup (O-47, docs/11 §11.4)', () => {
  const answer = (body: unknown, ok = true) =>
    vi.spyOn(window, 'fetch').mockResolvedValue(ok ? Response.json(body) : new Response('no', { status: 500 }));

  it('removes the credit only for a licensed domain without attribution', async () => {
    const fetch = answer({ licensed: true, attribution: false, theme: null, expiresAt: null });
    install(window, tag(), TITLES);
    expect(document.querySelector('.awaketab-credit')).not.toBeNull();
    await vi.waitFor(() => {
      expect(document.querySelector('.awaketab-credit')).toBeNull();
    });
    expect(fetch).toHaveBeenCalledWith(`https://awaketab.com/api/embed/config?domain=${location.hostname}`);
  });

  it('keeps the credit for a free domain, a licence that keeps attribution, and a failed lookup', async () => {
    for (const body of [{ licensed: false, attribution: true }, { licensed: true, attribution: true }, 'nope']) {
      answer(body);
      expect(await keepsCredit(window, 'https://awaketab.com')).toBe(true);
      vi.restoreAllMocks();
    }
    answer(null, false);
    expect(await keepsCredit(window, 'https://awaketab.com')).toBe(true);
    vi.spyOn(window, 'fetch').mockRejectedValue(new TypeError('blocked by CSP'));
    install(window, tag(), TITLES);
    await flush();
    await flush();
    expect(document.querySelector('.awaketab-credit a')?.getAttribute('href')).toBe(EMBED_CREDIT_URL);
  });

  it('asks once per widget origin, however many widgets the page holds', async () => {
    const fetch = answer({ licensed: false, attribution: true });
    const cache = {};
    await Promise.all([keepsCredit(window, 'https://awaketab.com', cache), keepsCredit(window, 'https://awaketab.com', cache)]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('window.AwakeTabEmbed postMessage bridge (docs/11 §3)', () => {
  function setup() {
    const registry = createRegistry(window);
    const frame = mountFrame(tag(), registry, TITLES);
    if (!frame) throw new Error('no frame');
    // Iframe loading is disabled in unit tests, so stand in a window object for the widget.
    const posted = vi.fn();
    const win = { postMessage: posted } as unknown as Window;
    Object.defineProperty(frame, 'contentWindow', { configurable: true, get: () => win });
    return { registry, frame, win, posted };
  }

  it('queues commands until the widget is ready, then posts them to the widget origin only', () => {
    const { registry, win, posted } = setup();
    registry.start({ preset: 'p30' });
    expect(posted).not.toHaveBeenCalled();
    deliver(win, 'https://awaketab.com', { type: 'awaketab:ready', version: '1' });
    expect(posted).toHaveBeenCalledWith({ type: 'awaketab:start', preset: 'p30' }, 'https://awaketab.com');
    registry.stop();
    registry.setTheme('oled');
    expect(posted).toHaveBeenLastCalledWith({ type: 'awaketab:theme', theme: 'oled' }, 'https://awaketab.com');
    expect(posted.mock.calls.every((c) => c[1] === 'https://awaketab.com')).toBe(true);
  });

  it('drops malformed page commands before they reach the widget', () => {
    const { registry, win, posted } = setup();
    deliver(win, 'https://awaketab.com', { type: 'awaketab:ready', version: '1' });
    registry.start({ preset: 'p999' });
    registry.setTheme('neon' as 'dark');
    expect(posted).not.toHaveBeenCalled();
  });

  it('emits state only for messages from its own frame and the widget origin', () => {
    const { registry, frame, win } = setup();
    const seen: string[] = [];
    registry.on('state', (d) => seen.push(`${String(d.lock)}:${d.frame === frame ? 'frame' : 'other'}`));
    const state = { type: 'awaketab:state', lock: 'held', status: 'active', endsAt: null, mode: 'cook' };
    deliver(win, 'https://evil.example', state); // wrong origin
    deliver(window, 'https://awaketab.com', state); // right origin, wrong source
    deliver(null, 'https://awaketab.com', state); // no source
    expect(seen).toEqual([]);
    deliver(win, 'https://awaketab.com', state);
    expect(seen).toEqual(['held:frame']);
  });

  it('applies resize requests but never below the reserved box', () => {
    const { frame, win } = setup();
    deliver(win, 'https://awaketab.com', { type: 'awaketab:resize', height: 150 });
    expect(frame.style.height).toBe('150px');
    deliver(win, 'https://awaketab.com', { type: 'awaketab:resize', height: 40 });
    expect(frame.style.height).toBe('104px');
    deliver(win, 'https://evil.example', { type: 'awaketab:resize', height: 600 });
    expect(frame.style.height).toBe('104px');
  });

  it('unsubscribes', () => {
    const { registry, win } = setup();
    const cb = vi.fn();
    const off = registry.on('ready', cb);
    off();
    deliver(win, 'https://awaketab.com', { type: 'awaketab:ready', version: '1' });
    expect(cb).not.toHaveBeenCalled();
  });
});
