/** Assemble an Electron application directory, keeping Node code out of the shared renderer. */
import {build} from 'vite';
import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),out=join(root,'dist/desktop');
const project=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await build({root,mode:'desktop'});
await build({root,configFile:false,logLevel:'warn',build:{outDir:out,emptyOutDir:false,ssr:'src/platform/electron/main.ts',target:'node24',rollupOptions:{external:['electron'],output:{entryFileNames:'main.js'}}}});
const renderer=join(out,'renderer'),files={};
async function collect(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await collect(p);else files[relative(renderer,p).replaceAll('\\','/')]=createHash('sha256').update(await readFile(p)).digest('hex');}}
await collect(renderer);await writeFile(join(renderer,'ASSETS.json'),JSON.stringify({formatVersion:1,files},null,2)+'\n');
await writeFile(join(out,'package.json'),JSON.stringify({name:project.name,productName:'Tetris',version:project.version,type:'module',main:'main.js'},null,2)+'\n');
for(const name of ['LICENSE','THIRD-PARTY-NOTICES.txt','INSTALL.md'])await writeFile(join(out,name),await readFile(join(root,name)));
console.log(JSON.stringify({desktop:true,version:project.version,assets:Object.keys(files).length}));
