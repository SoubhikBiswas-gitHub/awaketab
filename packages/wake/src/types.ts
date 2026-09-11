export type TLockState =
  | 'idle'
  | 'requesting'
  | 'held'
  | 'lost'
  | 'denied'
  | 'unsupported'
  | 'fallback';

export type TLockReason =
  | 'request'
  | 'acquired'
  | 'fallback_started'
  | 'released_hidden'
  | 'released_platform'
  | 'denied'
  | 'unsupported'
  | 'user_release'
  | 'retry'
  | 'destroyed';

export type TAdviceCode =
  | 'battery_saver'
  | 'low_power_ios'
  | 'hidden_document'
  | 'permissions_policy'
  | 'insecure_context'
  | 'unsupported_browser'
  | 'ios_safari_old'
  | 'firefox_old'
  | 'iframe_no_allow';

export interface IWakeLockSentinelLike {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', cb: () => void): void;
  removeEventListener(type: 'release', cb: () => void): void;
}

export interface IWakeLockLike {
  request(type: 'screen'): Promise<IWakeLockSentinelLike>;
}

export interface IRetryOptions {
  attempts: number;
  baseMs: number;
}

export interface IWakeLockOptions {
  fallback?: 'video' | 'none';
  videoSources?: { webm?: string; mp4?: string };
  reacquireOnVisible?: boolean;
  retry?: IRetryOptions | false;
  nudgeIntervalMs?: number;
  navigatorLike?: Pick<Navigator, 'wakeLock' | 'userAgent'> | { wakeLock?: IWakeLockLike; userAgent?: string };
  documentLike?: Document;
  wakeLock?: IWakeLockLike | null;
  document?: Document;
  isIOS?: boolean;
  debug?: boolean | ((msg: string, data?: unknown) => void);
}

export interface IChangeEvent {
  from: TLockState;
  to: TLockState;
  reason: TLockReason;
  advice?: TAdviceCode;
  error?: unknown;
  at: number;
}

export interface IErrorEvent {
  error: unknown;
  at: number;
  state?: TLockState;
  advice?: TAdviceCode | null;
}

export interface IWakeLockHandle {
  readonly state: TLockState;
  readonly supported: boolean;
  readonly usingFallback: boolean;
  readonly mode: 'native' | 'video' | null;
  readonly advice: TAdviceCode | null;
  request(): Promise<TLockState>;
  release(): Promise<void>;
  on(event: 'change', cb: (e: IChangeEvent) => void): () => void;
  on(event: 'error', cb: (e: IErrorEvent) => void): () => void;
  destroy(): void;
}
