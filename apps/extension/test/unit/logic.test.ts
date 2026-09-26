import type { ISession } from '@awaketab/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BG_KEYS, LOCALES, readCatalog } from '../../scripts/i18n.mjs';
import { format, resolveLocale } from '../../src/i18n';
import { parseRequest } from '../../src/messages';
import { activeWindow, mergeWindows, scheduleAlarms, windowsOf } from '../../src/schedules';
import { matchSite, normalizeHost, readExt, readSettings } from '../../src/settings';
import { badgeText, formatClock, pillExtraKey, pillKey, pillTextKey } from '../../src/status';

const live = (patch: Partial<ISession>): ISession => ({
  v: 1,
  id: 'x',
  plan: { type: 'indefinite' },
  presetId: 'pinf',
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
  source: 'ext',
  ...patch,
});

describe('level ↔ pill mapping (docs/10 §3)', () => {
  it('uses the seven shared pill keys and adds only the system secondary line', () => {
    for (const state of ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'] as const) {
      expect(pillKey(state)).toBe(`tool.pill.${state}`);
    }
    expect(pillExtraKey('held', 'system')).toBe('ext.pill.system');
    expect(pillExtraKey('held', 'display')).toBeNull();
    expect(pillExtraKey('requesting', 'system')).toBeNull();
  });

  it('never says "Screen awake" at system level: a held system lock reads ext.pill.systemHeld (D-02)', () => {
    expect(pillTextKey('held', 'system')).toBe('ext.pill.systemHeld');
    expect(pillTextKey('held', 'display')).toBe('tool.pill.held');
    expect(pillTextKey('held', null)).toBe('tool.pill.held');
    for (const state of ['idle', 'requesting', 'lost', 'denied', 'unsupported', 'fallback'] as const) {
      expect(pillTextKey(state, 'system')).toBe(`tool.pill.${state}`);
      expect(pillTextKey(state, 'display')).toBe(`tool.pill.${state}`);
    }
  });

  it('ships the system-level copy in every locale, distinct from the held pill', () => {
    for (const locale of LOCALES) {
      const catalog = readCatalog(locale);
      expect(catalog['ext.pill.systemHeld'], locale).toBeTruthy();
      expect(catalog['ext.pill.system'], locale).toBeTruthy();
      expect(catalog['ext.pill.systemHeld'], locale).not.toBe(catalog['tool.pill.held']);
      expect(catalog['ext.pill.system'], locale).not.toContain(catalog['tool.pill.held']);
    }
    const en = readCatalog('en');
    expect(en['ext.pill.systemHeld']).toBe('System awake');
    expect(en['ext.pill.system']).toBe('Screen may dim or lock');
    expect(BG_KEYS).toEqual(expect.arrayContaining(['ext.pill.system', 'ext.pill.systemHeld']));
  });

  it('badge: ON/SYS for open-ended sessions, minutes left for finite ones, nothing unless held', () => {
    const now = 1_000_000;
    expect(badgeText('held', 'display', live({}), now)).toBe('ON');
    expect(badgeText('held', 'system', live({}), now)).toBe('SYS');
    const finite = live({ plan: { type: 'duration', ms: 25 * 60_000 }, endsAt: now + 25 * 60_000 - 1 });
    expect(badgeText('held', 'display', finite, now)).toBe('25m');
    expect(badgeText('held', 'display', finite, now + 25 * 60_000 - 30_000)).toBe('1m');
    const long = live({ plan: { type: 'duration', ms: 240 * 60_000 }, endsAt: now + 240 * 60_000 });
    expect(badgeText('held', 'display', long, now)).toBe('4h');
    expect(badgeText('idle', 'display', live({}), now)).toBe('');
    expect(badgeText('unsupported', 'display', live({}), now)).toBe('');
    expect(badgeText('held', 'display', live({ status: 'completed' }), now)).toBe('');
  });

  it('formats the popup timer with tabular h:mm:ss / mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(59_999)).toBe('00:59');
    expect(formatClock(3_600_000)).toBe('1:00:00');
    expect(formatClock(26 * 3_600_000 + 61_000)).toBe('26:01:01');
  });
});

describe('settings and auto-start matcher', () => {
  it('defaults telemetry and notifications to off in the extension', () => {
    expect(readSettings(undefined).telemetry).toBe(false);
    expect(readSettings({ theme: 'dark' }).telemetry).toBe(false);
    expect(readSettings({ telemetry: true }).telemetry).toBe(true);
    expect(readSettings({ notifications: 'yes' }).notifications).toBe(false);
    expect(readSettings({ defaultPreset: 'custom' }).defaultPreset).toBe('pinf');
  });

  it('normalises pasted sites and refuses anything that is not an https host', () => {
    expect(normalizeHost('https://Docs.Example.com/path?q=1')).toBe('docs.example.com');
    expect(normalizeHost(' meet.example.com ')).toBe('meet.example.com');
    expect(normalizeHost('*.example.com')).toBe('*.example.com');
    expect(normalizeHost('http://example.com')).toBeNull();
    expect(normalizeHost('localhost')).toBeNull();
    expect(normalizeHost('192.168.0.1')).toBeNull();
    expect(normalizeHost('javascript:alert(1)')).toBeNull();
    expect(normalizeHost('')).toBeNull();
  });

  it('matches exact hosts and wildcard subdomains over https only', () => {
    const sites = [
      { host: 'meet.example.com', durationMin: null },
      { host: '*.work.test', durationMin: 60 },
    ];
    expect(matchSite('https://meet.example.com/abc', sites)?.host).toBe('meet.example.com');
    expect(matchSite('https://other.example.com/', sites)).toBeNull();
    expect(matchSite('http://meet.example.com/', sites)).toBeNull();
    expect(matchSite('https://a.b.work.test/', sites)?.durationMin).toBe(60);
    expect(matchSite('https://work.test/', sites)?.host).toBe('*.work.test');
    expect(matchSite('https://notwork.test/', sites)).toBeNull();
    expect(matchSite(undefined, sites)).toBeNull();
    expect(matchSite('not a url', sites)).toBeNull();
  });

  it('sanitises stored extension settings (synced data is untrusted)', () => {
    const ext = readExt({
      level: 'turbo',
      schedules: [
        { id: 'ok', days: [1, 1, 9, 5], start: '09:00', end: '17:00', level: 'system' },
        { id: 'bad', days: [], start: '09:00', end: '17:00' },
        { id: 'BAD ID', days: [1], start: '09:00', end: '17:00' },
        { id: 'same', days: [1], start: '09:00', end: '09:00' },
      ],
      autostart: { browserStart: 'yes', sites: [{ host: 'HTTPS://X.Example.com' }, { host: 'nope' }] },
    });
    expect(ext.level).toBe('display');
    expect(ext.schedules).toEqual([{ id: 'ok', days: [1, 5], start: '09:00', end: '17:00', level: 'system' }]);
    expect(ext.autostart).toEqual({ browserStart: false, sites: [{ host: 'x.example.com', durationMin: null }] });
  });
});

describe('schedules → alarms (docs/13 §10)', () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Los_Angeles';
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });
  const weekdays = { id: 'w', days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00', level: 'display' as const };

  it('builds weekday windows and two alarms (next start, next end)', () => {
    const tue10 = new Date(2026, 8, 1, 10, 0).getTime(); // Tue 1 Sep 2026
    expect(activeWindow([weekdays], tue10)).toEqual({ start: new Date(2026, 8, 1, 9, 0).getTime(), end: new Date(2026, 8, 1, 18, 0).getTime(), level: 'display' });
    expect(scheduleAlarms([weekdays], tue10)).toEqual([
      { name: 'at.sched.w.start', when: new Date(2026, 8, 2, 9, 0).getTime() },
      { name: 'at.sched.w.end', when: new Date(2026, 8, 1, 18, 0).getTime() },
    ]);
    const sat = new Date(2026, 8, 5, 12, 0).getTime();
    expect(activeWindow([weekdays], sat)).toBeNull();
    expect(scheduleAlarms([weekdays], sat)[0]?.when).toBe(new Date(2026, 8, 7, 9, 0).getTime());
  });

  it('keeps wall-clock times across the US DST changes', () => {
    // Spring forward: Sun 8 Mar 2026 02:00 → 03:00. Fall back: Sun 1 Nov 2026 02:00 → 01:00.
    const beforeSpring = new Date(2026, 2, 6, 20, 0).getTime(); // Fri evening
    const next = scheduleAlarms([weekdays], beforeSpring).find((a) => a.name.endsWith('.start'));
    const at = new Date(next?.when ?? 0);
    expect([at.getDay(), at.getHours(), at.getMinutes()]).toEqual([1, 9, 0]);
    expect((next?.when ?? 0) - beforeSpring).toBe((2 * 24 + 13) * 3_600_000 - 3_600_000); // one hour shorter
    const beforeFall = new Date(2026, 9, 30, 20, 0).getTime();
    const fallNext = scheduleAlarms([weekdays], beforeFall).find((a) => a.name.endsWith('.start'));
    expect((fallNext?.when ?? 0) - beforeFall).toBe((2 * 24 + 13) * 3_600_000 + 3_600_000); // one hour longer
    expect(new Date(fallNext?.when ?? 0).getHours()).toBe(9);
  });

  it('handles overnight windows and merges overlapping ones, preferring the display level', () => {
    const night = { id: 'n', days: [5], start: '22:00', end: '02:00', level: 'system' as const };
    const fri23 = new Date(2026, 8, 4, 23, 0).getTime();
    expect(activeWindow([night], fri23)?.end).toBe(new Date(2026, 8, 5, 2, 0).getTime());
    const a = { id: 'a', days: [2], start: '09:00', end: '12:00', level: 'system' as const };
    const b = { id: 'b', days: [2], start: '11:00', end: '14:00', level: 'display' as const };
    const tue = new Date(2026, 8, 1, 9, 30).getTime();
    expect(activeWindow([a, b], tue)).toEqual({ start: new Date(2026, 8, 1, 9, 0).getTime(), end: new Date(2026, 8, 1, 14, 0).getTime(), level: 'display' });
    expect(mergeWindows([{ start: 0, end: 10, level: 'system' }, { start: 10, end: 20, level: 'system' }])).toEqual([{ start: 0, end: 20, level: 'system' }]);
    expect(windowsOf(a, tue).every((w) => new Date(w.start).getDay() === 2)).toBe(true);
  });
});

describe('messages and i18n helpers', () => {
  it('accepts only the documented request shapes', () => {
    expect(parseRequest({ type: 'start', presetId: 'p30' })).toEqual({ type: 'start', presetId: 'p30' });
    expect(parseRequest({ type: 'until', wall: '18:30' })).toEqual({ type: 'until', wall: '18:30' });
    expect(parseRequest({ type: 'until', wall: '25:00' })).toBeNull();
    expect(parseRequest({ type: 'extend', ms: 1_800_000 })).toEqual({ type: 'extend', ms: 1_800_000 });
    expect(parseRequest({ type: 'extend', ms: 1 })).toBeNull();
    expect(parseRequest({ type: 'level', level: 'system' })).toEqual({ type: 'level', level: 'system' });
    expect(parseRequest({ type: 'start', presetId: 'custom' })).toBeNull();
    expect(parseRequest(null)).toBeNull();
  });

  it('formats the web ICU subset and resolves the locale', () => {
    expect(format('{n, plural, one {# star} other {# stars}}', { n: 1 })).toBe('1 star');
    expect(format('Version {version}', { version: '1.0.0' })).toBe('Version 1.0.0');
    expect(resolveLocale(null, 'pt-BR')).toBe('pt-br');
    expect(resolveLocale('ja', 'en-US')).toBe('ja');
    expect(resolveLocale('xx', 'sv-SE')).toBe('en');
  });
});
