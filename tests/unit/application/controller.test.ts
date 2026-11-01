/** A controllable monotonic clock checks command/frame ordering through the public service. */
import { expect, test } from 'vitest';
import { createGame } from '../../../src/domain';
import { createController } from '../../../src/application';
import type { AppState, Capabilities, Settings } from '../../../src/models';
import type { PlatformPorts } from '../../../src/platform/ports';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const caps:Capabilities=new Set();
function setup(initial?:AppState,capabilities:Capabilities=caps){
  let time=0,id=0,suspend=()=>{},unbinds=0,writes=0;
  const ports:PlatformPorts={now:()=>time,utcNow:()=> '2026-11-01T00:00:00.000Z',newId:()=>`run-${++id}`,newSeed:()=>123,
    readSettings:async()=>({ok:true,value:{query:{},saved:{}}}),commitSettings:async()=>{writes++;return {ok:true,value:undefined};},download:async()=>({ok:true,value:undefined}),loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async()=>({ok:true,value:undefined}),bindLifecycle:fn=>{suspend=fn;return()=>{unbinds++;}}};
  const app=initial??{game:createGame(1,'idle',settings,capabilities,'idle'),settings,results:[],completedRunId:null};
  const c=createController(app,ports,capabilities);
  return {c,at:(n:number)=>{time=n;},blur:()=>suspend(),unbinds:()=>unbinds,writes:()=>writes};
}
test('start creates a fresh run, pause/resume preserves it, restart replaces its ID',()=>{
  const a=setup();expect(a.c.view().state.game.status).toBe('idle');a.c.start();
  const id=a.c.view().state.game.runId;expect(id).toBe('run-1');expect(a.c.view().state.game.status).toBe('running');
  a.c.pause();expect(a.c.view().state.game.status).toBe('paused');a.c.resume();expect(a.c.view().state.game.runId).toBe(id);
  a.c.start();expect(a.c.view().state.game.runId).toBe('run-2');
});
test('input between frames accounts elapsed time once',()=>{
  const a=setup();a.c.start();a.at(500);a.c.tick();expect(a.c.view().state.game.timers.gravityRemainingMs).toBe(500);
  a.at(700);a.c.action('left');expect(a.c.view().state.game.timers.gravityRemainingMs).toBe(300);
  a.at(1000);a.c.tick();expect(a.c.view().state.game.active?.origin.y).toBe(-1);
  expect(a.c.view().state.game.timers.gravityRemainingMs).toBe(1000);
});
test('pause and resume discard all inactive wall time',()=>{
  const a=setup();a.c.start();a.at(250);a.c.pause();expect(a.c.view().state.game.timers.gravityRemainingMs).toBe(750);
  a.at(10000);a.c.tick();a.c.resume();a.at(10250);a.c.tick();
  expect(a.c.view().state.game.timers.gravityRemainingMs).toBe(500);
});
test('input arriving at a lock deadline cannot rescue the expired piece',()=>{
  const g=createGame(123,'grounded',settings,caps,'running');
  const game={...g,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:100,grounded:true}};
  const a=setup({game,settings,results:[],completedRunId:null});a.at(100);a.c.action('left');
  expect(a.c.view().state.game.board[19]![4]).toBe('O');expect(a.c.view().state.game.board[19]![5]).toBe('O');
});
test('views cannot mutate internal state and listeners unsubscribe idempotently',()=>{
  const a=setup();let calls=0;const stop=a.c.subscribe(()=>calls++);a.c.start();expect(calls).toBeGreaterThan(0);
  const snapshot=a.c.view();(snapshot.state.game as {score:number}).score=999;
  expect(a.c.view().state.game.score).toBe(0);stop();stop();const before=calls;a.c.pause();expect(calls).toBe(before);
});
test('lifecycle suspension pauses, disposal releases bindings and prevents writes',async()=>{
  const a=setup();a.c.start();a.at(50);a.blur();expect(a.c.view().state.game.status).toBe('paused');
  a.c.dispose();a.c.dispose();expect(a.unbinds()).toBe(1);a.c.start();expect(a.c.view().state.game.status).toBe('paused');
  expect((await a.c.save('json')).ok).toBe(false);
});

test('controller hard drop accounts preceding time once and preserves the full grounding interval',()=>{
  const modern:Capabilities=new Set(['modern']);const game={...createGame(123,'drop',settings,modern,'running'),active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:5},penetrator:false}};
  const a=setup({game,settings,results:[],completedRunId:null},modern);a.at(500);a.c.action('hardDrop');expect(a.c.view().state.game.score).toBe(26);expect(a.c.view().state.game.timers.lockRemainingMs).toBe(1000);
  a.at(1000);a.c.tick();expect(a.c.view().state.game.board.flat().filter(Boolean)).toHaveLength(0);expect(a.c.view().state.game.timers.lockRemainingMs).toBe(500);
  a.at(1500);a.c.tick();expect(a.c.view().state.game.board.flat().filter(Boolean)).toHaveLength(4);
});

test('controller activation spends once and keeps time/settled board coherent through overlap',()=>{
  const enabled:Capabilities=new Set(['modern','penetrator']);const board=Array.from({length:20},()=>Array<null|'J'>(10).fill(null));board[8]![4]='J';board[8]![5]='J';
  const game={...createGame(123,'pen',settings,enabled,'running'),board,bonuses:1,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:5},penetrator:false}};
  const a=setup({game,settings,results:[],completedRunId:null},enabled);a.at(500);a.c.action('penetrator');expect(a.c.view().state.game.bonuses).toBe(0);expect(a.c.view().state.game.active!.penetrator).toBe(true);expect(a.c.view().state.game.timers.gravityRemainingMs).toBe(500);
  a.at(1000);a.c.tick();a.c.action('softDrop');expect(a.c.view().state.game.active!.origin.y).toBe(7);expect(a.c.view().state.game.board).toEqual(board);expect(a.c.view().state.game.timers.lockRemainingMs).toBeNull();
});

const configurable:Capabilities=new Set(['modern','penetrator','settings']);
test('session settings change current action/visibility immediately and retain held kind without persistence',async()=>{
 const game={...createGame(123,'settings',settings,configurable,'running'),held:'I' as const};
 const a=setup({game,settings,results:[],completedRunId:null},configurable);
 expect(await a.c.setSettings({ghost:'hide',nextPreview:false,hardDrop:false,hold:false})).toEqual({ok:true,value:undefined});
 const selected=a.c.view();expect(selected.ghost).toBeNull();expect(selected.next).toBeNull();expect(selected.held).toBe('I');
 a.c.action('hardDrop');a.c.action('hold');expect(a.c.view().state.game).toEqual(game);
 a.c.start();expect(a.c.view().state.settings).toEqual(selected.state.settings);expect(a.writes()).toBe(0);
});
test('selected policies leave grounded deadline/current policy intact and held replacement captures next policies',async()=>{
 const game={...createGame(123,'settings',settings,configurable,'running'),held:'I' as const,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:300,lockRemainingMs:200,grounded:true}};
 const a=setup({game,settings,results:[],completedRunId:null},configurable);a.at(50);
 expect((await a.c.setSettings({lockPolicy:'failed',hardDropLock:'immediate'})).ok).toBe(true);
 expect(a.c.view().state.game.piecePolicy).toEqual(game.piecePolicy);expect(a.c.view().state.game.timers.lockRemainingMs).toBe(150);
 a.c.action('hold');expect(a.c.view().state.game.active!.kind).toBe('I');expect(a.c.view().state.game.piecePolicy).toEqual({lockPolicy:'failed',hardDropLock:'immediate'});
 a.c.action('hardDrop');expect(a.c.view().state.game.board.flat().filter(Boolean)).toHaveLength(4);
});
test('every invalid typed patch rejects atomically before clock accounting or storage effects',async()=>{
 const a=setup(undefined,configurable);a.c.start();a.at(500);const before=a.c.view().state;
 for(const patch of [null,[],{hold:false,ghost:'bad'},{hardDrop:'false'},{extra:true}]){
  const result=await a.c.setSettings(patch as never);expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('invalid-data');expect(a.c.view().state).toEqual(before);
 }
 let read=false;const patch=Object.defineProperty({},'hold',{enumerable:true,get(){read=true;throw Error('no');}});
 expect((await a.c.setSettings(patch)).ok).toBe(false);expect(read).toBe(false);expect(a.writes()).toBe(0);
});
test('reentrant setting edits serialize coherent views and resolve after their queued operation',async()=>{
 const a=setup(undefined,configurable);let nested:ReturnType<typeof a.c.setSettings>|undefined,queued=false;
 a.c.subscribe(view=>{if(!view.state.settings.hold&&!queued){queued=true;nested=a.c.setSettings({nextPreview:false});expect(a.c.view().state.settings.nextPreview).toBe(true);}});
 expect((await a.c.setSettings({hold:false})).ok).toBe(true);expect((await nested!).ok).toBe(true);expect(a.c.view().state.settings).toEqual({...settings,hold:false,nextPreview:false});
});
test('disposal cancels a reentrant queued setting edit and resolves its promise without writes',async()=>{
 const a=setup(undefined,configurable);let nested:ReturnType<typeof a.c.setSettings>|undefined,queued=false;
 a.c.subscribe(view=>{if(!view.state.settings.hold&&!queued){queued=true;nested=a.c.setSettings({nextPreview:false});a.c.dispose();}});
 await a.c.setSettings({hold:false});expect((await nested!).ok).toBe(false);expect(a.c.view().state.settings.nextPreview).toBe(true);expect((await a.c.setSettings({hold:true})).ok).toBe(false);expect(a.writes()).toBe(0);
});
test('settings capability gates edits even with valid stored defaults',async()=>{
 const a=setup();expect((await a.c.setSettings({hold:false})).ok).toBe(false);expect(a.c.view().state.settings).toEqual(settings);
});
test('ordinary lock captures selected policies on the next spawn without resetting the current deadline',async()=>{
 const game={...createGame(123,'policies',settings,configurable,'running'),active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:200,grounded:true}};
 const a=setup({game,settings,results:[],completedRunId:null},configurable);a.at(50);await a.c.setSettings({lockPolicy:'failed',hardDropLock:'immediate'});
 a.at(199);a.c.tick();expect(a.c.view().state.game.board.flat().filter(Boolean)).toHaveLength(0);expect(a.c.view().state.game.timers.lockRemainingMs).toBe(1);
 a.at(200);a.c.tick();expect(a.c.view().state.game.board.flat().filter(Boolean)).toHaveLength(4);expect(a.c.view().state.game.piecePolicy).toEqual({lockPolicy:'failed',hardDropLock:'immediate'});
});
