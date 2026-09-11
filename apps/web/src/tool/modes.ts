import type { TAmbientMode } from '@awaketab/core';

export function nextMode(current: TAmbientMode, hasMessage: boolean): TAmbientMode {
  const all: TAmbientMode[] = ['standard', 'clock', 'focus', 'minimal', 'night', 'message', 'cook'];
  const allowed = all.filter((m) => m !== 'message' || hasMessage);
  const i = allowed.indexOf(current);
  return allowed[(i + 1) % allowed.length] ?? 'standard';
}
