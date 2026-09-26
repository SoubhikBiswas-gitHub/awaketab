import { describe, expect, it } from 'vitest';
import { createWakeLock } from '../../wake/src/index.js';
import { createFakeApi } from '../../wake/test/fake.js';
import { createSession } from '../src/session.js';
import { createStorage, memoryAdapter } from '../src/storage.js';
import { DEFAULT_SETTINGS } from '../src/types.js';

function engineAt(storage: ReturnType<typeof createStorage>, now: { t: number }, resumeIndefiniteMs?: number) {
  const lock = createWakeLock({ wakeLock: createFakeApi().api, documentLike: document, fallback: 'none' });
  return createSession({
    lock,
    storage,
    channel: null,
    settings: () => DEFAULT_SETTINGS,
    now: () => now.t,
    ...(resumeIndefiniteMs !== undefined ? { resumeIndefiniteMs } : {}),
  });
}

describe('resumeIndefiniteMs', () => {
  it('keeps the 12 h web default for indefinite sessions', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: 1_000_000 };
    const first = engineAt(storage, now);
    await first.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard' });
    first.destroy();
    now.t += 11 * 3_600_000;
    expect(engineAt(storage, now).getResumable()?.plan.type).toBe('indefinite');
    now.t += 2 * 3_600_000;
    expect(engineAt(storage, now).getResumable()).toBeNull();
  });

  it('lets the extension worker resume an indefinite session of any age', async () => {
    const storage = createStorage(memoryAdapter());
    const now = { t: 1_000_000 };
    const first = engineAt(storage, now, Number.POSITIVE_INFINITY);
    await first.start({ type: 'indefinite' }, { presetId: 'pinf', mode: 'standard', source: 'ext' });
    first.destroy();
    now.t += 30 * 3_600_000;
    const second = engineAt(storage, now, Number.POSITIVE_INFINITY);
    expect(second.getResumable()?.source).toBe('ext');
    expect(await second.resumeSession()).toBe('held');
    expect(second.session?.startedAt).toBe(1_000_000);
    second.destroy();
  });
});
