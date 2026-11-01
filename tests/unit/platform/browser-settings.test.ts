/** C7 parser is consumed through the public browser adapter with a read-only host double. */
import {expect,test} from 'vitest';
import {createBrowserPorts} from '../../../src/platform/browser';
import {resolveSettings} from '../../../src/rules';
function host(search:string,cookie:string){let writes=0;return {window:{location:{search},document:{get cookie(){return cookie;},set cookie(_v:string){writes++;}}} as unknown as Window,writes:()=>writes};}
test('known duplicate query names are invalid as a group while unrelated parameters remain untouched',async()=>{
 const search='?ghost=hide&%67host=show&hold=false&unknown=keep';const h=host(search,'tetris.ghost=dynamic; unrelated=keep');const r=await createBrowserPorts(h.window).readSettings();expect(r.ok).toBe(true);
 if(r.ok){expect(r.value.query).toEqual({ghost:'',hold:'false'});const v=resolveSettings(r.value.query,r.value.saved);expect(v.settings.ghost).toBe('dynamic');expect(v.settings.hold).toBe(false);expect(v.warnings).toHaveLength(1);}
 expect(h.window.location.search).toBe(search);expect(h.writes()).toBe(0);
});
test('cookie values decode once and corrupt or duplicate keys do not poison independent values',async()=>{
 const h=host('?nextPreview=false&Ghost=hide','tetris.ghost=%73how; tetris.hardDrop=%E0%A4%A; tetris.hold=true; tetris.hold=false; tetris.lockPolicy=failed; unknown=%E0%A4%A');const r=await createBrowserPorts(h.window).readSettings();expect(r.ok).toBe(true);
 if(r.ok){expect(r.value.query).toEqual({nextPreview:'false'});expect(r.value.saved).toEqual({ghost:'show',hardDrop:'',hold:'',lockPolicy:'failed'});const v=resolveSettings(r.value.query,r.value.saved);expect(v.settings).toMatchObject({ghost:'show',hardDrop:true,hold:true,lockPolicy:'failed',nextPreview:false});expect(v.warnings).toEqual([]);}
 expect(h.writes()).toBe(0);
});
test('parsing preserves padded values for strict validation instead of silently trimming them',async()=>{
 const h=host('?hardDrop=%20false&hold=TRUE','tetris.ghost=hide%20; tetris.hardDrop=false; tetris.nextPreview=false');const r=await createBrowserPorts(h.window).readSettings();expect(r.ok).toBe(true);
 if(r.ok){const v=resolveSettings(r.value.query,r.value.saved);expect(v.settings).toMatchObject({ghost:'show',hardDrop:false,nextPreview:false,hold:true});expect(v.warnings).toHaveLength(2);expect(v.explicit).toEqual([]);}
 expect(h.writes()).toBe(0);
});
