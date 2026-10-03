import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: 0,
  use: { channel: process.platform === 'win32' ? 'msedge' : undefined, baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5173', viewport: { width: 390, height: 844 }, screenshot: 'only-on-failure' },
  reporter: 'list',
})
