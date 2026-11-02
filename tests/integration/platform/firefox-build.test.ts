import {test,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('Firefox assembly bundles the shared sidebar and a classic event-page broker',()=>{
 execFileSync(process.execPath,['scripts/build-extension.mjs','firefox'],{timeout:30000,stdio:'pipe'});
 const root='dist/firefox/',m=JSON.parse(readFileSync(root+'manifest.json','utf8'));expect(existsSync(root+m.sidebar_action.default_panel)).toBe(true);expect(m.background.scripts).toEqual(['background.js']);expect(m.background.service_worker).toBeUndefined();
 const events:string[]=[];let action!:()=>void;const browser={runtime:{id:'owned',getURL:(p:string)=>`moz-extension://owned/${p}`,onMessage:{addListener:()=>events.push('message')}},storage:{session:{}},windows:{onRemoved:{addListener:()=>events.push('cleanup')}},action:{onClicked:{addListener:(f:()=>void)=>{action=f;}}},sidebarAction:{open:async()=>{events.push('open');}}};
 const script=readFileSync(root+'background.js','utf8');expect(script).not.toMatch(/setInterval|requestAnimationFrame|\bimport\s|\bexport\s/);runInNewContext(script,{browser,structuredClone,console});action();expect(events).toEqual(['message','cleanup','open']);
},40000);
