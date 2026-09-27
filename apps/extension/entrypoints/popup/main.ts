import 'virtual:at-tokens.css';
import '../../src/styles/base.css';
import './popup.css';
import { PLAN_PRICES, lifetimePrice } from '../../../web/src/lib/license';
import { DEFAULT_META, DEFAULT_ONBOARDING, STORAGE_KEYS, type IMeta, type IOnboarding } from '@awaketab/core';
import { browser } from 'wxt/browser';
import type { IExtApi, TPowerLevel } from '../../src/api';
import { clockParts, keyCaps, roundToMinute, words } from '../../src/format';
import type { IExtState, TExtRequest } from '../../src/messages';
import { loadPage, q, send, show, translateTree } from '../../src/page';
import { allWindows, minutesOf } from '../../src/schedules';
import {
  EXT_KEYS,
  isExtPreset,
  presetOf,
  readExt,
  type IExtSettings,
  type ISchedule,
  type TExtPreset,
} from '../../src/settings';
import { isLive, pillTextKey, remainingMs, totalMs } from '../../src/status';

const C = 2 * Math.PI * 56;
const PRESET_KEYS = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240'] as const;
const PRESET_MS: Record<TExtPreset, number> = {
  p15: 15 * 60_000,
  p30: 30 * 60_000,
  p45: 45 * 60_000,
  p60: 60 * 60_000,
  p120: 120 * 60_000,
  p240: 240 * 60_000,
  pinf: 0,
};
const QUARTER = 15 * 60_000;
const DAY = 86_400_000;
const RECEIPT_MS = 5 * 60_000;
const TIPS_ID = 'ext-first-open';
const GLYPH = {
  dot: 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z',
  pause: 'M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z',
  tri: 'M6 1L11.2 10.5H.8z',
  ringDot:
    'M6 3.4a2.6 2.6 0 1 1 0 5.2a2.6 2.6 0 1 1 0-5.2zM6 .6a5.4 5.4 0 1 1 0 10.8a5.4 5.4 0 1 1 0-10.8zm0 1.4a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
  half: 'M6 .8a5.2 5.2 0 1 1 0 10.4a5.2 5.2 0 1 1 0-10.4zM6 2.3a3.7 3.7 0 1 1 0 7.4a3.7 3.7 0 1 1 0-7.4zM6 2.3a3.7 3.7 0 0 0 0 7.4z',
} as const;
const ICON = {
  calendar: 'M4 6.5h16v13H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5',
  power: 'M12 3v8M6.4 6.6a8 8 0 1 0 11.2 0',
  site: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18zM3.5 12h17M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18',
} as const;

type TMode = 'ready' | 'starting' | 'held' | 'ended' | 'blocked';

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const root = q(document, '[data-root]');
  const version = api.runtime.getManifest().version;
  const [ctx, first, stored] = await Promise.all([
    loadPage(api),
    send(api, { type: 'state' }),
    api.storage.local.get([EXT_KEYS.ext, STORAGE_KEYS.meta, STORAGE_KEYS.onboarding]),
  ]);
  const { t, time } = ctx;
  translateTree(root, t);
  let state: IExtState | null = first;
  let ext: IExtSettings = readExt(stored[EXT_KEYS.ext]);
  let meta: IMeta = { ...DEFAULT_META, ...(stored[STORAGE_KEYS.meta] as Partial<IMeta> | undefined) };
  let onboarding: IOnboarding = {
    ...DEFAULT_ONBOARDING,
    ...(stored[STORAGE_KEYS.onboarding] as Partial<IOnboarding> | undefined),
  };
  const incognito = api.extension?.inIncognitoContext === true;
  // `failed`: the worker never answered, so the popup shows no state.
  const ui = {
    panel: 'none' as 'none' | 'until' | 'pro',
    draft: 0,
    retrying: false,
    levelSaved: false,
    failed: first === null,
  };

  const el = {
    pill: q(root, '[data-pill]'),
    pillText: q(root, '[data-pill-text]'),
    pillGlyph: q(root, '[data-pill-glyph]', SVGPathElement),
    extra: q(root, '[data-pill-extra]'),
    origin: q(root, '[data-origin]'),
    originIcon: q(root, '[data-origin-icon]', SVGPathElement),
    originText: q(root, '[data-origin-text]'),
    meta: q(root, '[data-meta]'),
    meta2: q(root, '[data-meta2]'),
    fail: q(root, '[data-fail]'),
    arcs: [...root.querySelectorAll<SVGCircleElement>('[data-arc]')],
    tip: q(root, '[data-tip]', SVGGElement),
    kicker: q(root, '[data-kicker]'),
    timerBox: q(root, '[data-timer-box]'),
    days: q(root, '[data-days]'),
    digits: q(root, '[data-timer]'),
    timerMain: q(root, '[data-timer-main]'),
    timerSec: q(root, '[data-timer-sec]'),
    caption: q(root, '[data-caption]'),
    privateCard: q(root, '[data-private]'),
    add: q(root, '[data-add]'),
    extend: q(root, '[data-extend]'),
    extendNote: q(root, '[data-extend-note]'),
    error: q(root, '[data-error]'),
    errorTitle: q(root, '[data-error-title]'),
    errorBody: q(root, '[data-error-body]'),
    primary: q(root, '[data-primary]'),
    toggle: q(root, '[data-toggle]', HTMLButtonElement),
    toggleLabel: q(root, '[data-toggle-label]'),
    retryRow: q(root, '[data-retry-row]'),
    retry: q(root, '[data-retry]', HTMLButtonElement),
    openTab: q(root, '[data-open-tab]'),
    note: q(root, '[data-note]'),
    noteText: q(root, '[data-note-text]'),
    noteLink: q(root, '[data-note-link]', HTMLButtonElement),
    levels: q(root, '[data-levels]'),
    levelHelp: q(root, '[data-level-help]'),
    chips: q(root, '[data-chips]'),
    untilChip: q(root, '[data-until-open]', HTMLButtonElement),
    until: q(root, '[data-until]', HTMLFormElement),
    untilTime: q(root, '[data-until-time]'),
    untilSummary: q(root, '[data-until-summary]'),
    sched: q(root, '[data-sched]'),
    schedDays: q(root, '[data-sched-days]'),
    schedRange: q(root, '[data-sched-range]'),
    proRow: q(root, '[data-pro-row]', HTMLButtonElement),
    pro: q(root, '[data-pro]'),
    tips: q(root, '[data-tips]'),
    newChip: q(root, '[data-new]', HTMLAnchorElement),
    newLabel: q(root, '[data-new-label]'),
    foot: q(root, '[data-foot]'),
  };

  // Static pieces that depend on runtime values.
  const release = version.split('.').slice(0, 2).join('.');
  el.newLabel.textContent = t('ext.update.chip', { version: release });
  el.newChip.setAttribute('aria-label', t('ext.update.aria', { version: release }));
  // The same launch-price switch as /pro: the lifetime price drops to its full price when the launch ends.
  const lifetime = lifetimePrice();
  const usd = (amount: number) => `$${String(amount)}`;
  q(root, '[data-pro-price]').textContent = t(lifetime.strike ? 'ext.pro.price.launch' : 'ext.pro.price', {
    yearly: usd(PLAN_PRICES.pro_yearly),
    price: usd(lifetime.current),
    after: usd(lifetime.strike ?? lifetime.current),
  });
  void api.commands.getAll().then((commands) => {
    const shortcut = commands.find((command) => command.name === 'toggle')?.shortcut || 'Alt+Shift+A';
    q(root, '[data-tips-shortcut]').textContent = `${shortcut} `;
    q(root, '[data-tips-keys]').replaceChildren(
      ...keyCaps(shortcut).map((cap) => {
        const kbd = document.createElement('kbd');
        kbd.className = 'at-kbd';
        kbd.textContent = cap;
        return kbd;
      }),
    );
  });

  function fallbackState(): IExtState {
    return {
      lock: 'idle',
      advice: null,
      level: ext.level,
      session: null,
      origin: null,
      extend: false,
      features: [],
      now: Date.now(),
    };
  }

  // While Chrome answers a start, the popup shows what was asked for: Stop, the picked chip and its length.
  let pending: { view: IExtState; preset: TExtPreset | 'until'; ms: number } | null = null;
  const act = async (request: TExtRequest) => {
    const focused = document.activeElement;
    if (request.type === 'start' || request.type === 'until' || request.type === 'toggle') {
      const preset = request.type === 'start' ? request.presetId : request.type === 'until' ? 'until' : defaultPreset();
      const ms = preset === 'until' ? ui.draft - Date.now() : PRESET_MS[preset];
      pending = { view: { ...(state ?? fallbackState()), lock: 'requesting' }, preset, ms };
      render(pending.view);
    }
    try {
      const next = await send(api, request);
      ui.failed = next === null;
      state = next ?? state;
    } finally {
      pending = null;
    }
    render(state);
    keepFocus(focused);
  };

  // A control that just hid must not strand keyboard focus.
  const keepFocus = (was: Element | null) => {
    if (!(was instanceof HTMLElement) || !was.closest('[hidden]')) return;
    if (document.activeElement !== was && document.activeElement !== document.body) return;
    [el.toggle, el.retry].find((button) => !button.closest('[hidden]'))?.focus();
  };

  const defaultPreset = (): TExtPreset => presetOf(ctx.settings);

  function modeOf(view: IExtState): TMode {
    const live = isLive(view.session);
    if (view.lock === 'denied' || view.lock === 'unsupported') return 'blocked';
    if (view.lock === 'requesting') return 'starting';
    if (view.lock === 'held' && live) return 'held';
    if (view.extend) return 'ended';
    return 'ready';
  }

  function scheduleNow(now: number): ISchedule | null {
    // The schedule whose window covers now (for its card); merged windows name the first that matches.
    return ext.schedules.find((s) => allWindows([s], now).some((w) => w.start <= now && now < w.end)) ?? null;
  }

  function nextWindowStart(after: number, now: number): number | null {
    const starts = allWindows(ext.schedules, now)
      .map((w) => w.start)
      .filter((s) => s > after)
      .sort((a, b) => a - b);
    return starts[0] ?? null;
  }

  function dayList(days: number[]): string {
    const week = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d));
    const short = new Intl.DateTimeFormat(ctx.lang, { weekday: 'short' });
    const name = (d: number) => short.format(new Date(2023, 0, 1 + d));
    if (week.length === 7) return t('ext.days.every');
    const idx = week.map((d) => (d + 6) % 7);
    const contiguous = idx.length > 2 && idx.every((v, i) => i === 0 || v === (idx[i - 1] ?? -2) + 1);
    if (contiguous) return t('ext.days.range', { from: name(week[0] ?? 1), to: name(week.at(-1) ?? 5) });
    return week.map(name).join(', ');
  }

  const WEEKDAYS = [1, 2, 3, 4, 5];
  const daysLabel = (days: number[]): string =>
    days.length === WEEKDAYS.length && WEEKDAYS.every((d) => days.includes(d)) ? t('ext.days.weekdays') : dayList(days);

  // An auto-start session with no end reads as time awake so far (ExtEdge board, auto-start).
  const autoOpen = (view: IExtState): boolean =>
    view.lock === 'held' &&
    isLive(view.session) &&
    view.session.endsAt === null &&
    (view.origin === 'startup' || view.origin === 'autostart');

  function render(s: IExtState | null = pending?.view ?? state): void {
    const view = s ?? fallbackState();
    const mode = modeOf(view);
    const session = view.session;
    const live = isLive(session);
    const held = mode === 'held';
    const blocked = mode === 'blocked';
    const now = Date.now();
    const origin = live ? view.origin : null;
    const isSched = held && origin === 'schedule';
    const sched = isSched ? scheduleNow(now) : null;
    const auto = autoOpen(view);
    const system = view.level === 'system';
    root.dataset.mode = mode;

    // Pill: the seven-state copy (docs/04, docs/05), "System awake" for a held system lock (D-02).
    el.pill.dataset.lock = view.lock;
    el.pill.dataset.level = view.level;
    el.pillText.textContent = t(pillTextKey(view.lock, view.level));
    el.pillGlyph.setAttribute(
      'd',
      blocked
        ? GLYPH.tri
        : view.lock === 'lost'
          ? GLYPH.pause
          : view.lock === 'fallback'
            ? GLYPH.ringDot
            : held && system
              ? GLYPH.half
              : GLYPH.dot,
    );
    show(el.extra, held && system);
    const originKey = held && origin && origin !== 'user' && origin !== 'command' ? `ext.origin.${origin}` : null;
    if (show(el.origin, originKey !== null)) {
      el.originText.textContent = t(originKey ?? '');
      el.originIcon.setAttribute(
        'd',
        origin === 'startup' ? ICON.power : origin === 'autostart' ? ICON.site : ICON.calendar,
      );
    }

    // Meta lines under the pill.
    let metaText = t('ext.popup.limits');
    let meta2 = '';
    let strong = false;
    if (mode === 'starting') metaText = t('ext.popup.asking');
    if (held && session) {
      const rem = remainingMs(session, now);
      if (isSched && session.endsAt !== null) {
        metaText = t('ext.schedule.until', { time: time.hm(session.endsAt) });
        if (sched) meta2 = daysLabel(sched.days);
      } else if (auto) metaText = t('ext.popup.sinceMeta', { time: time.since(session.startedAt, now) });
      else if (rem === null) metaText = t('ext.popup.noEnd');
      else if (rem >= DAY) metaText = t('tool.timer.until', { wall: time.full(roundToMinute(now + rem)) });
      else metaText = t('ext.popup.started', { time: time.since(session.startedAt, now) });
    }
    if (mode === 'ended' && session) {
      metaText = t('tool.extend.title');
      strong = true;
      if (session.endedAt !== null)
        meta2 = t('ext.popup.heldSpan', { span: time.span(session.startedAt, session.endedAt) });
    }
    if (mode === 'ready' && session && !live && session.endedAt !== null && now - session.endedAt < RECEIPT_MS) {
      const heldMs = Math.max(60_000, roundToMinute(session.endedAt - session.startedAt));
      metaText = t('ext.popup.receipt', {
        duration: words(heldMs, t),
        span: time.span(session.startedAt, session.endedAt),
      });
    }
    if (blocked) {
      strong = true;
      metaText = t(view.lock === 'unsupported' ? 'ext.error.unsupported.meta' : 'ext.error.denied.meta');
      meta2 = ui.retrying ? t('ext.error.retrying') : t('ext.error.nothing');
    }
    const failed = ui.failed && pending === null;
    show(el.fail, failed);
    show(el.meta, !failed && !(held && system && !originKey));
    el.meta.textContent = metaText;
    if (strong) el.meta.dataset.strong = '';
    else delete el.meta.dataset.strong;
    el.meta2.textContent = meta2;
    show(el.meta2, !failed && meta2 !== '');

    // Cards and blocks, per state.
    const extendCard = mode === 'ended';
    const tipsOn = mode === 'ready' && !onboarding.dismissedTips.includes(TIPS_ID) && !incognito;
    // The worker reports features only for a valid licence (IExtState.features).
    const pro = view.features.includes('ext.schedules');
    const proPanel = ui.panel === 'pro' && mode === 'ready';
    const proRow = mode === 'ready' && !pro && !tipsOn && !proPanel && ui.panel !== 'until';
    const untilPanel = ui.panel === 'until' && !blocked && !extendCard;
    show(el.privateCard, incognito);
    show(el.add, held && session?.endsAt !== null && !isSched && !untilPanel && !incognito);
    show(el.extend, extendCard);
    if (extendCard && session?.endedAt) {
      el.extendNote.textContent = t('ext.extend.note', { time: time.hm(session.endedAt + RECEIPT_MS) });
    }
    if (show(el.error, blocked)) {
      const unsupported = view.lock === 'unsupported';
      el.errorTitle.textContent = t(unsupported ? 'ext.error.unsupported.title' : 'ext.advice.denied');
      el.errorBody.textContent = t(unsupported ? 'ext.error.unsupported.body' : 'ext.error.denied.body');
      el.error.setAttribute('role', unsupported ? 'status' : 'alert');
    }

    // Primary action: Stop (raised, D-R20) while live; the lamp Start in Ready; Retry when refused.
    const showToggle = !blocked && !extendCard && !untilPanel;
    const starting = mode === 'starting' && pending !== null;
    show(el.toggle, showToggle);
    el.toggle.dataset.live = live || starting ? '1' : '0';
    el.toggle.disabled = view.lock === 'unsupported';
    const preset = defaultPreset();
    if (live || starting) {
      el.toggleLabel.textContent = t(isSched ? 'ext.schedule.stopToday' : 'tool.ring.stop');
      el.toggle.removeAttribute('aria-label');
    } else {
      el.toggleLabel.textContent = t('ext.popup.startWith', {
        length: preset === 'pinf' ? t('tool.preset.pinf') : words(PRESET_MS[preset], t),
      });
      if (preset === 'pinf') el.toggle.setAttribute('aria-label', t('ext.popup.startInf'));
      else el.toggle.removeAttribute('aria-label');
    }
    show(el.retryRow, view.lock === 'denied');
    el.retry.textContent = t(ui.retrying ? 'ext.error.retrying.button' : 'tool.advice.retry');
    el.retry.setAttribute('aria-busy', String(ui.retrying));
    show(el.openTab, view.lock === 'unsupported');

    let note = '';
    let noteLink = false;
    if (isSched && session?.endsAt) {
      const next = nextWindowStart(session.endsAt, now);
      note = next ? t('ext.schedule.skips', { when: time.at(next, now) }) : '';
    } else if (held && origin === 'startup') {
      note = t('ext.autostart.note');
      noteLink = true;
    }
    if (show(el.note, note !== '' && !untilPanel)) {
      el.noteText.textContent = note;
      show(el.noteLink, noteLink);
    }
    // The Until panel takes the primary block's place, gap included (ExtPopup board).
    show(el.primary, !untilPanel);

    // Level switch (hidden where it cannot act: Blocked, the Pro panel).
    show(el.levels, !blocked && !proPanel);
    for (const input of root.querySelectorAll<HTMLInputElement>('input[name="level"]'))
      input.checked = input.value === view.level;
    let help = t(system ? 'ext.level.system.help' : 'ext.level.display.help');
    if (isSched) help = ui.levelSaved ? t('ext.schedule.levelSaved') : t('ext.schedule.levelHelp');
    el.levelHelp.textContent = help;
    show(el.levelHelp, isSched || auto || (!held && !extendCard && !incognito && !tipsOn));

    // Length chips: the running preset while live, the default length in Ready.
    show(el.chips, !blocked && !isSched && !proPanel && !extendCard && !untilPanel);
    const selected = live ? session.presetId : starting ? pending?.preset : mode === 'ready' ? preset : null;
    for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
      chip.setAttribute('aria-pressed', String(selected === chip.dataset.preset));
      const id = chip.dataset.preset;
      if (id && id !== 'pinf') chip.setAttribute('aria-label', t('ext.chip.aria', { length: t(`tool.preset.${id}`) }));
    }
    const untilAt =
      live && session.presetId === 'until' ? session.endsAt : selected === 'until' && pending ? now + pending.ms : null;
    el.untilChip.setAttribute('aria-pressed', String(untilAt !== null));
    el.untilChip.textContent = untilAt ? time.hm(untilAt) : t('tool.preset.until');
    el.untilChip.setAttribute(
      'aria-label',
      untilAt ? t('ext.until.change', { when: time.when(untilAt, now) }) : t('ext.until.open'),
    );
    show(el.until, untilPanel);
    if (untilPanel) renderUntil();

    // Schedule card, Pro row and panel, tips, footer.
    if (show(el.sched, sched !== null) && sched) {
      el.schedDays.textContent = dayList(sched.days);
      const start = minutesOf(sched.start);
      const end = minutesOf(sched.end);
      el.schedRange.textContent = `${time.range(start, end)} · ${t(sched.level === 'system' ? 'ext.level.system' : 'ext.level.display')}`;
    }
    show(el.proRow, proRow);
    show(el.pro, proPanel);
    el.proRow.setAttribute('aria-expanded', String(proPanel));
    show(el.tips, tipsOn);
    show(el.foot, !tipsOn && !incognito && !blocked);

    // New in <version>: after an update, until the chip is opened.
    show(el.newChip, meta.lastSeenVersion !== '' && meta.lastSeenVersion !== version);

    tick(view);
  }

  function tick(view: IExtState = pending?.view ?? state ?? fallbackState()): void {
    const mode = modeOf(view);
    const session = view.session;
    const now = Date.now();
    let shown: number | null; // ms on the digits, null = ∞
    let p: number; // arc fraction
    let caption: string;
    let kicker = '';
    let timerAria = '';
    if (mode === 'held' && isLive(session)) {
      const rem = remainingMs(session, now);
      if (rem === null) {
        shown = now - session.startedAt - session.pausedMs;
        p = 1;
        if (autoOpen(view)) caption = t('tool.timer.elapsedCaption');
        else {
          kicker = t('ext.popup.awakeFor');
          caption = t('ext.popup.since', { time: time.since(session.startedAt, now) });
        }
        timerAria = t('tool.timer.elapsed', { time: words(shown, t) });
      } else {
        shown = rem;
        const total = totalMs(session) ?? rem;
        p = Math.min(1, rem / Math.max(1, total));
        caption =
          rem >= DAY
            ? t('ext.popup.timeLeft')
            : t('tool.timer.until', { wall: time.when(roundToMinute(now + rem), now) });
        timerAria = t('tool.timer.remaining', { time: words(rem, t) });
      }
    } else if (mode === 'ended') {
      shown = 0;
      p = 0;
      caption = t('tool.timer.complete');
    } else {
      const ms = mode === 'starting' && pending ? Math.max(0, pending.ms) : PRESET_MS[defaultPreset()];
      shown = ms || null;
      p = 1;
      caption =
        mode === 'starting'
          ? t('ext.popup.starting')
          : ms
            ? t('ext.popup.ends', { time: time.when(roundToMinute(now + ms), now) })
            : t('ext.popup.untilStop');
      if (mode === 'blocked') caption = t('ext.popup.notRunning');
    }
    if (shown === null) {
      el.timerMain.textContent = '∞';
      el.timerSec.textContent = '';
      show(el.days, false);
      delete el.digits.dataset.long;
      timerAria ||= t('ext.timer.noLimit');
    } else {
      const parts = clockParts(shown);
      el.timerMain.textContent = parts.main;
      el.timerSec.textContent = parts.seconds;
      el.days.textContent = parts.days;
      show(el.days, parts.days !== '');
      if (shown >= 3_600_000) el.digits.dataset.long = '';
      else delete el.digits.dataset.long;
      timerAria ||= t('tool.timer.remaining', {
        time: `${parts.days ? `${parts.days} ` : ''}${parts.main}${parts.seconds}`,
      });
    }
    el.timerBox.setAttribute('aria-label', mode === 'blocked' ? t('ext.popup.notRunning') : timerAria);
    el.caption.textContent = caption;
    el.kicker.textContent = kicker;
    show(el.kicker, kicker !== '');
    const dash = mode === 'blocked' ? '' : p <= 0 ? `0.01 ${C.toFixed(1)}` : `${(C * p).toFixed(1)} ${C.toFixed(1)}`;
    for (const arc of el.arcs) arc.style.strokeDasharray = dash;
    const tipOn = mode === 'held' && shown !== null && isLive(session) && session.endsAt !== null && p > 0;
    el.tip.style.opacity = tipOn ? '1' : '0';
    el.tip.style.transform = `rotate(${(360 * p).toFixed(2)}deg)`;
  }

  // ── Until panel: a 15-minute stepper, up to 24 h ahead ──────────────────────────────────────────
  const firstDraft = () => {
    const last = ctx.settings.lastUntilWall;
    if (last && /^\d\d:\d\d$/u.test(last)) {
      const [h, m] = last.split(':').map(Number);
      const d = new Date();
      d.setHours(h ?? 0, m ?? 0, 0, 0);
      if (d.getTime() <= Date.now() + 60_000) d.setDate(d.getDate() + 1);
      return d.getTime();
    }
    return Math.ceil((Date.now() + 3_600_000) / QUARTER) * QUARTER;
  };

  function renderUntil(): void {
    const now = Date.now();
    el.untilTime.textContent = time.hm(ui.draft);
    const minutes = Math.max(1, Math.round((ui.draft - now) / 60_000));
    const remain = words(minutes * 60_000, t);
    el.untilSummary.textContent = t('ext.until.summary', {
      day: t(
        new Date(ui.draft).toDateString() !== new Date(now).toDateString() ? 'tool.until.tomorrow' : 'tool.until.today',
      ),
      time: time.hm(ui.draft),
      remain,
    });
  }

  function openUntil(): void {
    const session = state?.session;
    ui.draft = isLive(session) && session.presetId === 'until' && session.endsAt ? session.endsAt : firstDraft();
    ui.panel = 'until';
    render();
    q(root, '[data-until-more]', HTMLButtonElement).focus();
  }

  function closeUntil(): void {
    ui.panel = 'none';
    render();
    el.untilChip.focus();
  }

  function toggle(): void {
    if (el.toggle.disabled || el.toggle.hidden) return;
    void act(isLive(state?.session) ? { type: 'stop' } : { type: 'toggle' });
  }

  // ── Wiring ──────────────────────────────────────────────────────────────────────────────────────
  el.toggle.addEventListener('click', toggle);
  const openOptions = (hash = '') => {
    const done = () => {
      window.close();
    };
    if (hash) void api.tabs.create({ url: api.runtime.getURL(`options.html${hash}`) }).finally(done);
    else void api.runtime.openOptionsPage().finally(done);
  };
  q(root, '[data-options]', HTMLButtonElement).addEventListener('click', () => {
    openOptions();
  });
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
    chip.addEventListener('click', () => {
      const id = chip.dataset.preset;
      if (isExtPreset(id)) void act({ type: 'start', presetId: id });
    });
  }
  el.untilChip.addEventListener('click', openUntil);
  q(root, '[data-until-cancel]', HTMLButtonElement).addEventListener('click', closeUntil);
  q(root, '[data-until-less]', HTMLButtonElement).addEventListener('click', () => {
    ui.draft = Math.max(Math.ceil((Date.now() + 60_000) / QUARTER) * QUARTER, ui.draft - QUARTER);
    renderUntil();
  });
  q(root, '[data-until-more]', HTMLButtonElement).addEventListener('click', () => {
    ui.draft = Math.min(Date.now() + DAY, ui.draft + QUARTER);
    renderUntil();
  });
  el.until.addEventListener('submit', (event) => {
    event.preventDefault();
    const d = new Date(ui.draft);
    const wall = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    ui.panel = 'none';
    void act({ type: 'until', wall });
  });
  for (const input of root.querySelectorAll<HTMLInputElement>('input[name="level"]')) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      const level = input.value as TPowerLevel;
      // A schedule keeps its own level; the choice is saved for sessions the user starts (setLevel).
      ui.levelSaved = state?.origin === 'schedule' && isLive(state.session) && level !== state.level;
      void act({ type: 'level', level });
    });
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-add-ms], [data-extend-ms]')) {
    button.addEventListener('click', () => {
      void act({ type: 'extend', ms: Number(button.dataset.addMs ?? button.dataset.extendMs) });
    });
  }
  q(root, '[data-dismiss]', HTMLButtonElement).addEventListener('click', () => {
    void act({ type: 'dismiss' });
  });
  el.retry.addEventListener('click', () => {
    ui.retrying = true;
    render();
    void act({ type: 'start', presetId: defaultPreset() }).finally(() => {
      ui.retrying = false;
      render();
    });
  });
  el.noteLink.addEventListener('click', () => {
    openOptions('#autostart');
  });
  q(root, '[data-sched-edit]', HTMLButtonElement).addEventListener('click', () => {
    openOptions('#schedules');
  });
  el.proRow.addEventListener('click', () => {
    ui.panel = 'pro';
    render();
    q(root, '[data-pro-close]', HTMLButtonElement).focus();
  });
  q(root, '[data-pro-close]', HTMLButtonElement).addEventListener('click', () => {
    ui.panel = 'none';
    render();
    el.proRow.focus();
  });
  q(root, '[data-pro-key]', HTMLButtonElement).addEventListener('click', () => {
    openOptions('#licence');
  });
  q(root, '[data-tips-ok]', HTMLButtonElement).addEventListener('click', () => {
    onboarding = { ...onboarding, dismissedTips: [...new Set([...onboarding.dismissedTips, TIPS_ID])] };
    void api.storage.local.set({ [STORAGE_KEYS.onboarding]: onboarding });
    render();
    el.toggle.focus();
  });
  el.newChip.addEventListener('click', () => {
    meta = { ...meta, lastSeenVersion: version };
    void api.storage.local.set({ [STORAGE_KEYS.meta]: meta });
    render();
  });

  // Keyboard (docs/10 §5, docs/00 §5.3): Space toggle, 1–6 presets, 0 ∞, U until, Esc closes.
  // Single-key shortcuts follow settings.keyboardShortcuts (WCAG 2.1.4); Esc always works.
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    const typing = target instanceof HTMLInputElement && target.type !== 'radio';
    if (event.key === 'Escape') {
      event.preventDefault();
      if (ui.panel === 'until') closeUntil();
      else if (ui.panel === 'pro') {
        ui.panel = 'none';
        render();
        el.proRow.focus();
      } else window.close();
      return;
    }
    if (typing || !ctx.settings.keyboardShortcuts) return;
    if (
      event.key === ' ' &&
      !(target instanceof HTMLButtonElement) &&
      !(target instanceof HTMLAnchorElement) &&
      !(target instanceof HTMLInputElement)
    ) {
      event.preventDefault();
      toggle();
      return;
    }
    const digit = '123456'.indexOf(event.key);
    const preset = digit >= 0 ? PRESET_KEYS[digit] : event.key === '0' ? 'pinf' : null;
    if (preset && modeOf(state ?? fallbackState()) !== 'blocked') {
      event.preventDefault();
      void act({ type: 'start', presetId: preset });
    } else if (event.key === 'u' || event.key === 'U') {
      event.preventDefault();
      openUntil();
    }
  });

  let refresh: ReturnType<typeof setTimeout> | null = null;
  api.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (EXT_KEYS.ext in changes) ext = readExt(changes[EXT_KEYS.ext]?.newValue);
    if (
      !Object.keys(changes).some(
        (key) => key === STORAGE_KEYS.session || key === EXT_KEYS.ext || key === STORAGE_KEYS.license,
      )
    )
      return;
    // A schedule, the command or a notification changed the session: ask the worker for the truth.
    if (refresh) clearTimeout(refresh);
    refresh = setTimeout(() => {
      void send(api, { type: 'state' }).then((next) => {
        if (next) {
          state = next;
          ui.failed = false;
          render(next);
        }
      });
    }, 150);
  });

  render(state);
  root.hidden = false;
  document.documentElement.dataset.ready = String(Math.round(performance.now()));
  const align = () => {
    tick();
    if (ui.panel === 'until') renderUntil();
    setTimeout(align, 1000 - (Date.now() % 1000));
  };
  setTimeout(align, 1000 - (Date.now() % 1000));
}

void boot();
