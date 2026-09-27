import type { TAdviceCode, TLockState } from '@awaketab/wake';
import type { ILicenseRecord, ISession, ISettings } from '@awaketab/core';
import { DEFAULT_SETTINGS } from '@awaketab/core';
import type { TAmbientMode } from '@awaketab/core';

export type TLogEntry = [0 | 1, number, number?];

export interface IDone {
  at: number;
  reason: string;
  log: TLogEntry[];
  total: number;
  left: number;
}

export interface IToastItem {
  id: string;
  kind: 'info' | 'success' | 'warn' | 'error' | 'offline';
  text: string;
  action?: { label: string; onClick: () => void };
  sticky?: boolean;
}

export interface IToolState {
  lock: TLockState;
  advice: TAdviceCode | null;
  session: ISession | null;
  settings: ISettings;
  license: ILicenseRecord | null;
  remainingMs: number | null;
  elapsedMs: number;
  selectedPreset: ISettings['defaultPreset'];
  eightHour: boolean;
  deferredAutostart: boolean;
  storagePersistent: boolean;
  ui: {
    mode: TAmbientMode;
    controlsHidden: boolean;
    toasts: IToastItem[];
    secondTab: boolean;
    pip: 'closed' | 'document' | 'popup';
    resumeVisible: boolean;
    open: '' | 'until' | 'custom' | 'more';
    ask: { until: number; fb: boolean } | null;
    done: IDone | null;
    why: boolean;
    log: TLogEntry[];
    asked: number;
    ok: number;
    rcpt: boolean;
    auto: boolean;
    past: boolean;
  };
}

export type TToolPatch = Partial<Omit<IToolState, 'ui' | 'settings'>> & {
  ui?: Partial<IToolState['ui']>;
  settings?: ISettings;
};

export interface IStore {
  get(): IToolState;
  set(patch: TToolPatch): void;
  subscribe(fn: (state: IToolState) => void): () => void;
}

export function initialState(settings: ISettings = DEFAULT_SETTINGS): IToolState {
  return {
    lock: 'idle',
    advice: null,
    session: null,
    settings,
    license: null,
    remainingMs: null,
    elapsedMs: 0,
    selectedPreset: settings.defaultPreset,
    eightHour: false,
    deferredAutostart: false,
    storagePersistent: true,
    ui: {
      mode: settings.ambient.mode,
      controlsHidden: false,
      toasts: [],
      secondTab: false,
      pip: 'closed',
      resumeVisible: false,
      open: '',
      ask: null,
      done: null,
      why: false,
      log: [],
      asked: 0,
      ok: 0,
      rcpt: false,
      auto: false,
      past: false,
    },
  };
}

export function createStore(seed: IToolState = initialState()): IStore {
  let state = seed;
  const subs = new Set<(s: IToolState) => void>();
  return {
    get: () => state,
    set(patch) {
      state = {
        ...state,
        ...patch,
        settings: patch.settings ?? state.settings,
        ui: patch.ui ? { ...state.ui, ...patch.ui } : state.ui,
      };
      for (const fn of subs) fn(state);
    },
    subscribe(fn) {
      subs.add(fn);
      fn(state);
      return () => {
        subs.delete(fn);
      };
    },
  };
}
