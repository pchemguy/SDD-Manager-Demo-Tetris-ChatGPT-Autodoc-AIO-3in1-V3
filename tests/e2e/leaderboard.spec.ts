import {expect,test} from '@playwright/test';
test('completed session appears once, Restart retains it and reload clears it without saving scores',async({page})=>{
 await page.clock.install({time:new Date('2026-11-01T10:00:00Z')});await page.goto('/?hold=false#session');
 const panel=page.getByRole('region',{name:'Session top ten'});await expect(panel).toBeVisible();await expect(panel).toContainText('No completed games yet.');
 const stores=()=>page.evaluate(()=>({cookie:document.cookie,url:location.href,local:{...localStorage},session:{...sessionStorage}}));await expect(page.getByLabel('Hold',{exact:true})).toHaveValue('false');const before=await stores();
 await page.locator('#restart').click();await page.keyboard.press('ArrowDown');await page.clock.fastForward(600000);await expect(page.getByTestId('status')).toHaveText('gameover');
 await expect(panel.locator('li')).toHaveCount(1);expect(await panel.locator('[data-result-score]').textContent()).toBe(await page.getByTestId('score').textContent());
 const completed=await panel.locator('li').getAttribute('data-result-id');expect(completed).toMatch(/^[0-9a-f-]{36}$/);const stamp=await panel.locator('time').getAttribute('datetime');expect(stamp).toMatch(/^2026-11-01T.*\.\d{3}Z$/);
 await page.clock.fastForward(60000);await page.keyboard.press('ArrowDown');await expect(panel.locator('li')).toHaveCount(1);await page.locator('#restart').click();await expect(panel.locator('li')).toHaveCount(1);expect(await panel.locator('li').getAttribute('data-result-id')).toBe(completed);expect(await stores()).toEqual(before);
 await page.reload();await expect(panel).toContainText('No completed games yet.');await expect(panel.locator('li')).toHaveCount(0);expect(await stores()).toEqual(before);
});
test('authored public consumer displays tied identities and a truncated completion without rewriting timestamps',async({page},testInfo)=>{
 test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Authored initial-state consumer is source-only; actual app history/reload runs against package.');
 await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:01Z'));await page.goto('/tests/fixtures/results.html');await expect(page.locator('canvas')).toBeVisible();const panel=page.getByRole('region',{name:'Session top ten'});await expect(panel.locator('li')).toHaveCount(10);
 await page.clock.runFor(117);await expect(page.getByTestId('status')).toHaveText('gameover');
 expect(await panel.locator('li').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-result-id')))).toEqual(['high','early','A','middle-run','z','low-5','low-4','low-3','low-2','low-1']);
 await expect(panel.locator('li[data-result-id="A"] time')).toHaveAttribute('datetime','2026-11-01T00:00:00.1Z');await expect(panel.locator('li[data-result-id="z"] time')).toHaveAttribute('datetime','2026-11-01T00:00:00.100Z');
 await page.evaluate(async()=>{const {controller}=await import('/tests/fixtures/results.ts' as string);for(let n=0;n<5;n++){controller.tick();controller.action('softDrop');controller.view();}});await expect(panel.locator('li')).toHaveCount(10);await expect(panel.locator('li[data-result-id="middle-run"]')).toHaveCount(1);
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:`artifacts/phase-6/leaderboard-${testInfo.project.name}.png`,fullPage:true});
});
