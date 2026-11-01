/** Six actual settings controls remain normal form inputs and expose policy activation. */
import {expect,test} from '@playwright/test';
test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/');});
test('six labeled settings have canonical defaults, selectable choices and a next-piece policy hint',async({page})=>{
 await expect(page.getByRole('combobox')).toHaveCount(6);await expect(page.getByRole('button')).toHaveCount(2);
 for(const [label,value] of [['Ghost','show'],['Hard drop','true'],['Next preview','true'],['Hard drop lock','general'],['Lock policy','interval'],['Hold','true']])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue(value);
 await page.locator('#restart').click();
 await page.getByRole('combobox',{name:'Lock policy',exact:true}).selectOption('failed');await page.getByRole('combobox',{name:'Hard drop lock',exact:true}).selectOption('immediate');
 await expect(page.getByTestId('policy-hint')).toContainText('Pending until next piece');
 await page.locator('canvas').focus();await page.keyboard.press('c');await expect(page.getByTestId('policy-hint')).not.toContainText('Pending');
 await page.getByRole('combobox',{name:'Ghost',exact:true}).selectOption('dynamic');await page.getByRole('combobox',{name:'Ghost',exact:true}).selectOption('hide');await page.getByRole('combobox',{name:'Ghost',exact:true}).selectOption('show');
 for(const label of ['Hard drop','Next preview','Hold']){await page.getByRole('combobox',{name:label,exact:true}).selectOption('false');await page.getByRole('combobox',{name:label,exact:true}).selectOption('true');}
 await page.screenshot({path:test.info().outputPath('settings-panel.png'),fullPage:true});
});
test('keyboard focus inside an actual setting does not route game actions or pause',async({page})=>{
 await page.locator('#restart').click();const canvas=page.locator('canvas');const before=await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL());
 const ghost=page.getByRole('combobox',{name:'Ghost',exact:true});await ghost.focus();
 for(const key of ['ArrowLeft','x','z','c','p','Escape'])await page.keyboard.press(key);
 await expect(page.getByTestId('status')).toHaveText('running');await expect(page.getByTestId('held-kind')).toHaveText('—');await expect(page.getByTestId('score')).toHaveText('0');expect(await canvas.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(before);await expect(ghost).toBeFocused();
});
