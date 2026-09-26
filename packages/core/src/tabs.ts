import type { TLockState } from '@awaketab/wake';
import { CHANNEL_NAME } from './constants.js';
import type { TPlanType, TSessionStatus } from './types.js';

export type TTabMessage =
  | { type: 'hello'; tabId: string; ts: number }
  | { type: 'lock'; tabId: string; ts: number; state: TLockState }
  | {
      type: 'state';
      tabId: string;
      ts: number;
      status: TSessionStatus;
      lock: TLockState;
      startedAt: number | null;
      // Timing snapshot so a mirror (the /pip popup) can count locally between messages.
      endsAt?: number | null;
      planType?: TPlanType;
      pausedMs?: number;
      pausedAt?: number | null;
      wall?: string | null;
    }
  | { type: 'intent'; tabId: string; ts: number; target: string; action: 'stop' | 'add'; ms?: number }
  | { type: 'bye'; tabId: string; ts: number };

export function createTabProtocol(opts: {
  channel?: BroadcastChannel | null;
  tabId: string;
  onPeerLock?: (msg: Extract<TTabMessage, { type: 'lock' }>) => void;
  onPeers?: (count: number) => void;
  onIntent?: (msg: Extract<TTabMessage, { type: 'intent' }>) => void;
  lockState?: () => TLockState;
  // Answer a peer's hello with a full state snapshot (docs/04 §14 rule 1).
  snapshot?: () => Extract<TTabMessage, { type: 'state' }> | null;
}) {
  const peers = new Map<string, number>();
  // `channel: null` disables the protocol (docs/04 §16: the extension worker has no peers); only an
  // omitted channel opens the shared BroadcastChannel.
  const ch =
    opts.channel !== undefined
      ? opts.channel
      : typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(CHANNEL_NAME)
        : null;

  function gc(now: number) {
    for (const [id, ts] of peers) {
      if (now - ts > 10_000) peers.delete(id);
    }
    opts.onPeers?.(peers.size);
  }

  const onMsg = (ev: MessageEvent<TTabMessage>) => {
    const msg = ev.data;
    if (msg.tabId === opts.tabId) return;
    peers.set(msg.tabId, msg.ts);
    gc(msg.ts);
    if (msg.type === 'hello') {
      const lock = opts.lockState?.() ?? 'idle';
      ch?.postMessage({
        type: 'lock',
        tabId: opts.tabId,
        ts: Date.now(),
        state: lock,
      } satisfies TTabMessage);
      const snap = opts.snapshot?.();
      if (snap) ch?.postMessage({ ...snap, tabId: opts.tabId, ts: Date.now() } satisfies TTabMessage);
    }
    if (msg.type === 'intent' && msg.target === opts.tabId) opts.onIntent?.(msg);
    if (msg.type === 'lock' && (msg.state === 'held' || msg.state === 'fallback')) {
      opts.onPeerLock?.(msg);
    }
    if (msg.type === 'bye') {
      peers.delete(msg.tabId);
      opts.onPeers?.(peers.size);
    }
  };

  ch?.addEventListener('message', onMsg);
  ch?.postMessage({ type: 'hello', tabId: opts.tabId, ts: Date.now() } satisfies TTabMessage);

  return {
    post(msg: TTabMessage) {
      ch?.postMessage({ ...msg, tabId: opts.tabId, ts: Date.now() });
    },
    peerCount: () => peers.size,
    dispose() {
      ch?.postMessage({ type: 'bye', tabId: opts.tabId, ts: Date.now() });
      ch?.removeEventListener('message', onMsg);
      if (opts.channel === undefined) ch?.close();
    },
  };
}
