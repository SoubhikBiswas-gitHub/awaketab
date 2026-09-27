import { PRO_LAUNCH_END } from './license';

/**
 * Shared by the Pro pages (/pro, /pro/activate, /pro/manage; milestone B7). Small and dependency-free: the page
 * scripts import it, so nothing here may pull in checkout links or the licence verifier.
 */

declare const __AT_POLAR_SERVER__: string | undefined;

export const LAMPS = [
  { id: 'aqua', pro: false },
  { id: 'violet', pro: false },
  { id: 'mint', pro: true },
  { id: 'sky', pro: true },
] as const;

/** Whole dollars, the way every price on the Pro pages is written ("$12"). */
export function usd(amount: number): string {
  return `$${String(amount)}`;
}

/** O-52 / D-R13: after PRO_LAUNCH_END the lifetime plan shows $29 with no launch lines (never a strike-through). */
export function launchEnded(now = Date.now(), end = PRO_LAUNCH_END): boolean {
  return now >= end;
}

/** Flips every `data-launch-only` / `data-after-only` pair under `root` (pro.css hides the other side). */
export function applyLaunch(root: HTMLElement, now = Date.now()): void {
  const end = Number(root.dataset.launchEnd ?? PRO_LAUNCH_END);
  root.dataset.launch = launchEnded(now, Number.isFinite(end) ? end : PRO_LAUNCH_END) ? 'off' : 'on';
}

/**
 * O-43: telemetry is on by default and one switch turns it off everywhere. The Pro pages read the same
 * `at.v1.settings.telemetry` the tool writes (docs/08 §2.1); unreadable storage keeps the default.
 */
export function telemetryOn(storage: Pick<Storage, 'getItem'> | null = typeof localStorage === 'undefined' ? null : localStorage): boolean {
  try {
    const raw = storage ? storage.getItem('at.v1.settings') : null;
    return raw ? (JSON.parse(raw) as { telemetry?: unknown }).telemetry !== false : true;
  } catch {
    return true;
  }
}

/** Sends one event through analytics.ts only when the visitor has not opted out. */
export function trackPro(event: string, params: Record<string, string | number | boolean>, path: string): void {
  if (!telemetryOn()) return;
  void import('./analytics.js').then((mod) => {
    mod.track(event, params, { telemetry: true, source: 'web', locale: 'en', path });
  });
}

/**
 * C5 (marketing-pricing-cro.md): a readable device label, "Chrome · macOS", instead of a user-agent slice.
 * Order matters: Edge, Opera and Samsung Internet also say "Chrome", and every iOS browser says "Safari".
 */
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

/** The Polar customer portal of the `awaketab` organisation (receipts, keys, card updates, cancel). */
export const POLAR_PORTAL_URL =
  typeof __AT_POLAR_SERVER__ !== 'undefined' && __AT_POLAR_SERVER__ === 'production'
    ? 'https://polar.sh/awaketab/portal'
    : 'https://sandbox.polar.sh/awaketab/portal';

/** "27 September 2027": the date style of every Pro board. */
export function longDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Fills `{name}` placeholders, as i18n/load.ts does at build time, for templates carried in data attributes. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/gu, (_m, name: string) => String(vars[name] ?? ''));
}

/**
 * The /pro history sample (board Pro.dc.html): 12 weeks, column-major from Monday, busier on weekdays; the last
 * cell is the future Sunday (-1). Deterministic, so the build and the board draw the same grid.
 */
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
