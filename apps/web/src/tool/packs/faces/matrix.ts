import href from './matrix.css?url';
import { el, type IFace, type IFrame, labels, sheet, svg } from './kit.js';
import { dotLayout, MATRIX_ROWS } from './matrix-font.js';

const R = 0.38;

function path(dots: Array<[number, number]>): string {
  let d = '';
  for (const [x, y] of dots)
    d += `M${String(x + 0.5 - R)} ${String(y + 0.5)}a${String(R)} ${String(R)} 0 1 0 ${String(2 * R)} 0a${String(R)} ${String(R)} 0 1 0 ${String(-2 * R)} 0`;
  return d;
}

export async function make(): Promise<IFace> {
  await sheet(href);
  const root = el('div', 'at-fx at-fx-matrix');
  const text = labels();
  const plate = el('div', 'at-fx-mx-plate');
  const art = svg('svg', { class: 'at-fx-mx-art', 'aria-hidden': 'true', focusable: 'false' });
  const defs = svg('defs');
  const pattern = svg('pattern', { id: 'at-fx-mx-dots', width: 1, height: 1, patternUnits: 'userSpaceOnUse' });
  pattern.append(svg('circle', { class: 'at-fx-mx-off', cx: 0.5, cy: 0.5, r: R }));
  defs.append(pattern);
  const grid = svg('rect', { x: 0, y: 0, height: MATRIX_ROWS, fill: 'url(#at-fx-mx-dots)' });
  const lit = svg('path', { class: 'at-fx-mx-on' });
  const dim = svg('path', { class: 'at-fx-mx-on at-fx-mx-dim' });
  art.append(defs, grid, dim, lit);
  plate.append(art);
  root.append(text.k, plate, text.meta);
  let key = '';

  return {
    el: root,
    paint: (f: IFrame) => {
      text.paint(f);
      if (key === f.a + f.b) return;
      key = f.a + f.b;
      const dots = dotLayout(f.a, f.b);
      art.setAttribute('viewBox', `0 0 ${String(dots.cols)} ${String(MATRIX_ROWS)}`);
      grid.setAttribute('width', String(dots.cols));
      lit.setAttribute('d', path(dots.on));
      dim.setAttribute('d', path(dots.dim));
    },
  };
}
