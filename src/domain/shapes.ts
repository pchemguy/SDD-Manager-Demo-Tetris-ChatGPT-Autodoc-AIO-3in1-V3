/** Private spawn matrices from the canonical gameplay contract. */
import type { PieceKind } from '../models';

export const SHAPES: Readonly<Record<PieceKind, ReadonlyArray<readonly [number, number]>>> = {
  I: [[0,1],[1,1],[2,1],[3,1]], J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]], O: [[0,0],[1,0],[0,1],[1,1]],
  S: [[1,0],[2,0],[0,1],[1,1]], T: [[1,0],[0,1],[1,1],[2,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]]
};
