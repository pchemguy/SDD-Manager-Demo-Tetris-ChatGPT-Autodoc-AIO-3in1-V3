/** Independent shape/board fixtures protect the public geometry and landing contract. */
import { describe, expect, test } from 'vitest';
import { cells, canPlace, canTraverse, landing } from '../../../src/domain';
import type { Cell, Piece, PieceKind } from '../../../src/models';
const board = (): Cell[][] => Array.from({ length: 20 }, () => Array<Cell>(10).fill(null));
const piece = (kind: PieceKind = 'O', x = 4, y = 0, rotation: Piece['rotation'] = 0): Piece => ({ kind, origin: { x, y }, rotation, penetrator: false });
const coordinates = (p: Piece) => cells(p).map(v => `${v.x},${v.y}`).sort();

describe('public geometry', () => {
  test('all seven kinds have four distinct occupied cells', () => {
    for (const k of ['I','J','L','O','S','T','Z'] as PieceKind[]) {
      expect(cells(piece(k))).toHaveLength(4);
      expect(new Set(coordinates(piece(k))).size).toBe(4);
    }
  });
  test('I clockwise rotation follows its four-square matrix', () => {
    expect(coordinates(piece('I', 0, 0, 0))).toEqual(['0,1','1,1','2,1','3,1']);
    expect(coordinates(piece('I', 0, 0, 1))).toEqual(['2,0','2,1','2,2','2,3']);
  });
  test('T counterclockwise coordinates and O occupancy are stable', () => {
    expect(coordinates(piece('T', 0, 0, 3))).toEqual(['0,1','1,0','1,1','1,2']);
    expect(coordinates(piece('O', 0, 0, 3))).toEqual(['0,0','0,1','1,0','1,1']);
  });
  test('bounds distinguish a spawning piece from a locked pose', () => {
    const b = board();
    expect(canPlace(b, piece('O', 4, -1), true)).toBe(true);
    expect(canPlace(b, piece('O', 4, -1), false)).toBe(false);
    expect(canPlace(b, piece('O', -1, 0), true)).toBe(false);
    expect(canPlace(b, piece('O', 9, 0), true)).toBe(false);
    expect(canPlace(b, piece('O', 4, 19), true)).toBe(false);
    expect(canPlace(b, piece(), false)).toBe(true);
  });
  test('settled cells block ordinary traversal', () => {
    const b = board(); b[1]![4] = 'T';
    expect(canPlace(b, piece(), true)).toBe(false);
    expect(canTraverse(b, piece())).toBe(false);
    expect(canTraverse(board(), piece())).toBe(true);
  });
});

describe('ordinary landing', () => {
  test('empty board O lands on row 18', () => expect(landing(board(), piece())?.origin).toEqual({ x: 4, y: 18 }));
  test('stops before the first blocker rather than entering a lower hole', () => {
    const b = board(); b[10]![4] = 'J';
    expect(landing(b, piece())?.origin).toEqual({ x: 4, y: 8 });
  });
  test('invalid starting pose and above-board final pose have no landing', () => {
    const b = board(); b[0]![4] = 'J';
    expect(landing(b, piece())).toBeNull();
    b[0] = Array<Cell>(10).fill('J');
    expect(landing(b, piece('O', 4, -2))).toBeNull();
  });
  test('does not mutate caller board or piece', () => {
    const b = board(); const p = piece(); const before = JSON.stringify({ b, p });
    landing(b, p); canPlace(b, p, true); cells(p);
    expect(JSON.stringify({ b, p })).toBe(before);
  });
});
