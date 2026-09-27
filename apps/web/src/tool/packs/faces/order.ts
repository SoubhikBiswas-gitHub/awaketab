import type { TFace } from '@awaketab/core';

// The gallery's groups, in the order the face switch, the C key and a swipe step through them.
export const FACE_GROUPS = [
  ['classic', ['ring', 'bold', 'horizon', 'tide']],
  ['retro', ['flip', 'nixie', 'lcd', 'matrix']],
  ['modern', ['rolling', 'analog', 'rings', 'word']],
] as const satisfies ReadonlyArray<readonly [string, readonly TFace[]]>;

export const FACE_ORDER: readonly TFace[] = FACE_GROUPS.flatMap(([, ids]) => ids);

// The three original faces drawn by the page itself whose art is in the faces sheet (Ring's is inlined).
export const ART_FACES: readonly TFace[] = ['bold', 'horizon', 'tide'];

export function stepFace(face: TFace, by: number): TFace {
  const n = FACE_ORDER.length;
  const i = Math.max(0, FACE_ORDER.indexOf(face));
  return FACE_ORDER[(((i + by) % n) + n) % n] ?? 'ring';
}
