/** Copy and fingerprint the matching pinned browser loader/WASM before any build or check. */
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),project=JSON.parse(readFileSync(new URL('package.json',root),'utf8')),dependency=new URL('node_modules/sql.js/',root),installed=JSON.parse(readFileSync(new URL('package.json',dependency),'utf8'));
if(project.dependencies?.['sql.js']!==installed.version)throw Error('SQLite runtime must match its exact declared package version.');
const output=new URL('vendor/sqlite/',root);mkdirSync(output,{recursive:true});const hashes={};
for(const name of ['sql-wasm-browser.js','sql-wasm-browser.wasm']){
 const bytes=readFileSync(new URL('dist/'+name,dependency));if(name.endsWith('.wasm')&&!bytes.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])))throw Error('Expected the pinned WebAssembly binary.');
 writeFileSync(new URL(name,output),bytes);hashes[name]=createHash('sha256').update(bytes).digest('hex');
}
writeFileSync(new URL('ASSET-INFO.json',output),JSON.stringify({package:'sql.js',version:installed.version,hashes},null,2)+'\n');
