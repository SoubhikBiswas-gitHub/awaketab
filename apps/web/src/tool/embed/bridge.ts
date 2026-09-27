import { isHostname, parsePageMessage, type TPageMessage, type TWidgetMessage } from './protocol.js';

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
  readonly origin: string | null;
  readonly host: string | null;
  post(msg: TWidgetMessage): void;
  dispose(): void;
}

export function createBridge(
  win: Window,
  declaredHost: string | null,
  onCommand: (msg: TPageMessage) => void,
): IBridge {
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
