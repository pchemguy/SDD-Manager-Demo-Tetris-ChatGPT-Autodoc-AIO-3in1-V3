/** Pure piece transforms and board placement; above-top cells are active-only. */
import type { Board, Piece, Vec } from '../models';
import { SHAPES } from './shapes';

/** Return new world coordinates without exposing the canonical shape arrays. */
export function cells(piece: Piece): ReadonlyArray<Vec> {
  const n = piece.kind === 'I' ? 4 : piece.kind === 'O' ? 2 : 3;
  return SHAPES[piece.kind].map(([startX, startY]) => {
    let x = startX, y = startY;
    for (let r = 0; r < piece.rotation; r++) [x, y] = [n - 1 - y, x];
    return { x: piece.origin.x + x, y: piece.origin.y + y };
  });
}

/** Test settled-cell collision, treating only active spawn cells above y=0 as legal. */
export function canPlace(board: Board, piece: Piece, allowAboveTop: boolean): boolean {
  return cells(piece).every(({ x, y }) => Number.isInteger(x) && Number.isInteger(y)
    && x >= 0 && x < 10 && y < 20
    && (y < 0 ? allowAboveTop : board[y]?.[x] === null));
}
