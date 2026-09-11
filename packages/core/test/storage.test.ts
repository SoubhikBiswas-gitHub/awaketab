import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '../src/constants.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import { DEFAULT_SETTINGS } from '../src/types.js';

describe('storage', () => {
  it('applies defaults for missing keys', () => {
    const store = createStorage(memoryAdapter());
    expect(store.settings().defaultPreset).toBe(DEFAULT_SETTINGS.defaultPreset);
    expect(store.session()).toBeNull();
  });

  it('returns defaults for corrupt JSON', () => {
    const mem = memoryAdapter();
    mem.set(STORAGE_KEYS.settings, '{not json');
    const store = createStorage(mem);
    expect(store.settings().theme).toBe('auto');
  });

  it('migrate is idempotent and clearAll removes at.v1 keys', () => {
    const mem = memoryAdapter();
    const store = createStorage(mem);
    store.writeSettings({ ...store.settings(), telemetry: false });
    store.migrate();
    store.migrate();
    expect(store.settings().telemetry).toBe(false);
    store.clearAll();
    expect(mem.get(STORAGE_KEYS.settings)).toBeNull();
  });
});
