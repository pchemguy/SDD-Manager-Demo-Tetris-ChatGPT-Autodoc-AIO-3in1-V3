/** Bounded provisioning probe; demonstrates browser facilities, not game acceptance. */
import path from 'node:path';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('.cache/ms-playwright');
const { chromium, firefox } = await import('@playwright/test');

for (const [name, type] of Object.entries({ chromium, firefox })) {
  let browser;
  try {
    const env = name === 'firefox' && process.env.TETRIS_FIREFOX_SANDBOX_WORKAROUND === '1'
      ? { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: '1' } : process.env;
    browser = await type.launch({ headless: true, timeout: 10_000, env });
    console.log(name, browser.version());
    for (let cycle = 0; cycle < 2; cycle++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(5_000);
      await page.setContent('<button>Draw</button><canvas width="160" height="80"></canvas><script>document.querySelector("button").onclick=()=>{const c=document.querySelector("canvas").getContext("2d");c.fillStyle="#123456";c.fillRect(0,0,160,80);c.fillStyle="#ffd100";c.font="24px sans-serif";c.fillText("Tetris",10,40);};</script>');
      await page.getByRole('button', { name: 'Draw' }).click();
      const raster = await page.locator('canvas').evaluate(c => {
        const data = c.getContext('2d').getImageData(0, 0, 160, 80).data;
        let glyphPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 200 && data[i + 1] > 150 && data[i + 2] < 80 && data[i + 3] === 255) glyphPixels++;
        }
        return { background: Array.from(data.slice(0, 4)), glyphPixels };
      });
      assert.deepEqual(raster.background, [18, 52, 86, 255]);
      assert(raster.glyphPixels > 100, `${name}: expected rendered glyph pixels`);
      await page.screenshot({ path: path.resolve(`test-results/probe-${name}-${cycle}.png`) });
      await context.close();
      console.log(name, 'cycle', cycle + 1, 'input, Canvas/font raster, screenshot and teardown passed');
    }
  } finally { if (browser) await browser.close(); }
}
