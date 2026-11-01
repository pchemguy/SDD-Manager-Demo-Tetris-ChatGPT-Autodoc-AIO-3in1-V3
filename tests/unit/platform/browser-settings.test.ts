/** C7 parser is consumed through the public browser adapter with a read-only host double. */
import {expect,test} from 'vitest';
import {createBrowserPorts} from '../../../src/platform/browser';
import {resolveSettings} from '../../../src/rules';
function host(search:string,cookie:string){let writes=0;return {window:{location:{search},document:{get cookie(){return cookie;},set cookie(_v:string){writes++;}}} as unknown as Window,writes:()=>writes};}
test('known duplicate query names are invalid as a group while unrelated parameters remain untouched',async()=>{
 const search='?ghost=hide&%67host=show&hold=false&unknown=keep';const h=host(search,'tetris.ghost=dynamic; unrelated=keep');const r=await createBrowserPorts(h.window).readSettings();expect(r.ok).toBe(true);
 if(r.ok){expect(r.value.query).toEqual({ghost:'',hold:'false'});const v=resolveSettings(r.value.query,r.value.saved);expect(v.settings.ghost).toBe('dynamic');expect(v.settings.hold).toBe(false);expect(v.warnings).toHaveLength(1);}
 expect(h.window.location.search).toBe(search);expect(h.writes()).toBe(0);
});
test('cookie values decode once and corrupt or duplicate keys do not poison independent values',async()=>{
 const h=host('?nextPreview=false&Ghost=hide','tetris.ghost=%73how; tetris.hardDrop=%E0%A4%A; tetris.hold=true; tetris.hold=false; tetris.lockPolicy=failed; unknown=%E0%A4%A');const r=await createBrowserPorts(h.window).readSettings();expect(r.ok).toBe(true);
 if(r.ok){expect(r.value.query).toEqual({nextPreview:'false'});expect(r.value.saved).toEqual({ghost:'show',hardDrop:'',hold:'',lockPolicy:'failed'});const v=resolveSettings(r.value.query,r.value.saved);expect(v.settings).toMatchObject({ghost:'show',hardDrop:true,hold:true,lockPolicy:'failed',nextPreview:false});expect(v.warnings).toEqual([]);}
 expect(h.writes()).toBe(0);
});
test('parsing preserves padded values for strict validation instead of silently trimming them',async()=>{
 const h=host('?hardDrop=%20false&hold=TRUE','tetris.ghost=hide%20; tetris.hardDrop=false; tetris.nextPreview=false');const r=await createBrowserPorts(h.window).readSettings();expect(r.ok).toBe(true);
 if(r.ok){const v=resolveSettings(r.value.query,r.value.saved);expect(v.settings).toMatchObject({ghost:'show',hardDrop:false,nextPreview:false,hold:true});expect(v.warnings).toHaveLength(2);expect(v.explicit).toEqual([]);}
 expect(h.writes()).toBe(0);
});

import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {SettingsTransaction} from '../../../src/models';
function cookieHost(initial:Record<string,string>,failure:'once'|'permanent'|null=null,blocked=false){
 const jar=new Map(Object.entries(initial)),writes:string[]=[];let attempts=0;
 const window={location:{search:'?hold=false',protocol:'https:',href:'https://example.test/?hold=false#keep'},document:{get cookie(){if(blocked)throw Error('blocked read');return [...jar].map(([k,v])=>`${k}=${v}`).join('; ');},set cookie(value:string){writes.push(value);attempts++;if((failure==='once'&&attempts===2)||(failure==='permanent'&&attempts>=2))throw Error('blocked write');const token=value.split(';',1)[0]!,i=token.indexOf('='),key=token.slice(0,i);if(value.includes('Max-Age=0'))jar.delete(key);else jar.set(key,token.slice(i+1));}},history:{replaceState(){throw Error('startup must not replace URL');}}} as unknown as Window;
 return{window,jar,writes};
}
const startup:SettingsTransaction={previous:DEFAULT_SETTINGS,next:{...DEFAULT_SETTINGS,ghost:'show',hold:false},writeKeys:['ghost','hold'],reason:'startup'};
test('startup writes and verifies only explicit cookies including a default with the required origin attributes',async()=>{
 const h=cookieHost({'tetris.ghost':'hide','tetris.hardDrop':'false',unrelated:'keep'});const result=await createBrowserPorts(h.window).commitSettings(startup);expect(result.ok).toBe(true);expect(Object.fromEntries(h.jar)).toEqual({'tetris.ghost':'show','tetris.hardDrop':'false',unrelated:'keep','tetris.hold':'false'});expect(h.writes).toHaveLength(2);for(const value of h.writes){expect(value).toContain('Path=/');expect(value).toContain('SameSite=Lax');expect(value).toContain('Max-Age=31536000');expect(value).toContain('Secure');}expect(h.window.location.href).toBe('https://example.test/?hold=false#keep');
});
test('a handled startup write failure compensates prior cookie values before returning failure',async()=>{
 const before={'tetris.ghost':'hide',unrelated:'keep'},h=cookieHost(before,'once');const result=await createBrowserPorts(h.window).commitSettings(startup);expect(result.ok).toBe(false);if(!result.ok){expect(result.error.code).toBe('persistence-failed');expect(result.error.message).toContain('restored');}expect(Object.fromEntries(h.jar)).toEqual(before);
});
test('an external failure that prevents compensation reports the unverified rollback honestly',async()=>{
 const h=cookieHost({'tetris.ghost':'hide'},'permanent');const result=await createBrowserPorts(h.window).commitSettings(startup);expect(result.ok).toBe(false);if(!result.ok)expect(result.error.message).toContain('could not be fully restored');expect(h.jar.get('tetris.ghost')).toBe('show');
});
test('unavailable cookie access retains raw URL resolution and reports non-persistence without writes',async()=>{
 const h=cookieHost({},null,true),ports=createBrowserPorts(h.window),read=await ports.readSettings();expect(read.ok).toBe(true);if(read.ok)expect(resolveSettings(read.value.query,read.value.saved).settings.hold).toBe(false);const result=await ports.commitSettings({...startup,writeKeys:[]});expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('persistence-failed');expect(h.writes).toEqual([]);
});

test('duplicate unrelated setting cookies do not block valid explicit startup keys',async()=>{
 const h=cookieHost({'tetris.ghost':'hide'}),descriptor=Object.getOwnPropertyDescriptor(h.window.document,'cookie')!;
 Object.defineProperty(h.window.document,'cookie',{...descriptor,get(){return descriptor.get!.call(h.window.document)+'; tetris.nextPreview=true; tetris.nextPreview=false';}});
 expect((await createBrowserPorts(h.window).commitSettings(startup)).ok).toBe(true);expect(h.jar.get('tetris.ghost')).toBe('show');expect(h.jar.get('tetris.hold')).toBe('false');
});
