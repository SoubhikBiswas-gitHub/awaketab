import type { IToolCtx } from './ctx.js';

/**
 * `P` / the header button (docs/05 §9). The floating window itself lives in the ambient layer's lazy chunk
 * (ambient/pip-window.ts): it shares the layer's stylesheet, digit helpers and the pip.pro mirror, and one chunk
 * is lighter than two against the tool page's 40 KB JS budget (docs/00 §11).
 */
export const togglePip = (ctx: IToolCtx): Promise<'document' | 'popup' | 'blocked' | 'closed'> =>
  import('./ambient/shell.js').then((m) => m.togglePip(ctx));
