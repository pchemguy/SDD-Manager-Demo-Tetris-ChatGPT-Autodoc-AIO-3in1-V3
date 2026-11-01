/** Pure settings validation; no storage or platform effects. */
import type { Outcome, RawSettings, Resolution, SettingKey, Settings } from '../models';
export const DEFAULT_SETTINGS: Settings = Object.freeze({ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true});
const domains:Readonly<Record<SettingKey,readonly unknown[]>>={ghost:['hide','dynamic','show'],hardDrop:[true,false],nextPreview:[true,false],hardDropLock:['general','immediate'],lockPolicy:['failed','interval'],hold:[true,false]};
/** Validate the complete six-key typed value without coercion or invoking accessors. */
export function validateSettings(input:unknown):Outcome<Settings>{
 const invalid:Outcome<Settings>={ok:false,error:{code:'invalid-data',message:'Settings must contain exactly the six correctly typed options.'}};
 if(typeof input!=='object'||input===null||Array.isArray(input))return invalid;
 const descriptors=Object.getOwnPropertyDescriptors(input), keys=Reflect.ownKeys(input);
 if(keys.length!==6||keys.some(key=>typeof key!=='string'||!Object.hasOwn(DEFAULT_SETTINGS,key)||!Object.hasOwn(descriptors[key]!,'value')))return invalid;
 const value=Object.fromEntries(Object.entries(descriptors).map(([key,descriptor])=>[key,descriptor.value]));
 if(Object.entries(value).some(([key,item])=>!domains[key as SettingKey].includes(item)))return invalid;
 return {ok:true,value:value as Settings};
}

/** Resolve each canonical key independently; startup writes are owned by the adapter. */
export function resolveSettings(query:RawSettings,saved:RawSettings):Resolution{
 const settings={...DEFAULT_SETTINGS},explicit:SettingKey[]=[],warnings:string[]=[];
 const parse=(key:SettingKey,raw:unknown)=>typeof raw==='string'?domains[key].find(value=>String(value)===raw):undefined;
 for(const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]){
  const fromQuery=Object.hasOwn(query,key)?parse(key,query[key]):undefined;
  const fromSaved=Object.hasOwn(saved,key)?parse(key,saved[key]):undefined;
  if(fromQuery!==undefined){Object.assign(settings,{[key]:fromQuery});explicit.push(key);}
  else {if(Object.hasOwn(query,key))warnings.push(`Ignored invalid query setting: ${key}.`);if(fromSaved!==undefined)Object.assign(settings,{[key]:fromSaved});}
 }
 return {settings,explicit,warnings};
}
