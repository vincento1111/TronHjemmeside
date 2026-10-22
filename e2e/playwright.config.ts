import { defineConfig } from '@playwright/test';

// Never fall back to the retired API or any production deployment.
const baseURL = process.env.TRON_API_BASE_URL ?? 'http://127.0.0.1:5077';
const target = new URL(baseURL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
  throw new Error('Integration tests create accounts and spend game currency. TRON_API_BASE_URL must use a local host.');
}

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  outputDir: '../test-results',
  use: { baseURL, extraHTTPHeaders: { Accept: 'application/json' } },
});
