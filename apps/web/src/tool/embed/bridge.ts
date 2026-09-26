import { isHostname, parsePageMessage, type TPageMessage, type TWidgetMessage } from './protocol.js';

/**
 * The embedding page's origin as the browser reports it — `location.ancestorOrigins[0]` (Chromium, Safari) or
 * the referrer (Firefox; the loader sets `referrerpolicy="strict-origin"`, so it is exactly the origin).
 * Neither can be forged by the embedding page, unlike the `host=` query param. `null` when unknown or opaque.
 */
export function parentOrigin(win: Window): string | null {
  if (win.parent === win) return null;
  // Firefox has no ancestorOrigins, although lib.dom types it as always present.
  const ancestors = (win.location as { ancestorOrigins?: DOMStringList }).ancestorOrigins;
  const raw = ancestors && ancestors.length > 0 ? ancestors.item(0) : win.document.referrer;
  if (!raw) return null;
  try {
    const origin = new URL(raw).origin;
    return /^https?:\/\//u.test(origin) ? origin : null;
  } catch {
    return null;
  }
}

export interface IBridge {
  /** The verified parent origin (null when not embedded or unknown). */
  readonly origin: string | null;
  /** Hostname of the verified parent origin — the only host used for the licence lookup. */
  readonly host: string | null;
  post(msg: TWidgetMessage): void;
  dispose(): void;
}

/**
 * Widget side of the postMessage API (docs/11 §3). Inbound commands are accepted only when (1) they come from
 * `window.parent`, (2) their origin equals the verified parent origin, and (3) that origin's hostname matches
 * the `host` the loader declared (when it declared one). Outbound messages target that exact origin, never `*`.
 */
export function createBridge(win: Window, declaredHost: string | null, onCommand: (msg: TPageMessage) => void): IBridge {
  const origin = parentOrigin(win);
  const originHost = origin ? new URL(origin).hostname : null;
  const trusted = origin !== null && isHostname(originHost) && (declaredHost === null || declaredHost === originHost);

  const listener = (e: MessageEvent) => {
    if (!trusted || e.source !== win.parent || e.origin !== origin) return;
    const msg = parsePageMessage(e.data);
    if (msg) onCommand(msg);
  };
  win.addEventListener('message', listener);

  return {
    origin: trusted ? origin : null,
    host: trusted ? originHost : null,
    post(msg) {
      if (trusted && origin) win.parent.postMessage(msg, origin);
    },
    dispose() {
      win.removeEventListener('message', listener);
    },
  };
}
