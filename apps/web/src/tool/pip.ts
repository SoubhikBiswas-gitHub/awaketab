import type { IToolCtx } from './ctx.js';

export const togglePip = (ctx: IToolCtx): Promise<'document' | 'popup' | 'blocked' | 'closed'> =>
  import('./ambient/shell.js').then((m) => m.togglePip(ctx));
