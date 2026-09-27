import { PRO_LAUNCH_END } from './license';

declare const __AT_POLAR_SERVER__: string | undefined;

export const LAMPS = [
  { id: 'aqua', pro: false },
  { id: 'violet', pro: false },
  { id: 'mint', pro: true },
  { id: 'sky', pro: true },
] as const;

export function usd(amount: number): string {
  return `$${String(amount)}`;
}

export function launchEnded(now = Date.now(), end = PRO_LAUNCH_END): boolean {
  return now >= end;
}

export function applyLaunch(root: HTMLElement, now = Date.now()): void {
  const end = Number(root.dataset.launchEnd ?? PRO_LAUNCH_END);
  root.dataset.launch = launchEnded(now, Number.isFinite(end) ? end : PRO_LAUNCH_END) ? 'off' : 'on';
}

export function telemetryOn(storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): boolean {
  try {
    const raw = storage ? storage.getItem('at.v1.settings') : null;
    return raw ? (JSON.parse(raw) as { telemetry?: unknown }).telemetry !== false : true;
  } catch {
    return true;
  }
}

export function trackPro(event: string, params: Record<string, string | number | boolean>, path: string): void {
  if (!telemetryOn()) return;
  void import('./analytics.js').then((mod) => {
    mod.track(event, params, { telemetry: true, source: 'web', locale: 'en', path });
  });
}

export function deviceLabel(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent, touchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints): string {
  const browser = /Edg(?:e|A|iOS)?\//u.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/u.test(ua)
      ? 'Opera'
      : /SamsungBrowser\//u.test(ua)
        ? 'Samsung Internet'
        : /Firefox\/|FxiOS\//u.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS\//u.test(ua)
            ? 'Chrome'
            : /Safari\//u.test(ua)
              ? 'Safari'
              : 'Browser';
  // iPadOS 13+ reports a Mac user agent; a Mac with a touch screen is an iPad.
  const os = /iPad/u.test(ua) || (/Macintosh/u.test(ua) && touchPoints > 1)
    ? 'iPadOS'
    : /iPhone|iPod/u.test(ua)
      ? 'iOS'
      : /Android/u.test(ua)
        ? 'Android'
        : /CrOS/u.test(ua)
          ? 'ChromeOS'
          : /Windows/u.test(ua)
            ? 'Windows'
            : /Mac OS X|Macintosh/u.test(ua)
              ? 'macOS'
              : /Linux/u.test(ua)
                ? 'Linux'
                : '';
  return os ? `${browser} · ${os}` : browser;
}

export const POLAR_PORTAL_URL =
  typeof __AT_POLAR_SERVER__ !== 'undefined' && __AT_POLAR_SERVER__ === 'production'
    ? 'https://polar.sh/awaketab/portal'
    : 'https://sandbox.polar.sh/awaketab/portal';

export function longDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/gu, (_m, name: string) => String(vars[name] ?? ''));
}

export function heatLevels(): number[] {
  let x = 20260926;
  const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const out: number[] = [];
  for (let i = 0; i < 84; i++) {
    const wd = i % 7;
    const v = r();
    const base = wd < 5 ? 1.2 + v * 3.2 : v * 2.2;
    out.push(i === 83 ? -1 : Math.max(0, Math.min(4, Math.floor(v < 0.12 ? 0 : base))));
  }
  return out;
}
