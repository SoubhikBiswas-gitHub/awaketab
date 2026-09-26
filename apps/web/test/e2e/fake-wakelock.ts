import type { Page } from '@playwright/test';

export async function installFakeWakeLock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class FakeSentinel extends EventTarget {
      released = false;
      type = 'screen';
      release = async () => {
        this.released = true;
        this.dispatchEvent(new Event('release'));
      };
    }
    const sentinels: FakeSentinel[] = [];
    const api = {
      rejectNext: null as string | null,
      /** performance.now() of the first wake-lock request (docs/00 §11: ≤ 300 ms after DOMContentLoaded). */
      firstRequestAt: null as number | null,
      releaseAll() {
        for (const s of sentinels) void s.release();
      },
      setVisibility(state: 'hidden' | 'visible') {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => state === 'hidden' });
        if (state === 'hidden') this.releaseAll();
        document.dispatchEvent(new Event('visibilitychange'));
      },
    };
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          api.firstRequestAt ??= performance.now();
          if (api.rejectNext) {
            const name = api.rejectNext;
            api.rejectNext = null;
            throw new DOMException('Not allowed', name);
          }
          const s = new FakeSentinel();
          sentinels.push(s);
          return s;
        },
      },
    });
    (window as Window & { __at: typeof api }).__at = api;
  });
}
