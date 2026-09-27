import type { ISettings, TFace } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import href from './faces.css?url';
import { type IFace, type IFrame, sheet } from './kit.js';

type TLoad = () => Promise<{ make: () => Promise<IFace> }>;

// Each face is its own chunk; only the chosen one downloads.
const FACES: Partial<Record<TFace, TLoad>> = {
  flip: () => import('./flip.js'),
  rolling: () => import('./rolling.js'),
  analog: () => import('./analog.js'),
  rings: () => import('./rings.js'),
  word: () => import('./word.js'),
  nixie: () => import('./nixie.js'),
  lcd: () => import('./lcd.js'),
  matrix: () => import('./matrix.js'),
};

const LIVE = new Set(['awake', 'fallback', 'starting', 'timesup']);
const SHIFT_MS = 60_000;
const SHIFT_PX = 2;

function seconds(text: string): number {
  const days = /^(\d+)d\s*/u.exec(text);
  let s = 0;
  for (const n of text.slice(days?.[0].length ?? 0).split(':')) s = s * 60 + (Number(n) || 0);
  return Number(days?.[1] ?? 0) * 86_400 + s;
}

function analogStyle(s: ISettings): 'minimal' | 'luxe' {
  return (s.faceStyles as Partial<Record<TFace, string>> | undefined)?.analog === 'luxe' ? 'luxe' : 'minimal';
}

export function mountFaces(ctx: IToolCtx): void {
  const { root, store } = ctx;
  const host = root.querySelector<HTMLElement>('[data-face-host]');
  // The view writes every face's text, even hidden ones; Bold holds all the slots a face needs.
  const src = root.querySelector<HTMLElement>('.at-face-bold');
  if (!host || !src) return;
  const read = (k: string) => src.querySelector(`[data-t="${k}"]`)?.textContent ?? '';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const css = sheet(href);
  let id: TFace | '' = '';
  let face: IFace | null = null;
  let turn = 0;

  const frame = (): IFrame => {
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
      still: motion.matches || s.reduceMotion === 'on',
      style: id === 'analog' ? analogStyle(s) : '',
    };
  };

  const paint = () => {
    if (!face) return;
    const f = frame();
    host.toggleAttribute('data-still', f.still);
    face.paint(f);
  };

  const sync = () => {
    const s = store.get().settings;
    const next = FACES[s.face] ? s.face : '';
    for (const n of root.querySelectorAll('[data-faces]')) n.setAttribute('aria-selected', String(!!next));
    for (const n of root.querySelectorAll<HTMLElement>('.at-fm-item'))
      n.setAttribute('aria-pressed', String(n.dataset.face === s.face));
    const style = analogStyle(s);
    for (const r of root.querySelectorAll<HTMLInputElement>('input[name="analogStyle"]')) r.checked = r.value === style;
    if (next === id) {
      paint();
      return;
    }
    id = next;
    const mine = ++turn;
    face?.stop?.();
    face = null;
    host.replaceChildren();
    const load = next ? FACES[next] : undefined;
    if (!load) return;
    void Promise.all([css, load()])
      .then(([, m]) => m.make())
      .then((f) => {
        if (mine !== turn) {
          f.stop?.();
          return;
        }
        face = f;
        paint();
        host.append(f.el);
      });
  };

  // Settings → Analog style; the settings sheet itself only knows the fields it was built with.
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
  mo.observe(src, { subtree: true, childList: true, characterData: true });
  mo.observe(root, { attributes: true, attributeFilter: ['data-status', 'data-units', 'data-final', 'data-inf'] });
  window.setInterval(paint, 1000);

  // Burn-in guard for a face that stays on screen: a 2 px shift each minute while the screen is kept awake.
  window.setInterval(() => {
    const on = store.get().settings.ambient.pixelShift && LIVE.has(root.dataset.status ?? '');
    const px = () => String(Math.round(Math.random() * 2 * SHIFT_PX) - SHIFT_PX);
    host.style.translate = on ? `${px()}px ${px()}px` : '';
  }, SHIFT_MS);

  store.subscribe(sync);
}
