/** UTF-8 JSON conversion runs in the isolated codec worker, never on the UI thread. */
import type {Outcome,PortableSnapshot} from '../models';
import {parseSnapshotJSON,validateSnapshot} from './validation';
import {MAX_FILE_BYTES} from './limits';
export function encodeJSON(snapshot:PortableSnapshot):Outcome<Uint8Array>{
 const candidate=validateSnapshot(snapshot);if(!candidate.ok)return candidate;
 return {ok:true,value:new TextEncoder().encode(JSON.stringify(candidate.value,null,2)+'\n')};
}
export function decodeJSON(bytes:Uint8Array):Outcome<PortableSnapshot>{
 if(bytes.byteLength>MAX_FILE_BYTES)return {ok:false,error:{code:'invalid-data',message:'Choose a file no larger than 4 MiB.'}};
 let text:string;try{text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{return {ok:false,error:{code:'unsupported-format',message:'This is not a supported UTF-8 JSON or SQLite file.'}};}
 const content=(text.startsWith('\ufeff')?text.slice(1):text).replace(/^[ \t\r\n]*/,'');
 if(content.startsWith('\ufeff'))return {ok:false,error:{code:'invalid-data',message:'A JSON file may have only one UTF-8 byte-order mark.'}};
 if(!content||!/[{["\-0-9tfn]/.test(content[0]!))return {ok:false,error:{code:'unsupported-format',message:'Choose a nonempty JSON or SQLite snapshot.'}};
 return parseSnapshotJSON(text);
}
