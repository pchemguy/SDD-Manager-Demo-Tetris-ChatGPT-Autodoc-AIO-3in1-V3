/** Extractable actual extension runtime over labeled HTTP + native-API recorder. */
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
test.beforeEach(async({page})=>{
 test.skip(process.env.TETRIS_EXTENSION_TEST!=='1','Requires actual extension assembly transport.');
 const root=resolve(process.env.TETRIS_EXTENSION_ROOT??'dist/chromium'),background=await readFile(resolve(root,'background.js'),'utf8');
 const setup=`(()=>{const listeners=[];const storage=prefix=>({get:async key=>({[key]:JSON.parse(sessionStorage.getItem(prefix+key)??'null')??undefined}),set:async values=>{for(const [key,value]of Object.entries(values))sessionStorage.setItem(prefix+key,JSON.stringify(value));},remove:async key=>sessionStorage.removeItem(prefix+key)});const api={runtime:{id:'owned',getURL:path=>location.origin+'/'+path,onMessage:{addListener:f=>listeners.push(f)},sendMessage:message=>new Promise(resolve=>listeners[0](message,{id:'owned',url:location.href},resolve))},storage:{local:storage('local:'),session:storage('session:')},windows:{get:async id=>({id}),getCurrent:async()=>({id:7}),onRemoved:{addListener(){}}},sidePanel:{setPanelBehavior:async()=>{}},action:{onClicked:{addListener(){}}},sidebarAction:{open:async()=>{}}};Object.assign(window,{chrome:api,browser:api});})();`;
 await page.addInitScript({content:setup+'\n'+background});
});
test('actual bundled sidebar/CSP runs local JSON and SQLite files and paused reopening',async({page,context})=>{
 const remote:string[]=[],errors:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173/')&&!r.url().startsWith('blob:'))remote.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:320,height:900});await page.goto('/sidebar.html?host=keep');await expect(page.getByTestId('status')).toHaveText('idle');await expect(page.locator('#app')).toHaveAttribute('data-layout','compact');
 await page.locator('#restart').click();await page.keyboard.press('ArrowLeft');await page.getByLabel('Ghost',{exact:true}).selectOption('dynamic');
 const saved:Record<string,Buffer>={};for(const format of ['json','sqlite']){await page.getByLabel('Save format',{exact:true}).selectOption(format);const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Save',exact:true}).click();const download=await downloading;saved[format]=await readFile((await download.path())!);}
 expect(JSON.parse(saved.json.toString()).settings.ghost).toBe('dynamic');expect(saved.sqlite.subarray(0,16).toString()).toBe('SQLite format 3\0');
 await page.getByLabel('Ghost',{exact:true}).selectOption('hide');const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Restore',exact:true}).click();await(await chooser).setFiles({name:'save.sqlite',mimeType:'application/octet-stream',buffer:saved.sqlite});await expect(page.getByLabel('Ghost',{exact:true})).toHaveValue('dynamic');
 await page.reload();await expect(page.getByTestId('status')).toHaveText('paused');await expect(page.getByLabel('Ghost',{exact:true})).toHaveValue('dynamic');expect(page.url()).toContain('?host=keep');expect(await context.cookies()).toEqual([]);expect(remote).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:test.info().outputPath('extension-320.png'),fullPage:true});
});
