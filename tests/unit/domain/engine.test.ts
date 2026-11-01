/** Explicit state/time fixtures protect engine timing independently of rendering. */
import { expect, test } from 'vitest';
import { advanceGame, createGame, dispatchGame, setPaused } from '../../../src/domain';
import type { Capabilities, Cell, GameState, Settings } from '../../../src/models';
const settings: Settings = { ghost:'show', hardDrop:true, nextPreview:true, hardDropLock:'general', lockPolicy:'interval', hold:true };
const caps: Capabilities = new Set();
const fixture = (patch: Partial<GameState> = {}): GameState => ({
  runId:'run-1', status:'running', board:Array.from({length:20},()=>Array<Cell>(10).fill(null)),
  active:{kind:'O',rotation:0,origin:{x:4,y:17},penetrator:false}, held:null,holdUsed:false,
  sequence:{rng:123,mode:'uniform',pending:['I']},score:0,lines:0,level:1,bonuses:0,
  timers:{gravityRemainingMs:37,lockRemainingMs:null,grounded:false},
  piecePolicy:{lockPolicy:'interval',hardDropLock:'general'},...patch
});
const advance = (s:GameState, ms:number) => advanceGame(s,ms,settings,caps);
const action = (s:GameState,a:Parameters<typeof dispatchGame>[1]) => dispatchGame(s,a,settings,caps);
const grounded = () => advance(fixture(),37).state;

test('factory distinguishes idle/running and is seed-deterministic',()=>{
  const a=createGame(123,'run',settings,caps,'idle');
  expect(a.status).toBe('idle');expect(a.active).toBeNull();
  const b=createGame(123,'run',settings,caps,'running');
  expect(b.status).toBe('running');expect(b.active).not.toBeNull();
  expect(b).toEqual(createGame(123,'run',settings,caps,'running'));
  expect(b.board.flat().filter(Boolean)).toHaveLength(0);
});
test('one gravity step starts a full independent grounding interval',()=>{
  const a=grounded();expect(a.active?.origin.y).toBe(18);
  expect(a.timers).toEqual({gravityRemainingMs:1000,lockRemainingMs:1000,grounded:true});
  const b=advance(a,999);expect(b.events).toEqual([]);expect(b.state.timers.lockRemainingMs).toBe(1);
  const c=advance(b.state,1);expect(c.events.filter(e=>e.type==='locked')).toHaveLength(1);
  expect(c.state.board.flat().filter(Boolean)).toHaveLength(4);
  expect(c.state.timers.gravityRemainingMs).toBe(1000);
});
test('grounded sideways movement and failed soft drop do not restart the deadline',()=>{
  const a=advance(grounded(),400).state;
  const b=action(a,'left').state;expect(b.active?.origin.x).toBe(3);
  expect(b.timers.lockRemainingMs).toBe(600);
  const c=action(b,'softDrop');expect(c.events).toEqual([]);expect(c.state.timers.lockRemainingMs).toBe(600);
  expect(advance(c.state,600).events.some(e=>e.type==='locked')).toBe(true);
});
test('lifting off clears the timer and re-grounding starts a new full interval',()=>{
  const board=fixture().board.map(row=>[...row]);board[18]![4]='J';
  const a=fixture({board,active:{kind:'O',rotation:0,origin:{x:4,y:16},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:600,grounded:true}});
  const b=action(a,'right').state;expect(b.active?.origin.x).toBe(5);
  expect(b.timers.grounded).toBe(false);expect(b.timers.lockRemainingMs).toBeNull();
  const c=advance(b,2000).state;expect(c.active?.origin.y).toBe(18);expect(c.timers.lockRemainingMs).toBe(1000);
});
test('pause freezes remaining gravity/lock time and resume does not catch up',()=>{
  const a=advance(grounded(),400).state;const p=setPaused(a,true);
  expect(p.status).toBe('paused');expect(advance(p,5000).state).toEqual(p);
  const b=setPaused(p,false);expect(b.status).toBe('running');expect(b.timers.lockRemainingMs).toBe(600);
  expect(advance(b,600).events.some(e=>e.type==='locked')).toBe(true);
});
test('baseline origin-only rotation rejects a wall collision',()=>{
  const a=fixture({active:{kind:'I',rotation:1,origin:{x:-2,y:5},penetrator:false}});
  expect(action(a,'rotateCW').state.active).toEqual(a.active);
});
test('top-out locks no out-of-board cells and emits game-over once',()=>{
  const board=fixture().board.map(row=>[...row]);board[0]=Array<Cell>(10).fill('J');
  const a=fixture({board,active:{kind:'O',rotation:0,origin:{x:4,y:-2},penetrator:false}});
  const b=advance(a,1000);expect(b.state.status).toBe('gameover');expect(b.state.board).toEqual(board);
  expect(b.events.filter(e=>e.type==='gameOver')).toHaveLength(1);
  expect(advance(b.state,5000).events).toEqual([]);
});
test('elapsed validation rejects invalid input without mutating caller state',()=>{
  const a=fixture();const snapshot=JSON.stringify(a);
  for(const ms of [-1,NaN,Infinity])expect(()=>advance(a,ms)).toThrow(RangeError);
  expect(advance(a,0).state).toEqual(a);expect(JSON.stringify(a)).toBe(snapshot);
});
test('seed validation rejects zero non-integers and values outside uint32',()=>{
  for(const seed of [0,-1,1.2,NaN,4294967296])expect(()=>createGame(seed,'run',settings,caps,'running')).toThrow(RangeError);
});
test('non-running and unavailable actions are no-ops',()=>{
  const a=fixture({status:'idle',active:null});expect(action(a,'left').state).toEqual(a);
  for(const name of ['hold','hardDrop','penetrator'] as const)expect(action(fixture(),name).state).toEqual(fixture());
});
test('time advances and actions leave caller state immutable',()=>{
  const a=fixture();const snapshot=JSON.stringify(a);advance(a,37);action(a,'left');setPaused(a,true);
  expect(JSON.stringify(a)).toBe(snapshot);
});

// Seeds were obtained by independently inverting xorshift32, not by the tested sampler.
test.each([
  [4071982377,'I'], // raw draw 1 -> rebased 0
  [3372760030,'Z'], // raw draw 7 -> rebased 6
  [3182258506,'I'], // raw draw 8 -> rebased 7
  [1236431772,'Z'], // raw draw 4294967292 is the final accepted sample
  [3137861301,'T'], // raw draw 4294967293 rejected; next raw draw is 761949
  [1584200935,'J']  // raw draw 4294967295 rejected; next raw draw is 253983
] as const)('unbiased nonzero-source boundary seed %i yields %s',(seed,kind)=>{
  expect(createGame(seed,'run',settings,caps,'running').active?.kind).toBe(kind);
});

test('manual grounding between gravity ticks still gets a full interval',()=>{
  const a=action(fixture(),'softDrop').state;
  expect(a.timers.lockRemainingMs).toBe(1000);expect(a.timers.gravityRemainingMs).toBe(37);
  const b=advance(a,999);expect(b.events).toEqual([]);expect(b.state.timers.lockRemainingMs).toBe(1);
  expect(advance(b.state,1).events.some(e=>e.type==='locked')).toBe(true);
});
test('one advance crosses lock and subsequent-piece gravity without losing time',()=>{
  const a=advance(fixture(),2500);
  expect(a.events.filter(e=>e.type==='locked')).toHaveLength(1);
  expect(a.state.active?.kind).toBe('I');expect(a.state.active?.origin.y).toBe(-1);
  expect(a.state.timers.gravityRemainingMs).toBe(537);
});
test('legal grounded rotation preserves the deadline and lifting rotation clears it',()=>{
  const a=fixture({active:{kind:'T',rotation:1,origin:{x:4,y:17},penetrator:false},timers:{grounded:true,lockRemainingMs:600,gravityRemainingMs:500}});
  const b=action(a,'rotateCW').state;expect(b.active?.rotation).toBe(2);expect(b.timers.lockRemainingMs).toBe(600);
  const c=action({...a,active:{...a.active!,rotation:3}},'rotateCW').state;
  expect(c.active?.rotation).toBe(0);expect(c.timers.grounded).toBe(false);expect(c.timers.lockRemainingMs).toBeNull();
});
