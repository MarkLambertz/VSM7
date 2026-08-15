import test from "node:test";
import assert from "node:assert/strict";
import {
  createKeyBuyingCriterion,
  createSegmentationOption,
  createStrategicField,
  createWorkspace
} from "../src/domain/vsm.js";
import { calculateSegmentationEvaluationTotals } from "../src/domain/segmentationEvaluation.js";
import { renderStep1 } from "../src/presentation/steps/step1.js";

test("Step I evaluation applies KBC weights while keeping Six Pack rows unweighted", () => {
  const workspace = weightedEvaluationWorkspace();
  const [optionA, optionB] = workspace.step1.segmentationOptions;
  const totals = calculateSegmentationEvaluationTotals(workspace);

  assert.deepEqual(totals[optionA.id], { unweighted: 9, weighted: 6.5 });
  assert.deepEqual(totals[optionB.id], { unweighted: 7, weighted: 3.75 });
});

test("Step I evaluation matrix displays weighted and unweighted totals", () => {
  const html = renderStep1(weightedEvaluationWorkspace(), "evaluation");

  assert.match(html, /Unweighted total<\/td>[\s\S]*?<td>9<\/td>[\s\S]*?<td>7<\/td>/);
  assert.match(html, /Weighted total <small>\(KBC weights applied\)<\/small><\/td>[\s\S]*?<td>6\.5<\/td>[\s\S]*?<td>3\.75<\/td>/);
});

function weightedEvaluationWorkspace() {
  const workspace = createWorkspace();
  const optionA = createSegmentationOption("Option A");
  const optionB = createSegmentationOption("Option B");
  const criterionA = createKeyBuyingCriterion();
  const criterionB = createKeyBuyingCriterion();
  const strategicField = createStrategicField("Market Position");

  criterionA.name = "Quality";
  criterionA.weight = "75";
  criterionB.name = "Speed";
  criterionB.weight = "25";
  strategicField.direction = "Grow in priority segments.";

  workspace.step1.segmentationOptions = [optionA, optionB];
  workspace.step1.keyBuyingCriteria = [criterionA, criterionB];
  workspace.step1.strategicFields = [strategicField];
  workspace.step1.evaluation.scores = {
    [criterionA.id]: { [optionA.id]: "4", [optionB.id]: "1" },
    [criterionB.id]: { [optionA.id]: "2", [optionB.id]: "4" },
    [strategicField.id]: { [optionA.id]: "3", [optionB.id]: "2" }
  };

  return workspace;
}
