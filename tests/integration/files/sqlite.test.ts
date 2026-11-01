/** Real pinned browser loader and exact matching WASM, with independently authored SQLite fixtures. */
import {beforeAll,expect,test} from 'vitest';
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';
import type {BindParams,Database,SqlJsStatic,SqlValue} from 'sql.js';
import {readFile} from 'node:fs/promises';
import {encodeSQLite,decodeSQLite} from '../../../src/files/sqlite';
import {DEFAULT_SETTINGS} from '../../../src/rules';
import type {PortableSnapshot} from '../../../src/models';
let SQL:SqlJsStatic;
beforeAll(async()=>{SQL=await initSqlJs({wasmBinary:new Uint8Array(await readFile('vendor/sqlite/sql-wasm-browser.wasm')).buffer});});
const high='CREATE TABLE high_scores (id TEXT PRIMARY KEY NOT NULL, score INTEGER NOT NULL, timestamp TEXT NOT NULL)',settingsDDL='CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)';
const snapshot:PortableSnapshot={formatVersion:1,results:[{id:'z',score:1,timestamp:'0001-01-01T00:00:00.1Z'},{id:'A',score:1,timestamp:'0001-01-01T00:00:00.100Z'}],settings:{...DEFAULT_SETTINGS,ghost:'dynamic',hardDrop:false,nextPreview:false,hardDropLock:'immediate',lockPolicy:'failed',hold:false}};
const expected={...snapshot,results:[snapshot.results[1],snapshot.results[0]]};
const settingRows=()=>Object.entries(snapshot.settings).map(([key,value])=>[key,String(value)]);
type Fixture={high?:string|null;settings?:string|null;rows?:SqlValue[][];settingRows?:SqlValue[][];before?:(db:Database)=>void;after?:(db:Database)=>void};
function fixture(options:Fixture={}):Uint8Array{
 const db=new SQL.Database();try{options.before?.(db);db.run('PRAGMA application_id=1413829714; PRAGMA user_version=1;');if(options.high!==null)db.run(options.high??high);if(options.settings!==null)db.run(options.settings??settingsDDL);
  if(options.high!==null)for(const row of options.rows??snapshot.results.map(result=>[result.id,result.score,result.timestamp]))db.run('INSERT INTO high_scores VALUES (?,?,?)',row);
  if(options.settings!==null)for(const row of options.settingRows??settingRows())db.run('INSERT INTO settings VALUES (?,?)',row);options.after?.(db);return new Uint8Array(db.export());
 }finally{db.close();}
}
function invalid(bytes:Uint8Array,code='invalid-data'){const result=decodeSQLite(bytes,SQL);expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe(code);}
test('encodes exact metadata/tables/canonical setting rows, preserves identity and excludes active gameplay',()=>{
 const input=structuredClone(snapshot),encoded=encodeSQLite(input,SQL);expect(encoded.ok).toBe(true);expect(input).toEqual(snapshot);if(!encoded.ok)return;expect(new TextDecoder().decode(encoded.value.subarray(0,16))).toBe('SQLite format 3\0');
 const db=new SQL.Database(encoded.value);try{expect(db.exec('PRAGMA user_version')[0]!.values).toEqual([[1]]);expect(db.exec('PRAGMA application_id')[0]!.values).toEqual([[1413829714]]);expect(db.exec("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name")[0]!.values).toEqual([['high_scores'],['settings']]);expect(db.exec('SELECT key,value FROM settings ORDER BY key')[0]!.values).toEqual(settingRows().sort((a,b)=>a[0]!<b[0]!?-1:1));}finally{db.close();}
 expect(decodeSQLite(encoded.value,SQL)).toEqual({ok:true,value:expected});
});
test('decodes independent unsorted fixtures without mutating bytes or rewriting timestamps',()=>{
 const bytes=fixture(),before=new Uint8Array(bytes);expect(decodeSQLite(bytes,SQL)).toEqual({ok:true,value:expected});expect(bytes).toEqual(before);
});
test('empty and maximum top-ten/safe-score snapshots round trip completely',()=>{
 for(const results of [[],Array.from({length:10},(_,i)=>({id:`r${i}`,score:Number.MAX_SAFE_INTEGER-i,timestamp:'9999-12-31T23:59:59.999Z'}))]){const value={...snapshot,results},encoded=encodeSQLite(value,SQL);expect(encoded.ok).toBe(true);if(encoded.ok)expect(decodeSQLite(encoded.value,SQL)).toEqual({ok:true,value});}
});
test('logical equivalent table declarations, WITHOUT ROWID and genuine internal bookkeeping remain valid',()=>{
 expect(decodeSQLite(fixture({high:'CREATE TABLE high_scores(id text not null primary key,score integer not null,timestamp text not null) WITHOUT ROWID'}),SQL)).toEqual({ok:true,value:expected});
 expect(decodeSQLite(fixture({after:db=>db.run('ANALYZE')}),SQL)).toEqual({ok:true,value:expected});
 expect(decodeSQLite(fixture({after:db=>db.run('CREATE TABLE obsolete(id INTEGER PRIMARY KEY AUTOINCREMENT); DROP TABLE obsolete;')}),SQL)).toEqual({ok:true,value:expected});
});
test('rejects unsupported metadata and corrupt/header/oversize input without a partial candidate',()=>{
 for(const sql of ['PRAGMA user_version=0','PRAGMA user_version=2','PRAGMA application_id=0','PRAGMA application_id=123'])invalid(fixture({after:db=>db.run(sql)}),'unsupported-format');
 invalid(new Uint8Array(),'unsupported-format');invalid(new TextEncoder().encode('not sqlite'),'unsupported-format');invalid(new TextEncoder().encode('SQLite format 3\0'));const bytes=fixture();invalid(bytes.slice(0,bytes.length-37));const corrupt=new Uint8Array(bytes);corrupt[100]=255;invalid(corrupt);invalid(new Uint8Array(4*1024*1024+1));
});
test('rejects missing/extra tables, views, triggers and every unexpected non-PK index',()=>{
 invalid(fixture({high:null}));invalid(fixture({settings:null}));
 for(const sql of ['CREATE TABLE extra(x)','CREATE VIEW extra AS SELECT id FROM high_scores','CREATE TRIGGER extra AFTER INSERT ON high_scores BEGIN DELETE FROM settings; END','CREATE INDEX extra ON high_scores(score)','CREATE UNIQUE INDEX extra ON high_scores(timestamp,id)']){
  invalid(fixture({after:db=>db.run(sql)}));
 }
});
test('rejects altered column names/types/nullability/keys/defaults and generated columns',()=>{
 for(const ddl of ['CREATE TABLE high_scores(other TEXT PRIMARY KEY NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL)','CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL,score TEXT NOT NULL,timestamp TEXT NOT NULL)','CREATE TABLE high_scores(id TEXT PRIMARY KEY,score INTEGER NOT NULL,timestamp TEXT NOT NULL)','CREATE TABLE high_scores(id TEXT NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL)','CREATE TABLE high_scores(id TEXT NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL,PRIMARY KEY(id,score))','CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL,score INTEGER NOT NULL DEFAULT 0,timestamp TEXT NOT NULL)','CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL,extra TEXT GENERATED ALWAYS AS (id) VIRTUAL)'])invalid(fixture({high:ddl,rows:[]}));
 invalid(fixture({settings:'CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)'}));
});
test('rejects case-insensitive identity keys, extra UNIQUE constraints and foreign keys',()=>{
 invalid(fixture({high:'CREATE TABLE high_scores(id TEXT COLLATE NOCASE PRIMARY KEY NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL)'}));invalid(fixture({high:'CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL UNIQUE)'}));invalid(fixture({high:'CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL REFERENCES settings(key),score INTEGER NOT NULL,timestamp TEXT NOT NULL)'}));
});
test('validates actual SQLite storage classes and safe scores instead of trusting declared affinity',()=>{
 for(const score of [-1,0.5,Number.MAX_SAFE_INTEGER+1,'not-numeric',new Uint8Array([49])])invalid(fixture({rows:[['bad',score,'2026-01-01T00:00:00Z']]}));
 invalid(fixture({rows:[[new Uint8Array([65]),1,'2026-01-01T00:00:00Z']]}));invalid(fixture({rows:[['bad',1,new Uint8Array([65])]]}));
 invalid(fixture({high:'CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL,score INTEGER,timestamp TEXT NOT NULL)',rows:[['bad',null,'2026-01-01T00:00:00Z']],after:db=>{db.run('PRAGMA writable_schema=ON');db.run("UPDATE sqlite_schema SET sql=? WHERE name='high_scores'",[high]);db.run('PRAGMA writable_schema=OFF');}}));
});
test('validates every result ID/calendar date and rejects eleven rows rather than truncating imports',()=>{
 for(const [id,timestamp]of [['bad id','2026-01-01T00:00:00Z'],['bad','1900-02-29T00:00:00Z'],['bad','2026-01-01T00:00:00+00:00']])invalid(fixture({rows:[[id!,1,timestamp!]]}));
 invalid(fixture({rows:Array.from({length:11},(_,i)=>[`r${i}`,i,'2026-01-01T00:00:00Z'])}));invalid(fixture({high:'CREATE TABLE high_scores(id TEXT NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL)',rows:[['dup',1,'2026-01-01T00:00:00Z'],['dup',2,'2026-01-01T00:00:00Z']]}));
});
test('requires exactly the six known setting keys with canonical string values and text storage',()=>{
 invalid(fixture({settingRows:settingRows().slice(1)}));invalid(fixture({settingRows:[...settingRows(),['extra','true']]}));
 for(const value of ['TRUE',' false ','1',new Uint8Array([116])])invalid(fixture({settingRows:settingRows().map(([key,old])=>[key!,key==='hold'?value:old!])}));
 invalid(fixture({settingRows:settingRows().map(([key,value])=>[key==='hold'?new Uint8Array([104]):key!,value!])}));invalid(fixture({settings:'CREATE TABLE settings(key TEXT NOT NULL,value TEXT NOT NULL)',settingRows:[...settingRows(),['hold','false']]}));
});
test('encoder rejects invalid/incomplete snapshots before producing bytes',()=>{
 for(const value of [{...snapshot,results:[snapshot.results[0],snapshot.results[0]]},{...snapshot,results:[{...snapshot.results[0],score:-1}]},{...snapshot,game:{}},{...snapshot,settings:{hold:true}}])expect(encodeSQLite(value as never,SQL).ok).toBe(false);
});
test('all owned statements/databases close on success and injected SQL read/write failures; imports issue fixed read-only queries',()=>{
 let activeDB=0,activeStatements=0,fail='',queries:string[]=[];
 class TrackedDatabase extends SQL.Database{
  closed=false;constructor(bytes?:Uint8Array){super(bytes);activeDB++;}
  override prepare(sql:string,params?:BindParams){queries.push(sql);if(fail&&sql.startsWith(fail))throw Error('Injected statement failure');const statement=super.prepare(sql,params);activeStatements++;let freed=false;const free=statement.free.bind(statement);statement.free=()=>{if(!freed){freed=true;activeStatements--;}return free();};return statement;}
  override close(){if(!this.closed){this.closed=true;activeDB--;}return super.close();}
 }
 const tracked={...SQL,Database:TrackedDatabase} as SqlJsStatic;
 expect(decodeSQLite(fixture(),tracked).ok).toBe(true);expect(activeDB).toBe(0);expect(activeStatements).toBe(0);expect(queries.every(sql=>/^\s*(?:SELECT|PRAGMA)\b/.test(sql))).toBe(true);expect(queries.some(sql=>/query_only\s*=\s*ON/i.test(sql))).toBe(true);expect(queries.some(sql=>/trusted_schema\s*=\s*OFF/i.test(sql))).toBe(true);
 queries=[];expect(encodeSQLite(snapshot,tracked).ok).toBe(true);expect(activeDB).toBe(0);expect(activeStatements).toBe(0);
 fail='SELECT id';expect(decodeSQLite(fixture(),tracked).ok).toBe(false);expect(activeDB).toBe(0);expect(activeStatements).toBe(0);queries=[];fail='INSERT';expect(encodeSQLite(snapshot,tracked).ok).toBe(false);expect(activeDB).toBe(0);expect(activeStatements).toBe(0);
});

test('integrity work cannot allocate an unbounded SQLite heap through imported CHECK expressions',()=>{
 const bytes=fixture({high:'CREATE TABLE high_scores(id TEXT PRIMARY KEY NOT NULL,score INTEGER NOT NULL,timestamp TEXT NOT NULL,CHECK(length(randomblob(83886080))>0))',before:db=>db.run('PRAGMA ignore_check_constraints=ON')});invalid(bytes);
});
test('complete stored text rejects embedded NUL suffixes and malformed UTF-8 rather than accepting a prefix',()=>{
 invalid(fixture({rows:[['good\0trailer',1,'2026-01-01T00:00:00Z']]}));invalid(fixture({rows:[['good',1,'2026-01-01T00:00:00Z\0trailer']]}));
 invalid(fixture({settingRows:settingRows().map(([key,value])=>[key!,key==='hold'?'false\0trailer':value!])}));invalid(fixture({settingRows:settingRows().map(([key,value])=>[key==='hold'?'hold\0trailer':key!,value!])}));
 invalid(fixture({after:db=>db.run("UPDATE high_scores SET id=CAST(? AS TEXT) WHERE id='z'",[new Uint8Array([193,161])])}));
});
test('valid UTF-16 SQLite database encodings preserve the same logical fields and UTC spelling',()=>{
 for(const encoding of ['UTF-16le','UTF-16be'])expect(decodeSQLite(fixture({before:db=>db.run(`PRAGMA encoding='${encoding}'`)}),SQL)).toEqual({ok:true,value:expected});
});
