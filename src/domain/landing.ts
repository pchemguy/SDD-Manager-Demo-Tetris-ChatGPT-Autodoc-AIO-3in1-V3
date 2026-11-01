/** Ordinary lowest reachable placement, shared by projection and dropping consumers. */
import type { Board, Piece } from '../models';
import { canPlace } from './geometry';

/** Stop at the first blocker; a pose still above the board cannot be locked. */
export function landing(board: Board, piece: Piece): Piece | null {
  if (!canPlace(board, piece, true)) return null;
  let result = piece;
  for (;;) {
    const candidate = { ...result, origin: { ...result.origin, y: result.origin.y + 1 } };
    if (!canPlace(board, candidate, true)) break;
    result = candidate;
  }
  return canPlace(board, result, false) ? result : null;
}

/** Ordinary traversal uses active placement rules; penetrator traversal is a later capability. */
export const canTraverse = (board: Board, piece: Piece): boolean => canPlace(board, piece, true);
