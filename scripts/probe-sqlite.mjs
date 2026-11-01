/** Rebuild/extract the real candidate and run its isolated C6/C8 runtime readiness gate. */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),npm=process.env.npm_execpath;
if(!npm)throw Error('Run this gate with npm run probe:sqlite.');
for(const args of [[npm,'run','package'],[npm,'run','verify:package'],['node_modules/@playwright/test/cli.js','test','tests/e2e/sqlite-runtime.spec.ts']]){
 const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,TETRIS_PACKAGED_TEST:'1'}});
 if(result.status!==0)process.exit(result.status??1);
}
