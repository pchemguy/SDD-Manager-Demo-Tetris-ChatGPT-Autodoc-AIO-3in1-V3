/** Window-scoped, acknowledged session leases. No game clock runs in this owner. */
import type {AppError,Checkpoint,Outcome} from '../../models';
import {integer,record,validateCheckpoint,validateState} from './validation';
export interface StorageArea{get(key:string):Promise<Record<string,unknown>>;set(value:Record<string,unknown>):Promise<void>;remove(key:string):Promise<void>}
export interface Sender{id?:string;url?:string;tab?:{windowId?:number}}
export type SessionReply={error:AppError}|{generation:number;revision:number;checkpoint:Checkpoint|null;warning?:AppError}|{revision:number}|{released:true};
export interface Coordinator{handle(message:unknown,sender:Sender):Promise<SessionReply>;clearWindow(id:number):Promise<Outcome<void>>}
const counterKey='tetris.generation',key=(id:number)=>`tetris.window.${id}`;
const error=(code:AppError['code'],message:string):{error:AppError}=>({error:{code,message}});
interface Stored{version:1;generation:number;revision:number;leased:boolean;checkpoint:Checkpoint|null}
function stored(v:unknown):v is Stored{return record(v,['version','generation','revision','leased','checkpoint'])&&v.version===1&&integer(v.generation,1)&&integer(v.revision)&&typeof v.leased==='boolean';}
/** A single coordinator serializes all read/validate/write operations, including cleanup. */
export function createCoordinator(store:StorageArea,identity:{id:string;url:string;windowExists:(id:number)=>Promise<boolean>}):Coordinator{
 let tail=Promise.resolve();
 function serialize<T>(operation:()=>Promise<T>):Promise<T>{const next=tail.then(operation);tail=next.then(()=>{},()=>{});return next;}
 async function handle(message:unknown,sender:Sender):Promise<SessionReply>{
  try{
   if(!message||typeof message!=='object')return error('invalid-data','Invalid sidebar request.');
   const m=message as Record<string,unknown>,id=m.windowId;
   if(!integer(id)||sender.id!==identity.id||sender.url?.split(/[?#]/)[0]!==identity.url||sender.tab?.windowId!==undefined&&sender.tab.windowId!==id)return error('invalid-data','Unrecognized sidebar sender or browser window.');
   if(!await identity.windowExists(id))return error('invalid-data','The browser window no longer exists.');
   const shape=m.type==='acquire'?['type','windowId']:m.type==='checkpoint'?['type','windowId','generation','revision','state']:m.type==='release'?['type','windowId','generation']:[];
   if(!record(m,shape)||shape.length===0)return error('invalid-data','Unsupported sidebar request.');
   const k=key(id),raw=(await store.get(k))[k],old=stored(raw)?raw:null;
   if(m.type==='acquire'){
    const count=(await store.get(counterKey))[counterKey]??0;
    if(!integer(count,0,Number.MAX_SAFE_INTEGER-1)||old&&old.generation>count)return error('checkpoint-failed','Session generation metadata is inconsistent; reopen the browser session.');
    const generation=count+1;let checkpoint:Checkpoint|null=null,warning:AppError|undefined;
    if(raw!==undefined&&raw!==null){
     const checked=old&&old.checkpoint!==null?validateCheckpoint(old.checkpoint,id,old.generation,old.revision):null;
     if(checked?.ok){const state=checked.value.state;checkpoint={checkpointVersion:1,windowId:id,generation,revision:0,state:{...state,game:{...state.game,status:['running','paused'].includes(state.game.status)?'paused':state.game.status}}};}
     else if(!old||old.checkpoint!==null)warning={code:'invalid-data',message:'Invalid sidebar checkpoint discarded. A fresh game will be shown.'};
    }
    await store.set({[counterKey]:generation,[k]:{version:1,generation,revision:0,leased:true,checkpoint}});
    return {generation,revision:0,checkpoint,...warning?{warning}:{}};
   }
   if(!old||!old.leased||!integer(m.generation,1)||m.generation!==old.generation)return error('stale-session','This sidebar writer was replaced. Reopen the sidebar to continue.');
   if(m.type==='release'){await store.set({[k]:{...old,leased:false}});return {released:true};}
   if(!integer(m.revision,1)||m.revision!==old.revision+1)return error('stale-session','This sidebar checkpoint revision is stale or out of order.');
   const state=validateState(m.state);if(!state.ok)return {error:state.error};
   await store.set({[k]:{...old,revision:m.revision,checkpoint:{checkpointVersion:1,windowId:id,generation:old.generation,revision:m.revision,state:state.value}}});
   return {revision:m.revision};
  }catch{return error('checkpoint-failed','Sidebar session storage failed. The unacknowledged state may not be recoverable.');}
 }
 return {handle:(m,s)=>serialize(()=>handle(m,s)),clearWindow:id=>serialize(async()=>{try{if(!integer(id))throw Error('window');await store.remove(key(id));return {ok:true,value:undefined};}catch{return {ok:false,error:{code:'checkpoint-failed',message:'Could not clear the closed browser window session.'}};}})};
}
