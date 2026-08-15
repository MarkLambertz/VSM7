import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const windowsLauncher = readFileSync(new URL("../start.bat", import.meta.url), "utf8");
const macLauncher = readFileSync(new URL("../start.command", import.meta.url), "utf8");
const linuxLauncher = readFileSync(new URL("../start.sh", import.meta.url), "utf8");

test("starter scripts keep the VSM7 server and cache contract aligned", () => {
  const windowsVersion = windowsLauncher.match(/^set "VERSION=([^"]+)"/m)?.[1];
  const macVersion = macLauncher.match(/^VERSION="([^"]+)"/m)?.[1];
  const linuxVersion = linuxLauncher.match(/^VERSION="([^"]+)"/m)?.[1];

  assert.equal(windowsVersion, macVersion);
  assert.equal(linuxVersion, macVersion);
  assert.match(windowsLauncher, /set "PORT=4173"/);
  assert.match(windowsLauncher, /scripts\\vsm7_file_server\.py/);
  assert.match(windowsLauncher, /api\/storage\/health/);
  assert.match(windowsLauncher, /--workspace-dir "%VSM7_WORKSPACE_DIR%"/);
});

test("Linux launcher keeps the VSM7 server contract aligned for Debian", () => {
  assert.match(linuxLauncher, /^PORT=4173$/m);
  assert.match(linuxLauncher, /SERVER_SCRIPT="scripts\/vsm7_file_server\.py"/);
  assert.match(linuxLauncher, /api\/storage\/health/);
  assert.match(linuxLauncher, /--workspace-dir "\$\{WORKSPACE_DIR\}"/);
  assert.match(linuxLauncher, /xdg-open/);
  assert.match(linuxLauncher, /python3 "\$\{SERVER_SCRIPT\}"/);
  assert.doesNotMatch(linuxLauncher, /sudo apt install python3/);
  assert.doesNotMatch(linuxLauncher, /command -v python3/);
  assert.doesNotMatch(linuxLauncher, /kill\s|-9|pkill/i);
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
