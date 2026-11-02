/** A stale control manifest must never enter the runtime payload inventory. */
import {test,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
test('renderer manifest is stable across regeneration and excludes its prior output',async()=>{
 const root=await mkdtemp(join(tmpdir(),'tetris-manifest-'));
 try{
  await mkdir(join(root,'assets'));await writeFile(join(root,'index.html'),'payload');await writeFile(join(root,'assets/main.js'),'code');await writeFile(join(root,'ASSETS.json'),'stale control data');
  const {writeRendererManifest}=await import(/* @vite-ignore */pathToFileURL(join(process.cwd(),'scripts/desktop-manifest.mjs')).href);
  const first=await writeRendererManifest(root);expect(Object.keys(first).sort()).toEqual(['assets/main.js','index.html']);expect(first['index.html']).toBe(createHash('sha256').update('payload').digest('hex'));
  const before=await readFile(join(root,'ASSETS.json'),'utf8');await writeRendererManifest(root);expect(await readFile(join(root,'ASSETS.json'),'utf8')).toBe(before);
 }finally{await rm(root,{recursive:true,force:true});}
});
