/** Pure settings validation; no storage or platform effects. */
import type { Outcome, Settings } from '../models';
export const DEFAULT_SETTINGS: Settings = Object.freeze({ghost:'show',hardDrop:true,nextPreview:true,hardDropLock:'general',lockPolicy:'interval',hold:true});
/** Validate the complete six-key typed value without coercion or invoking accessors. */
export function validateSettings(input:unknown):Outcome<Settings>{
 const invalid:Outcome<Settings>={ok:false,error:{code:'invalid-data',message:'Settings must contain exactly the six correctly typed options.'}};
 if(typeof input!=='object'||input===null||Array.isArray(input))return invalid;
 const descriptors=Object.getOwnPropertyDescriptors(input), keys=Reflect.ownKeys(input);
 if(keys.length!==6||keys.some(key=>typeof key!=='string'||!Object.hasOwn(DEFAULT_SETTINGS,key)||!Object.hasOwn(descriptors[key]!,'value')))return invalid;
 const value=Object.fromEntries(Object.entries(descriptors).map(([key,descriptor])=>[key,descriptor.value]));
 if(!['hide','dynamic','show'].includes(value.ghost)||typeof value.hardDrop!=='boolean'||typeof value.nextPreview!=='boolean'||!['general','immediate'].includes(value.hardDropLock)||!['failed','interval'].includes(value.lockPolicy)||typeof value.hold!=='boolean')return invalid;
 return {ok:true,value:value as Settings};
}
