/** Assemble an Electron application directory, keeping Node code out of the shared renderer. */
import {build} from 'vite';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeRendererManifest} from './desktop-manifest.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=join(root,'dist/desktop');
const project=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await build({root,mode:'desktop'});
await build({root,configFile:false,logLevel:'warn',build:{outDir:out,emptyOutDir:false,ssr:'src/platform/electron/main.ts',target:'node24',rollupOptions:{external:['electron'],output:{entryFileNames:'main.js'}}}});
const files=await writeRendererManifest(join(out,'renderer'));
await writeFile(join(out,'package.json'),JSON.stringify({name:project.name,productName:'Tetris',version:project.version,type:'module',main:'main.js'},null,2)+'\n');
for(const name of ['LICENSE','THIRD-PARTY-NOTICES.txt','INSTALL.md'])await writeFile(join(out,name),await readFile(join(root,name)));
console.log(JSON.stringify({desktop:true,version:project.version,assets:Object.keys(files).length}));
