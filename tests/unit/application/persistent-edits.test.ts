/** Acknowledged effects and a controlled clock exercise the public controller queue. */
import {expect,test} from 'vitest';
import {createController,type Controller} from '../../../src/application';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {AppState,Capabilities,Outcome,RawSettings,SettingsTransaction} from '../../../src/models';
import type {PlatformPorts} from '../../../src/platform/ports';
const caps:Capabilities=new Set(['modern','penetrator','settings','persistentSettings']);
const ok:Outcome<void>={ok:true,value:undefined};
const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
function deferred(){let done!:(value:Outcome<void>)=>void;const promise=new Promise<Outcome<void>>(resolve=>{done=resolve;});return{promise,done};}
async function setup(edit:(tx:SettingsTransaction)=>Promise<Outcome<void>>=async()=>ok,options:{initial?:AppState;query?:RawSettings;autoStart?:boolean;beforeReady?:(c:Controller)=>void}={}){
 let time=0,id=0;const edits:SettingsTransaction[]=[];
 const ports:PlatformPorts={now:()=>time,utcNow:()=> '2026-11-01T00:00:00.000Z',newId:()=>`run-${++id}`,newSeed:()=>123,readSettings:async()=>({ok:true,value:{query:options.query??{},saved:{}}}),commitSettings:async tx=>{if(tx.reason==='startup')return ok;edits.push(structuredClone(tx));return edit(tx);},download:async()=>ok,loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async()=>ok,bindLifecycle:()=>()=>{}};
 const initial=options.initial??{game:createGame(123,'idle',DEFAULT_SETTINGS,caps,'idle'),settings:DEFAULT_SETTINGS,results:[{id:'retained',score:7,timestamp:'2026-11-01T00:00:00Z'}],completedRunId:null};const c=createController(initial,ports,caps);options.beforeReady?.(c);await flush();if(!options.initial&&options.autoStart!==false)c.start();return{c,edits,at:(n:number)=>{time=n;}};
}
test('selected state changes only after successful persistence acknowledgement',async()=>{
 const pending=deferred(),a=await setup(async()=>pending.promise),before=a.c.view().state,result=a.c.setSettings({hold:false,ghost:'hide'});expect(a.edits).toHaveLength(1);expect(a.c.view().state).toEqual(before);pending.done(ok);expect(await result).toEqual(ok);expect(a.c.view().state.settings).toEqual({...DEFAULT_SETTINGS,hold:false,ghost:'hide'});expect(a.c.view().state.game).toEqual(before.game);expect(a.c.view().state.results).toEqual(before.results);
});
test('failed acknowledged edit retains game results and settings and its error survives Restart',async()=>{
 const a=await setup(async()=>({ok:false,error:{code:'persistence-failed',message:'Previous values restored.'}})),before=a.c.view().state;a.at(500);const result=await a.c.setSettings({hold:false});expect(result.ok).toBe(false);expect(a.c.view().state).toEqual(before);expect(a.c.view().error?.code).toBe('persistence-failed');a.c.start();expect(a.c.view().error?.code).toBe('persistence-failed');expect(a.c.view().state.results).toEqual(before.results);
});
test('thrown persistence failure becomes a typed rejection without swapping selected state',async()=>{
 const a=await setup(async()=>{throw Error('host blocked');}),before=a.c.view().state,result=await a.c.setSettings({ghost:'hide'});expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('persistence-failed');expect(a.c.view().state).toEqual(before);
});
test('queued edits never overlap effects and the next transaction includes the previous successful selection',async()=>{
 const first=deferred(),second=deferred();let calls=0,active=0,max=0;const a=await setup(async()=>{const index=calls++;active++;max=Math.max(max,active);const result=await(index===0?first.promise:second.promise);active--;return result;});
 const p1=a.c.setSettings({hold:false}),p2=a.c.setSettings({nextPreview:false});await flush();expect(a.edits).toHaveLength(1);expect(a.c.view().state.settings).toEqual(DEFAULT_SETTINGS);first.done(ok);expect(await p1).toEqual(ok);await flush();expect(a.edits).toHaveLength(2);expect(a.edits[1]).toMatchObject({previous:{...DEFAULT_SETTINGS,hold:false},next:{...DEFAULT_SETTINGS,hold:false,nextPreview:false},writeKeys:['nextPreview'],reason:'edit'});second.done(ok);expect(await p2).toEqual(ok);expect(max).toBe(1);expect(a.c.view().state.settings).toEqual({...DEFAULT_SETTINGS,hold:false,nextPreview:false});
});
test('invalid and empty patches perform no persistence and do not clear a startup warning',async()=>{
 const a=await setup(undefined,{query:{hold:'BAD'}}),before=a.c.view().state;expect(a.c.view().error?.message).toContain('hold');const invalid=await a.c.setSettings({hold:false,ghost:'BAD'} as never);expect(invalid.ok).toBe(false);expect(a.edits).toEqual([]);expect(a.c.view().state).toEqual(before);a.c.start();const warning=a.c.view().error;expect(await a.c.setSettings({})).toEqual(ok);expect(a.edits).toEqual([]);expect(a.c.view().error).toEqual(warning);
});
test('pending policy edits preserve current deadline until acknowledgement and held replacement captures the accepted policies',async()=>{
 const pending=deferred(),game={...createGame(123,'grounded',DEFAULT_SETTINGS,caps,'running'),held:'I' as const,active:{kind:'O' as const,rotation:0 as const,origin:{x:4,y:18},penetrator:false},timers:{gravityRemainingMs:1000,lockRemainingMs:1000,grounded:true}};
 const a=await setup(async()=>pending.promise,{initial:{game,settings:DEFAULT_SETTINGS,results:[],completedRunId:null}}),observed:number[]=[];a.c.subscribe(view=>{if(view.state.settings.lockPolicy==='failed'&&view.state.game.active?.kind==='O')observed.push(view.state.game.timers.lockRemainingMs!);});
 const result=a.c.setSettings({lockPolicy:'failed',hardDropLock:'immediate'});a.c.action('hold');expect(a.c.view().state.game).toEqual(game);a.at(250);pending.done(ok);expect(await result).toEqual(ok);await flush();expect(observed).toEqual([750]);expect(a.c.view().state.game.active!.kind).toBe('I');expect(a.c.view().state.game.piecePolicy).toEqual({lockPolicy:'failed',hardDropLock:'immediate'});
});
test('disposal settles active and queued setting promises and prevents late selected-state commits',async()=>{
 const pending=deferred(),a=await setup(async()=>pending.promise),before=a.c.view().state,p1=a.c.setSettings({hold:false}),p2=a.c.setSettings({nextPreview:false});a.c.start();a.c.dispose();expect((await p1).ok).toBe(false);expect((await p2).ok).toBe(false);pending.done(ok);await flush();expect(a.edits).toHaveLength(1);expect(a.c.view().state).toEqual(before);
});
test('reentrant edit notifications remain coherent and serialize their acknowledged effects',async()=>{
 const a=await setup();let nested:Promise<Outcome<void>>|undefined,queued=false;a.c.subscribe(view=>{if(!view.state.settings.hold&&!queued){queued=true;nested=a.c.setSettings({nextPreview:false});expect(a.c.view().state.settings.nextPreview).toBe(true);}});expect(await a.c.setSettings({hold:false})).toEqual(ok);expect(await nested!).toEqual(ok);expect(a.edits).toHaveLength(2);expect(a.c.view().state.settings).toEqual({...DEFAULT_SETTINGS,hold:false,nextPreview:false});
});
test('a resolved setting promise releases the queue before a subsequent synchronous command',async()=>{
 const a=await setup(async()=>{await Promise.resolve();return ok;});expect(await a.c.setSettings({hold:false})).toEqual(ok);a.c.pause();expect(a.c.view().state.game.status).toBe('paused');expect(a.edits).toHaveLength(1);
});
test('successful acknowledged edit clears the startup warning across later Restart',async()=>{
 const a=await setup(undefined,{query:{hold:'BAD'}});expect(a.c.view().error?.message).toContain('hold');expect(await a.c.setSettings({hold:false})).toEqual(ok);expect(a.c.view().error).toBeNull();a.c.start();expect(a.c.view().error).toBeNull();
});
test('startup notification subscribers observe one coherent view before a reentrant Start runs',async()=>{
 const statuses:string[]=[];let started=false;const a=await setup(undefined,{query:{hold:'false'},autoStart:false,beforeReady:c=>{
  c.subscribe(view=>{if(!view.state.settings.hold&&!started){started=true;c.start();}});c.subscribe(view=>{if(!view.state.settings.hold)statuses.push(view.state.game.status);});
 }});expect(statuses[0]).toBe('idle');expect(a.c.view().state.game.status).toBe('running');
});
