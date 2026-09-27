import { STORAGE_KEYS, type IStorageAdapter } from '@awaketab/core';
import type { IStorageAreaApi, IStorageChange } from './api';

const SESSION_COALESCE_MS = 10_000;

export interface IChromeStorageAdapter extends IStorageAdapter {
  load(): Promise<void>;
  apply(changes: Record<string, IStorageChange>): string[];
  raw(key: string): unknown;
  put(key: string, value: unknown): Promise<void>;
  flush(): Promise<void>;
}

export function createChromeStorageAdapter(
  area: IStorageAreaApi,
  opts: { coalesceMs?: number; setTimeout?: typeof setTimeout; clearTimeout?: typeof clearTimeout } = {},
): IChromeStorageAdapter {
  const cache = new Map<string, unknown>();
  const coalesceMs = opts.coalesceMs ?? SESSION_COALESCE_MS;
  const st = opts.setTimeout ?? setTimeout;
  const ct = opts.clearTimeout ?? clearTimeout;
  let pending: ReturnType<typeof setTimeout> | null = null;
  let lastSessionShape = '';
  let writes: Promise<void> = Promise.resolve();

  function send(key: string, value: unknown): Promise<void> {
    const next = writes.then(() => area.set({ [key]: value })).catch(() => undefined);
    writes = next;
    return next;
  }

  function shape(value: unknown): string {
    if (!value || typeof value !== 'object') return JSON.stringify(value);
    return JSON.stringify({ ...(value as Record<string, unknown>), awakeSeconds: 0 });
  }

  function flushSession(): Promise<void> {
    if (pending) ct(pending);
    pending = null;
    if (!cache.has(STORAGE_KEYS.session)) return writes;
    return send(STORAGE_KEYS.session, cache.get(STORAGE_KEYS.session));
  }

  return {
    get(key) {
      return cache.has(key) ? JSON.stringify(cache.get(key)) : null;
    },
    set(key, value) {
      const parsed: unknown = JSON.parse(value);
      cache.set(key, parsed);
      if (key !== STORAGE_KEYS.session) {
        void send(key, parsed);
        return;
      }
      const nextShape = shape(parsed);
      if (nextShape === lastSessionShape) {
        pending ??= st(() => {
          pending = null;
          void flushSession();
        }, coalesceMs);
        return;
      }
      lastSessionShape = nextShape;
      void flushSession();
    },
    remove(key) {
      cache.delete(key);
      if (key === STORAGE_KEYS.session) {
        if (pending) ct(pending);
        pending = null;
        lastSessionShape = '';
      }
      writes = writes.then(() => area.remove(key)).catch(() => undefined);
    },
    async load() {
      const all = await area.get(null);
      for (const [key, value] of Object.entries(all)) {
        if (key.startsWith('at.')) cache.set(key, value);
      }
      lastSessionShape = cache.has(STORAGE_KEYS.session) ? shape(cache.get(STORAGE_KEYS.session)) : '';
    },
    apply(changes) {
      const changed: string[] = [];
      for (const [key, change] of Object.entries(changes)) {
        if (!key.startsWith('at.')) continue;
        const before = JSON.stringify(cache.get(key));
        if (change.newValue === undefined) cache.delete(key);
        else cache.set(key, change.newValue);
        if (JSON.stringify(cache.get(key)) !== before) changed.push(key);
        if (key === STORAGE_KEYS.session) lastSessionShape = shape(cache.get(key));
      }
      return changed;
    },
    raw(key) {
      return cache.get(key);
    },
    put(key, value) {
      if (value === undefined || value === null) {
        cache.delete(key);
        writes = writes.then(() => area.remove(key)).catch(() => undefined);
        return writes;
      }
      cache.set(key, value);
      return send(key, value);
    },
    flush() {
      return pending ? flushSession() : writes;
    },
  };
}
