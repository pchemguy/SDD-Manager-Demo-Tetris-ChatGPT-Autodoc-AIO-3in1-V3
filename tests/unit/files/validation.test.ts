import {expect,test} from 'vitest';
import {validateSnapshot} from '../../../src/files';
import {parseSnapshotJSON} from '../../../src/files/validation';
import {DEFAULT_SETTINGS} from '../../../src/rules';
const row=(id='run',score=1,timestamp='2026-11-01T00:00:00.1Z')=>({id,score,timestamp});
const snapshot=()=>({formatVersion:1,results:[row('z'),row('A')],settings:{...DEFAULT_SETTINGS}});
test('validates/ranks complete snapshots and returns independent owned fields preserving spellings',()=>{
 const input=snapshot(),before=structuredClone(input),result=validateSnapshot(input);expect(result.ok).toBe(true);
 if(result.ok){expect(result.value).toEqual({...input,results:[input.results[1],input.results[0]]});expect(result.value).not.toBe(input);expect(result.value.settings).not.toBe(input.settings);expect(result.value.results[0]).not.toBe(input.results[1]);}
 expect(input).toEqual(before);expect(validateSnapshot({...input,results:[]}).ok).toBe(true);
});
test('accepts every typed settings choice and safe/identity/calendar boundaries',()=>{
 for(const patch of [{},{ghost:'hide'},{ghost:'dynamic'},{hardDrop:false},{nextPreview:false},{hardDropLock:'immediate'},{lockPolicy:'failed'},{hold:false}])expect(validateSnapshot({...snapshot(),settings:{...DEFAULT_SETTINGS,...patch}}).ok).toBe(true);
 expect(validateSnapshot({...snapshot(),results:[row('x'.repeat(128),Number.MAX_SAFE_INTEGER,'0001-01-01T00:00:00Z'),row('__proto__',0,'2000-02-29T00:00:00.123Z')]}).ok).toBe(true);
});
test('rejects every missing/extra root, result and setting field without partial validation',()=>{
 for(const group of ['root','result','setting']){
  const original=snapshot();const selected=group==='root'?original:group==='result'?original.results[0]!:original.settings;
  for(const key of Object.keys(selected)){const input=snapshot(),target=(group==='root'?input:group==='result'?input.results[0]:input.settings) as Record<string,unknown>;delete target[key];expect(validateSnapshot(input).ok,`${group} missing ${key}`).toBe(false);}
  const input=snapshot(),target=(group==='root'?input:group==='result'?input.results[0]:input.settings) as Record<string,unknown>;target.extra=1;expect(validateSnapshot(input).ok,`${group} extra`).toBe(false);
 }
 for(const input of [null,[],1,'{}',{...snapshot(),results:null},{...snapshot(),settings:null}])expect(validateSnapshot(input).ok).toBe(false);
});
test('rejects bounds, duplicate IDs, coercion, unsafe scores, invalid IDs and impossible UTC times',()=>{
 const bad=[{...snapshot(),results:Array.from({length:11},(_,i)=>row(`r${i}`))},{...snapshot(),results:[row(),row()]},...[-1,0.5,Number.MAX_SAFE_INTEGER+1,Infinity,NaN,'1',null].map(score=>({...snapshot(),results:[{...row(),score}]})),...['','x'.repeat(129),'x\n','é'].map(id=>({...snapshot(),results:[row(id)]})),...['0000-01-01T00:00:00Z','1900-02-29T00:00:00Z','2026-04-31T00:00:00Z','2026-01-01T24:00:00Z','2026-01-01T00:00:00+00:00','2026-01-01T00:00:00Z\n'].map(timestamp=>({...snapshot(),results:[row('bad',1,timestamp)]})),...[{hold:'false'},{ghost:'SHOW'},{nextPreview:0}].map(patch=>({...snapshot(),settings:{...DEFAULT_SETTINGS,...patch}}))];
 for(const input of bad){const output=validateSnapshot(input);expect(output.ok).toBe(false);if(!output.ok)expect(output.error.code).toBe('invalid-data');}
});
test('unsupported numeric versions are distinct from malformed version values',()=>{
 for(const formatVersion of [0,2,-1]){const result=validateSnapshot({...snapshot(),formatVersion});expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('unsupported-format');}
 for(const formatVersion of ['1',1.1,null,NaN])expect(validateSnapshot({...snapshot(),formatVersion}).ok).toBe(false);
});
test('JSON parser detects duplicate decoded names at every object level before parse can discard them',()=>{
 const json=JSON.stringify(snapshot());expect(parseSnapshotJSON(json).ok).toBe(true);expect(parseSnapshotJSON('\ufeff'+json).ok).toBe(true);
 const cases=[json.replace('"formatVersion":1','"formatVersion":1,"formatVersion":1'),json.replace('"id":"z"','"id":"z","id":"z"'),json.replace('"hold":true','"hold":true,"hold":false'),json.replace('"id":"z"','"id":"z","\\u0069d":"other"'),'{"__proto__":1,"\\u005f_proto__":2}',json+' {}','\ufeff\ufeff'+json,'{"settings":',json.replace('"score":1','"score":01')];
 for(const input of cases)expect(parseSnapshotJSON(input).ok,input).toBe(false);
 // Braces, commas and escaped quotes inside strings are syntax, never separators.
 expect(parseSnapshotJSON(json.replace('"id":"z"','"id":"a,\\\"b}"')).ok).toBe(false);
});
test('rejects accessors and non-data shapes without invoking getters or inherited fields',()=>{
 let reads=0;for(const group of ['root','result','setting']){const input=snapshot(),target=group==='root'?input:group==='result'?input.results[0]!:input.settings,key=group==='root'?'results':group==='result'?'score':'hold';Object.defineProperty(target,key,{get(){reads++;throw Error('No side effects');}});expect(validateSnapshot(input).ok).toBe(false);}expect(reads).toBe(0);
 const inherited=Object.create(snapshot());expect(validateSnapshot(inherited).ok).toBe(false);
});
test('array accessors and inherited required fields cannot execute code during schema validation',()=>{
 let reads=0;const input=snapshot();Object.defineProperty(input.results,'0',{get(){reads++;throw Error('No array accessor reads');}});expect(validateSnapshot(input).ok).toBe(false);expect(reads).toBe(0);
 const inherited=snapshot();const prototype=Object.defineProperty({},'hold',{get(){reads++;throw Error('No inherited reads');}});const settings=Object.assign(Object.create(null),DEFAULT_SETTINGS);Object.setPrototypeOf(settings,prototype);delete settings.hold;inherited.settings=settings;expect(validateSnapshot(inherited).ok).toBe(false);expect(reads).toBe(0);
});
test('sparse arrays cannot substitute an unrelated property and inherit a row getter',()=>{
 let reads=0;const input=snapshot(),rows=new Array(2);rows[0]=row();Object.assign(rows,{extra:true});Object.setPrototypeOf(rows,Object.defineProperty([], '1',{get(){reads++;throw Error('No inherited row reads');}}));input.results=rows;expect(validateSnapshot(input).ok).toBe(false);expect(reads).toBe(0);
});
