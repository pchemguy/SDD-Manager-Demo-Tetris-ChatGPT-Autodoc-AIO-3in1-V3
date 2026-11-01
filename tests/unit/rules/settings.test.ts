import {expect,test} from 'vitest';
import {DEFAULT_SETTINGS,validateSettings} from '../../../src/rules';
test('canonical defaults and each complete typed settings variant are accepted without sharing mutable input',()=>{
 expect(DEFAULT_SETTINGS).toEqual({ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true});
 for(const patch of [{},{ghost:'hide'},{ghost:'dynamic'},{hardDrop:false},{nextPreview:false},{hardDropLock:'immediate'},{lockPolicy:'failed'},{hold:false}]){
  const input={...DEFAULT_SETTINGS,...patch}, result=validateSettings(input);expect(result).toEqual({ok:true,value:input});
  if(result.ok)expect(result.value).not.toBe(input);
 }
});
test('rejects missing, unknown and invalid typed settings atomically without coercion or input writes',()=>{
 const missing={...DEFAULT_SETTINGS} as Record<string,unknown>;delete missing.hold;
 for(const input of [null,[],true,missing,{...DEFAULT_SETTINGS,extra:1},...['ghost','hardDrop','nextPreview','hardDropLock','lockPolicy','hold'].flatMap(key=>[null,undefined,0,'true',' false ','SHOW'].map(value=>({...DEFAULT_SETTINGS,[key]:value})))]){
  const before=JSON.stringify(input);const result=validateSettings(input);expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('invalid-data');expect(JSON.stringify(input)).toBe(before);
 }
});
test('rejects inherited settings and accessor properties without executing user getters',()=>{
 expect(validateSettings(Object.create(DEFAULT_SETTINGS)).ok).toBe(false);
 let called=false;const input={...DEFAULT_SETTINGS};Object.defineProperty(input,'hold',{enumerable:true,get(){called=true;throw Error('must not execute');}});
 expect(validateSettings(input).ok).toBe(false);expect(called).toBe(false);
});
