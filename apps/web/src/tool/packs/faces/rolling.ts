import 'number-flow';
import href from './rolling.css?url';
import { el, type IFace, type IFrame, labels, sheet, split } from './kit.js';

const MOVE: EffectTiming = { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
const FADE: EffectTiming = { duration: 350, easing: 'ease-out' };
type TFormat = NonNullable<HTMLElementTagNameMap['number-flow']['format']>;
const PAD: TFormat = { minimumIntegerDigits: 2, useGrouping: false };
const PLAIN: TFormat = { useGrouping: false };

function drum(pad: boolean): HTMLElementTagNameMap['number-flow'] {
  const n = document.createElement('number-flow');
  n.format = pad ? PAD : PLAIN;
  // Minutes and seconds wrap at 59, so their tens drum only carries 0 to 5.
  if (pad) n.digits = { 1: { max: 5 } };
  n.respectMotionPreference = false;
  n.transformTiming = MOVE;
  n.spinTiming = MOVE;
  n.opacityTiming = FADE;
  return n;
}

export async function make(): Promise<IFace> {
  await sheet(href);
  const root = el('div', 'at-fx at-fx-roll');
  const text = labels();
  const win = el('div', 'at-fx-drum');
  const digits = el('div', 'at-digits at-fx-rd');
  const days = drum(false);
  days.numberSuffix = 'd';
  const hours = drum(false);
  const mins = drum(true);
  const secs = drum(true);
  const dayGap = el('span', 'at-fx-rgap');
  const hourSep = el('span', 'at-fx-rsep', ':');
  const tail = el('span', 'at-secs at-fx-rtail');
  tail.append(el('span', 'at-fx-rsep', ':'), secs);
  digits.append(days, dayGap, hours, hourSep, mins, tail);
  const line = el('div', 'at-fx-rline');
  line.append(el('div'));
  win.append(digits);
  root.append(text.k, win, line, text.meta);

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      const [d, h, m, s] = split(f.sec);
      const trend = f.inf ? 1 : -1;
      days.hidden = dayGap.hidden = d === 0;
      hours.hidden = hourSep.hidden = d === 0 && h === 0;
      const fmt = d ? PAD : PLAIN;
      if (hours.format !== fmt) {
        hours.format = fmt;
        hours.update(h);
      }
      for (const [n, v] of [
        [days, d],
        [hours, h],
        [mins, m],
        [secs, s],
      ] as const) {
        n.animated = !f.still;
        n.trend = trend;
        if (n.value !== v) n.update(v);
      }
    },
  };
}
