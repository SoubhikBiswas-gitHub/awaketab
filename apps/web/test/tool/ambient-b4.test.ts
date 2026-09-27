import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount as mountCook } from '../../src/tool/ambient/cook.js';
import { at, digits, short, split } from '../../src/tool/ambient/fmt.js';
import { dateLong } from '../../src/tool/format.js';
import { mount as mountFocus } from '../../src/tool/ambient/focus.js';
import { mount as mountMessage } from '../../src/tool/ambient/message.js';
import { togglePip } from '../../src/tool/ambient/pip-window.js';
import { license, makeCtx } from './ctx-helper.js';
import type * as TLooks from '../../src/tool/packs/themes/looks.js';

// The layer's lazily loaded stylesheet: a data URL, so the test DOM never fetches from a server.
vi.mock('../../src/styles/ambient.css?url', () => ({ default: 'data:text/css,' }));
// The preview helper opens the Pro sheet through ui/dialog.ts, which links tool-more.css on import.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));
vi.mock('../../src/tool/packs/themes/looks.js', async (load) => ({
  ...(await load<typeof TLooks>()),
  themesCss: async () => undefined,
  uiCss: async () => undefined,
}));

// B4 (Clear Night ambient + floating window): the canvas behaviours added on top of the M6 modes.

const SAT_5PM = new Date(2026, 8, 26, 17, 4, 7).getTime();

afterEach(() => {
  vi.useRealTimers();
});

describe('display helpers (DESIGN.md §4)', () => {
  it('splits digits with a dimmed tail and drops the hour under 1 h', () => {
    expect(split((18 * 60 + 41) * 1000)).toEqual(['18', ':41']);
    expect(split((3600 + 24 * 60 + 17) * 1000)).toEqual(['1:24', ':17']);
    expect(split(-5)).toEqual(['00', ':00']);
    expect(short((9 * 60 + 5) * 1000)).toBe('9:05');
    expect(short((24 * 60 + 15) * 1000)).toBe('24:15');
    expect(short(0)).toBe('0:00');
    const node = document.createElement('div');
    expect(digits(node, 25 * 60_000)).toBe('25:00');
    expect(node.innerHTML).toBe('25<span>:00</span>');
  });

  it('rounds times to the minute and says tomorrow past midnight', () => {
    document.documentElement.lang = 'en';
    expect(at(SAT_5PM + 24 * 60_000, SAT_5PM, null)).toBe('5:28 PM');
    expect(at(new Date(2026, 8, 27, 0, 30).getTime(), SAT_5PM, null)).toBe('12:30 AM tomorrow');
    expect(at(SAT_5PM + 24 * 60_000, SAT_5PM, true)).toBe('17:28');
  });

  it('writes the long date with weekday, day, month and year', () => {
    document.documentElement.lang = 'en';
    expect(dateLong(SAT_5PM)).toBe('Saturday, 26 September 2026');
  });
});

describe('focus mode (Ambient canvas)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(SAT_5PM);
  });

  it('idle shows the block preview; running shows phase, cycle, dots, next and skip', async () => {
    const { ctx, store, engine } = makeCtx();
    store.set({ ui: { mode: 'focus' } });
    const stage = document.createElement('div');
    const off = mountFocus(stage, ctx);
    const q = (sel: string) => stage.querySelector<HTMLElement>(sel);
    expect(q('.at-am-kicker')?.textContent).toBe('Focus block');
    expect(q('[data-focus-digits]')?.innerHTML).toBe('25<span>:00</span>');
    expect(q('[data-focus-label]')?.hidden).toBe(true);
    expect(q('[data-focus-skip]')?.hidden).toBe(true);

    q('[data-focus-start]')?.click();
    await vi.waitFor(() => {
      expect(engine.session?.modeState.focusBlock).toBe(true);
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(q('.at-am-phase')?.textContent).toBe('Focus');
    expect(q('.at-am-cycle')?.textContent).toBe('Cycle 1 of 4');
    expect(q('.at-am-next')?.textContent).toBe('Break at 5:29 PM');
    expect(q('[data-focus-skip]')?.textContent).toBe('Skip to break');
    expect(q('.at-focus-dots')?.getAttribute('aria-label')).toBe('0 of 4 focus cycles done');
    expect(stage.dataset.phase).toBe('work');

    // Skip moves the phase clock, never the lock: the session keeps running.
    q('[data-focus-skip]')?.click();
    expect(Number(engine.session?.modeState.focusSkip)).toBeGreaterThan(24 * 60_000);
    expect(q('.at-am-phase')?.textContent).toBe('Break');
    expect(q('[data-focus-skip]')?.textContent).toBe('Skip to focus');
    expect(q('.at-am-next')?.textContent).toMatch(/^Focus again at /u);
    expect(q('.at-focus-dots')?.getAttribute('aria-label')).toBe('1 of 4 focus cycles done');
    expect(stage.dataset.phase).toBe('break');
    expect(engine.session?.status).toBe('active');
    off();
    ctx.stop();
  });
});

describe('cook mode (Ambient canvas)', () => {
  it('counts timers, opens the Custom… stepper and stops at three', async () => {
    const { ctx } = makeCtx();
    const stage = document.createElement('div');
    const off = mountCook(stage, ctx);
    const q = <T extends HTMLElement = HTMLElement>(sel: string) => stage.querySelector<T>(sel) as T;
    expect(q('.at-cook-head > span').textContent).toBe('0 of 3');
    expect(q('.at-cook-head h2').textContent).toBe('Kitchen timers');
    const [empty, full] = stage.querySelectorAll<HTMLElement>('.at-cook-msg');
    expect(empty?.hidden).toBe(false);
    expect(full?.hidden).toBe(true);
    expect(q<HTMLInputElement>('#cook-name').placeholder).toBe('Timer 1');

    const custom = q('.at-cook-custom');
    const step = q('.at-cook-step');
    expect(step.hidden).toBe(true);
    custom.click();
    expect(step.hidden).toBe(false);
    expect(custom.getAttribute('aria-expanded')).toBe('true');
    const minutes = q<HTMLInputElement>('.at-cook-step input');
    expect(minutes.value).toBe('20');
    q('[aria-label="1 minute more"]').click();
    expect(minutes.value).toBe('21');
    minutes.value = '1';
    q('[aria-label="1 minute less"]').click();
    expect(minutes.value).toBe('1');

    q<HTMLInputElement>('#cook-name').value = 'Pasta';
    minutes.value = '10';
    q('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => {
      expect(stage.querySelectorAll('[data-cook-timer]')).toHaveLength(1);
    });
    const card = q('[data-cook-timer]');
    expect(card.querySelector('h3')?.textContent).toBe('Pasta');
    expect(card.querySelector('.at-cook-sub')?.textContent).toMatch(/^of 10 min · ready /u);
    expect(card.querySelector('.at-cook-rm')?.getAttribute('aria-label')).toBe('Remove Pasta');
    expect(step.hidden).toBe(true);
    expect(q('.at-cook-head > span').textContent).toBe('1 of 3');
    expect(ctx.engine.session?.status).toBe('active');

    for (const m of ['5', '15']) q(`[data-cook-quick="${m}"]`).click();
    await vi.waitFor(() => {
      expect(stage.querySelectorAll('[data-cook-timer]')).toHaveLength(3);
    });
    expect(q('form').hidden).toBe(true);
    expect(full?.hidden).toBe(false);
    expect(q('.at-cook-head > span').textContent).toBe('3 of 3');
    off();
    ctx.stop();
  });

  it('the tap card says what it does: cooking for, paused note and play/pause', async () => {
    const { ctx } = makeCtx();
    const stage = document.createElement('div');
    const off = mountCook(stage, ctx);
    const tap = stage.querySelector<HTMLButtonElement>('[data-cook-tap]') as HTMLButtonElement;
    expect(tap.hasAttribute('data-run')).toBe(false);
    expect(stage.querySelector('[data-cook-hint]')?.textContent).toBe('Tap to start. The screen stays awake.');
    tap.click();
    await vi.waitFor(() => {
      expect(tap.hasAttribute('data-run')).toBe(true);
    });
    expect(stage.querySelector('.at-am-kicker')?.textContent).toBe('Cooking for');
    tap.click();
    expect(tap.getAttribute('aria-pressed')).toBe('true');
    expect(stage.querySelector('.at-am-kicker')?.textContent).toBe('Clock paused');
    expect(stage.querySelector<HTMLElement>('.at-am-cnote')?.hidden).toBe(false);
    off();
    ctx.stop();
  });
});

describe('message mode (Ambient canvas)', () => {
  it('a shared link runs the five-minute Pro preview, then goes back to Clock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(SAT_5PM);
    const { ctx, store } = makeCtx({ search: '?mode=message&msg=Back%20soon' });
    store.set({ ui: { mode: 'message' } });
    const stage = document.createElement('div');
    const off = mountMessage(stage, ctx);
    expect(stage.querySelector('[data-message]')?.textContent).toBe('Back soon');
    expect(stage.querySelector('.at-am-preview .at-am-tag')?.textContent).toBe('Pro');
    expect(stage.querySelector('.at-am-meta time')?.textContent).toMatch(/^\d{1,2}:\d{2}/u);
    const { activePreview, PREVIEW_MS } = await import('../../src/tool/packs/themes/preview.js');
    await vi.waitFor(() => {
      expect(activePreview()?.id).toBe('message');
    });
    await vi.advanceTimersByTimeAsync(PREVIEW_MS);
    expect(store.get().ui.mode).toBe('clock');
    expect(store.get().ui.toasts.find((x) => x.id === 'preview')?.text).toBe(
      'Preview ended, back to Clock. Get Pro to keep Message.',
    );
    off();
  });

  it('without a link, free users get the Pro card with a way back to Clock', () => {
    const { ctx, store } = makeCtx();
    store.set({ ui: { mode: 'message' } });
    const stage = document.createElement('div');
    const off = mountMessage(stage, ctx);
    expect(stage.querySelector('[data-message]')?.getAttribute('aria-hidden')).toBe('true');
    const card = stage.querySelector('[data-message-pro]');
    expect(card?.querySelector('h2')?.textContent).toBe('Custom messages are a Pro feature');
    const back = card?.querySelector<HTMLButtonElement>('button');
    expect(back?.textContent).toBe('Back to Clock');
    back?.click();
    expect(store.get().ui.mode).toBe('clock');
    off();
  });

  it('Pro edits the message in place and saves it to settings', () => {
    const { ctx, store, storage } = makeCtx({
      license: license(['ambient.message']),
      settings: { ambient: { ...makeCtx().store.get().settings.ambient, message: 'Hi' } },
    });
    const stage = document.createElement('div');
    const off = mountMessage(stage, ctx);
    const text = stage.querySelector<HTMLElement>('[data-message]');
    expect(text?.textContent).toBe('Hi');
    stage.querySelector<HTMLButtonElement>('.at-am-edit')?.click();
    const form = stage.querySelector<HTMLFormElement>('.at-am-msgform');
    expect(form?.hidden).toBe(false);
    expect(text?.hidden).toBe(true);
    const input = form?.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('Hi');
    input.value = 'Recording in progress';
    input.dispatchEvent(new Event('input'));
    expect(form?.querySelector('div > span')?.textContent).toBe('21 / 80');
    form?.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(text?.textContent).toBe('Recording in progress');
    expect(text?.hidden).toBe(false);
    expect(store.get().settings.ambient.message).toBe('Recording in progress');
    expect(storage.settings().ambient.message).toBe('Recording in progress');
    off();
  });
});

describe('floating window (PipWindow canvas)', () => {
  const PIP_HTML = `
    <div data-pip-slot><output data-pill data-lock="idle"><span data-pill-text>Ready</span></output><div data-timer>00:30:00</div></div>
    <dialog data-ambient><div data-ambient-stage><div data-ambient-content></div></div></dialog>`;

  it('logo row with pill and until, split digits, +15 and Stop; the empty line when stopped', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(SAT_5PM);
    const doc = document.implementation.createHTMLDocument('pip');
    const win = Object.assign(new EventTarget(), { document: doc, closed: false, close: () => undefined });
    vi.stubGlobal('documentPictureInPicture', { requestWindow: vi.fn(() => Promise.resolve(win)) });
    const { ctx } = makeCtx({ html: PIP_HTML });
    await ctx.startPlan({ type: 'duration', ms: 30 * 60_000 }, 'p30');
    expect(await togglePip(ctx)).toBe('document');
    const body = doc.body;
    expect(body.querySelector('.at-pip-top [data-pill]')).not.toBeNull();
    expect(body.querySelector('.at-pip-digits')?.innerHTML).toBe('30<span>:00</span>');
    expect(body.querySelector('.at-pip-until')?.textContent).toBe('until 5:34 PM');
    expect(body.querySelector<HTMLElement>('[data-pip-stop]')?.hidden).toBe(false);
    expect(body.querySelector<HTMLElement>('[data-pip-add]')?.hidden).toBe(false);
    expect(body.querySelector<HTMLElement>('.at-pip-empty')?.hidden).toBe(true);
    expect(body.hasAttribute('data-live')).toBe(true);
    // The stylesheet the window clones is on the page, as an absolute URL (the PiP document is about:blank).
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="stylesheet"]');
    expect(link?.getAttribute('href')).toBe(link?.href);

    body.querySelector<HTMLButtonElement>('[data-pip-stop]')?.click();
    expect(body.querySelector<HTMLElement>('.at-pip-empty')?.hidden).toBe(false);
    expect(body.querySelector('.at-pip-empty')?.textContent).toBe('Start a session in AwakeTab');
    expect(body.hasAttribute('data-live')).toBe(false);
    win.dispatchEvent(new Event('pagehide'));
    vi.unstubAllGlobals();
  });
});
