import { describe, expect, it } from 'vitest';

import { clockParts, kioskHints, kioskTimer, readKioskForm, urlParts } from '../../src/lib/kiosk-page';
import { kioskUrl } from '../../src/tool/embed/snippet';

const base = { preset: 'pinf', mode: 'message', theme: 'dark', msg: 'Welcome. Please ring the bell.', autostart: true, logo: '', token: '' } as const;

describe('/kiosk builder (B6)', () => {
  it('reads the form with safe defaults', () => {
    const data = new FormData();
    data.set('mode', 'clock');
    data.set('theme', 'nope');
    data.set('preset', 'p60');
    data.set('msg', 'Hi');
    expect(readKioskForm(data)).toEqual({ mode: 'clock', theme: 'dark', preset: 'p60', autostart: false, msg: 'Hi', logo: '', token: '' });
  });

  it('splits the URL into coloured parts that join back to the exact URL', () => {
    const url = kioskUrl({ ...base, logo: 'https://cdn.example.com/l.png', token: 'aaa.bbb.ccc' });
    const parts = urlParts(url);
    expect(parts.map((p) => p.text).join('')).toBe(url);
    expect(parts[0]).toEqual({ text: 'https://awaketab.com/?', kind: 'muted' });
    expect(parts).toContainEqual({ text: 'mode=', kind: 'key' });
    expect(parts).toContainEqual({ text: 'message', kind: 'value' });
    expect(parts.at(-1)).toEqual({ text: '#lic=aaa.bbb.ccc', kind: 'hash' });
  });

  it('explains every field and the licensed preview', () => {
    expect(kioskHints(base)).toMatchObject({ logoWarn: false, tokenWarn: false, licensed: false, showLogo: false, note: 'Free: shows the AwakeTab wordmark.' });
    expect(kioskHints({ ...base, logo: 'http://x.example/l.png' })).toMatchObject({ logoWarn: true, logo: 'Needs an https address, so it is left out of the link.' });
    expect(kioskHints({ ...base, token: 'nope' })).toMatchObject({ tokenWarn: true, licensed: false });
    expect(kioskHints({ ...base, token: 'a.b.c', logo: 'https://x.example/l.png' })).toMatchObject({ licensed: true, showLogo: true, note: 'Licensed: your logo, no AwakeTab wordmark.' });
    expect(kioskHints({ ...base, mode: 'clock' }).msg).toBe('Only shown in Message mode, so it is left out of the link.');
  });

  it('shows the timer as the tool does', () => {
    expect(clockParts(59)).toEqual(['00', ':59']);
    expect(clockParts(3725)).toEqual(['1:02', ':05']);
    const t0 = Date.UTC(2026, 8, 27, 12, 0, 0);
    expect(kioskTimer('pinf', false, t0, t0)).toMatchObject({ big: ['∞', ''], kicker: 'Keeps awake', metaA: 'until you stop' });
    expect(kioskTimer('pinf', true, t0, t0 + 65_000)).toMatchObject({ big: ['01', ':05'], kicker: 'Awake for', metaA: 'since' });
    const running = kioskTimer('p60', true, t0, t0 + 600_000);
    expect(running).toMatchObject({ big: ['50', ':00'], kicker: 'Time left', metaA: 'until' });
    expect(running.progress).toBeCloseTo(50 / 60);
    expect(kioskTimer('p60', false, t0, t0 + 600_000)).toMatchObject({ big: ['1:00', ':00'], kicker: 'Keeps awake for', metaA: 'ends at', progress: 1 });
  });
});
