import { planUntil, type TPresetId, type TTheme } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { extendAsk, finishAsk } from '../end.js';
import { openStats } from '../stats/panel.js';
import { hm, mins, nextWall, stepCustom, wallOf, when } from '../format.js';
import { t } from '../i18n.js';
import { applyTheme, nextTheme } from '../theme.js';
import { openDialog } from './dialog.js';
import { openSettings } from './settings.js';
import { toast } from './toast.js';
import { moreCss } from './more-css.js';
import { liveSession } from './view.js';

export function untilSlots(now = Date.now()): number[] {
  let at = Math.ceil((now + 20 * 60_000) / 1_800_000) * 1_800_000;
  const out: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    out.push(at);
    at += i < 1 ? 1_800_000 : 3_600_000;
  }
  return out;
}

let panelsBound = false;

function bindPanels(ctx: IToolCtx): void {
  if (panelsBound) return;
  panelsBound = true;
  const { root, store } = ctx;
  const input = root.querySelector<HTMLInputElement>('[data-until-input]');
  const put = (key: string, text: string) => {
    for (const n of root.querySelectorAll(`[data-t="${key}"]`)) if (n.textContent !== text) n.textContent = text;
  };
  const paint = () => {
    const s = store.get();
    if (s.ui.open !== 'until') return;
    const c24 = s.settings.ambient.clock24h;
    const wall =
      liveSession(s)?.plan.type === 'until' || s.selectedPreset === 'until' ? s.settings.lastUntilWall : null;
    const at = wall ? nextWall(wall) : 0;
    untilSlots().forEach((ms, i) => {
      put(`slot${String(i)}`, hm(ms, c24));
      put(
        `slotSub${String(i)}`,
        t(new Date(ms).getDate() === new Date().getDate() ? 'tool.slot.today' : 'tool.slot.tomorrow'),
      );
      root
        .querySelector(`[data-slot="${String(i)}"]`)
        ?.setAttribute('aria-pressed', String(!!wall && wallOf(ms) === wall));
    });
    if (input && document.activeElement !== input) input.value = wall ?? wallOf(untilSlots()[0] ?? Date.now());
    put('pastQ', t('tool.until.past', { time: hm(at, c24) }));
    put(
      'pastIn',
      t('tool.until.pastIn', {
        length: mins(Math.max(1, Math.round((at - Date.now()) / 60_000))),
      }),
    );
  };
  store.subscribe(paint);
  window.setInterval(paint, 30_000);
  input?.addEventListener('change', () => {
    const m = /^(\d{1,2}):(\d{2})/u.exec(input.value);
    if (!m) return;
    const wall = `${(m[1] ?? '').padStart(2, '0')}:${m[2] ?? '00'}`;
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    setUntil(ctx, wall, d.getTime() <= Date.now());
  });
}

function setUntil(ctx: IToolCtx, wall: string, past = false): void {
  const s = ctx.store.get();
  const settings = { ...s.settings, lastUntilWall: wall };
  ctx.storage.writeSettings(settings);
  if (liveSession(s)) {
    ctx.store.set({ settings, ui: { open: '', past: false } });
    void ctx.startPlan(planUntil(wall), 'until', true);
  } else
    ctx.store.set({
      settings,
      selectedPreset: 'until',
      eightHour: false,
      ui: { past },
    });
}

function setCustom(ctx: IToolCtx, up: boolean): void {
  const s = ctx.store.get();
  const act = liveSession(s);
  const cur =
    act?.presetId === 'custom' && act.endsAt !== null
      ? Math.round((act.endsAt - act.startedAt) / 60_000)
      : s.settings.lastCustomMs / 60_000;
  const ms = stepCustom(cur, up) * 60_000;
  const settings = { ...s.settings, lastCustomMs: ms };
  ctx.storage.writeSettings(settings);
  ctx.store.set({ settings, selectedPreset: 'custom', eightHour: false });
  if (act) void ctx.startPlan({ type: 'duration', ms }, 'custom', true);
  const m = ms / 60_000;
  ctx.root
    .querySelector('[data-act="less"]')
    ?.setAttribute('aria-label', t(m > 720 ? 'tool.custom.less60' : 'tool.custom.less5'));
  ctx.root
    .querySelector('[data-act="more5"]')
    ?.setAttribute('aria-label', t(m >= 720 ? 'tool.custom.more60' : 'tool.custom.more5'));
}

function openPanel(ctx: IToolCtx, panel: 'until' | 'custom' | 'more'): void {
  bindPanels(ctx);
  const s = ctx.store.get();
  if (!liveSession(s) && panel !== 'more') {
    if (panel === 'until' && !(s.selectedPreset === 'until' && s.settings.lastUntilWall))
      setUntil(ctx, wallOf(untilSlots()[0] ?? Date.now()));
    else ctx.store.set({ selectedPreset: panel, eightHour: false });
  }
  ctx.store.set({ ui: { open: panel } });
  const box = ctx.root.querySelector<HTMLElement>(`.at-lp-${panel}`);
  box?.querySelector<HTMLElement>(panel === 'until' ? '.at-slot' : 'button')?.focus();
}

export function act(ctx: IToolCtx, name: string, el: HTMLElement): void {
  // Panels and sheets style from the on-demand sheet; they open once it is in.
  void moreCss().then(() => {
    const { store } = ctx;
    if (name === 'until' || name === 'custom' || name === 'more') openPanel(ctx, name);
    else if (name === 'close') {
      store.set({ ui: { open: '', past: false } });
      ctx.root.querySelector<HTMLElement>('[data-chips] [aria-pressed="true"], [data-chips] button')?.focus();
    } else if (name === 'slot') {
      const ms = untilSlots()[Number(el.dataset.slot)];
      if (ms) setUntil(ctx, wallOf(ms));
    } else if (name === 'less' || name === 'more5') setCustom(ctx, name === 'more5');
    else if (name === 'changeTime') setUntil(ctx, wallOf(untilSlots()[0] ?? Date.now()));
    else if (name === 'why') store.set({ ui: { why: !store.get().ui.why } });
    else if (name === 'add15' || name === 'add30' || name === 'add60')
      extendAsk(ctx, { add15: 15, add30: 30, add60: 60 }[name] * 60_000);
    else if (name === 'askStop') finishAsk(ctx);
    else if (name === 'battSettings') openSettings(ctx, el);
  });
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

export function openShare(ctx: IToolCtx, opener?: Element | null): void {
  const el = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="share"]');
  if (!el) return;
  if (el.open) {
    el.close();
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  const q = <T extends Element>(sel: string) => el.querySelector<T>(sel);
  const input = q<HTMLInputElement>('[data-share-url]');
  const auto = q<HTMLInputElement>('[data-share-auto]');
  const msg = q<HTMLElement>('[data-share-msg]');
  const url = () => new URL(sharePath(ctx) + (auto?.checked ? '?autostart=1' : ''), location.origin).toString();
  const s = ctx.store.get();
  const label = q<HTMLElement>('[data-share-label]');
  const pre = s.session?.presetId ?? s.selectedPreset;
  if (label)
    label.textContent =
      pre === 'pinf'
        ? t('tool.share.bodyInf')
        : t('tool.share.body', {
            label:
              pre === 'until' && s.session?.plan.type === 'until'
                ? when(s.session.endsAt ?? 0)
                : t(`tool.preset.${pre === 'custom' || pre === 'until' ? 'pinf.sr' : pre}`),
          });
  if (input) input.value = url();
  if (msg) msg.textContent = '';
  if (el.dataset.wired !== '1') {
    el.dataset.wired = '1';
    const copy = q<HTMLElement>('[data-share-copy]');
    auto?.addEventListener('change', () => {
      if (input) input.value = url();
      copy?.removeAttribute('data-done');
    });
    input?.addEventListener('focus', () => {
      input.select();
    });
    copy?.addEventListener('click', () => {
      void navigator.clipboard.writeText(input?.value ?? '').then(() => {
        copy.dataset.done = '';
        copy.setAttribute('aria-label', t('tool.toast.copied'));
        toast(ctx.store, {
          kind: 'success',
          text: t('tool.toast.copied'),
          id: 'copy',
        });
      });
    });
    q('[data-share-native]')?.addEventListener('click', () => {
      if ('share' in navigator)
        void navigator.share({ url: input?.value ?? '', title: 'AwakeTab' }).catch(() => undefined);
      else if (msg) msg.textContent = t('tool.share.noNative');
    });
  }
  openDialog(el, opener);
  ctx.track('share_click');
}

export { toggleFullscreen } from '../fullscreen.js';

export function help(ctx: IToolCtx, show?: boolean, opener?: Element | null): void {
  const dlg = ctx.root.querySelector<HTMLDialogElement>('[data-dialog="shortcuts"]');
  if (!dlg) return;
  if (!(show ?? !dlg.open)) dlg.close();
  else openDialog(dlg, opener);
}

export function open(ctx: IToolCtx, el: HTMLElement): void {
  const d = el.dataset;
  if ('openSettings' in d) openSettings(ctx, el);
  else if ('openStats' in d) openStats(ctx, el);
  else if ('openShare' in d) openShare(ctx, el);
  else if ('openPip' in d) pip(ctx);
  else help(ctx, true, el);
}

export function pip(ctx: IToolCtx): void {
  void import('../pip.js').then(({ togglePip }) =>
    togglePip(ctx).then((kind) => {
      if (kind === 'blocked')
        toast(ctx.store, {
          kind: 'info',
          text: t('tool.toast.pipBlocked'),
          id: 'pip',
        });
      else if (kind !== 'closed') ctx.track('pip_open');
    }),
  );
}

export function cycleTheme(ctx: IToolCtx, theme: TTheme = nextTheme(ctx.store.get().settings.theme)): void {
  const next = { ...ctx.store.get().settings, theme };
  ctx.storage.writeSettings(next);
  ctx.store.set({ settings: next });
  applyTheme(theme, ctx.store.get().ui.mode === 'night');
}
