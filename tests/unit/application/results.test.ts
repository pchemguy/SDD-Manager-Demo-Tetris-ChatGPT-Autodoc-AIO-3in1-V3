import {expect,test} from 'vitest';
import {createController} from '../../../src/application';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {AppState,Capabilities,ScoreResult} from '../../../src/models';
import type {PlatformPorts} from '../../../src/platform/ports';
const settings={...DEFAULT_SETTINGS,hardDropLock:'immediate' as const},caps:Capabilities=new Set(['modern','leaderboard']);
function setup(results:readonly ScoreResult[]=[],completedRunId:string|null=null,enabled=caps,lockPolicy:'interval'|'failed'='interval'){
 let time=0,date='2026-11-01T14:00:00.123Z',utcReads=0,ids=0,writes=0;
 const configured={...settings,lockPolicy};
 const board=Array.from({length:20},()=>Array<null|'J'>(10).fill(null));board[1]!.fill('J');
 const game={...createGame(123,'run-original',configured,enabled,'running'),board,score:321,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:-1},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:100,grounded:true}};
 const initial:AppState={game,settings:configured,results,completedRunId};
 const ports:PlatformPorts={now:()=>time,utcNow:()=>{utcReads++;return date;},newId:()=>`fresh-${++ids}`,newSeed:()=>123,readSettings:async()=>({ok:true,value:{query:{},saved:{}}}),commitSettings:async()=>{writes++;return {ok:true,value:undefined};},download:async()=>({ok:true,value:undefined}),loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async()=>{writes++;return {ok:true,value:undefined};},bindLifecycle:()=>()=>{}};
 const controller=createController(initial,ports,enabled);return {controller,initial,ports,at:(value:number)=>{time=value;},date:(value:string)=>{date=value;},utcReads:()=>utcReads,writes:()=>writes,ids:()=>ids};
}
test('completion records stable run ID/final score and samples UTC exactly once, never rendering time',()=>{
 const a=setup();a.at(99);a.controller.tick();expect(a.controller.view().state.results).toEqual([]);expect(a.utcReads()).toBe(0);
 a.date('2026-11-02T03:04:05.678Z');a.at(100);a.controller.tick();expect(a.controller.view().state.game.status).toBe('gameover');
 expect(a.controller.view().state.results).toEqual([{id:'run-original',score:321,timestamp:'2026-11-02T03:04:05.678Z'}]);expect(a.controller.view().state.completedRunId).toBe('run-original');expect(a.utcReads()).toBe(1);expect(a.ids()).toBe(0);
 for(let i=0;i<5;i++){a.at(1000+i);a.controller.tick();a.controller.action('hardDrop');a.controller.pause();a.controller.resume();a.controller.view();}
 expect(a.controller.view().state.results).toHaveLength(1);expect(a.utcReads()).toBe(1);expect(a.writes()).toBe(0);
});
test('command-triggered top-out records once through the same completion path',()=>{
 const a=setup([],null,caps,'failed');a.controller.action('softDrop');expect(a.controller.view().state.game.status).toBe('gameover');expect(a.controller.view().state.results).toEqual([{id:'run-original',score:321,timestamp:'2026-11-01T14:00:00.123Z'}]);expect(a.utcReads()).toBe(1);
});
test('running or paused restart abandons unfinished run and preserves earlier session history',()=>{
 const prior=[{id:'prior',score:999,timestamp:'2020-01-01T00:00:00Z'}];const a=setup(prior);a.controller.start();expect(a.controller.view().state.results).toEqual(prior);expect(a.controller.view().state.game.runId).toBe('fresh-1');
 a.controller.pause();a.controller.start();expect(a.controller.view().state.results).toEqual(prior);expect(a.controller.view().state.game.runId).toBe('fresh-2');expect(a.utcReads()).toBe(0);expect(a.writes()).toBe(0);
});
test('completed restart retains session results but a newly composed page begins empty',()=>{
 const a=setup();a.at(100);a.controller.tick();const results=a.controller.view().state.results;expect(results).toHaveLength(1);a.controller.start();expect(a.controller.view().state.results).toEqual(results);expect(a.controller.view().state.completedRunId).toBeNull();expect(a.controller.view().state.game.runId).toBe('fresh-1');
 const fresh=createController({...a.initial,game:createGame(1,'idle',settings,caps,'idle'),results:[],completedRunId:null},a.ports,caps);expect(fresh.view().state.results).toEqual([]);expect(a.writes()).toBe(0);a.controller.dispose();fresh.dispose();
});
test('previously recorded identity or completion marker cannot rewrite restored result/time',()=>{
 const prior=[{id:'run-original',score:1,timestamp:'0001-01-01T00:00:00Z'}];
 for(const a of [setup(prior),setup([], 'run-original')]){a.at(100);a.controller.tick();expect(a.controller.view().state.results).toEqual(a.initial.results);expect(a.utcReads()).toBe(0);expect(a.controller.view().state.completedRunId).toBe('run-original');}
});
test('completion ranks with retained results and remembers a run even if it falls outside top ten',()=>{
 const prior=Array.from({length:10},(_,i)=>({id:`prior-${i}`,score:1000+i,timestamp:'2026-01-01T00:00:00Z'}));const a=setup(prior);a.at(100);a.controller.tick();expect(a.controller.view().state.results.map(r=>r.id)).toEqual(['prior-9','prior-8','prior-7','prior-6','prior-5','prior-4','prior-3','prior-2','prior-1','prior-0']);expect(a.controller.view().state.completedRunId).toBe('run-original');a.controller.tick();expect(a.utcReads()).toBe(1);
});
test('unavailable leaderboard does not sample UTC or collect results',()=>{
 const a=setup([],null,new Set(['modern']));a.at(100);a.controller.tick();expect(a.controller.view().state.game.status).toBe('gameover');expect(a.controller.view().state.results).toEqual([]);expect(a.utcReads()).toBe(0);
});
