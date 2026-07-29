import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderVsmStandalone } from "../src/presentation/vsmStandalone.js";
import {
  renderSteeringMasterFrame,
  steeringMasterFrameSource
} from "../src/presentation/shared/steeringMasterBridge.js";
import { resolveSteeringMasterNavigation } from "../src/presentation/shared/steeringMasterNavigation.js";

test("standalone VSM route embeds the host-mode Steering Master", () => {
  const frame = renderSteeringMasterFrame();
  const page = renderVsmStandalone({});

  assert.match(steeringMasterFrameSource, /design-previews\/steering-master\.html\?host=vsm7/);
  assert.match(steeringMasterFrameSource, /v=20260729-steering-master-nav-audit/);
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
  assert.match(app, /message\.evt === "navigate"/);
  assert.match(app, /message\.evt === "fullscreenchange"/);
  assert.match(app, /cmd: "setContext"/);
  assert.match(app, /cmd: "setModel"/);
  assert.match(app, /cmd: "skin"/);
  assert.match(app, /cmd: "select"/);
  assert.match(app, /openExportPanel\("app", null, "step", "app"\)/);
  assert.match(app, /navigateFromSteeringMaster\(message\)/);
  assert.match(app, /cmd: "select", ref: pendingStep7Selection/);
});

test("Steering Master shell uses the responsive host chrome budget", () => {
  const styles = readFileSync(new URL("../src/presentation/styles.css", import.meta.url), "utf8");
  const shellBlock = styles.match(/\.steering-master-frame-shell\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(styles, /--steering-master-chrome-height: 119px/);
  assert.match(styles, /--steering-master-chrome-height: 203px/);
  assert.match(styles, /height: calc\(100svh - var\(--steering-master-chrome-height/);
  assert.match(shellBlock, /min-height: 0/);
  assert.doesNotMatch(shellBlock, /min-height: 680px/);
});

test("Steering Master SCT links resolve to the matching Step V system", () => {
  assert.deepEqual(resolveSteeringMasterNavigation({
    evt: "navigate",
    api: 1,
    stepId: "step5",
    system: "S3*",
    sctId: "sct-10"
  }), {
    view: "step5",
    step5System: "3*",
    sctId: "sct-10"
  });
});

test("Steering Master meeting links resolve to the selected 7.6 charter", () => {
  assert.deepEqual(resolveSteeringMasterNavigation({
    evt: "navigate",
    api: 1,
    stepId: "step7",
    substep: "7.6",
    meetingId: "meeting-yearly-retro"
  }), {
    view: "step7",
    step7Substep: "7.6",
    selection: { kind: "meeting", id: "meeting-yearly-retro" }
  });
});

test("Steering Master ignores unknown navigation targets", () => {
  assert.equal(resolveSteeringMasterNavigation({
    evt: "navigate",
    api: 1,
    stepId: "step4"
  }), null);
});
