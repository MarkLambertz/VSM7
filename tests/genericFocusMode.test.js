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
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /How to master steering challenges/);
  assert.doesNotMatch(renderGenericFocusFullscreen(workspace, "step2", 2, context), /Manageability Levers/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /add-manageability-option/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /toggle-manageability-option/);
  assert.doesNotMatch(renderGenericFocusFullscreen(workspace, "step2", 2, context), /type="radio"/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /remove-item/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /Read and edit details/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /manageability-option-editor/);
  assert.match(renderGenericFocusFullscreen(workspace, "step2", 2, context), /textarea/);
});

test("Step II focus mode renders S1 circles and a color-only variety pressure indicator", () => {
  const workspace = createSampleWorkspace();
  workspace.step2.horizontalAssessment.operativeUnitsAmount = "90";
  workspace.step2.horizontalAssessment.dissimilarity = "80";
  workspace.step2.horizontalAssessment.selfControl = "20";
  workspace.step2.verticalAssessment.environmentalOverlaps = "60";
  workspace.step2.verticalAssessment.system3Star = "70";
  workspace.step2.verticalAssessment.operationalDependencies = "80";
  workspace.step2.verticalAssessment.resourceBargain = "50";
  workspace.step2.verticalAssessment.corporateIntervention = "40";
  workspace.step2.verticalAssessment.system2 = "90";
  const html = renderGenericFocusFullscreen(workspace, "step2", 1, context);

  assert.match(html, /s1-unit-circle/);
  assert.match(html, /data-horizontal-variety-gauge/);
  assert.match(html, /--variety-pressure: 83%/);
  assert.match(html, /data-vertical-variety-gauge/);
  assert.match(html, /--vertical-variety: 46%/);
  assert.match(html, /data-variety-fit-gauge/);
  assert.match(html, /Computed pattern support/);
  assert.doesNotMatch(html, /Low|Moderate|High|Critical/);
});

test("generic focus mode renders matrix-style work tiles", () => {
  const workspace = createSampleWorkspace();

  assert.equal(getGenericFocusTileCount(workspace, "step4", context), 2);
  const step4Brief = renderGenericFocusFullscreen(workspace, "step4", 0, context);
  assert.match(step4Brief, /Can we afford decentralization\?/);
  assert.match(step4Brief, /key buying criterion/);
  assert.match(step4Brief, /relevant synergy/);
  assert.match(step4Brief, /Decentral by subsidiarity/);
  const step4Html = renderGenericFocusFullscreen(workspace, "step4", 1, {
    ...context,
    sctPriorityFilter: "A",
    sctSourceFilter: "Environment-Operation"
  });
  assert.match(step4Html, /SCT Contribution Matrix/);
  assert.match(step4Html, /data-allocation-contribution/);
  assert.match(step4Html, /Filter SCT Contribution Matrix/);
  assert.match(step4Html, /data-action="set-accountable-organization"/);
  assert.match(renderGenericFocusFullscreen(workspace, "implementation", 1, context), /Transformation Backlog/);
});

test("Step V focus mode renders the real code-native contribution mapping", () => {
  const workspace = createSampleWorkspace();
  const html = renderGenericFocusFullscreen(workspace, "step5", 1, {
    ...context,
    activeStep5System: "4"
  });

  assert.match(html, /SCT-to-VSM-System Mapping/);
  assert.match(html, /vsm-host-frame/);
  assert.match(html, /data-vsm-context="step5"/);
  assert.match(html, /S4 · Future and environment/);
  assert.match(html, /toggle-step5-assignment/);
  assert.doesNotMatch(html, /Eligible SCTs|eligible SCTs/);
});

test("Step III focus mode exposes manageability levers as SCT input signals", () => {
  const workspace = createSampleWorkspace();
  const html = renderGenericFocusFullscreen(workspace, "step3", 1, context);

  assert.ok(taskSources.includes("Manageability Lever"));
  assert.match(html, /SCT Input Signals/);
  assert.match(html, /From manageability levers/);
  assert.match(html, /Strengthen control functions/);
  assert.match(html, /Selected manageability lever/);
  assert.doesNotMatch(html, /Reduce or compress S1/);
});

test("Step III focus register exposes split and merge selection actions", () => {
  const workspace = createSampleWorkspace();
  const taskId = workspace.step3.successCriticalTasks[0].id;
  const html = renderGenericFocusFullscreen(workspace, "step3", 3, {
    ...context,
    selectedSctId: "",
    selectedSctMergeIds: [taskId]
  });

  assert.match(html, /Split selected/);
  assert.doesNotMatch(html, /data-action="split-selected-sct" disabled/);
  assert.match(html, /data-action="merge-selected-scts" disabled/);
});

test("Step III focus register applies Priority and Source filters", () => {
  const workspace = createSampleWorkspace();
  const [matchingTask, hiddenTask] = workspace.step3.successCriticalTasks;
  matchingTask.priority = "A";
  matchingTask.source = "Workshop Decision";
  hiddenTask.priority = "B";
  hiddenTask.source = "Manageability Lever";

  const html = renderGenericFocusFullscreen(workspace, "step3", 3, {
    ...context,
    sctPriorityFilter: "B",
    sctSourceFilter: "Manageability Lever"
  });

  assert.match(html, /Priority B/);
  assert.match(html, /Manageability Lever/);
  assert.match(html, /1 of 2 SCTs/);
  assert.match(html, new RegExp(hiddenTask.title));
  assert.doesNotMatch(html, new RegExp(matchingTask.title));
});
