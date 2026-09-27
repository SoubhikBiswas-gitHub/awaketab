// Shared helpers for GET /api/embed/config (docs/09 §7.1, docs/11 §2).

const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u;
const HEX_RE = /^#[0-9a-f]{6}$/iu;
const SCHEMES = new Set(['auto', 'light', 'dark']);

export interface IEmbedRecord {
  keyHash?: string;
  attribution?: boolean;
  theme?: { accent?: unknown; scheme?: unknown } | null;
  expiresAt?: number | null;
}

export const FREE_EMBED_CONFIG = { licensed: false, attribution: true, theme: null, expiresAt: null } as const;

export function normalizeDomain(raw: string): string | null {
  let host = raw.trim().toLowerCase();
  try {
    if (host.includes('://')) host = new URL(host).hostname;
  } catch {
    return null;
  }
  host = host.replace(/\.$/u, '').replace(/^www\./u, '');
  return HOST_RE.test(host) ? host : null;
}

export function candidateDomains(host: string): string[] {
  const labels = host.split('.');
  const out: string[] = [];
  for (let i = 0; i <= labels.length - 2; i += 1) out.push(labels.slice(i).join('.'));
  return out;
}

export function cleanTheme(theme: IEmbedRecord['theme']): { accent: string | null; scheme: string } | null {
  if (!theme || typeof theme !== 'object') return null;
  const accent = typeof theme.accent === 'string' && HEX_RE.test(theme.accent) ? theme.accent.toLowerCase() : null;
  const scheme = typeof theme.scheme === 'string' && SCHEMES.has(theme.scheme) ? theme.scheme : 'auto';
  return { accent, scheme };
}
