/** A controllable monotonic clock checks command/frame ordering through the public service. */
import { expect, test } from 'vitest';
import { createGame } from '../../../src/domain';
import { createController } from '../../../src/application';
import type { AppState, Capabilities, Settings } from '../../../src/models';
import type { PlatformPorts } from '../../../src/platform/ports';
const settings:Settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true};
const caps:Capabilities=new Set();
function setup(initial?:AppState){
  let time=0,id=0,suspend=()=>{},unbinds=0;
  const ports:PlatformPorts={now:()=>time,utcNow:()=> '2026-11-01T00:00:00.000Z',newId:()=>`run-${++id}`,newSeed:()=>123,
    readSettings:async()=>({ok:true,value:{query:{},saved:{}}}),commitSettings:async()=>({ok:true,value:undefined}),download:async()=>({ok:true,value:undefined}),loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async()=>({ok:true,value:undefined}),bindLifecycle:fn=>{suspend=fn;return()=>{unbinds++;}}};
  const app=initial??{game:createGame(1,'idle',settings,caps,'idle'),settings,results:[],completedRunId:null};
  const c=createController(app,ports,caps);
  return {c,at:(n:number)=>{time=n;},blur:()=>suspend(),unbinds:()=>unbinds};
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
