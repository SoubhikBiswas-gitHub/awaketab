/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { createWakeLock, isWakeLockSupported } from '../src/index.js';

describe('T16 SSR', () => {
  it('returns an inert handle without throwing', async () => {
    expect(isWakeLockSupported()).toBe(false);
    const lock = createWakeLock();
    expect(lock.supported).toBe(false);
    expect(lock.state).toBe('idle');
    expect(await lock.request()).toBe('idle');
    lock.destroy();
  });
});
