import type { TAdviceCode, TLockState } from '@awaketab/core';
import type { IChangeEvent, IWakeLockHandle } from '@awaketab/wake';
import type { IExtApi, TPowerLevel } from './api';

/**
 * `IWakeLockHandle` over `chrome.power` (docs/04 §16, docs/10 §3). `requestKeepAwake` cannot fail
 * asynchronously the way `navigator.wakeLock` can, so the only states are `idle`, `requesting`, `held`,
 * `unsupported` (API missing — some Chromium forks) and `denied` (the call threw, e.g. enterprise policy).
 * `lost` and `fallback` never occur in the extension.
 */
export interface IPowerLock extends IWakeLockHandle {
  /** The level last passed to `requestKeepAwake`, or `null` while nothing is held. */
  readonly level: TPowerLevel | null;
  /** Re-issues the keep-awake request at the current level (onStartup, onInstalled, every alarm tick). */
  reassert(): void;
}

export function createPowerLock(opts: {
  power: IExtApi['power'];
  level: () => TPowerLevel;
  now?: () => number;
}): IPowerLock {
  const now = opts.now ?? Date.now;
  const listeners = new Set<(e: IChangeEvent) => void>();
  let state: TLockState = opts.power ? 'idle' : 'unsupported';
  let advice: TAdviceCode | null = opts.power ? null : 'unsupported_browser';
  let held: TPowerLevel | null = null;

  function go(to: TLockState, reason: IChangeEvent['reason'], nextAdvice: TAdviceCode | null = null) {
    const from = state;
    state = to;
    advice = nextAdvice;
    if (from === to) return;
    const event: IChangeEvent = { from, to, reason, at: now() };
    if (nextAdvice) event.advice = nextAdvice;
    for (const cb of listeners) cb(event);
  }

  function issue(): boolean {
    const level = opts.level();
    try {
      opts.power?.requestKeepAwake(level);
      held = level;
      return true;
    } catch {
      held = null;
      go('denied', 'denied', 'permissions_policy');
      return false;
    }
  }

  const handle: IPowerLock = {
    get state() {
      return state;
    },
    get supported() {
      return Boolean(opts.power);
    },
    usingFallback: false,
    get mode() {
      return state === 'held' ? ('native' as const) : null;
    },
    get advice() {
      return advice;
    },
    get level() {
      return held;
    },
    request() {
      if (!opts.power) {
        go('unsupported', 'unsupported', 'unsupported_browser');
        return Promise.resolve(state);
      }
      if (state === 'held') {
        // chrome.power keeps one request per extension; asking again replaces the level.
        issue();
        return Promise.resolve(state);
      }
      go('requesting', 'request');
      if (issue()) go('held', 'acquired');
      return Promise.resolve(state);
    },
    release() {
      if (state === 'held' || state === 'requesting') {
        try {
          opts.power?.releaseKeepAwake();
        } finally {
          held = null;
          go('idle', 'user_release');
        }
      }
      return Promise.resolve();
    },
    reassert() {
      if (state === 'held') issue();
    },
    on(_event: 'change' | 'error', cb: (e: never) => void) {
      if (_event !== 'change') return () => undefined;
      const fn = cb as (e: IChangeEvent) => void;
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    destroy() {
      void handle.release();
      listeners.clear();
    },
  };
  return handle;
}
