import type { TFace } from '@awaketab/core';
import type { IFace } from './kit.js';

type TLoad = () => Promise<{ make: () => Promise<IFace> }>;

// Each newer face is its own chunk; only the chosen one downloads (the gallery loads them all for its thumbnails).
export const FACES: Partial<Record<TFace, TLoad>> = {
  flip: () => import('./flip.js'),
  rolling: () => import('./rolling.js'),
  analog: () => import('./analog.js'),
  rings: () => import('./rings.js'),
  word: () => import('./word.js'),
  nixie: () => import('./nixie.js'),
  lcd: () => import('./lcd.js'),
  matrix: () => import('./matrix.js'),
};
