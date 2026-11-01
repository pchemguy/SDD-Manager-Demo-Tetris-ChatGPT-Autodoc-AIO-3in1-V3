/** Raster/immutability checks consume public composition with a test-only authored state. */
import { expect,test } from '@playwright/test';
test('active, settled and ghost penetrators are white while all regular kinds retain distinct colors',async({page})=>{
  test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Authored-state consumer fixture is excluded from production assets.');
  await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/tests/fixtures/render.html');
  await expect(page.getByTestId('status')).toHaveText('running');
  const pixels=await page.locator('canvas').evaluate((canvas:HTMLCanvasElement)=>{
    const c=canvas.getContext('2d')!,pixel=(x:number,y:number)=>[...c.getImageData(x,y,1,1).data];
    return {active:pixel(4*30+15,5*30+15),settled:pixel(9*30+15,19*30+15),ghost:pixel(4*30,17*30+15),ordinary:Array.from({length:7},(_,x)=>pixel(x*30+15,19*30+15))};
  });
  expect(pixels.active).toEqual([255,255,255,255]);expect(pixels.settled).toEqual([255,255,255,255]);
  expect(Math.min(...pixels.ghost.slice(0,3))).toBeGreaterThan(100);expect(Math.max(...pixels.ghost.slice(0,3))-Math.min(...pixels.ghost.slice(0,3))).toBeLessThan(20);
  for(const color of pixels.ordinary)expect(color).not.toEqual([255,255,255,255]);expect(new Set(pixels.ordinary.map(c=>c.join(','))).size).toBe(7);
  await page.clock.runFor(100);
  const retained=await page.evaluate(async()=>{const {controller}=await import('/tests/fixtures/render.ts' as string);return controller.view().state.game.board[5][4];});expect(retained).toBe('J');
  await page.screenshot({path:test.info().outputPath('penetrator-render.png'),fullPage:true});
});
