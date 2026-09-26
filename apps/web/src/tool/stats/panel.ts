import { exportStatsCsv } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { buildHeatmap, summarise, type IHeatCell } from './heatmap.js';

const DOTS = ['', '•', '••', '•••', '••••'] as const;

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  if (minutes < 60) return t('stats.minutes', { minutes });
  return t('stats.hours', { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}

function cellLabel(cell: IHeatCell, fmt: Intl.DateTimeFormat): string {
  return t('stats.heatmap.label', { date: fmt.format(cell.date), minutes: cell.minutes });
}

/** Renders the 7 × 12 heatmap table body. Intensity is carried by colour *and* a dot count (docs/05 §3.17). */
export function renderHeatmap(table: HTMLTableElement, days: Record<string, number>, opts: { history: boolean; now?: number }): void {
  const locale = document.documentElement.lang || 'en';
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const map = buildHeatmap(days, { history: opts.history, ...(opts.now !== undefined ? { now: opts.now } : {}) });
  const body = document.createElement('tbody');
  for (const row of map.rows) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = row[0] ? weekday.format(row[0].date) : '';
    tr.append(th);
    for (const cell of row) {
      const td = document.createElement('td');
      td.dataset.level = String(cell.level);
      if (cell.future) {
        td.dataset.future = '';
        td.setAttribute('aria-hidden', 'true');
      } else if (cell.locked) {
        td.dataset.locked = '';
        td.setAttribute('aria-label', t('stats.heatmap.locked'));
      } else {
        td.setAttribute('aria-label', cellLabel(cell, fmt));
        td.textContent = DOTS[cell.level];
      }
      tr.append(td);
    }
    body.append(tr);
  }
  table.querySelector('tbody')?.remove();
  table.append(body);
}

export function downloadCsv(csv: string, filename: string): void {
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

export function openStats(ctx: IToolCtx): void {
  const dialog = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="stats"]');
  if (!dialog) return;
  const stats = ctx.storage.stats();
  const sum = summarise(stats);
  const history = hasFeature(ctx, 'stats.history');
  const canExport = hasFeature(ctx, 'stats.export') && !ctx.params.isPip && !ctx.root.classList.contains('at-tool-embed');
  const set = (sel: string, text: string) => {
    const el = dialog.querySelector(sel);
    if (el) el.textContent = text;
  };
  set('[data-stats-today]', t('stats.totalValue', { time: formatMinutes(sum.todayMinutes), sessions: sum.todaySessions }));
  set('[data-stats-week]', formatMinutes(sum.weekMinutes));
  set('[data-stats-streak]', t('stats.streak', { days: sum.streakDays }));
  set('[data-stats-total]', t('stats.totalValue', { time: formatMinutes(sum.totalMinutes), sessions: sum.sessions }));
  const empty = dialog.querySelector<HTMLElement>('[data-stats-empty]');
  if (empty) empty.hidden = !sum.empty;
  const locked = dialog.querySelector<HTMLElement>('[data-stats-locked]');
  if (locked) locked.hidden = history;
  const table = dialog.querySelector<HTMLTableElement>('[data-stats-heatmap]');
  if (table) renderHeatmap(table, stats.days, { history });
  const exportBtn = dialog.querySelector<HTMLButtonElement>('[data-stats-export]');
  if (exportBtn) exportBtn.hidden = !canExport;

  if (!bound) {
    bound = true;
    exportBtn?.addEventListener('click', () => {
      const today = new Intl.DateTimeFormat('en-CA').format(new Date());
      downloadCsv(exportStatsCsv(ctx.storage.stats(), '1.0'), `awaketab-stats-${today}.csv`);
    });
    dialog.querySelector('[data-stats-close]')?.addEventListener('click', () => {
      dialog.close();
    });
    dialog.addEventListener('close', () => {
      ctx.store.set({ ui: { dialog: null } });
    });
  }
  ctx.store.set({ ui: { dialog: 'stats' } });
  if (!dialog.open) dialog.showModal();
}
