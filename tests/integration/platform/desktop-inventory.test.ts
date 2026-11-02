/** Artifact inventory is checked before any runtime copy, independent of native facilities. */
import {test} from 'vitest';
import {execFileSync} from 'node:child_process';
test('closed desktop inventory rejects absent entry/notices and developer files',()=>{
 execFileSync('python',['-c',String.raw`
import sys,json
sys.path.insert(0,'scripts')
from desktop_inventory import validate_application
files={n:b'x' for n in ['main.js','LICENSE','THIRD-PARTY-NOTICES.txt','INSTALL.md','renderer/index.html','renderer/schemas/snapshot.schema.json','renderer/assets/index-a.js','renderer/assets/style-a.css','renderer/assets/codec.worker-a.js','renderer/assets/sql-wasm-browser-a.wasm']}
files['package.json']=json.dumps({'main':'main.js','type':'module','version':'0.8.0'}).encode()
files['renderer/ASSETS.json']=b'{}'
validate_application(files)
def reject(candidate,label):
 try:validate_application(candidate)
 except ValueError:return
 raise AssertionError('Invalid application accepted: '+label)
for name in ['main.js','LICENSE','THIRD-PARTY-NOTICES.txt','renderer/index.html']:
 candidate=dict(files);del candidate[name];reject(candidate,'missing '+name)
for name in ['node_modules/dev/index.js','source.ts','.env','renderer/assets/map.js.map']:
 reject(dict(files,**{name:b'dev'}),name)
for package in [{'main':'other.js','type':'module'},{'main':'main.js','type':'commonjs'}]:
 reject(dict(files,**{'package.json':json.dumps(package).encode()}),'package entry')
`],{stdio:'pipe',timeout:10000});
});
