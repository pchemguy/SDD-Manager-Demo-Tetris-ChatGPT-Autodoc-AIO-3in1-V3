/** Lock-level fixtures independently establish line compaction, scoring and level effects. */
import { expect, test } from 'vitest';
import { advanceGame, dispatchGame } from '../../../src/domain';
import type { Capabilities, Cell, GameState, Settings } from '../../../src/models';
const settings: Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const caps:Capabilities=new Set();
function ready(clear:number,patch:Partial<GameState>={}):GameState {
  const board=Array.from({length:20},()=>Array<Cell>(10).fill(null));
  for(let y=20-clear;y<20;y++){
    board[y]=Array<Cell>(10).fill('J');
    if(clear<=2){board[y]![4]=null;board[y]![5]=null;}else board[y]![5]=null;
  }
  return {runId:'score-run',status:'running',board,
    active:clear<=2?{kind:'O',rotation:0,origin:{x:4,y:18},penetrator:false}:{kind:'I',rotation:1,origin:{x:3,y:16},penetrator:false},
    held:null,holdUsed:false,sequence:{rng:123,mode:'uniform',pending:['I']},score:0,lines:0,level:1,bonuses:0,
    timers:{gravityRemainingMs:99,lockRemainingMs:1,grounded:true},piecePolicy:{lockPolicy:'interval',hardDropLock:'general'},...patch};
}
test.each([[1,100],[2,300],[3,500],[4,800]])('clearing %i rows scores %i at level one',(count,points)=>{
  const result=advanceGame(ready(count),1,settings,caps);
  expect(result.state.score).toBe(points);expect(result.state.lines).toBe(count);
  expect(result.events.find(e=>e.type==='linesCleared')?.lines).toBe(count);
  expect(result.state.board).toHaveLength(20);expect(result.state.board.every(r=>r.length===10)).toBe(true);
});
test('compacts all rows together and preserves uncleared cells',()=>{
  const a=ready(1);const board=a.board.map(r=>[...r]);board[5]![0]='S';
  const result=advanceGame({...a,board},1,settings,caps).state;
  expect(result.board[6]![0]).toBe('S');expect(result.board[5]![0]).toBeNull();
  expect(result.board[19]![4]).toBe('O');expect(result.board[19]![5]).toBe('O');
  expect(result.board[0]!.every(c=>c===null)).toBe(true);
});
test('uses pre-clear level for points and new level for the next piece interval',()=>{
  const result=advanceGame(ready(1,{lines:9,level:1}),1,settings,caps).state;
  expect(result.score).toBe(100);expect(result.lines).toBe(10);expect(result.level).toBe(2);
  expect(result.timers.gravityRemainingMs).toBe(850);
  expect(advanceGame(ready(2,{lines:10,level:2}),1,settings,caps).state.score).toBe(600);
});
test('soft drop awards one point only when it actually moves',()=>{
  const a=ready(0,{active:{kind:'O',rotation:0,origin:{x:4,y:17},penetrator:false},timers:{gravityRemainingMs:37,lockRemainingMs:null,grounded:false},score:10});
  const b=dispatchGame(a,'softDrop',settings,caps).state;expect(b.score).toBe(11);
  const c=dispatchGame(b,'softDrop',settings,caps).state;expect(c.score).toBe(11);
  expect(advanceGame(c,1000,settings,caps).state.score).toBe(11);
});
test('score additions saturate at the maximum safe integer',()=>{
  const r=advanceGame(ready(4,{score:Number.MAX_SAFE_INTEGER-1}),1,settings,caps).state;
  expect(r.score).toBe(Number.MAX_SAFE_INTEGER);expect(Number.isSafeInteger(r.score)).toBe(true);
});
test('gravity interval reaches its minimum at high levels',()=>{
  const r=advanceGame(ready(1,{level:100,lines:999}),1,settings,caps).state;
  expect(r.level).toBe(101);expect(r.timers.gravityRemainingMs).toBe(100);
});
