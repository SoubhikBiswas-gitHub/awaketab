import type { TTheme } from '@awaketab/core';

const GROUND: Record<'light' | 'dark' | 'oled', string> = {
  light: '#F2F6FA',
  dark: '#0A0E16',
  oled: '#000000',
};

export function resolveTheme(theme: TTheme, darkPref: boolean): 'light' | 'dark' | 'oled' {
  if (theme === 'auto') return darkPref ? 'dark' : 'light';
  return theme;
}

export function applyTheme(theme: TTheme, nightForceOled = false): 'light' | 'dark' | 'oled' {
  const darkPref = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = nightForceOled ? 'oled' : resolveTheme(theme, darkPref);
  document.documentElement.dataset.theme = resolved;
  // The header theme switch reads the preference (not the resolved theme); boot.js syncs its radios.
  document.documentElement.dataset.themePref = theme;
  document.documentElement.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  // The page ground of the colour theme in use; the Clear Night value until themes.css has loaded.
  const ground = getComputedStyle(document.documentElement).getPropertyValue('--at-ground').trim();
  if (meta) meta.setAttribute('content', ground || GROUND[resolved]);
  return resolved;
}

export function nextTheme(theme: TTheme): TTheme {
  const order: TTheme[] = ['auto', 'light', 'dark', 'oled'];
  const i = order.indexOf(theme);
  return order[(i + 1) % order.length] ?? 'auto';
}
