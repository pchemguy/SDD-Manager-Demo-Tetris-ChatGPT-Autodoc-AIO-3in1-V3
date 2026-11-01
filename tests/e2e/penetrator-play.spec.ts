/** Native-keyboard four-line award/pass-through scenario using production public components. */
import { expect,test } from '@playwright/test';
test('four-line bonus can be spent to pass through a stack and lock white cells safely',async({page})=>{
  test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Authored-state public-consumer scenario is outside production build inputs.');
  await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/tests/fixtures/render.html?case=award');await page.locator('canvas').focus();
  const view=()=>page.evaluate(async()=>{const {controller}=await import('/tests/fixtures/render.ts' as string);const v=controller.view();return {game:v.state.game,ghost:v.ghost};});
  await page.keyboard.press('Space');await expect(page.getByTestId('bonus-count')).toHaveText('0');await expect(page.getByTestId('lines')).toHaveText('0');
  await page.clock.fastForward(1001);await expect(page.getByTestId('lines')).toHaveText('4');await expect(page.getByTestId('score')).toHaveText('808');await expect(page.getByTestId('bonuses')).toHaveText('⚡');expect((await view()).ghost.origin.y).toBe(12);
  await page.keyboard.press('p');await expect(page.getByTestId('bonus-count')).toHaveText('0');expect((await view()).ghost.origin.y).toBe(18);
  for(let n=0;n<16;n++)await page.keyboard.press('ArrowDown');const overlapping=await view();expect(overlapping.game.active.origin.y).toBe(14);expect(overlapping.game.board[14][4]).toBe('J');expect(overlapping.game.board[14][5]).toBe('J');
  expect(await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>[...c.getContext('2d')!.getImageData(4*30+15,14*30+15,1,1).data])).toEqual([255,255,255,255]);
  await page.keyboard.press('c');await expect(page.getByTestId('held-kind')).toHaveText('—');
  await page.keyboard.press('Space');await expect(page.getByTestId('score')).toHaveText('832');await page.clock.fastForward(1001);const locked=await view();
  for(const y of [18,19])for(const x of [4,5])expect(locked.game.board[y][x]).toBe('penetrator');expect(locked.game.board[14][4]).toBe('J');expect(locked.game.board[14][5]).toBe('J');expect(locked.game.board.flat().filter(Boolean)).toHaveLength(6);
  expect(locked.game.active.penetrator).toBe(false);await expect(page.getByTestId('hold-state')).toHaveText('Available');await expect(page.getByTestId('bonuses')).toHaveText('');
  await page.screenshot({path:test.info().outputPath('penetrator-play.png'),fullPage:true});
});
