/** Isolated supported-browser acceptance through the actual Vite app path. */
import { defineConfig } from '@playwright/test';
import path from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve('.cache/ms-playwright');

export default defineConfig({
  testDir: './tests/e2e', timeout: 15_000, globalTimeout: 120_000,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, actionTimeout: 5_000 },
  webServer: { command: 'npm run dev -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 20_000 },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox', launchOptions: {
      env: process.env.TETRIS_FIREFOX_SANDBOX_WORKAROUND === '1'
        ? { ...process.env, MOZ_DISABLE_CONTENT_SANDBOX: '1' } : process.env
    } } }
  ]
});
