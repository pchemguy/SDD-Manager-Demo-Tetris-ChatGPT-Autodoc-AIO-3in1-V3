/** Serializable uniform/seven-bag sequences using unbiased bounded xorshift32 draws. */
import type { PieceKind, SequenceState } from '../models';
const KINDS: readonly PieceKind[] = ['I','J','L','O','S','T','Z'];

function draw(seed: number): number {
  let n = seed | 0;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  return n >>> 0;
}

function bounded(seed:number, bound:number):readonly [number,number] {
  // Rebase the nonzero xorshift cycle to 0..2^32-2, rejecting the incomplete suffix.
  const limit=Math.floor(4294967295/bound)*bound;let rng=seed;
  do {rng=draw(rng);}while(rng-1>=limit);
  return [(rng-1)%bound,rng];
}
function refill(seed:number,mode:SequenceState['mode']):readonly [PieceKind[],number] {
  if(mode==='uniform'){const [index,rng]=bounded(seed,7);return [[KINDS[index]!],rng];}
  const bag=[...KINDS];let rng=seed;
  for(let index=bag.length-1;index>0;index--){const [other,next]=bounded(rng,index+1);rng=next;[bag[index],bag[other]]=[bag[other]!,bag[index]!];}
  return [bag,rng];
}
/** Consume one kind and retain a non-consuming next-kind lookahead in state. */
export function takeNext(state:SequenceState):readonly [PieceKind,SequenceState] {
  let pending=[...state.pending],rng=state.rng;
  if(!pending.length)[pending,rng]=refill(rng,state.mode);
  const kind=pending.shift()!;
  if(!pending.length)[pending,rng]=refill(rng,state.mode);
  return [kind,{mode:state.mode,rng,pending}];
}
