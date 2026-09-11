import { PRESET_MS, type TPlan, type TPresetId, type ISession } from '@awaketab/core';
import { t } from './i18n.js';

export function pad(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

export function formatHms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return days > 0 ? `${String(days)}d ${clock}` : clock;
}

export function presetDurationMs(id: TPresetId, lastCustomMs: number): number | null {
  if (id === 'pinf') return null;
  if (id === 'custom') return lastCustomMs;
  if (id === 'until') return null;
  return PRESET_MS[id];
}

export function idleTimerText(preset: TPresetId, lastCustomMs: number, eightHour: boolean): string {
  if (eightHour) return formatHms(480 * 60_000);
  if (preset === 'pinf') return t('tool.timer.indefiniteIdle');
  const ms = presetDurationMs(preset, lastCustomMs);
  return ms === null ? t('tool.timer.indefiniteIdle') : formatHms(ms);
}

export function planLabel(preset: TPresetId, eightHour = false): string {
  if (eightHour) return t('tool.preset.eightHour');
  if (preset === 'pinf') return t('tool.preset.pinf.sr');
  return t(`tool.preset.${preset}`);
}

export function wallLabel(wall: string, locale: string, clock24h: boolean | null): string {
  const [hs, ms] = wall.split(':').map(Number);
  const d = new Date();
  d.setHours(hs ?? 0, ms ?? 0, 0, 0);
  const hour12 = clock24h === null ? undefined : !clock24h;
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12,
    numberingSystem: 'latn',
  }).format(d);
}

export function remainingOf(session: ISession | null, now: number): number | null {
  if (!session || session.endsAt === null) return null;
  if (session.plan.type === 'duration') {
    const pauseNow = session.status === 'paused' && session.pausedAt !== null ? now - session.pausedAt : 0;
    return Math.max(0, session.endsAt - now + session.pausedMs + pauseNow);
  }
  return Math.max(0, session.endsAt - now);
}

export function progressOf(session: ISession | null, now: number): number {
  if (!session) return 0;
  if (session.plan.type === 'indefinite') return 1;
  const start = session.startedAt;
  const end = session.endsAt;
  if (end === null) return 1;
  const span = end - start;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (now - start) / span));
}

export function planUntilWall(plan: TPlan): string | null {
  return plan.type === 'until' ? plan.wall : null;
}

export const RING_C = 2 * Math.PI * 88;

export function dashOffset(progress: number): number {
  return RING_C * (1 - Math.min(1, Math.max(0, progress)));
}
