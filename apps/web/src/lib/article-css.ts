import box from '../styles/article/box.css?raw';
import code from '../styles/article/code.css?raw';
import forBlocks from '../styles/article/for.css?raw';
import grid from '../styles/article/grid.css?raw';
import lifecycle from '../styles/article/lifecycle.css?raw';
import rows from '../styles/article/rows.css?raw';
import shots from '../styles/article/shots.css?raw';
import steps from '../styles/article/steps.css?raw';
import track from '../styles/article/track.css?raw';
import type { TBlockName } from './article';

const GROUPS: Record<string, string> = {
  box,
  code,
  for: forBlocks,
  grid,
  lifecycle,
  rows,
  shots,
  steps,
  track,
};
const BY_BLOCK: Partial<Record<TBlockName, string[]>> = {
  figures: ['for'],
  pills: ['for'],
  checklist: ['for', 'box'],
  matrix: ['grid'],
  compare: ['grid'],
  rows: ['rows'],
  picks: ['rows'],
  note: ['rows'],
  code: ['code'],
  lifecycle: ['lifecycle'],
};

export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(/\s+/gu, ' ')
    .replace(/\s*([{};,>])\s*/gu, '$1')
    .replace(/;\}/gu, '}')
    .trim();
}

export function articleCss(blocks: TBlockName[], stepVariant: 'card' | 'shots' | 'track' | null): string {
  const want = new Set<string>();
  for (const block of blocks) for (const group of BY_BLOCK[block] ?? []) want.add(group);
  if (blocks.includes('steps') && stepVariant) {
    want.add('steps');
    if (stepVariant === 'shots') want.add('shots');
    if (stepVariant === 'track') {
      want.add('track');
      want.add('box');
    }
  }
  const order = ['steps', 'shots', 'track', 'for', 'box', 'rows', 'grid', 'code', 'lifecycle'];
  return minifyCss(
    order
      .filter((g) => want.has(g))
      .map((g) => GROUPS[g] ?? '')
      .join('\n'),
  );
}
