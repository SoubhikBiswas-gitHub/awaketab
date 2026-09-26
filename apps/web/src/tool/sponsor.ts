import { hasFeature, type IToolCtx } from './ctx.js';

export interface ISponsorConfig {
  enabled: boolean;
  id: string;
  name: string;
  text: string;
  url: string;
}

/** Validates /config/sponsor.json — first-party, but still treated as untrusted input. */
export function parseSponsor(raw: unknown): ISponsorConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o.enabled !== true) return null;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const id = str(o.id, 32);
  const name = str(o.name, 60);
  const text = str(o.text, 140);
  const url = str(o.url, 300);
  if (!/^[a-z0-9_-]+$/u.test(id) || !name || !text) return null;
  try {
    if (new URL(url).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { enabled: true, id, name, text, url };
}

async function loadSponsor(): Promise<ISponsorConfig | null> {
  try {
    const res = await fetch('/config/sponsor.json', { cache: 'no-cache' });
    return res.ok ? parseSponsor(await res.json()) : null;
  } catch {
    return null;
  }
}

/**
 * SponsorCard (docs/05 §3.23, docs/09): one disclosed card in a fixed 300 × 100 slot below the chips, shown in
 * `idle` only. The slot is rendered at build time only when PUBLIC_SPONSOR_ENABLED=1 and keeps its size when
 * empty or hidden (visibility, not display), so CLS stays 0. Pro `ads.free` skips it. No third-party request:
 * the config is same-origin and the card is a plain link.
 */
export async function mountSponsor(ctx: IToolCtx, slot: HTMLElement): Promise<() => void> {
  if (hasFeature(ctx, 'ads.free')) return () => undefined;
  const cfg = await loadSponsor();
  if (!cfg) return () => undefined;
  const name = slot.querySelector<HTMLAnchorElement>('[data-sponsor-link]');
  const text = slot.querySelector<HTMLElement>('[data-sponsor-text]');
  if (!name || !text) return () => undefined;
  name.href = cfg.url;
  name.textContent = cfg.name;
  text.textContent = cfg.text;
  const sponsorId = cfg.id;
  name.addEventListener('click', () => {
    ctx.track('sponsor_click', { sponsorId });
  });
  let viewed = false;
  return ctx.store.subscribe((s) => {
    const idle = s.lock === 'idle' && !(s.session?.status === 'active' || s.session?.status === 'paused');
    slot.dataset.state = idle ? 'shown' : 'hidden';
    slot.inert = !idle;
    if (idle && !viewed) {
      viewed = true;
      ctx.track('sponsor_view', { sponsorId });
    }
  });
}
