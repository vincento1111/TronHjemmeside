import { defineConfig } from '@playwright/test';

const baseURL = process.env['TRON_UI_BASE_URL'] ?? 'http://127.0.0.1:5078';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname)) {
  throw new Error('UI tests are restricted to a local test server.');
}
export default defineConfig({
  testDir: '.', testMatch: '**/*.spec.ts', timeout: 45_000, workers: 1,
  use: {
    baseURL, viewport: { width: 1440, height: 1000 },
    channel: process.env['TRON_BROWSER_CHANNEL'] || (process.platform === 'win32' ? 'msedge' : undefined),
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
});
