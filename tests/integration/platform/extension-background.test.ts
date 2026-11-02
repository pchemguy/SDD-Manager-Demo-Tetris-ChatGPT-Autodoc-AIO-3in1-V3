import {test,expect} from 'vitest';
import {registerBackground,type BackgroundAPI} from '../../../src/platform/extension/background';
import type {Sender,SessionReply} from '../../../src/platform/extension/session';
test('background retains async response channel and clears only the removed window',async()=>{
 const data:Record<string,unknown>={};let receive!:(m:unknown,s:Sender,reply:(v:SessionReply)=>void)=>true,remove!:(id:number)=>void;
 const api:BackgroundAPI={runtime:{id:'owned',getURL:path=>`moz-extension://owned/${path}`,onMessage:{addListener:f=>{receive=f;}}},storage:{session:{get:async key=>({[key]:data[key]}),set:async values=>{Object.assign(data,structuredClone(values));},remove:async key=>{delete data[key];}}},windows:{get:async id=>{if(id!==7)throw Error('gone');return {id};},onRemoved:{addListener:f=>{remove=f;}}}};
 registerBackground(api);
 const message=(m:unknown)=>new Promise<SessionReply>(resolve=>expect(receive(m,{id:'owned',url:'moz-extension://owned/sidebar.html'},resolve)).toBe(true));
 expect(await message({type:'acquire',windowId:7})).toHaveProperty('generation',1);
 expect(await message({type:'acquire',windowId:8})).toHaveProperty('error');
 remove(7);await new Promise(resolve=>setTimeout(resolve,0));expect(data['tetris.window.7']).toBeUndefined();expect(data['tetris.generation']).toBe(1);
});
