import type { ISettings } from '@awaketab/core';
import type { TKit } from '../../ambient/shell.js';
import { hasFeature, type IToolCtx } from '../../ctx.js';
import { chime } from '../../signal.js';
import { sound } from '../../ui/settings.js';
import { autoCycleSaved } from './pomodoro.js';
import href from './extras.css?url';

export type { TKit };

let css: Promise<void> | undefined;

export function sheet(): Promise<void> {
  css ??= new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = () => {
      resolve();
    };
    document.head.append(link);
  });
  return css;
}

// The five-minute auto-cycle preview (docs/02 FR-AMBIENT-01) lives only here: it is never written to storage.
let previewing = false;
const watchers = new Set<() => void>();

export function setAutoPreview(on: boolean): void {
  previewing = on;
  for (const fn of watchers) fn();
}

export function onAutoChange(fn: () => void): () => void {
  watchers.add(fn);
  return () => {
    watchers.delete(fn);
  };
}

export const isPro = (ctx: Pick<IToolCtx, 'store'>): boolean => hasFeature(ctx, 'ambient.packs');

export function autoOn(ctx: Pick<IToolCtx, 'store'>): boolean {
  return previewing || (autoCycleSaved(ctx.store.get().settings) && isPro(ctx));
}

export const autoPreviewing = (): boolean => previewing;

// A phase boundary: the chosen end sound when it is one of the sound pack's, else the short focus chime.
export function cue(ctx: IToolCtx): void {
  const s = ctx.store.get().settings;
  const id = s.sound.id;
  if (/^(?:bell|soft|digital|birds)$/u.test(id)) void sound(ctx, 'end').catch(() => chime(ctx, 'focus'));
  else chime(ctx, 'focus');
  if (s.vibrate && 'vibrate' in navigator) navigator.vibrate(120);
}

// Plain text for a stored intention: no control characters, one line, at most 80 characters.
export const INTENTION_MAX = 80;

export function cleanIntention(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return Array.from(
    raw
      .normalize('NFC')
      .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim(),
  )
    .slice(0, INTENTION_MAX)
    .join('')
    .trim();
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...kids: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

export function save(ctx: IToolCtx, patch: Partial<ISettings>): void {
  const next = { ...ctx.store.get().settings, ...patch };
  ctx.storage.writeSettings(next);
  ctx.store.set({ settings: next });
}
