import type { TFace } from '@awaketab/core';
import EmblaCarousel from 'embla-carousel';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import type { IToolCtx } from '../../ctx.js';
import { t } from '../../i18n.js';
import { el } from './kit.js';
import { stepFace } from './order.js';

// A sideways swipe (touch, pen, mouse drag or a two-finger trackpad swipe) on the clock steps to the next face.
// Embla drives a transparent three-slide strip over the dial: the neighbours' names ride in from the edges while
// the face follows the finger; on release past halfway the face changes and the strip jumps back to the middle.
export function mountSwipe(ctx: IToolCtx, step: (by: number) => Promise<void>): void {
  const { root, store } = ctx;
  const dial = root.querySelector<HTMLElement>('.at-dial');
  // The tool card inside an article always shows Ring, so it never swipes.
  if (!dial || dial.querySelector('.at-fsw') || root.classList.contains('at-tool-embed')) return;
  const rtl = getComputedStyle(root).direction === 'rtl';
  const view = el('div', 'at-fsw');
  view.setAttribute('aria-hidden', 'true');
  const strip = el('div', 'at-fsw-strip');
  const ghost = (): [HTMLElement, HTMLElement] => {
    const slide = el('div', 'at-fsw-slide');
    const card = el('div', 'at-fsw-ghost');
    slide.append(card);
    return [slide, card];
  };
  const [prev, prevCard] = ghost();
  const [next, nextCard] = ghost();
  strip.append(prev, el('div', 'at-fsw-slide'), next);
  view.append(strip);
  dial.append(view);

  const label = () => {
    const face = store.get().settings.face;
    for (const [card, by] of [
      [prevCard, -1],
      [nextCard, 1],
    ] as const) {
      const id: TFace = stepFace(face, by);
      if (card.dataset.id === id) continue;
      card.dataset.id = id;
      const icon = root.querySelector(`[data-pick="${id}"] .at-fg-name svg`)?.cloneNode(true);
      if (icon instanceof SVGElement) for (const a of ['width', 'height']) icon.setAttribute(a, '32');
      card.replaceChildren(...(icon ? [icon] : []), el('span', '', t(`tool.face.${id}`)));
    }
  };
  label();

  // Only the standard view swipes: never the ambient layer's small ring, the floating window or a gallery open.
  const api = EmblaCarousel(
    view,
    {
      startIndex: 1,
      duration: 32,
      direction: rtl ? 'rtl' : 'ltr',
      watchDrag: () =>
        store.get().ui.mode === 'standard' &&
        dial.ownerDocument === document &&
        !document.querySelector('dialog:modal'),
    },
    [WheelGesturesPlugin()],
  );
  const move = (off: number) => {
    const s = dial.style;
    if (off === 0) {
      s.removeProperty('--at-sw');
      s.removeProperty('--at-swa');
      return;
    }
    s.setProperty('--at-sw', (rtl ? -off : off).toFixed(3));
    s.setProperty('--at-swa', Math.min(1, Math.abs(off)).toFixed(3));
  };
  api.on('pointerDown', label);
  api.on('scroll', () => {
    move((api.scrollProgress() - 0.5) * 2);
  });
  api.on('settle', () => {
    const i = api.selectedScrollSnap();
    if (i === 1) {
      move(0);
      return;
    }
    dial.dataset.swap = '';
    const back = () => {
      api.scrollTo(1, true);
      move(0);
      label();
      dial.dataset.swap = 'in';
      window.setTimeout(() => {
        if (dial.dataset.swap === 'in') delete dial.dataset.swap;
      }, 700);
    };
    // A face that fails to load still gives the dial back.
    void step(i - 1).then(back, back);
  });
  store.subscribe(label);
}
