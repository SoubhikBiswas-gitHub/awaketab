export type { TAdviceCode, TLockReason, TLockState } from '@awaketab/wake';
export { CHANNEL_NAME, CUSTOM_MAX_MS, LOST_TIMEOUT_MS, STORAGE_KEYS } from './constants.js';
export { evaluateBattery } from './battery.js';
export { probeCapabilities } from './capability.js';
export type { TBrowserFamily, ICapabilities, TOSFamily } from './capability.js';
export { hasFeature, LICENSE_PUBLIC_KEYS, needsRevalidation, sha256Hex, verifyLicenseToken } from './license.js';
export type { ILicenseState } from './license.js';
export { createSession, planFromPreset, planUntil } from './session.js';
export type { ISessionEngine, ISessionEvents, ISessionOptions } from './session.js';
export { computeStreaks, countDay, creditMinutes, dayKey, exportStatsCsv, pruneDays } from './stats.js';
export type { IStorageAdapter } from './storage.js';
export {
  clearAllData,
  createStorage,
  exportStatsCsvFromStore,
  localStorageAdapter,
  memoryAdapter,
  migrate,
  readStats,
} from './storage.js';
export { createTabProtocol } from './tabs.js';
export type { TTabMessage } from './tabs.js';
export type {
  TAmbientMode,
  TEndBehaviour,
  TEndReason,
  TFeatureGate,
  ILicenseRecord,
  IMeta,
  IOnboarding,
  TPlan,
  TPlanId,
  TPlanType,
  TPresetId,
  ISession,
  TSessionSource,
  TSessionStatus,
  ISettings,
  IStats,
  TTheme,
} from './types.js';
export { DEFAULT_META, DEFAULT_ONBOARDING, DEFAULT_SETTINGS, DEFAULT_STATS, PRESET_MS } from './types.js';
