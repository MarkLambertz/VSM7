import test from "node:test";
import assert from "node:assert/strict";
import {
  createKeyBuyingCriterion,
  createSegmentationOption,
  createWorkspace,
  getWeakSegmentationSignals,
  taskSources,
  vsmSystems
} from "../src/domain/vsm.js";
import { renderStep3 } from "../src/presentation/steps/step3.js";

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
  const html = renderStep3(workspace, taskSources, vsmSystems);

  assert.match(html, /variant management/);
  assert.match(html, /resource bargain/);
  assert.match(html, /Task \(Mandatory\)/);
  assert.match(html, /Description \(Mandatory\)/);
  assert.match(html, /KPI\/Success Metric/);
  assert.doesNotMatch(html, /<th>System<\/th>/);
  assert.doesNotMatch(html, /<th>Explanation<\/th>/);
});
