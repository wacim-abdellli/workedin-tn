import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially to avoid auth conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
  ],
  timeout: 30_000, // 30 second test timeout
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-public',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Test projects that depend on setup - use freelancer auth
    {
      name: 'chromium-freelancer',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/freelancer.json',
      },
      dependencies: ['setup'],
    },
    // Test projects that depend on setup - use client auth
    {
      name: 'chromium-client',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/client.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // 2 minute startup timeout
  },
});
