import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ISession } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import de from '../../src/i18n/de.json';
import en from '../../src/i18n/en.json';
import { createFakeApi } from '../../../../packages/wake/test/fake.js';
import { bootEmbed, digitsFor, PILL_GLYPH, planFor, type IEmbedApp } from '../../src/tool/embed/app.js';
import { embedCatalog } from '../../src/tool/embed/catalog.js';
import { formatClock } from '../../src/tool/embed/clock.js';
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
    .replace(
      /<script is:inline type="application\/json" data-embed-catalogs\s*\/>/u,
      '<script type="application/json" data-embed-catalogs></script>',
    );
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
    expect(planFor({ preset: 'p30', until: null })).toEqual({
      plan: { type: 'duration', ms: 1_800_000 },
      presetId: 'p30',
    });
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
    expect(digitsFor({ ...base, lock: 'idle', session: null, now: 0, params: { preset: 'p15', until: null } })).toEqual(
      {
        text: '15:00',
        muted: true,
      },
    );
  });

  it('runs elapsed time while held and freezes it when the lock is lost or the clock paused', () => {
    const s = session({});
    expect(digitsFor({ ...base, lock: 'held', session: s, now: 1_065_000 })).toEqual({ text: '01:05', muted: false });
    expect(digitsFor({ ...base, lock: 'lost', session: s, now: 1_065_000 }).muted).toBe(true);
    expect(
      digitsFor({ ...base, lock: 'held', session: session({ status: 'paused', pausedAt: 1_030_000 }), now: 1_065_000 }),
    ).toEqual({
      text: '00:30',
      muted: true,
    });
  });

  it('counts down a duration plan', () => {
    const s = session({ plan: { type: 'duration', ms: 600_000 }, endsAt: 1_600_000 });
    expect(digitsFor({ ...base, lock: 'fallback', session: s, now: 1_060_000 }).text).toBe('09:00');
  });
});

describe('formatClock (DESIGN.md §4: MM:SS, H:MM:SS, 1d 02:15:00)', () => {
  it('uses the shortest form for the length', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(59 * 60_000 + 59_000)).toBe('59:59');
    expect(formatClock(3_600_000)).toBe('1:00:00');
    expect(formatClock(12 * 3_600_000 + 59 * 60_000 + 59_000)).toBe('12:59:59');
    expect(formatClock(86_400_000 + 2 * 3_600_000 + 15 * 60_000)).toBe('1d 02:15:00');
  });
});

describe('pill glyphs (DESIGN.md §2.3: shape carries the state)', () => {
  it('gives lost, denied and fallback their own shapes', () => {
    const shapes = new Set(['lost', 'denied', 'fallback'].map((s) => PILL_GLYPH[s]));
    expect(shapes.size).toBe(3);
  });
});

describe('bootEmbed (/embed/cook)', () => {
  it('renders in the requested language and holds the lock after Start', async () => {
    const { app, root } = mount('?mode=cook&theme=light&lang=de&size=compact&preset=pinf');
    current = app;
    expect(document.documentElement.lang).toBe('de');
    expect(document.title).toBe(de['embed.frame.title']);
    expect(root.querySelector('[data-pill-text]')?.textContent).toBe(de['tool.pill.idle']);
    // O-47: the credit lives in the host page (the loader inserts it), never inside the frame.
    const visible = root.cloneNode(true) as HTMLElement;
    for (const script of visible.querySelectorAll('script')) script.remove();
    expect(visible.textContent).not.toContain(de['embed.attribution']);
    expect(root.querySelector('a[href*="ref=embed"]')).toBeNull();
    const toggle = root.querySelector<HTMLButtonElement>('[data-embed-toggle]');
    expect(toggle?.textContent.trim()).toBe(de['embed.start']);
    toggle?.click();
    await vi.waitFor(() => {
      expect(root.querySelector('[data-pill]')?.getAttribute('data-lock')).toBe('held');
    });
    expect(root.dataset.lock).toBe('held');
    expect(root.querySelector('[data-pill-text]')?.textContent).toBe(de['tool.pill.held']);
    // A label that changes (Start → Stop) is not also a toggle button (no aria-pressed).
    expect(toggle?.dataset.kind).toBe('stop');
    expect(toggle?.textContent.trim()).toBe(de['tool.ring.stop']);
    expect(toggle?.hasAttribute('aria-pressed')).toBe(false);
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
    const clock = root.querySelector<HTMLButtonElement>('[data-embed-clock]');
    expect(clock?.getAttribute('aria-label')).toMatch(/^Pause the timer, \d{2}:\d{2}$/u);
    clock?.click();
    expect(app.state()).toMatchObject({ lock: 'held', status: 'paused' });
    expect(root.querySelector('[data-embed-hint]')?.textContent).toBe(en['embed.cook.resume']);
    expect(clock?.getAttribute('aria-pressed')).toBe('true');
    expect(clock?.getAttribute('aria-label')).toMatch(/^Resume the timer, /u);
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
    expect(root.querySelector<HTMLElement>('[data-embed-notice]')?.dataset.tone).toBe('bad');
    expect(root.querySelector<HTMLElement>('[data-embed-notice-link]')?.hidden).toBe(true);
    // Board EmbedEdge: after a denial the action reads Retry (a strong neutral, DESIGN.md §6).
    const toggle = root.querySelector<HTMLElement>('[data-embed-toggle]');
    expect(toggle?.dataset.kind).toBe('retry');
    expect(toggle?.textContent.trim()).toBe(en['tool.advice.retry']);
  });

  it('writes the full size meta line and footer, and the minimal note', async () => {
    const full = mount('?lang=en&size=full&mode=standard');
    current = full.app;
    expect(full.root.querySelector('[data-embed-hint]')?.textContent).toBe(en['embed.advice.tapToStart']);
    expect(full.root.querySelector('[data-embed-foot]')?.textContent).toBe(en['embed.foot']);
    full.root.querySelector<HTMLButtonElement>('[data-embed-toggle]')?.click();
    await vi.waitFor(() => {
      expect(full.app.state().lock).toBe('held');
    });
    expect(full.root.querySelector('[data-embed-hint]')?.textContent).toMatch(/^Since \d{1,2}:\d{2}/u);
    full.app.destroy();
    const minimal = mount('?lang=en&size=compact&mode=minimal');
    current = minimal.app;
    const note = minimal.root.querySelector<HTMLElement>('[data-embed-note]');
    expect(note?.hidden).toBe(false);
    expect(note?.textContent).toBe(en['embed.minimal.idle']);
  });

  it('asks for the licence with no domain when it cannot verify its parent', async () => {
    const { app } = mount('?lang=en&host=recipes.example');
    current = app;
    await flush();
    expect(fetch).not.toHaveBeenCalled();
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
