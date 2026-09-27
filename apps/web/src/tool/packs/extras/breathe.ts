import type { ISettings } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { save, sheet, type TKit } from './common.js';

export type TBreath = NonNullable<ISettings['breathe']>;
type TStep = 'in' | 'hold' | 'out' | 'rest';

// Seconds per step: 4-7-8 (in, hold, out) and box breathing (in, hold, out, hold).
const PATTERNS: Record<TBreath, ReadonlyArray<readonly [TStep, number]>> = {
  '478': [
    ['in', 4],
    ['hold', 7],
    ['out', 8],
  ],
  box: [
    ['in', 4],
    ['hold', 4],
    ['out', 4],
    ['rest', 4],
  ],
};

interface IBreathPhase {
  step: TStep;
  index: number;
  breath: number;
  remainingMs: number;
  phaseMs: number;
}

export const breathOf = (s: ISettings): TBreath => (s.breathe === 'box' ? 'box' : '478');

export function breathPhase(elapsedMs: number, pattern: TBreath): IBreathPhase {
  const steps = PATTERNS[pattern];
  const cycle = steps.reduce((sum, [, sec]) => sum + sec * 1000, 0);
  const e = Math.max(0, elapsedMs);
  let at = e % cycle;
  for (const [index, [step, sec]] of steps.entries()) {
    const ms = sec * 1000;
    if (at < ms) return { step, index, breath: Math.floor(e / cycle) + 1, remainingMs: ms - at, phaseMs: ms };
    at -= ms;
  }
  return { step: 'in', index: 0, breath: Math.floor(e / cycle) + 2, remainingMs: 4000, phaseMs: 4000 };
}

// The disc's size at the end of each step: full after breathing in, small after breathing out.
const SIZE: Record<TStep, string> = { in: '1', hold: '1', out: '0.58', rest: '0.58' };

// Breathe mode: the ring grows as you breathe in and settles as you breathe out; under reduced motion the words
// and a stepped bar carry the rhythm and nothing scales.
export function mountBreathe(stage: HTMLElement, ctx: IToolCtx, kit: TKit): () => void {
  const { el } = kit;
  const svg = `<svg viewBox="0 0 320 320" aria-hidden="true" focusable="false"><circle class="at-br-track" cx="160" cy="160" r="146"/><circle class="at-br-arc" cx="160" cy="160" r="146" pathLength="100" transform="rotate(-90 160 160)"/></svg>`;
  const orb = el('div', { class: 'at-br-orb', 'aria-hidden': 'true' });
  orb.innerHTML = svg;
  const disc = el('div', { class: 'at-br-disc' });
  const word = el('span', { class: 'at-br-word' });
  const count = el('span', { class: 'at-br-count' });
  orb.append(disc, el('div', { class: 'at-br-text' }, word, count));
  const arc = orb.querySelector<SVGCircleElement>('.at-br-arc');
  const bar = el('div', { class: 'at-br-bar', 'aria-hidden': 'true' }, el('i'));
  const note = el('p', { class: 'at-am-next at-br-note' });
  const pick = el('div', { class: 'at-seg at-br-pick', role: 'group', 'aria-label': t('ambient.breathe.pattern') });
  pick.append(el('span', { class: 'at-seg-ind', 'aria-hidden': 'true' }));
  for (const id of ['478', 'box'] as const)
    pick.append(el('button', { type: 'button', class: 'at-seg-item', 'data-breath': id }, t(`ambient.breathe.${id}`)));
  const live = el('p', { class: 'sr-only', 'aria-live': 'polite' });
  const box = el('div', { class: 'at-br', 'data-breathe': '' }, orb, bar, note, pick, live);
  box.hidden = true;
  stage.append(box);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => motion.matches || ctx.store.get().settings.reduceMotion === 'on';
  const pattern = () => breathOf(ctx.store.get().settings);
  let t0 = Date.now();
  let last = -1;
  let timer = 0;
  let frame = 0;
  let gone = false;

  const enter = (p: IBreathPhase) => {
    box.dataset.step = p.step;
    box.toggleAttribute('data-still', still());
    box.style.setProperty('--br-d', `${String(p.remainingMs)}ms`);
    word.textContent = t(`ambient.breathe.${p.step}`);
    live.textContent = t('ambient.breathe.said', { step: word.textContent, n: Math.round(p.phaseMs / 1000) });
    note.textContent = t('ambient.breathe.count', { n: p.breath, name: t(`ambient.breathe.${pattern()}`) });
    // The arc restarts each step from where the step already is, then runs to full over what is left of it.
    if (arc) {
      arc.style.transition = 'none';
      arc.style.strokeDashoffset = String(100 * (p.remainingMs / p.phaseMs));
      void arc.getBoundingClientRect();
      arc.style.transition = '';
      arc.style.strokeDashoffset = '0';
    }
    disc.style.setProperty('--s', SIZE[p.step]);
  };

  const tick = () => {
    window.clearTimeout(timer);
    const p = breathPhase(Date.now() - t0, pattern());
    const key = p.breath * 10 + p.index;
    if (key !== last) {
      last = key;
      enter(p);
    }
    count.textContent = String(Math.ceil(p.remainingMs / 1000));
    bar.style.setProperty('--p', String(1 - Math.ceil(p.remainingMs / 1000) / (p.phaseMs / 1000)));
    timer = window.setTimeout(tick, p.remainingMs % 1000 || 1000);
  };

  const restart = () => {
    t0 = Date.now();
    last = -1;
    const cur = pattern();
    const i = cur === 'box' ? 1 : 0;
    pick.style.setProperty('--at-seg-n', '2');
    pick.style.setProperty('--at-seg-i', String(i));
    for (const b of pick.querySelectorAll<HTMLElement>('[data-breath]'))
      b.setAttribute('aria-pressed', String(b.dataset.breath === cur));
    // One settled frame at the breathed-out size first, so the first breath grows instead of jumping.
    disc.style.setProperty('--s', SIZE.rest);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(tick);
    });
  };

  pick.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-breath]');
    const id = b?.dataset.breath === 'box' ? 'box' : '478';
    if (!b || id === pattern()) return;
    save(ctx, { breathe: id });
    restart();
  });
  const onVis = () => {
    if (document.visibilityState === 'visible') {
      last = -1;
      tick();
    }
  };
  document.addEventListener('visibilitychange', onVis);
  motion.addEventListener('change', onVis);

  void sheet().then(() => {
    if (gone) return;
    box.hidden = false;
    restart();
  });
  return () => {
    gone = true;
    window.clearTimeout(timer);
    cancelAnimationFrame(frame);
    document.removeEventListener('visibilitychange', onVis);
    motion.removeEventListener('change', onVis);
  };
}
