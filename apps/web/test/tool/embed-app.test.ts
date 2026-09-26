import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ISession } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import de from '../../src/i18n/de.json';
import en from '../../src/i18n/en.json';
import { createFakeApi } from '../../../../packages/wake/test/fake.js';
import { bootEmbed, digitsFor, planFor, type IEmbedApp } from '../../src/tool/embed/app.js';
import { embedCatalog } from '../../src/tool/embed/catalog.js';
import { EMBED_SETTINGS_KEY } from '../../src/tool/embed/settings.js';
import { setCatalog } from '../../src/tool/i18n.js';

const tracked = vi.hoisted(() => [] as Array<[string, Record<string, unknown>, Record<string, unknown>]>);
vi.mock('../../src/lib/analytics.js', () => ({
  track: (event: string, params: Record<string, unknown>, opts: Record<string, unknown>) => {
    tracked.push([event, params, opts]);
  },
}));

// The widget markup from the page itself, so the test and /embed/cook cannot drift apart.
const page = readFileSync(path.resolve('apps/web/src/pages/embed/cook.astro'), 'utf8');
const markup = /<main[\s\S]*<\/main>/u.exec(page)?.[0] ?? '';

function mount(search: string): { app: IEmbedApp; root: HTMLElement; fake: ReturnType<typeof createFakeApi> } {
  const fake = createFakeApi();
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: fake.api });
  history.replaceState(null, '', `/embed/cook${search}`);
  document.body.innerHTML = markup
    .replace(/\{t\('[^']+'\)\}/gu, '')
    .replace(/set:html=\{catalogs\}/u, '')
    .replace(/<script is:inline type="application\/json" data-embed-catalogs\s*\/>/u, '<script type="application/json" data-embed-catalogs></script>');
  const catalogs = document.querySelector('[data-embed-catalogs]');
  if (catalogs) catalogs.textContent = JSON.stringify({ en: embedCatalog(en), de: embedCatalog(de) });
  const root = document.querySelector<HTMLElement>('#awaketab-embed') as HTMLElement;
  const app = bootEmbed(root, window);
  return { app, root, fake };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
let current: IEmbedApp | null = null;

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ licensed: false, attribution: true }));
});

afterEach(() => {
  current?.destroy();
  current = null;
  vi.restoreAllMocks();
  localStorage.clear();
  setCatalog(en);
  delete (navigator as Navigator & { wakeLock?: unknown }).wakeLock;
});

describe('planFor', () => {
  it('maps presets, explicit ms and until', () => {
    expect(planFor({ preset: 'pinf', until: null })).toEqual({ plan: { type: 'indefinite' }, presetId: 'pinf' });
    expect(planFor({ preset: 'p30', until: null })).toEqual({ plan: { type: 'duration', ms: 1_800_000 }, presetId: 'p30' });
    expect(planFor({ preset: 'pinf', until: null }, { type: 'awaketab:start', ms: 120_000 })).toEqual({
      plan: { type: 'duration', ms: 120_000 },
      presetId: 'custom',
    });
    expect(planFor({ preset: 'pinf', until: null }, { type: 'awaketab:start', until: '18:00' }).presetId).toBe('until');
    expect(planFor({ preset: 'until', until: null }).presetId).toBe('pinf');
  });
});

describe('digitsFor — only held/fallback run the clock', () => {
  const session = (over: Partial<ISession>): ISession =>
    ({
      id: 's',
      plan: { type: 'indefinite' },
      presetId: 'pinf',
      mode: 'cook',
      startedAt: 1_000_000,
      endsAt: null,
      status: 'active',
      pausedAt: null,
      pausedMs: 0,
      ...over,
    }) as ISession;
  const base = { mode: 'cook' as const, params: { preset: 'pinf' as const, until: null }, locale: 'en' };

  it('shows the preset length, muted, before a session', () => {
    expect(digitsFor({ ...base, lock: 'idle', session: null, now: 0, params: { preset: 'p15', until: null } })).toEqual({
      text: '00:15:00',
      muted: true,
    });
  });

  it('runs elapsed time while held and freezes it when the lock is lost or the clock paused', () => {
    const s = session({});
    expect(digitsFor({ ...base, lock: 'held', session: s, now: 1_065_000 })).toEqual({ text: '00:01:05', muted: false });
    expect(digitsFor({ ...base, lock: 'lost', session: s, now: 1_065_000 }).muted).toBe(true);
    expect(digitsFor({ ...base, lock: 'held', session: session({ status: 'paused', pausedAt: 1_030_000 }), now: 1_065_000 })).toEqual({
      text: '00:00:30',
      muted: true,
    });
  });

  it('counts down a duration plan', () => {
    const s = session({ plan: { type: 'duration', ms: 600_000 }, endsAt: 1_600_000 });
    expect(digitsFor({ ...base, lock: 'fallback', session: s, now: 1_060_000 }).text).toBe('00:09:00');
  });
});

describe('bootEmbed (/embed/cook)', () => {
  it('renders in the requested language and holds the lock after Start', async () => {
    const { app, root } = mount('?mode=cook&theme=light&lang=de&size=compact&preset=pinf');
    current = app;
    expect(document.documentElement.lang).toBe('de');
    expect(document.title).toBe(de['embed.frame.title']);
    expect(root.querySelector('[data-pill-text]')?.textContent).toBe(de['tool.pill.idle']);
    expect(root.querySelector('[data-embed-attrib] a')?.textContent).toBe(de['embed.attribution']);
    const toggle = root.querySelector<HTMLButtonElement>('[data-embed-toggle]');
    toggle?.click();
    await vi.waitFor(() => {
      expect(root.querySelector('[data-pill]')?.getAttribute('data-lock')).toBe('held');
    });
    expect(root.querySelector('[data-pill-text]')?.textContent).toBe(de['tool.pill.held']);
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
    expect(app.state()).toMatchObject({ lock: 'held', status: 'active', mode: 'cook' });
    toggle?.click();
    await vi.waitFor(() => {
      expect(app.state().lock).toBe('idle');
    });
  });

  it('pauses the clock but keeps the lock on a timer tap (cook mode)', async () => {
    const { app, root } = mount('?mode=cook&lang=en');
    current = app;
    root.querySelector<HTMLButtonElement>('[data-embed-toggle]')?.click();
    await vi.waitFor(() => {
      expect(app.state().lock).toBe('held');
    });
    root.querySelector<HTMLButtonElement>('[data-embed-clock]')?.click();
    expect(app.state()).toMatchObject({ lock: 'held', status: 'paused' });
    expect(root.querySelector('[data-embed-hint]')?.textContent).toBe(en['ambient.cook.resume']);
    root.querySelector<HTMLButtonElement>('[data-embed-clock]')?.click();
    await vi.waitFor(() => {
      expect(app.state().status).toBe('active');
    });
  });

  it('shows the honest denied state with power advice', async () => {
    const { app, root, fake } = mount('?lang=en');
    current = app;
    fake.rejectNextWith(new DOMException('battery', 'NotAllowedError'));
    root.querySelector<HTMLButtonElement>('[data-embed-toggle]')?.click();
    await vi.waitFor(() => {
      expect(app.state().lock).toBe('denied');
    });
    expect(root.querySelector('[data-pill-text]')?.textContent).toBe(en['tool.pill.denied']);
    expect(root.querySelector<HTMLElement>('[data-embed-notice]')?.hidden).toBe(false);
    expect(root.querySelector('[data-embed-notice-text]')?.textContent).toBe(en['tool.advice.battery_saver']);
    expect(root.querySelector<HTMLElement>('[data-embed-notice-link]')?.hidden).toBe(true);
  });

  it('asks for the licence with no domain when it cannot verify its parent, and keeps the attribution', async () => {
    const { app, root } = mount('?lang=en&host=recipes.example');
    current = app;
    await flush();
    expect(fetch).not.toHaveBeenCalled();
    expect(root.querySelector<HTMLElement>('[data-embed-attrib]')?.hidden).toBe(false);
  });

  it('tracks with source embed and the /embed/cook path', async () => {
    tracked.length = 0;
    const { app } = mount('?lang=en');
    current = app;
    await vi.waitFor(() => {
      expect(tracked.some(([event]) => event === 'page_view')).toBe(true);
    });
    const [, , opts] = tracked.find(([event]) => event === 'page_view') ?? [];
    expect(opts).toMatchObject({ source: 'embed', path: '/embed/cook', locale: 'en' });
  });

  it('writes nothing to the app’s at.v1.* keys', async () => {
    const { app, root } = mount('?lang=en&size=full');
    current = app;
    root.querySelector<HTMLButtonElement>('[data-embed-toggle]')?.click();
    await vi.waitFor(() => {
      expect(app.state().lock).toBe('held');
    });
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('at.'));
    expect(keys.every((k) => k === EMBED_SETTINGS_KEY)).toBe(true);
  });
});
