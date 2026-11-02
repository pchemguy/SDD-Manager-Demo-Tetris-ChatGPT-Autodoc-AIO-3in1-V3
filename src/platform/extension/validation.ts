/** Strict validation of the complete internal recovery value before any session write. */
import type {AppState,Checkpoint,Outcome,Piece} from '../../models';
import {validateSettings,rankResults} from '../../rules';
import {canTraverse} from '../../domain';
const kinds=['I','J','L','O','S','T','Z'];
export function record(value:unknown,keys:readonly string[]):value is Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const own=Reflect.ownKeys(value),descriptors=Object.getOwnPropertyDescriptors(value);
 return own.length===keys.length&&own.every(k=>typeof k==='string'&&keys.includes(k)&&Object.hasOwn(descriptors[k]!,'value'));
}
export const integer=(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
const duration=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1000;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.exec(v)?.[0]===v;
function piece(v:unknown):v is Piece{return record(v,['kind','rotation','origin','penetrator'])&&kinds.includes(v.kind as string)&&integer(v.rotation,0,3)&&typeof v.penetrator==='boolean'&&record(v.origin,['x','y'])&&integer(v.origin.x,-4,10)&&integer(v.origin.y,-4,19);}
export function validateState(value:unknown):Outcome<AppState>{
 const invalid:Outcome<AppState>={ok:false,error:{code:'invalid-data',message:'The sidebar checkpoint contains invalid game, settings or results data.'}};
 try{
  if(!record(value,['game','settings','results','completedRunId'])||!validateSettings(value.settings).ok||!Array.isArray(value.results)||value.results.length>10||!(value.completedRunId===null||id(value.completedRunId)))return invalid;
  const g=value.game;
  if(!record(g,['runId','status','board','active','held','holdUsed','sequence','score','lines','level','bonuses','timers','piecePolicy'])||!id(g.runId)||!['idle','running','paused','gameover'].includes(g.status as string))return invalid;
  if(!Array.isArray(g.board)||g.board.length!==20||Array.from(g.board).some(row=>!Array.isArray(row)||row.length!==10||Array.from(row).some(c=>c!==null&&c!=='penetrator'&&!kinds.includes(c))))return invalid;
  if(!(g.active===null||piece(g.active))||((g.status==='running'||g.status==='paused')&&!g.active)||g.status==='idle'&&g.active!==null||!(g.held===null||kinds.includes(g.held as string))||typeof g.holdUsed!=='boolean')return invalid;
  if(!integer(g.score)||!integer(g.lines)||!integer(g.level,1)||g.level!==1+Math.floor(g.lines/10)||!integer(g.bonuses,0,3))return invalid;
  const s=g.sequence,t=g.timers,p=g.piecePolicy;
  if(!record(s,['rng','mode','pending'])||!integer(s.rng,1,4294967295)||!['uniform','bag7'].includes(s.mode as string)||!Array.isArray(s.pending)||s.pending.length>7||Array.from(s.pending).some(k=>!kinds.includes(k)))return invalid;
  if(!record(t,['gravityRemainingMs','lockRemainingMs','grounded'])||!duration(t.gravityRemainingMs)||!(t.lockRemainingMs===null||duration(t.lockRemainingMs))||typeof t.grounded!=='boolean')return invalid;
  if(!record(p,['lockPolicy','hardDropLock'])||!['failed','interval'].includes(p.lockPolicy as string)||!['general','immediate'].includes(p.hardDropLock as string))return invalid;
  // Top-out states can retain their colliding spawn; live poses must remain traversable.
  const candidate=structuredClone(value) as AppState;
  if((g.status==='running'||g.status==='paused')&&!canTraverse(candidate.game.board,candidate.game.active!))return invalid;
  rankResults(candidate.results);return {ok:true,value:candidate};
 }catch{return invalid;}
}
export function validateCheckpoint(value:unknown,windowId:number,generation:number,revision:number):Outcome<Checkpoint>{
 if(!record(value,['checkpointVersion','windowId','generation','revision','state'])||value.checkpointVersion!==1||value.windowId!==windowId||value.generation!==generation||value.revision!==revision)return {ok:false,error:{code:'invalid-data',message:'Unsupported or inconsistent sidebar checkpoint metadata.'}};
 const state=validateState(value.state);return state.ok?{ok:true,value:{checkpointVersion:1,windowId,generation,revision,state:state.value}}:state;
}
