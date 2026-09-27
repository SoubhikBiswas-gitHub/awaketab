import type { IToolCtx } from '../ctx.js';
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
import { at, digits as writeDigits, short } from './fmt.js';
import { el, everySecond } from './tick.js';

const QUICK_MIN = [5, 10, 15, 30, 60] as const;

function live(ctx: IToolCtx): boolean {
  const st = ctx.engine.session?.status;
  return st === 'active' || st === 'paused';
}

function length(ms: number): string {
  const min = Math.round(ms / 60_000);
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (!hours) return t('stats.minutes', { minutes });
  return minutes ? t('stats.hours', { hours, minutes }) : t('ambient.cook.timer.hours', { hours });
}

export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const h24 = () => ctx.store.get().settings.ambient.clock24h;
  const kicker = el('span', { class: 'at-am-kicker' });
  const digits = el('span', { class: 'at-am-cdigits', role: 'timer', 'data-cook-elapsed': '' });
  const hint = el('span', { class: 'at-am-hint', 'data-cook-hint': '' });
  const note = el('span', { class: 'at-am-cnote' }, t('ambient.cook.pausedNote'));
  const tap = el('button', { type: 'button', class: 'at-cook-tap', 'data-cook-tap': '' });
  tap.append(kicker, digits, hint, note);

  const side = el('section', { class: 'at-cook-side', 'aria-labelledby': 'cook-kt' });
  const head = el('div', { class: 'at-cook-head' });
  const count = el('span');
  head.append(el('h2', { id: 'cook-kt', class: 'at-am-kicker' }, t('ambient.cook.timers')), count);
  const list = el('div', { class: 'at-cook-timers', 'data-cook-timers': '' });
  const empty = el('p', { class: 'at-cook-msg' }, t('ambient.cook.empty'));
  const full = el('p', { class: 'at-cook-msg' }, t('ambient.cook.full'));

  const form = el('form', { class: 'at-cook-add', 'data-cook-add': '', 'aria-label': t('ambient.cook.timer.add') });
  const nameRow = el('div', { class: 'at-cook-name' });
  const nameBox = el('div');
  const name = el('input', { id: 'cook-name', name: 'name', maxlength: String(COOK_NAME_MAX), autocomplete: 'off' });
  nameBox.append(el('label', { for: 'cook-name' }, t('ambient.cook.timer.name')), name);
  const custom = el('button', { type: 'button', class: 'at-cook-custom', 'aria-expanded': 'false' }, t('tool.preset.custom'));
  nameRow.append(nameBox, custom);
  const quick = el('div', { class: 'at-cook-quick', role: 'group', 'aria-label': t('ambient.cook.timer.add') });
  for (const m of QUICK_MIN) quick.append(el('button', { type: 'button', 'data-cook-quick': String(m) }, t('stats.minutes', { minutes: m })));
  const step = el('div', { class: 'at-cook-step', hidden: '' });
  const less = el('button', { type: 'button', 'aria-label': t('ambient.cook.less') }, '−');
  const more = el('button', { type: 'button', 'aria-label': t('ambient.cook.more') }, '+');
  const minutes = el('input', {
    name: 'minutes',
    type: 'number',
    inputmode: 'numeric',
    min: '1',
    max: '720',
    value: '20',
    'aria-label': t('ambient.cook.timer.custom'),
  });
  const box = el('span');
  box.append(minutes, el('span', { 'aria-hidden': 'true' }, t('ambient.cook.min')));
  step.append(less, box, more, el('button', { type: 'submit', 'aria-label': t('ambient.cook.timer.add') }, t('ambient.cook.addShort')));
  form.append(nameRow, quick, step);
  side.append(head, list, empty, form, full);
  stage.append(tap, side);

  const flashes = new Map<string, number>();
  let timers: ICookTimer[] = readCookTimers(ctx.engine.session?.modeState);

  const persist = () => {
    if (live(ctx)) ctx.engine.updateSession({ modeState: { cookTimers: timers } });
  };

  // Cards are keyed by timer id and only their countdown changes each second, so focus on a Remove button
  // survives the repaint.
  const cards = new Map<string, { card: HTMLElement; left: HTMLElement; sub: HTMLElement; bar: HTMLElement }>();
  const renderTimers = (now: number) => {
    const n = timers.length;
    form.hidden = n >= COOK_MAX_TIMERS;
    full.hidden = !form.hidden;
    empty.hidden = n > 0;
    count.textContent = t('ambient.cook.count', { n, total: COOK_MAX_TIMERS });
    name.placeholder = t('ambient.cook.timer.default', { n: n + 1 });
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
        const card = el('div', { class: 'at-cook-timer', role: 'group', 'aria-labelledby': headingId, 'data-cook-timer': timer.id });
        const info = el('div');
        const sub = el('span', { class: 'at-cook-sub' });
        info.append(el('h3', { id: headingId }, timer.name), sub);
        const left = el('p', { class: 'at-cook-left', role: 'timer' });
        const remove = el('button', {
          type: 'button',
          class: 'at-cook-rm',
          'data-cook-remove': timer.id,
          'aria-label': t('ambient.cook.timer.removeNamed', { name: timer.name }),
        });
        const bar = el('div', { class: 'at-cook-bar', 'aria-hidden': 'true' });
        bar.append(el('i'));
        card.append(info, left, remove, bar);
        list.append(card);
        view = { card, left, sub, bar };
        cards.set(timer.id, view);
      }
      const done = timer.doneAt !== null;
      view.card.toggleAttribute('data-flash', (flashes.get(timer.id) ?? 0) > now);
      view.card.toggleAttribute('data-done', done);
      view.left.textContent = done ? t('ambient.cook.timer.done') : short(timer.endsAt - now);
      view.bar.style.setProperty('--p', done ? '1' : String(Math.min(1, (timer.endsAt - now) / timer.durationMs)));
      if (done) view.sub.textContent = t('ambient.cook.timer.doneAt', { time: at(timer.doneAt ?? now, now, h24()) });
      else if (!view.sub.firstChild) {
        view.sub.append(
          el('span', {}, `${t('ambient.cook.timer.of', { length: length(timer.durationMs) })} · `),
          t('ambient.cook.timer.ready', { time: at(timer.endsAt, now, h24()) }),
        );
      }
    }
  };

  const paint = (now: number) => {
    const session = ctx.store.get().session;
    const running = !!session && (session.status === 'active' || session.status === 'paused');
    const paused = session?.status === 'paused';
    kicker.textContent = running ? t(paused ? 'ambient.cook.paused' : 'ambient.cook.for') : '';
    const text = writeDigits(digits, running ? activeElapsed(session, now) : 0);
    digits.toggleAttribute('data-long', text.length > 5);
    hint.textContent = !running ? t('ambient.cook.start') : paused ? t('ambient.cook.resume') : t('ambient.cook.pause');
    note.hidden = !paused;
    tap.toggleAttribute('data-run', running);
    tap.setAttribute('aria-pressed', String(paused));
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
    step.hidden = true;
    custom.setAttribute('aria-expanded', 'false');
    paint(Date.now());
  };

  const nudge = (d: number) => {
    minutes.value = String(Math.min(720, Math.max(1, (Math.floor(Number(minutes.value)) || 0) + d)));
  };
  less.addEventListener('click', () => {
    nudge(-1);
  });
  more.addEventListener('click', () => {
    nudge(1);
  });
  custom.addEventListener('click', () => {
    step.hidden = !step.hidden;
    custom.setAttribute('aria-expanded', String(!step.hidden));
  });
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
