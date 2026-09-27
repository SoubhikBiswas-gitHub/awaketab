type TDot = [number, number];

// A 5 × 7 LED font: one number per row, the highest bit is the leftmost dot.
const GLYPHS: Readonly<Record<string, readonly [number, readonly number[]]>> = {
  '0': [5, [14, 17, 19, 21, 25, 17, 14]],
  '1': [5, [4, 12, 4, 4, 4, 4, 14]],
  '2': [5, [14, 17, 1, 2, 4, 8, 31]],
  '3': [5, [31, 2, 4, 2, 1, 17, 14]],
  '4': [5, [2, 6, 10, 18, 31, 2, 2]],
  '5': [5, [31, 16, 30, 1, 1, 17, 14]],
  '6': [5, [6, 8, 16, 30, 17, 17, 14]],
  '7': [5, [31, 1, 2, 4, 8, 8, 8]],
  '8': [5, [14, 17, 17, 14, 17, 17, 14]],
  '9': [5, [14, 17, 17, 15, 1, 2, 12]],
  d: [5, [1, 1, 13, 19, 17, 17, 15]],
  ':': [2, [0, 3, 3, 0, 3, 3, 0]],
  ' ': [1, [0, 0, 0, 0, 0, 0, 0]],
};

export const MATRIX_ROWS = 9;

// Lays the digits out on a panel at least `min` dots wide, one blank row above and below, centred.
export function dotLayout(a: string, b: string, min = 29): { cols: number; on: TDot[]; dim: TDot[] } {
  const glyphs: Array<{ w: number; rows: readonly number[]; sec: boolean }> = [];
  for (const [text, sec] of [
    [a, false],
    [b, true],
  ] as const)
    for (const c of Array.from(text)) {
      const g = GLYPHS[c];
      if (g) glyphs.push({ w: g[0], rows: g[1], sec });
    }
  const width = glyphs.reduce((sum, g) => sum + g.w, 0) + Math.max(0, glyphs.length - 1);
  const cols = Math.max(min, width + 4);
  const on: TDot[] = [];
  const dim: TDot[] = [];
  let x = Math.floor((cols - width) / 2);
  for (const g of glyphs) {
    g.rows.forEach((bits, y) => {
      for (let i = 0; i < g.w; i += 1) if (bits & (1 << (g.w - 1 - i))) (g.sec ? dim : on).push([x + i, y + 1]);
    });
    x += g.w + 1;
  }
  return { cols, on, dim };
}
