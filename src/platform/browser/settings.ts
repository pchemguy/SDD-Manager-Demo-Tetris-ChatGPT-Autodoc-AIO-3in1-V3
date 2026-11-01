/** Private browser settings adapter; C5 owns canonical validation/resolution. */
import {DEFAULT_SETTINGS,validateSettings} from '../../rules';
import type {AppError,Outcome,RawSettings,SettingKey,SettingsTransaction} from '../../models';
const failure=(message:string):Outcome<void>=>({ok:false,error:{code:'persistence-failed',message}});
function queryValues(search:string):RawSettings{
 const params=new URLSearchParams(search),query:Partial<Record<SettingKey,string>>={};
 for(const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]){const values=params.getAll(key);if(values.length)query[key]=values.length===1?values[0]!:'';}
 return query;
}
function cookieValues(raw:string):RawSettings{
 const saved:Partial<Record<SettingKey,string>>={};
 for(const token of raw.split(';')){const part=token.trimStart(),i=part.indexOf('=');if(i<0)continue;const name=part.slice(0,i);if(!name.startsWith('tetris.'))continue;const key=name.slice(7);if(!Object.hasOwn(DEFAULT_SETTINGS,key))continue;
  if(Object.hasOwn(saved,key)){saved[key as SettingKey]='';continue;}try{saved[key as SettingKey]=decodeURIComponent(part.slice(i+1));}catch{saved[key as SettingKey]='';}
 }
 return saved;
}
/** Capture accessible cookie name/value representations without re-encoding old values. */
function representations(raw:string,keys:ReadonlySet<SettingKey>):Map<SettingKey,string>{
 const values=new Map<SettingKey,string>();
 for(const token of raw.split(';')){const part=token.trimStart(),i=part.indexOf('=');if(i<0||!part.slice(0,i).startsWith('tetris.'))continue;const key=part.slice(7,i);if(!keys.has(key as SettingKey))continue;if(values.has(key as SettingKey))throw Error('Ambiguous setting cookie');values.set(key as SettingKey,part.slice(i+1));}
 return values;
}
/** No host I/O occurs until the capability requests a read or commit. */
export function createBrowserSettings(host:Window){
 let readError:AppError|null=null;
 return {
  async read():Promise<Outcome<Readonly<{query:RawSettings;saved:RawSettings}>>>{
   readError=null;let query:RawSettings;
   try{query=queryValues(host.location.search);}catch{return {ok:false,error:{code:'persistence-failed',message:'Browser configuration could not be read.'}};}
   let saved:RawSettings={};try{saved=cookieValues(host.document.cookie);}catch{readError={code:'persistence-failed',message:'Browser storage is unavailable; these page settings could not be saved.'};}
   return {ok:true,value:{query,saved}};
  },
  async commit(tx:SettingsTransaction):Promise<Outcome<void>>{
   const validated=validateSettings(tx.next);if(!validated.ok)return validated;
   const keys=[...tx.writeKeys];if(new Set(keys).size!==keys.length||keys.some(key=>!Object.hasOwn(DEFAULT_SETTINGS,key)))return {ok:false,error:{code:'invalid-data',message:'Invalid setting write keys.'}};
   if(tx.reason!=='startup')return {ok:false,error:{code:'runtime-unavailable',message:'Persistent setting edits are not yet available.'}};
   if(readError)return {ok:false,error:readError};if(!keys.length)return {ok:true,value:undefined};
   const selected=new Set(keys);
   let before:Map<SettingKey,string|undefined>;
   try{const current=representations(host.document.cookie,selected);before=new Map(keys.map(key=>[key,current.get(key)]));}catch{return failure('Previous browser settings could not be read; no cookie was changed.');}
   const write=(key:SettingKey,value:string|undefined)=>{host.document.cookie=`tetris.${key}=${value??''}; Path=/; SameSite=Lax; Max-Age=${value===undefined?0:31536000}${host.location.protocol==='https:'?'; Secure':''}`;};
   try{
    for(const key of keys)write(key,encodeURIComponent(String(validated.value[key])));
    const after=representations(host.document.cookie,selected);if(keys.some(key=>after.get(key)!==encodeURIComponent(String(validated.value[key]))))throw Error('Cookie acknowledgement mismatch');
    return {ok:true,value:undefined};
   }catch{
    try{for(const[key,value]of before)write(key,value);const restored=representations(host.document.cookie,selected);if([...before].some(([key,value])=>restored.get(key)!==value))throw Error('Cookie rollback mismatch');}
    catch{return failure('Settings could not be saved, and previous cookie values could not be fully restored.');}
    return failure('Settings could not be saved; previous cookie values were restored.');
   }
  }
 };
}
