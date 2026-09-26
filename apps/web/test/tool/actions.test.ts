import { planUntil, type ISession, type TPresetId } from '@awaketab/core';
import { describe, expect, it } from 'vitest';
import { createStore, initialState } from '../../src/tool/store.js';
import { sharePath } from '../../src/tool/ui/actions.js';

function session(presetId: TPresetId, plan: ISession['plan']): ISession {
  return {
    v: 1,
    id: 's',
    plan,
    presetId,
    mode: 'standard',
    startedAt: 0,
    endsAt: null,
    status: 'active',
    pausedAt: null,
    pausedMs: 0,
    endedAt: null,
    endReason: null,
    awakeSeconds: 0,
    modeState: {},
    source: 'web',
  };
}

const path = (selectedPreset: TPresetId, s: ISession | null = null) => {
  const store = createStore({ ...initialState(), selectedPreset, session: s });
  return sharePath({ store });
};

describe('sharePath (docs/05 §3.20)', () => {
  it.each([
    ['p15', '/15m'],
    ['p30', '/30m'],
    ['p45', '/45m'],
    ['p60', '/1h'],
    ['p120', '/2h'],
    ['p240', '/4h'],
    ['pinf', '/'],
    ['custom', '/'],
  ] as const)('selected %s → %s', (preset, expected) => {
    expect(path(preset)).toBe(expected);
  });

  it('the running session wins over the selected chip', () => {
    expect(path('p15', session('p120', { type: 'duration', ms: 7_200_000 }))).toBe('/2h');
    expect(path('p15', session('custom', { type: 'duration', ms: 5_400_000 }))).toBe('/');
  });

  it('until sessions share as /until/HH-MM', () => {
    expect(path('pinf', session('until', planUntil('07:30', new Date(2026, 7, 3, 1).getTime())))).toBe('/until/07-30');
    expect(path('pinf', session('until', { type: 'until', endsAt: 0, wall: '23:05' }))).toBe('/until/23-05');
  });

  it('an until chip without an until session falls back to /', () => {
    expect(path('until')).toBe('/');
  });

  it('never carries a query string or ref', () => {
    for (const p of ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf'] as const) expect(path(p)).not.toMatch(/[?#]/u);
  });
});
