/** Public controller startup gates commands and synchronizes only valid explicit keys. */
import {expect,test} from 'vitest';
import {createController} from '../../../src/application';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {AppState,Capabilities,Outcome,RawSettings,SettingsTransaction} from '../../../src/models';
import type {PlatformPorts} from '../../../src/platform/ports';
const caps:Capabilities=new Set(['modern','settings','persistentSettings']);
const flush=async()=>{for(let n=0;n<8;n++)await Promise.resolve();};
function setup(read:()=>Promise<Outcome<{query:RawSettings;saved:RawSettings}>>,commit:(tx:SettingsTransaction)=>Promise<Outcome<void>>=async()=>({ok:true,value:undefined})){
 const commits:SettingsTransaction[]=[],checkpoints:AppState[]=[];let suspend=()=>{};
 const ports:PlatformPorts={now:()=>0,utcNow:()=> '2026-11-01T00:00:00.000Z',newId:()=> 'run',newSeed:()=>123,readSettings:read,commitSettings:async tx=>{commits.push(structuredClone(tx));return commit(tx);},download:async()=>({ok:true,value:undefined}),loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async state=>{checkpoints.push(state);return {ok:true,value:undefined};},bindLifecycle:fn=>{suspend=fn;return()=>{};}};
 const c=createController({game:createGame(123,'idle',DEFAULT_SETTINGS,caps,'idle'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null},ports,caps);return{c,commits,checkpoints,suspend:()=>suspend()};
}
test('startup resolves all sources and persists explicit defaults/nondefaults without rewriting omissions',async()=>{
 const a=setup(async()=>({ok:true,value:{query:{ghost:'show',hold:'false',hardDrop:'FALSE'},saved:{ghost:'hide',nextPreview:'false',hardDrop:'false',lockPolicy:'failed'}}}));await flush();
 expect(a.c.view().state.settings).toEqual({...DEFAULT_SETTINGS,hold:false,nextPreview:false,hardDrop:false,lockPolicy:'failed'});expect(a.commits).toHaveLength(1);expect(a.commits[0]).toMatchObject({previous:DEFAULT_SETTINGS,next:a.c.view().state.settings,writeKeys:['ghost','hold'],reason:'startup'});expect(a.c.view().error?.message).toContain('hardDrop');
 a.c.start();expect(a.c.view().state.game.piecePolicy.lockPolicy).toBe('failed');
});
test('commands wait for acknowledged startup synchronization and do not create a default-policy run first',async()=>{
 let acknowledge!:(result:Outcome<void>)=>void;const pending=new Promise<Outcome<void>>(resolve=>{acknowledge=resolve;});const a=setup(async()=>({ok:true,value:{query:{lockPolicy:'failed'},saved:{}}}),async()=>pending);a.c.start();await flush();expect(a.c.view().state.game.status).toBe('idle');
 acknowledge({ok:true,value:undefined});await flush();expect(a.c.view().state.game.status).toBe('running');expect(a.c.view().state.game.piecePolicy.lockPolicy).toBe('failed');
});
test('failed startup synchronization keeps resolved page settings usable and reports non-persistence',async()=>{
 const a=setup(async()=>({ok:true,value:{query:{ghost:'hide',hold:'false',hardDrop:'FALSE'},saved:{}}}),async()=>({ok:false,error:{code:'persistence-failed',message:'Storage unavailable.'}}));await flush();expect(a.c.view().state.settings).toMatchObject({ghost:'hide',hold:false});expect(a.c.view().error?.code).toBe('persistence-failed');expect(a.c.view().error?.message).toContain('hardDrop');a.c.start();expect(a.c.view().state.game.status).toBe('running');expect(a.c.view().error?.code).toBe('persistence-failed');
});
test('failed or thrown reads retain usable defaults and surface typed persistence errors',async()=>{
 for(const read of [async()=>({ok:false,error:{code:'persistence-failed',message:'Read failed.'}} as const),async()=>{throw Error('blocked');}]){
  const a=setup(read);await flush();expect(a.c.view().state.settings).toEqual(DEFAULT_SETTINGS);expect(a.c.view().error?.code).toBe('persistence-failed');expect(a.commits).toEqual([]);a.c.start();expect(a.c.view().state.game.status).toBe('running');
 }
});
test('disposal during pending startup read prevents subsequent synchronization/live writes',async()=>{
 let done!:(result:Outcome<{query:RawSettings;saved:RawSettings}>)=>void;const pending=new Promise<Outcome<{query:RawSettings;saved:RawSettings}>>(resolve=>{done=resolve;});const a=setup(async()=>pending);a.c.start();const setting=a.c.setSettings({hold:false});a.c.dispose();expect((await setting).ok).toBe(false);
 done({ok:true,value:{query:{ghost:'hide'},saved:{}}});await flush();expect(a.commits).toEqual([]);expect(a.c.view().state.settings).toEqual(DEFAULT_SETTINGS);expect(a.c.view().state.game.status).toBe('idle');
});
test('suspension queued during startup checkpoints the actually paused resolved session',async()=>{
 let done!:(result:Outcome<void>)=>void;const pending=new Promise<Outcome<void>>(resolve=>{done=resolve;});const a=setup(async()=>({ok:true,value:{query:{hold:'false'},saved:{}}}),async()=>pending);a.c.start();a.suspend();expect(a.checkpoints).toEqual([]);
 done({ok:true,value:undefined});await flush();expect(a.checkpoints).toHaveLength(1);expect(a.checkpoints[0]!.game.status).toBe('paused');expect(a.checkpoints[0]!.settings.hold).toBe(false);
});
