/** Public-engine fixtures check modern rules without relying on private sequence helpers. */
import { expect, test } from 'vitest';
import { advanceGame, cells, createGame, dispatchGame, projectGame } from '../../../src/domain';
import type { Capabilities, Cell, GameState, Settings } from '../../../src/models';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const caps:Capabilities=new Set(['modern']);
const empty=()=>Array.from({length:20},()=>Array<Cell>(10).fill(null));
function nextSpawn(state:GameState):GameState {
  return advanceGame({...state,board:empty(),active:{kind:'O',rotation:0,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:1,grounded:true}},1,settings,caps).state;
}
test('modern factory selects seven-bag; every complete bag contains exactly seven kinds',()=>{
  for(const seed of [1,123,4294967295]){
    let game=createGame(seed,'bag',settings,caps,'running');expect(game.sequence.mode).toBe('bag7');
    for(let bag=0;bag<4;bag++){
      const drawn=[];for(let n=0;n<7;n++){drawn.push(game.active!.kind);game=nextSpawn(game);}
      expect(drawn.sort()).toEqual(['I','J','L','O','S','T','Z']);
    }
  }
});
test('preview is non-consuming and identifies the subsequent spawn across bag boundaries',()=>{
  let game=createGame(123,'bag',settings,caps,'running');
  for(let n=0;n<16;n++){
    const before=JSON.stringify(game);const first=projectGame(game,settings,caps);expect(first.next).not.toBeNull();
    expect(projectGame(game,settings,caps)).toEqual(first);expect(JSON.stringify(game)).toBe(before);
    const next=nextSpawn(game);expect(next.active!.kind).toBe(first.next);game=next;
  }
});
test('modern sequences are deterministic, serializable and capability-scoped',()=>{
  const a=createGame(987,'bag',settings,caps,'running');expect(a).toEqual(createGame(987,'bag',settings,caps,'running'));
  expect(nextSpawn(JSON.parse(JSON.stringify(a)))).toEqual(nextSpawn(a));
  expect(createGame(987,'classic',settings,new Set(),'running').sequence.mode).toBe('uniform');
  expect(projectGame(a,{...settings,nextPreview:false},caps).next).toBeNull();
  expect(projectGame(a,settings,new Set()).next).toBeNull();
});

test('empty hold consumes next once; second hold is blocked until a lock',()=>{
  const a=createGame(123,'hold',settings,caps,'running');const original=a.active!.kind,next=projectGame(a,settings,caps).next;
  const b=dispatchGame(a,'hold',settings,caps).state;expect(b.held).toBe(original);expect(b.active!.kind).toBe(next);expect(b.holdUsed).toBe(true);
  expect(projectGame(b,settings,caps).held).toBe(original);expect(dispatchGame(b,'hold',settings,caps).state).toEqual(b);
  const afterLock=nextSpawn(b);expect(afterLock.holdUsed).toBe(false);expect(afterLock.held).toBe(original);
  expect(dispatchGame(afterLock,'hold',settings,caps).state.holdUsed).toBe(true);
});
test('nonempty hold swaps without consuming sequence and captures replacement policy',()=>{
  const a={...createGame(123,'hold',settings,caps,'running'),held:'I' as const,active:{kind:'O' as const,rotation:2 as const,origin:{x:2,y:15},penetrator:false}};
  const nextSettings={...settings,lockPolicy:'failed' as const,hardDropLock:'immediate' as const};
  const before=JSON.stringify(a);const b=dispatchGame(a,'hold',nextSettings,caps).state;
  expect(b.active).toEqual({kind:'I',rotation:0,origin:{x:3,y:-2},penetrator:false});expect(b.held).toBe('O');expect(b.sequence).toEqual(a.sequence);
  expect(b.piecePolicy).toEqual({lockPolicy:'failed',hardDropLock:'immediate'});expect(b.timers).toEqual({gravityRemainingMs:1000,lockRemainingMs:null,grounded:false});expect(JSON.stringify(a)).toBe(before);
});
test('hold is disabled by capability, setting, pause or active penetrator without discarding stored kind',()=>{
  const a={...createGame(123,'hold',settings,caps,'running'),held:'I' as const};
  expect(dispatchGame(a,'hold',{...settings,hold:false},caps).state).toEqual(a);
  expect(dispatchGame(a,'hold',settings,new Set()).state).toEqual(a);
  for(const changed of [{...a,status:'paused' as const},{...a,active:{...a.active!,penetrator:true}}])expect(dispatchGame(changed,'hold',settings,caps).state).toEqual(changed);
  expect(projectGame(a,{...settings,hold:false},caps).held).toBe('I');
});
test('held replacement blocked above the top ends safely with one game-over event',()=>{
  const board=empty();board[0]=Array<Cell>(10).fill('J');const a={...createGame(123,'hold',settings,caps,'running'),board,held:'I' as const};
  const b=dispatchGame(a,'hold',settings,caps).state;expect(b.holdUsed).toBe(true);expect(b.active!.kind).toBe('I');const c=advanceGame(b,1000,settings,caps);
  expect(c.state.status).toBe('gameover');expect(c.state.board).toEqual(board);expect(c.events.filter(e=>e.type==='gameOver')).toHaveLength(1);
  expect(advanceGame(c.state,5000,settings,caps).events).toEqual([]);
});

function pose(kind:'I'|'T'|'O',rotation:0|1|2|3,x:number,y:number):GameState {
  return {...createGame(123,'kicks',settings,caps,'running'),board:empty(),active:{kind,rotation,origin:{x,y},penetrator:false}};
}
test('I wall and floor rotations use the first valid ordered kick',()=>{
  const wall=pose('I',1,-2,5);expect(dispatchGame(wall,'rotateCW',settings,caps).state.active).toEqual({kind:'I',rotation:2,origin:{x:0,y:5},penetrator:false});
  const floor={...pose('I',0,3,18),timers:{gravityRemainingMs:700,lockRemainingMs:600,grounded:true}};
  const rotated=dispatchGame(floor,'rotateCW',settings,caps).state;expect(rotated.active!.origin).toEqual({x:3,y:16});expect(rotated.active!.rotation).toBe(1);expect(rotated.timers.lockRemainingMs).toBe(600);
});
test.each(['rotateCW','rotateCCW'] as const)('%s tries the left kick before an also-valid right kick',direction=>{
  const board=empty();board[7]![4]='J';const a={...pose('T',0,3,5),board,timers:{gravityRemainingMs:700,lockRemainingMs:600,grounded:true}};
  const b=dispatchGame(a,direction,settings,caps).state;expect(b.active!.origin).toEqual({x:2,y:5});expect(b.active!.rotation).toBe(direction==='rotateCW'?1:3);
  if(direction==='rotateCW')expect(b.timers.lockRemainingMs).toBe(600);else expect(b.timers.lockRemainingMs).toBeNull();
});
test('a fully blocked rotation preserves pose and deadline; O remains unchanged',()=>{
  const a=pose('T',0,3,5);const board=Array.from({length:20},()=>Array<Cell>(10).fill('J'));for(const {x,y}of cells(a.active!))board[y]![x]=null;
  const blocked={...a,board,timers:{gravityRemainingMs:700,lockRemainingMs:600,grounded:true}};
  const result=dispatchGame(blocked,'rotateCW',settings,caps).state;expect(result.active).toEqual(a.active);expect(result.timers).toEqual(blocked.timers);
  const square=pose('O',0,4,18);expect(dispatchGame(square,'rotateCCW',settings,caps).state.active).toEqual(square.active);
});
