import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyBranding,
  fetchEmbedConfig,
  FREE_CONFIG,
  luminance,
  onAccent,
  parseEmbedConfig,
} from '../../src/tool/embed/config.js';
import {
  DEFAULT_EMBED_SETTINGS,
  EMBED_SETTINGS_KEY,
  readEmbedSettings,
  writeEmbedSettings,
} from '../../src/tool/embed/settings.js';

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe('embed config client (docs/11 §2)', () => {
  it('removes the attribution only for licensed + attribution:false', () => {
    expect(
      parseEmbedConfig({ licensed: true, attribution: false, theme: { accent: '#0F766E', scheme: 'dark' } }),
    ).toEqual({
      licensed: true,
      attribution: false,
      accent: '#0f766e',
      scheme: 'dark',
    });
    expect(parseEmbedConfig({ licensed: false, attribution: false }).attribution).toBe(true);
    expect(parseEmbedConfig({ licensed: 'true', attribution: false }).attribution).toBe(true);
    expect(parseEmbedConfig({ licensed: true }).attribution).toBe(true);
  });

  it('ignores brand values that are not a #RRGGBB accent or a known scheme', () => {
    const cfg = parseEmbedConfig({
      licensed: true,
      attribution: false,
      theme: { accent: 'red; background:url(x)', scheme: 'neon' },
    });
    expect(cfg.accent).toBeNull();
    expect(cfg.scheme).toBeNull();
    expect(parseEmbedConfig({ licensed: false, theme: { accent: '#123456' } }).accent).toBeNull();
    expect(parseEmbedConfig(null)).toEqual(FREE_CONFIG);
  });

  it('asks the API with the verified domain and falls back to free on any failure', async () => {
    const fetchOk = vi.fn(() => Promise.resolve(Response.json({ licensed: true, attribution: false })));
    expect((await fetchEmbedConfig('recipes.example', fetchOk as unknown as typeof fetch)).attribution).toBe(false);
    expect(fetchOk).toHaveBeenCalledWith('/api/embed/config?domain=recipes.example', expect.anything());
    const fail = vi.fn(() => Promise.reject(new Error('offline')));
    expect(await fetchEmbedConfig('recipes.example', fail as unknown as typeof fetch)).toEqual(FREE_CONFIG);
    const status500 = vi.fn(() => Promise.resolve(new Response('x', { status: 500 })));
    expect(await fetchEmbedConfig('recipes.example', status500 as unknown as typeof fetch)).toEqual(FREE_CONFIG);
    const never = vi.fn();
    expect(await fetchEmbedConfig(null, never as unknown as typeof fetch)).toEqual(FREE_CONFIG);
    expect(never).not.toHaveBeenCalled();
  });

  it('gives up on a hung lookup after the timeout', async () => {
    vi.useFakeTimers();
    const hang = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
    const pending = fetchEmbedConfig('recipes.example', hang as unknown as typeof fetch, 1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toEqual(FREE_CONFIG);
  });

  it('picks a black or white label with at least 4.5:1 contrast on any brand colour', () => {
    const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    for (let r = 0; r <= 255; r += 51) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 51) {
          const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
          const label = onAccent(hex) === '#000000' ? 0 : 1;
          expect(contrast(luminance(hex), label), hex).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('applies the brand colour to the Start button only, for licensed configs', () => {
    const root = document.createElement('main');
    applyBranding(root, FREE_CONFIG);
    expect(root.style.getPropertyValue('--at-embed-brand')).toBe('');
    applyBranding(root, { licensed: true, attribution: false, accent: '#ffe066', scheme: null });
    expect(root.style.getPropertyValue('--at-embed-brand')).toBe('#ffe066');
    expect(root.style.getPropertyValue('--at-embed-on-brand')).toBe('#000000');
    // The pill and focus ring keep the lamp and state tones, so a state never changes meaning (board EmbedEdge).
    expect(root.style.getPropertyValue('--at-accent')).toBe('');
    expect(root.style.getPropertyValue('--at-focus')).toBe('');
  });
});

describe('at.v1.embed.settings (docs/11 §7)', () => {
  const timer = { id: 'a1', name: 'Pasta', durationMs: 600_000, endsAt: 1_000_000, doneAt: null };

  it('round-trips kitchen timers under its own key', () => {
    expect(readEmbedSettings(localStorage)).toEqual(DEFAULT_EMBED_SETTINGS);
    expect(writeEmbedSettings(localStorage, { v: 1, cookTimers: [timer] })).toBe(true);
    expect(JSON.parse(localStorage.getItem(EMBED_SETTINGS_KEY) ?? '{}')).toEqual({ v: 1, cookTimers: [timer] });
    expect(readEmbedSettings(localStorage).cookTimers).toEqual([timer]);
    expect(Object.keys(localStorage).filter((k) => k.startsWith('at.v1.') && k !== EMBED_SETTINGS_KEY)).toEqual([]);
  });

  it('reads defensively: corrupt JSON, bad timers, blocked storage', () => {
    localStorage.setItem(EMBED_SETTINGS_KEY, '{nope');
    expect(readEmbedSettings(localStorage)).toEqual(DEFAULT_EMBED_SETTINGS);
    localStorage.setItem(EMBED_SETTINGS_KEY, JSON.stringify({ cookTimers: [timer, { id: 1 }, timer, timer, timer] }));
    expect(readEmbedSettings(localStorage).cookTimers).toHaveLength(3);
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readEmbedSettings(throwing)).toEqual(DEFAULT_EMBED_SETTINGS);
    expect(writeEmbedSettings(throwing, DEFAULT_EMBED_SETTINGS)).toBe(false);
    expect(readEmbedSettings(null)).toEqual(DEFAULT_EMBED_SETTINGS);
  });
});
