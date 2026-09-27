export const ADS_ENABLED = import.meta.env.PUBLIC_ADS_ENABLED === '1';

export const AD_CLIENT = '';
export const AD_UNITS = {
  rail: 'rail',
  inline: 'inline',
} as const;

export interface IAdsConfig {
  enabled: boolean;
}

let cachedConfig: { at: number; value: IAdsConfig } | null = null;

export function shouldRenderAdSlots(): boolean {
  return ADS_ENABLED;
}

export function inCmpRegion(locale = typeof navigator === 'undefined' ? 'en' : navigator.language): boolean {
  return (
    /-(AT|BE|BG|HR|CY|CZ|DK|EE|FI|FR|DE|GR|HU|IE|IT|LV|LT|LU|MT|NL|PL|PT|RO|SK|SI|ES|SE|GB|UK|CH)\b/iu.test(locale) ||
    /^(de|fr|it|es|nl|pl|sv|da|fi|pt|el|cs|hu|ro|bg|hr|sk|sl|lt|lv|et|ga|mt)$/iu.test(locale.split('-')[0] ?? '')
  );
}

export function hasCmpConsent(): boolean {
  if (!inCmpRegion()) return true;
  return (globalThis as { __atCmpConsent?: boolean }).__atCmpConsent === true;
}

async function remoteConfig(): Promise<IAdsConfig> {
  const now = Date.now();
  if (cachedConfig && now - cachedConfig.at < 5 * 60_000) return cachedConfig.value;
  try {
    const res = await fetch('/config/ads.json', { cache: 'no-store' });
    const value = (await res.json()) as IAdsConfig;
    cachedConfig = { at: now, value };
    return value;
  } catch {
    return { enabled: false };
  }
}

function afterLcp(load: () => void): void {
  const run = () => {
    const ric = globalThis.requestIdleCallback;
    if (typeof ric === 'function')
      ric(
        () => {
          load();
        },
        { timeout: 4000 },
      );
    else setTimeout(load, 2500);
  };
  try {
    const obs = new PerformanceObserver((list) => {
      if (list.getEntries().length) {
        obs.disconnect();
        run();
      }
    });
    obs.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(run, 4000);
  } catch {
    run();
  }
}

export function licenseIsAdsFree(): boolean {
  try {
    const raw = localStorage.getItem('at.v1.license');
    if (!raw) return false;
    const rec = JSON.parse(raw) as { features?: string[] };
    return rec.features?.includes('ads.free') === true;
  } catch {
    return false;
  }
}

export async function bootAds(opts: { onSlot: (page: string) => void }): Promise<void> {
  if (!ADS_ENABLED || licenseIsAdsFree() || !hasCmpConsent()) return;
  const cfg = await remoteConfig();
  if (!cfg.enabled) return;
  afterLcp(() => {
    const slots = document.querySelectorAll<HTMLElement>('[data-ad-slot]');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.loaded = '1';
          opts.onSlot(location.pathname);
          io.unobserve(el);
        }
      },
      { rootMargin: '200px' },
    );
    for (const slot of slots) io.observe(slot);
  });
}
