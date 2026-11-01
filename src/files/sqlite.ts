/** Pinned browser SQLite initialization; application SQL conversion follows the asset gate. */
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';
import type {BindParams,Database,SqlJsStatic,SqlValue} from 'sql.js';
import type {Outcome,PortableSnapshot,RawSettings} from '../models';
import {DEFAULT_SETTINGS,resolveSettings} from '../rules';
import {validateSnapshot} from './validation';
import {MAX_FILE_BYTES,SQLITE_HEAP_BYTES} from './limits';
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

const highScoresDDL='CREATE TABLE high_scores (id TEXT PRIMARY KEY NOT NULL, score INTEGER NOT NULL, timestamp TEXT NOT NULL)';
const settingsDDL='CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)';
const header=new TextEncoder().encode('SQLite format 3\0');
const invalid=():Outcome<never>=>({ok:false,error:{code:'invalid-data',message:'This SQLite file is not one complete valid Tetris snapshot.'}});
/** All SQL is fixed application code; untrusted values/metadata names are bound parameters. */
function query(database:Database,sql:string,parameters?:BindParams):SqlValue[][]{
 const statement=database.prepare(sql);
 try{if(parameters&&!statement.bind(parameters))throw Error('Cannot bind SQLite values');const rows:SqlValue[][]=[];while(statement.step())rows.push(statement.get());return rows;}finally{statement.free();}
}
/** Validate physical logical structure without requiring a literal spelling of CREATE TABLE text. */
function checkStructure(database:Database):void{
 const catalog=query(database,'SELECT type,name,tbl_name,sql FROM main.sqlite_schema');
 const columns={high_scores:[['id','TEXT',1],['score','INTEGER',0],['timestamp','TEXT',0]],settings:[['key','TEXT',1],['value','TEXT',0]]} as const;
 const isApplication=(name:unknown):name is keyof typeof columns=>name==='high_scores'||name==='settings';
 const seen=new Set<string>(),tables=new Set<string>();
 for(const [type,name,table,definition]of catalog){
  if(typeof name!=='string'||seen.has(name)||typeof table!=='string')throw Error('Invalid schema object');seen.add(name);
  if(type==='table'){
   if(table!==name||typeof definition!=='string')throw Error('Invalid table');
   if(isApplication(name))tables.add(name);
   else if(name!=='sqlite_sequence'&&!/^sqlite_stat[0-9]+(?![\s\S])/.test(name))throw Error('Unexpected application table');
  }else if(type!=='index'||!isApplication(table)||definition!==null)throw Error('Unexpected schema object');
 }
 if(tables.size!==2||!tables.has('high_scores')||!tables.has('settings'))throw Error('Missing application tables');
 const tableList=query(database,'PRAGMA table_list'),indexes=new Set<string>();
 for(const table of ['high_scores','settings'] as const){
  const expected=columns[table],listed=tableList.filter(row=>row[0]==='main'&&row[1]===table);
  if(listed.length!==1||listed[0]![2]!=='table'||listed[0]![3]!==expected.length)throw Error('Expected regular application tables');
  const actual=query(database,table==='high_scores'?"PRAGMA main.table_xinfo('high_scores')":"PRAGMA main.table_xinfo('settings')");
  if(actual.length!==expected.length)throw Error('Unexpected columns');
  for(let i=0;i<expected.length;i++){
   const row=actual[i]!,need=expected[i]!;
   if(row[0]!==i||row[1]!==need[0]||typeof row[2]!=='string'||row[2].trim().toUpperCase()!==need[1]||row[3]!==1||row[4]!==null||row[5]!==need[2]||row[6]!==0)throw Error('Column/key structure mismatch');
  }
  if(query(database,table==='high_scores'?"PRAGMA main.foreign_key_list('high_scores')":"PRAGMA main.foreign_key_list('settings')").length)throw Error('Unexpected foreign key');
  const list=query(database,table==='high_scores'?"PRAGMA main.index_list('high_scores')":"PRAGMA main.index_list('settings')");
  if(list.length!==1)throw Error('Unexpected index set');const index=list[0]!,name=index[1],prefix=`sqlite_autoindex_${table}_`;
  if(typeof name!=='string'||!name.startsWith(prefix)||! /^[1-9][0-9]*(?![\s\S])/.test(name.slice(prefix.length))||index[2]!==1||index[3]!=='pk'||index[4]!==0)throw Error('Expected implicit primary-key index');
  const key=query(database,'SELECT seqno,cid,name,"desc",coll,"key" FROM pragma_index_xinfo(?)',[name]).filter(row=>row[5]===1);
  if(key.length!==1||key[0]![1]!==0||key[0]![2]!==expected[0][0]||typeof key[0]![4]!=='string'||String(key[0]![4]).toUpperCase()!=='BINARY')throw Error('Primary-key identity semantics mismatch');
  indexes.add(name);
 }
 for(const [type,name]of catalog)if(type==='index'&&!indexes.has(String(name)))throw Error('Unexpected implicit index');
}
/** Encode only a complete validated snapshot; every statement/connection closes on all paths. */
export function encodeSQLite(snapshot:PortableSnapshot,sql:SqlJsStatic):Outcome<Uint8Array>{
 const candidate=validateSnapshot(snapshot);if(!candidate.ok)return candidate;let database:Database|undefined;
 try{
  database=new sql.Database();query(database,'PRAGMA user_version = 1');query(database,'PRAGMA application_id = 1413829714');query(database,highScoresDDL);query(database,settingsDDL);
  for(const result of candidate.value.results)query(database,'INSERT INTO high_scores(id,score,timestamp) VALUES (?,?,?)',[result.id,result.score,result.timestamp]);
  for(const [key,value]of Object.entries(candidate.value.settings))query(database,'INSERT INTO settings(key,value) VALUES (?,?)',[key,String(value)]);
  const bytes=new Uint8Array(database.export());if(bytes.byteLength>MAX_FILE_BYTES)throw Error('Unexpected snapshot size');return {ok:true,value:bytes};
 }catch{return {ok:false,error:{code:'file-failed',message:'The SQLite snapshot could not be created; no partial file was downloaded.'}};}
 finally{try{database?.close();}catch{/* The one-operation worker also owns and releases the runtime. */}}
}
/** Read an isolated candidate; never execute its SQL text, attach a file or mutate its contents. */
export function decodeSQLite(bytes:Uint8Array,sql:SqlJsStatic):Outcome<PortableSnapshot>{
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>MAX_FILE_BYTES)return invalid();
 if(bytes.byteLength<header.length||!header.every((value,index)=>bytes[index]===value))return {ok:false,error:{code:'unsupported-format',message:'This is not a SQLite snapshot.'}};
 if(bytes.byteLength<100)return invalid();let database:Database|undefined;
 try{
  database=new sql.Database(new Uint8Array(bytes));
  const heap=query(database,`PRAGMA hard_heap_limit = ${SQLITE_HEAP_BYTES}`)[0]?.[0];if(typeof heap!=='number'||heap<=0||heap>SQLITE_HEAP_BYTES)return invalid();
  query(database,'PRAGMA query_only = ON');query(database,'PRAGMA trusted_schema = OFF');
  if(query(database,'PRAGMA user_version')[0]?.[0]!==1||query(database,'PRAGMA application_id')[0]?.[0]!==1413829714)return {ok:false,error:{code:'unsupported-format',message:'This SQLite application or snapshot version is not supported.'}};
  checkStructure(database);
  const integrity=query(database,'PRAGMA integrity_check');if(integrity.length!==1||integrity[0]?.length!==1||integrity[0]?.[0]!=='ok')return invalid();
  const rows=query(database,'SELECT id,typeof(id),score,typeof(score),timestamp,typeof(timestamp) FROM main.high_scores LIMIT 11');
  if(rows.length>10)return invalid();const results=[];
  for(const row of rows){if(row.length!==6||typeof row[0]!=='string'||row[1]!=='text'||typeof row[2]!=='number'||row[3]!=='integer'||typeof row[4]!=='string'||row[5]!=='text')return invalid();results.push({id:row[0],score:row[2],timestamp:row[4]});}
  const selected=query(database,'SELECT key,typeof(key),value,typeof(value) FROM main.settings LIMIT 7');if(selected.length!==6)return invalid();
  const raw:Record<string,string>=Object.create(null),keys=new Set<string>();
  for(const row of selected){if(row.length!==4||typeof row[0]!=='string'||row[1]!=='text'||typeof row[2]!=='string'||row[3]!=='text'||!Object.hasOwn(DEFAULT_SETTINGS,row[0])||keys.has(row[0]))return invalid();keys.add(row[0]);raw[row[0]]=row[2];}
  const settings=resolveSettings(raw as RawSettings,{});if(settings.explicit.length!==6||settings.warnings.length)return invalid();
  return validateSnapshot({formatVersion:1,results,settings:settings.settings});
 }catch{return invalid();}finally{try{database?.close();}catch{/* The one-operation worker also releases the failed runtime. */}}
}
