import {beforeEach,expect,test,vi} from 'vitest';
const codec=vi.hoisted(()=>({encode:vi.fn(),decode:vi.fn()}));
vi.mock('../../../src/files',()=>({encodeSnapshot:codec.encode,decodeSnapshot:codec.decode}));
import {createController} from '../../../src/application';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {AppState,InputFile,Outcome,PortableSnapshot,SettingsTransaction} from '../../../src/models';
import type {PlatformPorts} from '../../../src/platform/ports';
const candidate:PortableSnapshot={formatVersion:1,results:[{id:'imported',score:999,timestamp:'0001-01-01T00:00:00.1Z'}],settings:{...DEFAULT_SETTINGS,hold:false,lockPolicy:'failed'}};
const file:InputFile={name:'arbitrary-name.bin',bytes:new Uint8Array([123,125])};
const ok:Outcome<void>={ok:true,value:undefined};
const deferred=<T>()=>{let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done;});return {promise,resolve};};
beforeEach(()=>{codec.encode.mockReset().mockResolvedValue({ok:true,value:new Uint8Array([1,2,3])});codec.decode.mockReset().mockResolvedValue({ok:true,value:structuredClone(candidate)});});
async function setup(persistent=true,files=true){
 let time=0,downloads:InputFile[]=[],transactions:SettingsTransaction[]=[],committer=async(_tx:SettingsTransaction):Promise<Outcome<void>>=>ok;
 const capabilities:import('../../../src/models').Capabilities=new Set(['modern','settings',...(persistent?['persistentSettings' as const]:[]),...(files?['files' as const]:[])]);
 const state:AppState={game:{...createGame(123,'live-run',DEFAULT_SETTINGS,capabilities,'running'),score:11},settings:DEFAULT_SETTINGS,results:[{id:'prior',score:3,timestamp:'2026-01-01T00:00:00Z'}],completedRunId:null};
 const ports:PlatformPorts={now:()=>time,utcNow:()=> '2026-11-01T00:00:00.000Z',newId:()=> 'new-run',newSeed:()=>123,readSettings:async()=>({ok:true,value:{query:{},saved:{}}}),commitSettings:async tx=>{transactions.push(structuredClone(tx));return committer(tx);},download:async value=>{downloads.push(value);return ok;},loadCheckpoint:async()=>({ok:true,value:null}),writeCheckpoint:async()=>ok,bindLifecycle:()=>()=>{}};
 const controller=createController(state,ports,capabilities);await controller.setSettings({});transactions=[];
 return {controller,ports,at:(value:number)=>{time=value;},downloads:()=>downloads,transactions:()=>transactions,commit:(fn:typeof committer)=>{committer=fn;}};
}
test('Save pauses and serializes one selected/results snapshot excluding gameplay, then requests one named download',async()=>{
 const a=await setup();a.at(250);const result=await a.controller.save('json');expect(result.ok).toBe(true);expect(a.controller.view().state.game.status).toBe('paused');expect(a.controller.view().state.game.timers.gravityRemainingMs).toBe(750);
 const [snapshot,format,signal]=codec.encode.mock.calls[0]!;expect(snapshot).toEqual({formatVersion:1,results:a.controller.view().state.results,settings:DEFAULT_SETTINGS});expect(Object.keys(snapshot).sort()).toEqual(['formatVersion','results','settings']);expect(format).toBe('json');expect(signal).toBeInstanceOf(AbortSignal);expect(a.downloads()).toEqual([{name:'tetris-save.json',bytes:new Uint8Array([1,2,3])}]);expect(a.transactions()).toEqual([]);
 a.at(10000);a.controller.tick();expect(a.controller.view().state.game.timers.gravityRemainingMs).toBe(750);a.controller.resume();a.at(10250);a.controller.tick();expect(a.controller.view().state.game.timers.gravityRemainingMs).toBe(500);
});
test('Restore waits for complete decode and acknowledged all-six persistence before swapping results/settings together',async()=>{
 const a=await setup(),decoded=deferred<Outcome<PortableSnapshot>>(),saved=deferred<Outcome<void>>();codec.decode.mockReturnValueOnce(decoded.promise);a.commit(()=>saved.promise);a.at(250);const before=a.controller.view().state,pending=a.controller.restore(file);expect(a.transactions()).toEqual([]);expect(a.controller.view().state.settings).toEqual(before.settings);expect(a.controller.view().state.game.status).toBe('paused');
 decoded.resolve({ok:true,value:structuredClone(candidate)});await vi.waitFor(()=>expect(a.transactions()).toHaveLength(1));expect(a.transactions()[0]).toEqual({previous:DEFAULT_SETTINGS,next:candidate.settings,writeKeys:['ghost','hardDrop','nextPreview','hardDropLock','lockPolicy','hold'],reason:'restore'});expect(a.controller.view().state.results).toEqual(before.results);expect(a.controller.view().state.settings).toEqual(before.settings);
 a.at(10000);saved.resolve(ok);expect((await pending).ok).toBe(true);const after=a.controller.view().state;expect(after.results).toEqual(candidate.results);expect(after.settings).toEqual(candidate.settings);expect(after.game).toEqual({...before.game,status:'paused',timers:{...before.game.timers,gravityRemainingMs:750}});expect(after.game.runId).toBe('live-run');expect(after.game.piecePolicy).toEqual(before.game.piecePolicy);expect(a.controller.view().error).toBeNull();
});
test('failed decode and failed persistence preserve prior live data; a retry clears visible feedback',async()=>{
 const a=await setup(),before=a.controller.view().state;codec.decode.mockResolvedValueOnce({ok:false,error:{code:'invalid-data',message:'Invalid complete file.'}});expect((await a.controller.restore(file)).ok).toBe(false);expect(a.transactions()).toEqual([]);expect(a.controller.view().state.results).toEqual(before.results);expect(a.controller.view().state.settings).toEqual(before.settings);expect(a.controller.view().error?.code).toBe('invalid-data');
 a.commit(async()=>({ok:false,error:{code:'persistence-failed',message:'Compensation failed honestly.'}}));expect((await a.controller.restore(file)).ok).toBe(false);expect(a.controller.view().state.results).toEqual(before.results);expect(a.controller.view().state.settings).toEqual(before.settings);expect(a.controller.view().error?.message).toBe('Compensation failed honestly.');a.commit(async()=>ok);expect((await a.controller.restore(file)).ok).toBe(true);expect(a.controller.view().error).toBeNull();
});
test('Restore, edit and Save share FIFO acknowledgement ordering and coherent snapshots',async()=>{
 const a=await setup(),decoded=deferred<Outcome<PortableSnapshot>>();codec.decode.mockReturnValueOnce(decoded.promise);const restore=a.controller.restore(file),edit=a.controller.setSettings({ghost:'hide'}),save=a.controller.save('json');expect(codec.encode).not.toHaveBeenCalled();expect(a.transactions()).toEqual([]);decoded.resolve({ok:true,value:structuredClone(candidate)});expect((await restore).ok).toBe(true);expect((await edit).ok).toBe(true);expect((await save).ok).toBe(true);expect(a.transactions().map(tx=>tx.reason)).toEqual(['restore','edit']);expect(codec.encode.mock.calls[0]![0]).toEqual({...candidate,settings:{...candidate.settings,ghost:'hide'}});
});
test('codec/download failures never download partial output and do not poison the next queued operation',async()=>{
 const a=await setup();codec.encode.mockResolvedValueOnce({ok:false,error:{code:'file-failed',message:'Encoding failed.'}});expect((await a.controller.save('json')).ok).toBe(false);expect(a.downloads()).toEqual([]);expect(a.controller.view().error?.code).toBe('file-failed');a.ports.download=async()=>({ok:false,error:{code:'file-failed',message:'Download unavailable.'}});expect((await a.controller.save('json')).ok).toBe(false);expect(a.controller.view().error?.message).toBe('Download unavailable.');a.ports.download=async()=>ok;expect((await a.controller.save('json')).ok).toBe(true);expect(a.controller.view().error).toBeNull();
});
test('disposal aborts active decode, cancels queued files and prevents a late candidate from writing or committing',async()=>{
 const a=await setup(),decoded=deferred<Outcome<PortableSnapshot>>();codec.decode.mockReturnValueOnce(decoded.promise);const before=a.controller.view().state,restore=a.controller.restore(file),save=a.controller.save('json');const signal=codec.decode.mock.calls[0]![1] as AbortSignal;a.controller.dispose();expect(signal.aborted).toBe(true);expect((await restore).ok).toBe(false);expect((await save).ok).toBe(false);decoded.resolve({ok:true,value:structuredClone(candidate)});await Promise.resolve();await Promise.resolve();expect(a.transactions()).toEqual([]);expect(a.downloads()).toEqual([]);expect(a.controller.view().state.results).toEqual(before.results);expect(a.controller.view().state.settings).toEqual(before.settings);expect(codec.encode).not.toHaveBeenCalled();
});
test('disposal during encoding prevents a late download; pending persistence acknowledgement cannot swap live state',async()=>{
 const a=await setup(),encoded=deferred<Outcome<Uint8Array>>();codec.encode.mockReturnValueOnce(encoded.promise);const save=a.controller.save('json');a.controller.dispose();expect((codec.encode.mock.calls[0]![2] as AbortSignal).aborted).toBe(true);expect((await save).ok).toBe(false);encoded.resolve({ok:true,value:new Uint8Array([1])});await Promise.resolve();expect(a.downloads()).toEqual([]);
 const b=await setup(),saved=deferred<Outcome<void>>();b.commit(()=>saved.promise);const before=b.controller.view().state,restore=b.controller.restore(file);await vi.waitFor(()=>expect(b.transactions()).toHaveLength(1));b.controller.dispose();expect((await restore).ok).toBe(false);saved.resolve(ok);await Promise.resolve();await Promise.resolve();expect(b.controller.view().state.results).toEqual(before.results);expect(b.controller.view().state.settings).toEqual(before.settings);
});
test('file capability gates effects; session-only composition restores without storage',async()=>{
 const gated=await setup(false,false);expect((await gated.controller.save('json')).ok).toBe(false);expect((await gated.controller.restore(file)).ok).toBe(false);expect(codec.decode).not.toHaveBeenCalled();expect(codec.encode).not.toHaveBeenCalled();expect(gated.controller.view().state.game.status).toBe('running');const local=await setup(false);expect((await local.controller.restore(file)).ok).toBe(true);expect(local.transactions()).toEqual([]);expect(local.controller.view().state.results).toEqual(candidate.results);
});
