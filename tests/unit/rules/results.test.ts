import {expect,test} from 'vitest';
import {rankResults as rank} from '../../../src/rules';
import type {ScoreResult} from '../../../src/models';
const row=(id='run',score=1,timestamp='2026-11-01T00:00:00.000Z'):ScoreResult=>({id,score,timestamp});
test('ranks by score, UTC instant, then case-sensitive code units and preserves representations',()=>{
 const input=[row('a',3),row('Z',3),row('early',3,'2026-10-31T23:59:59.999Z'),row('best',4),row('_',3),row('A',3,'2026-11-01T00:00:00Z')];
 expect(rank(input)).toEqual([input[3],input[2],input[5],input[1],input[4],input[0]]);
 const fractions=[row('z',1,'2026-11-01T00:00:00.1Z'),row('a',1,'2026-11-01T00:00:00.100Z'),row('m',1,'2026-11-01T00:00:00.01Z')];
 expect(rank(fractions)).toEqual([fractions[2],fractions[1],fractions[0]]);
});
test('returns independent top ten without mutating or sharing input records',()=>{
 const input=Object.freeze(Array.from({length:12},(_,i)=>Object.freeze(row(`r-${i}`,i))));
 const before=structuredClone(input),output=rank(input);expect(output.map(r=>r.score)).toEqual([11,10,9,8,7,6,5,4,3,2]);expect(input).toEqual(before);expect(output[0]).not.toBe(input[11]);
 expect(rank([])).toEqual([]);
});
test('accepts boundary IDs, safe scores and Gregorian UTC dates while preserving strings',()=>{
 for(const value of [row('a'),row('_-09AZaz'),row('a'.repeat(128),Number.MAX_SAFE_INTEGER,'9999-12-31T23:59:59.999Z'),row('__proto__',0,'0001-01-01T00:00:00Z'),row('leap',1,'2000-02-29T12:34:56.12Z')])expect(rank([value])).toEqual([value]);
});
test('rejects invalid IDs, unsafe or coerced scores and duplicate identity before truncation',()=>{
 for(const id of ['', 'a'.repeat(129),'a b','é','a\n','a.b'])expect(()=>rank([row(id)])).toThrow(TypeError);
 for(const score of [-1,0.1,Number.MAX_SAFE_INTEGER+1,NaN,Infinity,'1',null])expect(()=>rank([row('bad',score as number)])).toThrow(TypeError);
 const rows=Array.from({length:12},(_,i)=>row(`r${i}`,12-i));rows[11]=row('r0',0);expect(()=>rank(rows)).toThrow(TypeError);
 rows[11]=row('invalid',-1);expect(()=>rank(rows)).toThrow(TypeError);
});
test('rejects impossible dates, non-UTC spelling, invalid components and timestamp suffixes',()=>{
 for(const stamp of ['0000-01-01T00:00:00Z','1900-02-29T00:00:00Z','2026-02-29T00:00:00Z','2026-04-31T00:00:00Z','2026-00-01T00:00:00Z','2026-13-01T00:00:00Z','2026-01-00T00:00:00Z','2026-01-01T24:00:00Z','2026-01-01T00:60:00Z','2026-01-01T00:00:60Z','2026-01-01T00:00:00.1234Z','2026-01-01T00:00:00+00:00','2026-01-01','2026-01-01T00:00:00z','2026-01-01T00:00:00Z\n'])expect(()=>rank([row('bad',0,stamp)])).toThrow(TypeError);
});
test('rejects malformed or accessor records without invoking user code',()=>{
 for(const item of [null,[],{}, {...row(),extra:1},{...row(),timestamp:1}])expect(()=>rank([item as ScoreResult])).toThrow(TypeError);
 let reads=0;const item=Object.defineProperty({...row()},'score',{get(){reads++;throw Error('unexpected');}});expect(()=>rank([item])).toThrow(TypeError);expect(reads).toBe(0);
 expect(()=>rank(null as never)).toThrow(TypeError);
});
