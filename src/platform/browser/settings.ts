/** Private browser adapter parsing; pure value validation belongs to public C5 rules. */
import {DEFAULT_SETTINGS} from '../../rules';
import type {RawSettings,SettingKey} from '../../models';
/** Preserve invalid/duplicate known values as an invalid empty group for per-key fallback. */
export function readRawSettings(host:Window):Readonly<{query:RawSettings;saved:RawSettings}>{
 const params=new URLSearchParams(host.location.search),query:Partial<Record<SettingKey,string>>={},saved:Partial<Record<SettingKey,string>>={};
 for(const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]){const values=params.getAll(key);if(values.length)query[key]=values.length===1?values[0]!:'';}
 for(const raw of host.document.cookie.split(';')){
  const part=raw.trimStart(),equals=part.indexOf('=');if(equals<0)continue;
  const name=part.slice(0,equals);if(!name.startsWith('tetris.'))continue;const key=name.slice(7);if(!Object.hasOwn(DEFAULT_SETTINGS,key))continue;
  if(Object.hasOwn(saved,key)){saved[key as SettingKey]='';continue;}
  try{saved[key as SettingKey]=decodeURIComponent(part.slice(equals+1));}catch{saved[key as SettingKey]='';}
 }
 return {query,saved};
}
