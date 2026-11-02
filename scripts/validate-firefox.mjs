/** Pinned Mozilla validator gate; reviewed static UI templates are the only accepted warnings. */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export function assertLint(report){
 const warnings=report.warnings,knownMetadata=new Set(['KEY_FIREFOX_UNSUPPORTED_BY_MIN_VERSION','KEY_FIREFOX_ANDROID_UNSUPPORTED_BY_MIN_VERSION']);
 const metadata=new Set();let templates=0;
 if(report.summary?.errors!==0||report.errors?.length||report.summary?.notices!==0||report.notices?.length||!Array.isArray(warnings)||report.summary.warnings!==warnings.length)throw Error('Firefox validation has errors or unreviewed notices.');
 for(const w of warnings){
  if(w.code==='UNSAFE_VAR_ASSIGNMENT'&&/^assets\/index-[A-Za-z0-9_-]+\.js$/.test(w.file)){if(++templates<=3)continue;}
  if(knownMetadata.has(w.code)&&w.file==='manifest.json'&&w.description?.includes('"browser_specific_settings.gecko.data_collection_permissions"')&&!metadata.has(w.code)){metadata.add(w.code);continue;}
  throw Error('Firefox validation has an unreviewed warning.');
 }
}
export function validateFirefox(root=resolve('dist/firefox')){
 const project=JSON.parse(readFileSync('package.json','utf8')),installed=JSON.parse(readFileSync('node_modules/web-ext/package.json','utf8'));
 if(project.devDependencies['web-ext']!=='10.8.0'||installed.version!=='10.8.0')throw Error('Expected pinned web-ext10.8.0.');
 const output=execFileSync(process.execPath,['node_modules/web-ext/bin/web-ext.js','lint','--source-dir',root,'--output=json','--no-config-discovery'],{encoding:'utf8',timeout:30000,maxBuffer:16000000});
 const report=JSON.parse(output);assertLint(report);
 console.log(JSON.stringify({firefoxValidated:true,tool:'web-ext',version:installed.version,summary:report.summary,reviewedWarnings:'Static code-owned UI templates; no-data declaration is informational on pre140 desktop/pre142 Android and transmits no data on any version'}));
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))validateFirefox(process.argv[2]&&resolve(process.argv[2]));
