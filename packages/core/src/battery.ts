export interface IBatteryLike {
  level: number;
  charging: boolean;
  addEventListener(type: string, fn: () => void): void;
  removeEventListener(type: string, fn: () => void): void;
}

export function evaluateBattery(
  b: Pick<IBatteryLike, 'level' | 'charging'>,
  threshold: number,
  hyst = 0.02,
): 'ok' | 'low' | 'stop' {
  if (b.charging) return 'ok';
  if (b.level <= threshold) return 'stop';
  if (b.level <= threshold + hyst) return 'low';
  return 'ok';
}
