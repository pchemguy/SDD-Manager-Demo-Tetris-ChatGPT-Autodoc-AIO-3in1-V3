/** Public C7 effect contract: preserve raw unrelated URL data and compensate handled errors. */
import {expect,test} from 'vitest';
import {createBrowserPorts} from '../../../src/platform/browser';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {SettingsTransaction} from '../../../src/models';
type Fault='cookie-once'|'cookie-permanent'|'cookie-silent'|'history-before'|'history-after'|'history-silent'|'history-permanent';
function origin(fault?:Fault){
 let href='http://example.test/play?unrelated=a%20b&ghost=show&%67host=dynamic&keep=a+b&bare#keep%20fragment',cookieCalls=0,historyCalls=0,state:unknown={screen:'retained'};
 const jar=new Map([['tetris.ghost','show'],['tetris.hold','true'],['unrelated','a%2Fb']]),writes:string[]=[],history:Array<{state:unknown;url:string}>=[];
 const host={location:{get href(){return href;},get search(){return new URL(href).search;},get protocol(){return new URL(href).protocol;}},document:{get cookie(){return [...jar].map(([key,value])=>`${key}=${value}`).join('; ');},set cookie(value:string){writes.push(value);cookieCalls++;if((fault==='cookie-once'&&cookieCalls===2)||(fault==='cookie-permanent'&&cookieCalls>=2))throw Error('cookie failure');if(fault==='cookie-silent'&&cookieCalls===1)return;const token=value.split(';',1)[0]!,i=token.indexOf('=');if(value.includes('Max-Age=0'))jar.delete(token.slice(0,i));else jar.set(token.slice(0,i),token.slice(i+1));}},history:{get state(){return state;},replaceState(value:unknown,_title:string,url:string){historyCalls++;history.push({state:value,url});if(fault==='history-before'&&historyCalls===1)throw Error('history failure');if(fault==='history-permanent'){if(historyCalls===1){href=url;state=value;}throw Error('history unavailable');}href=fault==='history-silent'&&historyCalls===1?'http://example.test/wrong#broken':url;state=value;if(fault==='history-after'&&historyCalls===1)throw Error('late history failure');}}} as unknown as Window;
 return{host,jar,writes,history,snapshot:()=>({cookies:[...jar],href,state})};
}
const edit:SettingsTransaction={previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,ghost:'hide',hold:false},writeKeys:['ghost','hold'],reason:'edit'};
test('edit replaces only requested known groups and preserves raw unrelated parameters fragment and history state',async()=>{
 const h=origin(),before=h.snapshot(),result=await createBrowserPorts(h.host).commitSettings(edit);expect(result).toEqual({ok:true,value:undefined});expect(h.host.location.href).toBe('http://example.test/play?unrelated=a%20b&keep=a+b&bare&ghost=hide&hold=false#keep%20fragment');expect(h.jar.get('tetris.ghost')).toBe('hide');expect(h.jar.get('tetris.hold')).toBe('false');expect(h.jar.get('unrelated')).toBe('a%2Fb');expect(h.writes).toHaveLength(2);expect(h.history).toHaveLength(1);expect(h.history[0]!.state).toEqual(before.state);expect(h.host.history.state).toEqual(before.state);
});
test('Restore writes all six selected canonical values with one coherent URL replacement',async()=>{
 const h=origin(),keys=Object.keys(DEFAULT_SETTINGS) as SettingsTransaction['writeKeys'];const tx:SettingsTransaction={previous:DEFAULT_SETTINGS,next:{ghost:'dynamic',hardDrop:false,nextPreview:false,hardDropLock:'immediate',lockPolicy:'failed',hold:false},writeKeys:keys,reason:'restore'};
 expect((await createBrowserPorts(h.host).commitSettings(tx)).ok).toBe(true);expect(h.writes).toHaveLength(6);expect(h.history).toHaveLength(1);const url=new URL(h.host.location.href);for(const key of keys){expect(url.searchParams.getAll(key)).toEqual([String(tx.next[key])]);expect(h.jar.get(`tetris.${key}`)).toBe(String(tx.next[key]));}expect(h.host.location.href).toContain('unrelated=a%20b&keep=a+b&bare&');expect(url.hash).toBe('#keep%20fragment');
});
test('an explicit unchanged default still persists its canonical cookie and URL value',async()=>{
 const h=origin();h.jar.set('tetris.ghost','hide');expect((await createBrowserPorts(h.host).commitSettings({previous:DEFAULT_SETTINGS,next:DEFAULT_SETTINGS,writeKeys:['ghost'],reason:'edit'})).ok).toBe(true);expect(h.jar.get('tetris.ghost')).toBe('show');expect(new URL(h.host.location.href).searchParams.getAll('ghost')).toEqual(['show']);expect(h.writes).toHaveLength(1);
});
for(const fault of ['cookie-once','cookie-silent','history-before','history-after','history-silent'] as const)test(`handled ${fault} compensates cookies URL and history state before failure`,async()=>{
 const h=origin(fault),before=h.snapshot(),result=await createBrowserPorts(h.host).commitSettings(edit);expect(result.ok).toBe(false);if(!result.ok){expect(result.error.code).toBe('persistence-failed');expect(result.error.message).toContain('restored');expect(result.error.message).not.toContain('could not be fully restored');}expect(h.snapshot()).toEqual(before);
});
for(const fault of ['cookie-permanent','history-permanent'] as const)test(`${fault} reports a failed compensation without claiming rollback passed`,async()=>{
 const h=origin(fault),before=h.snapshot(),result=await createBrowserPorts(h.host).commitSettings(edit);expect(result.ok).toBe(false);if(!result.ok){expect(result.error.code).toBe('persistence-failed');expect(result.error.message).toContain('could not be fully restored');}expect(h.snapshot()).not.toEqual(before);
});
test('invalid full values unknown/duplicate keys and partial Restore reject before any effect',async()=>{
 for(const tx of [{...edit,next:{...edit.next,hold:'false'}},{...edit,writeKeys:['ghost','ghost']},{...edit,writeKeys:['unknown']},{...edit,writeKeys:['ghost'],reason:'restore'}]){
  const h=origin(),before=h.snapshot(),result=await createBrowserPorts(h.host).commitSettings(tx as never);expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('invalid-data');expect(h.snapshot()).toEqual(before);expect(h.writes).toEqual([]);expect(h.history).toEqual([]);
 }
});
test('an edit may not change selected values outside its declared write keys',async()=>{
 const h=origin(),before=h.snapshot(),result=await createBrowserPorts(h.host).commitSettings({...edit,writeKeys:['ghost']});expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('invalid-data');expect(h.snapshot()).toEqual(before);expect(h.writes).toEqual([]);expect(h.history).toEqual([]);
});
