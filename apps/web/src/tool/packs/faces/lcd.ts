import href from './lcd.css?url';
import { el, font, type IFace, type IFrame, labels, put, sheet } from './kit.js';
import { ghost } from './lcd-text.js';

function pair(cls: string): [HTMLElement, HTMLElement, HTMLElement] {
  const box = el('span', cls);
  const off = el('span', 'at-fx-lcd-off');
  const on = el('span', 'at-fx-lcd-on');
  box.append(off, on);
  return [box, off, on];
}

export async function make(): Promise<IFace> {
  // The font is declared in the face's sheet, so it can only be awaited once the sheet is in.
  await sheet(href);
  await font('italic 64px "DSEG7 Classic"');
  const root = el('div', 'at-fx at-fx-lcd');
  const text = labels();
  const panel = el('div', 'at-fx-lcd-panel');
  const read = el('div', 'at-fx-lcd-read');
  const [main, aOff, aOn] = pair('at-fx-lcd-a');
  const [tail, bOff, bOn] = pair('at-fx-lcd-b');
  read.append(main, tail);
  panel.append(text.k, read);
  root.append(panel, text.meta);

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      const a = f.a.replace(/ /gu, '!');
      put(aOn, a);
      put(aOff, ghost(f.a));
      put(bOn, f.b);
      put(bOff, ghost(f.b));
    },
  };
}
