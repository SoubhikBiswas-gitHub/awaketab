import href from './nixie.css?url';
import { el, font, type IFace, type IFrame, labels, sheet } from './kit.js';

interface ITube {
  lit: HTMLElement;
  was: HTMLElement;
}

const GLOW_OUT: KeyframeAnimationOptions = { duration: 480, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
const GLOW_IN: KeyframeAnimationOptions = { duration: 260, easing: 'ease-out' };

function tube(tubes: ITube[]): HTMLElement {
  const t = el('span', 'at-fx-tube');
  const ghost = el('span', 'at-fx-ghost');
  for (let d = 0; d < 10; d += 1) ghost.append(el('i', '', String(d)));
  const was = el('span', 'at-fx-was');
  const lit = el('span', 'at-fx-lit');
  t.append(ghost, was, lit);
  tubes.push({ lit, was });
  return t;
}

function group(text: string, tubes: ITube[], cls: string): HTMLElement {
  const g = el('span', cls);
  for (const ch of text) {
    if (/\d/u.test(ch)) g.append(tube(tubes));
    else if (ch === ':') {
      const colon = el('span', 'at-fx-neon');
      colon.append(el('i'), el('i'));
      g.append(colon);
    } else g.append(el('span', ch === ' ' ? 'at-fx-gap' : 'at-fx-nx-unit', ch.trim()));
  }
  return g;
}

export async function make(): Promise<IFace> {
  // The font is declared in the face's sheet, so it can only be awaited once the sheet is in.
  await sheet(href);
  await font('64px "Nixie One"');
  const root = el('div', 'at-fx at-fx-nixie');
  const text = labels();
  const row = el('div', 'at-fx-nx-row');
  const base = el('div', 'at-fx-nx-base');
  const bank = el('div', 'at-fx-nx-bank');
  bank.append(row, base);
  root.append(text.k, bank, text.meta);
  let shape = '';
  let tubes: ITube[] = [];

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      const next = (f.a + f.b).replace(/\d/gu, '0') + String(f.a.length);
      if (next !== shape) {
        shape = next;
        tubes = [];
        row.replaceChildren(group(f.a, tubes, 'at-fx-nx-grp'), group(f.b, tubes, 'at-fx-nx-grp at-fx-nx-sec'));
      }
      const digits = (f.a + f.b).replace(/\D/gu, '');
      tubes.forEach((t, i) => {
        const v = digits[i] ?? '0';
        const old = t.lit.textContent;
        if (old === v) return;
        t.lit.textContent = v;
        // The old cathode fades as the new one strikes, like a real tube's afterglow.
        if (f.still || !old) return;
        t.was.textContent = old;
        t.was.animate([{ opacity: 1 }, { opacity: 0 }], GLOW_OUT);
        t.lit.animate([{ opacity: 0.25 }, { opacity: 1 }], GLOW_IN);
      });
    },
  };
}
