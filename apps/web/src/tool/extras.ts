import type { ILicenseRecord, TPresetId } from '@awaketab/core';
import { hasFeature, type IToolCtx } from './ctx.js';
import { dateLong } from './format.js';
import { mountPwa } from './pwa.js';
import { mountSponsor } from './sponsor.js';
import { act } from './ui/actions.js';
import { openDialog } from './ui/dialog.js';
import { mountLangSuggest } from './ui/lang-suggest.js';
import { applyAccent } from './accent.js';
import { t } from './i18n.js';
import type { IStore } from './store.js';
import { toast as pushToast } from './ui/toast.js';
import { liveSession } from './ui/view.js';
import lapseCss from '../styles/tool-lapse.css?url';

function sessionSource(source: string | null): 'web' | 'pwa' | 'pip' | 'ext' | 'embed' {
  if (source === 'pwa' || source === 'pip' || source === 'ext' || source === 'embed') return source;
  return 'web';
}

// Boot drops the query from the address bar, so the source comes from the parsed boot params (set in mountLate).
let source: string | null = null;
const opts = () => ({
  telemetry: true,
  source: sessionSource(source),
  locale: document.documentElement.lang || 'en',
});

export function track(store: IStore, event: string, params?: Record<string, string | number | boolean>): void {
  if (!store.get().settings.telemetry) return;
  void import('../lib/analytics.js').then((mod) => {
    mod.track(event, params ?? {}, opts());
  });
}

export function mountExtras(ctx: Pick<IToolCtx, 'store' | 'storage'>): () => void {
  const { store, storage } = ctx;
  void import('../lib/analytics.js').then((mod) => {
    if (store.get().settings.telemetry) mod.bindClientErrors(opts());
  });
  track(store, 'page_view');
  const proBadge = document.querySelector<HTMLElement>('[data-pro-badge]');
  const syncPro = () => {
    if (proBadge) proBadge.hidden = !(hasFeature(ctx, 'ads.free') || hasFeature(ctx, 'ambient.packs'));
    // Pack lamps need `ambient.packs`; a lapsed licence falls back to aqua (the boot script applied it pre-paint).
    applyAccent(store.get().settings.accent, hasFeature(ctx, 'ambient.packs'));
  };
  syncPro();
  void import('../lib/license.js').then(async (mod) => {
    const result = await mod.revalidateStoredLicense();
    if (result === 'revoked' || result === 'reactivate') {
      store.set({ license: null });
      storage.writeLicense(null);
      const text = t(result === 'revoked' ? 'license.error.revoked' : 'license.error.token');
      pushToast(store, { kind: 'warn', text, id: 'license' });
    } else {
      store.set({ license: storage.license() });
    }
    syncPro();
    showLapse(ctx, store.get().license);
  });
  const sheet = document.querySelector<HTMLDialogElement>('[data-dialog="pro"]');
  // Settings → Pro opens the Pro sheet in place of Settings; without the island the link goes to /pro.
  document.querySelector('[data-open-pro]')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (sheet) openDialog(sheet, e.target as Element);
  });
  return store.subscribe(syncPro);
}

// A yearly licence past its paid period (a failed renewal, then the end of the 7-day grace) says so above the header,
// as /pro/manage does (lib/manage-page.ts lapseState); dismissing it holds until the licence's expiry changes.
function showLapse(ctx: Pick<IToolCtx, 'storage'>, lic: ILicenseRecord | null): void {
  const box = document.querySelector<HTMLElement>('[data-lapse]');
  if (!box || lic?.plan !== 'pro_yearly') return;
  const exp = lic.exp * 1000;
  // Yearly tokens expire 7 days after the paid period ends (docs/08 §2.4).
  const paid = exp - 6048e5;
  const now = Date.now();
  const state = now >= exp ? 'lapsed' : now >= paid ? 'grace' : '';
  const tips = ctx.storage.onboarding();
  const tip = `pro-lapse-${String(lic.exp)}`;
  if (!state || tips.dismissedTips.includes(tip)) return;
  box.dataset.lapse = state;
  for (const n of box.querySelectorAll('[data-lapse-date]')) n.textContent = dateLong(state === 'grace' ? exp : paid);
  // Its styles load only for this rare state, so they cost the tool page's CSS budget nothing.
  document.head.append(
    Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href: lapseCss,
      onload: () => {
        box.hidden = false;
      },
    }),
  );
  for (const b of box.querySelectorAll('[data-lapse-dismiss]'))
    b.addEventListener('click', () => {
      box.hidden = true;
      ctx.storage.writeOnboarding({ ...tips, dismissedTips: [...tips.dismissedTips, tip] });
    });
}

export function mountLate(ctx: IToolCtx): () => void {
  const { root, store, engine } = ctx;
  source = ctx.params.source;
  const offs = [mountExtras(ctx)];
  mountPwa(
    root,
    store,
    () => engine.session?.status,
    () => {
      ctx.track('pwa_install');
    },
  );
  mountLangSuggest(root, ctx.storage);
  // The length links below a preset page's tool switch a running session in place instead of reloading the page
  // (which would drop the lock); "Until a time…" opens the Until panel. Without a session they open their page.
  root.addEventListener('click', (e) => {
    const len = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-len]')?.dataset.len : null;
    if (!len || !liveSession(store.get())) return;
    e.preventDefault();
    // data-len is "presetId:minutes" ("custom:480" for 8 h), or "until".
    const [id, m] = len.split(':') as [TPresetId, string];
    if (m) void ctx.startPlan({ type: 'duration', ms: Number(m) * 60_000 }, id, true);
    else act(ctx, id, root);
  });
  if (root.querySelector('[data-sponsor]')) void mountSponsor(ctx).then((u) => offs.push(u));
  return () => {
    for (const off of offs) off();
  };
}
