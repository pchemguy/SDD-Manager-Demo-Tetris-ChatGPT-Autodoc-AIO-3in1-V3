/** Private simultaneous row compaction and bounded progression arithmetic. */
import type { Board, Cell } from '../models';

export const addPoints = (score: number, points: number): number => Math.min(Number.MAX_SAFE_INTEGER, score + points);

/** Score at the pre-clear level, then derive the level used by the next spawn. */
export function clearAndScore(board: Board, score: number, lines: number, level: number) {
  const kept = board.filter(row => !row.every(cell => cell !== null)).map(row => [...row]);
  const cleared = 20 - kept.length;
  const nextLines = addPoints(lines, cleared);
  return {
    board: [...Array.from({ length: cleared }, () => Array<Cell>(10).fill(null)), ...kept],
    score: addPoints(score, ([0, 100, 300, 500, 800][cleared] ?? 0) * level),
    lines: nextLines, level: 1 + Math.floor(nextLines / 10), cleared
  };
}
