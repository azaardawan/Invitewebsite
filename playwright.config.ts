import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const WAYL_MOCK_PORT = 3101;
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://bahja:bahja@localhost:5432/bahja_e2e_test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Environments with a preinstalled Chromium can point at it instead of downloading one.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-390', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-430', use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: [
    // Stand-in for WAYL (e2e/wayl-mock.ts); the real API is never called from tests.
    {
      command: 'pnpm exec tsx e2e/wayl-mock.ts',
      url: `http://localhost:${WAYL_MOCK_PORT}/health`,
      reuseExistingServer: false,
      env: { WAYL_MOCK_PORT: String(WAYL_MOCK_PORT) },
    },
    {
      command: `pnpm exec next start -p ${PORT}`,
      url: `http://localhost:${PORT}/robots.txt`,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: E2E_DATABASE_URL,
        E2E_DATABASE_URL,
        APP_URL: `http://localhost:${PORT}`,
        WAYL_API_KEY: 'mock-key',
        WAYL_API_BASE_URL: `http://localhost:${WAYL_MOCK_PORT}`,
        WAYL_ENV: 'test',
        // PDFs: the renderer opens this server's own print pages.
        PRINT_ORIGIN: `http://localhost:${PORT}`,
        ...(process.env.PW_CHROMIUM_PATH ? { CHROMIUM_PATH: process.env.PW_CHROMIUM_PATH } : {}),
      },
    },
  ],
});
