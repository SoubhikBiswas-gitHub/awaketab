import type { createStorage, ISessionEngine, TFeatureGate, TPlan, TPresetId } from '@awaketab/core';
import type { IWakeLockHandle } from '@awaketab/wake';
import type { IUrlParams } from './params.js';
import type { IStore } from './store.js';

/**
 * Everything a lazily imported tool module (ambient/*, stats/*, end.ts, pip.ts, ui/rating.ts) needs from the
 * booted island. main.ts builds one object and passes it down, so the critical chunk carries no per-module
 * wiring (docs/05 §13: everything outside the critical path loads by import() on first use).
 */
export interface IToolCtx {
  root: HTMLElement;
  store: IStore;
  engine: ISessionEngine;
  lock: IWakeLockHandle;
  storage: ReturnType<typeof createStorage>;
  params: IUrlParams;
  // Function-typed properties (not methods) so modules can pass them around as callbacks unbound.
  startPlan: (plan: TPlan, presetId: TPresetId) => Promise<void>;
  stop: () => void;
  syncLock: () => void;
  track: (event: string, params?: Record<string, string | number | boolean>) => void;
  /** AudioContext primed on the first user gesture (docs/04 §10 step 3); undefined before that. */
  audio: () => AudioContext | undefined;
}

export function hasFeature(ctx: Pick<IToolCtx, 'store'>, gate: TFeatureGate): boolean {
  const lic = ctx.store.get().license;
  return !!lic && lic.exp * 1000 > Date.now() && lic.features.includes(gate);
}
