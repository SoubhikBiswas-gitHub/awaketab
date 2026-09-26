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
 * SponsorCard (docs/05 §3.23, docs/09): one disclosed card in fixed 300 × 100 slots rendered at build time only
 * when PUBLIC_SPONSOR_ENABLED=1 — `[data-sponsor="idle"]` below the chips (visible in `idle` only) and
 * `[data-sponsor="extend"]` inside the ExtendPrompt. The idle slot keeps its size when empty or hidden
 * (visibility, not display), so CLS stays 0; the extend slot is collapsed before the dialog can ever open when
 * there is nothing to show (Pro `ads.free`, no or invalid config). No third-party request: the config is
 * same-origin and the card is a plain link. `sponsor_view` fires once per page view, whichever slot shows first.
 */
export async function mountSponsor(ctx: IToolCtx): Promise<() => void> {
  const extend = ctx.root.querySelector<HTMLElement>('[data-sponsor="extend"]');
  const cfg = hasFeature(ctx, 'ads.free') ? null : await loadSponsor();
  if (!cfg) {
    if (extend) extend.hidden = true;
    return () => undefined;
  }
  const sponsorId = cfg.id;
  for (const slot of ctx.root.querySelectorAll<HTMLElement>('[data-sponsor]')) {
    const name = slot.querySelector<HTMLAnchorElement>('[data-sponsor-link]');
    const text = slot.querySelector<HTMLElement>('[data-sponsor-text]');
    if (!name || !text) continue;
    name.href = cfg.url;
    name.textContent = cfg.name;
    text.textContent = cfg.text;
    name.addEventListener('click', () => {
      ctx.track('sponsor_click', { sponsorId });
    });
  }
  if (extend) extend.dataset.state = 'shown';
  const idleSlot = ctx.root.querySelector<HTMLElement>('[data-sponsor="idle"]');
  let viewed = false;
  return ctx.store.subscribe((s) => {
    const idle = s.lock === 'idle' && !(s.session?.status === 'active' || s.session?.status === 'paused');
    if (idleSlot) {
      idleSlot.dataset.state = idle ? 'shown' : 'hidden';
      idleSlot.inert = !idle;
    }
    if (!viewed && ((idle && idleSlot) || (s.ui.dialog === 'extend' && extend))) {
      viewed = true;
      ctx.track('sponsor_view', { sponsorId });
    }
  });
}
