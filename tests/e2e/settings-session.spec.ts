/** Characterize the complete session-only increment against real origin storage and reload. */
import {expect,test} from '@playwright/test';
test('all six settings survive Restart, reload defaults and never write browser persistence or URL',async({page,context})=>{
 await context.addCookies([{name:'tetris.ghost',value:'dynamic',url:'http://127.0.0.1:4173'},{name:'unrelated',value:'keep',url:'http://127.0.0.1:4173'}]);
 await page.addInitScript(()=>{
  const writes:string[]=[];Object.defineProperty(window,'__sessionWrites',{value:writes});
  const cookie=Object.getOwnPropertyDescriptor(Document.prototype,'cookie')!;
  Object.defineProperty(Document.prototype,'cookie',{configurable:true,get:cookie.get,set(this:Document,value:string){writes.push('cookie');cookie.set!.call(this,value);}});
  for(const name of ['setItem','removeItem','clear'] as const){const original=Storage.prototype[name];Object.defineProperty(Storage.prototype,name,{configurable:true,value:function(this:Storage,...args:unknown[]){writes.push(name);return Reflect.apply(original,this,args);}});}
  for(const name of ['replaceState','pushState'] as const){const original=history[name];Object.defineProperty(history,name,{configurable:true,value:function(this:History,...args:unknown[]){writes.push(name);return Reflect.apply(original,this,args);}});}
 });
 await page.goto('/?ghost=hide&hold=false&unrelated=keep#anchor');const url=page.url();const cookies=await context.cookies();
 const values=[['Ghost','dynamic'],['Hard drop','false'],['Next preview','false'],['Hard drop lock','immediate'],['Lock policy','failed'],['Hold','false']];
 await expect(page.getByRole('combobox',{name:'Ghost',exact:true})).toHaveValue('show');await expect(page.getByRole('combobox',{name:'Hold',exact:true})).toHaveValue('true');
 await page.locator('#restart').click();for(const[label,value]of values)await page.getByRole('combobox',{name:label,exact:true}).selectOption(value);await page.locator('#restart').click();
 for(const[label,value]of values)await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);
 const writes=()=>page.evaluate(()=>(window as unknown as {__sessionWrites:string[]}).__sessionWrites);
 expect(await writes()).toEqual([]);expect(page.url()).toBe(url);expect(await context.cookies()).toEqual(cookies);
 await page.reload();for(const[label,value]of [['Ghost','show'],['Hard drop','true'],['Next preview','true'],['Hard drop lock','general'],['Lock policy','interval'],['Hold','true']])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);
 await expect(page.getByTestId('status')).toHaveText('idle');expect(await writes()).toEqual([]);expect(page.url()).toBe(url);expect(await context.cookies()).toEqual(cookies);
 expect(await page.evaluate(()=>[localStorage.length,sessionStorage.length])).toEqual([0,0]);
});
