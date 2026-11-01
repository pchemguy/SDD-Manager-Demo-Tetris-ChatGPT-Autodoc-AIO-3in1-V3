/** Real-origin public adapter consumer; controller edit integration belongs to its own task. */
import {expect,test} from '@playwright/test';
test('browser adapter replaces only requested URL groups and compensates actual cookie/history failures',async({page,context})=>{
 test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Public adapter source consumer; actual packaged controller edits have separate acceptance.');
 await context.addCookies([{name:'tetris.ghost',value:'show',url:'http://127.0.0.1:4173'},{name:'tetris.hold',value:'true',url:'http://127.0.0.1:4173'},{name:'unrelated',value:'keep',url:'http://127.0.0.1:4173'}]);
 await page.goto('/tests/fixtures/render.html?case=session&unrelated=a%20b&ghost=show&%67host=dynamic&keep=a+b&bare#keep%20fragment');
 const result=await page.evaluate(async()=>{
  const {createBrowserPorts}=await import('/src/platform/browser/index.ts' as string),{DEFAULT_SETTINGS}=await import('/src/rules/index.ts' as string),ports=createBrowserPorts();
  history.replaceState({screen:'retained'},'',location.href);const settings={...DEFAULT_SETTINGS,ghost:'hide',hold:false};
  const success=await ports.commitSettings({previous:DEFAULT_SETTINGS,next:settings,writeKeys:['ghost','hold'],reason:'edit'});
  const snapshot=()=>({url:location.href,cookies:document.cookie,history:history.state});const accepted=snapshot(),previous=history.replaceState.bind(history);let calls=0;
  history.replaceState=(...args:Parameters<History['replaceState']>)=>{previous(...args);if(++calls===1)throw Error('handled after history mutation');};
  const historyFailure=await ports.commitSettings({previous:settings,next:DEFAULT_SETTINGS,writeKeys:['ghost','hold'],reason:'edit'});const historyRestored=snapshot();history.replaceState=previous;
  const descriptor=Object.getOwnPropertyDescriptor(Document.prototype,'cookie')!;let writes=0;Object.defineProperty(Document.prototype,'cookie',{configurable:true,get:descriptor.get,set(this:Document,value:string){if(++writes!==1)descriptor.set!.call(this,value);}});
  const cookieFailure=await ports.commitSettings({previous:settings,next:DEFAULT_SETTINGS,writeKeys:['ghost','hold'],reason:'edit'});const cookieRestored=snapshot();Object.defineProperty(Document.prototype,'cookie',descriptor);
  return{success,accepted,historyFailure,historyRestored,cookieFailure,cookieRestored};
 });
 expect(result.success).toEqual({ok:true,value:undefined});expect(result.accepted.url).toBe('http://127.0.0.1:4173/tests/fixtures/render.html?case=session&unrelated=a%20b&keep=a+b&bare&ghost=hide&hold=false#keep%20fragment');expect(result.accepted.history).toEqual({screen:'retained'});
 for(const failure of [result.historyFailure,result.cookieFailure]){expect(failure.ok).toBe(false);if(!failure.ok){expect(failure.error.code).toBe('persistence-failed');expect(failure.error.message).toContain('restored');}}
 expect(result.historyRestored).toEqual(result.accepted);expect(result.cookieRestored).toEqual(result.accepted);expect(Object.fromEntries((await context.cookies()).map(c=>[c.name,c.value]))).toMatchObject({'tetris.ghost':'hide','tetris.hold':'false',unrelated:'keep'});
});
