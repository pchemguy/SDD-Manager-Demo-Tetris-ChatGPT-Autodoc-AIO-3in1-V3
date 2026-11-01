/** Deterministic application input checks through browser-delivered events and clock. */
import { expect, test } from '@playwright/test';
test.beforeEach(async ({page})=>{await page.clock.install({time:new Date('2026-11-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-11-01T00:00:00Z'));await page.goto('/');await page.locator('#restart').click();await expect(page.locator('canvas')).toBeFocused();});
test('soft drop uses a 40ms repeat clock and clears held keys on pause and focus loss',async({page})=>{
  const score=page.getByTestId('score');
  await page.keyboard.down('ArrowDown');await expect(score).toHaveText('1');
  await page.clock.runFor(39);await expect(score).toHaveText('1');
  await page.clock.runFor(1);await expect(score).toHaveText('2');
  await page.clock.runFor(80);await expect(score).toHaveText('4');
  await page.keyboard.up('ArrowDown');await page.clock.runFor(80);await expect(score).toHaveText('4');
  await page.keyboard.down('ArrowDown');await expect(score).toHaveText('5');
  await page.keyboard.press('Escape');await expect(page.getByTestId('status')).toHaveText('paused');
  await page.clock.runFor(10000);await page.keyboard.press('Escape');await page.clock.runFor(100);await expect(score).toHaveText('5');
  await page.keyboard.up('ArrowDown');await page.keyboard.down('ArrowDown');await expect(score).toHaveText('6');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.getByTestId('status')).toHaveText('paused');
  await page.keyboard.up('ArrowDown');await page.locator('#pause').click();await page.clock.runFor(100);await expect(score).toHaveText('6');
});
test('form and editable focus retain keys; button Enter dispatches once and restores gameplay focus',async({page})=>{
  await page.evaluate(()=>{const input=document.createElement('input');input.id='probe-input';document.body.append(input);const editable=document.createElement('div');editable.id='probe-editor';editable.contentEditable='true';editable.textContent='edit';document.body.append(editable);});
  await page.locator('#probe-input').focus();await page.keyboard.press('ArrowDown');await expect(page.getByTestId('score')).toHaveText('0');
  await page.locator('#probe-editor').focus();await page.keyboard.press('ArrowDown');await expect(page.getByTestId('score')).toHaveText('0');
  await page.locator('#pause').focus();await page.keyboard.press('Enter');await expect(page.getByTestId('status')).toHaveText('paused');await expect(page.locator('canvas')).toBeFocused();
  await page.locator('#pause').focus();await page.keyboard.press('Enter');await expect(page.getByTestId('status')).toHaveText('running');await expect(page.locator('canvas')).toBeFocused();
});
test('directional delay is 150/50ms and rotations ignore repeated keydown until release',async({page})=>{
  await page.evaluate(async()=>{
    const {bindInput}=await import('/src/ui/input.ts' as string);
    const target=document.createElement('div');target.id='input-consumer';target.tabIndex=0;target.dataset.actions='[]';document.body.append(target);
    bindInput(target,(action:string)=>{target.dataset.actions=JSON.stringify([...JSON.parse(target.dataset.actions!),action]);},()=>{});target.focus();
  });
  const actions=()=>page.locator('#input-consumer').getAttribute('data-actions');
  await page.keyboard.down('ArrowLeft');expect(await actions()).toBe('["left"]');
  await page.clock.runFor(149);expect(await actions()).toBe('["left"]');
  await page.clock.runFor(1);expect(await actions()).toBe('["left","left"]');
  await page.clock.runFor(49);expect(await actions()).toBe('["left","left"]');
  await page.clock.runFor(1);expect(await actions()).toBe('["left","left","left"]');await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('x');await page.keyboard.down('x');expect(await actions()).toBe('["left","left","left","rotateCW"]');
  await page.keyboard.up('x');await page.keyboard.press('x');expect(await actions()).toBe('["left","left","left","rotateCW","rotateCW"]');
});
