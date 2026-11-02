/** Bounded temporary install in the explicitly supplied project-owned Firefox binary. */
import webExt from 'web-ext';
import {realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
const supplied=process.argv[2];if(!supplied||!isAbsolute(supplied))throw Error('Supply an absolute project-owned Playwright Firefox binary.');
const binary=await realpath(supplied),owned=await realpath(resolve('.cache/ms-playwright')),within=relative(owned,binary);
if(within.startsWith('..')||isAbsolute(within))throw Error('Firefox binary must belong to this project cache.');
let runner;
try{
 runner=await webExt.cmd.run({sourceDir:resolve(process.argv[3]??'dist/firefox'),firefox:binary,target:['firefox-desktop'],args:['-headless'],noReload:true,noInput:true,startUrl:['about:blank']});
 console.log(JSON.stringify({temporaryInstallAcknowledged:true,binary,visibleSidebarVerified:false}));
}finally{if(runner)await runner.exit();}
