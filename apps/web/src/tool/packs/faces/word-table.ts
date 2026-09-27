// A word clock language: its letter grid (equal-length rows), where each word sits ([row, first column, length]),
// and the words that spell a time. Add a language by adding an entry; the face falls back to English.
export interface IWordClock {
  grid: readonly string[];
  words: Readonly<Record<string, readonly [number, number, number]>>;
  phrase: (hours: number, minutes: number) => string[];
}

const EN_HOURS = ['twelve', 'one', 'two', 'three', 'four', 'hfive', 'six', 'seven', 'eight', 'nine', 'hten', 'eleven'];
const EN_MINUTES: Readonly<Record<number, string[]>> = {
  0: [],
  5: ['mfive', 'past'],
  10: ['mten', 'past'],
  15: ['a', 'quarter', 'past'],
  20: ['twenty', 'past'],
  25: ['twenty', 'mfive', 'past'],
  30: ['half', 'past'],
  35: ['twenty', 'mfive', 'to'],
  40: ['twenty', 'to'],
  45: ['a', 'quarter', 'to'],
  50: ['mten', 'to'],
  55: ['mfive', 'to'],
};

const en: IWordClock = {
  grid: [
    'ITLISASAMPM',
    'ACQUARTERDC',
    'TWENTYFIVEX',
    'HALFSTENFTO',
    'PASTERUNINE',
    'ONESIXTHREE',
    'FOURFIVETWO',
    'EIGHTELEVEN',
    'SEVENTWELVE',
    'TENSEOCLOCK',
  ],
  words: {
    it: [0, 0, 2],
    is: [0, 3, 2],
    a: [1, 0, 1],
    quarter: [1, 2, 7],
    twenty: [2, 0, 6],
    mfive: [2, 6, 4],
    half: [3, 0, 4],
    mten: [3, 5, 3],
    to: [3, 9, 2],
    past: [4, 0, 4],
    nine: [4, 7, 4],
    one: [5, 0, 3],
    six: [5, 3, 3],
    three: [5, 6, 5],
    four: [6, 0, 4],
    hfive: [6, 4, 4],
    two: [6, 8, 3],
    eight: [7, 0, 5],
    eleven: [7, 5, 6],
    seven: [8, 0, 5],
    twelve: [8, 5, 6],
    hten: [9, 0, 3],
    oclock: [9, 5, 6],
  },
  phrase: (hours, minutes) => {
    const m = Math.floor(minutes / 5) * 5;
    const hour = EN_HOURS[(hours + (m >= 35 ? 1 : 0)) % 12] ?? 'twelve';
    return ['it', 'is', ...(EN_MINUTES[m] ?? []), hour, ...(m === 0 ? ['oclock'] : [])];
  },
};

export const WORD_CLOCKS: Readonly<Record<string, IWordClock>> = { en };

export function litCells(clock: IWordClock, hours: number, minutes: number): Set<number> {
  const cols = clock.grid[0]?.length ?? 0;
  const on = new Set<number>();
  for (const w of clock.phrase(hours, minutes)) {
    const at = clock.words[w];
    if (at) for (let i = 0; i < at[2]; i += 1) on.add(at[0] * cols + at[1] + i);
  }
  return on;
}
