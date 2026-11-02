/** Exercise the generated application directory through the production origin owner. */
import {test,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createOriginHandler} from '../../../src/platform/electron/origin';
test('desktop assembly bundles an isolated Node entry and complete local shared renderer',async()=>{
 execFileSync(process.execPath,['scripts/build-desktop.mjs'],{timeout:30000,stdio:'pipe'});
 const root=join(process.cwd(),'dist/desktop'),pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 expect(pkg.main).toBe('main.js');expect(pkg.type).toBe('module');expect(pkg.version).toBe(JSON.parse(await readFile('package.json','utf8')).version);
 const main=await readFile(join(root,pkg.main),'utf8');expect(main).toContain('from "electron"');expect(main).not.toMatch(/from ["']\.\//);
 const handler=await createOriginHandler(join(root,'renderer'));
 const html=await(await handler({url:'app://tetris/',method:'GET'})).text();
 const refs=[...html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)].map(m=>m[1]);expect(refs.length).toBeGreaterThanOrEqual(2);
 for(const ref of refs){const response=await handler({url:'app://tetris/'+ref,method:'GET'});expect(response.status).toBe(200);const text=await response.text();expect(text).not.toMatch(/(?:node:|require\(['"]electron|from ['"]electron)/);}
 const assets=await readdir(join(root,'renderer/assets'));expect(assets.some(n=>n.startsWith('codec.worker-'))).toBe(true);
 const wasm=assets.find(n=>n.endsWith('.wasm'))!;const response=await handler({url:'app://tetris/assets/'+wasm,method:'GET'});expect(response.headers.get('content-type')).toBe('application/wasm');expect([...new Uint8Array(await response.arrayBuffer()).slice(0,4)]).toEqual([0,97,115,109]);
 expect((await handler({url:'app://tetris/schemas/snapshot.schema.json',method:'GET'})).status).toBe(200);
},40000);
