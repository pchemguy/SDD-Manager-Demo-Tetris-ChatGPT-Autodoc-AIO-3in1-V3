import {test,expect} from 'vitest';
import {createController} from '../../../src/application';
import {coordinateSidebar} from '../../../src/platform/extension/controller';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import {CAPABILITIES} from '../../../src/capabilities';
import type {AppState,Outcome} from '../../../src/models';
import type {PlatformPorts} from '../../../src/platform/ports';
const flush=async()=>{for(let n=0;n<30;n++)await Promise.resolve();};
function setup(warning:any=null){let time=0,fail=false,released=false;const writes:AppState[]=[];const ports:PlatformPorts={now:()=>time,utcNow:()=> '2026-11-02T00:00:00Z',newId:()=> 'run',newSeed:()=>123,readSettings:async()=>({ok:true,value:{query:{},saved:{}}}),commitSettings:async()=>({ok:true,value:undefined}),download:async()=>({ok:true,value:undefined}),loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async state=>{if(fail)return {ok:false,error:{code:'checkpoint-failed',message:'Storage failed; last state not acknowledged.'}};writes.push(structuredClone(state));return {ok:true,value:undefined};},bindLifecycle:()=>()=>{}};
 const base=createController({game:createGame(1,'idle',DEFAULT_SETTINGS,CAPABILITIES,'idle'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null},ports,CAPABILITIES);
 const c=coordinateSidebar(base,{ports,warning,release:async()=>{released=true;}});return{c,writes,time:(n:number)=>{time=n;},fail:()=>{fail=true;},released:()=>released};}
test('commands checkpoint immediately, active timer-only ticks are bounded to 100 ms',async()=>{
 const a=setup();await flush();a.c.start();await a.c.flushCheckpoint();expect(a.writes.at(-1)?.game.status).toBe('running');const count=a.writes.length;
 for(let t=10;t<100;t+=10){a.time(t);a.c.tick();}await flush();expect(a.writes.length).toBe(count);
 a.time(100);a.c.tick();await a.c.flushCheckpoint();expect(a.writes.length).toBe(count+1);expect(a.writes.at(-1)?.game.timers.gravityRemainingMs).toBe(900);
 a.time(110);a.c.action('left');await a.c.flushCheckpoint();expect(a.writes.at(-1)?.game.active?.origin.x).toBe(2);expect(a.writes.at(-1)?.game.timers.gravityRemainingMs).toBe(890);
});
test('checkpoint failure pauses with sticky feedback and disposal releases the writer',async()=>{
 const a=setup();await flush();a.fail();a.c.start();expect((await a.c.flushCheckpoint()).ok).toBe(false);await flush();expect(a.c.view().state.game.status).toBe('paused');expect(a.c.view().error?.code).toBe('checkpoint-failed');
 a.c.resume();await flush();expect(a.c.view().state.game.status).toBe('paused');a.c.dispose();await flush();expect(a.released()).toBe(true);
});
test('checkpoint queue preserves every command snapshot until its acknowledgement',async()=>{
 const a=setup();await flush();a.c.start();a.c.action('left');a.c.action('left');a.c.action('right');await a.c.flushCheckpoint();
 expect(a.writes.filter(s=>s.game.status==='running').map(s=>s.game.active?.origin.x)).toEqual([3,2,1,2]);
 a.c.dispose();await flush();
});

test('startup corrupt-checkpoint warning does not mask later controller errors',async()=>{
 const a=setup({code:'invalid-data',message:'Corrupt checkpoint discarded.'});await flush();expect(a.c.view().error?.message).toContain('discarded');
 await a.c.setSettings({ghost:'invalid'} as any);expect(a.c.view().error?.message).not.toContain('discarded');expect(a.c.view().error?.code).toBe('invalid-data');
});
