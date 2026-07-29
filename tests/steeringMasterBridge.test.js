import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderVsmStandalone } from "../src/presentation/vsmStandalone.js";
import {
  renderSteeringMasterFrame,
  steeringMasterFrameSource
} from "../src/presentation/shared/steeringMasterBridge.js";

test("standalone VSM route embeds the host-mode Steering Master", () => {
  const frame = renderSteeringMasterFrame();
  const page = renderVsmStandalone({});

  assert.match(steeringMasterFrameSource, /design-previews\/steering-master\.html\?host=vsm7/);
  assert.match(steeringMasterFrameSource, /v=20260729-brand-home-link/);
  assert.match(steeringMasterFrameSource, /vsm=\.\.%(?:2F|2f)vsm\.html/);
  assert.match(frame, /data-steering-master-frame/);
  assert.match(frame, /allow="fullscreen"/);
  assert.match(page, /class="steering-master-frame-shell"/);
  assert.doesNotMatch(page, /data-vsm-frame/);
});

test("host implements the SMASTER api:1 lifecycle", () => {
  const app = readFileSync(new URL("../src/presentation/app.js", import.meta.url), "utf8");

  assert.match(app, /getSteeringMasterViewModel\(workspace\)/);
  assert.match(app, /message\.evt === "ready"/);
  assert.match(app, /message\.evt === "select"/);
  assert.match(app, /message\.evt === "view"/);
  assert.match(app, /message\.evt === "requestExportPanel"/);
  assert.match(app, /message\.evt === "fullscreenchange"/);
  assert.match(app, /cmd: "setContext"/);
  assert.match(app, /cmd: "setModel"/);
  assert.match(app, /cmd: "skin"/);
  assert.match(app, /cmd: "select"/);
  assert.match(app, /openExportPanel\("app", null, "step", "app"\)/);
});
