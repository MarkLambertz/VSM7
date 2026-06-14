import test from "node:test";
import assert from "node:assert/strict";
import {
  createKeyBuyingCriterion,
  createSegmentationOption,
  createSuccessCriticalTask,
  createWorkspace,
  getManageabilityLeverSignals,
  getWeakSegmentationSignals,
  taskSources,
  vsmSystems
} from "../src/domain/vsm.js";
import { filterScts, renderStep3 } from "../src/presentation/steps/step3.js";

function workspaceWithFourSegmentationOptions() {
  const workspace = createWorkspace();
  workspace.step1.segmentationOptions = [
    createSegmentationOption("Current segmentation", "As-is"),
    createSegmentationOption("Regional", "Regions"),
    createSegmentationOption("Functional", "Functions"),
    createSegmentationOption("Business Models", "Business models")
  ];
  workspace.step1.selectedSegmentationOptionId = workspace.step1.segmentationOptions[0].id;

  const weakCriterion = createKeyBuyingCriterion();
  weakCriterion.name = "Variant complexity";
  const greenCriterion = createKeyBuyingCriterion();
  greenCriterion.name = "Customer proximity";
  workspace.step1.keyBuyingCriteria = [weakCriterion, greenCriterion];
  workspace.step1.evaluation.scores[weakCriterion.id] = {
    [workspace.step1.selectedSegmentationOptionId]: "3"
  };
  workspace.step1.evaluation.scores[greenCriterion.id] = {
    [workspace.step1.selectedSegmentationOptionId]: "4"
  };

  return workspace;
}

test("Step III input signals include all non-green Step I ratings under n+1 scoring", () => {
  const workspace = workspaceWithFourSegmentationOptions();
  const signals = getWeakSegmentationSignals(workspace);

  assert.equal(signals.length, 1);
  assert.equal(signals[0].label, "Variant complexity");
  assert.equal(signals[0].score, 3);
});

test("Step III renders example complexity drivers and simplified SCT register columns", () => {
  const workspace = workspaceWithFourSegmentationOptions();
  const task = createSuccessCriticalTask(1);
  task.title = "Manage variant complexity";
  task.explanation = "Define permanent steering for product and customer variants.";
  workspace.step3.successCriticalTasks = [task];
  const html = renderStep3(workspace, taskSources, vsmSystems);

  assert.match(html, /variant management/);
  assert.match(html, /resource bargain/);
  assert.match(html, /Add SCT/);
  assert.match(html, /sct-compact-table/);
  assert.match(html, /data-preserve-scroll="sct-register"/);
  assert.match(html, /Description preview/);
  assert.match(html, /SCT-001/);
  assert.match(html, /Split selected/);
  assert.match(html, /Merge selected/);
  assert.match(html, /All priorities/);
  assert.match(html, /All sources/);
  assert.match(html, /1 of 1 SCTs/);
  assert.match(html, /Select one SCT to split it, or two or more to combine them/);
  assert.match(html, /data-action="split-selected-sct" disabled/);
  assert.match(html, /open-sct-inspector/);
  assert.match(html, /sct-description-preview/);
  assert.doesNotMatch(html, />Details</);
  assert.doesNotMatch(html, /Core only/);
  assert.doesNotMatch(html, /maxlength="1000"/);

  const detailHtml = renderStep3(workspace, taskSources, vsmSystems, { selectedSctId: task.id });

  assert.match(detailHtml, /sct-inspector/);
  assert.match(detailHtml, /Task <em>Mandatory<\/em>/);
  assert.match(detailHtml, /Description <em>Mandatory<\/em>/);
  assert.match(detailHtml, /maxlength="1000"/);
  assert.match(detailHtml, /Optional details/);
  assert.match(detailHtml, /KPI \/ Success Metric/);
  assert.match(detailHtml, /Tool or Methodological Approach/);
  assert.match(detailHtml, /Split SCT/);

  const selectedHtml = renderStep3(workspace, taskSources, vsmSystems, { selectedSctMergeIds: [task.id] });

  assert.match(selectedHtml, /data-action="split-selected-sct"/);
  assert.doesNotMatch(selectedHtml, /data-action="split-selected-sct" disabled/);
  assert.match(selectedHtml, /data-action="merge-selected-scts" disabled/);
});

test("Step III filters the SCT register by priority and source without changing canonical tasks", () => {
  const workspace = createWorkspace();
  const workshopTask = createSuccessCriticalTask(1);
  workshopTask.title = "Workshop task";
  workshopTask.priority = "A";
  workshopTask.source = "Workshop Decision";
  const leverTask = createSuccessCriticalTask(2);
  leverTask.title = "Lever task";
  leverTask.priority = "B";
  leverTask.source = "Manageability Lever";
  workspace.step3.successCriticalTasks = [workshopTask, leverTask];

  const filtered = filterScts(workspace.step3.successCriticalTasks, "B", "Manageability Lever");
  const html = renderStep3(workspace, taskSources, vsmSystems, {
    sctPriorityFilter: "B",
    sctSourceFilter: "Manageability Lever"
  });

  assert.deepEqual(filtered.map((task) => task.id), [leverTask.id]);
  assert.equal(workspace.step3.successCriticalTasks.length, 2);
  assert.match(html, /1 of 2 SCTs/);
  assert.match(html, /Lever task/);
  assert.doesNotMatch(html, /Workshop task/);
  assert.match(html, /data-action="clear-sct-filters"/);

  const emptyHtml = renderStep3(workspace, taskSources, vsmSystems, {
    sctPriorityFilter: "C",
    sctSourceFilter: "Manageability Lever"
  });
  assert.match(emptyHtml, /No SCTs match the selected filters/);
});

test("Step III receives only selected Step II manageability options", () => {
  const workspace = createWorkspace();
  const [selected, unselected] = workspace.step2.options;
  selected.challenges = "Clarify the management model.";
  unselected.challenges = "Do not carry this option forward.";
  workspace.step2.selectedOptionIds = [selected.id];

  const signals = getManageabilityLeverSignals(workspace);

  assert.equal(signals.length, 1);
  assert.equal(signals[0].id, selected.id);
  assert.equal(signals[0].meta, "Selected manageability lever");
});
