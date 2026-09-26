import type { IToolCtx } from '../ctx.js';
import { formatHms } from '../format.js';
import { t } from '../i18n.js';
import { chime, notify } from '../signal.js';
import { toast } from '../ui/toast.js';
import { activeElapsed, FOCUS_LONG_BREAK_MIN, focusPhase, focusPlanMs, type IFocusPhase } from './logic.js';
import { el, everySecond } from './tick.js';

function phaseLabel(p: IFocusPhase, cycles: number): string {
  if (p.kind === 'work') return t('ambient.focus.cycle', { n: p.cycle, total: cycles });
  if (p.kind === 'break') return t('ambient.focus.break');
  if (p.kind === 'long') return t('ambient.focus.long');
  return t('tool.timer.complete');
}

/** A cycle's dot: done once its work interval is over, `now` while it runs. */
function dotState(cycle: number, p: IFocusPhase): 'done' | 'now' | 'todo' {
  if (cycle < p.cycle || (cycle === p.cycle && p.kind !== 'work')) return 'done';
  return cycle === p.cycle ? 'now' : 'todo';
}

/**
 * Pomodoro (docs/05 §3.14): the whole block is one `duration` session (130 min with the defaults) so the
 * lock is held through breaks; phases are derived from active elapsed time on every repaint.
 */
export function mount(stage: HTMLElement, ctx: IToolCtx): () => void {
  const label = el('p', { class: 'at-ambient-sub', 'data-focus-label': '' });
  const digits = el('div', { class: 'at-ambient-digits', 'data-focus-digits': '' });
  const dots = el('div', { class: 'at-focus-dots', 'aria-hidden': 'true' });
  const live = el('p', { class: 'sr-only', 'aria-live': 'polite' });
  const intro = el('p', { class: 'at-ambient-sub' });
  const start = el('button', { type: 'button', class: 'at-btn at-ambient-cta', 'data-focus-start': '' }, t('ambient.focus.start'));
  stage.append(label, digits, dots, intro, start, live);

  let lastIndex = -1;
  const cfg = () => ctx.store.get().settings.ambient.focus;

  start.addEventListener('click', () => {
    lastIndex = -1;
    void ctx.startPlan({ type: 'duration', ms: focusPlanMs(cfg()) }, 'custom');
  });

  const paint = (now: number) => {
    const c = cfg();
    const session = ctx.store.get().session;
    const running = session?.mode === 'focus' && (session.status === 'active' || session.status === 'paused');
    start.hidden = running;
    intro.hidden = running;
    label.hidden = !running;
    dots.hidden = !running;
    if (!running) {
      intro.textContent = t('ambient.focus.intro', { work: c.workMin, rest: c.breakMin, cycles: c.cycles });
      digits.textContent = formatHms(c.workMin * 60_000).slice(3);
      lastIndex = -1;
      return;
    }
    const phase = focusPhase(activeElapsed(session, now), c);
    label.textContent = phaseLabel(phase, c.cycles);
    const rem = formatHms(phase.remainingMs);
    digits.textContent = phase.remainingMs < 3_600_000 ? rem.slice(3) : rem;
    dots.replaceChildren(...Array.from({ length: c.cycles }, (_, i) => el('span', { 'data-state': dotState(i + 1, phase) })));
    if (lastIndex !== -1 && phase.index !== lastIndex && phase.kind !== 'done') {
      const text =
        phase.kind === 'work'
          ? t('ambient.focus.toast.work', { minutes: c.workMin })
          : t('ambient.focus.toast.break', { minutes: phase.kind === 'long' ? FOCUS_LONG_BREAK_MIN : c.breakMin });
      live.textContent = text;
      chime(ctx, 'focus');
      void notify(ctx, t('end.notify.title'), text, 'at-focus');
      toast(ctx.store, { kind: 'info', text, id: 'focus' });
    }
    lastIndex = phase.index;
  };

  return everySecond(paint);
}
