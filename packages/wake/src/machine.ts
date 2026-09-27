import type { TAdviceCode, TLockReason, TLockState } from './types.js';

type TMachineEvent =
  | { type: 'request'; hasApi: boolean }
  | { type: 'acquired' }
  | { type: 'fallback_ok' }
  | { type: 'fallback_blocked' }
  | { type: 'denied'; advice: TAdviceCode | null }
  | { type: 'unsupported'; advice: TAdviceCode }
  | { type: 'release_event'; hidden: boolean }
  | { type: 'user_release' }
  | { type: 'visible' }
  | { type: 'retry' }
  | { type: 'destroyed' };

interface IMachineGuards {
  reacquireOnVisible: boolean;
  fallback: boolean;
}

interface IMachineResult {
  state: TLockState;
  reason: TLockReason;
  advice?: TAdviceCode | null;
  silent?: boolean;
}

export function next(state: TLockState, event: TMachineEvent, guards: IMachineGuards): IMachineResult {
  if (event.type === 'destroyed') {
    return { state: 'idle', reason: 'destroyed' };
  }
  if (event.type === 'user_release') {
    return { state: 'idle', reason: 'user_release' };
  }
  switch (event.type) {
    case 'request':
      if (state === 'unsupported' && !guards.fallback) {
        return { state: 'unsupported', reason: 'unsupported', silent: true };
      }
      if (!event.hasApi && state === 'idle') {
        const result: IMachineResult = {
          state: 'unsupported',
          reason: 'unsupported',
        };
        if (!guards.fallback) result.advice = 'unsupported_browser';
        return result;
      }
      return { state: 'requesting', reason: 'request' };
    case 'acquired':
      return { state: 'held', reason: 'acquired' };
    case 'fallback_ok':
      return { state: 'fallback', reason: 'fallback_started' };
    case 'fallback_blocked':
      return { state: 'unsupported', reason: 'unsupported', advice: 'unsupported_browser' };
    case 'denied':
      return { state: 'denied', reason: 'denied', advice: event.advice };
    case 'unsupported':
      return { state: 'unsupported', reason: 'unsupported', advice: event.advice };
    case 'release_event': {
      const result: IMachineResult = {
        state: 'lost',
        reason: event.hidden ? 'released_hidden' : 'released_platform',
      };
      if (event.hidden) result.advice = 'hidden_document';
      return result;
    }
    case 'visible':
      if (state === 'lost' && !guards.reacquireOnVisible) {
        return { state: 'lost', reason: 'retry', silent: true };
      }
      return { state: 'requesting', reason: 'retry' };
    case 'retry':
      return { state: 'requesting', reason: 'retry' };
    default:
      return { state, reason: 'request', silent: true };
  }
}
