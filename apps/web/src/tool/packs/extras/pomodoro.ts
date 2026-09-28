import { DEFAULT_SETTINGS, type ISettings } from '@awaketab/core';

const FOCUS_LONG_BREAK_MIN = 15;

export interface IFocusConfig {
  workMin: number;
  breakMin: number;
  cycles: number;
  longMin: number;
}

type TFocusKind = 'work' | 'break' | 'long' | 'done';

export interface IFocusPhase {
  kind: TFocusKind;
  cycle: number;
  index: number;
  remainingMs: number;
  phaseMs: number;
  // 1 for a single block; with auto-cycle, the round the phase belongs to.
  round: number;
}

// The steppers in Settings and the stored-settings reader share these ranges.
export const FOCUS_LIMITS = {
  workMin: [5, 90, 5],
  breakMin: [1, 30, 1],
  cycles: [1, 8, 1],
  longMin: [5, 45, 5],
} as const satisfies Record<keyof IFocusConfig, readonly [number, number, number]>;

const clamp = (v: unknown, [lo, hi]: readonly [number, number, number], fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback;

// Stored settings are user-editable, and older ones lack `pomodoro`: every field is checked before use.
export function focusConfig(s: ISettings): IFocusConfig {
  const f = (s.ambient as Partial<ISettings['ambient']> | undefined)?.focus as
    Partial<ISettings['ambient']['focus']> | undefined;
  const p = s.pomodoro as Partial<ISettings['pomodoro']> | undefined;
  const d = DEFAULT_SETTINGS.ambient.focus;
  return {
    workMin: clamp(f?.workMin, FOCUS_LIMITS.workMin, d.workMin),
    breakMin: clamp(f?.breakMin, FOCUS_LIMITS.breakMin, d.breakMin),
    cycles: clamp(f?.cycles, FOCUS_LIMITS.cycles, d.cycles),
    longMin: clamp(p?.longBreakMin, FOCUS_LIMITS.longMin, FOCUS_LONG_BREAK_MIN),
  };
}

export function autoCycleSaved(s: ISettings): boolean {
  return (s.pomodoro as Partial<ISettings['pomodoro']> | undefined)?.autoCycle === true;
}

// A block's config is frozen into its session, so editing Settings mid-block never moves the phase under you.
export function frozenConfig(raw: unknown): IFocusConfig | null {
  const o = raw as Partial<IFocusConfig> | null | undefined;
  if (!o || typeof o !== 'object') return null;
  const ok = (k: keyof IFocusConfig) => typeof o[k] === 'number' && Number.isFinite(o[k]) && o[k] > 0;
  return ok('workMin') && ok('breakMin') && ok('cycles') && ok('longMin') ? (o as IFocusConfig) : null;
}

type TSeq = Array<{ kind: Exclude<TFocusKind, 'done'>; ms: number; cycle: number }>;

function focusSequence(cfg: Pick<IFocusConfig, 'workMin' | 'breakMin' | 'cycles'> & { longMin?: number }): TSeq {
  const seq: TSeq = [];
  const cycles = Math.max(1, Math.floor(cfg.cycles));
  for (let c = 1; c <= cycles; c += 1) {
    seq.push({ kind: 'work', ms: cfg.workMin * 60_000, cycle: c });
    if (c < cycles) seq.push({ kind: 'break', ms: cfg.breakMin * 60_000, cycle: c });
  }
  seq.push({ kind: 'long', ms: (cfg.longMin ?? FOCUS_LONG_BREAK_MIN) * 60_000, cycle: cycles });
  return seq;
}

// One block: every focus and break, then the long break.
export function focusPlanMs(cfg: Parameters<typeof focusSequence>[0]): number {
  return focusSequence(cfg).reduce((sum, p) => sum + p.ms, 0);
}

// The phase at `elapsedMs` of focus time. With `repeat` (auto-cycle) the block starts over after the long break.
export function focusPhase(elapsedMs: number, cfg: Parameters<typeof focusSequence>[0], repeat = false): IFocusPhase {
  const seq = focusSequence(cfg);
  const block = focusPlanMs(cfg);
  let t = Math.max(0, elapsedMs);
  let round = 1;
  if (repeat && block > 0) {
    round = Math.floor(t / block) + 1;
    t %= block;
  }
  for (const [index, p] of seq.entries()) {
    if (t < p.ms) return { kind: p.kind, cycle: p.cycle, index, remainingMs: p.ms - t, phaseMs: p.ms, round };
    t -= p.ms;
  }
  return { kind: 'done', cycle: Math.max(1, cfg.cycles), index: seq.length, remainingMs: 0, phaseMs: 0, round };
}

export interface IFocusClock {
  skip: number;
  paused: number;
  pauseAt: number | null;
}

export function readClock(ms: Record<string, unknown> | undefined): IFocusClock {
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
  return { skip: n(ms?.focusSkip), paused: n(ms?.focusPaused), pauseAt: n(ms?.focusPauseAt) || null };
}

// Focus time: the session's active time, plus skips, minus the Pomodoro's own pauses (the lock stays held then).
export function focusElapsed(active: number, c: IFocusClock, now: number): number {
  const pausing = c.pauseAt === null ? 0 : Math.max(0, now - c.pauseAt);
  return Math.max(0, active + c.skip - c.paused - pausing);
}
