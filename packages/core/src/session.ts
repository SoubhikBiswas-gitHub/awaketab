import type { IChangeEvent, TLockState, IWakeLockHandle } from '@awaketab/wake';
import { evaluateBattery } from './battery.js';
import { CUSTOM_MAX_MS, LOST_TIMEOUT_MS } from './constants.js';
import { createEmitter } from './emitter.js';
import { creditMinutes } from './stats.js';
import type { createStorage } from './storage.js';
import { createTabProtocol } from './tabs.js';
import type { TAmbientMode, TEndReason, TPlan, TPresetId, ISession, TSessionStatus, ISettings } from './types.js';
import { PRESET_MS } from './types.js';

export interface ISessionOptions {
  lock: IWakeLockHandle;
  storage: ReturnType<typeof createStorage>;
  channel?: BroadcastChannel | null;
  settings: () => ISettings;
  now?: () => number;
  setTimeout?: typeof setTimeout;
  clearTimeout?: typeof clearTimeout;
  lostTimeoutMs?: number;
  notify?: (title: string, body: string) => Promise<void>;
  track?: (event: string, params?: Record<string, string | number | boolean>) => void;
  timeZone?: string;
}

export interface ISessionEvents extends Record<string, unknown> {
  tick: { now: number; remainingMs: number | null; elapsedMs: number };
  status: { from: TSessionStatus; to: TSessionStatus; reason: TEndReason | null };
  lock: IChangeEvent;
  ended: { session: ISession; reason: TEndReason };
  warning: { code: 'battery_low' | 'second_tab' | 'clock_adjusted' | 'ios_low_power' | 'storage_memory'; level?: number };
  peers: { count: number };
}

export interface ISessionEngine {
  readonly session: ISession | null;
  readonly lockState: TLockState;
  start(plan: TPlan, meta: { presetId: TPresetId; mode: TAmbientMode; source?: string }): Promise<TLockState>;
  pause(): void;
  resume(): Promise<TLockState>;
  stop(): void;
  extend(ms: number | 'indefinite'): Promise<TLockState>;
  getResumable(): ISession | null;
  resumeSession(): Promise<TLockState>;
  discardResumable(): void;
  on<K extends keyof ISessionEvents>(type: K, cb: (ev: ISessionEvents[K]) => void): () => void;
  destroy(): void;
}

export function planFromPreset(id: Exclude<TPresetId, 'custom' | 'until'>): TPlan {
  if (id === 'pinf') return { type: 'indefinite' };
  return { type: 'duration', ms: PRESET_MS[id] };
}

export function planUntil(wall: string, now = Date.now()): TPlan {
  const [hs, ms] = wall.split(':').map(Number);
  const h = hs ?? 0;
  const m = ms ?? 0;
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= now + 30_000) d.setDate(d.getDate() + 1);
  return { type: 'until', endsAt: d.getTime(), wall };
}

function remainingMs(session: ISession, now: number): number | null {
  if (session.endsAt === null) return null;
  if (session.plan.type === 'duration') {
    const pauseNow = session.status === 'paused' && session.pausedAt !== null ? now - session.pausedAt : 0;
    return Math.max(0, session.endsAt - now + session.pausedMs + pauseNow);
  }
  return Math.max(0, session.endsAt - now);
}

export function createSession(opts: ISessionOptions): ISessionEngine {
  const nowFn = opts.now ?? Date.now;
  const st = opts.setTimeout ?? setTimeout;
  const ct = opts.clearTimeout ?? clearTimeout;
  const lostMs = opts.lostTimeoutMs ?? LOST_TIMEOUT_MS;
  const emitter = createEmitter<ISessionEvents>();
  let session: ISession | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lostSince: number | null = null;
  let lastTickAt = nowFn();
  let destroyed = false;
  const tabId = crypto.randomUUID();
  const tabs = createTabProtocol({
    tabId,
    onPeerLock: () => { emitter.emit('warning', { code: 'second_tab' }); },
    onPeers: (count) => { emitter.emit('peers', { count }); },
    lockState: () => opts.lock.state,
    ...(opts.channel !== undefined ? { channel: opts.channel } : {}),
  });

  const offLock = opts.lock.on('change', (e) => {
    opts.track?.('lock_state', { from: e.from, to: e.to });
    if (e.to === 'denied') opts.track?.('lock_denied', { reason: e.advice ?? 'denied' });
    if (e.to === 'fallback') opts.track?.('fallback_used');
    emitter.emit('lock', e);
    if (!session || session.status === 'completed' || session.status === 'aborted') return;
    if (e.to === 'denied' && session.status === 'active') {
      finish('denied', nowFn());
      return;
    }
    if (e.to === 'lost') lostSince = nowFn();
    if (e.to === 'held' || e.to === 'fallback') lostSince = null;
    persist();
  });

  function persist() {
    if (session) opts.storage.writeSession(session);
  }

  function setStatus(to: TSessionStatus, reason: TEndReason | null) {
    if (!session) return;
    const from = session.status;
    session.status = to;
    emitter.emit('status', { from, to, reason });
  }

  function scheduleTick() {
    if (timer) ct(timer);
    const n = nowFn();
    timer = st(tick, 1000 - (n % 1000));
  }

  function tick() {
    timer = null;
    const now = nowFn();
    if (!session || session.status !== 'active') return;
    if (session.plan.type === 'until') reconcileUntil(now);
    const rem = remainingMs(session, now);
    if (rem !== null && rem <= 0) {
      finish('completed', now);
      return;
    }
    const ls = opts.lock.state;
    if (ls === 'held' || ls === 'fallback') {
      session.awakeSeconds += 1;
      if (session.awakeSeconds % 60 === 0) {
        const stats = opts.storage.stats();
        creditMinutes(stats, now, 1, opts.timeZone);
        opts.storage.writeStats(stats);
      }
    }
    if (ls === 'lost' && lostSince !== null && now - lostSince >= lostMs) {
      finish('lost_timeout', now);
      return;
    }
    checkBattery();
    emitter.emit('tick', {
      now,
      remainingMs: rem,
      elapsedMs: now - session.startedAt - session.pausedMs,
    });
    lastTickAt = now;
    persist();
    scheduleTick();
  }

  function reconcileUntil(now: number) {
    if (!session || session.plan.type !== 'until') return;
    const wall = session.plan.wall;
    const formatted = formatHHMM(new Date(session.plan.endsAt));
    if (Math.abs(now - lastTickAt) > 90_000 || formatted !== wall) {
    const next = planUntil(wall, now);
    if (next.type === 'until') {
      session.plan = next;
      session.endsAt = next.endsAt;
      emitter.emit('warning', { code: 'clock_adjusted' });
    }
    }
  }

  function checkBattery() {
    const settings = opts.settings();
    if (!settings.battery.autoStop) return;
    const nav = globalThis.navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (typeof nav.getBattery !== 'function') return;
    void nav.getBattery().then((b) => {
      const ev = evaluateBattery(b, settings.battery.threshold / 100, 0.02);
      if (ev === 'low') emitter.emit('warning', { code: 'battery_low', level: b.level });
      if (ev === 'stop' && session?.status === 'active') finish('battery', nowFn());
    });
  }

  function finish(reason: TEndReason, now: number) {
    if (!session || session.status === 'completed' || session.status === 'aborted') return;
    if (timer) ct(timer);
    timer = null;
    session.endReason = reason;
    session.endedAt = now;
    setStatus(reason === 'completed' ? 'completed' : 'aborted', reason);
    void opts.lock.release();
    const stats = opts.storage.stats();
    if (session.awakeSeconds % 60 >= 30) creditMinutes(stats, now, 1, opts.timeZone);
    if (Math.floor(session.awakeSeconds / 60) >= 1) stats.sessions += 1;
    stats.lastSessionAt = now;
    opts.storage.writeStats(stats);
    persist();
    opts.track?.('session_end', { reason, durationMin: Math.round(session.awakeSeconds / 60) });
    const snap = session;
    emitter.emit('ended', { session: snap, reason });
  }

  async function acquire(): Promise<TLockState> {
    return opts.lock.request();
  }

  const engine: ISessionEngine = {
    get session() {
      return session;
    },
    get lockState() {
      return opts.lock.state;
    },
    async start(plan, meta) {
      if (destroyed) return opts.lock.state;
      if (plan.type === 'duration' && (plan.ms <= 0 || plan.ms > CUSTOM_MAX_MS)) {
        throw new RangeError('custom duration out of range');
      }
      const now = nowFn();
      session = {
        v: 1,
        id: crypto.randomUUID(),
        plan,
        presetId: meta.presetId,
        mode: meta.mode,
        startedAt: now,
        endsAt: plan.type === 'duration' ? now + plan.ms : plan.type === 'until' ? plan.endsAt : null,
        status: 'active',
        pausedAt: null,
        pausedMs: 0,
        endedAt: null,
        endReason: null,
        awakeSeconds: 0,
        modeState: {},
        source: meta.source === 'pwa' || meta.source === 'pip' || meta.source === 'ext' || meta.source === 'embed' ? meta.source : 'web',
      };
      persist();
      opts.track?.('session_start', { planType: plan.type, presetId: meta.presetId, mode: meta.mode });
      const state = await acquire();
      tabs.post({ type: 'lock', state, tabId, ts: nowFn() });
      scheduleTick();
      return state;
    },
    pause() {
      if (destroyed || !session || session.status !== 'active') return;
      const now = nowFn();
      session.pausedAt = now;
      setStatus('paused', null);
      void opts.lock.release();
      if (timer) ct(timer);
      persist();
    },
    async resume() {
      if (destroyed || !session || session.status !== 'paused') return opts.lock.state;
      const now = nowFn();
      if (session.pausedAt !== null) session.pausedMs += now - session.pausedAt;
      session.pausedAt = null;
      if (session.plan.type === 'until' && session.endsAt !== null && now >= session.endsAt) {
        finish('completed', now);
        return opts.lock.state;
      }
      setStatus('active', null);
      const state = await acquire();
      scheduleTick();
      persist();
      return state;
    },
    stop() {
      if (destroyed) return;
      finish('user', nowFn());
    },
    async extend(ms) {
      if (ms === 'indefinite') {
        return engine.start({ type: 'indefinite' }, { presetId: 'pinf', mode: session?.mode ?? 'standard', source: 'extend' });
      }
      return engine.start(
        { type: 'duration', ms },
        { presetId: 'custom', mode: session?.mode ?? 'standard', source: 'extend' },
      );
    },
    getResumable() {
      const stored = opts.storage.session();
      if (!stored) return null;
      const now = nowFn();
      if (stored.status !== 'active' && stored.status !== 'paused') return null;
      const okEnds = stored.endsAt === null ? stored.plan.type === 'indefinite' && now - stored.startedAt < 12 * 3_600_000 : stored.endsAt > now;
      if (okEnds) return stored;
      return null;
    },
    async resumeSession() {
      const stored = engine.getResumable();
      if (!stored) return opts.lock.state;
      session = stored;
      if (session.status === 'active') {
        const state = await acquire();
        scheduleTick();
        persist();
        return state;
      }
      return engine.resume();
    },
    discardResumable() {
      const stored = opts.storage.session();
      if (!stored) return;
      stored.status = 'aborted';
      stored.endReason = 'user';
      stored.endedAt = nowFn();
      opts.storage.writeSession(stored);
    },
    on: (type, cb) => emitter.on(type, cb),
    destroy() {
      destroyed = true;
      if (timer) ct(timer);
      offLock();
      tabs.dispose();
      void opts.lock.release();
    },
  };

  return engine;
}

function formatHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
