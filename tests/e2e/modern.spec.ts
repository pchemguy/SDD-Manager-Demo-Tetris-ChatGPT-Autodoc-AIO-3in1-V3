/** Player-facing bag/hold/preview/drop integration through the actual packaged-capable page. */
import { expect,test } from '@playwright/test';
test('modern preview and hold work with wall movement, rotation and delayed hard drop',async({page})=>{
  await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/');await page.locator('#restart').click();
  await expect(page.locator('.game-actions button')).toHaveCount(2);
  const next=page.getByTestId('next-kind'),held=page.getByTestId('held-kind');const firstNext=await next.innerText();expect(['I','J','L','O','S','T','Z']).toContain(firstNext);await expect(held).toHaveText('—');
  await page.keyboard.press('c');const firstHeld=await held.innerText();expect(['I','J','L','O','S','T','Z']).toContain(firstHeld);const afterHold=await next.innerText();expect(afterHold).not.toBe(firstNext);await expect(page.getByTestId('hold-state')).toHaveText('Used until lock');
  await page.keyboard.press('c');await expect(held).toHaveText(firstHeld);await expect(next).toHaveText(afterHold);
  for(let n=0;n<12;n++)await page.keyboard.press('ArrowLeft');await page.keyboard.press('x');await page.keyboard.press('z');
  const scroll=await page.evaluate(()=>scrollY);await page.keyboard.press('Space');expect(await page.evaluate(()=>scrollY)).toBe(scroll);expect(Number(await page.getByTestId('score').innerText())).toBeGreaterThan(0);
  await expect(next).toHaveText(afterHold);await page.clock.runFor(999);await expect(next).toHaveText(afterHold);await page.clock.runFor(17);expect(await next.innerText()).not.toBe(afterHold);await expect(page.getByTestId('hold-state')).toHaveText('Available');
  const beforeSwap=await next.innerText();await page.keyboard.press('c');await expect(next).toHaveText(beforeSwap);await expect(page.getByTestId('hold-state')).toHaveText('Used until lock');
  await expect(page.getByText(/Space hard drop/)).toBeVisible();await page.screenshot({path:test.info().outputPath('modern.png'),fullPage:true});
});
