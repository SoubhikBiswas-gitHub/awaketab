import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyLaunch, deviceLabel, heatLevels, launchEnded, telemetryOn } from '../../src/lib/pro-common';
import { bootProPage, messageSize, scheduleLine, suggestPlan } from '../../src/lib/pro-page';

vi.mock('../../src/lib/analytics.js', () => ({ track: vi.fn() }));
const { track } = await import('../../src/lib/analytics.js');

const END = Date.parse('2026-12-08T00:00:00.000Z');
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('/pro plan helper (B7)', () => {
  it('suggests free first, and Pro only for extras', () => {
    expect(suggestPlan('me', ['none'], 'fine', 'no', 'once')).toBe('free');
    expect(suggestPlan('me', [], 'fine', 'no', 'once')).toBe('free');
    expect(suggestPlan('me', ['look'], 'fine', 'no', 'once')).toBe('lifetime');
    expect(suggestPlan('me', ['stats'], 'fine', 'no', 'year')).toBe('yearly');
    expect(suggestPlan('site', [], 'fine', 'no', 'once')).toBe('embedfree');
    expect(suggestPlan('site', [], 'remove', 'no', 'once')).toBe('embed');
    expect(suggestPlan('screens', [], 'fine', 'no', 'once')).toBe('kioskfree');
    expect(suggestPlan('screens', [], 'fine', 'yes', 'once')).toBe('kiosk');
  });

  it('sizes the message preview by length and phrases the schedule', () => {
    expect([messageSize(16), messageSize(40), messageSize(80)]).toEqual(['s', 'm', 'l']);
    const names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const tpl = {
      none: 'none',
      every: 'every',
      line: 'Awake {span}.',
      on: 'on {day}',
      range: '{from} to {to}',
      and: '{list} and {last}',
    };
    expect(scheduleLine([true, true, true, true, true, false, false], names, tpl)).toBe('Awake Monday to Friday.');
    expect(scheduleLine([false, false, true, false, false, false, false], names, tpl)).toBe('Awake on Wednesday.');
    expect(scheduleLine([true, false, true, false, false, false, true], names, tpl)).toBe(
      'Awake Monday, Wednesday and Sunday.',
    );
    expect(scheduleLine([true, true, false, false, false, false, false], names, tpl)).toBe('Awake Monday and Tuesday.');
    expect(scheduleLine(Array(7).fill(false) as boolean[], names, tpl)).toBe('none');
    expect(scheduleLine(Array(7).fill(true) as boolean[], names, tpl)).toBe('every');
  });

  it('draws the same 84-cell history as the board, the last cell in the future', () => {
    const levels = heatLevels();
    expect(levels).toHaveLength(84);
    expect(levels[83]).toBe(-1);
    expect(levels.slice(0, 83).every((l) => l >= 0 && l <= 4)).toBe(true);
    expect(heatLevels()).toEqual(levels);
  });
});

describe('launch price switch (O-52, D-R13)', () => {
  it('flips at PRO_LAUNCH_END at runtime, whatever the build showed', () => {
    expect(launchEnded(END - 1, END)).toBe(false);
    expect(launchEnded(END, END)).toBe(true);
    document.body.innerHTML = `<div data-launch="on" data-launch-end="${String(END)}"></div>`;
    const root = document.querySelector<HTMLElement>('div');
    if (!root) throw new Error('root missing');
    applyLaunch(root, END + 1);
    expect(root.dataset.launch).toBe('off');
    applyLaunch(root, END - 1);
    expect(root.dataset.launch).toBe('on');
  });
});

describe('readable device labels (C5)', () => {
  it.each([
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      0,
      'Chrome · macOS',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
      0,
      'Edge · Windows',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      5,
      'Safari · iOS',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      5,
      'Safari · iPadOS',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0', 0, 'Firefox · Linux'],
    [
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0 Mobile Safari/537.36',
      5,
      'Samsung Internet · Android',
    ],
  ])('%s', (ua, touch, want) => {
    expect(deviceLabel(ua, touch)).toBe(want);
  });
});

describe('/pro analytics honour the telemetry opt-out (O-43)', () => {
  afterEach(() => {
    vi.mocked(track).mockClear();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('reads at.v1.settings.telemetry, defaulting to on', () => {
    expect(telemetryOn({ getItem: () => null })).toBe(true);
    expect(telemetryOn({ getItem: () => '{"telemetry":false}' })).toBe(false);
    expect(telemetryOn({ getItem: () => 'not json' })).toBe(true);
  });

  it('tracks the view and checkout clicks only while telemetry is on', async () => {
    document.body.innerHTML = `<div data-pro-root data-launch="on"><a href="#" data-plan="pro_yearly">Get yearly Pro</a></div>`;
    const root = document.querySelector<HTMLElement>('[data-pro-root]');
    if (!root) throw new Error('root missing');
    localStorage.setItem('at.v1.settings', JSON.stringify({ telemetry: false }));
    bootProPage(root, END - 1);
    root.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    expect(track).not.toHaveBeenCalled();

    localStorage.clear();
    root.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flush();
    expect(track).toHaveBeenCalledWith(
      'pro_checkout_click',
      { plan: 'pro_yearly' },
      expect.objectContaining({ telemetry: true, path: '/pro' }),
    );
  });
});

describe('/pro plan helper in the page', () => {
  it('shows one suggestion and the questions that apply', () => {
    document.body.innerHTML = `<div data-pro-root>
      <section data-helper>
        <input type="radio" name="use" value="me" checked><input type="radio" name="use" value="site">
        <fieldset data-q2="me"><input type="checkbox" name="want" value="none"><input type="checkbox" name="want" value="look" checked></fieldset>
        <fieldset data-q2="site" hidden><input type="radio" name="credit" value="fine" checked><input type="radio" name="credit" value="remove"></fieldset>
        <fieldset data-q3><input type="radio" name="pay" value="once" checked><input type="radio" name="pay" value="year"></fieldset>
        <aside data-result><div data-res="free" hidden><h3 data-res-title></h3></div><div data-res="lifetime"><h3 data-res-title></h3></div><div data-res="embedfree" hidden><h3 data-res-title></h3></div></aside>
      </section></div>`;
    const root = document.querySelector<HTMLElement>('[data-pro-root]');
    if (!root) throw new Error('root missing');
    bootProPage(root, END - 1);
    const shown = () =>
      [...root.querySelectorAll<HTMLElement>('[data-res]')].filter((el) => !el.hidden).map((el) => el.dataset.res);
    expect(shown()).toEqual(['lifetime']);

    const none = root.querySelector<HTMLInputElement>('input[value="none"]');
    if (none) {
      none.checked = true;
      none.dispatchEvent(new Event('change', { bubbles: true }));
    }
    expect(root.querySelector<HTMLInputElement>('input[value="look"]')?.checked).toBe(false);
    expect(shown()).toEqual(['free']);
    expect(root.querySelector<HTMLElement>('[data-q3]')?.hidden).toBe(true);

    const site = root.querySelector<HTMLInputElement>('input[value="site"]');
    if (site) {
      // happy-dom does not uncheck the other radios of a group outside a <form>; a browser does.
      const me = root.querySelector<HTMLInputElement>('input[value="me"]');
      if (me) me.checked = false;
      site.checked = true;
      site.dispatchEvent(new Event('change', { bubbles: true }));
    }
    expect(shown()).toEqual(['embedfree']);
    expect(root.querySelector<HTMLElement>('[data-q2="site"]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-q2="me"]')?.hidden).toBe(true);
    expect(root.querySelector('[data-res="embedfree"] [data-res-title]')?.id).toBe('res-h');
  });
});
