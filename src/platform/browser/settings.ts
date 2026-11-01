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
/** Replace requested query groups without reserializing unrelated raw tokens or fragments. */
function editedURL(href:string,keys:ReadonlyArray<SettingKey>,settings:SettingsTransaction['next']):string{
 const url=new URL(href),selected=new Set(keys);
 const tokens=url.search.slice(1).split('&').filter(token=>{if(!token)return true;const key=new URLSearchParams(token).keys().next().value;return !selected.has(key as SettingKey);});
 if(!url.search)tokens.length=0;
 for(const key of keys)tokens.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(settings[key]))}`);
 url.search=tokens.length?'?'+tokens.join('&'):'';return url.href;
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
   const previous=validateSettings(tx.previous);if(!previous.ok)return previous;
   const keys=[...tx.writeKeys],selected=new Set(keys),all=Object.keys(DEFAULT_SETTINGS) as SettingKey[];
   const invalid:Outcome<void>={ok:false,error:{code:'invalid-data',message:'Invalid setting transaction or write keys.'}};
   if(!['startup','edit','restore'].includes(tx.reason)||selected.size!==keys.length||keys.some(key=>!Object.hasOwn(DEFAULT_SETTINGS,key)))return invalid;
   if(tx.reason==='restore'&&(keys.length!==all.length||all.some(key=>!selected.has(key))))return invalid;
   if(tx.reason==='edit'&&all.some(key=>previous.value[key]!==validated.value[key]&&!selected.has(key)))return invalid;
   if(tx.reason==='startup'&&readError)return {ok:false,error:readError};if(!keys.length)return {ok:true,value:undefined};
   let before:Map<SettingKey,string|undefined>,previousURL:string|null=null,nextURL:string|null=null,previousHistory:unknown;
   try{
    const current=representations(host.document.cookie,selected);before=new Map(keys.map(key=>[key,current.get(key)]));
    if(tx.reason!=='startup'){previousURL=host.location.href;previousHistory=host.history.state;nextURL=editedURL(previousURL,keys,validated.value);}
   }catch{return failure('Previous browser settings could not be read; no change was applied.');}
   const write=(key:SettingKey,value:string|undefined)=>{host.document.cookie=`tetris.${key}=${value??''}; Path=/; SameSite=Lax; Max-Age=${value===undefined?0:31536000}${host.location.protocol==='https:'?'; Secure':''}`;};
   try{
    for(const key of keys)write(key,encodeURIComponent(String(validated.value[key])));
    const after=representations(host.document.cookie,selected);if(keys.some(key=>after.get(key)!==encodeURIComponent(String(validated.value[key]))))throw Error('Cookie acknowledgement mismatch');
    if(nextURL!==null){host.history.replaceState(previousHistory,'',nextURL);if(host.location.href!==nextURL)throw Error('URL acknowledgement mismatch');}
    readError=null;return {ok:true,value:undefined};
   }catch{
    let restored=true;
    for(const[key,value]of before){try{write(key,value);}catch{restored=false;}}
    if(previousURL!==null){try{if(host.location.href!==previousURL)host.history.replaceState(previousHistory,'',previousURL);}catch{restored=false;}}
    try{const current=representations(host.document.cookie,selected);if([...before].some(([key,value])=>current.get(key)!==value)||(previousURL!==null&&host.location.href!==previousURL))restored=false;}catch{restored=false;}
    if(!restored)return failure('Settings could not be saved, and previous cookies or URL could not be fully restored.');
    return failure('Settings could not be saved; previous cookies and URL were restored.');
   }
  }
 };
}
