import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const windowsLauncher = readFileSync(new URL("../start.bat", import.meta.url), "utf8");
const macLauncher = readFileSync(new URL("../start.command", import.meta.url), "utf8");

test("Windows launcher keeps the VSM7 server and cache contract aligned", () => {
  const windowsVersion = windowsLauncher.match(/^set "VERSION=([^"]+)"/m)?.[1];
  const macVersion = macLauncher.match(/^VERSION="([^"]+)"/m)?.[1];

  assert.equal(windowsVersion, macVersion);
  assert.match(windowsLauncher, /set "PORT=4173"/);
  assert.match(windowsLauncher, /scripts\\vsm7_file_server\.py/);
  assert.match(windowsLauncher, /api\/storage\/health/);
  assert.match(windowsLauncher, /--workspace-dir "%VSM7_WORKSPACE_DIR%"/);
});

test("Windows launcher supports standard and Anaconda Python without killing unrelated apps", () => {
  assert.match(windowsLauncher, /CONDA_PREFIX/);
  assert.match(windowsLauncher, /%USERPROFILE%\\anaconda3\\python\.exe/);
  assert.match(windowsLauncher, /where py/);
  assert.match(windowsLauncher, /where python/);
  assert.match(windowsLauncher, /where python3/);
  assert.match(windowsLauncher, /Get-NetTCPConnection/);
  assert.doesNotMatch(windowsLauncher, /Stop-Process|taskkill/i);
});
