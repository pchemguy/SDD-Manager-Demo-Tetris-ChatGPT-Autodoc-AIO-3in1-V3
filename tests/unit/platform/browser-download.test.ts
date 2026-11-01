import {expect,test} from 'vitest';
import {createBrowserPorts} from '../../../src/platform/browser';
function setup(fail=false){
 const events:string[]=[],timers:Array<()=>void>=[];let downloaded='',href='',blob:Blob|undefined;
 const anchor={set download(value:string){downloaded=value;},set href(value:string){href=value;},style:{display:''},click(){events.push('click');if(fail)throw Error('Host declined download');},remove(){events.push('remove');}};
 const host={performance:{now:()=>0},document:{createElement:()=>anchor,body:{append:()=>events.push('append')}},URL:{createObjectURL(value:Blob){blob=value;events.push('create');return 'blob:owned';},revokeObjectURL(value:string){events.push('revoke:'+value);}},Blob,setTimeout:(fn:()=>void)=>{timers.push(fn);return 1;}} as unknown as Window;
 return {ports:createBrowserPorts(host),events,timers,downloaded:()=>downloaded,href:()=>href,blob:()=>blob};
}
test('manual download requests one local Blob and removes/revokes every owned resource',async()=>{
 const a=setup(),bytes=new Uint8Array([1,2,3]),result=await a.ports.download({name:'tetris-save.json',bytes});expect(result.ok).toBe(true);expect(a.downloaded()).toBe('tetris-save.json');expect(a.href()).toBe('blob:owned');expect(a.events).toEqual(['create','append','click','remove']);expect(new Uint8Array(await a.blob()!.arrayBuffer())).toEqual(bytes);expect(a.blob()!.type).toBe('application/json');expect(a.timers).toHaveLength(1);a.timers[0]!();expect(a.events.at(-1)).toBe('revoke:blob:owned');
});
test('declined download returns file-failed and still releases anchor/object URL',async()=>{
 const a=setup(true),result=await a.ports.download({name:'tetris-save.json',bytes:new Uint8Array([1])});expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('file-failed');expect(a.events).toEqual(['create','append','click','remove']);a.timers[0]!();expect(a.events.at(-1)).toBe('revoke:blob:owned');
});
