import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {registerChromium,type ChromiumAPI} from '../../../src/platform/extension/chromium';
test('Chromium shell declares only storage/sidebar access and a local MV3 panel/runtime',()=>{
 const m=JSON.parse(readFileSync('platforms/chromium/manifest.json','utf8'));expect(m.manifest_version).toBe(3);expect(m.minimum_chrome_version).toBe('116');expect(m.permissions.sort()).toEqual(['sidePanel','storage']);expect(m.side_panel).toEqual({default_path:'sidebar.html'});expect(m.background).toEqual({service_worker:'background.js',type:'module'});expect(m.action.default_popup).toBeUndefined();expect(m.content_scripts).toBeUndefined();expect(m.host_permissions).toBeUndefined();expect(m.version).toBe(JSON.parse(readFileSync('package.json','utf8')).version);
});
test('action panel behavior and coordinator handlers register without any gameplay loop',async()=>{
 const events:string[]=[];const api={runtime:{id:'owned',getURL:(path:string)=>`chrome-extension://owned/${path}`,onMessage:{addListener:()=>events.push('message')}},storage:{session:{}},windows:{onRemoved:{addListener:()=>events.push('cleanup')}},sidePanel:{setPanelBehavior:async(value:unknown)=>{expect(value).toEqual({openPanelOnActionClick:true});events.push('action');}}} as unknown as ChromiumAPI;
 registerChromium(api);await Promise.resolve();expect(events).toEqual(['message','cleanup','action']);
});
