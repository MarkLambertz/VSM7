const { defineConfig, devices } = require('@playwright/test');

const PORT = 7799;

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: '*.spec.js',
  timeout: 20000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 820 },
  },
  webServer: {
    command: 'node serve.js',
    port: PORT,
    cwd: __dirname,
    reuseExistingServer: true,
    stdout: 'ignore',
  },
});
