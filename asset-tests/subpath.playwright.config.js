const { defineConfig, devices } = require('@playwright/test');

const hosts = [
  { name: 'production-subpath', root: 'dist', mount: '/vsm7/', port: 7807 },
  { name: 'production-root', root: 'dist', mount: '/', port: 7808 },
  { name: 'source-subpath', root: '.', mount: '/vsm7/', port: 7809 },
  { name: 'source-root', root: '.', mount: '/', port: 7810 }
];

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'subpath-production.spec.js',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 1000 }
  },
  projects: hosts.map(({ name, mount, port }) => ({
    name,
    use: { baseURL: `http://127.0.0.1:${port}${mount}` }
  })),
  webServer: hosts.map(({ root, mount, port }) => ({
    command: `node subpath-static-server.cjs --root ${root} --mount ${mount} --port ${port}`,
    url: `http://127.0.0.1:${port}${mount}`,
    cwd: __dirname,
    reuseExistingServer: false,
    stdout: 'ignore'
  }))
});
