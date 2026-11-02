/** Assemble the local shared sidebar and isolated platform background. */
import {build} from 'vite';
import {readFile,writeFile,rename,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const platform=process.argv[2]??'chromium';if(!['chromium','firefox'].includes(platform))throw Error('Unsupported extension build target.');
const root=fileURLToPath(new URL('../',import.meta.url)),out=join(process.env.TETRIS_EXTENSION_BUILD_ROOT??join(root,'dist'),platform);
await build({root,mode:platform,build:{outDir:out,emptyOutDir:true}});await rename(join(out,'index.html'),join(out,'sidebar.html'));
await build({root,configFile:false,logLevel:'warn',publicDir:false,build:{outDir:out,emptyOutDir:false,target:'es2020',minify:true,lib:{entry:join(root,`platforms/${platform}/background.ts`),name:'TetrisBackground',formats:['iife'],fileName:()=> 'background.js'}}});
const manifest=JSON.parse(await readFile(join(root,`platforms/${platform}/manifest.json`),'utf8')),project=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
if(manifest.version!==project.version)throw Error('Extension manifest version mismatch.');
await writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await cp(join(root,'platforms/icons'),join(out,'icons'),{recursive:true});
for(const name of ['LICENSE','THIRD-PARTY-NOTICES.txt','INSTALL.md'])await cp(join(root,name),join(out,name));
console.log(JSON.stringify({extension:platform,version:project.version,localAssets:true}));
