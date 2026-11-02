import {test,expect} from 'vitest';
test('pinned lint gate permits only reviewed static-template warnings and rejects unknown failures',async()=>{
 const {assertLint}=await import('../../../scripts/validate-firefox.mjs' as string);
 const warning={code:'UNSAFE_VAR_ASSIGNMENT',file:'assets/index-owned.js'},report={summary:{errors:0,warnings:3,notices:0},errors:[],warnings:[warning,warning,warning],notices:[]};
 expect(()=>assertLint(report)).not.toThrow();for(const changed of [{...report,errors:[{code:'INVALID_MANIFEST'}],summary:{...report.summary,errors:1}},{...report,warnings:[{code:'MISSING_DATA_COLLECTION_PERMISSIONS',file:'manifest.json'}]},{...report,warnings:[{...warning,file:'background.js'}]}])expect(()=>assertLint(changed)).toThrow();
});
test('old-version compatibility exception is restricted to the no-data declaration',async()=>{
 const {assertLint}=await import('../../../scripts/validate-firefox.mjs' as string),base={summary:{errors:0,warnings:1,notices:0},errors:[],notices:[]};
 const warning={code:'KEY_FIREFOX_UNSUPPORTED_BY_MIN_VERSION',file:'manifest.json',description:'Older than "browser_specific_settings.gecko.data_collection_permissions" support'};
 expect(()=>assertLint({...base,warnings:[warning]})).not.toThrow();expect(()=>assertLint({...base,warnings:[{...warning,description:'Some other unsupported runtime API'}]})).toThrow();
});
