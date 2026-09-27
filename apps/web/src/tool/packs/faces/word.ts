import href from './word.css?url';
import { el, type IFace, type IFrame, labels, put, sheet } from './kit.js';
import { litCells, WORD_CLOCKS } from './word-table.js';

export async function make(): Promise<IFace> {
  await sheet(href);
  const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0] ?? 'en';
  const clock = WORD_CLOCKS[lang] ?? WORD_CLOCKS.en;
  if (!clock) throw new Error('no word clock');
  const root = el('div', 'at-fx at-fx-word');
  const text = labels();
  const grid = el('div', 'at-fx-wd-grid');
  grid.style.setProperty('--at-fx-cols', String(clock.grid[0]?.length ?? 11));
  const cells: HTMLElement[] = [];
  for (const row of clock.grid)
    for (const ch of row) {
      const c = el('span', '', ch);
      c.dataset.c = ch;
      cells.push(c);
      grid.append(c);
    }
  const dots = Array.from({ length: 4 }, () => el('i', 'at-fx-wd-dot'));
  const board = el('div', 'at-fx-wd-board');
  board.append(...dots, grid);
  const low = el('div', 'at-fx-wd-low');
  const digits = el('div', 'at-digits');
  const a = el('span');
  const b = el('span', 'at-secs');
  digits.append(a, b);
  low.append(digits, text.meta);
  root.append(text.k, board, low);
  let key = '';

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      put(a, f.a);
      put(b, f.b);
      const now = new Date(f.now);
      const h = now.getHours();
      const m = now.getMinutes();
      if (key === `${String(h)}:${String(m)}`) return;
      key = `${String(h)}:${String(m)}`;
      const on = litCells(clock, h, m);
      cells.forEach((c, i) => {
        c.toggleAttribute('data-on', on.has(i));
      });
      dots.forEach((d, i) => {
        d.toggleAttribute('data-on', i < m % 5);
      });
    },
  };
}
