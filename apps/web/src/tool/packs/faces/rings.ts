import href from './rings.css?url';
import { el, type IFace, type IFrame, labels, put, sheet, split, svg } from './kit.js';

const C = 160;
const RADII = [144, 116, 88] as const;

export async function make(): Promise<IFace> {
  await sheet(href);
  const root = el('div', 'at-fx at-fx-rings');
  const box = el('div', 'at-fx-rg-box');
  const art = svg('svg', { class: 'at-fx-rg-art', viewBox: '0 0 320 320', 'aria-hidden': 'true', focusable: 'false' });
  const g = svg('g', { transform: `rotate(-90 ${String(C)} ${String(C)})` });
  const arcs = RADII.map((r, i) => {
    const len = (2 * Math.PI * r).toFixed(2);
    g.append(svg('circle', { class: `at-fx-rg-track at-fx-rg-${String(i)}`, cx: C, cy: C, r }));
    const arc = svg('circle', { class: `at-fx-rg-arc at-fx-rg-${String(i)}`, cx: C, cy: C, r });
    arc.style.setProperty('--at-fx-len', `${len}px`);
    g.append(arc);
    return arc;
  });
  art.append(g);
  const text = labels();
  const mid = el('div', 'at-fx-rg-mid');
  const digits = el('div', 'at-digits');
  const a = el('span');
  const b = el('span', 'at-secs');
  digits.append(a, b);
  mid.append(text.k, digits, text.meta);
  box.append(art, mid);
  root.append(box);
  const last = [-1, -1, -1];

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      put(a, f.a);
      put(b, f.b);
      const [, , m, s] = split(f.sec);
      // Outer: the session (time left of the whole, or hours awake when there is no limit); then minutes, seconds.
      const vals = [f.inf ? (f.sec % 43_200) / 43_200 : f.p, m / 60, s / 60];
      arcs.forEach((arc, i) => {
        const v = vals[i] ?? 0;
        // A wrap (59 → 0) jumps instead of sweeping backwards round the ring.
        arc.toggleAttribute('data-jump', last[i] !== -1 && Math.abs(v - (last[i] ?? 0)) > 0.5);
        last[i] = v;
        arc.style.setProperty('--at-fx-v', v.toFixed(4));
      });
    },
  };
}
