import { COOK_MAX_TIMERS, readCookTimers, type ICookTimer } from '../ambient/logic.js';

export const EMBED_SETTINGS_KEY = 'at.v1.embed.settings';

export interface IEmbedSettings {
  v: 1;
  cookTimers: ICookTimer[];
}

export const DEFAULT_EMBED_SETTINGS: IEmbedSettings = { v: 1, cookTimers: [] };

type TStore = Pick<Storage, 'getItem' | 'setItem'>;

export function readEmbedSettings(store: TStore | null): IEmbedSettings {
  try {
    const raw = store?.getItem(EMBED_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_EMBED_SETTINGS, cookTimers: [] };
    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    const timers = parsed && typeof parsed === 'object' ? readCookTimers(parsed) : [];
    return { v: 1, cookTimers: timers.slice(0, COOK_MAX_TIMERS) };
  } catch {
    return { ...DEFAULT_EMBED_SETTINGS, cookTimers: [] };
  }
}

export function writeEmbedSettings(store: TStore | null, settings: IEmbedSettings): boolean {
  try {
    store?.setItem(EMBED_SETTINGS_KEY, JSON.stringify({ v: 1, cookTimers: settings.cookTimers.slice(0, COOK_MAX_TIMERS) }));
    return store !== null;
  } catch {
    return false;
  }
}

export function safeLocalStorage(win: Window): TStore | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}
