export const LOST_TIMEOUT_MS = 21_600_000;
export const CUSTOM_MAX_MS = 7 * 24 * 60 * 60 * 1000;
export const CHANNEL_NAME = 'awaketab';
export const TAB_ID_KEY = 'at.tabId';

export const STORAGE_KEYS = {
  settings: 'at.v1.settings',
  session: 'at.v1.session',
  stats: 'at.v1.stats',
  license: 'at.v1.license',
  meta: 'at.v1.meta',
  onboarding: 'at.v1.onboarding',
} as const;
