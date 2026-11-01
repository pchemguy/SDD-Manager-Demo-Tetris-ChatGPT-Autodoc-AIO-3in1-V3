/** Literal hole/blocker fixtures protect penetrator reachability independently of ordinary falling. */
import { expect,test } from 'vitest';
import { advanceGame, canPlace, canTraverse, cells, createGame, dispatchGame, landing } from '../../../src/domain';
import type { Capabilities,Cell,GameState,Piece,PieceKind,Settings } from '../../../src/models';
const empty=()=>Array.from({length:20},()=>Array<Cell>(10).fill(null));
const piece:Piece={kind:'O',rotation:0,origin:{x:4,y:5},penetrator:true};
test('penetrator skips blockers and chooses the deepest non-overlapping hole even above an invalid floor',()=>{
  const board=empty();board[8]![4]='J';board[8]![5]='J';board[19]![4]='J';
  expect(landing(board,{...piece,penetrator:false})?.origin).toEqual({x:4,y:6});
  expect(landing(board,piece)?.origin).toEqual({x:4,y:17});
  board[18]![4]='J';expect(landing(board,piece)?.origin).toEqual({x:4,y:16});
});
test('traversal may overlap settled cells only when a valid final landing remains below',()=>{
  const board=empty();board[5]![4]='J';const before=JSON.stringify(board);
  expect(canPlace(board,piece,true)).toBe(false);expect(canTraverse(board,piece)).toBe(true);expect(canTraverse(board,{...piece,penetrator:false})).toBe(false);
  expect(landing(board,piece)?.origin).toEqual({x:4,y:18});expect(JSON.stringify(board)).toBe(before);
  for(let y=5;y<20;y++)board[y]![4]='J';expect(canTraverse(board,piece)).toBe(false);expect(landing(board,piece)).toBeNull();
});
test('invalid side/bottom bounds and missing full placements cannot be repaired by an upward search',()=>{
  const board=empty();expect(landing(board,{...piece,origin:{x:-1,y:5}})).toBeNull();expect(landing(board,{...piece,origin:{x:4,y:19}})).toBeNull();
  for(let y=0;y<20;y++)board[y]![4]='J';expect(landing(board,{...piece,origin:{x:4,y:-2}})).toBeNull();
  expect(canTraverse(board,{...piece,origin:{x:4,y:-2}})).toBe(false);
});
test('all shape rotations choose a wholly legal geometric floor on an empty board',()=>{
  for(const kind of ['I','J','L','O','S','T','Z'] as PieceKind[])for(const rotation of [0,1,2,3] as const){
    const p:Piece={kind,rotation,origin:{x:3,y:-2},penetrator:true};const maxLocalY=Math.max(...cells({...p,origin:{x:0,y:0}}).map(c=>c.y));
    const result=landing(empty(),p);expect(result?.origin.y).toBe(19-maxLocalY);expect(canPlace(empty(),result!,false)).toBe(true);
  }
});

const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const caps:Capabilities=new Set(['modern','penetrator']);
function game(patch:Partial<GameState>={}):GameState{return {...createGame(123,'pen',settings,caps,'running'),board:empty(),active:{...piece,penetrator:false},bonuses:2,timers:{gravityRemainingMs:37,lockRemainingMs:null,grounded:false},...patch};}
const action=(g:GameState,a:Parameters<typeof dispatchGame>[1])=>dispatchGame(g,a,settings,caps);
test('activation spends exactly one bonus, preserves state immutability and cannot be cancelled or repeated',()=>{
  const a=game(),before=JSON.stringify(a);const b=action(a,'penetrator');expect(b.state.active!.penetrator).toBe(true);expect(b.state.bonuses).toBe(1);expect(b.events.filter(e=>e.type==='bonusChanged')).toHaveLength(1);
  expect(action(b.state,'penetrator').state).toEqual(b.state);expect(action(b.state,'hold').state).toEqual(b.state);expect(JSON.stringify(a)).toBe(before);
});
test('activation rejects exhausted, unavailable, non-running and no-landing cases without spending',()=>{
  const a=game();expect(action({...a,bonuses:0},'penetrator').state).toEqual({...a,bonuses:0});expect(dispatchGame(a,'penetrator',settings,new Set(['modern'])).state).toEqual(a);
  for(const status of ['paused','idle','gameover'] as const)expect(action({...a,status},'penetrator').state).toEqual({...a,status});
  const board=empty();for(let y=0;y<20;y++)board[y]![4]='J';const blocked=game({board,active:{...piece,origin:{x:4,y:-2},penetrator:false}});expect(action(blocked,'penetrator').state).toEqual(blocked);
});
test('soft drop and gravity traverse intermediate overlap without changing settled cells',()=>{
  const board=empty();board[8]![4]='J';board[8]![5]='J';const a=game({board,active:{...piece,origin:{x:4,y:6},penetrator:false}});
  const b=action(a,'penetrator').state;const c=action(b,'softDrop').state;expect(c.active!.origin.y).toBe(7);expect(canPlace(board,c.active!,true)).toBe(false);expect(c.score).toBe(1);
  const d=advanceGame(c,37,settings,caps).state;expect(d.active!.origin.y).toBe(8);expect(d.active!.penetrator).toBe(true);expect(d.score).toBe(1);expect(d.board).toEqual(board);expect(d.timers.lockRemainingMs).toBeNull();
});
test('penetrator moves and rotations require a final landing at or below the candidate',()=>{
  const board=empty();for(let y=5;y<20;y++)board[y]![3]='J';const a=game({board,active:{...piece,penetrator:true}});
  expect(action(a,'left').state.active).toEqual(a.active);expect(action(a,'right').state.active!.origin.x).toBe(5);
  const barrier=empty();barrier[7]![4]='J';const t=game({board:barrier,active:{kind:'T',rotation:0,origin:{x:3,y:5},penetrator:true}});
  const rotated=action(t,'rotateCW').state.active!;expect(rotated.rotation).toBe(1);expect(rotated.origin).toEqual({x:3,y:5});expect(canPlace(barrier,rotated,true)).toBe(false);
});
test('activation clears a lifted deadline but never resets an unchanged final-ground deadline',()=>{
  const board=empty();board[8]![4]='J';board[8]![5]='J';const a=game({board,active:{...piece,origin:{x:4,y:6},penetrator:false},timers:{gravityRemainingMs:37,lockRemainingMs:200,grounded:true}});
  const b=action(a,'penetrator').state;expect(b.timers).toEqual({gravityRemainingMs:37,lockRemainingMs:null,grounded:false});
  const floor=game({active:{...piece,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:37,lockRemainingMs:200,grounded:true}});expect(action(floor,'penetrator').state.timers.lockRemainingMs).toBe(200);
});
