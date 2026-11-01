/** One request per owned worker. Termination bounds parsing and module initialization. */
import type {Outcome,PortableSnapshot} from '../models';
import type {CodecRequest,CodecResponse} from './protocol';
import {decodeJSON,encodeJSON} from './json';
import {MAX_FILE_BYTES} from './limits';
const endpoint=globalThis as unknown as {onmessage:((event:MessageEvent<CodecRequest>)=>void)|null;postMessage:(response:CodecResponse,transfer?:Transferable[])=>void;close:()=>void};
endpoint.onmessage=event=>{
 const request=event.data;let outcome:Outcome<Uint8Array|PortableSnapshot>;
 try{
  if(request.operation==='encode')outcome=request.format==='json'?encodeJSON(request.snapshot):{ok:false,error:{code:'runtime-unavailable',message:'SQLite file support is not available in this increment.'}};
  else if(!(request.bytes instanceof Uint8Array)||request.bytes.byteLength>MAX_FILE_BYTES)outcome={ok:false,error:{code:'invalid-data',message:'Choose a file no larger than 4 MiB.'}};
  else if(new TextDecoder().decode(request.bytes.subarray(0,16))==='SQLite format 3\0')outcome={ok:false,error:{code:'runtime-unavailable',message:'SQLite file support is not available in this increment.'}};
  else outcome=decodeJSON(request.bytes);
 }catch{outcome={ok:false,error:{code:'invalid-data',message:'This file could not be validated as a complete snapshot.'}};}
 try{endpoint.postMessage({id:request.id,outcome},outcome.ok&&outcome.value instanceof Uint8Array?[outcome.value.buffer as ArrayBuffer]:[]);}finally{endpoint.close();}
};
