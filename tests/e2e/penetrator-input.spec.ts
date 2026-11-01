/** Inventory, native P dispatch and hold prohibition through real controller/UI consumers. */
import { expect,test } from '@playwright/test';
async function freeze(page:import('@playwright/test').Page){await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));}
test('ordinary application exposes inventory/help and ignores exhausted activation',async({page})=>{
  await freeze(page);await page.goto('/');await page.locator('#restart').click();await expect(page.getByTestId('bonus-count')).toHaveText('0');await expect(page.getByTestId('bonuses')).toHaveText('');
  const before=await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.keyboard.press('p');expect(await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(before);
  await expect(page.getByText(/P activates penetrator/)).toBeVisible();await expect(page.locator('.game-actions button')).toHaveCount(2);
});
test('native P spends one displayed bonus, cannot repeat/cancel and prohibits hold while active',async({page})=>{
  test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Authored-state public-consumer fixture is excluded from production assets.');
  await freeze(page);await page.goto('/tests/fixtures/render.html?case=activation');await page.locator('canvas').focus();
  await expect(page.getByTestId('bonus-count')).toHaveText('3');await expect(page.getByTestId('bonuses')).toHaveText('⚡⚡⚡');const next=await page.getByTestId('next-kind').innerText();
  await page.keyboard.press('p');await expect(page.getByTestId('bonus-count')).toHaveText('2');await expect(page.getByTestId('bonuses')).toHaveText('⚡⚡');await expect(page.getByTestId('hold-state')).toHaveText('Unavailable (penetrator)');
  await page.keyboard.press('c');await expect(page.getByTestId('held-kind')).toHaveText('I');await expect(page.getByTestId('next-kind')).toHaveText(next);
  await page.keyboard.press('p');await expect(page.getByTestId('bonus-count')).toHaveText('2');
  const active=await page.evaluate(async()=>{const {controller}=await import('/tests/fixtures/render.ts' as string);return controller.view().state.game.active.penetrator;});expect(active).toBe(true);
  await page.screenshot({path:test.info().outputPath('penetrator-active.png'),fullPage:true});
});
