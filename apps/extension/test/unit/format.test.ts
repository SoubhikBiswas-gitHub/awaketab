import { describe, expect, it } from 'vitest';
import { clockParts, createTimeFormat, dayDiff, keyCaps, roundToMinute, words } from '../../src/format';
import { createTranslator } from '../../src/i18n';
import { pageCatalog } from '../../scripts/i18n.mjs';

const t = createTranslator(pageCatalog('en'));
const time = createTimeFormat({ lang: 'en', clock24h: null, t });
const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime();

describe('clock digits (DESIGN.md §4 long sessions)', () => {
  it('MM:SS under an hour, H:MM:SS from an hour, 1d over HH:MM:SS from a day; seconds split out to dim', () => {
    expect(clockParts(24 * 60_000 + 18_000)).toEqual({ days: '', main: '24', seconds: ':18' });
    expect(clockParts(2 * 3_600_000 + 15 * 60_000)).toEqual({ days: '', main: '2:15', seconds: ':00' });
    expect(clockParts(12 * 3_600_000 + 59 * 60_000 + 59_000)).toEqual({ days: '', main: '12:59', seconds: ':59' });
    expect(clockParts(86_400_000 + 2 * 3_600_000 + 14 * 60_000 + 58_000)).toEqual({
      days: '1d',
      main: '02:14',
      seconds: ':58',
    });
    expect(clockParts(-5)).toEqual({ days: '', main: '00', seconds: ':00' });
  });
});

describe('words', () => {
  it('names lengths the way the presets do', () => {
    expect(words(45 * 60_000, t)).toBe('45 min');
    expect(words(60 * 60_000, t)).toBe('1 h');
    expect(words(90 * 60_000, t)).toBe('1 h 30 min');
    expect(words(2 * 86_400_000 + 3 * 3_600_000, t)).toBe('2 days 3 h');
    expect(words(86_400_000, t)).toBe('1 day');
    expect(words(10_000, t)).toBe('1 min');
  });
});

describe('time wording (12-hour, tomorrow, weekday, full date)', () => {
  const now = at(26, 21, 0); // Saturday 26 September 2026, 9:00 PM
  it('says "tomorrow" across midnight and the weekday two or more days out', () => {
    expect(time.hm(at(26, 22, 30))).toBe('10:30 PM');
    expect(time.when(at(26, 22, 30), now)).toBe('10:30 PM');
    expect(time.when(at(27, 4, 11), now)).toBe('4:11 AM tomorrow');
    expect(time.when(at(28, 0, 42), now)).toBe('Monday 12:42 AM');
    expect(time.since(at(25, 19, 43), now)).toBe('yesterday 7:43 PM');
    expect(time.at(at(28, 9), now)).toBe('Monday at 9:00 AM');
    expect(time.at(at(27, 9), now)).toBe('tomorrow at 9:00 AM');
  });

  it('writes the full end line day before month, and drops a shared AM/PM in spans', () => {
    expect(time.full(at(27, 10, 30))).toBe('Sunday, 27 September · 10:30 AM');
    expect(time.span(at(26, 21, 12), at(26, 21, 42))).toBe('9:12 to 9:42 PM');
    expect(time.span(at(26, 11, 30), at(26, 12, 15))).toBe('11:30 AM to 12:15 PM');
    expect(time.wall(18 * 60)).toBe('6:00 PM');
  });

  it('follows a 24-hour choice', () => {
    const h24 = createTimeFormat({ lang: 'en', clock24h: true, t });
    expect(h24.hm(at(26, 18, 5))).toBe('18:05');
    expect(h24.hour(12)).not.toBe('Noon');
    expect(h24.range(9 * 60, 18 * 60)).toBe('09:00 to 18:00');
  });
});

describe('12-hour times as the options and popup boards print them', () => {
  it('writes wall times with AM/PM, midnight and noon included, and keeps the minutes', () => {
    expect(time.wall(0)).toBe('12:00 AM');
    expect(time.wall(9 * 60)).toBe('9:00 AM');
    expect(time.wall(9 * 60 + 30)).toBe('9:30 AM');
    expect(time.wall(12 * 60)).toBe('12:00 PM');
    expect(time.wall(12 * 60 + 45)).toBe('12:45 PM');
    expect(time.wall(23 * 60 + 59)).toBe('11:59 PM');
    expect(time.wall(24 * 60)).toBe('12:00 AM');
  });

  it('labels the week axis 12 AM, 6 AM, Noon, 6 PM, 12 AM', () => {
    expect([0, 6, 12, 18, 24].map((h) => time.hour(h))).toEqual(['12 AM', '6 AM', 'Noon', '6 PM', '12 AM']);
  });

  it('writes schedule windows as "9:00 AM to 6:00 PM", with "next day" past midnight', () => {
    expect(time.range(9 * 60, 18 * 60)).toBe('9:00 AM to 6:00 PM');
    expect(time.range(22 * 60, 6 * 60)).toBe('10:00 PM to 6:00 AM next day');
    expect(time.range(0, 12 * 60 + 30)).toBe('12:00 AM to 12:30 PM');
    expect(time.range(23 * 60 + 30, 0)).toBe('11:30 PM to 12:00 AM next day');
  });

  it('counts calendar days and rounds end times to the minute', () => {
    expect(dayDiff(at(27, 0, 1), at(26, 23, 59))).toBe(1);
    expect(roundToMinute(at(26, 21, 0) + 31_000)).toBe(at(26, 21, 1));
  });
});

describe('keyCaps', () => {
  it('splits Chrome shortcuts on every platform', () => {
    expect(keyCaps('Alt+Shift+A')).toEqual(['Alt', 'Shift', 'A']);
    expect(keyCaps('⌥⇧A')).toEqual(['⌥', '⇧', 'A']);
  });
});
