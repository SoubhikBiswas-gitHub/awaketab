import { describe, expect, it } from 'vitest';
import { splitDigits, stepCustom, words } from '../../src/tool/format.js';
import { t } from '../../src/tool/i18n.js';
import { sanitizeMsg } from '../../src/tool/params.js';
import { createStore, initialState } from '../../src/tool/store.js';
import { plannedSec, statusOf } from '../../src/tool/ui/view.js';

describe('i18n pill copy', () => {
  it('matches the seven lock states', () => {
    expect(t('tool.pill.idle')).toBe('Ready');
    expect(t('tool.pill.requesting')).toBe('Starting…');
    expect(t('tool.pill.held')).toBe('Screen awake');
    expect(t('tool.pill.lost')).toBe('Paused — tab hidden');
    expect(t('tool.pill.denied')).toBe("Blocked — here's the fix");
    expect(t('tool.pill.unsupported')).toBe('Tap to use the fallback');
    expect(t('tool.pill.fallback')).toBe('Awake via video fallback');
  });
});

describe('face digits (DESIGN.md §4)', () => {
  it('shows MM:SS under an hour, H:MM:SS from an hour and 1d HH:MM:SS from a day', () => {
    expect(splitDigits(1457)).toEqual(['24', ':17']);
    expect(splitDigits(3600)).toEqual(['1:00', ':00']);
    expect(splitDigits(46_799)).toEqual(['12:59', ':59']);
    expect(splitDigits(86_400 + 2 * 3600 + 15 * 60)).toEqual(['1d 02:15', ':00']);
  });

  it('names lengths the way the CTA and the chips read them', () => {
    expect(words(1800)).toBe('30 min');
    expect(words(3600)).toBe('1 hour');
    expect(words(7200)).toBe('2 hours');
    expect(words(8100)).toBe('2 h 15 min');
    expect(words(26 * 3600)).toBe('1 day 2 h');
    expect(words(0)).toBe('no limit');
  });
});

describe('custom stepper (canvas cStep)', () => {
  it('steps 5 min up to 12 h, then hours, within 5 min – 7 days', () => {
    expect(stepCustom(45, true)).toBe(50);
    expect(stepCustom(5, false)).toBe(5);
    expect(stepCustom(715, true)).toBe(720);
    expect(stepCustom(720, true)).toBe(780);
    expect(stepCustom(720, false)).toBe(715);
    expect(stepCustom(780, false)).toBe(720);
    expect(stepCustom(10_080, true)).toBe(10_080);
  });
});

describe('view status (canvas statuses from the seven lock states)', () => {
  it('maps lock, time up and the finished session', () => {
    const s = initialState();
    expect(statusOf(s)).toBe('ready');
    expect(statusOf({ ...s, lock: 'requesting' })).toBe('starting');
    expect(statusOf({ ...s, lock: 'held' })).toBe('awake');
    expect(statusOf({ ...s, lock: 'lost' })).toBe('paused');
    expect(statusOf({ ...s, lock: 'denied' })).toBe('blocked');
    expect(statusOf({ ...s, lock: 'unsupported' })).toBe('needtap');
    expect(statusOf({ ...s, lock: 'fallback' })).toBe('fallback');
    expect(
      statusOf({
        ...s,
        lock: 'held',
        ui: { ...s.ui, ask: { until: 1, fb: false } },
      }),
    ).toBe('timesup');
    expect(
      statusOf({
        ...s,
        ui: {
          ...s.ui,
          done: { at: 1, reason: 'user', log: [], total: 0, left: 0 },
        },
      }),
    ).toBe('ended');
  });

  it('keeps a refused auto-start on the Ready layout until the user taps (decision O-70)', () => {
    const s = initialState();
    const tap = { ...s, lock: 'denied' as const, ui: { ...s.ui, tap: true } };
    expect(statusOf(tap)).toBe('ready');
    expect(statusOf({ ...tap, lock: 'requesting' })).toBe('starting');
    expect(statusOf({ ...tap, ui: { ...tap.ui, tap: false } })).toBe('blocked');
  });

  it('plans the selected length: presets, no limit, custom and 8 h', () => {
    const s = initialState();
    expect(plannedSec({ ...s, selectedPreset: 'p30' }, null)).toBe(1800);
    expect(plannedSec({ ...s, selectedPreset: 'pinf' }, null)).toBe(0);
    expect(
      plannedSec(
        {
          ...s,
          selectedPreset: 'custom',
          settings: { ...s.settings, lastCustomMs: 45 * 60_000 },
        },
        null,
      ),
    ).toBe(2700);
    expect(plannedSec({ ...s, eightHour: true, selectedPreset: 'custom' }, null)).toBe(28_800);
  });
});

describe('msg sanitise', () => {
  it('truncates to 80 and strips controls', () => {
    expect(sanitizeMsg(`${'a'.repeat(90)}\n\u0001`)).toHaveLength(80);
  });
});

describe('store', () => {
  it('merges ui patches', () => {
    const s = createStore(initialState());
    s.set({ ui: { secondTab: true } });
    expect(s.get().ui.secondTab).toBe(true);
    expect(s.get().ui.toasts).toEqual([]);
  });
});
