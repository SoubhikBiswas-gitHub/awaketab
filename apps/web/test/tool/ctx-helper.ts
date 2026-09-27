import { createSession, createStorage, DEFAULT_SETTINGS, memoryAdapter, type ILicenseRecord, type ISettings } from '@awaketab/core';
import { createWakeLock } from '@awaketab/wake';
import { vi } from 'vitest';
import { createFakeApi } from '../../../../packages/wake/test/fake.js';
import type { IToolCtx } from '../../src/tool/ctx.js';
import { parseToolParams } from '../../src/tool/params.js';
import { createStore, initialState } from '../../src/tool/store.js';

export function license(features: ILicenseRecord['features']): ILicenseRecord {
  return {
    v: 1,
    token: 'x.y.z',
    plan: 'pro_yearly',
    features,
    exp: Math.floor(Date.now() / 1000) + 86_400,
    lastValidatedAt: Date.now(),
    deviceId: 'dev',
    deviceLabel: 'test',
  };
}

export function makeCtx(opts: { html?: string; settings?: Partial<ISettings>; search?: string; license?: ILicenseRecord | null } = {}) {
  document.body.innerHTML = `<div id="awaketab-tool">${opts.html ?? ''}</div>`;
  const root = document.querySelector<HTMLElement>('#awaketab-tool') as HTMLElement;
  const fake = createFakeApi();
  const lock = createWakeLock({ wakeLock: fake.api, documentLike: document, fallback: 'none' });
  const storage = createStorage(memoryAdapter());
  const settings: ISettings = { ...DEFAULT_SETTINGS, ...opts.settings };
  storage.writeSettings(settings);
  const store = createStore({ ...initialState(settings), license: opts.license ?? null });
  const engine = createSession({ lock, storage, channel: null, settings: () => store.get().settings });
  const syncLock = () => {
    store.set({ lock: lock.state, session: engine.session });
  };
  engine.on('lock', syncLock);
  const tracked: Array<[string, Record<string, unknown> | undefined]> = [];
  const ctx: IToolCtx = {
    root,
    store,
    engine,
    lock,
    storage,
    params: parseToolParams({ pathname: '/', search: opts.search ?? '' }, {}),
    startPlan: async (plan, presetId) => {
      await engine.start(plan, { presetId, mode: store.get().ui.mode });
      syncLock();
    },
    stop: () => {
      engine.stop();
      syncLock();
    },
    syncLock,
    track: vi.fn((event: string, params?: Record<string, unknown>) => {
      tracked.push([event, params]);
    }),
    audio: () => undefined,
  };
  return { ctx, root, store, engine, lock, storage, fake, tracked };
}
