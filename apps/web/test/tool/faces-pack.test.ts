import { describe, expect, it } from 'vitest';
import { ghost } from '../../src/tool/packs/faces/lcd-text.js';
import { dotLayout, MATRIX_ROWS } from '../../src/tool/packs/faces/matrix-font.js';
import { type IWordClock, litCells, WORD_CLOCKS } from '../../src/tool/packs/faces/word-table.js';

function english(): IWordClock {
  const c = WORD_CLOCKS.en;
  if (!c) throw new Error('English word clock missing');
  return c;
}
const en = english();

function words(h: number, m: number): string {
  const cols = en.grid[0]?.length ?? 0;
  const lit = [...litCells(en, h, m)].sort((x, y) => x - y);
  const out: string[] = [];
  let run = '';
  let prev = -2;
  for (const i of lit) {
    if (i !== prev + 1 || i % cols === 0) {
      if (run) out.push(run);
      run = '';
    }
    run += en.grid[Math.floor(i / cols)]?.[i % cols] ?? '';
    prev = i;
  }
  if (run) out.push(run);
  return out.join(' ');
}

describe('word clock table', () => {
  it('has equal rows and words that match the letters', () => {
    const cols = en.grid[0]?.length;
    for (const row of en.grid) expect(row.length).toBe(cols);
    for (const [w, [r, c, n]] of Object.entries(en.words)) {
      const letters = en.grid[r]?.slice(c, c + n);
      expect(letters).toBe(w.replace(/^[mh](?=five|ten)/u, '').toUpperCase());
    }
  });

  it('spells the time in five-minute steps', () => {
    expect(words(22, 30)).toBe('IT IS HALF PAST TEN');
    expect(words(10, 0)).toBe('IT IS TEN OCLOCK');
    expect(words(0, 7)).toBe('IT IS FIVE PAST TWELVE');
    expect(words(9, 44)).toBe('IT IS TWENTY TO TEN');
    expect(words(11, 45)).toBe('IT IS A QUARTER TO TWELVE');
    expect(words(15, 25)).toBe('IT IS TWENTYFIVE PAST THREE');
  });
});

describe('lcd ghost segments', () => {
  it('lights every segment behind each digit and keeps separators', () => {
    expect(ghost('25')).toBe('88');
    expect(ghost(':07')).toBe(':88');
    expect(ghost('1d 02:15')).toBe('88!88:88');
  });
});

describe('dot matrix layout', () => {
  it('centres the digits on a panel at least 29 dots wide and dims the seconds', () => {
    const one = dotLayout('25', ':00');
    expect(one.cols).toBe(30);
    for (const [x, y] of [...one.on, ...one.dim]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(one.cols);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(MATRIX_ROWS - 1);
    }
    expect(one.dim.length).toBeGreaterThan(0);
    expect(dotLayout('1d 02:15', ':00').cols).toBeGreaterThan(29);
  });
});
