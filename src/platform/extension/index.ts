/** Sidebar host ports: six local settings, session RPC and ordinary DOM file downloads. */
import type {AppError,AppState,Checkpoint,Outcome,RawSettings,SettingKey,SettingsTransaction} from '../../models';
import type {PlatformPorts} from '../ports';
import type {StorageArea} from './session';
import {createBrowserPorts} from '../browser';
import {DEFAULT_SETTINGS,validateSettings} from '../../rules';
import {integer,record,validateCheckpoint,validateState} from './validation';
export interface ExtensionAPI{runtime:{sendMessage(message:unknown):Promise<unknown>};windows:{getCurrent():Promise<{id?:number}>};storage:{local:StorageArea}}
export interface ExtensionConnection{ports:PlatformPorts;warning:AppError|null;release():Promise<void>}
const failure=(code:AppError['code'],message:string)=>({ok:false as const,error:{code,message}});
const settingKey=(key:SettingKey)=>`tetris.setting.${key}`;
const keys=Object.keys(DEFAULT_SETTINGS) as SettingKey[];
function appError(value:unknown):value is AppError{return record(value,['code','message'])&&['invalid-data','unsupported-format','persistence-failed','file-failed','checkpoint-failed','stale-session','runtime-unavailable'].includes(value.code as string)&&typeof value.message==='string';}
/** Acquire before composing C3. A failed/expired RPC never advances the local revision. */
export async function connectExtension(api:ExtensionAPI,host:Window=window,timeoutMs=10000):Promise<Outcome<ExtensionConnection>>{
 async function rpc(message:unknown):Promise<unknown>{
  let deadline:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([api.runtime.sendMessage(message),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(Error('timeout')),timeoutMs);})]);}
  finally{if(deadline!==undefined)clearTimeout(deadline);}
 }
 try{
  const {id:windowId}=await api.windows.getCurrent();if(!integer(windowId))return failure('runtime-unavailable','The sidebar browser window could not be identified.');
  const lease=await rpc({type:'acquire',windowId});
  if(lease&&typeof lease==='object'&&'error'in lease&&appError(lease.error))return {ok:false,error:lease.error};
  if(!lease||typeof lease!=='object')throw Error('reply');
  const l=lease as Record<string,unknown>;
  if(!integer(l.generation,1)||!integer(l.revision)||l.warning!==undefined&&!appError(l.warning))throw Error('lease');
  const generation=l.generation;let revision=l.revision,released=false,tail=Promise.resolve();
  const checked=l.checkpoint===null?null:validateCheckpoint(l.checkpoint,windowId,generation,revision);
  if(checked&&!checked.ok||l.checkpoint===undefined)throw Error('checkpoint');
  const checkpoint:Checkpoint|null=checked?.ok?checked.value:null;
  const serialize=<T>(op:()=>Promise<T>):Promise<T>=>{const next=tail.then(op);tail=next.then(()=>{},()=>{});return next;};
  const local=api.storage.local;
  async function commit(tx:SettingsTransaction):Promise<Outcome<void>>{
   const next=validateSettings(tx.next),previous=validateSettings(tx.previous),selected=new Set(tx.writeKeys);
   if(!next.ok||!previous.ok||!['startup','edit','restore'].includes(tx.reason)||selected.size!==tx.writeKeys.length||tx.writeKeys.some(k=>!keys.includes(k))||tx.reason==='restore'&&selected.size!==6||tx.reason==='edit'&&keys.some(k=>previous.value[k]!==next.value[k]&&!selected.has(k)))return failure('invalid-data','Invalid extension settings transaction.');
   if(!selected.size)return {ok:true,value:undefined};
   const before:Record<string,unknown>={},values:Record<string,unknown>={};
   try{for(const k of tx.writeKeys){const key=settingKey(k),raw=await local.get(key);if(raw[key]!==undefined)before[key]=raw[key];values[key]=next.value[k];}}
   catch{return failure('persistence-failed','Previous extension settings could not be read; no edit was applied.');}
   try{
    await local.set(values);
    for(const [key,value]of Object.entries(values))if((await local.get(key))[key]!==value)throw Error('acknowledgement');
    return {ok:true,value:undefined};
   }catch{
    let restored=true;
    try{if(Object.keys(before).length)await local.set(before);for(const key of Object.keys(values))if(!Object.hasOwn(before,key))await local.remove(key);
     for(const key of Object.keys(values))if(JSON.stringify((await local.get(key))[key])!==JSON.stringify(before[key]))restored=false;
    }catch{restored=false;}
    return failure('persistence-failed',restored?'Extension settings could not be saved; previous values were restored.':'Extension settings could not be saved or fully rolled back.');
   }
  }
  const ports:PlatformPorts={...createBrowserPorts(host),
   readSettings:async()=>{try{const saved:Partial<Record<SettingKey,string>>={};for(const k of keys){const raw=(await local.get(settingKey(k)))[settingKey(k)];if(raw!==undefined)saved[k]=typeof raw==='string'||typeof raw==='boolean'?String(raw):'';}return {ok:true,value:{query:{} as RawSettings,saved}};}catch{return failure('persistence-failed','Extension settings storage is unavailable.');}},
   commitSettings:commit,
   loadCheckpoint:async()=>({ok:true,value:structuredClone(checkpoint)}),
   writeCheckpoint:(state:AppState)=>{
    const validated=validateState(state);if(!validated.ok)return Promise.resolve(validated);
    return serialize(async()=>{
     if(released)return failure('stale-session','This sidebar session is closed.');
     try{
      const next=revision+1,reply=await rpc({type:'checkpoint',windowId,generation,revision:next,state:validated.value});
      if(record(reply,['error'])&&appError(reply.error))return {ok:false,error:reply.error};
      if(!record(reply,['revision'])||reply.revision!==next)return failure('checkpoint-failed','The session checkpoint was not acknowledged.');
      revision=next;return {ok:true,value:undefined};
     }catch{return failure('checkpoint-failed','Sidebar storage did not acknowledge this state; recovery may use an earlier checkpoint.');}
    });
   }
  };
  return {ok:true,value:{ports,warning:l.warning as AppError|undefined??null,release:()=>serialize(async()=>{if(released)return;released=true;try{await rpc({type:'release',windowId,generation});}catch{/* Best effort: acquire always invalidates prior writers. */}})}};
 }catch{return failure('runtime-unavailable','The extension session coordinator is unavailable or returned invalid data. Reopen the sidebar.');}
}
