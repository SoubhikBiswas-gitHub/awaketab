import type { createStorage, ISessionEngine, TFeatureGate, TPlan, TPresetId } from '@awaketab/core';
import type { IWakeLockHandle } from '@awaketab/wake';
import type { IUrlParams } from './params.js';
import type { IStore } from './store.js';

export interface IToolCtx {
  root: HTMLElement;
  store: IStore;
  engine: ISessionEngine;
  lock: IWakeLockHandle;
  storage: ReturnType<typeof createStorage>;
  params: IUrlParams;
  // Function-typed properties (not methods) so modules can pass them around as callbacks unbound.
  startPlan: (plan: TPlan, presetId: TPresetId, switched?: boolean) => Promise<void>;
  startCurrent: () => void;
  stop: () => void;
  syncLock: () => void;
  track: (event: string, params?: Record<string, string | number | boolean>) => void;
  audio: () => AudioContext | undefined;
}

export function hasFeature(ctx: Pick<IToolCtx, 'store'>, gate: TFeatureGate): boolean {
  const lic = ctx.store.get().license;
  return !!lic && lic.exp * 1000 > Date.now() && lic.features.includes(gate);
}
