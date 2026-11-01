import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {decodeSnapshot,encodeSnapshot} from '../../../src/files';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {PortableSnapshot} from '../../../src/models';
const snapshot:PortableSnapshot={formatVersion:1,results:[{id:'z',score:1,timestamp:'2026-01-01T00:00:00Z'},{id:'A',score:1,timestamp:'2026-01-01T00:00:00.000Z'}],settings:DEFAULT_SETTINGS};
const workers:FakeWorker[]=[];let failConstruction=false,failPosting=false;
class FakeWorker{
 onmessage:((event:MessageEvent)=>void)|null=null;onerror:((event:Event)=>void)|null=null;onmessageerror:((event:Event)=>void)|null=null;
 request:any;transfers?:Transferable[];terminated=0;
 constructor(public url:URL,public options:WorkerOptions){if(failConstruction)throw Error('Local worker unavailable');workers.push(this);}
 postMessage(value:any,transfers?:Transferable[]){if(failPosting)throw Error('Cannot transfer');this.request=value;this.transfers=transfers;}
 terminate(){this.terminated++;}
 reply(outcome:unknown,id=this.request.id){this.onmessage?.(new MessageEvent('message',{data:{id,outcome}}));}
}
beforeEach(()=>{workers.length=0;failConstruction=false;failPosting=false;vi.useFakeTimers();vi.stubGlobal('Worker',FakeWorker);});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
test('worker decode owns copied input and validates/ranks a coherent returned snapshot',async()=>{
 const input=new Uint8Array([123,125]),pending=decodeSnapshot(input),worker=workers[0]!;expect(worker).toBeDefined();expect(worker.options.type).toBe('module');expect(worker.request.bytes).toEqual(input);expect(worker.request.bytes.buffer).not.toBe(input.buffer);expect(worker.transfers).toEqual([worker.request.bytes.buffer]);
 worker.reply({ok:true,value:snapshot});expect(await pending).toEqual({ok:true,value:{...snapshot,results:[snapshot.results[1],snapshot.results[0]]}});expect(input).toEqual(new Uint8Array([123,125]));expect(worker.terminated).toBe(1);expect(vi.getTimerCount()).toBe(0);
});
test('encode validates before starting a worker, owns its snapshot and returns owned bytes',async()=>{
 const invalid=await encodeSnapshot({...snapshot,results:[{...snapshot.results[0]!,score:-1}]},'json');expect(invalid.ok).toBe(false);if(!invalid.ok)expect(invalid.error.code).toBe('invalid-data');expect(workers).toHaveLength(0);
 const pending=encodeSnapshot(snapshot,'json'),worker=workers[0]!;expect(worker.request.snapshot.results.map((r:{id:string})=>r.id)).toEqual(['A','z']);expect(worker.request.snapshot.settings).not.toBe(snapshot.settings);
 const bytes=new Uint8Array([1,2,3]);worker.reply({ok:true,value:bytes});const result=await pending;expect(result).toEqual({ok:true,value:bytes});if(result.ok)expect(result.value).not.toBe(bytes);expect(worker.terminated).toBe(1);expect(vi.getTimerCount()).toBe(0);
});
test('rejects oversized and empty inputs before worker creation and leaves original bytes intact',async()=>{
 for(const [bytes,code]of [[new Uint8Array(4*1024*1024+1),'invalid-data'],[new Uint8Array(),'unsupported-format']] as const){const outcome=await decodeSnapshot(bytes);expect(outcome.ok).toBe(false);if(!outcome.ok)expect(outcome.error.code).toBe(code);}expect(workers).toHaveLength(0);
});
test('ten-second deadline terminates unresponsive work and clears owned callbacks/timers',async()=>{
 const pending=decodeSnapshot(new Uint8Array([123])),worker=workers[0]!;let settled=false;void pending.then(()=>{settled=true;});await vi.advanceTimersByTimeAsync(9999);expect(settled).toBe(false);await vi.advanceTimersByTimeAsync(1);const result=await pending;expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('file-failed');expect(worker.terminated).toBe(1);expect(worker.onmessage).toBeNull();expect(worker.onerror).toBeNull();expect(vi.getTimerCount()).toBe(0);
});
test('pre-aborted and active aborts return stale-session and prevent late completion',async()=>{
 const pre=new AbortController();pre.abort();const rejected=await decodeSnapshot(new Uint8Array([123]),pre.signal);expect(rejected.ok).toBe(false);if(!rejected.ok)expect(rejected.error.code).toBe('stale-session');expect(workers).toHaveLength(0);
 const signal=new AbortController(),pending=decodeSnapshot(new Uint8Array([123]),signal.signal),worker=workers[0]!,late=worker.onmessage;signal.abort();const result=await pending;expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('stale-session');late?.(new MessageEvent('message',{data:{id:worker.request.id,outcome:{ok:true,value:snapshot}}}));expect(worker.terminated).toBe(1);expect(vi.getTimerCount()).toBe(0);
});
test('stale replies cannot settle a newer request and concurrent operation ownership is independent',async()=>{
 const signal=new AbortController(),first=decodeSnapshot(new Uint8Array([123]),signal.signal),second=decodeSnapshot(new Uint8Array([123]));const [a,b]=workers;let settled=false;void second.then(()=>{settled=true;});b!.reply({ok:true,value:snapshot},a!.request.id);await Promise.resolve();expect(settled).toBe(false);signal.abort();expect((await first).ok).toBe(false);expect(b!.terminated).toBe(0);b!.reply({ok:true,value:snapshot});expect((await second).ok).toBe(true);expect(workers.map(w=>w.terminated)).toEqual([1,1]);expect(vi.getTimerCount()).toBe(0);
});
test('constructor, post, worker and malformed-response failures are finite and release resources',async()=>{
 failConstruction=true;expect((await decodeSnapshot(new Uint8Array([123]))).ok).toBe(false);expect(vi.getTimerCount()).toBe(0);failConstruction=false;failPosting=true;expect((await decodeSnapshot(new Uint8Array([123]))).ok).toBe(false);expect(workers[0]!.terminated).toBe(1);failPosting=false;
 for(const kind of ['error','messageerror','malformed']){const pending=decodeSnapshot(new Uint8Array([123])),worker=workers.at(-1)!;if(kind==='error')worker.onerror?.(new Event('error'));else if(kind==='messageerror')worker.onmessageerror?.(new Event('messageerror'));else worker.reply({ok:true,value:{partial:true}});const result=await pending;expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('runtime-unavailable');expect(worker.terminated).toBe(1);expect(vi.getTimerCount()).toBe(0);}
});
test('worker validation failures remain typed and unknown formats cannot produce fake JSON bytes',async()=>{
 expect((await encodeSnapshot(snapshot,'xml' as never)).ok).toBe(false);expect(workers).toHaveLength(0);
 const pending=decodeSnapshot(new Uint8Array([123])),worker=workers[0]!;worker.reply({ok:false,error:{code:'invalid-data',message:'Rejected complete candidate.'}});expect(await pending).toEqual({ok:false,error:{code:'invalid-data',message:'Rejected complete candidate.'}});expect(worker.terminated).toBe(1);
});
