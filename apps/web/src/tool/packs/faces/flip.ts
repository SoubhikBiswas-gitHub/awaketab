import href from './flip.css?url';
import { el, font, type IFace, type IFrame, labels, sheet } from './kit.js';

interface ICard {
  root: HTMLElement;
  top: HTMLElement;
  bot: HTMLElement;
  fall: HTMLElement;
  rise: HTMLElement;
  v: string;
  run: Animation[];
}

const FALL: KeyframeAnimationOptions = { duration: 300, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)', fill: 'forwards' };
const RISE: KeyframeAnimationOptions = {
  duration: 360,
  delay: 300,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  fill: 'both',
};

function half(cls: string): HTMLElement {
  const h = el('span', `at-fx-half ${cls}`);
  h.append(el('span'));
  return h;
}

function write(h: HTMLElement, v: string): void {
  const n = h.firstElementChild;
  if (n && n.textContent !== v) n.textContent = v;
}

function card(): ICard {
  const root = el('span', 'at-fx-card');
  const c = {
    root,
    top: half('at-fx-top'),
    bot: half('at-fx-bot'),
    fall: half('at-fx-top at-fx-fall'),
    rise: half('at-fx-bot at-fx-rise'),
    v: '',
    run: [] as Animation[],
  };
  root.append(c.top, c.bot, c.fall, c.rise);
  return c;
}

// The classic four-leaf split flap: the old top half falls away over the new one, then the new bottom half lands.
function turn(c: ICard, v: string, still: boolean): void {
  if (c.v === v) return;
  const old = c.v;
  c.v = v;
  for (const a of c.run) a.cancel();
  c.run = [];
  write(c.top, v);
  if (still || !old) {
    for (const h of [c.bot, c.fall, c.rise]) write(h, v);
    c.root.classList.remove('at-fx-turning');
    return;
  }
  write(c.bot, old);
  write(c.fall, old);
  write(c.rise, v);
  c.root.classList.add('at-fx-turning');
  const land = c.rise.animate([{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], RISE);
  c.run = [
    c.fall.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], FALL),
    land,
    c.fall.animate([{ opacity: 0 }, { opacity: 1 }], { ...FALL, pseudoElement: '::after' }),
    c.rise.animate([{ opacity: 1 }, { opacity: 0 }], { ...RISE, pseudoElement: '::after' }),
  ];
  land.finished.then(
    () => {
      write(c.bot, v);
      c.root.classList.remove('at-fx-turning');
      for (const a of c.run) a.cancel();
      c.run = [];
    },
    () => undefined,
  );
}

function group(text: string, cards: ICard[], cls: string): HTMLElement {
  const g = el('span', cls);
  for (const ch of text) {
    if (/\d/u.test(ch)) {
      const c = card();
      cards.push(c);
      g.append(c.root);
    } else if (ch === ':') {
      const colon = el('span', 'at-fx-colon');
      colon.append(el('i'), el('i'));
      g.append(colon);
    } else g.append(el('span', ch === ' ' ? 'at-fx-gap' : 'at-fx-unit', ch.trim()));
  }
  return g;
}

export async function make(): Promise<IFace> {
  await Promise.all([sheet(href), font('600 64px "Space Grotesk"')]);
  const root = el('div', 'at-fx at-fx-flip');
  const text = labels();
  const row = el('div', 'at-fx-row');
  root.append(text.k, row, text.meta);
  let shape = '';
  let cards: ICard[] = [];

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      const next = (f.a + f.b).replace(/\d/gu, '0') + String(f.a.length);
      const digits = (f.a + f.b).replace(/\D/gu, '');
      if (next !== shape) {
        shape = next;
        for (const c of cards) for (const a of c.run) a.cancel();
        cards = [];
        row.replaceChildren(group(f.a, cards, 'at-fx-grp'), group(f.b, cards, 'at-fx-grp at-fx-sec'));
      }
      cards.forEach((c, i) => {
        turn(c, digits[i] ?? '0', f.still);
      });
    },
    stop: () => {
      for (const c of cards) for (const a of c.run) a.cancel();
    },
  };
}
