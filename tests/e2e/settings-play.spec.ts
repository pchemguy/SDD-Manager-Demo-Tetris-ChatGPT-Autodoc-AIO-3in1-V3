/** Selected settings are exercised with native keyboard play, not controller-only writes. */
import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
async function freeze(page:Page){await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));}
const pixels=(page:Page)=>page.locator('canvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());
const choose=(page:Page,label:string,value:string)=>page.getByRole('combobox',{name:label,exact:true}).selectOption(value);
test('disabled drop/hold, retained held piece and hidden preview remain coherent across restart',async({page})=>{
 await freeze(page);await page.goto('/');await page.locator('#restart').click();await page.keyboard.press('c');const held=await page.getByTestId('held-kind').innerText();
 await choose(page,'Hold','false');await choose(page,'Hard drop','false');await choose(page,'Next preview','false');await choose(page,'Ghost','hide');
 await expect(page.getByTestId('hold-state')).toHaveText('Disabled');await expect(page.getByTestId('next-kind')).toHaveText('Disabled');await expect(page.locator('#next-preview')).toBeHidden();await expect(page.getByTestId('modern-actions')).toContainText('hard drop (disabled)');
 const before=await pixels(page);await page.locator('canvas').focus();await page.keyboard.press('c');await page.keyboard.press('Space');expect(await pixels(page)).toBe(before);await expect(page.getByTestId('score')).toHaveText('0');await expect(page.getByTestId('held-kind')).toHaveText(held);
 await choose(page,'Hold','true');await expect(page.getByTestId('held-kind')).toHaveText(held);await choose(page,'Hold','false');
 await page.locator('#restart').click();for(const label of ['Hard drop','Hold','Next preview'])await expect(page.getByRole('combobox',{name:label,exact:true})).toHaveValue('false');await expect(page.getByRole('combobox',{name:'Ghost',exact:true})).toHaveValue('hide');await expect(page.getByTestId('held-kind')).toHaveText('—');await expect(page.getByTestId('hold-state')).toHaveText('Disabled');
 await choose(page,'Hold','true');await choose(page,'Next preview','true');await page.locator('canvas').focus();await page.keyboard.press('c');expect(await page.getByTestId('held-kind').innerText()).not.toBe('—');await expect(page.locator('#next-preview')).toBeVisible();
});
test('current grounding interval remains effective until next spawn then selected immediate policy applies',async({page})=>{
 await freeze(page);await page.goto('/');await page.locator('#restart').click();await choose(page,'Lock policy','failed');await choose(page,'Hard drop lock','immediate');
 await expect(page.getByTestId('lock-info')).toContainText('full interval');await expect(page.getByTestId('policy-hint')).toContainText('Pending');
 const next=await page.getByTestId('next-kind').innerText();await page.locator('canvas').focus();await page.keyboard.press('Space');await expect(page.getByTestId('next-kind')).toHaveText(next);
 await page.clock.runFor(999);await expect(page.getByTestId('next-kind')).toHaveText(next);await page.clock.runFor(17);expect(await page.getByTestId('next-kind').innerText()).not.toBe(next);await expect(page.getByTestId('policy-hint')).not.toContainText('Pending');await expect(page.getByTestId('lock-info')).toContainText('failed step / immediate hard drop');
 const second=await page.getByTestId('next-kind').innerText();await page.keyboard.press('Space');expect(await page.getByTestId('next-kind').innerText()).not.toBe(second);
});
test('dynamic/show/hide render the midline boundary for ordinary and penetrator pieces without game changes',async({page})=>{
 test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Authored midline states use the public-component fixture, excluded from release assets.');
 await freeze(page);
 for(const penetrator of [0,1])for(const floor of [10,11,12]){
  await page.goto(`/tests/fixtures/render.html?case=ghost&floor=${floor}&penetrator=${penetrator}`);
  const state=()=>page.evaluate(async()=>{const{controller}=await import('/tests/fixtures/render.ts' as string);return JSON.stringify(controller.view().state.game);});const before=await state();
  await choose(page,'Ghost','show');const shown=await pixels(page);await choose(page,'Ghost','hide');const hidden=await pixels(page);expect(shown).not.toBe(hidden);
  await choose(page,'Ghost','dynamic');expect(await pixels(page)).toBe(floor===10?hidden:shown);expect(await state()).toBe(before);
  if(penetrator){await choose(page,'Hold','false');await choose(page,'Hold','true');await page.locator('canvas').focus();await page.keyboard.press('c');await expect(page.getByTestId('hold-state')).toHaveText('Unavailable (penetrator)');expect(await state()).toBe(before);}
 }
});
