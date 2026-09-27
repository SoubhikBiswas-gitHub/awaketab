import href from './analog.css?url';
import { el, type IFace, type IFrame, labels, put, sheet, svg } from './kit.js';

const C = 160;

function at(r: number, i: number, n: number): string {
  const a = (i / n) * 2 * Math.PI;
  return `${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`;
}

function ticks(n: number, r1: number, r2: number, keep: (i: number) => boolean): string {
  let d = '';
  for (let i = 0; i < n; i += 1) if (keep(i)) d += `M${at(r1, i, n)}L${at(r2, i, n)}`;
  return d;
}

function dots(n: number, r: number, size: number): string {
  let d = '';
  for (let i = 0; i < n; i += 1) {
    const [x = 0, y = 0] = at(r, i, n).split(' ').map(Number);
    d += `M${String(x - size)} ${String(y)}a${String(size)} ${String(size)} 0 1 0 ${String(2 * size)} 0a${String(size)} ${String(size)} 0 1 0 ${String(-2 * size)} 0`;
  }
  return d;
}

function art(cls: string): SVGSVGElement {
  return svg('svg', { class: cls, viewBox: '0 0 320 320', 'aria-hidden': 'true', focusable: 'false' });
}

export async function make(): Promise<IFace> {
  await sheet(href);
  const root = el('div', 'at-fx at-fx-an');
  const dial = el('div', 'at-fx-an-dial');
  const plate = el('div', 'at-fx-an-plate');
  const face = art('at-fx-an-art');
  const arcs = svg('g', { transform: `rotate(-90 ${String(C)} ${String(C)})` });
  arcs.append(svg('circle', { class: 'at-fx-an-arc', cx: C, cy: C, r: 152 }));
  face.append(
    svg('circle', { class: 'at-fx-an-track', cx: C, cy: C, r: 152 }),
    arcs,
    svg('path', { class: 'at-fx-an-min', d: ticks(60, 134, 129, (i) => i % 5 !== 0) }),
    svg('path', { class: 'at-fx-an-hr', d: ticks(12, 134, 120, (i) => i % 3 !== 0) }),
    svg('path', { class: 'at-fx-an-card', d: ticks(12, 134, 114, (i) => i % 3 === 0) }),
    svg('path', { class: 'at-fx-an-lume', d: dots(12, 106, 3) }),
  );
  const hands = art('at-fx-an-hands');
  const hour = svg('g', { class: 'at-fx-an-h' });
  hour.append(
    svg('path', { class: 'at-fx-an-hand', d: 'M155.5 172h9V86a4.5 4.5 0 0 0-9 0z' }),
    svg('path', { class: 'at-fx-an-inlay', d: 'M158.2 150h3.6V94a1.8 1.8 0 0 0-3.6 0z' }),
  );
  const minute = svg('g', { class: 'at-fx-an-m' });
  minute.append(
    svg('path', { class: 'at-fx-an-hand', d: 'M157.25 174h5.5V48a2.75 2.75 0 0 0-5.5 0z' }),
    svg('path', { class: 'at-fx-an-inlay', d: 'M158.8 150h2.4V58a1.2 1.2 0 0 0-2.4 0z' }),
  );
  const second = svg('g', { class: 'at-fx-an-s' });
  second.append(
    svg('path', { class: 'at-fx-an-sec', d: 'M160 192V34' }),
    svg('circle', { class: 'at-fx-an-dot', cx: C, cy: 186, r: 4 }),
  );
  hands.append(
    hour,
    minute,
    second,
    svg('circle', { class: 'at-fx-an-cap', cx: C, cy: C, r: 6 }),
    svg('circle', { class: 'at-fx-an-pin', cx: C, cy: C, r: 2.4 }),
  );
  const text = labels();
  const low = el('div', 'at-fx-an-low');
  const digits = el('div', 'at-digits');
  const a = el('span');
  const b = el('span', 'at-secs');
  digits.append(a, b);
  low.append(digits, text.meta);
  dial.append(plate, face, text.k, low, hands);
  root.append(dial);

  let spin: Animation | null = null;
  // The second hand sweeps on the document timeline, set from the clock and again whenever the tab comes back.
  const sync = () => {
    const now = new Date();
    if (spin) spin.currentTime = now.getSeconds() * 1000 + now.getMilliseconds();
  };
  const back = () => {
    if (!document.hidden) sync();
  };
  document.addEventListener('visibilitychange', back);
  const turn = (g: SVGGElement, deg: number) => {
    g.style.transform = `rotate(${deg.toFixed(2)}deg)`;
  };

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      put(a, f.a);
      put(b, f.b);
      root.dataset.style = f.style;
      const now = new Date(f.now);
      const sec = now.getSeconds();
      const m = now.getMinutes() + sec / 60;
      turn(hour, (now.getHours() % 12) * 30 + m / 2);
      turn(minute, m * 6);
      if (f.still) {
        spin?.cancel();
        spin = null;
        turn(second, sec * 6);
      } else if (!spin) {
        second.style.transform = '';
        spin = second.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
          duration: 60_000,
          iterations: Infinity,
        });
        sync();
      }
    },
    stop: () => {
      spin?.cancel();
      document.removeEventListener('visibilitychange', back);
    },
  };
}
