import { describe, expect, it } from 'vitest';
import { dashOffset, RING_C } from '../../src/tool/format.js';
import { t } from '../../src/tool/i18n.js';
import { sanitizeMsg } from '../../src/tool/params.js';
import { customMs, validateCustom } from '../../src/tool/ui/dialogs.js';
import { createStore, initialState } from '../../src/tool/store.js';

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

describe('ring math', () => {
  it('computes dashoffset at 0/50/100', () => {
    expect(dashOffset(0)).toBeCloseTo(RING_C);
    expect(dashOffset(0.5)).toBeCloseTo(RING_C * 0.5);
    expect(dashOffset(1)).toBeCloseTo(0);
  });
});

describe('custom duration', () => {
  it('rejects zero and over 7 days', () => {
    expect(validateCustom(customMs(0, 0, 0))).toBe(t('tool.custom.error.min'));
    expect(validateCustom(7 * 24 * 60 * 60_000 + 60_000)).toBe(t('tool.custom.error.max'));
    expect(validateCustom(customMs(0, 0, 1))).toBeNull();
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
    expect(s.get().ui.dialog).toBeNull();
  });
});
