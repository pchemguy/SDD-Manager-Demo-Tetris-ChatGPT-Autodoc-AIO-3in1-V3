/** Actual delivered page startup with independent URL/cookie sources and unavailable persistence. */
import {expect,test} from '@playwright/test';
test('startup accepts explicit defaults, falls back per key and writes only valid explicit cookies',async({page,context})=>{
 await context.addCookies([{name:'tetris.ghost',value:'hide',url:'http://127.0.0.1:4173'},{name:'tetris.nextPreview',value:'false',url:'http://127.0.0.1:4173'},{name:'tetris.hardDrop',value:'false',url:'http://127.0.0.1:4173'},{name:'unrelated',value:'keep',url:'http://127.0.0.1:4173'}]);
 await page.addInitScript(()=>{const writes:string[]=[];Object.defineProperty(window,'__cookieWrites',{value:writes});const descriptor=Object.getOwnPropertyDescriptor(Document.prototype,'cookie')!;Object.defineProperty(Document.prototype,'cookie',{configurable:true,get:descriptor.get,set(this:Document,value:string){writes.push(value);descriptor.set!.call(this,value);}});});
 await page.goto('/?ghost=show&hold=false&hardDrop=FALSE&unknown=a%20b#keep');const url=page.url();
 for(const[label,value]of [['Ghost','show'],['Hold','false'],['Hard drop','false'],['Next preview','false']])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);
 await expect(page.getByRole('alert')).toContainText('hardDrop');expect(page.url()).toBe(url);
 const writes=await page.evaluate(()=>(window as unknown as {__cookieWrites:string[]}).__cookieWrites);expect(writes).toHaveLength(2);expect(writes.map(v=>v.split('=',1)[0]).sort()).toEqual(['tetris.ghost','tetris.hold']);
 const cookies=Object.fromEntries((await context.cookies()).map(c=>[c.name,c.value]));expect(cookies).toMatchObject({'tetris.ghost':'show','tetris.hold':'false','tetris.hardDrop':'false','tetris.nextPreview':'false',unrelated:'keep'});expect(cookies['tetris.lockPolicy']).toBeUndefined();
});
test('unavailable cookies retain valid page query settings, report failure and keep gameplay usable',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(Document.prototype,'cookie',{configurable:true,get(){throw Error('blocked read');},set(){throw Error('blocked write');}});});
 await page.goto('/?ghost=hide&hold=false');await expect(page.getByRole('combobox',{name:'Ghost',exact:true})).toHaveValue('hide');await expect(page.getByRole('combobox',{name:'Hold',exact:true})).toHaveValue('false');await expect(page.getByRole('alert')).toContainText('could not be saved');await page.locator('#restart').click();await expect(page.getByTestId('status')).toHaveText('running');await expect(page.getByRole('alert')).toBeVisible();
});
