import { afterEach, describe, expect, it, vi } from 'vitest';

import { applyLaunch, deviceLabel, launchEnded, telemetryOn } from '../../src/lib/pro-common';
import { bootProPage } from '../../src/lib/pro-page';

vi.mock('../../src/lib/analytics.js', () => ({ track: vi.fn() }));
const { track } = await import('../../src/lib/analytics.js');

const END = Date.parse('2026-12-08T00:00:00.000Z');
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

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
