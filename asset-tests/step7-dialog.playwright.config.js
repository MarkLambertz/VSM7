const { defineConfig, devices } = require('@playwright/test');

const hosts = [
  { name: 'dialog-source', root: '.', port: 7817 },
  { name: 'dialog-production', root: 'dist', port: 7818 }
];
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'step7-dialog-scroll.spec.js',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 820 } },
  projects: hosts.map(({name,port})=>({name,use:{baseURL:`http://127.0.0.1:${port}/vsm7/`}})),
  webServer: hosts.map(({root,port})=>({
    command:`node subpath-static-server.cjs --root ${root} --mount /vsm7/ --port ${port}`,
    url:`http://127.0.0.1:${port}/vsm7/`, cwd:__dirname, reuseExistingServer:false, stdout:'ignore'
  }))
});
