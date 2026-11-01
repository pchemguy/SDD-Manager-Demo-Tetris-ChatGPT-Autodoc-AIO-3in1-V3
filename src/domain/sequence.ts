/** Serializable uniform sequence using unbiased bounded xorshift32 draws. */
import type { PieceKind, SequenceState } from '../models';
const KINDS: readonly PieceKind[] = ['I','J','L','O','S','T','Z'];

function draw(seed: number): number {
  let n = seed | 0;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  return n >>> 0;
}

function uniform(seed: number): readonly [PieceKind, number] {
  // A nonzero xorshift32 cycle has 2^32-1 values. Rebase to 0..2^32-2.
  const limit = Math.floor(4294967295 / KINDS.length) * KINDS.length;
  let rng = seed;
  do { rng = draw(rng); } while (rng - 1 >= limit);
  return [KINDS[(rng - 1) % KINDS.length]!, rng];
}

/** Consume one kind and retain a non-consuming next-kind lookahead in state. */
export function takeNext(state: SequenceState): readonly [PieceKind, SequenceState] {
  const pending = [...state.pending];
  let rng = state.rng;
  if (!pending.length) { const [kind, next] = uniform(rng); pending.push(kind); rng = next; }
  const kind = pending.shift()!;
  if (!pending.length) { const [next, seed] = uniform(rng); pending.push(next); rng = seed; }
  return [kind, { mode: 'uniform', rng, pending }];
}
