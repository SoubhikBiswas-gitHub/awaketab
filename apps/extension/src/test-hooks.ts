import type { IExtApi, IStorageAreaApi, TPowerLevel } from './api';

/**
 * Test builds only (`AT_EXT_TEST=1` → `__AT_TEST__`, docs/10 §11 "chrome.power mocked via a test build
 * flag"). Replaces `chrome.power` with a recorder so the Playwright suite can assert every keep-awake call
 * without holding a real one on the test machine. The log lives in `chrome.storage.session`, so it survives
 * a forced service-worker restart. Production bundles never contain this module (dead-code eliminated).
 */
export const POWER_LOG_KEY = 'at.test.power';

export interface IPowerCall {
  call: 'request' | 'release';
  level?: TPowerLevel;
  at: number;
}

/** Test builds only: while `chrome.storage.session['at.test.deny']` is true, requests throw like a policy block. */
export const POWER_DENY_KEY = 'at.test.deny';

export function mockPower(
  area: IStorageAreaApi | undefined,
  onChanged?: IExtApi['storage']['onChanged'],
): NonNullable<IExtApi['power']> {
  let chain: Promise<void> = Promise.resolve();
  let deny = false;
  void area?.get(POWER_DENY_KEY).then(
    (v) => {
      deny = v[POWER_DENY_KEY] === true;
    },
    () => undefined,
  );
  onChanged?.addListener((changes, areaName) => {
    if (areaName === 'session' && POWER_DENY_KEY in changes) deny = changes[POWER_DENY_KEY].newValue === true;
  });
  const log = (entry: IPowerCall) => {
    chain = chain
      .then(async () => {
        if (!area) return;
        const prev = (await area.get(POWER_LOG_KEY))[POWER_LOG_KEY];
        await area.set({ [POWER_LOG_KEY]: [...(Array.isArray(prev) ? (prev as IPowerCall[]) : []), entry] });
      })
      .catch(() => undefined);
  };
  return {
    requestKeepAwake(level) {
      if (deny) throw new Error('Blocked by policy (test hook)');
      log({ call: 'request', level, at: Date.now() });
    },
    releaseKeepAwake() {
      log({ call: 'release', at: Date.now() });
    },
  };
}
