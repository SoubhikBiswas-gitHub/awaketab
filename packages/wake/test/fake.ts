export class FakeSentinel extends EventTarget {
  released = false;
  type = 'screen' as const;
  release = async () => {
    if (this.released) return;
    this.released = true;
    this.dispatchEvent(new Event('release'));
  };
}

export function createFakeApi() {
  const sentinels: FakeSentinel[] = [];
  let rejectWith: Error | null = null;
  const api = {
    request: async () => {
      if (rejectWith) {
        const err = rejectWith;
        rejectWith = null;
        throw err;
      }
      const s = new FakeSentinel();
      sentinels.push(s);
      return s;
    },
  };
  return {
    api,
    sentinels,
    rejectNextWith(err: Error) {
      rejectWith = err;
    },
    releaseAll() {
      for (const s of sentinels) void s.release();
    },
  };
}

export function setVisibility(doc: Document, vis: DocumentVisibilityState) {
  Object.defineProperty(doc, 'visibilityState', { configurable: true, get: () => vis });
  Object.defineProperty(doc, 'hidden', { configurable: true, get: () => vis === 'hidden' });
  doc.dispatchEvent(new Event('visibilitychange'));
}
