/** Public C5 resolution checks exact strings and independent per-key precedence. */
import {expect,test} from 'vitest';
import {DEFAULT_SETTINGS,resolveSettings} from '../../../src/rules';
import type {RawSettings,SettingKey} from '../../../src/models';
const variants:ReadonlyArray<readonly[SettingKey,string,unknown]>=[['ghost','hide','hide'],['ghost','dynamic','dynamic'],['ghost','show','show'],['hardDrop','true',true],['hardDrop','false',false],['nextPreview','true',true],['nextPreview','false',false],['hardDropLock','general','general'],['hardDropLock','immediate','immediate'],['lockPolicy','failed','failed'],['lockPolicy','interval','interval'],['hold','true',true],['hold','false',false]];
test('every exact canonical string resolves its typed value and explicit defaults remain explicit',()=>{
 for(const[key,raw,value]of variants){const r=resolveSettings({[key]:raw},{});expect(r.settings[key]).toBe(value);expect(r.explicit).toEqual([key]);expect(r.warnings).toEqual([]);}
});
test('mixed URL cookie and default sources resolve independently without mutating inputs',()=>{
 const query=Object.freeze({ghost:'show',hardDrop:'FALSE',hold:'false'}),saved=Object.freeze({ghost:'hide',hardDrop:'false',nextPreview:'false',hardDropLock:'immediate',lockPolicy:'failed'});const before=JSON.stringify([query,saved]);
 const r=resolveSettings(query,saved);expect(r.settings).toEqual({ghost:'show',hardDrop:false,nextPreview:false,hardDropLock:'immediate',lockPolicy:'failed',hold:false});expect(r.explicit).toEqual(['ghost','hold']);expect(r.warnings).toHaveLength(1);expect(r.warnings[0]).toContain('hardDrop');expect(JSON.stringify([query,saved])).toBe(before);
});
test('empty wrong-case padded and noncanonical query values warn then retain valid saved values',()=>{
 for(const[key,raw,value]of variants)for(const invalid of ['',raw.toUpperCase(),` ${raw}`,`${raw} `,'0','null']){
  if(invalid===raw)continue;const r=resolveSettings({[key]:invalid},{[key]:raw});expect(r.settings[key]).toBe(value);expect(r.explicit).toEqual([]);expect(r.warnings).toHaveLength(1);
 }
});
test('invalid cookies fall back silently, omitted URL never becomes an explicit write and unknown keys are ignored',()=>{
 const saved=Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map(key=>[key,'invalid'])) as RawSettings;const r=resolveSettings({unknown:'true'} as RawSettings,saved);expect(r).toEqual({settings:DEFAULT_SETTINGS,explicit:[],warnings:[]});expect(r.settings).not.toBe(DEFAULT_SETTINGS);
 expect(resolveSettings({}, {hold:'false'})).toEqual({settings:{...DEFAULT_SETTINGS,hold:false},explicit:[],warnings:[]});
});
