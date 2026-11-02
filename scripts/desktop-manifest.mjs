/** Fingerprint renderer payloads; the manifest itself is control metadata. */
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
export async function writeRendererManifest(renderer){
 const files={};
 async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await collect(p);else if(relative(renderer,p)!=='ASSETS.json')files[relative(renderer,p).replaceAll('\\','/')]=createHash('sha256').update(await readFile(p)).digest('hex');}}
 await collect(renderer);await writeFile(join(renderer,'ASSETS.json'),JSON.stringify({formatVersion:1,files},null,2)+'\n');
 return files;
}
