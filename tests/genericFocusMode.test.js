import test from "node:test";
import assert from "node:assert/strict";
import { createSampleWorkspace } from "../src/application/sampleWorkspaceFactory.js";
import {
  focusStepOrder,
  getGenericFocusTileCount,
  hasGenericFocusMode,
  renderGenericFocusFullscreen
} from "../src/presentation/steps/focusMode.js";
import { taskSources, vsmSystems } from "../src/domain/vsm.js";

const context = { taskSources, vsmSystems };

test("generic focus mode is available for later VSM steps and implementation", () => {
  assert.deepEqual(focusStepOrder, ["step2", "step3", "step4", "step5", "step6", "step7", "implementation"]);
  assert.equal(hasGenericFocusMode("step2"), true);
  assert.equal(hasGenericFocusMode("overview"), false);
});

test("generic focus mode renders explanation and work tiles", () => {
  const workspace = createSampleWorkspace();

  assert.equal(getGenericFocusTileCount(workspace, "step2", context), 3);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 0, context), /Manageability &amp; Flattening/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 1, context), /Horizontal and Vertical Variety/);
});

test("generic focus mode renders matrix-style work tiles", () => {
  const workspace = createSampleWorkspace();

  assert.equal(getGenericFocusTileCount(workspace, "step4", context), 2);
  assert.match(renderGenericFocusFullscreen(workspace, "step4", 1, context), /Central\/Decentral Accountability/);
  assert.match(renderGenericFocusFullscreen(workspace, "implementation", 1, context), /Transformation Backlog/);
});
