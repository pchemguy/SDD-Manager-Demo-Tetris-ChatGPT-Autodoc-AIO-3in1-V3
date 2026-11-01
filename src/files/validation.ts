/** Complete schema + semantic validation; no I/O and no partial state mutation. */
import type {Outcome,PortableSnapshot} from '../models';
import {rankResults,validateSettings} from '../rules';
import validate from '../../generated/snapshot-validator.mjs';
const invalid=():Outcome<never>=>({ok:false,error:{code:'invalid-data',message:'The file must contain one complete valid snapshot, with unique results and all six settings.'}});
function record(input:unknown,expected?:readonly string[]):input is Record<string,unknown>{
 if(typeof input!=='object'||input===null||Array.isArray(input))return false;
 const fields=Object.getOwnPropertyDescriptors(input);
 const keys=Reflect.ownKeys(input);
 return (!expected||(keys.length===expected.length&&expected.every(key=>Object.hasOwn(fields,key))))&&keys.every(key=>typeof key==='string'&&Object.hasOwn(fields[key]!,'value'));
}
/** Use the generated schema and explicit calendars/identity semantics; copies never share input state. */
export function validateSnapshot(input:unknown):Outcome<PortableSnapshot>{
 try{
  if(!record(input,['formatVersion','results','settings']))return invalid();
  if(typeof input.formatVersion==='number'&&Number.isInteger(input.formatVersion)&&input.formatVersion!==1)return {ok:false,error:{code:'unsupported-format',message:'This snapshot version is not supported.'}};
  if(!Object.hasOwn(input,'results')||!Array.isArray(input.results)||input.results.length>10||Reflect.ownKeys(input.results).length!==input.results.length+1||Array.from({length:input.results.length},(_,index)=>Object.hasOwn(input.results as unknown[],index)).some(own=>!own)||Object.values(Object.getOwnPropertyDescriptors(input.results)).some(field=>!Object.hasOwn(field,'value'))||!input.results.every(item=>record(item,['id','score','timestamp']))||!Object.hasOwn(input,'settings')||!record(input.settings,['ghost','hardDrop','nextPreview','hardDropLock','lockPolicy','hold']))return invalid();
  if(!validate(input))return invalid();
  const settings=validateSettings(input.settings);if(!settings.ok)return invalid();
  return {ok:true,value:{formatVersion:1,settings:settings.value,results:rankResults(input.results as unknown as PortableSnapshot['results'])}};
 }catch{return invalid();}
}
/** Internal JSON lexical pass catches duplicate decoded names before JSON.parse can discard them. */
function rejectDuplicateProperties(text:string):void{
 let cursor=0;
 const whitespace=()=>{while(/[ \t\r\n]/.test(text[cursor]??'!'))cursor++;};
 const string=():string=>{
  if(text[cursor]!=='"')throw Error('Expected JSON string');const start=cursor++;
  while(cursor<text.length){const char=text[cursor++]!;if(char==='"')return JSON.parse(text.slice(start,cursor)) as string;if(char==='\\')cursor++;}
  throw Error('Unterminated JSON string');
 };
 const value=(depth:number):void=>{
  if(depth>64)throw Error('Invalid snapshot depth');whitespace();const char=text[cursor];
  if(char==='{'){
   cursor++;whitespace();const keys=new Set<string>();if(text[cursor]==='}'){cursor++;return;}
   for(;;){whitespace();const key=string();if(keys.has(key))throw Error('Duplicate JSON property');keys.add(key);whitespace();if(text[cursor++]!==':')throw Error('Missing colon');value(depth+1);whitespace();const delimiter=text[cursor++];if(delimiter==='}')return;if(delimiter!==',')throw Error('Invalid object separator');}
  }
  if(char==='['){cursor++;whitespace();if(text[cursor]===']'){cursor++;return;}for(;;){value(depth+1);whitespace();const delimiter=text[cursor++];if(delimiter===']')return;if(delimiter!==',')throw Error('Invalid array separator');}}
  if(char==='"'){string();return;}
  const token=/^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/.exec(text.slice(cursor));if(!token)throw Error('Invalid JSON value');cursor+=token[0].length;
 };
 value(0);whitespace();if(cursor!==text.length)throw Error('Unexpected trailing input');
}
/** C6-private parser, reused by the bounded worker; one decoded UTF-8 BOM is permitted. */
export function parseSnapshotJSON(text:string):Outcome<PortableSnapshot>{
 try{const content=text.startsWith('\ufeff')?text.slice(1):text;rejectDuplicateProperties(content);return validateSnapshot(JSON.parse(content));}catch{return invalid();}
}
