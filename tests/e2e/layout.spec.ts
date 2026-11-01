/** R9 geometry measured through real source and extracted production entry points. */
import {expect,test} from '@playwright/test';
for(const width of [1280,1440,1920])test(`wide ${width}: five-panel order and independent board anchor`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.clock.install();await page.goto('/');
 await expect(page.getByRole('heading',{name:'Controls and help',exact:true})).toBeVisible();
 const selectors=['.leaderboard-panel','.info','.board-wrap','.settings-panel','.help-panel'];
 const geometry=await page.evaluate(selectors=>selectors.map(selector=>{const r=document.querySelector(selector)!.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y};}),selectors);
 for(let i=1;i<geometry.length;i++)expect(geometry[i]!.x).toBeGreaterThanOrEqual(geometry[i-1]!.right);
 const center=()=>page.locator('canvas').evaluate((c:HTMLCanvasElement)=>{const r=c.getBoundingClientRect();return r.x+r.width/2-window.innerWidth/2;});
 expect(Math.abs(await center())).toBeLessThanOrEqual(1);
 await page.locator('.leaderboard-panel').evaluate(e=>(e as HTMLElement).hidden=true);await page.locator('.settings-panel').evaluate(e=>(e as HTMLElement).hidden=true);await page.locator('.help-panel').evaluate(e=>(e as HTMLElement).hidden=true);
 expect(Math.abs(await center())).toBeLessThanOrEqual(1);await expect(page.locator('.info')).toBeVisible();await expect(page.locator('canvas')).toBeVisible();
 const dimensions=await page.locator('canvas').boundingBox();expect(dimensions!.height/dimensions!.width).toBeCloseTo(2,2);
});
test('device-pixel Canvas preserves logical playfield and fully populated backing store',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL:baseURL!,viewport:{width:1440,height:1000},deviceScaleFactor:2});const page=await context.newPage();
 try{await page.goto('/');await expect.poll(()=>page.locator('canvas').evaluate((c:HTMLCanvasElement)=>({width:c.width,height:c.height,dpr:devicePixelRatio}))).toEqual({width:600,height:1200,dpr:2});
 await page.locator('#restart').click();await page.keyboard.press('Escape');
 const pixels=await page.locator('canvas').evaluate((c:HTMLCanvasElement)=>{const ctx=c.getContext('2d')!,transform=ctx.getTransform();return {scale:transform.a,bottom:ctx.getImageData(c.width-2,c.height-2,1,1).data[3]};});expect(pixels.scale).toBe(2);expect(pixels.bottom).toBe(255);
 await page.screenshot({path:test.info().outputPath('wide-dpr2.png'),fullPage:true});}finally{await context.close();}
});
for(const width of [1280,1920])test(`wide ${width}: all eight real auxiliary visibility combinations`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.clock.install();await page.goto('/');
 const names=['leaderboard','settings','help'];
 for(let mask=0;mask<8;mask++){
  for(let bit=0;bit<3;bit++){const visible=Boolean(mask&(1<<bit)),button=page.getByRole('button',{name:new RegExp(`^(Show|Hide) ${names[bit]}$`)});if((await button.getAttribute('aria-expanded')==='true')!==visible)await button.click();await expect(button).toHaveAttribute('aria-expanded',String(visible));}
  const geometry=await page.evaluate(()=>{const board=document.querySelector('canvas')!.getBoundingClientRect(),info=document.querySelector('.info')!.getBoundingClientRect();return {center:board.x+board.width/2-window.innerWidth/2,infoGap:board.x-info.right,overflow:document.documentElement.scrollWidth-window.innerWidth};});
  expect(Math.abs(geometry.center),`mask${mask}`).toBeLessThanOrEqual(1);expect(geometry.infoGap).toBe(16);expect(geometry.overflow).toBeLessThanOrEqual(0);
  await expect(page.locator('.info')).toBeVisible();await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('.game-actions button')).toHaveCount(2);
  for(let bit=0;bit<3;bit++){const panel=page.locator(`#panel-${names[bit]}`);if(mask&(1<<bit))await expect(panel).toBeVisible();else await expect(panel).toBeHidden();}
  await expect(page.getByRole('button',{name:'Save',exact:true})).toHaveCount(mask&2?1:0);await expect(page.getByRole('button',{name:'Restore',exact:true})).toHaveCount(mask&2?1:0);
  if(mask===0||mask===7)await page.screenshot({path:test.info().outputPath(`wide-${width}-mask${mask}.png`),fullPage:true});
 }
});
