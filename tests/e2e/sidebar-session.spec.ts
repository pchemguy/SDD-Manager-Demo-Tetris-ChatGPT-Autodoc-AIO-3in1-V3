import {test,expect} from '@playwright/test';
test.beforeEach(async()=>{test.skip(process.env.TETRIS_PACKAGED_TEST==='1','Authored API recorder is source-only; extension bundles have separate runtime checks.');});
test('compact sidebar acknowledges commands, reopens paused and restores local settings without host configuration effects',async({page,context})=>{
 await page.setViewportSize({width:320,height:900});await page.goto('/tests/fixtures/sidebar.html?ghost=hide&host=keep');
 await expect(page.locator('#app')).toHaveAttribute('data-layout','compact');await expect(page.getByTestId('status')).toHaveText('idle');await expect(page.getByRole('region',{name:'Session top ten'})).toContainText('Closing this browser window ends the session.');
 const url=page.url();await page.locator('#restart').click();await expect(page.getByTestId('status')).toHaveText('running');await page.keyboard.press('ArrowLeft');
 await page.evaluate(async()=>{await (window as any).sidebarFixture.controller.suspend();await (window as any).sidebarFixture.controller.setSettings({ghost:'dynamic',hold:false});await (window as any).sidebarFixture.controller.flushCheckpoint();});
 const before=await page.evaluate(()=>(window as any).sidebarFixture.controller.view().state);
 await page.reload();await expect(page.getByTestId('status')).toHaveText('paused');
 const after=await page.evaluate(()=>(window as any).sidebarFixture.controller.view().state);expect(after).toEqual(before);expect(after.settings).toMatchObject({ghost:'dynamic',hold:false});expect(page.url()).toBe(url);expect(await context.cookies()).toEqual([]);
 for(const width of [320,450,600]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#app')).toHaveAttribute('data-layout','compact');}
});
test('storage failure pauses and corrupt checkpoint recovery warns while persistent settings survive',async({page})=>{
 await page.goto('/tests/fixtures/sidebar.html');await expect(page.getByTestId('status')).toHaveText('idle');
 await page.evaluate(async()=>{const c=(window as any).sidebarFixture.controller;await c.setSettings({ghost:'dynamic'});await c.flushCheckpoint();sessionStorage.setItem('fail-checkpoint','1');c.start();await c.flushCheckpoint();});
 await expect(page.getByTestId('status')).toHaveText('paused');await expect(page.locator('[role=alert]').filter({visible:true})).toContainText('acknowledged');
 await page.evaluate(()=>{sessionStorage.removeItem('fail-checkpoint');const k='session:tetris.window.7',v=JSON.parse(sessionStorage.getItem(k)!);v.checkpoint.state.game.board=[];sessionStorage.setItem(k,JSON.stringify(v));});
 await page.reload();await expect(page.getByTestId('status')).toHaveText('idle');await expect(page.locator('[role=alert]').filter({visible:true})).toContainText('discarded');expect(await page.evaluate(()=>(window as any).sidebarFixture.controller.view().state.settings.ghost)).toBe('dynamic');
});
