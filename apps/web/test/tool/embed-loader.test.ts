import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createRegistry, EMBED_SANDBOX, install, mountFrame } from '../../src/tool/embed/loader.js';
import { SNIPPET_SANDBOX } from '../../src/tool/embed/snippet.js';

const TITLES = { en: 'Keep screen awake', de: 'Bildschirm wach halten' };

function tag(attrs: Record<string, string> = {}, src = 'https://awaketab.com/embed.js'): HTMLScriptElement {
  const script = document.createElement('script');
  script.src = src;
  for (const [k, v] of Object.entries(attrs)) script.setAttribute(k, v);
  const holder = document.createElement('div');
  holder.append(script);
  document.body.append(holder);
  return script;
}

/** Dispatches a message on `window` as if `source` posted it from `origin`. */
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

afterEach(() => {
  document.body.innerHTML = '';
  delete (window as Window & { AwakeTabEmbed?: unknown }).AwakeTabEmbed;
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
    expect(frame.style.height).toBe('96px');
    deliver(win, 'https://evil.example', { type: 'awaketab:resize', height: 600 });
    expect(frame.style.height).toBe('96px');
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
