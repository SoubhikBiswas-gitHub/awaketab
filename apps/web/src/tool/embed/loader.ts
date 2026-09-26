/**
 * AwakeTab Embed loader — the one script tag a site pastes (docs/11 §1). Built by scripts/embed-loader.mjs into
 * `public/embed.js` (IIFE, ≤ 3 KB gz, no dependencies). It replaces its own `<script>` with a lazy, sandboxed
 * iframe of `/embed/cook` that carries `allow="screen-wake-lock"`, and exposes `window.AwakeTabEmbed` for the
 * postMessage API (docs/11 §3). Origin checks: messages are accepted only from an iframe this loader created
 * *and* only when their origin is the loader's own origin; commands are posted with that origin as the target.
 */
import {
  EMBED_BOX,
  EMBED_PATH,
  embedQuery,
  optionsFromDataset,
  parsePageMessage,
  parseWidgetMessage,
  type IEmbedState,
  type TEmbedTheme,
  type TPageMessage,
} from './protocol.js';

/**
 * `allow-popups-to-escape-sandbox` on top of docs/11 §7's three tokens: the attribution and "how to fix" links
 * open awaketab.com in a new tab, which would otherwise inherit this sandbox (no forms → no checkout).
 * Decision under docs/19 C4; it widens nothing for the host page. PROPOSED — add to 00-conventions.md.
 */
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export type TEmbedEvent = 'ready' | 'state';

export interface IEmbedEventDetail extends Partial<IEmbedState> {
  frame: HTMLIFrameElement;
  version?: string;
}

export interface IAwakeTabEmbed {
  readonly version: string;
  /** Subscribe to `ready` or `state` (every lock/status change); returns an unsubscribe function. */
  on(event: TEmbedEvent, cb: (detail: IEmbedEventDetail) => void): () => void;
  /** Start every widget on the page. Call it from a user gesture (the video fallback needs one). */
  start(opts?: { preset?: string; ms?: number; until?: string }): void;
  stop(): void;
  setTheme(theme: TEmbedTheme): void;
}

interface IFrameRecord {
  el: HTMLIFrameElement;
  origin: string;
  /** The box reserved before load; resize requests never go below it (no layout shift on the host page). */
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

/** Replaces one loader `<script>` with the widget iframe. Returns the iframe, or null for an unusable tag. */
export function mountFrame(
  script: HTMLScriptElement,
  registry: IEmbedRegistry,
  titles: Record<string, string>,
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
  frame.title = titles[opts.lang] ?? titles.en ?? 'Keep screen awake';
  frame.setAttribute('allow', 'screen-wake-lock');
  frame.setAttribute('loading', 'lazy');
  frame.setAttribute('referrerpolicy', 'strict-origin');
  frame.setAttribute('sandbox', EMBED_SANDBOX);
  frame.style.cssText = `width:${box.width};max-width:100%;height:${String(box.height)}px;border:0;border-radius:12px;color-scheme:light dark;display:block`;
  const parent = script.parentNode;
  if (parent && parent !== doc.head) parent.replaceChild(frame, script);
  else {
    // A tag placed in <head> (some CMS "code injection" fields) cannot hold an iframe: append to <body>.
    script.remove();
    doc.body.append(frame);
  }
  registry.add(frame, origin, box.height);
  return frame;
}

/** Entry point of the built loader. Idempotent across several tags on one page. */
export function install(win: Window, current: HTMLScriptElement | null, titles: Record<string, string>): void {
  const w = win as TWindow;
  w.AwakeTabEmbed ??= createRegistry(win);
  const registry = w.AwakeTabEmbed;
  const tags = current
    ? [current]
    : [...win.document.querySelectorAll<HTMLScriptElement>('script[src*="/embed.js"]')];
  const run = () => {
    for (const tag of tags) mountFrame(tag, registry, titles);
  };
  // An async tag in <head> can run before <body> exists.
  if ((win.document.body as HTMLElement | null) !== null) run();
  else win.document.addEventListener('DOMContentLoaded', run, { once: true });
}
