import { STORAGE_KEYS } from './constants.js';
import {
  DEFAULT_META,
  DEFAULT_ONBOARDING,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  type ILicenseRecord,
  type IMeta,
  type IOnboarding,
  type ISession,
  type ISettings,
  type IStats,
} from './types.js';
import { computeStreaks, exportStatsCsv, pruneDays } from './stats.js';

export interface IStorageAdapter {
  get(k: string): string | null;
  set(k: string, v: string): void;
  remove(k: string): void;
}

export const memoryAdapter = (): IStorageAdapter => {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => {
      m.set(k, v);
    },
    remove: (k) => {
      m.delete(k);
    },
  };
};

export function localStorageAdapter(): IStorageAdapter {
  return {
    get: (k) => localStorage.getItem(k),
    set: (k, v) => { localStorage.setItem(k, v); },
    remove: (k) => { localStorage.removeItem(k); },
  };
}

export function createStorage(adapter?: IStorageAdapter): {
  adapter: IStorageAdapter;
  persistent: boolean;
  settings(): ISettings;
  writeSettings(s: ISettings): void;
  session(): ISession | null;
  writeSession(s: ISession | null): void;
  stats(): IStats;
  writeStats(s: IStats): void;
  license(): ILicenseRecord | null;
  writeLicense(s: ILicenseRecord | null): void;
  meta(): IMeta;
  writeMeta(s: IMeta): void;
  onboarding(): IOnboarding;
  writeOnboarding(s: IOnboarding): void;
  migrate(): void;
  clearAll(): void;
  exportCsv(): string;
} {
  let persistent = true;
  let used = adapter;
  if (!used) {
    try {
      const probe = localStorageAdapter();
      probe.set('at.__probe', '1');
      probe.remove('at.__probe');
      used = probe;
    } catch {
      used = memoryAdapter();
      persistent = false;
    }
  }
  const a = used;

  function read<T>(key: string, fallback: T): T {
    try {
      const raw = a.get(key);
      if (!raw) return structuredClone(fallback);
      const parsed = JSON.parse(raw) as T;
      if (!parsed || typeof parsed !== 'object') return structuredClone(fallback);
      return { ...fallback, ...parsed };
    } catch {
      return structuredClone(fallback);
    }
  }

  function write(key: string, value: unknown) {
    try {
      if (value === null) a.remove(key);
      else a.set(key, JSON.stringify(value));
    } catch {
      persistent = false;
    }
  }

  return {
    adapter: a,
    get persistent() {
      return persistent;
    },
    settings: () => read(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    writeSettings: (s) => { write(STORAGE_KEYS.settings, s); },
    session: () => {
      try {
        const raw = a.get(STORAGE_KEYS.session);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ISession;
        return typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    },
    writeSession: (s) => { write(STORAGE_KEYS.session, s); },
    stats: () => {
      const { daySessions, dayFocus, ...rest }: IStats = read(STORAGE_KEYS.stats, DEFAULT_STATS);
      const s: IStats = rest;
      s.days = pruneDays(s.days);
      // Optional per-day counters (M6 follow-ups): absent in older data, pruned with `days`, dropped if corrupt.
      if (daySessions && typeof daySessions === 'object') s.daySessions = pruneDays(daySessions);
      if (dayFocus && typeof dayFocus === 'object') s.dayFocus = pruneDays(dayFocus);
      const streaks = computeStreaks(s.days);
      s.currentStreakDays = streaks.currentStreakDays;
      s.longestStreakDays = Math.max(s.longestStreakDays, streaks.longestStreakDays);
      return s;
    },
    writeStats: (s) => { write(STORAGE_KEYS.stats, s); },
    license: () => {
      try {
        const raw = a.get(STORAGE_KEYS.license);
        if (!raw) return null;
        return JSON.parse(raw) as ILicenseRecord;
      } catch {
        return null;
      }
    },
    writeLicense: (s) => { write(STORAGE_KEYS.license, s); },
    meta: () => {
      const m = read(STORAGE_KEYS.meta, DEFAULT_META);
      if (!m.installedAt) m.installedAt = Date.now();
      return m;
    },
    writeMeta: (s) => { write(STORAGE_KEYS.meta, s); },
    onboarding: () => read(STORAGE_KEYS.onboarding, DEFAULT_ONBOARDING),
    writeOnboarding: (s) => { write(STORAGE_KEYS.onboarding, s); },
    migrate() {
      this.settings();
      this.stats();
      this.meta();
      this.onboarding();
    },
    clearAll() {
      for (const k of Object.values(STORAGE_KEYS)) a.remove(k);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('at.tabId');
    },
    exportCsv() {
      return exportStatsCsv(this.stats());
    },
  };
}

export const migrate = (store = createStorage()) => { store.migrate(); };
export const readStats = (store = createStorage()) => store.stats();
export const exportStatsCsvFromStore = (store = createStorage()) => store.exportCsv();
export const clearAllData = (store = createStorage()) => { store.clearAll(); };
