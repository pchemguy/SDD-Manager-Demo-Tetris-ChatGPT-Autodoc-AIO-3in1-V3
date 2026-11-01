/** Tiny owned protocol fixtures are contract tests, never claimed as an Electron distribution. */
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
export const sha=(data:Uint8Array|string)=>createHash('sha256').update(data).digest('hex');
export async function desktopFixture(){
 const root=await mkdtemp(join(tmpdir(),'tetris-origin-'));
 const files:Record<string,string|Uint8Array>={'index.html':'<script type="module" src="./assets/main.js"></script>','assets/main.js':'export const local=true;','assets/app.css':'body{margin:0}','assets/codec.worker-test.js':'postMessage("local")','assets/sql-wasm-browser-test.wasm':new Uint8Array([0,97,115,109,1,0,0,0]),'schemas/snapshot.schema.json':'{}'};
 for(const [name,data] of Object.entries(files)){await mkdir(dirname(join(root,name)),{recursive:true});await writeFile(join(root,name),data);}
 const manifest={formatVersion:1,files:Object.fromEntries(Object.entries(files).map(([name,data])=>[name,sha(data)]))};await writeFile(join(root,'ASSETS.json'),JSON.stringify(manifest));
 return {root,files,manifest,cleanup:()=>rm(root,{recursive:true,force:true})};
}
