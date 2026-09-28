import type { TAmbientMode } from '@awaketab/core';
import type { IToolCtx } from '../../ctx.js';
import { mountLines } from './lines.js';
import { mountPanel } from './panel.js';

// The extras pack (docs/05 §3.35): Focus and Breathe modes, the intention, the second time zone and their
// Settings section. The tool reaches it only through import() in ambient/shell.ts, ui/settings.ts, ui/actions.ts,
// shortcuts.ts and extras.ts.
export { mountBreathe as breathe } from './breathe.js';
export { mountFocus as focus } from './focus.js';
export { mountPanel as panel };

export function lines(ctx: IToolCtx): void {
  mountLines(ctx);
}

export function intention(ctx: IToolCtx): void {
  mountLines(ctx)?.edit();
}

const toggle = (ctx: IToolCtx, mode: TAmbientMode) => {
  ctx.store.set({ ui: { mode: ctx.store.get().ui.mode === mode ? 'standard' : mode } });
};

// B breathe · T focus timer · I intention (docs/05 §5).
export function key(ctx: IToolCtx, k: string): void {
  if (k === 'b') toggle(ctx, 'breathe');
  else if (k === 't') toggle(ctx, 'focus');
  else intention(ctx);
}
