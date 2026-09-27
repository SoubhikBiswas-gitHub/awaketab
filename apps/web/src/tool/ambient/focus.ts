import { dayKey } from '@awaketab/core';
import type { IToolCtx } from '../ctx.js';
import { t } from '../i18n.js';
import { chime, notify } from '../signal.js';
import { toast } from '../ui/toast.js';
import { activeElapsed, FOCUS_LONG_BREAK_MIN, focusPhase, focusPlanMs, type IFocusPhase } from './logic.js';
import { at, digits as writeDigits } from './fmt.js';
import { el, everySecond } from './tick.js';

const PHASE = { work: 'ambient.focus.work', break: 'ambient.focus.break', long: 'ambient.focus.long', done: 'tool.timer.complete' };

function dotState(cycle: number, p: IFocusPhase): 'done' | 'now' | 'todo' {
  if (cycle < p.cycle || (cycle === p.cycle && p.kind !== 'work')) return 'done';
  return cycle === p.cycle ? 'now' : 'todo';
}

export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const kicker = el('span', { class: 'at-am-kicker' }, t('ambient.focus.block'));
  const row = el('div', { class: 'at-am-frow', 'data-focus-label': '' });
  const phaseEl = el('span', { class: 'at-am-phase' });
  const cycle = el('span', { class: 'at-am-cycle' });
  const dots = el('span', { class: 'at-focus-dots', role: 'img' });
  row.append(phaseEl, cycle, dots);
  const digits = el('div', { class: 'at-am-fdigits', role: 'timer', 'data-focus-digits': '' });
  const bar = el('div', { class: 'at-am-fbar', 'aria-hidden': 'true' });
  bar.append(el('i'));
  const next = el('p', { class: 'at-am-next' });
  const skip = el('button', { type: 'button', class: 'at-am-skip', 'data-focus-skip': '' });
  const intro = el('p', { class: 'at-am-intro' });
  const start = el('button', { type: 'button', class: 'at-am-cta', 'data-focus-start': '' }, t('ambient.focus.start'));
  const today = el('p', { class: 'at-am-today', 'data-focus-today': '' });
  const live = el('p', { class: 'sr-only', 'aria-live': 'polite' });
  stage.append(kicker, row, digits, bar, next, skip, intro, start, today, live);

  let lastIndex = -1;
  const cfg = () => ctx.store.get().settings.ambient.focus;
  const skipped = () => Number(ctx.engine.session?.modeState.focusSkip) || 0;

  start.addEventListener('click', () => {
    lastIndex = -1;
    // The marker is what makes a completed session count as a focus block (at.v1.stats.dayFocus); an
    // extension of a finished block is a plain focus-mode session and does not count (docs/08 §2.3).
    void ctx.startPlan({ type: 'duration', ms: focusPlanMs(cfg()) }, 'custom').then(() => {
      ctx.engine.updateSession({ modeState: { focusBlock: true, focusSkip: 0 } });
    });
  });

  let wasRunning: boolean | null = null;
  const paint = (now: number) => {
    const c = cfg();
    const session = ctx.store.get().session;
    const running = session?.mode === 'focus' && (session.status === 'active' || session.status === 'paused');
    // Stats are re-read only when a block starts or ends, not every second.
    if (running !== wasRunning) {
      wasRunning = running;
      const n = ctx.storage.stats().dayFocus?.[dayKey(now)] ?? 0;
      today.hidden = n < 1;
      today.textContent = t('ambient.focus.today', { n });
    }
    for (const n of [kicker, intro, start]) n.hidden = running;
    for (const n of [row, bar, next, skip]) n.hidden = !running;
    digits.classList.toggle('is-idle', !running);
    if (!running) {
      intro.textContent = t('ambient.focus.intro', { work: c.workMin, rest: c.breakMin, cycles: c.cycles });
      writeDigits(digits, c.workMin * 60_000);
      delete stage.dataset.phase;
      lastIndex = -1;
      return;
    }
    const phase = focusPhase(activeElapsed(session, now) + skipped(), c);
    if (phase.kind === 'done') {
      // Only reachable early after a skip: the block is over, so is the session.
      if (skipped()) ctx.stop();
      return;
    }
    const work = phase.kind === 'work';
    const last = phase.cycle >= c.cycles;
    stage.dataset.phase = phase.kind;
    phaseEl.textContent = t(PHASE[phase.kind]);
    cycle.textContent = t('ambient.focus.cycle', { n: phase.cycle, total: c.cycles });
    writeDigits(digits, phase.remainingMs);
    bar.style.setProperty('--p', String(phase.remainingMs / phase.phaseMs));
    const time = at(now + phase.remainingMs, now, ctx.store.get().settings.ambient.clock24h);
    next.textContent = t(
      work ? (last ? 'ambient.focus.nextLong' : 'ambient.focus.nextBreak') : phase.kind === 'break' ? 'ambient.focus.nextFocus' : 'ambient.focus.nextEnd',
      { time },
    );
    skip.textContent = t(
      work ? (last ? 'ambient.focus.skipLong' : 'ambient.focus.skipBreak') : phase.kind === 'break' ? 'ambient.focus.skipFocus' : 'ambient.focus.finish',
    );
    const states = Array.from({ length: c.cycles }, (_, i) => dotState(i + 1, phase));
    dots.replaceChildren(...states.map((s) => el('span', { 'data-state': s })));
    dots.setAttribute('aria-label', t('ambient.focus.dots', { n: states.filter((s) => s === 'done').length, total: c.cycles }));
    if (lastIndex !== -1 && phase.index !== lastIndex) {
      const text = work
        ? t('ambient.focus.toast.work', { minutes: c.workMin })
        : t('ambient.focus.toast.break', { minutes: phase.kind === 'long' ? FOCUS_LONG_BREAK_MIN : c.breakMin });
      live.textContent = text;
      chime(ctx, 'focus');
      void notify(ctx, t('end.notify.title'), text, 'at-focus');
      toast(ctx.store, { kind: 'info', text, id: 'focus' });
    }
    lastIndex = phase.index;
  };

  skip.addEventListener('click', () => {
    const session = ctx.engine.session;
    if (!session) return;
    const now = Date.now();
    const phase = focusPhase(activeElapsed(session, now) + skipped(), cfg());
    if (phase.kind === 'long') ctx.stop();
    else ctx.engine.updateSession({ modeState: { focusSkip: skipped() + phase.remainingMs } });
    paint(now);
  });

  const off = everySecond(paint);
  return () => {
    off();
    delete stage.dataset.phase;
  };
}
