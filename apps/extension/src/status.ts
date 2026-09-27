import type { ISession, TLockState } from '@awaketab/core';
import type { TPowerLevel } from './api';

export const BADGE_COLORS: Record<TPowerLevel, string> = { display: '#087B87', system: '#2B3A67' };
export const BADGE_TEXT_COLOR = '#FFFFFF';

export type TOrigin = 'user' | 'command' | 'schedule' | 'autostart' | 'startup';

export function pillKey(lock: TLockState): `tool.pill.${TLockState}` {
  return `tool.pill.${lock}`;
}

export function pillTextKey(lock: TLockState, level: TPowerLevel | null): `tool.pill.${TLockState}` | 'ext.pill.systemHeld' {
  if (lock === 'unsupported') return pillKey('denied');
  return lock === 'held' && level === 'system' ? 'ext.pill.systemHeld' : pillKey(lock);
}

export function pillExtraKey(lock: TLockState, level: TPowerLevel | null): 'ext.pill.system' | null {
  return lock === 'held' && level === 'system' ? 'ext.pill.system' : null;
}

export type TLiveSession = ISession & { status: 'active' | 'paused' };

export function isLive(session: ISession | null | undefined): session is TLiveSession {
  return session?.status === 'active' || session?.status === 'paused';
}

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

export function badgeText(lock: TLockState, level: TPowerLevel | null, session: ISession | null, now: number): string {
  if (lock !== 'held' || !isLive(session)) return '';
  const rem = remainingMs(session, now);
  if (rem === null) return level === 'system' ? 'SYS' : 'ON';
  const minutes = Math.max(1, Math.ceil(rem / 60_000));
  if (minutes < 100) return `${String(minutes)}m`;
  return `${String(Math.floor(minutes / 60))}h`;
}

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
