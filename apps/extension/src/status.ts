import type { ISession, TLockState } from '@awaketab/core';
import type { TPowerLevel } from './api';

/**
 * Extension level ↔ shared vocabulary (docs/10 §3). The extension adds no lock state: `display` and
 * `system` are both the `held` state. At `system` level `chrome.power` keeps the computer awake but the
 * display may still sleep, so the pill never says "Screen awake" there (docs/19 B1, owner decision D-02):
 * its text is `ext.pill.systemHeld` ("System awake") and the secondary line `ext.pill.system` ("Screen may
 * dim or lock"). The web tool is unaffected.
 */

export const BADGE_COLORS: Record<TPowerLevel, string> = { display: '#B86E00', system: '#2B3A67' };
export const BADGE_TEXT_COLOR = '#FFFFFF';

export type TOrigin = 'user' | 'command' | 'schedule' | 'autostart' | 'startup';

export function pillKey(lock: TLockState): `tool.pill.${TLockState}` {
  return `tool.pill.${lock}`;
}

/**
 * The popup pill's primary text for a lock state at a level: `ext.pill.systemHeld` for a held system-level
 * lock, otherwise the shared `tool.pill.<state>` copy (docs/00 §5.1).
 */
export function pillTextKey(lock: TLockState, level: TPowerLevel | null): `tool.pill.${TLockState}` | 'ext.pill.systemHeld' {
  return lock === 'held' && level === 'system' ? 'ext.pill.systemHeld' : pillKey(lock);
}

/** The secondary line under the pill, or `null`. Only a held system-level lock gets one. */
export function pillExtraKey(lock: TLockState, level: TPowerLevel | null): 'ext.pill.system' | null {
  return lock === 'held' && level === 'system' ? 'ext.pill.system' : null;
}

export type TLiveSession = ISession & { status: 'active' | 'paused' };

export function isLive(session: ISession | null | undefined): session is TLiveSession {
  return session?.status === 'active' || session?.status === 'paused';
}

/** Remaining time of a finite plan, from `Date.now()`-style arithmetic only (docs/00 §5.2). */
export function remainingMs(session: ISession, now: number): number | null {
  if (session.endsAt === null) return null;
  if (session.plan.type === 'duration') {
    const pausedNow = session.status === 'paused' && session.pausedAt !== null ? now - session.pausedAt : 0;
    return Math.max(0, session.endsAt - now + session.pausedMs + pausedNow);
  }
  return Math.max(0, session.endsAt - now);
}

export function totalMs(session: ISession): number | null {
  if (session.plan.type === 'duration') return session.plan.ms;
  if (session.endsAt === null) return null;
  return Math.max(1, session.endsAt - session.startedAt);
}

/**
 * Badge text: nothing unless the lock is really held (the badge never claims more than the pill); `ON` /
 * `SYS` for an open-ended session, otherwise the minutes left (`25m`, and `3h` from 100 minutes up so the
 * text fits the badge).
 */
export function badgeText(lock: TLockState, level: TPowerLevel | null, session: ISession | null, now: number): string {
  if (lock !== 'held' || !isLive(session)) return '';
  const rem = remainingMs(session, now);
  if (rem === null) return level === 'system' ? 'SYS' : 'ON';
  const minutes = Math.max(1, Math.ceil(rem / 60_000));
  if (minutes < 100) return `${String(minutes)}m`;
  return `${String(Math.floor(minutes / 60))}h`;
}

/** `h:mm:ss` from one hour up, otherwise `mm:ss` — tabular digits in the popup timer. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${String(h)}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function originOf(session: ISession | null | undefined): TOrigin | null {
  const origin = session?.modeState.origin;
  return origin === 'user' || origin === 'command' || origin === 'schedule' || origin === 'autostart' || origin === 'startup'
    ? origin
    : null;
}

export function levelOf(session: ISession | null | undefined, fallback: TPowerLevel): TPowerLevel {
  const level = session?.modeState.level;
  return level === 'display' || level === 'system' ? level : fallback;
}
