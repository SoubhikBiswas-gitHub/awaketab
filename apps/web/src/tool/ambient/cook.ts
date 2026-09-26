import type { IToolCtx } from '../ctx.js';
import { formatHms } from '../format.js';
import { t } from '../i18n.js';
import { chime, notify } from '../signal.js';
import { toast } from '../ui/toast.js';
import {
  activeElapsed,
  addCookTimer,
  COOK_FLASH_MS,
  COOK_MAX_TIMERS,
  COOK_NAME_MAX,
  cookName,
  type ICookTimer,
  readCookTimers,
  settleCookTimers,
} from './logic.js';
import { el, everySecond } from './tick.js';

const QUICK_MIN = [5, 10, 15, 30, 60] as const;

function live(ctx: IToolCtx): boolean {
  const st = ctx.engine.session?.status;
  return st === 'active' || st === 'paused';
}

/**
 * Cook mode (docs/05 §3.16): big elapsed timer, tap anywhere to pause the *clock* — the lock stays held
 * (engine.pause({ keepLock: true })) so the screen never goes dark mid-recipe — and up to three kitchen
 * timers persisted in session.modeState.cookTimers so a reload resumes them. Targets are ≥ 64 px (CSS).
 */
export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const digits = el('div', { class: 'at-ambient-digits', 'data-cook-elapsed': '' });
  const hint = el('p', { class: 'at-ambient-sub', 'data-cook-hint': '' });
  const tap = el('button', { type: 'button', class: 'at-cook-tap', 'data-cook-tap': '' });
  tap.append(digits, hint);
  const list = el('div', { class: 'at-cook-timers', 'data-cook-timers': '' });
  const form = el('form', { class: 'at-cook-add', 'data-cook-add': '' });
  const nameId = 'cook-name';
  const minutesId = 'cook-minutes';
  const nameLabel = el('label', { for: nameId }, t('ambient.cook.timer.name'));
  const name = el('input', {
    id: nameId,
    class: 'at-input',
    name: 'name',
    maxlength: String(COOK_NAME_MAX),
    autocomplete: 'off',
    placeholder: t('ambient.cook.timer.default', { n: 1 }),
  });
  const quick = el('div', { class: 'at-cook-quick', role: 'group', 'aria-label': t('ambient.cook.timer.add') });
  for (const m of QUICK_MIN) {
    quick.append(el('button', { type: 'button', class: 'at-btn', 'data-cook-quick': String(m) }, t('stats.minutes', { minutes: m })));
  }
  const minutesLabel = el('label', { for: minutesId }, t('ambient.cook.timer.custom'));
  const minutes = el('input', {
    id: minutesId,
    class: 'at-input',
    name: 'minutes',
    type: 'number',
    inputmode: 'numeric',
    min: '1',
    max: '720',
  });
  const add = el('button', { type: 'submit', class: 'at-btn' }, t('ambient.cook.timer.add'));
  form.append(nameLabel, name, quick, minutesLabel, minutes, add);
  stage.append(tap, list, form);

  const flashes = new Map<string, number>();
  let timers: ICookTimer[] = readCookTimers(ctx.engine.session?.modeState);

  const persist = () => {
    if (live(ctx)) ctx.engine.updateSession({ modeState: { cookTimers: timers } });
  };

  // Cards are keyed by timer id and only their countdown text changes each second, so focus on a
  // Remove button survives the repaint.
  const cards = new Map<string, { card: HTMLElement; left: HTMLElement }>();
  const renderTimers = (now: number) => {
    form.hidden = timers.length >= COOK_MAX_TIMERS;
    const ids = new Set(timers.map((x) => x.id));
    for (const [id, view] of cards) {
      if (!ids.has(id)) {
        view.card.remove();
        cards.delete(id);
      }
    }
    for (const timer of timers) {
      let view = cards.get(timer.id);
      if (!view) {
        const headingId = `cook-${timer.id}`;
        const card = el('section', { class: 'at-banner at-cook-timer', 'aria-labelledby': headingId, 'data-cook-timer': timer.id });
        const left = el('p', { class: 'at-cook-left' });
        const remove = el('button', { type: 'button', class: 'at-btn', 'data-cook-remove': timer.id }, t('ambient.cook.timer.remove'));
        remove.setAttribute('aria-label', t('ambient.cook.timer.removeNamed', { name: timer.name }));
        card.append(el('h3', { id: headingId }, timer.name), left, remove);
        list.append(card);
        view = { card, left };
        cards.set(timer.id, view);
      }
      view.card.toggleAttribute('data-flash', (flashes.get(timer.id) ?? 0) > now);
      view.card.toggleAttribute('data-done', timer.doneAt !== null);
      view.left.textContent = timer.doneAt === null ? formatHms(timer.endsAt - now) : t('ambient.cook.timer.done');
    }
  };

  const paint = (now: number) => {
    const session = ctx.store.get().session;
    const running = session && (session.status === 'active' || session.status === 'paused');
    digits.textContent = running ? formatHms(activeElapsed(session, now)) : formatHms(0);
    hint.textContent = !running
      ? t('ambient.cook.start')
      : session.status === 'paused'
        ? t('ambient.cook.resume')
        : t('ambient.cook.pause');
    tap.setAttribute('aria-pressed', String(session?.status === 'paused'));
    const settled = settleCookTimers(timers, now);
    if (settled.finished.length > 0) {
      timers = settled.list;
      persist();
      for (const done of settled.finished) {
        flashes.set(done.id, now + COOK_FLASH_MS);
        const text = t('ambient.cook.timer.notify', { name: done.name });
        chime(ctx, 'timer');
        void notify(ctx, text, t('end.notify.title'), `at-cook-${done.id}`);
        toast(ctx.store, { kind: 'success', text, id: `cook-${done.id}` });
      }
    }
    renderTimers(now);
  };

  const ensureSession = async () => {
    if (live(ctx)) return;
    await ctx.startPlan({ type: 'indefinite' }, 'pinf');
  };

  tap.addEventListener('click', () => {
    const st = ctx.engine.session?.status;
    if (st === 'active') ctx.engine.pause({ keepLock: true });
    else if (st === 'paused') void ctx.engine.resume().then(ctx.syncLock);
    else void ensureSession();
    ctx.syncLock();
    paint(Date.now());
  });

  const addTimer = async (ms: number) => {
    await ensureSession();
    const next = addCookTimer(timers, {
      name: cookName(name.value, t('ambient.cook.timer.default', { n: timers.length + 1 })),
      ms,
      now: Date.now(),
      id: crypto.randomUUID().slice(0, 8),
    });
    if (!next) {
      toast(ctx.store, { kind: 'warn', text: t('ambient.cook.timer.invalid'), id: 'cook' });
      return;
    }
    timers = next;
    persist();
    name.value = '';
    minutes.value = '';
    paint(Date.now());
  };

  quick.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cook-quick]');
    if (btn) void addTimer(Number(btn.dataset.cookQuick) * 60_000);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void addTimer(Math.floor(Number(minutes.value)) * 60_000);
  });
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-cook-remove]');
    if (!btn) return;
    timers = timers.filter((x) => x.id !== btn.dataset.cookRemove);
    flashes.delete(btn.dataset.cookRemove ?? '');
    persist();
    paint(Date.now());
  });

  return everySecond(paint);
}
