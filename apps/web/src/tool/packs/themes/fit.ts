// The darkest light page and the lightest dark card across every colour theme (checked in test/tool/looks.test.ts),
// so a custom lamp that passes here passes on all of them.
export const WORST_LIGHT = '#F1F3F7';
export const WORST_DARK = '#2E3440';
export const ON_DARK = '#04232A';

type TRgb = [number, number, number];

const rgb = (hex: string): TRgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as TRgb;
const toHex = (c: TRgb) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as TRgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// The dark-theme lamp, as themes.css draws it: color-mix(in srgb, lamp 40%, #fff).
export function darkOf(hex: string): string {
  return toHex(rgb(hex).map((c) => c * 0.4 + 255 * 0.6) as TRgb);
}

// Ring and accent text on every page and card, white on the lamp button, dark ink on the dark-theme button.
export function lampOk(hex: string): boolean {
  const dark = darkOf(hex);
  return (
    contrast(hex, WORST_LIGHT) >= 4.5 &&
    contrast(hex, '#FFFFFF') >= 4.5 &&
    // The browser mixes the dark lamp at full precision; a little headroom covers the rounding here.
    contrast(dark, WORST_DARK) >= 4.55 &&
    contrast(dark, ON_DARK) >= 4.55
  );
}

function hsl(hex: string): TRgb {
  const [r, g, b] = rgb(hex).map((c) => c / 255) as TRgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function fromHsl([h, s, l]: TRgb): string {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return toHex([f(0), f(8), f(4)]);
}

// The nearest readable lamp to a picked colour: same hue, lightness moved the least. Red stays calm (DESIGN.md §2.2),
// because a saturated red reads as "blocked".
export function fitLamp(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/u.test(hex)) return '#087B87';
  const [h, s0, l0] = hsl(hex.toUpperCase());
  const s = h < 20 || h > 340 ? Math.min(s0, 0.55) : s0;
  for (let step = 0; step <= 200; step += 1) {
    for (const sign of step ? [-1, 1] : [1]) {
      const l = l0 + sign * step * 0.005;
      if (l < 0 || l > 1) continue;
      const c = fromHsl([h, s, l]);
      if (lampOk(c)) return c;
    }
  }
  return '#087B87';
}
