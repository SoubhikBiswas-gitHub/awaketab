import { STORAGE_KEYS, type ISession } from '@awaketab/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALARMS, NOTIFICATION_ID } from '../../src/controller';
import { EXT_KEYS } from '../../src/settings';
import { BADGE_COLORS } from '../../src/status';
import { bodyOf, createFakeChrome, flush } from './fake-chrome';
import { proRecord, wired } from './helpers';

const session = (fake: ReturnType<typeof createFakeChrome>) => fake.local.data.get(STORAGE_KEYS.session) as ISession | undefined;
const controllers: Array<{ dispose(): void }> = [];
const track = <T extends { dispose(): void }>(ctl: T): T => {
  controllers.push(ctl);
  return ctl;
};

afterEach(() => {
  for (const ctl of controllers.splice(0)) ctl.dispose();
  vi.useRealTimers();
});

describe('background controller — keep-awake and badge', () => {
  it('starts a display session from the popup: power request, ON badge, 0.5-min tick alarm', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    const state = await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    expect(state?.lock).toBe('held');
    expect(state?.session?.source).toBe('ext');
    expect(state?.session?.modeState).toMatchObject({ level: 'display', origin: 'user' });
    expect(fake.power.at(-1)).toEqual({ call: 'request', level: 'display' });
    expect(fake.badge.text).toBe('ON');
    expect(fake.badge.color).toBe(BADGE_COLORS.display);
    expect(fake.badge.title).toContain('Screen awake');
    expect(fake.alarms.get(ALARMS.tick)?.periodInMinutes).toBe(0.5);
    expect(fake.alarms.has(ALARMS.end)).toBe(false);
  });

  it('shows remaining minutes for a finite plan and schedules the end alarm at endsAt', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    const state = await ctl.onMessage({ type: 'start', presetId: 'p15' });
    expect(fake.badge.text).toBe('15m');
    expect(Math.abs((fake.alarms.get(ALARMS.end)?.scheduledTime ?? 0) - (state?.session?.endsAt ?? 0))).toBeLessThan(50);
  });

  it('maps the system level to requestKeepAwake("system"), an indigo SYS badge and the secondary line', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'level', level: 'system' });
    const state = await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    expect(state?.level).toBe('system');
    expect(fake.power.at(-1)).toEqual({ call: 'request', level: 'system' });
    expect(fake.badge.text).toBe('SYS');
    expect(fake.badge.color).toBe(BADGE_COLORS.system);
    expect(fake.badge.title).toContain('System awake · Screen may dim or lock');
    expect(fake.badge.title).not.toContain('Screen awake');
    // Switching level mid-session re-issues the request at the new level.
    await ctl.onMessage({ type: 'level', level: 'display' });
    expect(fake.power.at(-1)).toEqual({ call: 'request', level: 'display' });
    expect(fake.badge.text).toBe('ON');
    expect(fake.badge.title).toContain('Screen awake');
    expect(fake.badge.title).not.toContain('System awake');
  });

  it('stop releases the keep-awake, clears the badge and the session alarms', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p30' });
    const state = await ctl.onMessage({ type: 'stop' });
    await flush();
    expect(state?.lock).toBe('idle');
    expect(fake.power.at(-1)).toEqual({ call: 'release' });
    expect(fake.badge.text).toBe('');
    expect(fake.alarms.has(ALARMS.tick)).toBe(false);
    expect(fake.alarms.has(ALARMS.end)).toBe(false);
    expect(session(fake)?.endReason).toBe('user');
  });

  it('Alt+Shift+A (the toggle command) starts the default preset and stops again', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { defaultPreset: 'p45' });
    const ctl = track(wired(fake));
    await ctl.onCommand('toggle');
    expect(ctl.state().session?.presetId).toBe('p45');
    expect(ctl.state().origin).toBe('command');
    await ctl.onCommand('toggle');
    expect(ctl.state().lock).toBe('idle');
    await ctl.onCommand('something-else');
    expect(ctl.state().lock).toBe('idle');
  });

  it('switching preset mid-session replaces the plan without a second lock or an end notification', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { notifications: true });
    fake.granted.permissions.add('notifications');
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await ctl.onMessage({ type: 'start', presetId: 'p60' });
    await flush();
    expect(ctl.state().session?.presetId).toBe('p60');
    expect(ctl.state().lock).toBe('held');
    expect(fake.notifications).toHaveLength(0);
    expect(fake.badge.text).toBe('60m');
  });

  it('reports unsupported honestly when chrome.power is missing and never starts a session', async () => {
    const fake = createFakeChrome({ power: false });
    const ctl = track(wired(fake));
    const state = await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    expect(state?.lock).toBe('unsupported');
    expect(state?.advice).toBe('unsupported_browser');
    expect(state?.session).toBeNull();
    expect(fake.badge.text).toBe('');
  });

  it('ignores malformed messages', async () => {
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    expect(await ctl.onMessage({ type: 'start', presetId: 'p999' })).toBeNull();
    expect(await ctl.onMessage({ type: 'eval', code: '1' })).toBeNull();
    expect(await ctl.onMessage('start')).toBeNull();
    expect(fake.power).toEqual([]);
  });
});

describe('background controller — service-worker lifecycle', () => {
  it('re-hydrates a live session after a worker restart and re-issues the keep-awake', async () => {
    const fake = createFakeChrome();
    const first = wired(fake);
    const started = await first.onMessage({ type: 'start', presetId: 'p120' });
    await flush();
    // The worker dies: its timers stop, chrome.storage and chrome.power survive.
    first.dispose();
    fake.power.length = 0;
    const second = track(wired(fake));
    await second.onAlarm(ALARMS.tick);
    expect(second.state().session?.id).toBe(started?.session?.id);
    expect(second.state().lock).toBe('held');
    expect(fake.power[0]).toEqual({ call: 'request', level: 'display' });
    expect(fake.badge.text).toMatch(/^1\d\dm$|^2h$/u);
  });

  it('resumes an indefinite session of any age (resumeIndefiniteMs: Infinity)', async () => {
    const fake = createFakeChrome();
    const t0 = Date.parse('2026-09-01T08:00:00Z');
    const first = wired(fake, { now: () => t0 });
    await first.onMessage({ type: 'start', presetId: 'pinf' });
    await flush();
    first.dispose();
    const second = track(wired(fake, { now: () => t0 + 30 * 3_600_000 }));
    await second.onStartup();
    expect(second.state().lock).toBe('held');
    expect(second.state().session?.startedAt).toBe(t0);
  });

  it('finalises a session that ended while the worker slept and announces it once', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { notifications: true });
    fake.granted.permissions.add('notifications');
    let now = Date.parse('2026-09-01T08:00:00Z');
    const first = wired(fake, { now: () => now });
    await first.onMessage({ type: 'start', presetId: 'p15' });
    await flush();
    first.dispose();
    now += 15 * 60_000 + 20_000;
    fake.power.length = 0;
    const second = track(wired(fake, { now: () => now }));
    await second.onAlarm(ALARMS.end);
    expect(session(fake)?.status).toBe('completed');
    expect(fake.power).toContainEqual({ call: 'release' });
    expect(fake.power).not.toContainEqual(expect.objectContaining({ call: 'request' }));
    expect(fake.notifications).toHaveLength(1);
    expect(fake.notifications[0]?.options.message).toBe('Your 15 min session is done');
    expect(second.state().extend).toBe(true);
    await second.onMessage({ type: 'dismiss' });
    expect(second.state().extend).toBe(false);
  });

  it('completes on time while alive, then +30 from the notification starts a new session', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(Date.parse('2026-09-01T08:00:00Z'));
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { notifications: true, sound: { id: 'none', volume: 0.6 } });
    fake.granted.permissions.add('notifications');
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1_000);
    await flush();
    expect(ctl.state().session?.status).toBe('completed');
    expect(fake.power.at(-1)).toEqual({ call: 'release' });
    expect(fake.badge.text).toBe('');
    const note = fake.notifications.at(-1);
    expect(note?.id).toBe(NOTIFICATION_ID);
    expect(note?.options.buttons?.map((b) => b.title)).toEqual(['+30 min', 'Stop']);
    expect(note?.options.silent).toBe(true);
    fake.events.button.fire(NOTIFICATION_ID, 0);
    await vi.advanceTimersByTimeAsync(10);
    await flush(30);
    expect(ctl.state().session?.plan).toEqual({ type: 'duration', ms: 30 * 60_000 });
    expect(ctl.state().lock).toBe('held');
  });

  it('does not notify when notifications are off (the default) or the permission is missing', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const fake = createFakeChrome();
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await vi.advanceTimersByTimeAsync(15 * 60_000 + 1_000);
    await flush();
    expect(ctl.state().session?.status).toBe('completed');
    expect(fake.notifications).toHaveLength(0);
  });
});

describe('background controller — storage, sync and privacy', () => {
  it('stores session and settings in chrome.storage.local under at.v1.* and never syncs the licence', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord());
    const ctl = track(wired(fake));
    await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    await fake.api.storage.local.set({ [STORAGE_KEYS.settings]: { theme: 'dark' } });
    await ctl.onMessage({ type: 'level', level: 'system' });
    await flush();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(fake.local.data.has(STORAGE_KEYS.session)).toBe(true);
    expect(fake.local.data.has(EXT_KEYS.device)).toBe(true);
    const synced = fake.sync.sets.flatMap((items) => Object.keys(items));
    expect(synced).toEqual(expect.arrayContaining([STORAGE_KEYS.settings, EXT_KEYS.ext]));
    expect(synced).not.toContain(STORAGE_KEYS.license);
    expect(synced).not.toContain(EXT_KEYS.device);
    expect(synced).not.toContain(STORAGE_KEYS.session);
  });

  it('seeds a fresh profile from chrome.storage.sync and adopts remote changes', async () => {
    const fake = createFakeChrome();
    fake.sync.data.set(EXT_KEYS.ext, { v: 1, level: 'system', schedules: [], autostart: { browserStart: false, sites: [] } });
    const ctl = track(wired(fake));
    await ctl.ready();
    expect(ctl.state().level).toBe('system');
    await fake.sync.set({ [EXT_KEYS.ext]: { v: 1, level: 'display', schedules: [], autostart: { browserStart: false, sites: [] } } });
    await flush(20);
    expect(ctl.state().level).toBe('display');
  });

  it('keeps telemetry off by default: no network request at all', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(new Response('{}')));
    const fake = createFakeChrome();
    const ctl = track(wired(fake, { fetchFn }));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await ctl.onMessage({ type: 'stop' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('sends opt-in telemetry with source ext and no hostnames', async () => {
    const fetchFn = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(new Response('{}')));
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.settings, { telemetry: true });
    const ctl = track(wired(fake, { fetchFn }));
    await ctl.onMessage({ type: 'start', presetId: 'p15' });
    await ctl.onMessage({ type: 'stop' });
    const bodies = fetchFn.mock.calls.map((call) => JSON.parse(bodyOf(call[1])) as { events: Array<Record<string, unknown>> });
    const events = bodies.flatMap((b) => b.events);
    expect(fetchFn.mock.calls.every((call) => call[0] === 'https://awaketab.com/api/e')).toBe(true);
    expect(events.map((e) => e.event)).toEqual(['session_start', 'session_end']);
    expect(events.every((e) => e.source === 'ext' && e.path === '/ext')).toBe(true);
    expect(JSON.stringify(events)).not.toMatch(/lock_state|https?:/u);
  });
});

describe('background controller — Pro schedules and auto-start', () => {
  const weekdays = { id: 'work', days: [0, 1, 2, 3, 4, 5, 6], start: '09:00', end: '18:00', level: 'display' as const };

  it('free users get no schedule alarms and no schedule session', async () => {
    const at = new Date(2026, 8, 2, 10, 0).getTime();
    const fake = createFakeChrome();
    fake.local.data.set(EXT_KEYS.ext, { v: 1, level: 'display', schedules: [weekdays], autostart: { browserStart: true, sites: [] } });
    const ctl = track(wired(fake, { now: () => at }));
    await ctl.onStartup();
    expect([...fake.alarms.keys()].filter((n) => n.startsWith('at.sched.'))).toEqual([]);
    expect(ctl.state().session).toBeNull();
  });

  it('with ext.schedules: two alarms per schedule, and a window in progress starts an until session', async () => {
    const at = new Date(2026, 8, 2, 10, 0).getTime();
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord(['ext.schedules'], at));
    fake.local.data.set(EXT_KEYS.ext, { v: 1, level: 'display', schedules: [weekdays], autostart: { browserStart: false, sites: [] } });
    const ctl = track(wired(fake, { now: () => at }));
    await ctl.ready();
    expect(fake.alarms.get('at.sched.work.end')?.scheduledTime).toBe(new Date(2026, 8, 2, 18, 0).getTime());
    expect(fake.alarms.get('at.sched.work.start')?.scheduledTime).toBe(new Date(2026, 8, 3, 9, 0).getTime());
    expect(ctl.state().origin).toBe('schedule');
    expect(ctl.state().session?.plan).toEqual({ type: 'until', endsAt: new Date(2026, 8, 2, 18, 0).getTime(), wall: '18:00' });
    // Stopped by hand inside the window: the schedule does not restart it on the next alarm.
    await ctl.onMessage({ type: 'stop' });
    await ctl.onAlarm('at.sched.work.start');
    expect(ctl.state().lock).toBe('idle');
  });

  it('a user session always wins over a schedule window', async () => {
    const at = new Date(2026, 8, 2, 8, 59).getTime();
    let now = at;
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord(['ext.schedules'], at));
    fake.local.data.set(EXT_KEYS.ext, { v: 1, level: 'display', schedules: [weekdays], autostart: { browserStart: false, sites: [] } });
    const ctl = track(wired(fake, { now: () => now }));
    await ctl.onMessage({ type: 'start', presetId: 'pinf' });
    now = new Date(2026, 8, 2, 9, 0).getTime();
    await ctl.onAlarm('at.sched.work.start');
    expect(ctl.state().origin).toBe('user');
  });

  it('ext.autostart keeps the display awake when Chrome starts (FR-EXT-04)', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord(['ext.autostart']));
    fake.local.data.set(EXT_KEYS.ext, { v: 1, level: 'display', schedules: [], autostart: { browserStart: true, sites: [] } });
    const ctl = track(wired(fake));
    await ctl.onStartup();
    expect(ctl.state().lock).toBe('held');
    expect(ctl.state().origin).toBe('startup');
    expect(fake.badge.text).toBe('ON');
  });

  it('auto-start sites: a matching tab starts, closing the last one stops; other sites are ignored', async () => {
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, await proRecord(['ext.autostart']));
    fake.local.data.set(EXT_KEYS.ext, {
      v: 1,
      level: 'display',
      schedules: [],
      autostart: { browserStart: false, sites: [{ host: 'meet.example.com', durationMin: null }] },
    });
    fake.granted.origins.add('https://meet.example.com/*');
    const ctl = track(wired(fake));
    // No host permission → Chrome withholds the URL → nothing happens.
    await ctl.onTabUpdated(1, { status: 'complete' }, { id: 1 });
    await ctl.onTabUpdated(2, { status: 'complete' }, { id: 2, url: 'https://news.example.org/' });
    expect(ctl.state().session).toBeNull();
    const tab = { id: 3, url: 'https://meet.example.com/abc' };
    fake.tabs.push(tab);
    await ctl.onTabUpdated(3, { status: 'complete' }, tab);
    expect(ctl.state().origin).toBe('autostart');
    expect(ctl.state().lock).toBe('held');
    fake.tabs.splice(0);
    await ctl.onTabRemoved(3);
    expect(ctl.state().lock).toBe('idle');
  });

  it('a revoked licence drops the record and stops schedule sessions', async () => {
    const at = new Date(2026, 8, 2, 10, 0).getTime();
    const record = await proRecord(['ext.schedules'], at - 2 * 86_400_000);
    const fake = createFakeChrome();
    fake.local.data.set(STORAGE_KEYS.license, record);
    fake.local.data.set(EXT_KEYS.ext, { v: 1, level: 'display', schedules: [weekdays], autostart: { browserStart: false, sites: [] } });
    const fetchFn = vi.fn(() => Promise.resolve(Response.json({ revoked: true })));
    const ctl = track(wired(fake, { now: () => at, fetchFn }));
    await ctl.onAlarm(ALARMS.license);
    await flush(30);
    expect(fetchFn).toHaveBeenCalled();
    expect(fake.local.data.has(STORAGE_KEYS.license)).toBe(false);
    expect(ctl.state().lock).toBe('idle');
  });
});
