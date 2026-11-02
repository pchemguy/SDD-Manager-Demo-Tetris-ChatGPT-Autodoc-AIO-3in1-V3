/** Actual Chromium build inventory and background bundle consumer. */
import {test,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
test('Chromium build contains local sidebar/codec/schema/WASM and an executable timer-free broker',()=>{
 execFileSync(process.execPath,['scripts/build-extension.mjs','chromium'],{timeout:30000,stdio:'pipe'});
 const root='dist/chromium/',m=JSON.parse(readFileSync(root+'manifest.json','utf8'));expect(existsSync(root+m.side_panel.default_path)).toBe(true);
 const html=readFileSync(root+'sidebar.html','utf8');for(const [,path]of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g))expect(existsSync(root+path)).toBe(true);
 const assets=readdirSync(root+'assets');expect(assets.some(n=>n.startsWith('codec.worker-'))).toBe(true);const wasm=assets.find(n=>n.endsWith('.wasm'))!;expect([...readFileSync(root+'assets/'+wasm).subarray(0,4)]).toEqual([0,97,115,109]);expect(existsSync(root+'schemas/snapshot.schema.json')).toBe(true);
 for(const path of Object.values(m.icons))expect(existsSync(root+path)).toBe(true);
 expect(m.content_security_policy.extension_pages).toContain("'wasm-unsafe-eval'");expect(m.content_security_policy.extension_pages).not.toContain("'unsafe-eval'");
 const events:string[]=[];const chrome={runtime:{id:'owned',getURL:(p:string)=>`chrome-extension://owned/${p}`,onMessage:{addListener:()=>events.push('messages')}},storage:{session:{}},windows:{onRemoved:{addListener:()=>events.push('cleanup')}},sidePanel:{setPanelBehavior:async()=>{events.push('action');}}};
 const background=readFileSync(root+'background.js','utf8');expect(background).not.toMatch(/setInterval|requestAnimationFrame|node:|from ["']electron/);runInNewContext(background,{chrome,console,structuredClone});expect(events).toEqual(['messages','cleanup','action']);
},40000);
test('Chromium producer/verifier rejects unsafe, corrupt, secret and wrong-source archives',()=>{
 const result=execFileSync('python',['tests/packages/extension-package.py'],{timeout:30000,encoding:'utf8'});expect(result).toContain('"mutationsRejected": 6');
},40000);
test('test-only transport rejects decoded absolute and traversal targets outside its root',async()=>{
 const {resolveTestAsset}=await import('../../../scripts/extension-test-path.mjs' as string);
 const root=resolve('dist/chromium');expect(resolveTestAsset(root,'/%2Ftmp/secret')).toBeNull();expect(resolveTestAsset(root,'/%2e%2e%2Fsecret')).toBeNull();expect(resolveTestAsset(root,'/assets/runtime.js')).toBe(resolve(root,'assets/runtime.js'));
});
