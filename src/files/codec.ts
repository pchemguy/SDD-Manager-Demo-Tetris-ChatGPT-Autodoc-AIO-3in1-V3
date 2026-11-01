/** Own a local module worker, byte copies, cancellation and a finite per-operation deadline. */
import type {AppError,FileFormat,Outcome,PortableSnapshot} from '../models';
import type {CodecRequest} from './protocol';
import {validateSnapshot} from './validation';
import {CODEC_TIMEOUT_MS,MAX_FILE_BYTES} from './limits';
let identity=0;
const failure=(code:AppError['code'],message:string):Outcome<never>=>({ok:false,error:{code,message}});
function run<T extends Uint8Array|PortableSnapshot>(request:Omit<Extract<CodecRequest,{operation:'encode'}>,'id'>|Omit<Extract<CodecRequest,{operation:'decode'}>,'id'>,signal?:AbortSignal):Promise<Outcome<T>>{
 return new Promise(resolve=>{
  if(signal?.aborted){resolve(failure('stale-session','The file operation was cancelled because this session closed.'));return;}
  const id=++identity;let worker:Worker|undefined,timer:ReturnType<typeof setTimeout>|undefined,settled=false;
  const finish=(outcome:Outcome<T>)=>{
   if(settled)return;settled=true;if(timer!==undefined)clearTimeout(timer);signal?.removeEventListener('abort',abort);
   if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();}
   resolve(outcome);
  };
  const abort=()=>finish(failure('stale-session','The file operation was cancelled because this session closed.'));
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>finish(failure('file-failed','File processing exceeded ten seconds; no snapshot was committed.')),CODEC_TIMEOUT_MS);
  try{
   worker=new Worker(new URL('./codec.worker.ts',import.meta.url),{type:'module'});
   worker.onerror=event=>{event.preventDefault();finish(failure('runtime-unavailable','The local file worker could not be initialized.'));};
   worker.onmessageerror=()=>finish(failure('runtime-unavailable','The local file worker returned an unreadable response.'));
   worker.onmessage=event=>{
    if(settled||event.data?.id!==id)return;const outcome=event.data.outcome;
    if(outcome?.ok===false&&outcome.error&&['invalid-data','unsupported-format','file-failed','stale-session','runtime-unavailable'].includes(outcome.error.code)&&typeof outcome.error.message==='string'&&outcome.error.message.length>0){finish({ok:false,error:{code:outcome.error.code,message:outcome.error.message}});return;}
    if(outcome?.ok===true){
     if(request.operation==='encode'&&outcome.value instanceof Uint8Array&&outcome.value.byteLength>0&&outcome.value.byteLength<=MAX_FILE_BYTES){finish({ok:true,value:new Uint8Array(outcome.value) as T});return;}
     if(request.operation==='decode'){const validated=validateSnapshot(outcome.value);if(validated.ok){finish({ok:true,value:validated.value as T});return;}}
    }
    finish(failure('runtime-unavailable','The local file worker returned an invalid response.'));
   };
   worker.postMessage({...request,id},request.operation==='decode'?[request.bytes.buffer as ArrayBuffer]:[]);
  }catch{finish(failure('runtime-unavailable','Local file processing could not be started.'));}
 });
}
/** Encode one validated owned snapshot; abort/timeout terminate this operation's worker. */
export async function encodeSnapshot(snapshot:PortableSnapshot,format:FileFormat,signal?:AbortSignal):Promise<Outcome<Uint8Array>>{
 if(signal?.aborted)return failure('stale-session','The file operation was cancelled because this session closed.');
 const validated=validateSnapshot(snapshot);if(!validated.ok)return validated;
 if(format!=='json'&&format!=='sqlite')return failure('unsupported-format','Choose JSON or SQLite for this snapshot.');
 return run<Uint8Array>({operation:'encode',snapshot:validated.value,format},signal);
}
/** Input is copied before transfer, size-checked before decoding, and never detached from its caller. */
export async function decodeSnapshot(bytes:Uint8Array,signal?:AbortSignal):Promise<Outcome<PortableSnapshot>>{
 if(signal?.aborted)return failure('stale-session','The file operation was cancelled because this session closed.');
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>MAX_FILE_BYTES)return failure('invalid-data','Choose a file no larger than 4 MiB.');
 if(!bytes.byteLength)return failure('unsupported-format','Choose a nonempty JSON or SQLite snapshot.');
 try{return run<PortableSnapshot>({operation:'decode',bytes:new Uint8Array(bytes)},signal);}catch{return failure('invalid-data','These file bytes are unavailable.');}
}
