import {test,expect} from 'vitest';
import {connectExtension,type ExtensionAPI} from '../../../src/platform/extension';
import {createCoordinator,type StorageArea} from '../../../src/platform/extension/session';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import {createGame} from '../../../src/domain';
import {CAPABILITIES} from '../../../src/capabilities';
function area(){const data:Record<string,unknown>={};let fail=false;const store:StorageArea={get:async key=>structuredClone({[key]:data[key]}),set:async values=>{if(fail)throw Error('write');Object.assign(data,structuredClone(values));},remove:async key=>{delete data[key];}};return {data,store,fail:(v:boolean)=>{fail=v;}};}
function setup(){const local=area(),session=area();const coordinator=createCoordinator(session.store,{id:'owned',url:'chrome-extension://owned/sidebar.html',windowExists:async id=>id===7});const api:ExtensionAPI={runtime:{sendMessage:m=>coordinator.handle(m,{id:'owned',url:'chrome-extension://owned/sidebar.html'})},windows:{getCurrent:async()=>({id:7})},storage:{local:local.store}};
 const document=Object.assign(new EventTarget(),{hidden:false});Object.defineProperty(document,'cookie',{get(){throw Error('host cookie accessed');},set(){throw Error('host cookie changed');}});
 const host=Object.assign(new EventTarget(),{document,performance,crypto,setTimeout,clearTimeout});for(const key of ['location','history'])Object.defineProperty(host,key,{get(){throw Error('host URL accessed');}});
 return {api,local,session,host:host as unknown as Window};}
async function connected(a:ReturnType<typeof setup>){const r=await connectExtension(a.api,a.host);if(!r.ok)throw Error(r.error.message);return r.value;}
test('settings use one complete versioned local object without cookie/URL or score persistence',async()=>{
 const a=setup(),c=await connected(a);expect(await c.ports.readSettings()).toEqual({ok:true,value:{query:{},saved:{}}});
 expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,ghost:'hide'},writeKeys:['ghost'],reason:'edit'})).toEqual({ok:true,value:undefined});
 expect(a.local.data).toEqual({'tetris.settings':{formatVersion:1,settings:{...DEFAULT_SETTINGS,ghost:'hide'}}});expect(await c.ports.readSettings()).toEqual({ok:true,value:{query:{},saved:Object.fromEntries(Object.entries({...DEFAULT_SETTINGS,ghost:'hide'}).map(([k,v])=>[k,String(v)]))}});
 const before=structuredClone(a.local.data);expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:DEFAULT_SETTINGS,writeKeys:[],reason:'startup'})).toHaveProperty('ok',true);expect(a.local.data).toEqual(before);
 expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,hold:false},writeKeys:[],reason:'edit'})).toHaveProperty('ok',false);
});
test('checkpoint acknowledgements survive reopen paused and former adapter cannot overwrite',async()=>{
 const a=setup(),c=await connected(a),state={game:createGame(2,'run',DEFAULT_SETTINGS,CAPABILITIES,'running'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null};
 expect(await c.ports.writeCheckpoint(state)).toHaveProperty('ok',true);const next=await connected(a),saved=await next.ports.loadCheckpoint();expect(saved.ok&&saved.value?.state.game.status).toBe('paused');
 expect(await c.ports.writeCheckpoint(state)).toHaveProperty('error.code','stale-session');expect(a.local.data).toEqual({});await next.release();expect(await next.ports.writeCheckpoint(state)).toHaveProperty('ok',false);
});
test('failed settings write and malformed broker response report typed errors',async()=>{
 const a=setup(),c=await connected(a);a.local.fail(true);expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,hold:false},writeKeys:['hold'],reason:'edit'})).toHaveProperty('error.code','persistence-failed');expect(a.local.data).toEqual({});
 a.api.runtime.sendMessage=async()=>({generation:0,revision:0,checkpoint:null});expect(await connectExtension(a.api,a.host)).toHaveProperty('error.code','runtime-unavailable');
});
test('message timeout reports unavailable instead of hanging',async()=>{
 const a=setup();a.api.runtime.sendMessage=()=>new Promise(()=>{});expect(await connectExtension(a.api,a.host,10)).toHaveProperty('error.code','runtime-unavailable');
});
test('a partial local write is compensated and Restore requires all six keys',async()=>{
 const a=setup();a.local.data['tetris.settings']={formatVersion:1,settings:{...DEFAULT_SETTINGS,ghost:'dynamic'}};const c=await connected(a),set=a.local.store.set;let first=true;
 a.local.store.set=async values=>{if(first){first=false;a.local.data[Object.keys(values)[0]!]=Object.values(values)[0];throw Error('partial');}await set(values);};
 const before=structuredClone(a.local.data);expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,ghost:'hide',hold:false},writeKeys:['ghost','hold'],reason:'edit'})).toHaveProperty('ok',false);expect(a.local.data).toEqual(before);
 expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:DEFAULT_SETTINGS,writeKeys:['ghost'],reason:'restore'})).toHaveProperty('ok',false);
 expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:DEFAULT_SETTINGS,writeKeys:Object.keys(DEFAULT_SETTINGS) as any,reason:'restore'})).toHaveProperty('ok',true);
 expect(a.local.data).toEqual({'tetris.settings':{formatVersion:1,settings:DEFAULT_SETTINGS}});
});
test('extension Save reuses local Blob bytes and cleans download resources',async()=>{
 const a=setup();let blob:Blob|undefined,clicked=false,removed=false,revoked=false;const doc=a.host.document as any;
 doc.createElement=()=>({style:{},click(){clicked=true;},remove(){removed=true;}});doc.body={append(){}};
 Object.assign(a.host,{Blob,URL:{createObjectURL(value:Blob){blob=value;return 'blob:owned';},revokeObjectURL(){revoked=true;}}});
 const c=await connected(a),bytes=new Uint8Array([10,20,30]);expect(await c.ports.download({name:'tetris-save.sqlite',bytes})).toHaveProperty('ok',true);expect(clicked&&removed).toBe(true);expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(bytes);expect(blob!.type).toBe('application/vnd.sqlite3');await new Promise(resolve=>setTimeout(resolve,5));expect(revoked).toBe(true);
});

test('unknown local format version and incomplete settings are rejected without any mutation',async()=>{
 const a=setup(),c=await connected(a);
 for(const raw of [{formatVersion:2,settings:DEFAULT_SETTINGS},{formatVersion:1,settings:{ghost:'show'}}]){a.local.data['tetris.settings']=raw;const before=structuredClone(a.local.data);expect(await c.ports.readSettings()).toHaveProperty('ok',false);expect(a.local.data).toEqual(before);}
});
test('one acknowledged complete-object write applies edit and Restore atomically',async()=>{
 const a=setup(),c=await connected(a);let count=0;const set=a.local.store.set;a.local.store.set=async value=>{count++;expect(Object.keys(value)).toEqual(['tetris.settings']);await set(value);};
 expect(await c.ports.commitSettings({previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,hold:false},writeKeys:['hold'],reason:'edit'})).toHaveProperty('ok',true);expect(count).toBe(1);
 expect(a.local.data).toEqual({'tetris.settings':{formatVersion:1,settings:{...DEFAULT_SETTINGS,hold:false}}});
});
