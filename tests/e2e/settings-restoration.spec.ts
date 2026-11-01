/** Real HTTP-origin restoration matrix; no direct controller access or fake cookie outcomes. */
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
const variants=[['ghost','Ghost','hide'],['ghost','Ghost','dynamic'],['ghost','Ghost','show'],['hardDrop','Hard drop','true'],['hardDrop','Hard drop','false'],['nextPreview','Next preview','true'],['nextPreview','Next preview','false'],['hardDropLock','Hard drop lock','general'],['hardDropLock','Hard drop lock','immediate'],['lockPolicy','Lock policy','failed'],['lockPolicy','Lock policy','interval'],['hold','Hold','true'],['hold','Hold','false']] as const;
async function spy(page:Page){await page.addInitScript(()=>{const writes:string[]=[];Object.defineProperty(window,'__restoreWrites',{value:writes});const descriptor=Object.getOwnPropertyDescriptor(Document.prototype,'cookie')!;Object.defineProperty(Document.prototype,'cookie',{configurable:true,get:descriptor.get,set(this:Document,value:string){writes.push(value);descriptor.set!.call(this,value);}});});}
const writes=(page:Page)=>page.evaluate(()=>(window as unknown as {__restoreWrites:string[]}).__restoreWrites);
for(const[key,label,value]of variants)test(`real-origin ${key}=${value} persists explicit choice and restores an omitted URL key`,async({page,context})=>{
 await spy(page);await context.addCookies([{name:'unrelated',value:'keep',url:'http://127.0.0.1:4173'}]);const before=Date.now()/1000;
 await page.goto(`/?${key}=${value}&unrelated=a%20b#keep`);const url=page.url();await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);expect(await writes(page)).toHaveLength(1);expect(page.url()).toBe(url);
 const cookies=await context.cookies(),cookie=cookies.find(c=>c.name===`tetris.${key}`)!;expect(cookie.value).toBe(value);expect(cookie.path).toBe('/');expect(cookie.sameSite).toBe('Lax');expect(cookie.secure).toBe(false);expect(cookie.expires).toBeGreaterThanOrEqual(before+31536000-2);expect(cookie.expires).toBeLessThanOrEqual(Date.now()/1000+31536000+2);
 expect(cookies.filter(c=>c.name.startsWith('tetris.'))).toHaveLength(1);
 await page.goto('/?unrelated=a%20b#keep');await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);expect(await writes(page)).toEqual([]);expect(await context.cookies()).toEqual(cookies);
 await page.reload();await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);expect(await writes(page)).toEqual([]);expect(await context.cookies()).toEqual(cookies);await expect(page.getByRole('alert')).toBeHidden();
});
const duplicates=[['ghost','Ghost','dynamic','hide'],['hardDrop','Hard drop','false','true'],['nextPreview','Next preview','false','true'],['hardDropLock','Hard drop lock','immediate','general'],['lockPolicy','Lock policy','failed','interval'],['hold','Hold','false','true']] as const;
for(const[key,label,saved,value]of duplicates)test(`duplicate known query group ${key} falls back without rewriting its cookie`,async({page,context})=>{
 await spy(page);await context.addCookies([{name:`tetris.${key}`,value:saved,url:'http://127.0.0.1:4173'}]);const cookies=await context.cookies();await page.goto(`/?${key}=${value}&${key}=${value}&unknown=keep#anchor`);const url=page.url();await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(saved);await expect(page.getByRole('alert')).toContainText(key);expect(await writes(page)).toEqual([]);expect(await context.cookies()).toEqual(cookies);expect(page.url()).toBe(url);
});
test('mixed duplicates invalid query and corrupt cookie values fall through independently',async({page,context})=>{
 await spy(page);await context.addCookies(Object.entries({'tetris.ghost':'dynamic','tetris.hardDrop':'false','tetris.hold':'false','tetris.nextPreview':'true','tetris.lockPolicy':'%E0%A4%A','tetris.hardDropLock':'immediate',unrelated:'keep'}).map(([name,value])=>({name,value,url:'http://127.0.0.1:4173'})));
 await page.goto('/?ghost=hide&ghost=show&hardDrop=FALSE&hold=&nextPreview=false&unknown=a%20b#keep');const url=page.url();
 for(const[label,value]of [['Ghost','dynamic'],['Hard drop','false'],['Hold','false'],['Next preview','false'],['Lock policy','interval'],['Hard drop lock','immediate']])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);
 for(const key of ['ghost','hardDrop','hold'])await expect(page.getByRole('alert')).toContainText(key);
 const changed=await writes(page);expect(changed).toHaveLength(1);expect(changed[0]).toMatch(/^tetris.nextPreview=false;/);expect(Object.fromEntries((await context.cookies()).map(c=>[c.name,c.value]))).toMatchObject({'tetris.ghost':'dynamic','tetris.hardDrop':'false','tetris.hold':'false','tetris.lockPolicy':'%E0%A4%A',unrelated:'keep'});expect(page.url()).toBe(url);
});
test('configuration restoration never makes a live score or active game persistent',async({page,context})=>{
 await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/?hold=false');await expect(page.getByRole('combobox',{name:'Hold',exact:true})).toHaveValue('false');await page.locator('#restart').click();for(let n=0;n<3;n++)await page.keyboard.press('ArrowDown');await expect(page.getByTestId('score')).toHaveText('3');
 await page.reload();await expect(page.getByTestId('status')).toHaveText('idle');await expect(page.getByTestId('score')).toHaveText('0');await expect(page.getByRole('combobox',{name:'Hold',exact:true})).toHaveValue('false');expect((await context.cookies()).map(c=>c.name)).toEqual(['tetris.hold']);expect(await page.evaluate(()=>[localStorage.length,sessionStorage.length])).toEqual([0,0]);
});
