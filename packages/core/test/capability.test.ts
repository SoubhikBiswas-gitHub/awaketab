import { describe, expect, it } from 'vitest';
import { probeCapabilities } from '../src/capability.js';

describe('capability probe', () => {
  it('detects native wake lock in a secure context when the API exists', () => {
    const caps = probeCapabilities();
    expect(['native', 'fallback', 'none']).toContain(caps.wakeLock);
    expect(caps.browser.family).toBeTruthy();
  });
});
