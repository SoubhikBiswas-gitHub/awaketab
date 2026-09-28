import { countDay, dayKey, type ISession } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { notify } from '../../signal.js';
import { toast } from '../../ui/toast.js';
import { liveSession } from '../../ui/view.js';
import { autoOn, cleanIntention, cue, onAutoChange, sheet, type TKit } from './common.js';
import {
  focusConfig,
  focusElapsed,
  focusPhase,
  focusPlanMs,
  frozenConfig,
  type IFocusConfig,
  type IFocusPhase,
  readClock,
} from './pomodoro.js';

function dotState(cycle: number, p: IFocusPhase): 'done' | 'now' | 'todo' {
  if (cycle < p.cycle || (cycle === p.cycle && p.kind !== 'work')) return 'done';
  return cycle === p.cycle ? 'now' : 'todo';
}

// Focus mode (docs/05 §3.14): one block of focus and breaks, or with auto-cycle (Pro) blocks that repeat until
// you stop. Every phase is derived from timestamps on each repaint, so a background tab is right when it returns.
export function mountFocus(stage: HTMLElement, ctx: IToolCtx, kit: TKit): () => void {
  const { el } = kit;
  void sheet();
  const kicker = el('span', { class: 'at-am-kicker' }, t('ambient.focus.block'));
  const phaseEl = el('span', { class: 'at-am-phase' });
  const cycle = el('span', { class: 'at-am-cycle' });
  const dots = el('span', { class: 'at-focus-dots', role: 'img' });
  const row = el('div', { class: 'at-am-frow', 'data-focus-label': '' }, phaseEl, cycle, dots);
  const digits = el('div', { class: 'at-am-fdigits', role: 'timer', 'data-focus-digits': '' });
  const bar = el('div', { class: 'at-am-fbar', 'aria-hidden': 'true' }, el('i'));
  const aim = el('p', { class: 'at-fx-aim', 'data-focus-intention': '' });
  const next = el('p', { class: 'at-am-next' });
  const skip = el('button', { type: 'button', class: 'at-am-skip', 'data-focus-skip': '' });
  const hold = el('button', { type: 'button', class: 'at-am-skip at-fx-hold', 'data-focus-pause': '' });
  const acts = el('div', { class: 'at-fx-acts' }, hold, skip);
  const intro = el('p', { class: 'at-am-intro' });
  const start = el('button', { type: 'button', class: 'at-am-cta', 'data-focus-start': '' }, t('ambient.focus.start'));
  const today = el('p', { class: 'at-am-today', 'data-focus-today': '' });
  const live = el('p', { class: 'sr-only', 'aria-live': 'polite' });
  stage.append(kicker, row, digits, bar, aim, next, acts, intro, start, today, live);

  let lastIndex = -1;
  let lastKey = '';
  const cfgOf = (session: ISession | null): IFocusConfig =>
    frozenConfig(session?.modeState.focusCfg) ?? focusConfig(ctx.store.get().settings);
  const repeats = (session: ISession) => session.modeState.focusAuto === true;

  start.addEventListener('click', () => {
    lastIndex = -1;
    const c = focusConfig(ctx.store.get().settings);
    const auto = autoOn(ctx);
    // A single block is a `duration` plan whose completion counts in at.v1.stats.dayFocus; auto-cycle runs with
    // no limit and counts each finished round itself (docs/08 §2.3). An extension of a block does not count.
    void ctx
      .startPlan(auto ? { type: 'indefinite' } : { type: 'duration', ms: focusPlanMs(c) }, auto ? 'pinf' : 'custom')
      .then(() => {
        ctx.engine.updateSession({
          modeState: { focusBlock: !auto, focusAuto: auto, focusCfg: c, focusSkip: 0, focusPaused: 0, focusRounds: 0 },
        });
      });
  });

  const countRounds = (n: number, now: number) => {
    const stats = ctx.storage.stats();
    for (let i = 0; i < n; i += 1) stats.dayFocus = countDay(stats.dayFocus, now);
    ctx.storage.writeStats(stats);
    wasRunning = null;
  };

  let wasRunning: boolean | null = null;
  let stopAt = 0;
  const paint = (now: number) => {
    const s = ctx.store.get();
    const session = liveSession(s);
    const running = session?.mode === 'focus';
    const c = cfgOf(running ? session : null);
    // Stats are re-read only when a block starts or ends (or a round is counted), not every second.
    if (running !== wasRunning) {
      wasRunning = running;
      const n = ctx.storage.stats().dayFocus?.[dayKey(now)] ?? 0;
      today.hidden = n < 1;
      today.textContent = t('ambient.focus.today', { n });
    }
    const said = cleanIntention(s.settings.intention);
    aim.hidden = !said;
    aim.textContent = said ? t('ambient.focus.on', { text: said }) : '';
    for (const n of [kicker, intro, start]) n.hidden = running;
    for (const n of [row, bar, next, acts]) n.hidden = !running;
    digits.classList.toggle('is-idle', !running);
    if (!running) {
      const auto = autoOn(ctx);
      intro.textContent = t(auto ? 'ambient.focus.introAuto' : 'ambient.focus.intro', {
        work: c.workMin,
        rest: c.breakMin,
        cycles: c.cycles,
        long: c.longMin,
      });
      kicker.textContent = t(auto ? 'ambient.focus.blockAuto' : 'ambient.focus.block');
      kit.digits(digits, c.workMin * 60_000);
      delete stage.dataset.phase;
      delete stage.dataset.paused;
      lastIndex = -1;
      return;
    }
    const clock = readClock(session.modeState);
    const elapsed = focusElapsed(kit.elapsed(session, now), clock, now);
    const auto = repeats(session);
    const repeat = auto && autoOn(ctx);
    const blockMs = focusPlanMs(c);
    const done = Number(session.modeState.focusRounds) || 0;
    // An auto-cycle session whose preview (or licence) ended finishes the block it is in, like a single block.
    if (auto && !repeat) {
      stopAt ||= (Math.floor(elapsed / blockMs) + 1) * blockMs;
      if (elapsed >= stopAt) {
        countRounds(Math.round(stopAt / blockMs) - done, now);
        ctx.stop();
        return;
      }
    } else stopAt = 0;
    const phase = focusPhase(elapsed, c, auto);
    if (phase.kind === 'done') {
      // Only reachable early after a skip: the block is over, so is the session.
      if (clock.skip) ctx.stop();
      return;
    }
    if (repeat && phase.round - 1 > done) {
      countRounds(phase.round - 1 - done, now);
      ctx.engine.updateSession({ modeState: { focusRounds: phase.round - 1 } });
    }
    // Free blocks keep their end: while paused, the session's end moves with the pause, 30 s at a time.
    if (clock.pauseAt !== null && !auto) {
      const want = now - clock.pauseAt;
      const added = Number(session.modeState.focusAdded) || 0;
      if (want - added >= 30_000) {
        ctx.engine.addTime(want - added);
        ctx.engine.updateSession({ modeState: { focusAdded: want } });
      }
    }
    const paused = clock.pauseAt !== null;
    const work = phase.kind === 'work';
    const last = phase.cycle >= c.cycles;
    stage.dataset.phase = phase.kind;
    stage.toggleAttribute('data-paused', paused);
    phaseEl.textContent = t(paused ? 'ambient.focus.paused' : `ambient.focus.${phase.kind}`);
    cycle.textContent = repeat
      ? t('ambient.focus.cycleRound', { n: phase.cycle, total: c.cycles, round: phase.round })
      : t('ambient.focus.cycle', { n: phase.cycle, total: c.cycles });
    kit.digits(digits, phase.remainingMs);
    bar.style.setProperty('--p', String(phase.remainingMs / phase.phaseMs));
    const time = kit.at(now + phase.remainingMs, now, s.settings.ambient.clock24h);
    const to = work ? (last ? 'Long' : 'Break') : phase.kind === 'break' ? 'Focus' : repeat ? 'Round' : '';
    next.textContent = paused ? t('ambient.focus.pausedNote') : t(`ambient.focus.next${to || 'End'}`, { time });
    skip.textContent = t(to ? `ambient.focus.skip${to}` : 'ambient.focus.finish');
    const key = paused ? 'ambient.focus.resume' : 'ambient.focus.pause';
    if (key !== lastKey) {
      lastKey = key;
      hold.textContent = t(key);
      hold.toggleAttribute('data-on', paused);
    }
    const states = Array.from({ length: c.cycles }, (_, i) => dotState(i + 1, phase));
    dots.replaceChildren(...states.map((st) => el('span', { 'data-state': st })));
    dots.setAttribute(
      'aria-label',
      t('ambient.focus.dots', { n: states.filter((st) => st === 'done').length, total: c.cycles }),
    );
    if (lastIndex !== -1 && phase.index !== lastIndex) {
      const text = work
        ? t('ambient.focus.toast.work', { minutes: c.workMin })
        : t('ambient.focus.toast.break', { minutes: phase.kind === 'long' ? c.longMin : c.breakMin });
      live.textContent = text;
      cue(ctx);
      void notify(ctx, t('end.notify.title'), text, 'at-focus');
      toast(ctx.store, { kind: 'info', text, id: 'focus' });
    }
    lastIndex = phase.index;
  };

  skip.addEventListener('click', () => {
    const session = ctx.engine.session;
    if (!session) return;
    const now = Date.now();
    const clock = readClock(session.modeState);
    const c = cfgOf(session);
    const repeat = repeats(session) && autoOn(ctx);
    const phase = focusPhase(focusElapsed(kit.elapsed(session, now), clock, now), c, repeats(session));
    if (phase.kind === 'long' && !repeat) ctx.stop();
    else ctx.engine.updateSession({ modeState: { focusSkip: clock.skip + phase.remainingMs } });
    paint(now);
  });

  // Pause holds the Pomodoro clock only: the session and the wake lock keep running, and the pill says so.
  hold.addEventListener('click', () => {
    const session = ctx.engine.session;
    if (!session) return;
    const now = Date.now();
    const clock = readClock(session.modeState);
    if (clock.pauseAt === null) ctx.engine.updateSession({ modeState: { focusPauseAt: now, focusAdded: 0 } });
    else {
      const d = Math.max(0, now - clock.pauseAt);
      if (!repeats(session)) ctx.engine.addTime(d - (Number(session.modeState.focusAdded) || 0));
      ctx.engine.updateSession({ modeState: { focusPauseAt: 0, focusPaused: clock.paused + d, focusAdded: 0 } });
    }
    live.textContent = t(clock.pauseAt === null ? 'ambient.focus.pausedSaid' : 'ambient.focus.resumedSaid');
    paint(now);
  });

  const off = kit.every(paint);
  const offAuto = onAutoChange(() => {
    paint(Date.now());
  });
  return () => {
    off();
    offAuto();
    delete stage.dataset.phase;
    delete stage.dataset.paused;
  };
}
