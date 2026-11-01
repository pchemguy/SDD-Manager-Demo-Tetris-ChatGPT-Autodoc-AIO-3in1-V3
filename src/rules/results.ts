/** Pure R7 identity/calendar validation and deterministic ranking. No clocks or storage. */
import type {ScoreResult} from '../models';
const idSyntax=/^[A-Za-z0-9_-]{1,128}$/;
const utcSyntax=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;
function instant(timestamp:unknown):number{
 if(typeof timestamp!=='string')throw new TypeError('A result timestamp must be a Gregorian UTC string.');
 const match=utcSyntax.exec(timestamp);
 if(!match||match[0]!==timestamp)throw new TypeError('A result timestamp must be a Gregorian UTC string.');
 const [year,month,day,hour,minute,second]=match.slice(1,7).map(Number) as [number,number,number,number,number,number];
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 if(year<1||month<1||month>12||day<1||day>days[month-1]!||hour>23||minute>59||second>59)throw new TypeError('A result timestamp must be a real Gregorian UTC date.');
 return Date.parse(timestamp);
}
/** Validate every record before truncating. Invalid preconditions throw TypeError; output owns copies. */
export function rankResults(results:ReadonlyArray<ScoreResult>):ReadonlyArray<ScoreResult>{
 if(!Array.isArray(results))throw new TypeError('Results must be an array.');
 const seen=new Set<string>();
 const validated=Array.from(results,item=>{
  if(typeof item!=='object'||item===null||Array.isArray(item))throw new TypeError('Each result must contain exactly id, score and timestamp.');
  const descriptors=Object.getOwnPropertyDescriptors(item),keys=Reflect.ownKeys(item);
  if(keys.length!==3||keys.some(key=>typeof key!=='string'||!['id','score','timestamp'].includes(key)||!Object.hasOwn(descriptors[key]!,'value')))throw new TypeError('Each result must contain exactly id, score and timestamp.');
  const id:unknown=descriptors.id!.value,score:unknown=descriptors.score!.value,timestamp:unknown=descriptors.timestamp!.value;
  if(typeof id!=='string'||idSyntax.exec(id)?.[0]!==id||seen.has(id))throw new TypeError('Result IDs must be valid and unique.');
  if(typeof score!=='number'||!Number.isSafeInteger(score)||score<0)throw new TypeError('Result scores must be non-negative safe integers.');
  const time=instant(timestamp);seen.add(id);
  return {result:{id,score,timestamp:timestamp as string},time};
 });
 return validated.sort((a,b)=>b.result.score-a.result.score||a.time-b.time||(a.result.id<b.result.id?-1:a.result.id>b.result.id?1:0)).slice(0,10).map(item=>item.result);
}
