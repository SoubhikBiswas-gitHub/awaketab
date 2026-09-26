import 'virtual:at-tokens.css';
import '../../src/styles/base.css';
import './popup.css';
import { browser } from 'wxt/browser';
import type { IExtApi, TPowerLevel } from '../../src/api';
import type { IExtState, TExtRequest } from '../../src/messages';
import { loadPage, send, translateTree } from '../../src/page';
import { isExtPreset, isHHMM } from '../../src/settings';
import { formatClock, isLive, pillKey, remainingMs, totalMs } from '../../src/status';

/**
 * Toolbar popup (docs/10 §5): ring + seven-state pill parity with the web tool, presets, until, level.
 * It renders only what the worker reports — the pill is a projection of the worker's lock state, never of
 * the button (docs/19 B1), and the timer runs only while the lock is `held`.
 */

const RING_C = 2 * Math.PI * 88;
const PRESET_KEYS = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240'] as const;

function q<T extends Element = HTMLElement>(root: ParentNode, selector: string, type?: new () => T): T {
  const el = root.querySelector(selector);
  const expected = type ?? (HTMLElement as unknown as new () => T);
  if (!(el instanceof expected)) throw new Error(`popup: missing ${selector}`);
  return el;
}

async function boot(): Promise<void> {
  const api = browser as unknown as IExtApi;
  const root = q(document, '[data-root]');
  const [ctx, first] = await Promise.all([loadPage(api), send(api, { type: 'state' })]);
  translateTree(root, ctx.t);
  let state: IExtState | null = first;
  const el = {
    pill: q(root, '[data-pill]'),
    pillText: q(root, '[data-pill-text]'),
    extra: q(root, '[data-pill-extra]'),
    advice: q(root, '[data-advice]'),
    timer: q(root, '[data-timer]'),
    caption: q(root, '[data-caption]'),
    progress: q(root, '[data-ring-progress]', SVGCircleElement),
    dot: q(root, '[data-ring-dot]', SVGCircleElement),
    toggle: q(root, '[data-toggle]', HTMLButtonElement),
    extend: q(root, '[data-extend]'),
    levelHelp: q(root, '[data-level-help]'),
    until: q(root, '[data-until]', HTMLFormElement),
    untilInput: q(root, '[data-until-input]', HTMLInputElement),
    untilSummary: q(root, '[data-until-summary]'),
  };
  el.progress.style.strokeDasharray = String(RING_C);

  const act = async (request: TExtRequest) => {
    if (request.type !== 'dismiss' && request.type !== 'level' && request.type !== 'state' && request.type !== 'stop') {
      // Optimistic `requesting` only: the pill says "Starting…" until the worker confirms `held`.
      render({ ...(state ?? fallbackState()), lock: 'requesting' });
    }
    state = (await send(api, request)) ?? state;
    render(state);
  };

  function fallbackState(): IExtState {
    return { lock: 'idle', advice: null, level: 'display', session: null, origin: null, extend: false, features: [], now: Date.now() };
  }

  function render(s: IExtState | null = state): void {
    const view = s ?? fallbackState();
    const { t } = ctx;
    const session = view.session;
    const live = isLive(session);
    const held = view.lock === 'held' && live;
    el.pill.dataset.lock = view.lock;
    el.pillText.textContent = t(pillKey(view.lock));
    const extras: string[] = [];
    if (held && view.level === 'system') extras.push(t('ext.pill.system'));
    if (held && view.origin && view.origin !== 'user' && view.origin !== 'command') extras.push(t(`ext.origin.${view.origin}`));
    el.extra.textContent = extras.join(' · ');
    el.extra.hidden = extras.length === 0;
    const adviceKey = view.lock === 'unsupported' ? 'ext.advice.unsupported' : view.lock === 'denied' ? 'ext.advice.denied' : null;
    el.advice.hidden = adviceKey === null;
    el.advice.textContent = adviceKey ? t(adviceKey) : '';
    el.toggle.textContent = live ? t('tool.ring.stop') : t('ext.popup.start');
    el.toggle.dataset.live = live ? '1' : '0';
    el.toggle.disabled = view.lock === 'unsupported';
    el.extend.hidden = !view.extend;
    for (const input of root.querySelectorAll<HTMLInputElement>('input[name="level"]')) input.checked = input.value === view.level;
    el.levelHelp.textContent = t(view.level === 'system' ? 'ext.level.system.help' : 'ext.level.display.help');
    for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
      chip.setAttribute('aria-pressed', String(live && session.presetId === chip.dataset.preset));
    }
    root.querySelector('[data-until-open]')?.setAttribute('aria-pressed', String(live && session.presetId === 'until'));
    tick();
  }

  /** Timer and ring from `endsAt` and `Date.now()` — never an accumulated counter (docs/00 §5.2). */
  function tick(): void {
    const view = state ?? fallbackState();
    const { t } = ctx;
    const session = view.session;
    const held = view.lock === 'held' && isLive(session);
    el.dot.classList.toggle('is-pulse', held);
    if (!held) {
      el.timer.textContent = view.extend ? t('tool.timer.complete') : t('tool.timer.indefiniteIdle');
      el.timer.classList.add('is-muted');
      el.caption.textContent = '';
      el.progress.style.strokeDashoffset = String(RING_C);
      return;
    }
    el.timer.classList.remove('is-muted');
    const now = Date.now();
    const rem = remainingMs(session, now);
    if (rem === null) {
      el.timer.textContent = formatClock(now - session.startedAt - session.pausedMs);
      el.caption.textContent = t('tool.timer.elapsedCaption');
      el.progress.style.strokeDashoffset = '0';
      return;
    }
    el.timer.textContent = formatClock(rem);
    const preset = session.presetId;
    el.caption.textContent =
      session.plan.type === 'until'
        ? t('tool.timer.until', { wall: session.plan.wall })
        : (PRESET_KEYS as readonly string[]).includes(preset)
          ? t(`tool.preset.${preset}`)
          : '';
    const total = totalMs(session) ?? rem;
    el.progress.style.strokeDashoffset = String(RING_C * (1 - Math.min(1, rem / total)));
  }

  function untilSummary(): void {
    const { t } = ctx;
    const wall = el.untilInput.value;
    if (!isHHMM(wall)) {
      el.untilSummary.textContent = '';
      return;
    }
    const now = new Date();
    const [h, m] = wall.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h ?? 0, m ?? 0, 0, 0);
    const tomorrow = target.getTime() <= now.getTime() + 30_000;
    if (tomorrow) target.setDate(target.getDate() + 1);
    const minutes = Math.round((target.getTime() - now.getTime()) / 60_000);
    const remain =
      minutes >= 60
        ? t('stats.hours', { hours: Math.floor(minutes / 60), minutes: minutes % 60 })
        : t('stats.minutes', { minutes });
    el.untilSummary.textContent = t('tool.until.summary', {
      day: t(tomorrow ? 'tool.until.tomorrow' : 'tool.until.today'),
      time: wall,
      remain,
    });
  }

  function openUntil(): void {
    const next = new Date(Date.now() + 60 * 60_000);
    el.untilInput.value =
      ctx.settings.lastUntilWall ?? `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
    el.until.hidden = false;
    untilSummary();
    el.untilInput.focus();
  }

  function closeUntil(): void {
    el.until.hidden = true;
  }

  function toggle(): void {
    if (el.toggle.disabled) return;
    const live = isLive(state?.session);
    void act(live ? { type: 'stop' } : { type: 'toggle' });
  }

  el.toggle.addEventListener('click', toggle);
  q(root, '[data-options]', HTMLButtonElement).addEventListener('click', () => {
    void api.runtime.openOptionsPage().finally(() => {
      window.close();
    });
  });
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-preset]')) {
    chip.addEventListener('click', () => {
      const id = chip.dataset.preset;
      if (isExtPreset(id)) void act({ type: 'start', presetId: id });
    });
  }
  q(root, '[data-until-open]', HTMLButtonElement).addEventListener('click', openUntil);
  q(root, '[data-until-cancel]', HTMLButtonElement).addEventListener('click', closeUntil);
  el.untilInput.addEventListener('input', untilSummary);
  el.until.addEventListener('submit', (event) => {
    event.preventDefault();
    const wall = el.untilInput.value;
    if (!isHHMM(wall)) return;
    closeUntil();
    void act({ type: 'until', wall });
  });
  for (const input of root.querySelectorAll<HTMLInputElement>('input[name="level"]')) {
    input.addEventListener('change', () => {
      if (input.checked) void act({ type: 'level', level: input.value as TPowerLevel });
    });
  }
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-extend-ms]')) {
    button.addEventListener('click', () => {
      void act({ type: 'extend', ms: Number(button.dataset.extendMs) });
    });
  }
  q(root, '[data-dismiss]', HTMLButtonElement).addEventListener('click', () => {
    void act({ type: 'dismiss' });
  });

  // Keyboard (docs/10 §5, docs/00 §5.3): Space toggle, 1–6 presets, 0 ∞, U until, Esc closes.
  // Single-key shortcuts follow settings.keyboardShortcuts (WCAG 2.1.4); Esc always works.
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target as HTMLElement | null;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!el.until.hidden) closeUntil();
      else window.close();
      return;
    }
    if (typing || !ctx.settings.keyboardShortcuts) return;
    if (event.key === ' ' && !(target instanceof HTMLButtonElement) && !(target instanceof HTMLAnchorElement)) {
      event.preventDefault();
      toggle();
      return;
    }
    const digit = '123456'.indexOf(event.key);
    const preset = digit >= 0 ? PRESET_KEYS[digit] : event.key === '0' ? 'pinf' : null;
    if (preset) {
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
    if (!Object.keys(changes).some((key) => key === 'at.v1.session' || key === 'at.v1.ext' || key === 'at.v1.license')) return;
    // A schedule, the command or a notification changed the session: ask the worker for the truth.
    if (refresh) clearTimeout(refresh);
    refresh = setTimeout(() => {
      void send(api, { type: 'state' }).then((next) => {
        if (next) {
          state = next;
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
    setTimeout(align, 1000 - (Date.now() % 1000));
  };
  setTimeout(align, 1000 - (Date.now() % 1000));
}

void boot();
