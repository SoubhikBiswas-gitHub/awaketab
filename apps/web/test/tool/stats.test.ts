import { DEFAULT_STATS, type IStats } from '@awaketab/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildHeatmap, HEATMAP_WEEKS, levelFor, summarise } from '../../src/tool/stats/heatmap.js';
import { formatMinutes, openStats, renderHeatmap } from '../../src/tool/stats/panel.js';
import { dialogSettled, license, makeCtx } from './ctx-helper.js';

// Sheets wait for tool-more.css (ui/dialog.ts); happy-dom never loads the stylesheet.
vi.mock('../../src/tool/ui/more-css.js', () => ({ moreCss: async () => undefined }));

// 00:15 on Monday 3 Aug 2026 in India; still Sunday 2 Aug in UTC. Keys must follow the local calendar.
const NOW = Date.UTC(2026, 7, 2, 18, 45);
const TZ = 'Asia/Kolkata';

const DAYS: Record<string, number> = {
  '2026-08-04': 99, // future: never shown
  '2026-08-03': 10, // today (local)
  '2026-08-02': 40, // yesterday (local), "today" in UTC
  '2026-07-30': 20,
  '2026-07-28': 30, // oldest free day (today − 6)
  '2026-07-27': 50, // one day past the free window
};

const all = (rows: ReturnType<typeof buildHeatmap>['rows']) => rows.flat();
const cellFor = (rows: ReturnType<typeof buildHeatmap>['rows'], key: string) => all(rows).find((c) => c.key === key);

describe('buildHeatmap (docs/05 §3.17)', () => {
  it('is 7 rows × 12 weeks, Monday first, oldest week first', () => {
    const { rows } = buildHeatmap({}, { now: NOW, history: true, timeZone: TZ });
    expect(rows).toHaveLength(7);
    for (const row of rows) expect(row).toHaveLength(HEATMAP_WEEKS);
    for (const [r, row] of rows.entries()) {
      for (const cell of row) expect(cell.date.getDay()).toBe((r + 1) % 7);
    }
    expect(rows[0]?.[0]?.key).toBe('2026-05-18');
    expect(rows[0]?.[11]?.key).toBe('2026-08-03');
    expect(rows[6]?.[11]?.key).toBe('2026-08-09');
  });

  it('keys cells by the local date of `now`, not the UTC date', () => {
    const { rows } = buildHeatmap(DAYS, {
      now: NOW,
      history: false,
      timeZone: TZ,
    });
    // Today is Monday locally, so it is the last cell of the Monday row.
    expect(rows[0]?.[11]).toMatchObject({
      key: '2026-08-03',
      minutes: 10,
      future: false,
    });
    // Yesterday (the UTC date) is the Sunday of the previous week.
    expect(rows[6]?.[10]).toMatchObject({
      key: '2026-08-02',
      minutes: 40,
      future: false,
    });
  });

  it('flags the rest of the current week as future and never counts it', () => {
    const { rows } = buildHeatmap(DAYS, {
      now: NOW,
      history: true,
      timeZone: TZ,
    });
    const future = all(rows).filter((c) => c.future);
    expect(future.map((c) => c.key)).toEqual([
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]);
    expect(cellFor(rows, '2026-08-04')).toMatchObject({ minutes: 0, level: 0 });
  });

  it('locks days older than 7 local days without stats.history', () => {
    const { rows } = buildHeatmap(DAYS, {
      now: NOW,
      history: false,
      timeZone: TZ,
    });
    expect(cellFor(rows, '2026-07-28')).toMatchObject({
      locked: false,
      minutes: 30,
    });
    expect(cellFor(rows, '2026-07-27')).toMatchObject({
      locked: true,
      minutes: 0,
      level: 0,
    });
    // 18 May – 27 Jul inclusive.
    expect(all(rows).filter((c) => c.locked)).toHaveLength(71);
  });

  it('keeps all 12 weeks unlocked with stats.history', () => {
    const { rows } = buildHeatmap(DAYS, {
      now: NOW,
      history: true,
      timeZone: TZ,
    });
    expect(all(rows).some((c) => c.locked)).toBe(false);
    expect(cellFor(rows, '2026-07-27')).toMatchObject({
      locked: false,
      minutes: 50,
    });
  });

  it('assigns quartile levels 1–4 over the visible non-zero days, 0 for none', () => {
    const free = buildHeatmap(DAYS, {
      now: NOW,
      history: false,
      timeZone: TZ,
    }).rows;
    expect(cellFor(free, '2026-08-03')?.level).toBe(1); // 10
    expect(cellFor(free, '2026-07-30')?.level).toBe(2); // 20
    expect(cellFor(free, '2026-07-28')?.level).toBe(3); // 30
    expect(cellFor(free, '2026-08-02')?.level).toBe(4); // 40
    expect(cellFor(free, '2026-07-29')?.level).toBe(0);

    // Unlocking history adds 50 to the population, which shifts the quartiles.
    const pro = buildHeatmap(DAYS, {
      now: NOW,
      history: true,
      timeZone: TZ,
    }).rows;
    expect(cellFor(pro, '2026-07-27')?.level).toBe(4); // 50
    expect(cellFor(pro, '2026-08-02')?.level).toBe(3); // 40
    expect(cellFor(pro, '2026-07-28')?.level).toBe(2); // 30
    expect(cellFor(pro, '2026-08-03')?.level).toBe(1); // 10
    for (const c of all(pro)) expect([0, 1, 2, 3, 4]).toContain(c.level);
  });

  it('levelFor is 0 for no activity and bounded by the quartiles', () => {
    const q: [number, number, number] = [10, 20, 30];
    expect(levelFor(0, q)).toBe(0);
    expect(levelFor(-5, q)).toBe(0);
    expect(levelFor(10, q)).toBe(1);
    expect(levelFor(11, q)).toBe(2);
    expect(levelFor(30, q)).toBe(3);
    expect(levelFor(31, q)).toBe(4);
  });
});

describe('summarise', () => {
  const stats = (days: Record<string, number>, extra: Partial<IStats> = {}) => ({
    ...DEFAULT_STATS,
    days,
    totalMinutes: Object.values(days).reduce((a, b) => a + b, 0),
    sessions: 6,
    currentStreakDays: 3,
    ...extra,
  });

  it('sums today and the last 7 local days (today included)', () => {
    const sum = summarise(stats(DAYS), NOW, TZ);
    expect(sum.todayMinutes).toBe(10);
    // 3 Aug + 2 Aug + 30 Jul + 28 Jul; 27 Jul is the 8th day back and 4 Aug is the future.
    expect(sum.weekMinutes).toBe(100);
    // The Week bars: seven local days, oldest first, today last.
    expect(sum.days).toHaveLength(7);
    expect(sum.days.at(-1)?.minutes).toBe(10);
    expect(sum.days.reduce((n, d) => n + d.minutes, 0)).toBe(100);
    expect(sum.streakDays).toBe(3);
    expect(sum.sessions).toBe(6);
    expect(sum.totalMinutes).toBe(249);
    expect(sum.empty).toBe(false);
  });

  it("counts today's sessions by the local day, not the UTC day", () => {
    // NOW is 00:15 on 3 Aug in Kolkata and still 2 Aug in UTC.
    const sum = summarise(stats(DAYS, { daySessions: { '2026-08-03': 1, '2026-08-02': 4 } }), NOW, TZ);
    expect(sum.todaySessions).toBe(1);
    expect(summarise(stats(DAYS), NOW, TZ).todaySessions).toBe(0);
  });

  it('is empty only with no minutes and no days', () => {
    expect(summarise(DEFAULT_STATS, NOW, TZ).empty).toBe(true);
    expect(summarise(stats({ '2026-08-03': 0 }), NOW, TZ).empty).toBe(false);
  });
});

describe('formatMinutes', () => {
  it('formats minutes and hours from the catalog', () => {
    expect(formatMinutes(42)).toBe('42 min');
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(-3)).toBe('0 min');
    expect(formatMinutes(59.6)).toBe('1 h 0 min');
    expect(formatMinutes(125)).toBe('2 h 5 min');
  });
});

describe('renderHeatmap DOM', () => {
  // Rendering uses the process time zone; build `now` from local fields so the fixture is zone-independent.
  const LOCAL_NOW = new Date(2026, 7, 3, 12).getTime();

  beforeEach(() => {
    document.documentElement.lang = 'en-GB';
  });
  afterEach(() => {
    document.documentElement.lang = '';
  });

  function render(days: Record<string, number>, history: boolean) {
    document.body.innerHTML = '<div data-stats-heatmap><div data-stats-locked>locked</div></div>';
    const grid = document.querySelector('[data-stats-heatmap]') as HTMLElement;
    renderHeatmap(grid, days, { history, now: LOCAL_NOW });
    return grid;
  }
  const cellAt = (grid: HTMLElement, row: number, col: number) =>
    [...grid.querySelectorAll<HTMLElement>('.at-heat-cell')].find(
      (c) => c.style.gridArea.replace(/\s/gu, '') === `${String(row)}/${String(col + 2)}`,
    );

  it('draws 7 rows × 12 weeks, Monday first, labels days and carries the level (canvas ToolStats)', () => {
    const grid = render({ '2026-08-03': 42, '2026-08-02': 7, '2026-07-31': 21, '2026-07-30': 30 }, false);
    expect(grid.querySelectorAll('.at-heat-cell')).toHaveLength(84);
    // Weekday initials on rows 1, 3 and 5 (Mon, Wed, Fri), hidden from assistive tech.
    const days = [...grid.querySelectorAll<HTMLElement>('.at-heat-day')];
    expect(days.map((d) => d.textContent)).toEqual(['M', 'W', 'F']);
    for (const d of days) expect(d.getAttribute('aria-hidden')).toBe('true');

    const today = cellAt(grid, 1, 11);
    expect(today?.title).toContain('42 min');
    expect(today?.title).toContain('3');
    expect(today?.title).toContain('Aug');
    expect(today?.dataset.level).toBe('4');

    const sunday = cellAt(grid, 7, 10);
    expect(sunday?.title).toContain('7 min');
    expect(sunday?.dataset.level).toBe('1');

    const empty = cellAt(grid, 2, 10);
    expect(empty?.dataset.level).toBe('0');
    expect(empty?.title).toContain('0 min');
    // The whole map is one image with a summary of the last 7 days (the cells carry the detail as titles).
    expect(grid.getAttribute('aria-label')).toContain('Last 7 days: 1 h 40 min');
    expect(grid.getAttribute('aria-label')).toContain('locked without Pro');
  });

  it('marks locked and future cells, and re-rendering replaces the cells but keeps the lock badge', () => {
    const grid = render({ '2026-06-01': 50 }, false);
    const cells = [...grid.querySelectorAll<HTMLElement>('.at-heat-cell')];
    const locked = cells.filter((c) => c.hasAttribute('data-locked'));
    expect(locked).toHaveLength(71);
    for (const c of locked) expect(c.title).toContain('locked');
    expect(cells.filter((c) => c.hasAttribute('data-future'))).toHaveLength(6);
    renderHeatmap(grid, {}, { history: true, now: LOCAL_NOW });
    expect(grid.querySelectorAll('.at-heat-cell')).toHaveLength(84);
    expect(grid.querySelectorAll('[data-locked]')).toHaveLength(0);
    expect(grid.querySelector('[data-stats-locked]')).not.toBeNull();
  });
});

const STATS_HTML = `
  <dialog data-dialog="stats">
    <p data-stats-empty hidden></p>
    <dl><dd data-stats-today></dd><dd data-stats-week></dd><dd data-stats-streak></dd><dd data-stats-total></dd></dl>
    <div data-stats-heatmap><div data-stats-locked hidden></div></div>
    <button type="button" data-stats-export hidden>Export <span data-export-pro>Pro</span></button>
    <button type="button" data-dialog-close>Close</button>
  </dialog>`;

describe('openStats', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 7, 3, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const today = '2026-08-03';

  it('free: export carries the Pro tag, shows the locked badge, fills the four figures', async () => {
    const { ctx, root, storage } = makeCtx({ html: STATS_HTML });
    storage.writeStats({
      ...DEFAULT_STATS,
      days: { [today]: 42, '2026-08-02': 90 },
      daySessions: { [today]: 2, '2026-08-02': 1 },
      totalMinutes: 132,
      sessions: 3,
      currentStreakDays: 2,
    });
    openStats(ctx);
    await dialogSettled();
    const q = (sel: string) => root.querySelector<HTMLElement>(sel);
    expect(root.querySelector<HTMLDialogElement>('[data-dialog="stats"]')?.open).toBe(true);
    expect(q('[data-stats-export]')?.hidden).toBe(false);
    expect(q('[data-export-pro]')?.hidden).toBe(false);
    expect(q('[data-stats-locked]')?.hidden).toBe(false);
    expect(q('[data-stats-empty]')?.hidden).toBe(true);
    // Canvas figures: the number large, the unit small ("1 h 37 min", "6 days", "283 h").
    expect(q('[data-stats-today]')?.textContent).toBe('42 min');
    expect(q('[data-stats-week]')?.textContent).toBe('2 h 12 min');
    expect(q('[data-stats-streak]')?.textContent).toBe('2 days');
    expect(q('[data-stats-total]')?.textContent).toBe('2 h');
    expect(q('[data-stats-total] span')?.textContent).toBe(' h');
    expect(root.querySelectorAll('[data-stats-heatmap] [data-locked]').length).toBeGreaterThan(0);
  });

  it('stats.export drops the Pro tag; stats.history hides the locked badge', () => {
    const { ctx, root, storage } = makeCtx({
      html: STATS_HTML,
      license: license(['stats.export', 'stats.history']),
    });
    storage.writeStats({
      ...DEFAULT_STATS,
      days: { [today]: 5 },
      totalMinutes: 5,
      sessions: 1,
    });
    openStats(ctx);
    expect(root.querySelector<HTMLElement>('[data-stats-export]')?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-export-pro]')?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('[data-stats-locked]')?.hidden).toBe(true);
    expect(root.querySelectorAll('[data-stats-heatmap] [data-locked]')).toHaveLength(0);
  });

  it('without stats.export the button is a Pro upsell; the embed never shows it', () => {
    const a = makeCtx({
      html: STATS_HTML,
      license: license(['stats.history']),
    });
    openStats(a.ctx);
    expect(a.root.querySelector<HTMLElement>('[data-stats-export]')?.hidden).toBe(false);
    expect(a.root.querySelector<HTMLElement>('[data-export-pro]')?.hidden).toBe(false);

    const b = makeCtx({ html: STATS_HTML, license: license(['stats.export']) });
    b.root.classList.add('at-tool-embed');
    openStats(b.ctx);
    expect(b.root.querySelector<HTMLElement>('[data-stats-export]')?.hidden).toBe(true);
  });

  it('shows the empty state when there are no stats', () => {
    const { ctx, root } = makeCtx({ html: STATS_HTML });
    openStats(ctx);
    expect(root.querySelector<HTMLElement>('[data-stats-empty]')?.hidden).toBe(false);
    expect(root.querySelector('[data-stats-today]')?.textContent).toBe('0 min');
  });

  it('reads today from stats written before per-day session counts', () => {
    const { ctx, root, storage } = makeCtx({ html: STATS_HTML });
    // Pre-M6-follow-up record: no daySessions at all.
    storage.writeStats({
      ...DEFAULT_STATS,
      days: { [today]: 1 },
      totalMinutes: 1,
      sessions: 1,
    });
    openStats(ctx);
    expect(root.querySelector('[data-stats-today]')?.textContent).toBe('1 min');
  });
});
