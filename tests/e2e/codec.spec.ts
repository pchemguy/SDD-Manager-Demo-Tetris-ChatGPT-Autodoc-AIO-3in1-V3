import {expect,test} from '@playwright/test';
test.beforeEach(async({page})=>{test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Public codec source consumer is not a release entry; extracted app file operations follow in T044/T047.');await page.goto('/tests/fixtures/codec.html');await expect(page.locator('#status')).toHaveText('Ready');});
test('real local worker round-trips UTF-8 JSON under strict page and worker script CSP',async({page})=>{
 await page.route('**/src/files/codec.worker.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"default-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'"}});});
 const result=await page.evaluate(async()=>{
  const {encodeSnapshot,decodeSnapshot}=await import('/tests/fixtures/codec.ts' as string);
  const input={formatVersion:1,results:[{id:'z',score:1,timestamp:'0001-01-01T00:00:00.1Z'},{id:'A',score:1,timestamp:'0001-01-01T00:00:00.100Z'}],settings:{ghost:'dynamic',hardDrop:false,nextPreview:false,hardDropLock:'immediate',lockPolicy:'failed',hold:false}};
  const saved=await encodeSnapshot(input,'json');if(!saved.ok)return {saved};const before=[...saved.value],text=new TextDecoder().decode(saved.value),restored=await decodeSnapshot(saved.value),bom=new Uint8Array(saved.value.length+3);bom.set([239,187,191]);bom.set(saved.value,3);
  return {saved:{ok:true},text,restored,bom:await decodeSnapshot(bom),inputUnchanged:JSON.stringify(before)===JSON.stringify([...saved.value])};
 });
 expect(result.saved.ok).toBe(true);expect(result.inputUnchanged).toBe(true);expect(result.restored).toEqual(result.bom);expect(result.restored?.ok).toBe(true);if(result.restored?.ok){expect(result.restored.value.results.map((r:{id:string})=>r.id)).toEqual(['A','z']);expect(result.restored.value.results.map((r:{timestamp:string})=>r.timestamp)).toEqual(['0001-01-01T00:00:00.100Z','0001-01-01T00:00:00.1Z']);expect(Object.keys(JSON.parse(result.text!)).sort()).toEqual(['formatVersion','results','settings']);}
});
test('worker rejects malformed/duplicate/version/encoding/size data with typed outcomes',async({page})=>{
 const codes=await page.evaluate(async()=>{
  const {decodeSnapshot}=await import('/tests/fixtures/codec.ts' as string),settings={ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true},valid=JSON.stringify({formatVersion:1,results:[],settings}),encoder=new TextEncoder();
  const inputs=[encoder.encode(valid.replace('"formatVersion":1','"formatVersion":1,"formatVersion":1')),encoder.encode(valid.replace('"formatVersion":1','"formatVersion":2')),encoder.encode('{bad'),new Uint8Array([255]),encoder.encode('not a snapshot'),new Uint8Array(),new Uint8Array(4*1024*1024+1),encoder.encode('\ufeff\ufeff'+valid),encoder.encode(valid.replace('"results":[]','"results":[{"id":"bad","score":1,"timestamp":"1900-02-29T00:00:00Z"}]'))];
  return Promise.all(inputs.map(async bytes=>{const result=await decodeSnapshot(bytes);return result.ok?'accepted':result.error.code;}));
 });expect(codes).toEqual(['invalid-data','unsupported-format','invalid-data','unsupported-format','invalid-data','unsupported-format','invalid-data','invalid-data','invalid-data']);
});
test('UI remains responsive during stalled worker loading and abort terminates the owned request',async({page})=>{
 let release=()=>{},observed=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;}),requested=new Promise<void>(resolve=>{observed=resolve;});
 await page.route('**/src/files/codec.worker.ts*',async route=>{observed();await gate;await route.continue().catch(()=>{});});
 try{
  await page.evaluate(async()=>{const {decodeSnapshot}=await import('/tests/fixtures/codec.ts' as string),state=window as any;state.abortCodec=new AbortController();state.codecResult=null;void decodeSnapshot(new Uint8Array([123]),state.abortCodec.signal).then((result:unknown)=>{state.codecResult=result;});});await requested;
  await page.locator('#probe').click();await expect(page.locator('#status')).toHaveText('Responsive 1');await page.evaluate(()=>{(window as any).abortCodec.abort();});await expect.poll(()=>page.evaluate(()=>(window as any).codecResult?.error?.code)).toBe('stale-session');
 }finally{release();}
});
test('exactly 4 MiB remains valid and local worker initialization failure reports a finite error',async({page})=>{
 const bounded=await page.evaluate(async()=>{const {decodeSnapshot}=await import('/tests/fixtures/codec.ts' as string),text=JSON.stringify({formatVersion:1,results:[],settings:{ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true}}),bytes=new TextEncoder().encode(text.padEnd(4*1024*1024,' '));const result=await decodeSnapshot(bytes);return {length:bytes.length,ok:result.ok};});expect(bounded).toEqual({length:4*1024*1024,ok:true});
 await page.route('**/src/files/codec.worker.ts*',route=>route.abort());const failure=await page.evaluate(async()=>{const {decodeSnapshot}=await import('/tests/fixtures/codec.ts' as string);return decodeSnapshot(new Uint8Array([123]));});expect(failure.ok).toBe(false);if(!failure.ok)expect(failure.error.code).toBe('runtime-unavailable');await page.locator('#probe').click();await expect(page.locator('#status')).toHaveText('Responsive 1');
});
