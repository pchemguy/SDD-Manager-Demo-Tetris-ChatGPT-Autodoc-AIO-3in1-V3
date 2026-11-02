/** Test-only HTTP transport over the production app-origin handler; not a native Electron claim. */
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {createOriginHandler} from '../src/platform/electron/origin.ts';
const handler=await createOriginHandler(process.env.TETRIS_DESKTOP_ROOT||fileURLToPath(new URL('../dist/desktop/renderer',import.meta.url)));
const server=createServer(async(req,res)=>{try{const response=await handler({url:'app://tetris'+req.url,method:req.method});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end();}});
server.listen(4173,'127.0.0.1');
for(const name of ['SIGINT','SIGTERM'])process.on(name,()=>server.close(()=>process.exit(0)));
