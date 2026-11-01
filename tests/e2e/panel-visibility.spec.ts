/** Independent presentation controls never become portable or persisted game settings. */
import {expect,test} from '@playwright/test';
test('auxiliary controls precede bottom gameplay row and hide complete panels independently',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.clock.install();await page.goto('/');
 const before=await page.evaluate(()=>({url:location.href,cookies:document.cookie,local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage)}));
 const toggles=page.getByRole('group',{name:'Auxiliary panels',exact:true});await expect(toggles.getByRole('button')).toHaveCount(3);
 for(const name of ['leaderboard','settings','help']){const toggle=page.getByRole('button',{name:`Hide ${name}`,exact:true});await expect(toggle).toHaveAttribute('aria-expanded','true');await expect(toggle).toHaveAttribute('aria-controls',`panel-${name}`);}
 const placement=await page.evaluate(()=>{const info=document.querySelector('.info')!.getBoundingClientRect(),toggles=document.querySelector('.panel-toggles')!.getBoundingClientRect(),actions=document.querySelector('.game-actions')!.getBoundingClientRect();return {gap:actions.y-toggles.bottom,bottom:info.bottom-actions.bottom};});expect(placement.gap).toBeGreaterThanOrEqual(0);expect(placement.bottom).toBeLessThanOrEqual(18);
 await page.getByRole('button',{name:'Hide settings',exact:true}).click();await expect(page.locator('.settings-panel')).toBeHidden();await expect(page.getByRole('button',{name:'Save',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Restore',exact:true})).toHaveCount(0);await expect(page.getByLabel('Save format',{exact:true})).toBeHidden();
 await page.getByRole('button',{name:'Hide help',exact:true}).click();await expect(page.locator('.help-panel')).toBeHidden();await expect(page.locator('.leaderboard-panel')).toBeVisible();
 await page.getByRole('button',{name:'Show settings',exact:true}).click();await expect(page.getByRole('button',{name:'Save',exact:true})).toBeVisible();await expect(page.locator('.help-panel')).toBeHidden();
 await page.getByRole('button',{name:'Hide leaderboard',exact:true}).click();await expect(page.locator('.leaderboard-panel')).toBeHidden();await expect(page.locator('.info')).toBeVisible();await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('.game-actions button')).toHaveCount(2);
 expect(await page.evaluate(()=>({url:location.href,cookies:document.cookie,local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage)}))).toEqual(before);
});
test('hidden panel controls leave real keyboard navigation and game keys retain their owner',async({page})=>{
 await page.clock.install();await page.goto('/');await page.locator('#restart').click();await page.keyboard.press('ArrowDown');await expect(page.getByTestId('score')).toHaveText('1');
 await page.getByRole('button',{name:'Hide settings',exact:true}).click();await page.getByRole('button',{name:'Hide help',exact:true}).click();
 await expect(page.getByTestId('status')).toHaveText('running');await page.getByRole('button',{name:'Show settings',exact:true}).focus();await page.keyboard.press('ArrowDown');await expect(page.getByTestId('score')).toHaveText('1');
 for(let n=0;n<12;n++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('[hidden]')))).toBe(false);}
 await page.getByRole('button',{name:'Show settings',exact:true}).click();await expect(page.getByLabel('Ghost',{exact:true})).toBeVisible();await page.getByLabel('Ghost',{exact:true}).selectOption('hide');await page.getByRole('button',{name:'Hide settings',exact:true}).click();await page.getByRole('button',{name:'Show settings',exact:true}).click();await expect(page.getByLabel('Ghost',{exact:true})).toHaveValue('hide');
 // Tab can reach browser chrome and intentionally invoke the existing window-blur pause.
 await page.locator('#restart').click();await expect(page.getByTestId('status')).toHaveText('running');
 await page.locator('#pause').click();await expect(page.getByTestId('status')).toHaveText('paused');await expect(page.locator('canvas')).toBeFocused();await page.locator('#pause').click();await expect(page.getByTestId('status')).toHaveText('running');await expect(page.locator('canvas')).toBeFocused();
});
