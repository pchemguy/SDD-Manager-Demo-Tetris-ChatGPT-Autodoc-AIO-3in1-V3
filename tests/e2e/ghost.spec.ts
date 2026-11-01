/** Ghost is a translucent outline, separate from active-piece cell centers. */
import { expect, test } from '@playwright/test';
test('ordinary ghost outlines four cells at its landing without painting cell centers',async({page})=>{
  await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/');await page.locator('#restart').click();
  const pixels=()=>page.locator('canvas').evaluate((canvas:HTMLCanvasElement)=>{
    const c=canvas.getContext('2d')!;let outlines=0,centers=0;
    const colored=(x:number,y:number)=>{const p=c.getImageData(x,y,1,1).data;return Math.max(p[0]!,p[1]!,p[2]!)-Math.min(p[0]!,p[1]!,p[2]!)>40;};
    for(let y=0;y<20;y++)for(let x=0;x<10;x++){if(colored(x*30,y*30+15))outlines++;if(colored(x*30+15,y*30+15))centers++;}return {outlines,centers};
  });
  expect(await pixels()).toEqual({outlines:4,centers:0});
  for(let n=0;n<5;n++)await page.keyboard.press('ArrowDown');expect(await pixels()).toEqual({outlines:4,centers:4});
  await page.screenshot({path:test.info().outputPath('ghost.png'),fullPage:true});
});
