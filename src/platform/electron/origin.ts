/** Approved immutable local renderer resources; this module is never imported by the renderer. */
import {readFile,realpath,stat} from 'node:fs/promises';
import {join,relative,isAbsolute,sep} from 'node:path';
import {createHash} from 'node:crypto';
export const APP_ORIGIN='app://tetris';
export const APP_CSP="default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
export interface AppRequest {url:string;method:string;initiatorOrigin?:string}
const allowed=(name:string)=>name==='index.html'||name==='schemas/snapshot.schema.json'||/^assets\/[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:js|css|wasm)$/.test(name);
const mime=(name:string)=>name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.wasm')?'application/wasm':'application/json; charset=utf-8';
const invalid=()=>new Error('The bundled renderer assets are missing, invalid or corrupted.');
/** Acquire and verify the installed manifest once; requests cannot select arbitrary filesystem paths. */
export async function createOriginHandler(assetRoot:string):Promise<(request:AppRequest)=>Promise<Response>>{
 const cache=new Map<string,{bytes:Buffer;type:string}>();
 try{
  const root=await realpath(assetRoot),manifestPath=join(root,'ASSETS.json');if((await stat(manifestPath)).size>256*1024)throw invalid();
  const manifest=JSON.parse(await readFile(manifestPath,'utf8')) as {formatVersion?:unknown;files?:unknown};
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||Object.keys(manifest).sort().join(',')!=='files,formatVersion'||manifest.formatVersion!==1||!manifest.files||typeof manifest.files!=='object'||Array.isArray(manifest.files))throw invalid();
  const entries=Object.entries(manifest.files);if(!entries.length||entries.length>128)throw invalid();let total=0;const identities=new Set<string>();
  for(const [name,hash] of entries){
   if(!allowed(name)||typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash)||identities.has(name.toLowerCase()))throw invalid();identities.add(name.toLowerCase());
   const path=await realpath(join(root,name)),local=relative(root,path);if(isAbsolute(local)||local.split(sep).includes('..'))throw invalid();const size=(await stat(path)).size;if(size>20_000_000||(total+=size)>64_000_000)throw invalid();
   const bytes=await readFile(path);if(bytes.length!==size||createHash('sha256').update(bytes).digest('hex')!==hash)throw invalid();cache.set(name,{bytes,type:mime(name)});
  }
  if(!cache.has('index.html')||!cache.has('schemas/snapshot.schema.json')||[...cache.keys()].filter(n=>/^assets\/codec\.worker-[A-Za-z0-9_-]+\.js$/.test(n)).length!==1||[...cache.keys()].filter(n=>/^assets\/sql-wasm-browser-[A-Za-z0-9_-]+\.wasm$/.test(n)).length!==1)throw invalid();
 }catch{throw invalid();}
 return async request=>{
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  let path:string;
  try{
   const url=new URL(request.url),raw=/^[a-z][a-z0-9+.-]*:\/\/[^/?#]+([^?#]*)/i.exec(request.url)?.[1];
   if(url.protocol!=='app:'||url.hostname.toLowerCase()!=='tetris'||url.username||url.password||url.port)return new Response('Forbidden origin',{status:403});
   if(request.initiatorOrigin!==undefined&&request.initiatorOrigin!==APP_ORIGIN)return new Response('Forbidden initiator',{status:403});
   if(raw===undefined||/%(?:2f|5c)/i.test(raw))throw Error();path=decodeURIComponent(raw||'/');if(path.includes('\\')||path.includes('\0')||path.split('/').some(p=>p==='..'||p==='.'))throw Error();
  }catch{return new Response('Invalid local path',{status:400});}
  const name=path==='/'?'index.html':path.slice(1),asset=cache.get(name);if(!asset)return new Response('Not found',{status:404});
  const headers={'Content-Type':asset.type,'Content-Length':String(asset.bytes.length),'Content-Security-Policy':APP_CSP,'X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Cache-Control':'no-store'};
  return new Response(request.method==='HEAD'?null:new Uint8Array(asset.bytes).buffer,{status:200,headers});
 };
}
