/** R10 approved local assets, immutable owned bytes and path/origin failure boundaries. */
import {afterEach,expect,test} from 'vitest';
import {writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {createOriginHandler,APP_CSP} from '../../../src/platform/electron/origin';
import {desktopFixture} from './desktop-fixture';
const owned:Array<Awaited<ReturnType<typeof desktopFixture>>>=[];async function fixture(){const f=await desktopFixture();owned.push(f);return f;}afterEach(async()=>{await Promise.all(owned.splice(0).map(f=>f.cleanup()));});
test('serves only verified local cached bytes with MIME/CSP and GET/HEAD semantics',async()=>{
 const f=await fixture(),handler=await createOriginHandler(f.root);
 const html=await handler({url:'app://tetris/?ghost=hide&unrelated=x',method:'GET'});expect(html.status).toBe(200);expect(await html.text()).toBe(f.files['index.html']);expect(html.headers.get('content-type')).toContain('text/html');expect(html.headers.get('content-security-policy')).toBe(APP_CSP);expect(APP_CSP).toContain("script-src 'self' 'wasm-unsafe-eval'");expect(APP_CSP).not.toContain("'unsafe-eval'");
 for(const [path,type] of [['assets/main.js','text/javascript'],['assets/app.css','text/css'],['assets/sql-wasm-browser-test.wasm','application/wasm'],['schemas/snapshot.schema.json','application/json']]){const response=await handler({url:'app://tetris/'+path,method:'GET'});expect(response.status).toBe(200);expect(response.headers.get('content-type')).toContain(type!);}
 const head=await handler({url:'app://tetris/assets/main.js',method:'HEAD'});expect(head.status).toBe(200);expect(await head.text()).toBe('');expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0);
 await writeFile(join(f.root,'assets/main.js'),'changed after acquisition');expect(await(await handler({url:'app://tetris/assets/main.js',method:'GET'})).text()).toBe(f.files['assets/main.js']);
});
test('rejects traversal, foreign authorities/initiators, unknown paths and unsafe methods',async()=>{
 const f=await fixture(),handler=await createOriginHandler(f.root);
 for(const path of ['app://foreign/','https://tetris/','app://user@tetris/','app://tetris:80/','app://tetris/../index.html','app://tetris/%2e%2e/index.html','app://tetris/assets%2fmain.js','app://tetris/assets%5cmain.js','app://tetris/%00','app://tetris/%zz','app://tetris/ASSETS.json','app://tetris/main.js','app://tetris/unknown.js'])expect((await handler({url:path,method:'GET'})).status,path).toBeGreaterThanOrEqual(400);
 expect((await handler({url:'app://tetris/',method:'POST'})).status).toBe(405);expect((await handler({url:'app://tetris/',method:'GET',initiatorOrigin:'https://foreign.invalid'})).status).toBe(403);
 expect((await handler({url:'app://tetris/',method:'GET',initiatorOrigin:'app://tetris'})).status).toBe(200);
});
test('fails closed for missing/altered assets and nonconforming manifests',async()=>{
 for(const operation of ['missing','changed','path','shape','version','worker']){
  const f=await fixture();if(operation==='missing')await rm(join(f.root,'assets/main.js'));if(operation==='changed')await writeFile(join(f.root,'assets/main.js'),'altered');if(operation==='path')Object.assign(f.manifest.files,{'../secret.js':'0'.repeat(64)});if(operation==='worker')delete f.manifest.files['assets/codec.worker-test.js'];
  const value=operation==='shape'?{...f.manifest,extra:true}:operation==='version'?{...f.manifest,formatVersion:2}:f.manifest;await writeFile(join(f.root,'ASSETS.json'),JSON.stringify(value));await expect(createOriginHandler(f.root),operation).rejects.toThrow('bundled');
 }
});
test.skipIf(process.platform==='win32')('rejects a declared asset symlink escaping its installed root',async()=>{
 const f=await fixture(),outside=await fixture();await rm(join(f.root,'assets/main.js'));await symlink(join(outside.root,'assets/main.js'),join(f.root,'assets/main.js'));await expect(createOriginHandler(f.root)).rejects.toThrow('bundled');
});
