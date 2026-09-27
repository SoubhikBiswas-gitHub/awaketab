export type TEmbedScheme = 'auto' | 'light' | 'dark';

export interface IEmbedConfig {
  licensed: boolean;
  attribution: boolean;
  accent: string | null;
  scheme: TEmbedScheme | null;
}

export const FREE_CONFIG: IEmbedConfig = { licensed: false, attribution: true, accent: null, scheme: null };

export const EMBED_CONFIG_TIMEOUT_MS = 4000;

const HEX = /^#[0-9a-f]{6}$/iu;

export function parseEmbedConfig(data: unknown): IEmbedConfig {
  if (!data || typeof data !== 'object') return FREE_CONFIG;
  const d = data as Record<string, unknown>;
  const licensed = d.licensed === true;
  const theme = d.theme && typeof d.theme === 'object' ? (d.theme as Record<string, unknown>) : null;
  const accent = licensed && typeof theme?.accent === 'string' && HEX.test(theme.accent) ? theme.accent.toLowerCase() : null;
  const scheme =
    licensed && (theme?.scheme === 'auto' || theme?.scheme === 'light' || theme?.scheme === 'dark') ? theme.scheme : null;
  return { licensed, attribution: !(licensed && d.attribution === false), accent, scheme };
}

export async function fetchEmbedConfig(
  domain: string | null,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = EMBED_CONFIG_TIMEOUT_MS,
): Promise<IEmbedConfig> {
  if (!domain) return FREE_CONFIG;
  const ctrl = new AbortController();
  const timer = setTimeout(() => {
    ctrl.abort();
  }, timeoutMs);
  try {
    const res = await fetchImpl(`/api/embed/config?domain=${encodeURIComponent(domain)}`, { signal: ctrl.signal });
    if (!res.ok) return FREE_CONFIG;
    return parseEmbedConfig(await res.json());
  } catch {
    return FREE_CONFIG;
  } finally {
    clearTimeout(timer);
  }
}

export function luminance(hex: string): number {
  const ch = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5);
}

export function onAccent(hex: string): '#000000' | '#ffffff' {
  const l = luminance(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000000' : '#ffffff';
}

export function applyBranding(root: HTMLElement, cfg: IEmbedConfig): void {
  if (!cfg.accent) return;
  root.style.setProperty('--at-embed-brand', cfg.accent);
  root.style.setProperty('--at-embed-on-brand', onAccent(cfg.accent));
}
