import { planUntil, type TPresetId, type TTheme } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { EIGHT_H_MS } from '../params.js';
import { applyTheme, nextTheme } from '../theme.js';
import { bindCustomDialog, bindUntilDialog } from './dialogs.js';
import { toast } from './toast.js';

function dialog(ctx: IToolCtx, name: 'custom' | 'until' | 'share'): HTMLDialogElement | null {
  const el = ctx.root.querySelector<HTMLDialogElement>(`[data-dialog="${name}"]`);
  if (el && el.dataset.closeBound !== '1') {
    el.dataset.closeBound = '1';
    el.addEventListener('close', () => {
      ctx.store.set({ ui: { dialog: null } });
    });
  }
  return el;
}

function show(ctx: IToolCtx, el: HTMLDialogElement, name: 'custom' | 'until' | 'share'): void {
  ctx.store.set({ ui: { dialog: name } });
  if (!el.open) el.showModal();
}

export function openCustom(ctx: IToolCtx): void {
  const el = dialog(ctx, 'custom');
  if (!el) return;
  if (el.dataset.bound !== '1') {
    el.dataset.bound = '1';
    bindCustomDialog(el, {
      lastCustomMs: ctx.store.get().settings.lastCustomMs,
      onStart: (ms) => {
        const next = { ...ctx.store.get().settings, lastCustomMs: ms };
        ctx.storage.writeSettings(next);
        ctx.store.set({ settings: next, selectedPreset: 'custom', eightHour: ms === EIGHT_H_MS });
        void ctx.startPlan({ type: 'duration', ms }, 'custom');
      },
    });
  }
  show(ctx, el, 'custom');
}

export function openUntil(ctx: IToolCtx): void {
  const el = dialog(ctx, 'until');
  if (!el) return;
  if (el.dataset.bound !== '1') {
    el.dataset.bound = '1';
    bindUntilDialog(el, {
      lastWall: ctx.store.get().settings.lastUntilWall,
      onStart: (wall) => {
        const next = { ...ctx.store.get().settings, lastUntilWall: wall };
        ctx.storage.writeSettings(next);
        ctx.store.set({ settings: next, selectedPreset: 'until' });
        void ctx.startPlan(planUntil(wall), 'until');
      },
    });
  }
  show(ctx, el, 'until');
}

const SHARE_ROUTES: Partial<Record<TPresetId, string>> = {
  p15: '/15m',
  p30: '/30m',
  p45: '/45m',
  p60: '/1h',
  p120: '/2h',
  p240: '/4h',
  pinf: '/',
};

export function sharePath(ctx: Pick<IToolCtx, 'store'>): string {
  const s = ctx.store.get();
  const preset = s.session?.presetId ?? s.selectedPreset;
  if (preset === 'until' && s.session?.plan.type === 'until') return `/until/${s.session.plan.wall.replace(':', '-')}`;
  return SHARE_ROUTES[preset] ?? '/';
}

export function openShare(ctx: IToolCtx): void {
  const el = dialog(ctx, 'share');
  if (!el) return;
  const input = el.querySelector<HTMLInputElement>('[data-share-url]');
  if (input) input.value = new URL(sharePath(ctx), location.origin).toString();
  if (el.dataset.bound !== '1') {
    el.dataset.bound = '1';
    el.querySelector('[data-share-copy]')?.addEventListener('click', () => {
      if (!input) return;
      void navigator.clipboard.writeText(input.value).then(() => {
        toast(ctx.store, { kind: 'success', text: t('tool.toast.copied'), id: 'copy' });
      });
    });
  }
  show(ctx, el, 'share');
  ctx.track('share_click');
}

export { toggleFullscreen } from '../fullscreen.js';

export function cycleTheme(ctx: IToolCtx, theme: TTheme = nextTheme(ctx.store.get().settings.theme)): void {
  const next = { ...ctx.store.get().settings, theme };
  ctx.storage.writeSettings(next);
  ctx.store.set({ settings: next });
  applyTheme(theme, ctx.store.get().ui.mode === 'night');
}
