/** Actual Canvas and paused-time acceptance, separate from DOM-only indicators. */
import { expect, test, type Page } from '@playwright/test';
async function coloredCells(page:Page){return page.locator('canvas').evaluate((canvas:HTMLCanvasElement)=>{
  const context=canvas.getContext('2d')!;const result:Array<{x:number;y:number}>=[];
  for(let y=0;y<20;y++)for(let x=0;x<10;x++){const p=context.getImageData(x*30+15,y*30+15,1,1).data;if(Math.max(p[0]!,p[1]!,p[2]!)-Math.min(p[0]!,p[1]!,p[2]!)>50&&Math.max(p[0]!,p[1]!,p[2]!)>150)result.push({x,y});}return result;
});}
test('gravity, keyboard translation, inverse rotation and pause preserve the rendered board',async({page})=>{
  await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/');await page.locator('#restart').click();
  expect(await coloredCells(page)).toEqual([]);await page.clock.runFor(999);expect(await coloredCells(page)).toEqual([]);
  await page.clock.runFor(17);expect((await coloredCells(page)).length).toBeGreaterThan(0);await expect(page.getByTestId('score')).toHaveText('0');
  for(let n=0;n<5;n++)await page.keyboard.press('ArrowDown');const start=await coloredCells(page);expect(start).toHaveLength(4);
  await page.keyboard.press('ArrowLeft');expect(await coloredCells(page)).toEqual(start.map(({x,y})=>({x:x-1,y})));
  await page.keyboard.press('ArrowRight');await page.keyboard.press('x');await page.keyboard.press('z');expect(await coloredCells(page)).toEqual(start);
  await page.keyboard.press('Escape');const paused=await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.clock.fastForward(60000);
  expect(await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>c.toDataURL())).toBe(paused);
  await page.keyboard.press('Escape');expect(await coloredCells(page)).toEqual(start);await page.clock.runFor(1000);expect(await coloredCells(page)).toEqual(start.map(({x,y})=>({x,y:y+1})));
});
for(const width of [320,768,1440])test(`baseline remains legible without overflow at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/');await expect(page.getByRole('heading',{name:'Tetris',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('#restart')).toBeVisible();await expect(page.locator('#pause')).toBeVisible();
  await page.screenshot({path:test.info().outputPath(`baseline-${width}.png`),fullPage:true});
});
test('Start and resume bring the complete desktop board into view',async({page},testInfo)=>{
  await page.setViewportSize({width:1280,height:900});await page.goto('/');
  for(const button of ['#restart','#pause','#pause']){
    await page.locator(button).click();const board=(await page.locator('canvas').boundingBox())!;
    expect(board.y).toBeGreaterThanOrEqual(0);expect(board.y+board.height).toBeLessThanOrEqual(900);await expect(page.locator('canvas')).toBeFocused();
  }
  await page.screenshot({path:testInfo.outputPath('board-focused.png')});
});
