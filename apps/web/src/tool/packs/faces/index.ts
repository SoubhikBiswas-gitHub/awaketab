import type { ISettings, TFace } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import href from './faces.css?url';
import { showGallery as gallery } from './gallery.js';
import { type IFace, type IFrame, sheet } from './kit.js';
import { ART_FACES, stepFace } from './order.js';
import { FACES } from './registry.js';

declare const __AT_FACES__: string;

export interface IFaces {
  frame: (id: TFace, still?: boolean) => IFrame;
  css: Promise<void>;
  art: () => Promise<void>;
  set: (id: TFace) => Promise<void>;
}

const LIVE = new Set(['awake', 'fallback', 'starting', 'timesup']);
const SHIFT_MS = 60_000;
const SHIFT_PX = 2;
let faces: IFaces | undefined;
let swipe: Promise<void> | undefined;

function seconds(text: string): number {
  const days = /^(\d+)d\s*/u.exec(text);
  let s = 0;
  for (const n of text.slice(days?.[0].length ?? 0).split(':')) s = s * 60 + (Number(n) || 0);
  return Number(days?.[1] ?? 0) * 86_400 + s;
}

function analogStyle(s: ISettings): 'minimal' | 'luxe' {
  return (s.faceStyles as Partial<Record<TFace, string>> | undefined)?.analog === 'luxe' ? 'luxe' : 'minimal';
}

// The Bold, Horizon and Tide art: the same sheet boot.js links before first paint when one of them is saved.
const art = (): Promise<void> => sheet(__AT_FACES__, 'data-at-faces');

export function mountFaces(ctx: IToolCtx): IFaces {
  if (faces) return faces;
  const { root, store } = ctx;
  const html = document.documentElement;
  const host = root.querySelector<HTMLElement>('[data-face-host]');
  // The view writes every face's text, even hidden ones; Bold holds all the slots a face needs.
  const src = root.querySelector<HTMLElement>('.at-face-bold');
  const read = (k: string) => src?.querySelector(`[data-t="${k}"]`)?.textContent ?? '';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const css = sheet(href);
  let shown: TFace | '' = '';
  let face: IFace | null = null;
  let want: TFace | '' = '';
  let turn = 0;
  let pending = Promise.resolve();

  const frame = (id: TFace, still?: boolean): IFrame => {
    const s = store.get().settings;
    const a = read('a');
    const b = read('b');
    return {
      k: read('k'),
      a,
      b,
      ma: read('ma'),
      mb: read('mb'),
      sec: seconds(a + b),
      p: Number.parseFloat(root.style.getPropertyValue('--at-p')) || 0,
      st: root.dataset.status ?? 'ready',
      inf: root.hasAttribute('data-inf'),
      now: Date.now(),
      still: still ?? (motion.matches || s.reduceMotion === 'on'),
      style: id === 'analog' ? analogStyle(s) : '',
    };
  };

  const paint = () => {
    if (!face || !shown || !host) return;
    const f = frame(shown);
    host.toggleAttribute('data-still', f.still);
    face.paint(f);
  };

  // A face goes on screen only once it is ready (module, sheet, font), so the box never flashes empty or unstyled.
  const apply = (next: TFace): Promise<void> => {
    const mine = ++turn;
    const load = FACES[next];
    const ready: Promise<IFace | null> = load
      ? next === shown && face
        ? Promise.resolve(face)
        : Promise.all([css, load()]).then(([, m]) => m.make())
      : (ART_FACES.includes(next) ? art() : Promise.resolve()).then(() => null);
    return ready.then((f) => {
      if (mine !== turn) {
        if (f !== face) f?.stop?.();
        return;
      }
      if (f !== face) face?.stop?.();
      face = f;
      shown = f ? next : '';
      paint();
      if (f?.el.parentNode !== host) host?.replaceChildren(...(f ? [f.el] : []));
      if (next === 'ring') delete html.dataset.face;
      else html.dataset.face = next;
    });
  };

  const sync = () => {
    const s = store.get().settings;
    const style = analogStyle(s);
    for (const r of root.querySelectorAll<HTMLInputElement>('input[name="analogStyle"]')) r.checked = r.value === style;
    if (s.face === want) {
      paint();
      return;
    }
    want = s.face;
    pending = apply(s.face);
  };

  // Settings → Analog style and the gallery's style switch; the settings sheet only knows the fields it was built with.
  root.addEventListener('change', (e) => {
    const r = e.target;
    if (!(r instanceof HTMLInputElement) || r.name !== 'analogStyle') return;
    const cur = store.get().settings;
    const next: ISettings = { ...cur, faceStyles: { ...cur.faceStyles, analog: r.value } };
    ctx.storage.writeSettings(next);
    store.set({ settings: next });
  });

  // Repaint right after the view writes its text, and every second for the faces that show the wall clock.
  const mo = new MutationObserver(paint);
  if (src) mo.observe(src, { subtree: true, childList: true, characterData: true });
  mo.observe(root, { attributes: true, attributeFilter: ['data-status', 'data-units', 'data-final', 'data-inf'] });
  window.setInterval(paint, 1000);

  // Burn-in guard for a face that stays on screen: a 2 px shift each minute while the screen is kept awake.
  window.setInterval(() => {
    if (!host) return;
    const on = store.get().settings.ambient.pixelShift && LIVE.has(root.dataset.status ?? '');
    const px = () => String(Math.round(Math.random() * 2 * SHIFT_PX) - SHIFT_PX);
    host.style.translate = on ? `${px()}px ${px()}px` : '';
  }, SHIFT_MS);

  const set = (id: TFace): Promise<void> => {
    const cur = store.get().settings;
    if (cur.face !== id) {
      const next = { ...cur, face: id };
      ctx.storage.writeSettings(next);
      store.set({ settings: next });
    }
    return pending;
  };

  faces = { frame, css, art, set };
  store.subscribe(sync);
  sync();
  if (matchMedia('(any-pointer: coarse)').matches) armSwipe(ctx);
  return faces;
}

// Swiping (Embla, its own chunk) loads on touch screens with the pack, elsewhere with the first touch or sideways
// trackpad swipe on the clock (extras.ts), so a mouse-only visitor never downloads it.
export function armSwipe(ctx: IToolCtx): void {
  const f = mountFaces(ctx);
  swipe ??= Promise.all([f.css, import('./swipe.js')]).then(([, m]) => {
    m.mountSwipe(ctx, (by) => f.set(stepFace(ctx.store.get().settings.face, by)));
  });
}

// The face switch's Previous and Next, and the C key (Shift+C goes back).
export function faceAct(ctx: IToolCtx, name: string): void {
  void mountFaces(ctx).set(stepFace(ctx.store.get().settings.face, name === 'facePrev' ? -1 : 1));
}

export function showGallery(ctx: IToolCtx, pane: HTMLElement): Promise<void> {
  return gallery(ctx, mountFaces(ctx), pane);
}
