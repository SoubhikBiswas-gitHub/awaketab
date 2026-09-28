import type { TFace } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import { moreCss } from '../../ui/more-css.js';
import href from './gallery.css?url';
import type { IFaces } from './index.js';
import { el, type IFace, sheet } from './kit.js';
import { FACES } from './registry.js';

const KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);
let bound = false;

// The original four are cloned from the dial (same markup, same classes), so their thumbnails are the real thing.
function clone(root: HTMLElement, id: TFace): HTMLElement | null {
  const art = root.querySelector<HTMLElement>(`.at-dial > .at-face-${id}`);
  if (!art) return null;
  const copy = art.cloneNode(true) as HTMLElement;
  for (const n of [copy, ...copy.querySelectorAll('*')]) {
    for (const a of ['role', 'data-l', 'data-timer', 'id', 'aria-live']) n.removeAttribute(a);
    const k = n.getAttribute('data-t');
    if (k !== null) {
      n.removeAttribute('data-t');
      n.setAttribute('data-g', k);
    }
  }
  // A second SVG filter with the same id would draw nothing in some engines.
  copy.querySelector('filter')?.setAttribute('id', 'at-fg-glow');
  copy.querySelector('[filter]')?.setAttribute('filter', 'url(#at-fg-glow)');
  return copy;
}

function bind(ctx: IToolCtx, f: IFaces, d: HTMLElement): () => void {
  const { root, store } = ctx;
  const dlg = d.closest('dialog');
  const shown = () => !!dlg?.open && !d.hidden;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const picks = [...d.querySelectorAll<HTMLButtonElement>('[data-pick]')];
  const newer = new Map<TFace, IFace>();
  const built: HTMLElement[] = [];
  let timer = 0;

  const still = () => motion.matches || store.get().settings.reduceMotion === 'on';
  const text = (k: string) => root.querySelector(`.at-dial [data-t="${k}"]`)?.textContent ?? '';
  const paint = () => {
    const face = store.get().settings.face;
    for (const p of picks) p.setAttribute('aria-pressed', String(p.dataset.pick === face));
    for (const n of built)
      for (const s of n.querySelectorAll<HTMLElement>('[data-g]')) s.textContent = text(s.dataset.g ?? '');
    for (const [id, face] of newer) {
      const live = d.querySelector(`[data-thumb="${id}"]`)?.hasAttribute('data-live') ?? false;
      face.paint(f.frame(id, !live || still()));
    }
  };

  for (const p of picks) {
    const id = p.dataset.pick as TFace;
    const stage = p.querySelector<HTMLElement>('.at-fg-stage');
    if (!stage) continue;
    const load = FACES[id];
    if (!load) {
      const copy = clone(root, id);
      if (copy) {
        built.push(copy);
        stage.replaceChildren(copy);
      }
      continue;
    }
    void Promise.all([f.css, load()])
      .then(([, m]) => m.make())
      .then((face) => {
        const box = el('div', 'at-fg-host');
        box.append(face.el);
        newer.set(id, face);
        face.paint(f.frame(id, true));
        stage.replaceChildren(box);
      });
  }

  // A thumbnail plays while it is pointed at or focused; the rest stay still (and all of them under reduced motion).
  const live = (e: Event, on: boolean) => {
    const at = e.target;
    const thumb = at instanceof Element ? at.closest('[data-pick]')?.querySelector('[data-thumb]') : null;
    if (!thumb) return;
    thumb.toggleAttribute('data-live', on && !still());
    paint();
  };
  d.addEventListener('pointerover', (e) => {
    live(e, true);
  });
  d.addEventListener('pointerout', (e) => {
    live(e, false);
  });
  d.addEventListener('focusin', (e) => {
    live(e, true);
  });
  d.addEventListener('focusout', (e) => {
    live(e, false);
  });

  d.addEventListener('click', (e) => {
    const p = (e.target as Element).closest<HTMLElement>('[data-pick]');
    if (!p) return;
    // The sheet stays open: the clock behind it changes at once, so faces can be compared in place.
    void f.set(p.dataset.pick as TFace);
  });
  // Choosing an Analog style also makes Analog the face; index.ts stores the style itself.
  d.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'analogStyle') void f.set('analog');
  });

  // Arrow keys move between the tiles in reading order; up and down keep to the same column.
  d.addEventListener('keydown', (e) => {
    const cur = (e.target as Element).closest<HTMLButtonElement>('[data-pick]');
    if (!cur || !KEYS.has(e.key)) return;
    e.preventDefault();
    const i = picks.indexOf(cur);
    const back = getComputedStyle(d).direction === 'rtl';
    let to = i;
    if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = picks.length - 1;
    else if (e.key === 'ArrowRight') to = i + (back ? -1 : 1);
    else if (e.key === 'ArrowLeft') to = i + (back ? 1 : -1);
    else {
      const r = cur.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const down = e.key === 'ArrowDown';
      let best = Infinity;
      for (const [j, p] of picks.entries()) {
        const q = p.getBoundingClientRect();
        if (down ? q.top <= r.top + 4 : q.top >= r.top - 4) continue;
        const score = Math.abs(q.top - r.top) * 4 + Math.abs(q.left + q.width / 2 - x);
        if (score < best) {
          best = score;
          to = j;
        }
      }
    }
    picks[Math.min(picks.length - 1, Math.max(0, to))]?.focus();
  });

  // The miniatures tick only while the Face tab is on screen.
  const rest = () => {
    window.clearInterval(timer);
    for (const n of d.querySelectorAll('[data-live]')) n.removeAttribute('data-live');
    paint();
  };
  dlg?.addEventListener('close', rest);
  store.subscribe(() => {
    if (shown()) paint();
  });
  return () => {
    paint();
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      if (shown()) paint();
      else rest();
    }, 1000);
  };
}

let start: (() => void) | undefined;

// The Face tab of the Customize sheet: every face as a live miniature, grouped.
export function showGallery(ctx: IToolCtx, f: IFaces, pane: HTMLElement): Promise<void> {
  return Promise.all([sheet(href), f.art(), moreCss()]).then(() => {
    if (!bound) {
      bound = true;
      start = bind(ctx, f, pane);
    }
    start?.();
  });
}
