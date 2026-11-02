import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {registerFirefox,type FirefoxAPI} from '../../../src/platform/extension/firefox';
test('Firefox uses its own MV3 event script/sidebar declaration and storage only',()=>{
 const m=JSON.parse(readFileSync('platforms/firefox/manifest.json','utf8'));expect(m.manifest_version).toBe(3);expect(m.permissions).toEqual(['storage']);expect(m.browser_specific_settings.gecko.strict_min_version).toBe('115.0');expect(m.sidebar_action.default_panel).toBe('sidebar.html');expect(m.background).toEqual({scripts:['background.js']});expect(m.side_panel).toBeUndefined();expect(m.host_permissions).toBeUndefined();expect(m.content_scripts).toBeUndefined();expect(m.version).toBe(JSON.parse(readFileSync('package.json','utf8')).version);
});
test('Firefox action invokes sidebar open synchronously within its user gesture',async()=>{
 const events:string[]=[];let action!:()=>void;const api={runtime:{id:'owned',getURL:(p:string)=>`moz-extension://owned/${p}`,onMessage:{addListener:()=>events.push('message')}},storage:{session:{}},windows:{onRemoved:{addListener:()=>events.push('cleanup')}},action:{onClicked:{addListener:(f:()=>void)=>{action=f;}}},sidebarAction:{open:()=>{events.push('open');return Promise.resolve();}}} as unknown as FirefoxAPI;
 registerFirefox(api);expect(events).toEqual(['message','cleanup']);action();expect(events).toEqual(['message','cleanup','open']);await Promise.resolve();
});
