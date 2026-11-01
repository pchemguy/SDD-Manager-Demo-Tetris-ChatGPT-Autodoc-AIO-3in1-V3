import {beforeEach,expect,test,vi} from 'vitest';
const loader=vi.hoisted(()=>({initialize:vi.fn()}));vi.mock('sql.js/dist/sql-wasm-browser.js',()=>({default:loader.initialize}));
import {initializeSQLite,probeSQLiteRuntime} from '../../../src/files/sqlite';
let closes=0,mode='ok';
class Database{exec(query:string){if(mode==='throw')throw Error('Runtime operation failed');return query.startsWith('SELECT')?[{columns:['version'],values:[['3.99.1']]}]:[{columns:['integrity_check'],values:[[mode==='ok'?'ok':'corrupt']]}];}close(){closes++;}}
beforeEach(()=>{closes=0;mode='ok';loader.initialize.mockReset().mockResolvedValue({Database});});
test('initialization resolves only the exact locally copied browser WASM companion',async()=>{
 const result=await initializeSQLite();expect(result.ok).toBe(true);expect(loader.initialize).toHaveBeenCalledTimes(1);const config=loader.initialize.mock.calls[0]![0];const path=config.locateFile('sql-wasm-browser.wasm');expect(path).toMatch(/sql-wasm-browser\.wasm$/);expect(path).not.toMatch(/^https?:\/\//);expect(()=>config.locateFile('unexpected.wasm')).toThrow();expect(closes).toBe(0);
});
test('initialization rejection is a typed finite failure without creating a database',async()=>{
 loader.initialize.mockRejectedValueOnce(Error('WASM unavailable'));const result=await initializeSQLite();expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('runtime-unavailable');expect(loader.initialize).toHaveBeenCalledTimes(1);expect(closes).toBe(0);
});
test('readiness verifies SQLite/integrity and closes the actual owned connection before reporting readiness',async()=>{
 expect(await probeSQLiteRuntime()).toEqual({ok:true,value:{sqliteVersion:'3.99.1',integrity:'ok',databaseClosed:true}});expect(closes).toBe(1);
});
test('query and integrity failures close their connection and never report readiness',async()=>{
 for(const failure of ['throw','corrupt']){mode=failure;const result=await probeSQLiteRuntime();expect(result.ok).toBe(false);if(!result.ok)expect(result.error.code).toBe('runtime-unavailable');}expect(closes).toBe(2);
});
