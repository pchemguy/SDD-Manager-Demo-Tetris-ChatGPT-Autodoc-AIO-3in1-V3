import {test,expect} from 'vitest';
import {createCoordinator,type StorageArea,type SessionReply} from '../../../src/platform/extension/session';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import {CAPABILITIES} from '../../../src/capabilities';
import type {AppState} from '../../../src/models';
const sender={id:'owned',url:'chrome-extension://owned/sidebar.html',tab:{windowId:7}};
const state=():AppState=>({game:createGame(123,'run-1',DEFAULT_SETTINGS,CAPABILITIES,'running'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null});
function setup(){const data:Record<string,unknown>={};let fail=false;const store:StorageArea={get:async key=>structuredClone({[key]:data[key]}),set:async values=>{if(fail)throw Error('storage');Object.assign(data,structuredClone(values));},remove:async key=>{delete data[key];}};const make=()=>createCoordinator(store,{id:'owned',url:sender.url,windowExists:async id=>[7,8].includes(id)});return{data,store,make,fail:(v:boolean)=>{fail=v;}};}
function acquired(r:SessionReply){if(!('generation'in r))throw Error(JSON.stringify(r));return r;}
test('acknowledged state reopens paused without changing timers and invalidates its former writer',async()=>{
 const a=setup(),c=a.make(),first=acquired(await c.handle({type:'acquire',windowId:7},sender));expect(first.checkpoint).toBeNull();
 const s=state();const written=await c.handle({type:'checkpoint',windowId:7,generation:first.generation,revision:1,state:s},sender);expect(written).toEqual({revision:1});
 const second=acquired(await a.make().handle({type:'acquire',windowId:7},sender));expect(second.generation).toBeGreaterThan(first.generation);expect(second.checkpoint?.state.game.status).toBe('paused');expect(second.checkpoint?.state.game.timers).toEqual(s.game.timers);
 const before=structuredClone(a.data);expect(await c.handle({type:'checkpoint',windowId:7,generation:first.generation,revision:2,state:state()},sender)).toHaveProperty('error.code','stale-session');expect(a.data).toEqual(before);
});
test('invalid identities, revisions and complete malformed state never overwrite stored data',async()=>{
 const a=setup(),c=a.make(),lease=acquired(await c.handle({type:'acquire',windowId:7},sender));const before=structuredClone(a.data);
 for(const bad of [{...sender,id:'foreign'},{...sender,url:'https://foreign/sidebar.html'},{...sender,tab:{windowId:8}}])expect(await c.handle({type:'acquire',windowId:7},bad)).toHaveProperty('error');
 for(const revision of [0,2,-1,NaN])expect(await c.handle({type:'checkpoint',windowId:7,generation:lease.generation,revision,state:state()},sender)).toHaveProperty('error');
 for(const s of [{...state(),settings:{ghost:'show'}},{...state(),game:{...state().game,board:[]}},{...state(),results:[{id:'bad',score:-1,timestamp:'yesterday'}]}])expect(await c.handle({type:'checkpoint',windowId:7,generation:lease.generation,revision:1,state:s},sender)).toHaveProperty('error');
 expect(a.data).toEqual(before);
});
test('storage failure is reported, release rejects writes, and closed windows remove game data',async()=>{
 const a=setup(),c=a.make(),l=acquired(await c.handle({type:'acquire',windowId:7},sender));a.fail(true);expect(await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:state()},sender)).toHaveProperty('error.code','checkpoint-failed');a.fail(false);
 expect(await c.handle({type:'release',windowId:7,generation:l.generation},sender)).toEqual({released:true});expect(await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:state()},sender)).toHaveProperty('error');
 await c.clearWindow(7);const next=acquired(await c.handle({type:'acquire',windowId:7},sender));expect(next.checkpoint).toBeNull();expect(next.generation).toBeGreaterThan(l.generation);
});
test('corrupt checkpoint is discarded with a warning and independent windows stay separate',async()=>{
 const a=setup(),c=a.make(),l=acquired(await c.handle({type:'acquire',windowId:7},sender));await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:state()},sender);
 const key=Object.keys(a.data).find(k=>JSON.stringify(a.data[k]).includes('run-1'))!;(a.data[key] as any).checkpoint.state.game.board=[];
 const next=acquired(await c.handle({type:'acquire',windowId:7},sender));expect(next.checkpoint).toBeNull();expect(next.warning).toBeDefined();
 const other=acquired(await c.handle({type:'acquire',windowId:8},{...sender,tab:{windowId:8}}));expect(other.checkpoint).toBeNull();expect(other.generation).not.toBe(next.generation);
});
test('racing acquire/checkpoint operations serialize, and acknowledgement waits for storage',async()=>{
 const a=setup();let resume!:()=>void;const original=a.store.set;
 a.store.set=async values=>{await new Promise<void>(resolve=>{resume=resolve;});await original(values);};
 const c=a.make();let settled=false;const first=c.handle({type:'acquire',windowId:7},sender).then(r=>{settled=true;return acquired(r);});
 await new Promise(resolve=>setTimeout(resolve,0));expect(settled).toBe(false);expect(Object.keys(a.data)).toHaveLength(0);resume();const l=await first;a.store.set=original;
 const [second,stale]=await Promise.all([c.handle({type:'acquire',windowId:7},sender),c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:state()},sender)]);
 expect(acquired(second).generation).toBeGreaterThan(l.generation);expect(stale).toHaveProperty('error.code','stale-session');
});
test('complete validation rejects malformed nested data and unsupported checkpoint versions',async()=>{
 const a=setup(),c=a.make(),l=acquired(await c.handle({type:'acquire',windowId:7},sender));
 for(const change of [
  {sequence:{rng:0,mode:'bag7',pending:[]}}, {timers:{gravityRemainingMs:Infinity,lockRemainingMs:null,grounded:false}},
  {active:{...state().game.active!,origin:{x:500,y:0}}},{bonuses:4},{level:2},{piecePolicy:{lockPolicy:'unknown',hardDropLock:'general'}},
  {board:Array(20)}
 ])expect(await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:{...state(),game:{...state().game,...change}}},sender)).toHaveProperty('error');
 const s=state();expect(await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:s},sender)).toEqual({revision:1});
 const k=Object.keys(a.data).find(k=>k.startsWith('tetris.window.'))!;(a.data[k] as any).checkpoint.checkpointVersion=2;
 const restored=acquired(await c.handle({type:'acquire',windowId:7},sender));expect(restored.checkpoint).toBeNull();expect(restored.warning?.code).toBe('invalid-data');
});
test('checkpoint contents own copies and browser restart starts an empty session',async()=>{
 const a=setup(),c=a.make(),l=acquired(await c.handle({type:'acquire',windowId:7},sender)),s=state();
 await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:s},sender);(s.game.board[19] as any)[0]='Z';
 const next=acquired(await c.handle({type:'acquire',windowId:7},sender));expect(next.checkpoint?.state.game.board[19]?.[0]).toBeNull();
 const fresh=setup();expect(acquired(await fresh.make().handle({type:'acquire',windowId:7},sender)).checkpoint).toBeNull();
});
test('corrupt completion marker and unordered leaderboard cannot suppress or misrank completed games',async()=>{
 const a=setup(),c=a.make(),l=acquired(await c.handle({type:'acquire',windowId:7},sender));
 for(const s of [{...state(),completedRunId:'run-1'},{...state(),results:[{id:'low',score:1,timestamp:'2026-11-01T00:00:00Z'},{id:'high',score:2,timestamp:'2026-11-01T00:00:00Z'}]}])expect(await c.handle({type:'checkpoint',windowId:7,generation:l.generation,revision:1,state:s},sender)).toHaveProperty('error.code','invalid-data');
});
