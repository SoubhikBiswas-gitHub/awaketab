import { exportStatsCsv } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { dtf, mins } from '../format.js';
import { t } from '../i18n.js';
import { openDialog } from '../ui/dialog.js';
import { buildHeatmap, summarise } from './heatmap.js';

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  if (minutes < 60) return t('stats.minutes', { minutes });
  return t('stats.hours', {
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  });
}

function figure(dd: HTMLElement | null, parts: Array<[string, string]>): void {
  if (!dd) return;
  dd.replaceChildren(
    ...parts.flatMap(([n, unit], i) => {
      const u = document.createElement('span');
      u.textContent = ` ${unit}${i < parts.length - 1 ? ' ' : ''}`;
      return [document.createTextNode(n), u];
    }),
  );
}

function hm(minutes: number): Array<[string, string]> {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const out: Array<[string, string]> = [];
  if (h) out.push([String(h), t('stats.unit.h')]);
  if (m % 60 || !h) out.push([String(m % 60), t('stats.unit.min')]);
  return out;
}

export function renderHeatmap(
  grid: HTMLElement,
  days: Record<string, number>,
  opts: { history: boolean; now?: number },
): void {
  const cellDate = dtf({ weekday: 'short', day: 'numeric', month: 'short' });
  const map = buildHeatmap(days, {
    history: opts.history,
    ...(opts.now !== undefined ? { now: opts.now } : {}),
  });
  const narrow = dtf({ weekday: 'narrow' });
  const nodes: HTMLElement[] = [];
  let last7 = 0;
  map.rows.forEach((row, r) => {
    if (r % 2 === 0 && r < 6 && row[0]) {
      const label = document.createElement('span');
      label.className = 'at-heat-day';
      label.style.gridRow = String(r + 1);
      label.textContent = narrow.format(row[0].date);
      label.setAttribute('aria-hidden', 'true');
      nodes.push(label);
    }
    row.forEach((cell, c) => {
      const el = document.createElement('span');
      el.className = 'at-heat-cell';
      el.style.gridArea = `${String(r + 1)} / ${String(c + 2)}`;
      el.dataset.level = String(cell.level);
      const date = cellDate.format(cell.date);
      if (cell.future) {
        el.dataset.future = '';
        el.title = t('stats.heat.later');
      } else if (cell.locked) {
        el.dataset.locked = '';
        el.title = t('stats.heat.cellLocked', { date });
      } else {
        last7 += cell.minutes;
        el.title = t('stats.heat.cell', { date, length: mins(cell.minutes) });
      }
      nodes.push(el);
    });
  });
  const lock = grid.querySelector('[data-stats-locked]');
  grid.replaceChildren(...nodes, ...(lock ? [lock] : []));
  grid.setAttribute(
    'aria-label',
    t(opts.history ? 'stats.heat.ariaPro' : 'stats.heat.aria', {
      length: mins(last7),
    }),
  );
}

function downloadCsv(csv: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

let bound = false;

export function openStats(ctx: IToolCtx, opener?: Element | null): void {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="stats"]');
  if (!dialog) return;
  const stats = ctx.storage.stats();
  const sum = summarise(stats);
  const history = hasFeature(ctx, 'stats.history');
  const canExport = hasFeature(ctx, 'stats.export');
  const q = (sel: string) => dialog.querySelector<HTMLElement>(sel);
  figure(q('[data-stats-today]'), hm(sum.todayMinutes));
  figure(q('[data-stats-week]'), hm(sum.weekMinutes));
  figure(q('[data-stats-streak]'), [
    [String(sum.streakDays), t(sum.streakDays === 1 ? 'stats.unit.day' : 'stats.unit.dayPl')],
  ]);
  figure(
    q('[data-stats-total]'),
    sum.totalMinutes < 60 ? hm(sum.totalMinutes) : [[String(Math.round(sum.totalMinutes / 60)), t('stats.unit.h')]],
  );
  const empty = q('[data-stats-empty]');
  if (empty) empty.hidden = !sum.empty;
  const locked = q('[data-stats-locked]');
  if (locked) locked.hidden = history;
  const grid = q('[data-stats-heatmap]');
  if (grid) renderHeatmap(grid, stats.days, { history });
  // Export is a Pro action: free users see the Pro tag and go to /pro; the PiP window and the embed never show it.
  const exportBtn = q('[data-stats-export]');
  if (exportBtn) exportBtn.hidden = ctx.params.isPip || ctx.root.classList.contains('at-tool-embed');
  const tag = q('[data-export-pro]');
  if (tag) tag.hidden = canExport;

  if (!bound) {
    bound = true;
    exportBtn?.addEventListener('click', () => {
      if (!hasFeature(ctx, 'stats.export')) {
        location.assign('/pro');
        return;
      }
      const today = new Intl.DateTimeFormat('en-CA').format(new Date());
      downloadCsv(exportStatsCsv(ctx.storage.stats(), '1.0'), `awaketab-stats-${today}.csv`);
    });
  }
  openDialog(dialog, opener);
}
