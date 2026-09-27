import { planFromPreset, PRESET_MS, type ISession, type TPresetId } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { dateLong, dayDiff, hm, nextWall, remainingOf, since, splitDigits, when, words } from '../format.js';
import { t } from '../i18n.js';
import type { IToolState } from '../store.js';
import type * as TMore from './view-more.js';

export type TStatus =
  'ready' | 'starting' | 'awake' | 'paused' | 'blocked' | 'needtap' | 'fallback' | 'timesup' | 'ended';

const BY_LOCK: Partial<Record<IToolState['lock'], TStatus>> = {
  requesting: 'starting',
  held: 'awake',
  fallback: 'fallback',
  lost: 'paused',
  denied: 'blocked',
  unsupported: 'needtap',
};

export function statusOf(s: IToolState): TStatus {
  return s.ui.ask
    ? 'timesup'
    : s.ui.tap && s.lock === 'denied'
      ? 'ready'
      : (BY_LOCK[s.lock] ?? (s.ui.done ? 'ended' : 'ready'));
}

export function liveSession(s: IToolState): ISession | null {
  const x = s.session;
  return x && (x.status === 'active' || x.status === 'paused') ? x : null;
}

export function plannedSec(s: IToolState, routeUntil: string | null, now = Date.now()): number {
  const id = s.selectedPreset;
  const wall = routeUntil ?? (id === 'until' ? s.settings.lastUntilWall : null);
  if (wall) return Math.max(60, Math.round((nextWall(wall, now) - now) / 1000));
  if (s.eightHour) return 28_800;
  return id === 'pinf'
    ? 0
    : id === 'custom'
      ? s.settings.lastCustomMs / 1000
      : id === 'until'
        ? 1800
        : PRESET_MS[id] / 1000;
}

export function mountView(ctx: IToolCtx): () => void {
  const { root, store, params } = ctx;
  const html = document.documentElement;
  // Static lists: the PiP window takes the pill and timer out of the page and they must keep updating.
  const slots = [...root.querySelectorAll<HTMLElement>('[data-t]')];
  const labels = [...root.querySelectorAll<HTMLElement>('[data-l]')];
  const all = (sel: string) => root.querySelectorAll<HTMLElement>(sel);
  const pill = root.querySelector<HTMLElement>('[data-pill]');
  const routeUntil = params.routeUntil ?? params.until;
  let spoken = -1;
  let lazy = 0;
  let extra: typeof TMore | undefined;
  const load = (bit: number, fn: () => void) => {
    if (!(lazy & bit)) {
      lazy |= bit;
      fn();
    }
  };

  const render = () => {
    const s = store.get();
    const { ui, settings } = s;
    const now = Date.now();
    const st = statusOf(s);
    const c24 = settings.ambient.clock24h;
    const act = liveSession(s);
    const done = ui.done;
    const batt = st === 'ended' && done?.reason === 'battery';
    const live = st === 'awake' || st === 'fallback' || st === 'starting';
    const held = st === 'awake' || st === 'fallback';
    const deferred = st === 'ready' && s.deferredAutostart;
    const x = s.session;
    let total = plannedSec(s, routeUntil, now);
    let left = total;
    let el = 0;
    if (act && st !== 'timesup') {
      total =
        act.endsAt === null
          ? 0
          : (act.endsAt - act.startedAt + (act.plan.type === 'duration' ? act.pausedMs : 0)) / 1000;
      left = Math.ceil((remainingOf(act, now) ?? 0) / 1000);
      el = Math.max(0, Math.floor((now - act.startedAt - act.pausedMs) / 1000));
    } else if (st === 'ended' || st === 'timesup') {
      total = done ? done.total / 1000 : x?.endsAt ? (x.endsAt - x.startedAt) / 1000 : total;
      left = batt ? Math.ceil(done.left / 1000) : 0;
    }
    const inf = total === 0;
    const final = held && !inf && left > 0 && left <= 60;
    const shown = inf ? (live ? el : null) : left;
    const [a, b] = shown === null ? ['∞', ''] : splitDigits(shown);
    const endMs = Math.round((now + left * 1000) / 60_000) * 60_000;
    const untilAt =
      act?.plan.type === 'until' ? (act.endsAt ?? now) : nextWall(routeUntil ?? settings.lastUntilWall ?? '00:00', now);

    // Kicker and meta line (canvas renderVals): [kicker key, meta text, meta value].
    let km: [string, string, string] = ['left', 'until', when(endMs, c24)];
    if (st === 'ready') km = ['ready', inf ? 'untilStop' : 'endsAt', inf ? '' : km[2]];
    if (st === 'ended') km = ['complete', 'endedAt', hm(done?.at ?? now, c24)];
    if (batt) km = ['battery', 'at', t('tool.meta.battery', { percent: settings.battery.threshold })];
    if (st === 'starting') km[0] = 'starting';
    if (live && inf && act) km = ['awakeFor', 'since', since(act.startedAt, c24)];
    if (st === 'paused') km = ['paused', 'resumes', ''];
    if (st === 'blocked') km = ['blocked', 'seeFix', ''];
    if (st === 'needtap' || (ui.tap && st === 'ready')) km = ['needtap', 'tapBelow', ''];
    if (ui.ask) km = ['timesup', 'reachedZero', hm(ui.ask.until - 60_000, c24)];
    if (final) km[0] = 'final';

    const tomorrow = dayDiff(untilAt, now) > 0;
    let note = st === 'blocked' ? '' : t(`tool.note.${st}`, { time: hm(act?.startedAt ?? now, c24) });
    if (routeUntil && st === 'ready' && tomorrow) note = t('tool.note.overnight');
    if (deferred) note = t('tool.note.deferred');
    if (live && !inf && left >= 86_400 && st !== 'starting')
      note = t('tool.note.multiday', {
        date: `${dateLong(endMs, false)} · ${hm(endMs, c24)}`,
      });
    if (live && inf && el >= 86_400) note = t('tool.note.longNoLimit');
    if (final) note = t(settings.endBehaviour === 'stop' ? 'tool.note.finalStop' : 'tool.note.finalAsk');
    if (ui.rcpt && st === 'awake' && !final && ui.ok)
      note = t(ui.auto ? 'tool.note.askedAuto' : 'tool.note.asked', {
        asked: hm(ui.asked, c24, true),
        secs: ((ui.ok - ui.asked) / 1000).toFixed(1),
      });

    const pre = act ? act.presetId : s.selectedPreset;
    const isUntil = !!routeUntil || pre === 'until';
    const len = inf ? '∞' : words(total);
    const untilTime = routeUntil ? hm(untilAt, c24) : when(untilAt, c24);
    let cta = t(deferred ? 'tool.cta.startNow' : 'tool.cta.keep', {
      length: len,
    });
    let ctaL = inf ? t(deferred ? 'tool.cta.startNowInf' : 'tool.cta.keepInf') : cta;
    if (isUntil) cta = ctaL = t('tool.cta.until', { time: untilTime });
    if (st === 'ended') {
      cta = isUntil ? t('tool.cta.againUntil', { time: untilTime }) : t('tool.cta.again', { length: len });
      ctaL = inf ? t('tool.cta.againInf') : cta;
    }

    const hour = new Date(now).getHours();
    const phase =
      hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night';
    const nowT = hm(now, c24, settings.ambient.showSeconds);
    const askLeft = ui.ask ? Math.max(0, Math.ceil((ui.ask.until - now) / 1000)) : 0;
    const minsLeft = Math.ceil(left / 60);
    let announce = final ? t('tool.timer.announce', { minutes: 1 }) : deferred ? t('tool.announce.deferred') : '';
    if (held && !final && !inf && minsLeft % 5 === 0 && minsLeft !== spoken)
      announce = t('tool.timer.announce', { minutes: minsLeft });
    if (held) spoken = minsLeft;
    const vals: Record<string, string> = {
      k: t(`tool.kicker.${km[0]}`),
      a,
      b,
      ma: t(`tool.meta.${km[1]}`),
      mb: km[2],
      note,
      cta,
      of: inf ? t('tool.noLimit') : t('tool.ofTotal', { length: len }),
      hz: `${t(`tool.sky.${phase}`)} · ${nowT}`,
      date: dateLong(now),
      now: nowT,
      nowShows: t('settings.clock.now', { time: nowT }),
      announce,
    };
    const aria: Record<string, string> = {
      timer:
        shown === null
          ? t('tool.timer.noLimit')
          : t(live && inf ? 'tool.timer.awakeSoFar' : 'tool.timer.left', {
              time: shown >= 86_400 ? words(shown) : a + b,
            }),
      cta: ctaL,
    };
    // The less common texts come from a lazy module the first time they are needed (docs/00 §11 budget).
    if (isUntil || pre === 'custom' || ui.open || ui.ask || batt || st === 'blocked')
      load(
        4,
        () =>
          void import('./view-more.js').then((m) => {
            extra = m;
            render();
          }),
      );
    if (extra) {
      const [v, l] = extra.more({
        s,
        now,
        pre,
        untilAt,
        customSec: pre === 'custom' ? total : settings.lastCustomMs / 1000,
        askLeft,
      });
      Object.assign(vals, v);
      Object.assign(aria, l);
    }
    for (const n of slots) {
      const v = vals[n.dataset.t ?? ''];
      if (v !== undefined && n.textContent !== v) n.textContent = v;
    }
    for (const n of labels) {
      const v = aria[n.dataset.l ?? ''];
      if (v !== undefined && n.getAttribute('aria-label') !== v) n.setAttribute('aria-label', v);
    }
    const set = (sel: string, attr: string, on: (n: HTMLElement) => boolean) => {
      for (const n of all(sel)) n.setAttribute(attr, String(on(n)));
    };
    const face = settings.face;
    set('[data-preset]', 'aria-pressed', (n) => n.dataset.preset === pre);
    set('[data-act="more"]', 'aria-pressed', () => pre === 'until' || pre === 'custom');
    set('[role="tab"][data-face]', 'aria-selected', (n) => n.dataset.face === face);
    set('[data-act="why"]', 'aria-expanded', () => ui.why);
    if (face === 'ring') delete html.dataset.face;
    else html.dataset.face = face;
    if (pill) {
      pill.dataset.lock = s.lock;
      const text = pill.querySelector('[data-pill-text]');
      if (text) text.textContent = t(`tool.pill.${s.lock}`);
    }

    const d = root.dataset;
    d.status = st;
    if (st !== 'starting' && (st !== 'ready' || ui.tap || deferred)) d.settled = '';
    d.open = batt || st === 'blocked' || st === 'needtap' || st === 'timesup' ? '' : ui.open;
    d.units = shown === null ? '' : shown >= 86_400 ? 'd' : shown >= 3600 ? 'h' : '';
    d.phase = phase;
    const flags: Record<string, boolean> = {
      final,
      inf,
      deferred,
      why: ui.why,
      toast: ui.toasts.length > 0,
      batt,
      fb: st === 'fallback' || !!ui.ask?.fb,
      cause: !!s.advice,
      past: ui.past && pre === 'until',
      tomorrow,
    };
    for (const [key, on] of Object.entries(flags)) root.toggleAttribute(`data-${key}`, on);
    root.style.setProperty('--at-p', (inf ? 1 : Math.min(1, left / total)).toFixed(4));
    root.style.setProperty('--at-ask', (askLeft / 60).toFixed(4));

    // Lazy pieces: the Done receipt and "How AwakeTab knows" only load when shown.
    if (st === 'ended' && !batt) load(1, () => void import('./receipt.js').then((m) => m.mountReceipt(ctx)));
    if (ui.why) load(2, () => void import('./why.js').then((m) => m.mountWhy(ctx)));
  };

  root.addEventListener('click', (e) => {
    const el =
      e.target instanceof Element
        ? e.target.closest<HTMLElement>('[data-act],[data-preset],[data-face],[data-slot]')
        : null;
    if (!el || el.closest('dialog')) return;
    const { act: a, preset: pre, face } = el.dataset;
    const s = store.get();
    const act = liveSession(s);
    if (face) {
      const next = { ...s.settings, face: face as typeof s.settings.face };
      ctx.storage.writeSettings(next);
      store.set({ settings: next });
    } else if (pre && pre !== 'until' && pre !== 'custom') {
      const id = pre as Exclude<TPresetId, 'custom' | 'until'>;
      // Length changes apply at once while a session runs (DESIGN.md §5); otherwise they choose what Start runs.
      if (!act) store.set({ selectedPreset: id, eightHour: false });
      else if (act.presetId !== id) void ctx.startPlan(planFromPreset(id), id, true);
    } else if (a === 'start' || a === 'retry' || a === 'fallback') ctx.startCurrent();
    else if (a === 'stop') ctx.stop();
    else if (a === 'extend') {
      ctx.engine.addTime(900_000);
      ctx.syncLock();
    } else
      void import('./actions.js').then((m) => {
        m.act(ctx, a ?? pre ?? 'slot', el);
      });
  });

  const unsub = store.subscribe(render);
  const id = window.setInterval(render, 1000);
  return () => {
    unsub();
    window.clearInterval(id);
  };
}
