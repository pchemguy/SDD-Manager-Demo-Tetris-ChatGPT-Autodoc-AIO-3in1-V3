/** Pinned browser SQLite initialization; application SQL conversion follows the asset gate. */
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';
import type {Database,SqlJsStatic} from 'sql.js';
import type {Outcome} from '../models';
import wasmURL from '../../vendor/sqlite/sql-wasm-browser.wasm?url';
export type SQLiteRuntimeInfo=Readonly<{sqliteVersion:string;integrity:'ok';databaseClosed:true}>;
const unavailable=():Outcome<never>=>({ok:false,error:{code:'runtime-unavailable',message:'The local SQLite runtime could not be initialized.'}});
/** Resolve only the matching copied companion; never fall back to a CDN or host-installed SQLite. */
export async function initializeSQLite():Promise<Outcome<SqlJsStatic>>{
 try{return {ok:true,value:await initSqlJs({locateFile:filename=>{if(filename!=='sql-wasm-browser.wasm')throw Error('Unexpected SQLite runtime asset');return wasmURL;}})};}catch{return unavailable();}
}
/** Private C6/C8 readiness operation, before application snapshot consumers are enabled. */
export async function probeSQLiteRuntime():Promise<Outcome<SQLiteRuntimeInfo>>{
 let database:Database|undefined;
 try{
  const initialized=await initializeSQLite();if(!initialized.ok)return initialized;database=new initialized.value.Database();
  const version=database.exec('SELECT sqlite_version() AS version')[0]?.values[0]?.[0],integrity=database.exec('PRAGMA integrity_check')[0]?.values;
  if(typeof version!=='string'||!/^3\.\d+\.\d+$/.test(version)||integrity?.length!==1||integrity[0]?.[0]!=='ok')throw Error('SQLite readiness failed');
  database.close();database=undefined;
  return {ok:true,value:{sqliteVersion:version,integrity:'ok',databaseClosed:true}};
 }catch{return unavailable();}finally{try{database?.close();}catch{/* Worker termination releases a failed runtime too. */}}
}
