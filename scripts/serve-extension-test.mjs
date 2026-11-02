/** Test-only HTTP transport for packaged extension CSP/assets; no native-extension claim. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {resolveTestAsset} from './extension-test-path.mjs';
const root=resolve(process.env.TETRIS_EXTENSION_ROOT??'dist/chromium'),manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.png':'image/png'};
createServer(async(req,res)=>{try{const target=resolveTestAsset(root,req.url);if(!target)throw Error('path');const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[extname(target)]??'application/octet-stream','Content-Security-Policy':manifest.content_security_policy.extension_pages,'Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1');
