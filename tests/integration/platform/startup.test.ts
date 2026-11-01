/** Compose the actual public C3/C5/C7 modules with a controlled browser-origin host. */
import {expect,test} from 'vitest';
import {createBrowserPorts} from '../../../src/platform/browser';
import {createController} from '../../../src/application';
import {createGame} from '../../../src/domain';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {Capabilities} from '../../../src/models';
const caps:Capabilities=new Set(['modern','settings','persistentSettings']);
const flush=async()=>{for(let n=0;n<8;n++)await Promise.resolve();};
function compose(failSecond=false){
 let time=0,attempts=0;const jar=new Map([['tetris.ghost','hide'],['tetris.nextPreview','false'],['unrelated','keep']]),writes:string[]=[];
 const windowListeners=new Map<string,Set<()=>void>>(),documentListeners=new Map<string,Set<()=>void>>();
 const add=(map:Map<string,Set<()=>void>>)=>(type:string,fn:()=>void)=>{if(!map.has(type))map.set(type,new Set());map.get(type)!.add(fn);};
 const remove=(map:Map<string,Set<()=>void>>)=>(type:string,fn:()=>void)=>{map.get(type)?.delete(fn);};
 const host={location:{search:'?ghost=show&lockPolicy=failed&unknown=keep',protocol:'http:',href:'http://localhost/?ghost=show&lockPolicy=failed&unknown=keep#anchor'},performance:{now:()=>time},crypto:globalThis.crypto,
  addEventListener:add(windowListeners),removeEventListener:remove(windowListeners),document:{hidden:false,addEventListener:add(documentListeners),removeEventListener:remove(documentListeners),get cookie(){return [...jar].map(([key,value])=>`${key}=${value}`).join('; ');},set cookie(value:string){writes.push(value);if(failSecond&&++attempts===2)throw Error('one handled failure');const token=value.split(';',1)[0]!,i=token.indexOf('=');if(value.includes('Max-Age=0'))jar.delete(token.slice(0,i));else jar.set(token.slice(0,i),token.slice(i+1));}}} as unknown as Window;
 const ports=createBrowserPorts(host),c=createController({game:createGame(123,'idle',DEFAULT_SETTINGS,caps,'idle'),settings:DEFAULT_SETTINGS,results:[],completedRunId:null},ports,caps);
 return{c,ports,jar,writes,at:(n:number)=>{time=n;},blur:()=>{for(const fn of windowListeners.get('blur')??[])fn();},bindings:()=>[...windowListeners.values(),...documentListeners.values()].reduce((n,set)=>n+set.size,0)};
}
test('actual adapter startup and controller queue integrate with policy, lifecycle checkpoint and disposal',async()=>{
 const a=compose();a.c.start();expect(a.c.view().state.game.status).toBe('idle');await flush();expect(a.c.view().state.settings).toMatchObject({ghost:'show',nextPreview:false,lockPolicy:'failed'});expect(a.c.view().state.game.piecePolicy.lockPolicy).toBe('failed');expect(a.writes).toHaveLength(2);expect(Object.fromEntries(a.jar)).toEqual({'tetris.ghost':'show','tetris.nextPreview':'false',unrelated:'keep','tetris.lockPolicy':'failed'});
 a.at(250);a.blur();await flush();const checkpoint=await a.ports.loadCheckpoint();expect(checkpoint.ok).toBe(true);if(checkpoint.ok){expect(checkpoint.value!.state.game.status).toBe('paused');expect(checkpoint.value!.state.game.timers.gravityRemainingMs).toBe(750);expect(checkpoint.value!.state.settings).toEqual(a.c.view().state.settings);}
 a.c.dispose();expect(a.bindings()).toBe(0);const before=a.writes.length;a.blur();expect(a.writes).toHaveLength(before);
});
test('actual startup compensation retains old cookies while the resolved page remains usable with a warning',async()=>{
 const a=compose(true);await flush();expect(Object.fromEntries(a.jar)).toEqual({'tetris.ghost':'hide','tetris.nextPreview':'false',unrelated:'keep'});expect(a.c.view().state.settings).toMatchObject({ghost:'show',nextPreview:false,lockPolicy:'failed'});expect(a.c.view().error?.message).toContain('restored');a.c.start();expect(a.c.view().state.game.status).toBe('running');expect(a.c.view().state.game.piecePolicy.lockPolicy).toBe('failed');expect(a.c.view().error?.code).toBe('persistence-failed');a.c.dispose();
});
