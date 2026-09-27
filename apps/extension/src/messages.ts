import type { ISession, TAdviceCode, TFeatureGate, TLockState } from '@awaketab/core';
import type { TPowerLevel } from './api';
import { isHHMM, isExtPreset, isLevel, type TExtPreset } from './settings';
import type { TOrigin } from './status';

export type TExtRequest =
  | { type: 'state' }
  | { type: 'start'; presetId: TExtPreset }
  | { type: 'until'; wall: string }
  | { type: 'stop' }
  | { type: 'extend'; ms: number }
  | { type: 'dismiss' }
  | { type: 'level'; level: TPowerLevel }
  | { type: 'toggle' };

export interface IExtState {
  lock: TLockState;
  advice: TAdviceCode | null;
  level: TPowerLevel;
  session: ISession | null;
  origin: TOrigin | null;
  extend: boolean;
  features: TFeatureGate[];
  now: number;
}

export const EXTEND_MS = [15 * 60_000, 30 * 60_000, 60 * 60_000] as const;

export function parseRequest(raw: unknown): TExtRequest | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const msg = raw as Record<string, unknown>;
  switch (msg.type) {
    case 'state':
    case 'stop':
    case 'dismiss':
    case 'toggle':
      return { type: msg.type };
    case 'start':
      return isExtPreset(msg.presetId) ? { type: 'start', presetId: msg.presetId } : null;
    case 'until':
      return isHHMM(msg.wall) ? { type: 'until', wall: msg.wall } : null;
    case 'extend':
      return typeof msg.ms === 'number' && (EXTEND_MS as readonly number[]).includes(msg.ms)
        ? { type: 'extend', ms: msg.ms }
        : null;
    case 'level':
      return isLevel(msg.level) ? { type: 'level', level: msg.level } : null;
    default:
      return null;
  }
}
