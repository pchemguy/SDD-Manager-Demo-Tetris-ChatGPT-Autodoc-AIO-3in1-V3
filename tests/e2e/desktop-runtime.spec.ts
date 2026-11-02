/** Shared desktop renderer over the production handler's HTTP test transport; no native claim. */
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.skip(process.env.TETRIS_DESKTOP_TEST!=='1','Desktop assembly acceptance uses its dedicated production-handler transport.');
test('desktop renderer retains settings and round trips both local file formats while blur pauses',async({page})=>{
 const errors:string[]=[],foreign:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173/')&&!r.url().startsWith('blob:'))foreign.push(r.url());});
 await page.goto('/?ghost=hide&hold=false');await expect(page.getByLabel('Ghost',{exact:true})).toHaveValue('hide');
 expect(await page.evaluate(()=>({node:typeof (globalThis as any).require,process:typeof (globalThis as any).process}))).toEqual({node:'undefined',process:'undefined'});
 await page.getByLabel('Ghost',{exact:true}).selectOption('dynamic');await page.reload();await expect(page.getByLabel('Ghost',{exact:true})).toHaveValue('dynamic');expect(await page.evaluate(()=>document.cookie)).toContain('tetris.ghost=dynamic');
 await page.locator('#restart').click();await page.keyboard.press('ArrowDown');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.getByTestId('status')).toHaveText('paused');
 await page.locator('#pause').click();await expect(page.getByTestId('status')).toHaveText('running');await page.keyboard.press('Escape');await expect(page.getByTestId('status')).toHaveText('paused');
 for(const format of ['json','sqlite']){
  await page.getByLabel('Save format',{exact:true}).selectOption(format);
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Save',exact:true}).click();const download=await downloading;expect(download.suggestedFilename()).toBe('tetris-save.'+format);const path=(await download.path())!,bytes=await readFile(path);expect(bytes.length).toBeGreaterThan(20);
  await page.getByLabel('Ghost',{exact:true}).selectOption('show');const chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Restore',exact:true}).click();await(await chooser).setFiles(path);await expect(page.getByLabel('Ghost',{exact:true})).toHaveValue('dynamic');await expect(page.getByRole('alert')).toBeHidden();
 }
 expect(errors).toEqual([]);expect(foreign).toEqual([]);
});
