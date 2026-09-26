import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICookTimer } from '../../src/tool/ambient/logic.js';
import { EMBED_QUICK_MIN, mountTimers } from '../../src/tool/embed/timers.js';

function section(): HTMLElement {
  document.body.innerHTML = `<section data-embed-timers hidden><ul data-embed-timer-list></ul><div data-embed-quick></div></section>`;
  return document.querySelector<HTMLElement>('[data-embed-timers]') as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-26T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('embed kitchen timers (full size, docs/11 §2)', () => {
  function setup(initial: ICookTimer[] = []) {
    let stored = initial;
    let n = 0;
    const deps = {
      read: () => stored,
      write: vi.fn((list: ICookTimer[]) => {
        stored = list;
      }),
      ensureSession: vi.fn(() => Promise.resolve()),
      onFinished: vi.fn(),
      announce: vi.fn(),
      id: () => `t${String((n += 1))}`,
    };
    const el = section();
    const stop = mountTimers(el, deps);
    return { el, deps, stop, stored: () => stored };
  }

  it('renders the quick-add buttons with accessible names and shows the section', () => {
    const { el, stop } = setup();
    const buttons = el.querySelectorAll('[data-embed-add]');
    expect([...buttons].map((b) => b.getAttribute('data-embed-add'))).toEqual(EMBED_QUICK_MIN.map(String));
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Add a 5-minute kitchen timer');
    expect(el.hidden).toBe(false);
    stop();
  });

  it('adds timers, starts a session, caps at three and persists', () => {
    const { el, deps, stop, stored } = setup();
    const add = (min: number) => el.querySelector<HTMLButtonElement>(`[data-embed-add="${String(min)}"]`)?.click();
    add(5);
    add(10);
    add(15);
    expect(stored().map((x) => x.name)).toEqual(['Timer 1', 'Timer 2', 'Timer 3']);
    expect(deps.ensureSession).toHaveBeenCalledTimes(3);
    expect(el.querySelector<HTMLElement>('[data-embed-quick]')?.hidden).toBe(true);
    expect(el.querySelectorAll('[data-embed-timer]')).toHaveLength(3);
    expect(el.querySelector('[data-embed-timer="t1"] .at-embed-timer-left')?.textContent).toBe('00:05:00');
    stop();
  });

  it('finishes a timer on its wall-clock deadline: flash, chime hook, announcement', () => {
    const { el, deps, stop, stored } = setup();
    el.querySelector<HTMLButtonElement>('[data-embed-add="5"]')?.click();
    vi.advanceTimersByTime(5 * 60_000 + 1000);
    expect(deps.onFinished).toHaveBeenCalledTimes(1);
    expect(deps.announce).toHaveBeenCalledWith('Timer 1 — done');
    expect(stored()[0]?.doneAt).not.toBeNull();
    const row = el.querySelector('[data-embed-timer="t1"]');
    expect(row?.hasAttribute('data-done')).toBe(true);
    expect(row?.hasAttribute('data-flash')).toBe(true);
    vi.advanceTimersByTime(11_000);
    expect(row?.hasAttribute('data-flash')).toBe(false);
    stop();
  });

  it('removes a timer', () => {
    const { el, stop, stored } = setup();
    el.querySelector<HTMLButtonElement>('[data-embed-add="10"]')?.click();
    el.querySelector<HTMLButtonElement>('[data-embed-remove="t1"]')?.click();
    expect(stored()).toEqual([]);
    expect(el.querySelectorAll('[data-embed-timer]')).toHaveLength(0);
    stop();
  });

  it('resumes stored timers after a reload', () => {
    const now = Date.now();
    const { el, stop } = setup([{ id: 'x', name: 'Rice', durationMs: 600_000, endsAt: now + 120_000, doneAt: null }]);
    expect(el.querySelector('[data-embed-timer="x"] .at-embed-timer-name')?.textContent).toBe('Rice');
    expect(el.querySelector('[data-embed-timer="x"] .at-embed-timer-left')?.textContent).toBe('00:02:00');
    stop();
  });
});
