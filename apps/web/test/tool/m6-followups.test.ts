import { dayKey, DEFAULT_STATS } from '@awaketab/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount as mountFocus } from '../../src/tool/ambient/focus.js';
import { mirrorAmbient, PIP_PRO_SIZE, PIP_SIZE, pipPath, togglePip } from '../../src/tool/ambient/pip-window.js';
import { mountSponsor } from '../../src/tool/sponsor.js';
import { license, makeCtx } from './ctx-helper.js';

// The layer's lazily loaded stylesheet: a data URL, so the test DOM never fetches from a server.
vi.mock('../../src/styles/ambient.css?url', () => ({ default: 'data:text/css,' }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// ── 2. Focus mode: "N focus blocks today" ───────────────────────────────────────────────────────

describe('focus mode — focus blocks today (docs/05 §3.14)', () => {
  it('shows the count from at.v1.stats.dayFocus and hides the line at zero', () => {
    const a = makeCtx();
    const stage = document.createElement('div');
    const off = mountFocus(stage, a.ctx);
    expect(stage.querySelector<HTMLElement>('[data-focus-today]')?.hidden).toBe(true);
    off();

    const b = makeCtx();
    b.storage.writeStats({
      ...DEFAULT_STATS,
      dayFocus: { [dayKey(Date.now())]: 3, '2020-01-01': 9 },
    });
    const stage2 = document.createElement('div');
    const off2 = mountFocus(stage2, b.ctx);
    const line = stage2.querySelector<HTMLElement>('[data-focus-today]');
    expect(line?.hidden).toBe(false);
    expect(line?.textContent).toBe('3 focus blocks today');
    off2();
  });

  it('uses the singular for one block', () => {
    const { ctx, storage } = makeCtx();
    storage.writeStats({
      ...DEFAULT_STATS,
      dayFocus: { [dayKey(Date.now())]: 1 },
    });
    const stage = document.createElement('div');
    const off = mountFocus(stage, ctx);
    expect(stage.querySelector('[data-focus-today]')?.textContent).toBe('1 focus block today');
    off();
  });

  it('"Start a focus block" marks the session so its completion counts as a block', async () => {
    const { ctx, store, engine } = makeCtx();
    store.set({ ui: { mode: 'focus' } });
    const stage = document.createElement('div');
    const off = mountFocus(stage, ctx);
    stage.querySelector<HTMLButtonElement>('[data-focus-start]')?.click();
    await vi.waitFor(() => {
      expect(engine.session?.modeState.focusBlock).toBe(true);
    });
    expect(engine.session?.mode).toBe('focus');
    off();
    ctx.stop();
  });
});

// ── 4. SponsorCard inside the ExtendPrompt ──────────────────────────────────────────────────────

const SPONSOR = {
  enabled: true,
  id: 'acme',
  name: 'Acme Lamps',
  text: 'Desk lamps that stay on as long as your screen does.',
  url: 'https://acme.example/lamps',
};

const SLOT = (placement: string) =>
  `<aside class="at-sponsor" data-sponsor="${placement}" data-state="hidden"><span>Sponsored</span><a data-sponsor-link href="/pro">Sponsored</a><p data-sponsor-text></p></aside>`;
const SPONSOR_HTML = `${SLOT('idle')}<div class="at-ask">${SLOT('extend')}</div>`;

describe('SponsorCard slots (docs/05 §3.23)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubFetch = (body: unknown) => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  it('fills both the idle and the extend slot from the same /config/sponsor.json', async () => {
    const fetchMock = stubFetch(SPONSOR);
    const { ctx, root } = makeCtx({ html: SPONSOR_HTML });
    const off = await mountSponsor(ctx);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual(['/config/sponsor.json', { cache: 'no-cache' }]);
    for (const placement of ['idle', 'extend']) {
      const slot = root.querySelector<HTMLElement>(`[data-sponsor="${placement}"]`);
      expect(slot?.querySelector<HTMLAnchorElement>('[data-sponsor-link]')?.href).toBe(SPONSOR.url);
      expect(slot?.querySelector('[data-sponsor-link]')?.textContent).toBe(SPONSOR.name);
      expect(slot?.querySelector('[data-sponsor-text]')?.textContent).toBe(SPONSOR.text);
    }
    const extend = root.querySelector<HTMLElement>('[data-sponsor="extend"]');
    expect(extend?.hidden).toBe(false);
    expect(extend?.dataset.state).toBe('shown');
    off();
  });

  it('keeps the extend slot at its reserved size while the session runs, and fires one sponsor_view', async () => {
    stubFetch(SPONSOR);
    const { ctx, root, store, tracked } = makeCtx({ html: SPONSOR_HTML });
    // A session is live: the idle slot hides (visibility), the extend slot is untouched.
    store.set({ lock: 'held', session: { status: 'active' } as never });
    const off = await mountSponsor(ctx);
    const idle = root.querySelector<HTMLElement>('[data-sponsor="idle"]');
    expect(idle?.dataset.state).toBe('hidden');
    expect(idle?.inert).toBe(true);
    expect(tracked.filter(([e]) => e === 'sponsor_view')).toHaveLength(0);
    // The ExtendPrompt opens (the grace period keeps the lock held): the card there is what the user sees.
    // Time's up shows the extend slot inside its card (canvas dockAsk).
    store.set({ ui: { ask: { until: Date.now() + 60_000, fb: false } } });
    expect(tracked.filter(([e]) => e === 'sponsor_view')).toEqual([['sponsor_view', { sponsorId: 'acme' }]]);
    // Back to idle: no second view in the same page view.
    store.set({ lock: 'idle', session: null, ui: { dialog: null } });
    expect(idle?.dataset.state).toBe('shown');
    expect(tracked.filter(([e]) => e === 'sponsor_view')).toHaveLength(1);
    root
      .querySelector<HTMLAnchorElement>('[data-sponsor="extend"] [data-sponsor-link]')
      ?.dispatchEvent(new MouseEvent('click'));
    expect(tracked.filter(([e]) => e === 'sponsor_click')).toEqual([['sponsor_click', { sponsorId: 'acme' }]]);
    off();
  });

  it('collapses the extend slot for Pro ads.free without fetching', async () => {
    const fetchMock = stubFetch(SPONSOR);
    const { ctx, root } = makeCtx({
      html: SPONSOR_HTML,
      license: license(['ads.free']),
    });
    await mountSponsor(ctx);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(root.querySelector<HTMLElement>('[data-sponsor="extend"]')?.hidden).toBe(true);
    // The idle slot keeps its reserved box (CLS 0), empty and invisible.
    const idle = root.querySelector<HTMLElement>('[data-sponsor="idle"]');
    expect(idle?.hidden).toBe(false);
    expect(idle?.dataset.state).toBe('hidden');
  });

  it('collapses the extend slot when the config is off or invalid', async () => {
    stubFetch({ enabled: false });
    const { ctx, root } = makeCtx({ html: SPONSOR_HTML });
    await mountSponsor(ctx);
    expect(root.querySelector<HTMLElement>('[data-sponsor="extend"]')?.hidden).toBe(true);
  });
});

// ── 3. /pip popup in the opener's language ──────────────────────────────────────────────────────

describe('pipPath (docs/05 §9)', () => {
  it.each([
    ['en', '/pip'],
    ['', '/pip'],
    ['es', '/es/pip'],
    ['pt-BR', '/pt-br/pip'],
    ['de', '/de/pip'],
    ['fr', '/fr/pip'],
    ['ja', '/ja/pip'],
    ['zh-Hans', '/zh/pip'],
    ['hi', '/hi/pip'],
    ['it', '/pip'],
    ['../evil', '/pip'],
    ['es/../../x', '/pip'],
  ])('%s → %s', (lang, path) => {
    expect(pipPath(lang)).toBe(path);
  });

  it('the popup fallback opens the page language', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    document.documentElement.lang = 'pt-BR';
    const { ctx } = makeCtx();
    expect(await togglePip(ctx)).toBe('blocked');
    expect(open.mock.calls[0]?.[0]).toBe('/pt-br/pip');
    document.documentElement.lang = 'en';
    open.mockRestore();
  });
});

// ── 5. pip.pro: ambient digits inside Document PiP ──────────────────────────────────────────────

const PIP_HTML = `
  <div data-pip-slot><output data-pill data-lock="idle"><span data-pill-text>Ready</span></output><div data-timer>00:30:00</div></div>
  <dialog data-ambient><div data-ambient-stage><div data-ambient-content></div></div></dialog>`;

function fakePipWindow() {
  const doc = document.implementation.createHTMLDocument('pip');
  const win = Object.assign(new EventTarget(), {
    document: doc,
    closed: false,
    close() {
      win.closed = true;
      win.dispatchEvent(new Event('pagehide'));
    },
  });
  return win;
}

describe('pip.pro ambient layout (docs/05 §9)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clones the clock digits under the pill with an AM/PM · date kicker; standard falls back', async () => {
    const { ctx, root, store } = makeCtx({ html: PIP_HTML });
    const content = root.querySelector<HTMLElement>('[data-ambient-content]');
    if (content) {
      content.innerHTML =
        '<time class="at-am-clock" data-clock><span>2</span><span class="at-am-colon">:</span><span data-m>05</span>' +
        '<span class="at-am-suffix"><span class="at-am-ap">PM</span><span class="at-am-sec"></span></span></time>' +
        '<p class="at-am-date">Monday, 28 September 2026</p>';
    }
    const body = document.implementation.createHTMLDocument('pip').body;
    body.append(root.querySelector('[data-pill]') as Node, root.querySelector('[data-timer]') as Node);
    store.set({ ui: { mode: 'clock' } });
    const off = mirrorAmbient(ctx, body);
    const box = body.querySelector('.at-pip-ambient');
    expect(box?.querySelector('.at-pip-kick')?.textContent).toBe('PM · Monday, 28 September 2026');
    expect(box?.querySelector('[data-clock]')?.textContent).toBe('2:05PM');
    expect(body.hasAttribute('data-ambient')).toBe(true);
    // The honest pill is still in the window.
    expect(body.querySelector('[data-pill]')).not.toBeNull();

    const src = content?.querySelector('[data-m]');
    if (src) src.textContent = '06';
    await flush();
    expect(box?.querySelector('[data-clock]')?.textContent).toBe('2:06PM');

    store.set({ ui: { mode: 'standard' } });
    expect(box?.childElementCount).toBe(0);
    expect(body.hasAttribute('data-ambient')).toBe(false);
    off();
  });

  it('shows the focus phase and interval only while a block runs', () => {
    const { ctx, root, store } = makeCtx({ html: PIP_HTML });
    const content = root.querySelector<HTMLElement>('[data-ambient-content]');
    if (content) {
      content.innerHTML =
        '<div class="at-am-frow" data-focus-label hidden><span class="at-am-phase"></span><span class="at-am-cycle"></span>' +
        '<span class="at-focus-dots"></span></div><div class="at-am-fdigits" data-focus-digits>25<span>:00</span></div>';
    }
    const body = document.implementation.createHTMLDocument('pip').body;
    store.set({ ui: { mode: 'focus' } });
    const off = mirrorAmbient(ctx, body);
    // Before a block starts the focus digits are the preview, not a countdown: keep the plain timer.
    expect(body.hasAttribute('data-ambient')).toBe(false);
    const label = content?.querySelector<HTMLElement>('[data-focus-label]');
    if (label) {
      label.hidden = false;
      const [phase, cycle] = label.children;
      if (phase) phase.textContent = 'Focus';
      if (cycle) cycle.textContent = 'Cycle 2 of 4';
    }
    store.set({ ui: { mode: 'focus' } });
    // PipWindow canvas: "Focus · Cycle 2 of 4" kicker, then the interval digits with the dimmed seconds.
    expect(body.querySelector('.at-pip-kick')?.textContent).toBe('Focus · Cycle 2 of 4');
    expect(body.querySelector('.at-pip-ambient [data-focus-digits]')?.innerHTML).toBe('25<span>:00</span>');
    expect(body.hasAttribute('data-ambient')).toBe(true);
    off();
  });

  it('only pip.pro gets the taller window and the ambient layer', async () => {
    for (const [lic, size, ambient] of [
      [null, PIP_SIZE, false],
      [license(['pip.pro']), PIP_PRO_SIZE, true],
    ] as const) {
      const win = fakePipWindow();
      const requestWindow = vi.fn(() => Promise.resolve(win));
      vi.stubGlobal('documentPictureInPicture', { requestWindow });
      const { ctx, store } = makeCtx({ html: PIP_HTML, license: lic });
      store.set({ ui: { mode: 'clock' } });
      expect(await togglePip(ctx)).toBe('document');
      expect(requestWindow).toHaveBeenCalledWith(size);
      expect(win.document.body.querySelector('.at-pip-ambient') !== null).toBe(ambient);
      expect(win.document.body.querySelector('[data-pill]')).not.toBeNull();
      win.close();
      expect(store.get().ui.pip).toBe('closed');
      vi.unstubAllGlobals();
    }
  });
});
