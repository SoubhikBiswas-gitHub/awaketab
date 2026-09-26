import type { IChangeEvent, TLockState, IWakeLockHandle } from '@awaketab/wake';
import { evaluateBattery, type IBatteryLike } from './battery.js';
import { CUSTOM_MAX_MS, LOST_TIMEOUT_MS } from './constants.js';
import { createEmitter } from './emitter.js';
import { creditMinutes } from './stats.js';
import type { createStorage } from './storage.js';
import { createTabProtocol, type TTabMessage } from './tabs.js';
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
  /** `keepLock` pauses the clock but keeps the screen awake (cook mode, docs/05 §3.16). */
  pause(opts?: { keepLock?: boolean }): void;
  resume(): Promise<TLockState>;
  stop(): void;
  extend(ms: number | 'indefinite'): Promise<TLockState>;
  /** Adds time to the running finite plan without restarting it (PiP `+15`). */
  addTime(ms: number): void;
  /** Persists the ambient mode and per-mode data (`modeState.cookTimers`, …) on the live session. */
  updateSession(patch: { mode?: TAmbientMode; modeState?: Record<string, unknown> }): void;
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
  let ticks = 0;
  let batteryRef: IBatteryLike | null | undefined;
  let batteryWarned = false;
  let batteryStopArmed = true;
  let lockKept = false;
  const tabId = crypto.randomUUID();
  const tabs = createTabProtocol({
    tabId,
    onPeerLock: () => { emitter.emit('warning', { code: 'second_tab' }); },
    onPeers: (count) => { emitter.emit('peers', { count }); },
    onIntent: (msg) => {
      if (msg.action === 'stop') engine.stop();
      else if (typeof msg.ms === 'number') engine.addTime(msg.ms);
    },
    lockState: () => opts.lock.state,
    snapshot: () => snapshot(),
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
    broadcast();
  });

  function persist() {
    if (session) opts.storage.writeSession(session);
  }

  function snapshot(): Extract<TTabMessage, { type: 'state' }> | null {
    if (!session) return null;
    return {
      type: 'state',
      tabId,
      ts: nowFn(),
      status: session.status,
      lock: opts.lock.state,
      startedAt: session.startedAt,
      endsAt: session.endsAt,
      planType: session.plan.type,
      pausedMs: session.pausedMs,
      pausedAt: session.pausedAt,
      wall: session.plan.type === 'until' ? session.plan.wall : null,
    };
  }

  // Mirrors (the /pip popup) render from these snapshots; posted on every tick, status and lock change.
  function broadcast() {
    const snap = snapshot();
    if (snap) tabs.post(snap);
  }

  function setStatus(to: TSessionStatus, reason: TEndReason | null) {
    if (!session) return;
    const from = session.status;
    session.status = to;
    emitter.emit('status', { from, to, reason });
    broadcast();
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
    if (ticks % 60 === 0) void checkBattery();
    ticks += 1;
    emitter.emit('tick', {
      now,
      remainingMs: rem,
      elapsedMs: now - session.startedAt - session.pausedMs,
    });
    lastTickAt = now;
    persist();
    broadcast();
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

  // docs/04 §11: one BatteryManager per engine, evaluated on its events and on every 60th tick.
  async function battery(): Promise<IBatteryLike | null> {
    if (batteryRef !== undefined) return batteryRef;
    const nav = globalThis.navigator as (Navigator & { getBattery?: () => Promise<IBatteryLike> }) | undefined;
    if (typeof nav?.getBattery !== 'function') {
      batteryRef = null;
      return null;
    }
    try {
      batteryRef = await nav.getBattery();
      batteryRef.addEventListener('levelchange', onBatteryEvent);
      batteryRef.addEventListener('chargingchange', onBatteryEvent);
    } catch {
      batteryRef = null;
    }
    return batteryRef;
  }

  function onBatteryEvent() {
    void checkBattery();
  }

  // A function, not an inline check: the session can end while getBattery() is awaited.
  function isActive(): boolean {
    return session?.status === 'active';
  }

  async function checkBattery() {
    const settings = opts.settings();
    if (!settings.battery.autoStop || !isActive()) return;
    const b = await battery();
    if (!b || !isActive()) return;
    const threshold = settings.battery.threshold / 100;
    // Re-arm after an auto-stop only once charging or back above threshold + 5 % (hysteresis).
    if (!batteryStopArmed && (b.charging || b.level >= threshold + 0.05)) batteryStopArmed = true;
    const ev = evaluateBattery(b, threshold, 0.02);
    if ((ev === 'low' || (ev === 'stop' && !batteryStopArmed)) && !batteryWarned) {
      batteryWarned = true;
      emitter.emit('warning', { code: 'battery_low', level: b.level });
    }
    if (ev === 'stop' && batteryStopArmed) {
      batteryStopArmed = false;
      finish('battery', nowFn());
    }
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
      ticks = 0;
      batteryWarned = false;
      lockKept = false;
      persist();
      opts.track?.('session_start', { planType: plan.type, presetId: meta.presetId, mode: meta.mode });
      const state = await acquire();
      tabs.post({ type: 'lock', state, tabId, ts: nowFn() });
      scheduleTick();
      void checkBattery();
      return state;
    },
    pause(pauseOpts) {
      if (destroyed || !session || session.status !== 'active') return;
      const now = nowFn();
      session.pausedAt = now;
      lockKept = pauseOpts?.keepLock === true;
      setStatus('paused', null);
      if (!lockKept) void opts.lock.release();
      if (timer) ct(timer);
      timer = null;
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
      const ls = opts.lock.state;
      const kept = lockKept && (ls === 'held' || ls === 'fallback');
      lockKept = false;
      const state = kept ? ls : await acquire();
      scheduleTick();
      persist();
      return state;
    },
    stop() {
      if (destroyed) return;
      const live = session?.status === 'active' || session?.status === 'paused';
      if (live) finish('user', nowFn());
      // After completion the UI may re-request the lock for the extend grace period (docs/05 §3.9);
      // Stop must release it even though the session itself has already ended.
      else void opts.lock.release();
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
    addTime(ms) {
      if (destroyed || !session || (session.status !== 'active' && session.status !== 'paused')) return;
      if (!Number.isFinite(ms) || ms <= 0 || session.endsAt === null) return;
      const remaining = remainingMs(session, nowFn()) ?? 0;
      if (remaining + ms > CUSTOM_MAX_MS) return;
      if (session.plan.type === 'until') {
        // An until target that moved is no longer a wall-clock target; keep the same deadline as a duration.
        // Duration remaining is endsAt - now + pausedMs, so fold pausedMs out of the new span.
        session.plan = { type: 'duration', ms: session.plan.endsAt + ms - session.startedAt - session.pausedMs };
        session.endsAt = session.startedAt + session.plan.ms;
      } else if (session.plan.type === 'duration') {
        session.plan = { type: 'duration', ms: session.plan.ms + ms };
        session.endsAt += ms;
      }
      opts.track?.('session_extend', { addedMin: Math.round(ms / 60_000) });
      persist();
      broadcast();
    },
    updateSession(patch) {
      if (destroyed || !session) return;
      if (patch.mode) session.mode = patch.mode;
      if (patch.modeState) session.modeState = { ...session.modeState, ...patch.modeState };
      persist();
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
      batteryRef?.removeEventListener('levelchange', onBatteryEvent);
      batteryRef?.removeEventListener('chargingchange', onBatteryEvent);
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
