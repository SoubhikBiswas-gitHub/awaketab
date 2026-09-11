import { classifyDenial, isTransientAdvice } from './classify.js';
import { createEmitter } from './emitter.js';
import { createFallbackVideo, type IFallbackHandle } from './fallback.js';
import type {
  TAdviceCode,
  IChangeEvent,
  IErrorEvent,
  TLockState,
  IWakeLockHandle,
  IWakeLockLike,
  IWakeLockOptions,
  IWakeLockSentinelLike,
} from './types.js';

export type {
  TAdviceCode,
  IChangeEvent,
  IErrorEvent,
  TLockReason,
  TLockState,
  IRetryOptions,
  IWakeLockHandle,
  IWakeLockLike,
  IWakeLockOptions,
  IWakeLockSentinelLike,
} from './types.js';
export { classifyDenial } from './classify.js';
export { createEmitter } from './emitter.js';
export { next } from './machine.js';

const DEFAULT_RETRY = { attempts: 3, baseMs: 500 };

export const isWakeLockSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  'wakeLock' in navigator &&
  (typeof window === 'undefined' || window.isSecureContext);

function inertHandle(): IWakeLockHandle {
  return {
    get state() {
      return 'idle' as const;
    },
    get supported() {
      return false;
    },
    get usingFallback() {
      return false;
    },
    get mode() {
      return null;
    },
    get advice() {
      return null;
    },
    request() {
      return Promise.resolve('idle' as const);
    },
    async release() {},
    on() {
      return () => undefined;
    },
    destroy() {},
  };
}

function resolveApi(opts: IWakeLockOptions): IWakeLockLike | null | undefined {
  if (opts.wakeLock !== undefined) return opts.wakeLock;
  const nav = opts.navigatorLike as { wakeLock?: IWakeLockLike } | undefined;
  if (nav && 'wakeLock' in nav) return nav.wakeLock ?? null;
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    return navigator.wakeLock;
  }
  return undefined;
}

function uaOf(opts: IWakeLockOptions): string {
  const nav = opts.navigatorLike as { userAgent?: string } | undefined;
  return nav?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
}

export function createWakeLock(options: IWakeLockOptions = {}): IWakeLockHandle {
  if (typeof window === 'undefined' && !options.document && !options.documentLike) {
    return inertHandle();
  }

  const doc = options.documentLike ?? options.document ?? (typeof document !== 'undefined' ? document : undefined);
  const fallbackMode = options.fallback ?? 'video';
  const reacquire = options.reacquireOnVisible !== false;
  const retryOpt = options.retry === false ? { attempts: 0, baseMs: 0 } : { ...DEFAULT_RETRY, ...options.retry };
  const nudgeMs = options.nudgeIntervalMs ?? 20_000;
  const api = resolveApi(options);
  const ua = uaOf(options);
  const emitter = createEmitter<{ change: IChangeEvent; error: IErrorEvent }>();

  let state: TLockState = api ? 'idle' : 'unsupported';
  let mode: 'native' | 'video' | null = null;
  let advice: TAdviceCode | null = api ? null : 'unsupported_browser';
  let sentinel: IWakeLockSentinelLike | null = null;
  let video: IFallbackHandle | null = null;
  const flags: { destroyed: boolean; cancelled: boolean; releasing: boolean } = {
    destroyed: false,
    cancelled: false,
    releasing: false,
  };
  let attempt = 0;
  let inflight: Promise<TLockState> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let visibleReleases: number[] = [];
  const onRelease = () => {
    if (flags.releasing || flags.destroyed) return;
    const hidden = doc?.visibilityState === 'hidden';
    transition(hidden ? 'lost' : 'lost', hidden ? 'released_hidden' : 'released_platform', hidden ? 'hidden_document' : advice);
    sentinel = null;
    if (!hidden) {
      const now = Date.now();
      visibleReleases = visibleReleases.filter((t) => now - t < 10_000);
      visibleReleases.push(now);
      if (visibleReleases.length >= 3) {
        transition('denied', 'denied', 'battery_saver');
        scheduleRetry();
        return;
      }
      void nativeRequest('retry');
    }
  };

  const onVis = () => {
    if (flags.destroyed) return;
    const hidden = doc?.visibilityState === 'hidden';
    if (hidden) {
      if (state === 'fallback') {
        video?.pause();
        video?.stopNudge();
        transition('lost', 'released_hidden', 'hidden_document');
      }
      return;
    }
    if (state === 'lost' && reacquire) {
      if (mode === 'video') void fallbackRequest('retry');
      else void nativeRequest('retry');
    } else if (state === 'denied' && advice === 'hidden_document') {
      attempt = 0;
      void nativeRequest('retry');
    }
  };

  const onFs = () => {
    if (flags.destroyed) return;
    if (state === 'held') {
      void nativeRequest('retry');
    } else if (state === 'denied') {
      void nativeRequest('retry');
    }
  };

  if (doc) {
    doc.addEventListener('visibilitychange', onVis);
    doc.addEventListener('fullscreenchange', onFs);
  }

  function transition(
    to: TLockState,
    reason: IChangeEvent['reason'],
    nextAdvice?: TAdviceCode | null,
    extra?: { error?: unknown; silent?: boolean },
  ) {
    const from = state;
    state = to;
    if (nextAdvice !== undefined) advice = nextAdvice;
    if (to === 'held' || to === 'fallback') advice = null;
    if (!extra?.silent && from !== to) {
      const event: IChangeEvent = { from, to, reason, at: Date.now() };
      if (advice) event.advice = advice;
      if (extra?.error !== undefined) event.error = extra.error;
      emitter.emit('change', event);
    }
  }

  function clearRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleRetry() {
    if (flags.cancelled || flags.destroyed) return;
    if (retryOpt.attempts <= 0 || attempt + 1 >= retryOpt.attempts) return;
    if (doc?.visibilityState === 'hidden') return;
    const delay = retryOpt.baseMs * 2 ** attempt;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      attempt += 1;
      void nativeRequest('retry');
    }, delay);
  }

  function inIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  function secure(): boolean {
    if (typeof window === 'undefined') return true;
    return window.isSecureContext;
  }

  function abortRequested(): boolean {
    return flags.cancelled || flags.destroyed;
  }

  async function nativeRequest(reason: 'request' | 'retry'): Promise<TLockState> {
    if (abortRequested()) return 'idle';
    if (!api) return fallbackRequest(reason);
    clearRetry();
    flags.cancelled = false;
    transition('requesting', reason);
    try {
      const next = await api.request('screen');
      if (abortRequested()) {
        await next.release().catch(() => undefined);
        if (!flags.destroyed) transition('idle', 'user_release');
        return state;
      }
      sentinel = next;
      next.addEventListener('release', onRelease);
      mode = 'native';
      attempt = 0;
      transition('held', 'acquired', null);
      return state;
    } catch (error) {
      if (abortRequested()) return 'idle';
      const name = error instanceof Error ? error.name : '';
      if (name === 'SecurityError') {
        transition('unsupported', 'unsupported', 'insecure_context', { error });
        emitter.emit('error', { error, at: Date.now(), state, advice });
        return state;
      }
      const code = classifyDenial(error, {
        visible: doc?.visibilityState !== 'hidden',
        secure: secure(),
        inIframe: inIframe(),
        ua,
      });
      transition('denied', 'denied', code, { error });
      emitter.emit('error', { error, at: Date.now(), state, advice: code });
      if (isTransientAdvice(code) && doc?.visibilityState !== 'hidden' && code !== 'hidden_document') {
        scheduleRetry();
      }
      return state;
    }
  }

  async function fallbackRequest(reason: 'request' | 'retry'): Promise<TLockState> {
    if (abortRequested()) return 'idle';
    if (fallbackMode !== 'video' || !doc) {
      transition('unsupported', 'unsupported', secure() ? 'unsupported_browser' : 'insecure_context');
      emitter.emit('error', { error: new Error('unsupported'), at: Date.now(), state, advice });
      return state;
    }
    transition('requesting', reason);
    if (!video) video = createFallbackVideo(doc, options.videoSources);
    try {
      const play = video.el.play();
      await play;
      if (abortRequested()) {
        video.pause();
        transition('idle', 'user_release');
        return state;
      }
      if (video.el.paused) {
        throw new DOMException('paused', 'NotAllowedError');
      }
      mode = 'video';
      video.startNudge(nudgeMs);
      transition('fallback', 'fallback_started', null);
      return state;
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      video.remove();
      video = null;
      const code = name === 'NotAllowedError' ? 'unsupported_browser' : 'unsupported_browser';
      transition('unsupported', 'unsupported', name === 'NotAllowedError' ? 'unsupported_browser' : code, { error });
      emitter.emit('error', { error, at: Date.now(), state, advice });
      return state;
    }
  }

  const handle: IWakeLockHandle = {
    get state() {
      return state;
    },
    get supported() {
      return Boolean(api) && secure();
    },
    get usingFallback() {
      return state === 'fallback';
    },
    get mode() {
      return mode;
    },
    get advice() {
      return advice;
    },
    request() {
      if (flags.destroyed) return Promise.resolve('idle' as const);
      flags.cancelled = false;
      if (inflight && state === 'requesting') return inflight;
      attempt = 0;
      clearRetry();
      inflight = (api ? nativeRequest('request') : fallbackRequest('request')).finally(() => {
        inflight = null;
      });
      return inflight;
    },
    async release() {
      if (flags.destroyed) return;
      flags.cancelled = true;
      flags.releasing = true;
      clearRetry();
      if (sentinel) {
        sentinel.removeEventListener('release', onRelease);
        await sentinel.release().catch(() => undefined);
        sentinel = null;
      }
      video?.pause();
      video?.stopNudge();
      if (state === 'fallback') {
        video?.remove();
        video = null;
      }
      // keep denied/unsupported so the pill can show the fix (docs/04 §3 row 20 is user idle only from held/lost)
      if (state !== 'idle' && state !== 'denied' && state !== 'unsupported') {
        transition('idle', 'user_release');
      }
      flags.releasing = false;
    },
    on(event, cb) {
      if (event === 'change') return emitter.on('change', cb as (e: IChangeEvent) => void);
      return emitter.on('error', cb as (e: IErrorEvent) => void);
    },
    destroy() {
      flags.destroyed = true;
      flags.cancelled = true;
      clearRetry();
      void handle.release();
      video?.remove();
      video = null;
      if (doc) {
        doc.removeEventListener('visibilitychange', onVis);
        doc.removeEventListener('fullscreenchange', onFs);
      }
      emitter.clear();
      state = 'idle';
      mode = null;
    },
  };

  if (!api) {
    advice = secure() ? 'unsupported_browser' : 'insecure_context';
    state = 'unsupported';
  }

  return handle;
}
