import {
  EMBED_BOX,
  EMBED_CREDIT_CLASS,
  EMBED_CREDIT_LINK_STYLE,
  EMBED_CREDIT_STYLE,
  EMBED_CREDIT_URL,
  EMBED_PATH,
  embedQuery,
  isHostname,
  optionsFromDataset,
  parsePageMessage,
  parseWidgetMessage,
  reservedHeight,
  type IEmbedState,
  type TEmbedTheme,
  type TPageMessage,
} from './protocol.js';

export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export interface ILoaderStrings {
  titles: Record<string, string>;
  credits: Record<string, string>;
}

type TEmbedEvent = 'ready' | 'state';

interface IEmbedEventDetail extends Partial<IEmbedState> {
  frame: HTMLIFrameElement;
  version?: string;
}

interface IAwakeTabEmbed {
  readonly version: string;
  on(event: TEmbedEvent, cb: (detail: IEmbedEventDetail) => void): () => void;
  start(opts?: { preset?: string; ms?: number; until?: string }): void;
  stop(): void;
  setTheme(theme: TEmbedTheme): void;
}

interface IFrameRecord {
  el: HTMLIFrameElement;
  origin: string;
  minHeight: number;
  ready: boolean;
  queue: TPageMessage[];
}

interface IEmbedRegistry extends IAwakeTabEmbed {
  add(el: HTMLIFrameElement, origin: string, minHeight: number): void;
}

type TWindow = Window & { AwakeTabEmbed?: IEmbedRegistry };

export function createRegistry(win: Window): IEmbedRegistry {
  const frames: IFrameRecord[] = [];
  const listeners: Record<TEmbedEvent, Set<(d: IEmbedEventDetail) => void>> = { ready: new Set(), state: new Set() };

  const post = (rec: IFrameRecord, msg: TPageMessage) => {
    if (!rec.ready) {
      rec.queue.push(msg);
      return;
    }
    rec.el.contentWindow?.postMessage(msg, rec.origin);
  };
  const broadcast = (msg: unknown) => {
    // Re-validate what the page asked for; malformed commands are dropped here, and again in the widget.
    const clean = parsePageMessage(msg);
    if (clean) for (const rec of frames) post(rec, clean);
  };

  win.addEventListener('message', (e: MessageEvent) => {
    const rec = frames.find((f) => f.el.contentWindow !== null && f.el.contentWindow === e.source);
    if (!rec || e.origin !== rec.origin) return;
    const msg = parseWidgetMessage(e.data);
    if (!msg) return;
    if (msg.type === 'awaketab:resize') {
      rec.el.style.height = `${String(Math.max(rec.minHeight, msg.height))}px`;
      return;
    }
    if (msg.type === 'awaketab:ready') {
      rec.ready = true;
      for (const queued of rec.queue.splice(0)) post(rec, queued);
      for (const cb of listeners.ready) cb({ frame: rec.el, version: msg.version });
      return;
    }
    const { type: _type, ...state } = msg;
    for (const cb of listeners.state) cb({ frame: rec.el, ...state });
  });

  return {
    version: '1',
    on(event, cb) {
      const set = listeners[event];
      set.add(cb);
      return () => {
        set.delete(cb);
      };
    },
    start(opts = {}) {
      broadcast({ type: 'awaketab:start', ...opts });
    },
    stop() {
      broadcast({ type: 'awaketab:stop' });
    },
    setTheme(theme) {
      broadcast({ type: 'awaketab:theme', theme });
    },
    add(el, origin, minHeight) {
      frames.push({ el, origin, minHeight, ready: false, queue: [] });
    },
  };
}

function mountCredit(frame: HTMLIFrameElement, text: string): HTMLElement {
  const doc = frame.ownerDocument;
  const box = doc.createElement('div');
  box.className = EMBED_CREDIT_CLASS;
  box.style.cssText = EMBED_CREDIT_STYLE;
  const link = doc.createElement('a');
  link.href = EMBED_CREDIT_URL;
  link.rel = 'nofollow';
  link.style.cssText = EMBED_CREDIT_LINK_STYLE;
  link.textContent = text;
  box.append(link);
  frame.after(box);
  return box;
}

export function keepsCredit(
  win: Window,
  origin: string,
  cache: Record<string, Promise<boolean>> = {},
): Promise<boolean> {
  const host = win.location.hostname;
  if (!isHostname(host)) return Promise.resolve(true);
  cache[origin] ??= win
    .fetch(`${origin}/api/embed/config?domain=${encodeURIComponent(host)}`)
    .then((res) => (res.ok ? (res.json() as Promise<{ licensed?: unknown; attribution?: unknown } | null>) : null))
    .then((d) => !(d?.licensed === true && d.attribution === false))
    .catch(() => true);
  return cache[origin];
}

export function mountFrame(
  script: HTMLScriptElement,
  registry: IEmbedRegistry,
  strings: ILoaderStrings,
): HTMLIFrameElement | null {
  const doc = script.ownerDocument;
  let origin: string;
  try {
    origin = new URL(script.src).origin;
  } catch {
    return null;
  }
  if (!/^https?:\/\//.test(origin)) return null;
  const opts = optionsFromDataset(script.dataset, doc.documentElement.lang);
  const box = EMBED_BOX[opts.size];
  const frame = doc.createElement('iframe');
  frame.src = `${origin}${EMBED_PATH}?${embedQuery(opts, doc.location.hostname)}`;
  // `en` is always present (the build fails without it).
  frame.title = strings.titles[opts.lang] ?? (strings.titles.en as string);
  frame.setAttribute('allow', 'screen-wake-lock');
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('referrerpolicy', 'strict-origin');
  frame.setAttribute('sandbox', EMBED_SANDBOX);
  frame.style.cssText = `width:${box.width};max-width:100%;height:${String(box.height)}px;border:0;border-radius:${String(box.radius)}px;color-scheme:light dark;display:block`;
  const parent = script.parentNode;
  if (parent && parent !== doc.head) parent.replaceChild(frame, script);
  else {
    // A tag placed in <head> (some CMS "code injection" fields) cannot hold an iframe: append to <body>.
    script.remove();
    doc.body.append(frame);
  }
  // A narrow container (a sidebar, a phone column) reserves the taller layout's box now, not after load.
  const height = reservedHeight(opts, frame.offsetWidth);
  frame.style.height = `${String(height)}px`;
  mountCredit(frame, strings.credits[opts.lang] ?? (strings.credits.en as string));
  registry.add(frame, origin, height);
  return frame;
}

export function install(win: Window, current: HTMLScriptElement | null, strings: ILoaderStrings): void {
  const w = win as TWindow;
  w.AwakeTabEmbed ??= createRegistry(win);
  const registry = w.AwakeTabEmbed;
  const tags = current ? [current] : [...win.document.querySelectorAll<HTMLScriptElement>('script[src*="/embed.js"]')];
  const lookups: Record<string, Promise<boolean>> = {};
  const run = () => {
    for (const tag of tags) {
      const frame = mountFrame(tag, registry, strings);
      const credit = frame?.nextElementSibling;
      if (!frame || !credit) continue;
      void keepsCredit(win, new URL(frame.src).origin, lookups).then((keep) => {
        if (!keep) credit.remove();
      });
    }
  };
  // An async tag in <head> can run before <body> exists.
  if ((win.document.body as HTMLElement | null) !== null) run();
  else win.document.addEventListener('DOMContentLoaded', run, { once: true });
}
