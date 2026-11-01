/** C6/C8 readiness gate against the production worker extracted from the actual browser ZIP. */
import {expect,test,type Page} from '@playwright/test';
import {readdir} from 'node:fs/promises';
let workerPath:string;
async function probe(page:Page){return page.evaluate(path=>new Promise<any>(resolve=>{
 const worker=new Worker(path,{type:'module'});let settled=false;
 const finish=(outcome:unknown)=>{if(settled)return;settled=true;clearTimeout(timer);worker.onmessage=null;worker.onerror=null;worker.terminate();resolve(outcome);};
 const timer=setTimeout(()=>finish({ok:false,error:{code:'file-failed',message:'Readiness deadline exceeded.'}}),10000);
 worker.onerror=event=>{event.preventDefault();finish({ok:false,error:{code:'runtime-unavailable',message:'Local worker startup failed.'}});};worker.onmessage=event=>{if(event.data?.id===7)finish(event.data.outcome);};worker.postMessage({id:7,operation:'runtime'});
}),workerPath);}
test.beforeEach(async({page})=>{
 test.skip(process.env.TETRIS_PACKAGED_TEST!=='1','Readiness gate requires the actual built and extracted worker/WASM; source runtime tests run separately.');
 const files=await readdir('dist/package-smoke/assets'),workers=files.filter(name=>/^codec\.worker-.*\.js$/.test(name));expect(workers).toHaveLength(1);workerPath='/assets/'+workers[0];
 await page.route('**/assets/codec.worker-*.js',async route=>{const response=await route.fetch();await route.fulfill({response,headers:{...response.headers(),'content-security-policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; object-src 'none'"}});});
 await page.goto('/');
});
test('matching local JS/WASM readiness succeeds twice under wasm-only CSP and closes each temporary database',async({page},testInfo)=>{
 const files=await readdir('dist/package-smoke/assets');expect(files.filter(name=>/^sql-wasm-browser-.*\.wasm$/.test(name))).toHaveLength(1);
 const requests:string[]=[];page.on('request',request=>requests.push(request.url()));
 for(let cycle=0;cycle<2;cycle++){const result=await probe(page);expect(result.ok).toBe(true);expect(result.value.integrity).toBe('ok');expect(result.value.databaseClosed).toBe(true);expect(result.value.sqliteVersion).toMatch(/^3\.\d+\.\d+$/);console.log(`${testInfo.project.name} SQLite ${result.value.sqliteVersion}: integrity ${result.value.integrity}, database closed`);await testInfo.attach(`runtime-${cycle}.json`,{body:JSON.stringify(result.value),contentType:'application/json'});}
 expect(requests.some(url=>url.endsWith('.wasm'))).toBe(true);expect(requests.every(url=>new URL(url).origin==='http://127.0.0.1:4173')).toBe(true);
});
test('failed local WASM initialization is typed and finite without a CDN fallback',async({page})=>{
 const requests:string[]=[];page.on('request',request=>requests.push(request.url()));await page.route('**/*.wasm',route=>route.fulfill({status:404,contentType:'application/wasm',body:'missing'}));const result=await probe(page);expect(result.ok).toBe(false);expect(result.error.code).toBe('runtime-unavailable');expect(requests.some(url=>url.endsWith('.wasm'))).toBe(true);expect(requests.every(url=>new URL(url).origin==='http://127.0.0.1:4173')).toBe(true);await page.locator('#restart').click();await expect(page.getByTestId('status')).toHaveText('running');
});
test('owned startup deadline terminates a stalled WASM fetch while the page stays responsive',async({page})=>{
 await page.clock.install();let release=()=>{},observed=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;}),requested=new Promise<void>(resolve=>{observed=resolve;});await page.route('**/*.wasm',async route=>{observed();await gate;await route.continue().catch(()=>{});});
 try{const pending=probe(page);await requested;await page.locator('#restart').click();await expect(page.getByTestId('status')).toHaveText('running');await page.clock.fastForward(10000);const result=await pending;expect(result.ok).toBe(false);expect(result.error.code).toBe('file-failed');}finally{release();}
});
