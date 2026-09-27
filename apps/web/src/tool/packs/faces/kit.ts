export interface IFrame {
  k: string;
  a: string;
  b: string;
  ma: string;
  mb: string;
  sec: number;
  p: number;
  st: string;
  inf: boolean;
  now: number;
  still: boolean;
  style: string;
}

export interface IFace {
  el: HTMLElement;
  paint: (f: IFrame) => void;
  stop?: () => void;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

export function put(n: Element, v: string): void {
  if (n.textContent !== v) n.textContent = v;
}

const sheets = new Map<string, Promise<void>>();

// A face mounts once its sheet is in, so a slow network never shows it unstyled. `mark` names a link boot.js may
// already have written before first paint.
export function sheet(href: string, mark = ''): Promise<void> {
  let ready = sheets.get(href);
  if (!ready) {
    ready = new Promise((resolve) => {
      if (mark && document.querySelector(`link[${mark}]`)) {
        resolve();
        return;
      }
      const link = el('link');
      link.rel = 'stylesheet';
      // Absolute, so the copy pip-window.ts clones into the about:blank floating window still resolves.
      link.href = new URL(href, location.href).href;
      if (mark) link.setAttribute(mark, '');
      link.onload = link.onerror = () => {
        resolve();
      };
      document.head.append(link);
    });
    sheets.set(href, ready);
  }
  return ready;
}

// Display fonts load with their face; it waits for them (at most 1.5 s) so the digits never change shape on screen.
export function font(spec: string): Promise<void> {
  const cap = new Promise<void>((resolve) => {
    setTimeout(resolve, 1500);
  });
  const done = (): void => undefined;
  return Promise.race([document.fonts.load(spec).then(done, done), cap]);
}

export function split(sec: number): [number, number, number, number] {
  const s = Math.max(0, Math.floor(sec));
  return [Math.floor(s / 86_400), Math.floor((s % 86_400) / 3600), Math.floor((s % 3600) / 60), s % 60];
}

// The kicker above a face and the meta line below it, in the same classes the built-in faces use.
export function labels(): { k: HTMLElement; meta: HTMLElement; paint: (f: IFrame) => void } {
  const k = el('div', 'at-kick');
  const meta = el('div', 'at-meta at-fx-meta');
  const ma = el('span');
  const mb = el('span', 'at-meta-b');
  meta.append(ma, ' ', mb);
  return {
    k,
    meta,
    paint: (f) => {
      put(k, f.k);
      put(ma, f.ma);
      put(mb, f.mb);
    },
  };
}
