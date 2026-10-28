const { defineConfig, devices } = require('@playwright/test');

// Exercise source and deployable build under a strict hosting subpath.
const hosts = [
  { name: 'suite-production-subpath', root: 'dist', port: 7811 },
  { name: 'suite-source-subpath', root: '.', port: 7812 }
];

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'suite-design.test.js',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 }
  },
  projects: hosts.map(({ name, port }) => ({
    name,
    use: { baseURL: `http://127.0.0.1:${port}/vsm7/` }
  })),
  webServer: hosts.map(({ root, port }) => ({
    command: `node subpath-static-server.cjs --root ${root} --mount /vsm7/ --port ${port}`,
    url: `http://127.0.0.1:${port}/vsm7/`,
    cwd: __dirname,
    reuseExistingServer: false,
    stdout: 'ignore'
  }))
});
