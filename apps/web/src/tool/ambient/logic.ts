import type { ISession, ISettings, TAmbientMode, TFeatureGate } from '@awaketab/core';

export const AMBIENT_ORDER: readonly TAmbientMode[] = [
  'standard',
  'clock',
  'focus',
  'minimal',
  'night',
  'message',
  'cook',
];

export const MODE_GATES: Partial<Record<TAmbientMode, TFeatureGate>> = { message: 'ambient.message' };

export const PIXEL_SHIFT_MS = 60_000;
export const PIXEL_SHIFT_PX = 2;
export const NIGHT_DIM_AFTER_MS = 30_000;
export const BURNIN_DIM_AFTER_MS = 30 * 60_000;
export const MESSAGE_PREVIEW_MS = 60_000;
export const FOCUS_LONG_BREAK_MIN = 15;
export const COOK_MAX_TIMERS = 3;
export const COOK_NAME_MAX = 20;
export const COOK_MIN_MS = 60_000;
export const COOK_MAX_MS = 12 * 3_600_000;
export const COOK_FLASH_MS = 10_000;

export function modeAllowed(mode: TAmbientMode, has: (gate: TFeatureGate) => boolean): boolean {
  const gate = MODE_GATES[mode];
  return !gate || has(gate);
}

export function nextMode(
  current: TAmbientMode,
  has: (gate: TFeatureGate) => boolean,
): { mode: TAmbientMode; skipped: TAmbientMode[] } {
  const skipped: TAmbientMode[] = [];
  let i = AMBIENT_ORDER.indexOf(current);
  for (let n = 0; n < AMBIENT_ORDER.length; n += 1) {
    i = (i + 1) % AMBIENT_ORDER.length;
    const mode = AMBIENT_ORDER[i] ?? 'standard';
    if (modeAllowed(mode, has)) return { mode, skipped };
    skipped.push(mode);
  }
  return { mode: 'standard', skipped };
}

export function activeElapsed(
  session: Pick<ISession, 'startedAt' | 'pausedMs' | 'pausedAt' | 'status'>,
  now: number,
): number {
  const pausing = session.status === 'paused' && session.pausedAt !== null ? now - session.pausedAt : 0;
  return Math.max(0, now - session.startedAt - session.pausedMs - pausing);
}

// ── Focus (Pomodoro) ────────────────────────────────────────────────────────────────────────────

export type TFocusConfig = ISettings['ambient']['focus'];
export type TFocusKind = 'work' | 'break' | 'long' | 'done';

export interface IFocusPhase {
  kind: TFocusKind;
  cycle: number;
  index: number;
  remainingMs: number;
  phaseMs: number;
}

function focusSequence(cfg: TFocusConfig): Array<{ kind: Exclude<TFocusKind, 'done'>; ms: number; cycle: number }> {
  const seq: Array<{ kind: Exclude<TFocusKind, 'done'>; ms: number; cycle: number }> = [];
  const cycles = Math.max(1, Math.floor(cfg.cycles));
  for (let c = 1; c <= cycles; c += 1) {
    seq.push({ kind: 'work', ms: cfg.workMin * 60_000, cycle: c });
    if (c < cycles) seq.push({ kind: 'break', ms: cfg.breakMin * 60_000, cycle: c });
  }
  seq.push({ kind: 'long', ms: FOCUS_LONG_BREAK_MIN * 60_000, cycle: cycles });
  return seq;
}

export function focusPlanMs(cfg: TFocusConfig): number {
  return focusSequence(cfg).reduce((sum, p) => sum + p.ms, 0);
}

export function focusPhase(elapsedMs: number, cfg: TFocusConfig): IFocusPhase {
  const seq = focusSequence(cfg);
  let t = Math.max(0, elapsedMs);
  for (const [index, p] of seq.entries()) {
    if (t < p.ms) return { kind: p.kind, cycle: p.cycle, index, remainingMs: p.ms - t, phaseMs: p.ms };
    t -= p.ms;
  }
  return { kind: 'done', cycle: Math.max(1, cfg.cycles), index: seq.length, remainingMs: 0, phaseMs: 0 };
}

// ── Cook (kitchen timers in session.modeState.cookTimers) ───────────────────────────────────────

export interface ICookTimer {
  id: string;
  name: string;
  durationMs: number;
  endsAt: number;
  doneAt: number | null;
}

function isCookTimer(v: unknown): v is ICookTimer {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.durationMs === 'number' &&
    typeof o.endsAt === 'number' &&
    (o.doneAt === null || typeof o.doneAt === 'number')
  );
}

export function readCookTimers(modeState: Record<string, unknown> | undefined): ICookTimer[] {
  const raw = modeState?.cookTimers;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCookTimer).slice(0, COOK_MAX_TIMERS);
}

export function cookName(raw: string, fallback: string): string {
  const clean = Array.from(
    raw
      .normalize('NFC')
      .replace(/[\p{Cc}\p{Cf}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
    .slice(0, COOK_NAME_MAX)
    .join('');
  return clean || fallback;
}

export function addCookTimer(
  list: readonly ICookTimer[],
  input: { name: string; ms: number; now: number; id: string },
): ICookTimer[] | null {
  if (list.length >= COOK_MAX_TIMERS) return null;
  if (!Number.isFinite(input.ms) || input.ms < COOK_MIN_MS || input.ms > COOK_MAX_MS) return null;
  return [
    ...list,
    { id: input.id, name: input.name, durationMs: input.ms, endsAt: input.now + input.ms, doneAt: null },
  ];
}

export function settleCookTimers(
  list: readonly ICookTimer[],
  now: number,
): { list: ICookTimer[]; finished: ICookTimer[] } {
  const finished: ICookTimer[] = [];
  const next = list.map((timer) => {
    if (timer.doneAt === null && timer.endsAt <= now) {
      const done = { ...timer, doneAt: now };
      finished.push(done);
      return done;
    }
    return timer;
  });
  return { list: next, finished };
}

// ── Message ─────────────────────────────────────────────────────────────────────────────────────

export interface IMessageView {
  text: string;
  sample: boolean;
  preview: boolean;
}

export function resolveMessage(input: { param: string; saved: string; pro: boolean; sample: string }): IMessageView {
  if (input.pro) return { text: input.param || input.saved, sample: false, preview: false };
  if (input.param) return { text: input.param, sample: false, preview: true };
  return { text: input.sample, sample: true, preview: false };
}

// ── Burn-in guard ───────────────────────────────────────────────────────────────────────────────

export function pixelShift(rand: () => number = Math.random): [number, number] {
  const axis = () => Math.round(rand() * (2 * PIXEL_SHIFT_PX)) - PIXEL_SHIFT_PX;
  return [axis(), axis()];
}

export function shouldDim(input: { mode: TAmbientMode; oled: boolean; idleMs: number }): boolean {
  if (input.mode === 'standard') return false;
  if (input.mode === 'night' && input.idleMs >= NIGHT_DIM_AFTER_MS) return true;
  return input.oled && input.idleMs >= BURNIN_DIM_AFTER_MS;
}
