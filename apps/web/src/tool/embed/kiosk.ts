/**
 * Kiosk licence unlocks on the tool (docs/09 §7.2, docs/00 §13.2) — the Business-tier sibling of the embed,
 * loaded lazily by main.ts only when the URL carries `#lic=` or `logo=`:
 *
 * 1. `#lic=<token>` — verified offline (`verifyLicenseToken`, no device binding: one kiosk URL is copied to many
 *    screens), stored to `at.v1.license` when it is a valid kiosk-plan token, then stripped from the address bar
 *    with `history.replaceState`. The hash never reaches the server or the `page_view` path.
 * 2. `logo=<https URL>` — shown only with `ambient.logo`; `kiosk.branding` also hides the AwakeTab wordmark and
 *    the rating prompt (`[data-kiosk]` on <html>).
 */
import { verifyLicenseToken, type ILicenseRecord, type TPlanId } from '@awaketab/core';
import { hasFeature, type IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { toast } from '../ui/toast.js';

export const KIOSK_PLANS: readonly TPlanId[] = ['biz_kiosk_site', 'biz_kiosk_5'];
/** Longest accepted `logo=` URL. PROPOSED — add to 00-conventions.md (accepted in §13.10). */
export const KIOSK_LOGO_MAX = 512;

const TOKEN_RE = /^#lic=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/u;

export function readLicHash(hash: string): string | null {
  return TOKEN_RE.exec(hash)?.[1] ?? null;
}

/** `logo=` must be an absolute https URL without credentials; anything else is ignored. */
export function parseLogo(search: string): string | null {
  const raw = new URLSearchParams(search).get('logo');
  if (!raw || raw.length > KIOSK_LOGO_MAX) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

type TVerify = typeof verifyLicenseToken;

export async function applyKioskHash(
  ctx: Pick<IToolCtx, 'store' | 'storage'>,
  loc: Pick<Location, 'hash' | 'pathname' | 'search'>,
  hist: Pick<History, 'replaceState'>,
  verify: TVerify = verifyLicenseToken,
  now: () => number = Date.now,
): Promise<'none' | 'stored' | 'invalid'> {
  const token = readLicHash(loc.hash);
  if (!loc.hash.startsWith('#lic=')) return 'none';
  // Strip first: the token must not linger in the address bar, history or a shared screenshot either way.
  hist.replaceState(null, '', `${loc.pathname}${loc.search}`);
  const state = token ? await verify(token, { deviceId: '' }) : null;
  const plan = state?.plan as TPlanId | null | undefined;
  if (!token || !state?.valid || !plan || !KIOSK_PLANS.includes(plan) || state.exp === null) {
    toast(ctx.store, { kind: 'warn', text: t('kiosk.license.invalid'), id: 'kiosk' });
    return 'invalid';
  }
  const record: ILicenseRecord = {
    v: 1,
    token,
    plan,
    features: state.features,
    exp: state.exp,
    lastValidatedAt: now(),
    deviceId: '',
    deviceLabel: 'kiosk',
  };
  ctx.storage.writeLicense(record);
  ctx.store.set({ license: record });
  return 'stored';
}

export function applyKioskBranding(ctx: Pick<IToolCtx, 'store' | 'root'>, logo: string | null, doc: Document = document): void {
  doc.documentElement.toggleAttribute('data-kiosk', hasFeature(ctx, 'kiosk.branding'));
  if (!logo || !hasFeature(ctx, 'ambient.logo')) return;
  const make = () => {
    const img = doc.createElement('img');
    img.className = 'at-kiosk-logo';
    img.src = logo;
    img.alt = '';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.dataset.kioskLogo = '';
    return img;
  };
  // Standard view and the ambient dialog (message/clock modes are what kiosks usually show).
  ctx.root.querySelector('[data-panel]')?.prepend(make());
  ctx.root.querySelector('[data-ambient]')?.prepend(make());
}

export async function mountKiosk(ctx: IToolCtx, bootSearch: string): Promise<void> {
  await applyKioskHash(ctx, location, history);
  applyKioskBranding(ctx, parseLogo(bootSearch));
}
